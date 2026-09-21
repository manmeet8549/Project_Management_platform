/**
 * Client-Side Task Mutation Queue & Sequential Background Sync
 *
 * Implements a local-first FIFO queue for task modifications (status moves,
 * edits, creations, deletions) that immediately persists to localStorage and
 * synchronizes with the database one-by-one in the background without UI stutter.
 */

import { clientCache } from './clientCache';

export type MutationType = 'MOVE_STATUS' | 'UPDATE_TASK' | 'CREATE_TASK' | 'DELETE_TASK';

export interface TaskMutation {
  id: string;
  projectId: string;
  taskId: string;
  tempId?: string;
  type: MutationType;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

type StatusListener = (status: SyncStatus, pendingCount: number) => void;

class TaskMutationQueue {
  private isProcessing = false;
  private statusListeners = new Set<StatusListener>();
  private currentStatus: SyncStatus = 'synced';

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.processQueue();
      });
    }
  }

  private getQueueKey(): string {
    let userPrefix = 'anonymous';
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.id) userPrefix = parsed.id;
        }
      } catch {}
    }
    return `pm_task_mutation_queue_${userPrefix}`;
  }

  /**
   * Retrieves current pending mutations from localStorage
   */
  getQueue(): TaskMutation[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.getQueueKey());
      if (!raw) return [];
      const queue = JSON.parse(raw);
      return Array.isArray(queue) ? queue : [];
    } catch (err) {
      console.warn('Failed to read task mutation queue:', err);
      return [];
    }
  }

  private saveQueue(queue: TaskMutation[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.getQueueKey(), JSON.stringify(queue));
      this.notifyListeners();
    } catch (err) {
      console.warn('Failed to save task mutation queue:', err);
    }
  }

  private notifyListeners(): void {
    const queue = this.getQueue();
    const count = queue.length;
    const status = (typeof navigator !== 'undefined' && !navigator.onLine) ? 'offline' : count > 0 ? (this.isProcessing ? 'syncing' : 'synced') : 'synced';
    this.currentStatus = status;
    this.statusListeners.forEach(listener => {
      try {
        listener(status, count);
      } catch (err) {
        console.error('Error in status listener:', err);
      }
    });
  }

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.currentStatus, this.getQueue().length);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  /**
   * Checks if there are any pending mutations in the queue for a given task ID
   */
  hasPendingMutation(taskId: string): boolean {
    const queue = this.getQueue();
    return queue.some(m => m.taskId === taskId || (m.tempId && m.tempId === taskId));
  }

  /**
   * Adds a mutation to the FIFO queue and starts background processing
   */
  enqueue(item: {
    projectId: string;
    taskId: string;
    tempId?: string;
    type: MutationType;
    payload: Record<string, unknown>;
  }): TaskMutation {
    const queue = this.getQueue();
    const mutation: TaskMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      projectId: item.projectId,
      taskId: item.taskId,
      tempId: item.tempId,
      type: item.type,
      payload: item.payload,
      timestamp: Date.now(),
      retryCount: 0,
    };

    queue.push(mutation);
    this.saveQueue(queue);

    // Trigger sequential processing asynchronously
    setTimeout(() => {
      this.processQueue();
    }, 0);

    return mutation;
  }

  /**
   * Sequential background worker that processes mutations one-by-one (FIFO)
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (typeof window === 'undefined') return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.notifyListeners();
      return;
    }

    this.isProcessing = true;
    this.notifyListeners();

    try {
      while (true) {
        const queue = this.getQueue();
        if (queue.length === 0) break;

        const current = queue[0];
        const success = await this.executeMutation(current);

        if (success) {
          // Remove processed mutation from front of queue
          const freshQueue = this.getQueue();
          if (freshQueue.length > 0 && freshQueue[0].id === current.id) {
            freshQueue.shift();
            this.saveQueue(freshQueue);
          }
        } else {
          // Mutation failed
          current.retryCount += 1;
          if (current.retryCount >= 5) {
            console.error(`Task mutation ${current.id} exceeded maximum retries, dropping from queue:`, current);
            const freshQueue = this.getQueue();
            if (freshQueue.length > 0 && freshQueue[0].id === current.id) {
              freshQueue.shift();
              this.saveQueue(freshQueue);
            }
          } else {
            // Update retry count and back off
            const freshQueue = this.getQueue();
            if (freshQueue.length > 0 && freshQueue[0].id === current.id) {
              freshQueue[0].retryCount = current.retryCount;
              this.saveQueue(freshQueue);
            }
            // Wait before next retry
            const backoffMs = Math.min(1000 * Math.pow(2, current.retryCount), 10000);
            await new Promise(r => setTimeout(r, backoffMs));
          }
          break; // Pause loop to retry later
        }
      }
    } catch (err) {
      console.error('Unexpected error processing task mutation queue:', err);
    } finally {
      this.isProcessing = false;
      this.notifyListeners();
    }
  }

  private async executeMutation(mutation: TaskMutation): Promise<boolean> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      switch (mutation.type) {
        case 'MOVE_STATUS': {
          const res = await fetch(`/api/v1/tasks/${mutation.taskId}/status`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ status: mutation.payload.status }),
          });
          if (res.status === 404) return true; // Already deleted or not in DB
          return res.ok;
        }

        case 'UPDATE_TASK': {
          const res = await fetch(`/api/v1/tasks/${mutation.taskId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(mutation.payload),
          });
          if (res.status === 404) return true;
          return res.ok;
        }

        case 'CREATE_TASK': {
          const res = await fetch('/api/v1/tasks', {
            method: 'POST',
            headers,
            body: JSON.stringify(mutation.payload),
          });
          if (!res.ok) return false;

          const resData = await res.json();
          if (resData.success && resData.data?.id && mutation.tempId) {
            const realId = resData.data.id;
            // Update client cache to replace tempId with realId
            clientCache.replaceTaskIdInCache(mutation.projectId, mutation.tempId, realId);

            // Update any remaining mutations in queue referencing this tempId
            const currentQueue = this.getQueue();
            let updatedQueue = false;
            currentQueue.forEach(m => {
              if (m.taskId === mutation.tempId) {
                m.taskId = realId;
                updatedQueue = true;
              }
            });
            if (updatedQueue) {
              this.saveQueue(currentQueue);
            }
          }
          return true;
        }

        case 'DELETE_TASK': {
          const res = await fetch(`/api/v1/tasks/${mutation.taskId}`, {
            method: 'DELETE',
            headers,
          });
          if (res.status === 404 || res.status === 204 || res.ok) return true;
          return false;
        }

        default:
          return true;
      }
    } catch (err) {
      console.warn(`Network error executing mutation ${mutation.id}:`, err);
      return false;
    }
  }

  /**
   * Overlays any un-synced pending mutations onto a list of tasks for a given project.
   * Ensures the UI displays the user's latest offline/in-flight local edits.
   */
  applyPendingMutations<T extends { id: string; status?: string; title?: string; priority?: string; description?: string | null; dueDate?: string | null }>(
    tasks: T[],
    projectId: string
  ): T[] {
    const queue = this.getQueue().filter(m => !projectId || m.projectId === projectId);
    if (queue.length === 0) return tasks;

    let result = [...tasks];

    for (const mutation of queue) {
      if (mutation.type === 'MOVE_STATUS') {
        const mappedStatus = mutation.payload.status as string;
        result = result.map(t => (t.id === mutation.taskId ? { ...t, status: mappedStatus } : t));
      } else if (mutation.type === 'UPDATE_TASK') {
        result = result.map(t => (t.id === mutation.taskId ? { ...t, ...mutation.payload } : t));
      } else if (mutation.type === 'DELETE_TASK') {
        result = result.filter(t => t.id !== mutation.taskId);
      }
      // CREATE_TASK: temp items are already added to client cache
    }

    return result;
  }
}

export const taskMutationQueue = new TaskMutationQueue();

/**
 * Deep equality check between two task arrays to determine if the page needs to re-render.
 * Returns true if both lists have identical tasks (same IDs, titles, statuses, priorities, dueDates, descriptions).
 */
export function areTaskListsEqual(
  listA: Array<{ id: string; title: string; status?: string; priority?: string; dueDate?: string | null; description?: string | null }>,
  listB: Array<{ id: string; title: string; status?: string; priority?: string; dueDate?: string | null; description?: string | null }>
): boolean {
  if (listA === listB) return true;
  if (!listA || !listB) return false;
  if (listA.length !== listB.length) return false;

  const mapB = new Map(listB.map(t => [t.id, t]));

  for (const a of listA) {
    const b = mapB.get(a.id);
    if (!b) return false;
    if (a.title !== b.title) return false;
    if (a.status !== b.status) return false;
    if (a.priority !== b.priority) return false;
    if (a.dueDate !== b.dueDate) return false;
    if ((a.description || '') !== (b.description || '')) return false;
  }

  return true;
}

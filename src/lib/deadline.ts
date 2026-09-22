/**
 * Utility for analyzing project and task deadlines dynamically against the current local date.
 */

export interface DeadlineAnalysis {
  hasDueDate: boolean;
  daysDiff: number | null; // >0: days left, 0: due today, <0: overdue
  formattedDate: string;   // e.g. "Oct 15, 2026" or "No Due Date"
  remainingText: string;   // e.g. "14 days remaining", "Due today", "Overdue by 2 days", "No deadline set"
  badgeText: string;       // e.g. "14d left", "Due today", "Overdue 2d", "No deadline"
  status: 'upcoming' | 'due-today' | 'overdue' | 'none';
  textColor: string;       // Tailwind text color
  bgColor: string;         // Tailwind bg badge color
  borderColor: string;     // Tailwind border color
}

/**
 * Parses any date format (YYYY-MM-DD, ISO string, etc.) into year, month, day in local context
 */
function parseDateString(rawDate: string): Date | null {
  if (!rawDate || rawDate === 'No Due Date' || rawDate.trim() === '') {
    return null;
  }

  // Handle YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
  const ymdMatch = rawDate.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    return new Date(year, month, day, 0, 0, 0, 0);
  }

  // Fallback to standard parse
  const parsed = new Date(rawDate);
  if (isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
}

/**
 * Analyzes deadline date against current date
 */
export function analyzeDeadline(rawDueDate: string | null | undefined): DeadlineAnalysis {
  if (!rawDueDate) {
    return {
      hasDueDate: false,
      daysDiff: null,
      formattedDate: 'No Due Date',
      remainingText: 'No deadline set',
      badgeText: 'No deadline',
      status: 'none',
      textColor: 'text-zinc-500',
      bgColor: 'bg-zinc-100',
      borderColor: 'border-zinc-300',
    };
  }

  const targetDate = parseDateString(rawDueDate);
  if (!targetDate) {
    return {
      hasDueDate: false,
      daysDiff: null,
      formattedDate: rawDueDate,
      remainingText: 'No deadline set',
      badgeText: 'No deadline',
      status: 'none',
      textColor: 'text-zinc-500',
      bgColor: 'bg-zinc-100',
      borderColor: 'border-zinc-300',
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  // Difference in calendar days
  const diffMs = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Format date readable (e.g. "Oct 15, 2026")
  const formattedDate = targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (diffDays > 1) {
    return {
      hasDueDate: true,
      daysDiff: diffDays,
      formattedDate,
      remainingText: `${diffDays} days remaining`,
      badgeText: `${diffDays} days left`,
      status: 'upcoming',
      textColor: diffDays <= 3 ? 'text-[#D97706]' : 'text-[#16A34A]',
      bgColor: diffDays <= 3 ? 'bg-[#FEF3C7]' : 'bg-[#DCFCE7]',
      borderColor: diffDays <= 3 ? 'border-[#F59E0B]' : 'border-[#22C55E]',
    };
  }

  if (diffDays === 1) {
    return {
      hasDueDate: true,
      daysDiff: 1,
      formattedDate,
      remainingText: '1 day remaining (Tomorrow)',
      badgeText: 'Due tomorrow',
      status: 'upcoming',
      textColor: 'text-[#D97706]',
      bgColor: 'bg-[#FEF3C7]',
      borderColor: 'border-[#F59E0B]',
    };
  }

  if (diffDays === 0) {
    return {
      hasDueDate: true,
      daysDiff: 0,
      formattedDate,
      remainingText: 'Due today',
      badgeText: 'Due today',
      status: 'due-today',
      textColor: 'text-[#B91C1C]',
      bgColor: 'bg-[#FFEAEA]',
      borderColor: 'border-[#EF4444]',
    };
  }

  // Overdue
  const overdueDays = Math.abs(diffDays);
  return {
    hasDueDate: true,
    daysDiff: diffDays,
    formattedDate,
    remainingText: overdueDays === 1 ? 'Overdue by 1 day' : `Overdue by ${overdueDays} days`,
    badgeText: overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`,
    status: 'overdue',
    textColor: 'text-[#B91C1C]',
    bgColor: 'bg-[#FFEAEA]',
    borderColor: 'border-[#B91C1C]',
  };
}

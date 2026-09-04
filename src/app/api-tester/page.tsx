'use client';

import React, { useState } from 'react';
import { 
  Play,
  XCircle, 
  RefreshCw, 
  Copy, 
  Check, 
  Server, 
  Code2, 
  Send,
  Zap,
  ShieldCheck,
  FolderKanban,
  CheckSquare,
  Users
} from 'lucide-react';

interface EndpointPreset {
  id: string;
  name: string;
  category: 'Users' | 'Projects' | 'Tasks';
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  body?: string;
  headers?: Record<string, string>;
}

const createPresets = (): EndpointPreset[] => [
  // User endpoints
  {
    id: 'get-users',
    name: 'List All Users',
    category: 'Users',
    method: 'GET',
    path: '/api/v1/users',
    description: 'Fetch list of registered users from Supabase',
  },
  {
    id: 'register-user',
    name: 'Register User',
    category: 'Users',
    method: 'POST',
    path: '/api/v1/users/register',
    description: 'Create a new user account with hashed password in Supabase',
    body: JSON.stringify({
      name: 'Developer Tester',
      email: `tester.${Math.floor(Math.random() * 10000)}@example.com`,
      password: 'Password123!',
      role: 'MEMBER',
    }, null, 2),
  },
  {
    id: 'login-user',
    name: 'User Login',
    category: 'Users',
    method: 'POST',
    path: '/api/v1/users/login',
    description: 'Authenticate user and issue JWT token',
    body: JSON.stringify({
      email: 'manmeet@example.com',
      password: 'Password123!',
    }, null, 2),
  },
  {
    id: 'get-user-by-id',
    name: 'Get User Profile',
    category: 'Users',
    method: 'GET',
    path: '/api/v1/users/usr-1',
    description: 'Fetch user profile details by ID',
  },

  // Project endpoints
  {
    id: 'get-projects',
    name: 'List Projects',
    category: 'Projects',
    method: 'GET',
    path: '/api/v1/projects',
    description: 'Retrieve projects with filter metrics from Supabase',
  },
  {
    id: 'create-project',
    name: 'Create Project',
    category: 'Projects',
    method: 'POST',
    path: '/api/v1/projects',
    description: 'Create new project workspace in Supabase',
    body: JSON.stringify({
      title: 'Realtime Microservice Architecture',
      description: 'High-throughput event driven backend setup',
      category: 'Backend Architecture',
      status: 'in-progress',
      dueDate: '2026-12-15',
    }, null, 2),
  },
  {
    id: 'get-project-by-id',
    name: 'Get Project Detail',
    category: 'Projects',
    method: 'GET',
    path: '/api/v1/projects/proj-1',
    description: 'Fetch single project and task statistics breakdown',
  },

  // Task endpoints
  {
    id: 'get-tasks',
    name: 'List Tasks',
    category: 'Tasks',
    method: 'GET',
    path: '/api/v1/tasks',
    description: 'Retrieve tasks from Supabase',
  },
  {
    id: 'create-task',
    name: 'Create Task',
    category: 'Tasks',
    method: 'POST',
    path: '/api/v1/tasks',
    description: 'Create new task inside project in Supabase',
    body: JSON.stringify({
      title: 'Write Comprehensive Integration Tests',
      description: 'Test all Zod validation schemas and endpoints',
      status: 'todo',
      priority: 'high',
      projectId: 'proj-1',
      assigneeId: 'usr-1',
      dueDate: '2026-09-30',
    }, null, 2),
  },
  {
    id: 'update-task-status',
    name: 'Update Task Status',
    category: 'Tasks',
    method: 'PATCH',
    path: '/api/v1/tasks/tsk-2/status',
    description: 'Dedicated status management (todo -> in-progress -> done)',
    body: JSON.stringify({
      status: 'done',
    }, null, 2),
  },
  {
    id: 'delete-task',
    name: 'Delete Task',
    category: 'Tasks',
    method: 'DELETE',
    path: '/api/v1/tasks/tsk-3',
    description: 'Remove task by ID',
  },
];

const PRESET_ENDPOINTS = createPresets();

interface TestResult {
  endpointId: string;
  status: number | null;
  statusText: string;
  responseTime: number;
  data: unknown;
  error?: string;
  timestamp: string;
}

export default function ApiTesterPage() {
  const [selectedPreset, setSelectedPreset] = useState<EndpointPreset>(PRESET_ENDPOINTS[0]);
  const [method, setMethod] = useState<'GET' | 'POST' | 'PATCH' | 'DELETE'>(PRESET_ENDPOINTS[0].method);
  const [path, setPath] = useState<string>(PRESET_ENDPOINTS[0].path);
  const [requestBody, setRequestBody] = useState<string>(PRESET_ENDPOINTS[0].body || '');
  const [authHeader, setAuthHeader] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [responseResult, setResponseResult] = useState<TestResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  
  // Health Check Suite
  const [healthCheckRunning, setHealthCheckRunning] = useState<boolean>(false);
  const [suiteResults, setSuiteResults] = useState<Record<string, { status: number; ok: boolean; time: number }>>({});

  const selectPreset = (preset: EndpointPreset) => {
    setSelectedPreset(preset);
    setMethod(preset.method);
    setPath(preset.path);
    if (preset.id === 'register-user') {
      setRequestBody(JSON.stringify({
        name: 'Developer Tester',
        email: `tester.${Math.floor(Math.random() * 100000)}@example.com`,
        password: 'Password123!',
        role: 'MEMBER',
      }, null, 2));
    } else {
      setRequestBody(preset.body || '');
    }
  };

  const handleSendRequest = async () => {
    setLoading(true);
    const startTime = performance.now();
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authHeader.trim()) {
        headers['Authorization'] = authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`;
      }

      const options: RequestInit = {
        method,
        headers,
      };

      if (['POST', 'PATCH', 'PUT'].includes(method) && requestBody.trim()) {
        options.body = requestBody;
      }

      const res = await fetch(path, options);
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      let responseData: unknown;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
      }

      setResponseResult({
        endpointId: selectedPreset.id,
        status: res.status,
        statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
        responseTime: duration,
        data: responseData,
        timestamp: new Date().toLocaleTimeString(),
      });
    } catch (err: unknown) {
      const endTime = performance.now();
      const message = err instanceof Error ? err.message : 'Failed to fetch API route';
      setResponseResult({
        endpointId: selectedPreset.id,
        status: null,
        statusText: 'Network / Connection Error',
        responseTime: Math.round(endTime - startTime),
        data: null,
        error: message,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const runAllHealthChecks = async () => {
    setHealthCheckRunning(true);
    const results: Record<string, { status: number; ok: boolean; time: number }> = {};

    for (const preset of PRESET_ENDPOINTS) {
      const startTime = performance.now();
      try {
        const options: RequestInit = {
          method: preset.method,
          headers: { 'Content-Type': 'application/json' },
        };
        let bodyToSend = preset.body;
        if (preset.id === 'register-user') {
          bodyToSend = JSON.stringify({
            name: 'Developer Tester',
            email: `tester.${Math.floor(Math.random() * 100000)}@example.com`,
            password: 'Password123!',
            role: 'MEMBER',
          }, null, 2);
        }
        if (['POST', 'PATCH'].includes(preset.method) && bodyToSend) {
          options.body = bodyToSend;
        }

        const res = await fetch(preset.path, options);
        const duration = Math.round(performance.now() - startTime);
        results[preset.id] = {
          status: res.status,
          ok: res.ok || res.status < 400,
          time: duration,
        };
      } catch {
        results[preset.id] = {
          status: 0,
          ok: false,
          time: Math.round(performance.now() - startTime),
        };
      }
    }

    setSuiteResults(results);
    setHealthCheckRunning(false);
  };

  const copyResponse = () => {
    if (responseResult?.data) {
      navigator.clipboard.writeText(JSON.stringify(responseResult.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStatusBadgeColor = (status: number | null) => {
    if (!status) return 'bg-gray-800 text-gray-200 border-gray-600';
    if (status >= 200 && status < 300) return 'bg-emerald-100 text-emerald-800 border-emerald-500 font-bold';
    if (status >= 400 && status < 500) return 'bg-amber-100 text-amber-900 border-amber-500 font-bold';
    return 'bg-rose-100 text-rose-900 border-rose-500 font-bold';
  };

  const getMethodColor = (m: string) => {
    switch (m) {
      case 'GET': return 'bg-emerald-500 text-white';
      case 'POST': return 'bg-blue-600 text-white';
      case 'PATCH': return 'bg-amber-500 text-black';
      case 'DELETE': return 'bg-rose-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-black font-sans p-4 md:p-8 pb-20">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD93D] border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Zap className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">REST API Endpoint Inspector</h1>
                <span className="bg-[#4D96FF] text-white font-bold text-xs px-2.5 py-1 rounded-full border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                  Supabase Live DB
                </span>
              </div>
              <p className="text-sm font-medium text-gray-600">
                Interactive playground to verify status codes, payload validations, and live execution metrics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={runAllHealthChecks}
              disabled={healthCheckRunning}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-bold rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${healthCheckRunning ? 'animate-spin' : ''}`} />
              {healthCheckRunning ? 'Running Suite...' : 'Run All Endpoint Checks'}
            </button>

            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#C4B5FD] hover:bg-[#b09afc] text-black font-bold rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              <Code2 className="w-4 h-4" />
              Swagger UI Docs
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar: Presets & Health Matrix */}
        <div className="lg:col-span-4 space-y-6">
          {/* Preset Selector */}
          <div className="bg-white border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-lg font-black mb-3 flex items-center gap-2 border-b-2 border-black pb-2">
              <Server className="w-5 h-5 text-[#FF6B6B]" />
              API Endpoints Preset Suite
            </h2>

            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
              {(['Users', 'Projects', 'Tasks'] as const).map(category => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-gray-500 tracking-wider">
                    {category === 'Users' && <Users className="w-3.5 h-3.5 text-blue-600" />}
                    {category === 'Projects' && <FolderKanban className="w-3.5 h-3.5 text-amber-600" />}
                    {category === 'Tasks' && <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />}
                    {category} Endpoints
                  </div>

                  {PRESET_ENDPOINTS.filter(p => p.category === category).map(preset => {
                    const health = suiteResults[preset.id];
                    const isSelected = selectedPreset.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => selectPreset(preset)}
                        className={`w-full text-left p-3 rounded-xl border-2 border-black transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-[#6BCB77] text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] font-bold'
                            : 'bg-[#FAF8F5] hover:bg-white text-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded border border-black ${getMethodColor(preset.method)}`}>
                              {preset.method}
                            </span>
                            <span className="text-sm font-bold truncate">{preset.name}</span>
                          </div>
                          <p className="text-xs text-gray-600 font-medium font-mono">{preset.path}</p>
                        </div>

                        {health && (
                          <div className="flex flex-col items-end">
                            <span className={`text-[11px] px-1.5 py-0.5 rounded border border-black font-mono font-bold ${
                              health.ok ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                            }`}>
                              {health.status}
                            </span>
                            <span className="text-[10px] font-mono text-gray-500">{health.time}ms</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center/Right: Request Runner & Response Viewer */}
        <div className="lg:col-span-8 space-y-6">
          {/* Request Configurator */}
          <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <h2 className="text-lg font-black flex items-center gap-2">
                <Play className="w-5 h-5 text-[#4D96FF]" />
                Request Configurator
              </h2>
              <span className="text-xs font-bold bg-[#FAF8F5] px-3 py-1 rounded-lg border border-black">
                Target: {selectedPreset.name}
              </span>
            </div>

            {/* Method & URL Input */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={method}
                onChange={e => setMethod(e.target.value as 'GET' | 'POST' | 'PATCH' | 'DELETE')}
                className="bg-[#FAF8F5] border-2 border-black font-black text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={path}
                  onChange={e => setPath(e.target.value)}
                  className="w-full bg-[#FAF8F5] border-2 border-black font-mono text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  placeholder="/api/v1/users"
                />
              </div>

              <button
                onClick={handleSendRequest}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#4D96FF] hover:bg-[#3b82f6] text-white font-black rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all min-w-[140px]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Request
                  </>
                )}
              </button>
            </div>

            {/* Optional JWT Header */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                Authorization Header (Optional Bearer Token):
              </label>
              <input
                type="text"
                value={authHeader}
                onChange={e => setAuthHeader(e.target.value)}
                placeholder="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full bg-[#FAF8F5] border-2 border-black font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            {/* Request Body Editor (If POST / PATCH) */}
            {['POST', 'PATCH', 'PUT'].includes(method) && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase text-gray-600">
                    JSON Request Body Payload:
                  </label>
                  <button
                    onClick={() => {
                      if (selectedPreset.id === 'register-user') {
                        setRequestBody(JSON.stringify({
                          name: 'Developer Tester',
                          email: `tester.${Math.floor(Math.random() * 100000)}@example.com`,
                          password: 'Password123!',
                          role: 'MEMBER',
                        }, null, 2));
                      } else if (selectedPreset.body) {
                        setRequestBody(selectedPreset.body);
                      }
                    }}
                    className="text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    Generate Fresh Payload
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={requestBody}
                  onChange={e => setRequestBody(e.target.value)}
                  className="w-full bg-[#1E1E1E] text-[#61AFEF] font-mono text-xs p-3 rounded-xl border-2 border-black focus:outline-none focus:ring-2 focus:ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  placeholder={'{\n  "key": "value"\n}'}
                />
              </div>
            )}
          </div>

          {/* Response Viewer */}
          <div className="bg-white border-3 border-black rounded-2xl p-5 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Response Output
                </h2>

                {responseResult?.status && (
                  <span className={`text-xs px-3 py-1 rounded-full border-2 ${getStatusBadgeColor(responseResult.status)} shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
                    HTTP {responseResult.status} {responseResult.statusText}
                  </span>
                )}

                {responseResult?.responseTime !== undefined && (
                  <span className="text-xs font-mono font-bold bg-gray-100 text-gray-800 px-2.5 py-1 rounded-lg border border-black">
                    ⏱ {responseResult.responseTime} ms
                  </span>
                )}
              </div>

              {responseResult?.data !== undefined && responseResult?.data !== null && (
                <button
                  onClick={copyResponse}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-[#FAF8F5] hover:bg-gray-200 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied JSON!' : 'Copy JSON'}
                </button>
              )}
            </div>

            {/* Response Display Box */}
            {!responseResult ? (
              <div className="bg-[#FAF8F5] border-2 border-dashed border-gray-400 rounded-xl p-8 text-center text-gray-500 font-medium">
                Select an endpoint from the left suite or configure your request above, then click <strong className="text-black">Send Request</strong> to view the live JSON response payload.
              </div>
            ) : responseResult.error ? (
              <div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-4 text-rose-900 font-mono text-xs">
                <div className="font-bold text-sm mb-1 flex items-center gap-2 text-rose-700">
                  <XCircle className="w-4 h-4" />
                  Request Failed
                </div>
                <p>{responseResult.error}</p>
              </div>
            ) : (
              <div className="relative">
                <pre className="bg-[#1E1E1E] text-[#98C379] font-mono text-xs p-4 rounded-xl border-2 border-black overflow-x-auto max-h-[420px] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] leading-relaxed">
                  {JSON.stringify(responseResult.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

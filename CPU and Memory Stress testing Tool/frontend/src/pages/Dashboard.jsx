import React from 'react';
import {
  Cpu,
  HardDrive,
  Activity,
  Clock,
  Layers,
  Zap,
  Play,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export function Dashboard({ metrics, history, isConnected, onNavigate, testStatus }) {
  const cpuPercent = metrics ? metrics.cpu_percent : 0;
  const ramPercent = metrics ? metrics.ram_percent : 0;
  const ramUsed = metrics ? (metrics.ram_used_mb / 1024).toFixed(1) : 0;
  const ramTotal = metrics ? (metrics.ram_total_mb / 1024).toFixed(1) : 0;
  const ramAvail = metrics ? (metrics.ram_available_mb / 1024).toFixed(1) : 0;
  const swapPercent = metrics ? metrics.swap_percent : 0;
  const cpuFreq = metrics && metrics.cpu_frequency_mhz ? `${metrics.cpu_frequency_mhz} MHz` : 'N/A';
  
  // Format uptime
  const formatUptime = (seconds = 0) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const isRunning = testStatus && (testStatus.status === 'running' || testStatus.status === 'starting');

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>System Telemetry & Performance Dashboard</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time operating system performance metrics and stress test controller.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('run-test')}
            disabled={isRunning}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md ${
              isRunning
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Stress Test</span>
          </button>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* CPU Utilization Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Overall CPU</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">{cpuPercent}%</span>
            <span className="text-xs text-slate-400">load</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                cpuPercent > 85 ? 'bg-rose-500' : cpuPercent > 60 ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, cpuPercent))}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 flex justify-between">
            <span>Cores: {metrics?.cpu_cores_percent?.length || 'N/A'}</span>
            <span>Freq: {cpuFreq}</span>
          </p>
        </div>

        {/* RAM Utilization Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">RAM Usage</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">{ramPercent}%</span>
            <span className="text-xs text-slate-400">utilized</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                ramPercent > 85 ? 'bg-rose-500' : ramPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, ramPercent))}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 flex justify-between">
            <span>{ramUsed} GB / {ramTotal} GB</span>
            <span>Free: {ramAvail} GB</span>
          </p>
        </div>

        {/* Swap Memory Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Swap Paging</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">{swapPercent}%</span>
            <span className="text-xs text-slate-400">paged</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="h-2 rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, swapPercent))}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 flex justify-between">
            <span>Total: {metrics ? (metrics.swap_total_mb / 1024).toFixed(1) : 0} GB</span>
            <span>Used: {metrics ? (metrics.swap_used_mb / 1024).toFixed(1) : 0} GB</span>
          </p>
        </div>

        {/* System Uptime & Status Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Uptime & Status</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl font-extrabold text-white font-mono">
              {metrics ? formatUptime(metrics.uptime_seconds) : '---'}
            </span>
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className="text-xs text-slate-300 font-medium">
              {isConnected ? 'Telemetry Streaming' : 'Reconnecting...'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Active Workers: <span className="text-white font-bold">{testStatus?.active_workers || 0}</span>
          </p>
        </div>
      </div>

      {/* Real-Time Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU Chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Real-Time CPU Utilization (%)</h3>
            </div>
            <span className="text-xs font-mono px-2 py-1 bg-indigo-500/10 text-indigo-300 rounded border border-indigo-500/20">
              {cpuPercent}% current
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="cpu_percent"
                  name="CPU %"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RAM Chart */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Real-Time Memory Utilization (%)</h3>
            </div>
            <span className="text-xs font-mono px-2 py-1 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20">
              {ramPercent}% current
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="ram_percent"
                  name="RAM %"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* OS Concepts Educational Callout */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-900/40 p-6 rounded-2xl">
        <h4 className="font-bold text-indigo-300 text-sm mb-2 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-indigo-400" />
          <span>Operating Systems Architecture Highlights</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300 mt-3">
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <b className="text-white block mb-1">Multiprocessing Execution</b>
            CPU stress spawns isolated OS child processes that scale across independent hardware cores without Python GIL bottlenecking.
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <b className="text-white block mb-1">Physical Page Commitment</b>
            Memory stress fills byte buffers in memory chunks, compelling Windows to allocate physical RAM pages rather than lazy virtual mapping.
          </div>
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <b className="text-white block mb-1">Safety & Graceful Cleanup</b>
            The kernel reclaims 100% of heap memory on worker process exit, guaranteed through cooperative IPC events and fallback termination.
          </div>
        </div>
      </div>
    </div>
  );
}

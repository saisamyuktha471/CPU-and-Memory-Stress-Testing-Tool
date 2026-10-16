import React, { useState } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Layers,
  Radio,
  Sliders,
  Clock
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export function LiveMonitoring({
  metrics,
  history,
  isConnected,
  onSendInterval
}) {
  const [selectedInterval, setSelectedInterval] = useState(1.0);

  const handleIntervalChange = (val) => {
    setSelectedInterval(val);
    if (onSendInterval) {
      onSendInterval(val);
    }
  };

  const coreList = metrics?.cpu_cores_percent || [];
  const ramUsedGb = metrics ? (metrics.ram_used_mb / 1024).toFixed(2) : '0';
  const ramTotalGb = metrics ? (metrics.ram_total_mb / 1024).toFixed(2) : '0';
  const ramAvailGb = metrics ? (metrics.ram_available_mb / 1024).toFixed(2) : '0';
  const swapUsedGb = metrics ? (metrics.swap_used_mb / 1024).toFixed(2) : '0';
  const swapTotalGb = metrics ? (metrics.swap_total_mb / 1024).toFixed(2) : '0';

  return (
    <div className="space-y-6">
      {/* Top Header with Telemetry Interval Control */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span>Live System Hardware Telemetry</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time per-core kernel performance metrics, memory allocation levels, and telemetry stream control.
          </p>
        </div>

        {/* Streaming Controls */}
        <div className="flex items-center space-x-3 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
          <span className="text-xs text-slate-300 font-semibold px-2 flex items-center">
            <Radio className={`w-3.5 h-3.5 mr-1.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
            Interval:
          </span>
          {[
            { label: '0.5s Fast', value: 0.5 },
            { label: '1.0s Normal', value: 1.0 },
            { label: '2.0s Eco', value: 2.0 },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => handleIntervalChange(item.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedInterval === item.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Per-Core CPU Utilization Breakdown */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <span>Per-Core CPU Utilization Breakdown</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {coreList.length} Logical Cores Detected
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {coreList.map((load, idx) => {
            const isHigh = load > 85;
            const isMed = load > 50;
            return (
              <div
                key={idx}
                className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex flex-col justify-between"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-slate-300">Core #{idx}</span>
                  <span
                    className={`text-xs font-mono font-bold ${
                      isHigh ? 'text-rose-400' : isMed ? 'text-amber-400' : 'text-indigo-400'
                    }`}
                  >
                    {load}%
                  </span>
                </div>
                <div className="w-full bg-slate-700/80 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, load))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Combined System Telemetry Line Chart */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Continuous Telemetry Stream (CPU, RAM & Swap)</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Last {history.length} data samples
          </span>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend verticalAlign="top" height={36} />
              <Line
                type="monotone"
                dataKey="cpu_percent"
                name="Overall CPU %"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="ram_percent"
                name="RAM Utilization %"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="swap_percent"
                name="Swap Space %"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Memory & Virtual Storage Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Physical RAM Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Physical Memory (RAM) Allocation</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Total Installed Memory:</span>
              <span className="font-mono text-white font-semibold">{ramTotalGb} GB</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Committed / Used RAM:</span>
              <span className="font-mono text-emerald-400 font-semibold">{ramUsedGb} GB ({metrics?.ram_percent}%)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Available / Free RAM:</span>
              <span className="font-mono text-indigo-400 font-semibold">{ramAvailGb} GB</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Active Test Allocated:</span>
              <span className="font-mono text-amber-400 font-semibold">{metrics?.allocated_memory_mb || 0} MB</span>
            </div>
          </div>
        </div>

        {/* Swap & Pagefile Card */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Virtual Memory / Windows Pagefile</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Pagefile Allocated:</span>
              <span className="font-mono text-white font-semibold">{swapTotalGb} GB</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Currently Paged Out:</span>
              <span className="font-mono text-amber-400 font-semibold">{swapUsedGb} GB ({metrics?.swap_percent}%)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Operating System Paging State:</span>
              <span className="font-semibold text-emerald-400">Stable</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Virtual Memory Policy:</span>
              <span className="font-semibold text-slate-300">Bounded Working Set</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

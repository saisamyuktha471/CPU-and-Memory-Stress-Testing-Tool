import React from 'react';
import { AlertTriangle, Square, Activity, Cpu, HardDrive } from 'lucide-react';

export function ActiveTestBanner({ testStatus, onStopTest }) {
  if (!testStatus || (testStatus.status !== 'running' && testStatus.status !== 'starting' && testStatus.status !== 'stopping')) {
    return null;
  }

  const {
    name = 'Stress Test',
    test_type = 'cpu',
    elapsed_seconds = 0,
    duration_seconds = 30,
    progress_percent = 0,
    active_workers = 0,
    allocated_memory_mb = 0,
    status
  } = testStatus;

  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-b border-amber-500/40 px-6 py-3 sticky top-0 z-20 shadow-lg backdrop-blur">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Test Details */}
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 animate-pulse">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white text-sm">{name}</span>
              <span className="px-2 py-0.5 text-xs font-semibold uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {test_type}
              </span>
              <span className="text-xs text-amber-400 font-medium">
                {status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-slate-300 mt-0.5">
              <span className="flex items-center">
                <Cpu className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                Workers: <b className="ml-1 text-white">{active_workers}</b>
              </span>
              {(test_type === 'memory' || test_type === 'combined') && (
                <span className="flex items-center">
                  <HardDrive className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Allocated: <b className="ml-1 text-white">{allocated_memory_mb} MB</b>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Progress Bar */}
        <div className="flex-1 max-w-md min-w-[200px]">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400">Progress</span>
            <span className="text-slate-200 font-mono font-medium">
              {elapsed_seconds}s / {duration_seconds}s ({progress_percent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-indigo-500 via-amber-500 to-rose-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress_percent))}%` }}
            ></div>
          </div>
        </div>

        {/* Right: Emergency Stop Button */}
        <div>
          <button
            onClick={onStopTest}
            disabled={status === 'stopping'}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:bg-slate-700 text-white text-xs font-bold rounded-lg shadow-md transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{status === 'stopping' ? 'STOPPING...' : 'ABORT TEST'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import {
  LayoutDashboard,
  Flame,
  Activity,
  History,
  GitCompare,
  Cpu,
  Settings,
  Square,
  Radio
} from 'lucide-react';

export function Sidebar({ activePage, setActivePage, testStatus, onStopTest }) {
  const isTestActive = testStatus && (testStatus.status === 'running' || testStatus.status === 'starting');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'run-test', label: 'Run Stress Test', icon: Flame },
    { id: 'live-monitor', label: 'Live Monitoring', icon: Activity },
    { id: 'history', label: 'Test History', icon: History },
    { id: 'comparison', label: 'Reports & Compare', icon: GitCompare },
    { id: 'system-info', label: 'System Information', icon: Cpu },
    { id: 'settings', label: 'Safety & Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen fixed left-0 top-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg shadow-lg">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-wide leading-tight">OS Stress Lab</h1>
            <p className="text-xs text-slate-400 font-medium">CPU & Memory Tool</p>
          </div>
        </div>

        {/* Live System Indicator */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-300">Live Telemetry</span>
          </div>
          {isTestActive ? (
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 animate-pulse">
              TEST ACTIVE
            </span>
          ) : (
            <span className="px-2 py-0.5 text-xs font-medium bg-slate-800 text-slate-400 rounded">
              IDLE
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Active Test Controls at bottom of sidebar */}
      <div className="p-4 border-t border-slate-800">
        {isTestActive ? (
          <div className="bg-slate-800/90 rounded-lg p-3 border border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-400 flex items-center space-x-1">
                <Radio className="w-3 h-3 animate-spin text-amber-400 mr-1" />
                Workload Active
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {testStatus.elapsed_seconds}s
              </span>
            </div>
            <button
              onClick={onStopTest}
              className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-semibold rounded flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>STOP WORKLOAD</span>
            </button>
          </div>
        ) : (
          <div className="text-center text-xs text-slate-500 py-1">
            Operating Systems Lab v1.0
          </div>
        )}
      </div>
    </aside>
  );
}

import React from 'react';
import {
  Cpu,
  Terminal,
  Layers,
  HardDrive,
  Info,
  Server,
  Code2,
  BookOpen
} from 'lucide-react';

export function SystemInfoPage({ systemInfo }) {
  const ramGb = systemInfo ? (systemInfo.total_ram_mb / 1024).toFixed(2) : '---';

  const specs = [
    { label: 'Operating System', value: systemInfo?.os_name, icon: Server },
    { label: 'OS Version / Release', value: `${systemInfo?.os_release} (${systemInfo?.os_version})`, icon: Server },
    { label: 'Platform String', value: systemInfo?.os_platform, icon: Terminal },
    { label: 'Python Environment', value: `Python ${systemInfo?.python_version}`, icon: Code2 },
    { label: 'Processor Name', value: systemInfo?.processor, icon: Cpu },
    { label: 'Instruction Architecture', value: systemInfo?.cpu_architecture, icon: Cpu },
    { label: 'Physical CPU Cores', value: systemInfo?.physical_cores, icon: Layers },
    { label: 'Logical CPU Cores', value: systemInfo?.logical_cores, icon: Layers },
    { label: 'Total Physical Memory', value: `${ramGb} GB (${systemInfo?.total_ram_mb} MB)`, icon: HardDrive },
    { label: 'Application Version', value: systemInfo?.app_version || '1.0.0', icon: Info },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <span>Host System & Environment Architecture</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Detailed platform inspection and hardware virtualization parameters.
        </p>
      </div>

      {/* Hardware Specs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {specs.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start space-x-3"
            >
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                  {item.label}
                </span>
                <span className="text-sm font-bold text-white font-mono truncate block mt-0.5">
                  {item.value || 'Unavailable'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operating Systems Academic Principles Reference */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <span>Core Operating Systems Concepts Demonstrated</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white text-sm text-indigo-300">1. Multiprocessing vs. Multithreading</h4>
            <p className="leading-relaxed">
              Standard Python threads are constrained by the Global Interpreter Lock (GIL) on a single hardware core.
              To generate genuine multi-core CPU stress, this tool spawns independent OS processes via the Python
              multiprocessing module. Each child process receives its own process control block (PCB), virtual address
              space, and OS scheduler slice.
            </p>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white text-sm text-emerald-300">2. Physical Page Commitment vs Virtual Memory</h4>
            <p className="leading-relaxed">
              Modern operating systems use lazy allocation (demand paging). Simply reserving memory does not allocate
              physical RAM until pages are touched. Our memory engine writes explicit byte patterns into bytearrays in
              manageable chunks, compelling the Windows memory manager to commit physical RAM frames into the working set.
            </p>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white text-sm text-amber-300">3. Cooperative Inter-Process Cancellation (IPC)</h4>
            <p className="leading-relaxed">
              Workload processes monitor shared synchronization flags (multiprocessing Events) in low-overhead intervals.
              When a user triggers the Stop control or test duration expires, workers cooperatively terminate their loop
              and deallocate memory before exiting cleanly, with graceful join timeouts.
            </p>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-1.5">
            <h4 className="font-bold text-white text-sm text-cyan-300">4. Operating System Safety Reserve Guardrails</h4>
            <p className="leading-relaxed">
              To prevent kernel instability, unconstrained paging, or host system freeze, our manager enforces an absolute
              safety floor (minimum available RAM reserve). If available RAM approaches the threshold, the engine automatically
              halts memory allocation and records a safety-limit event in the persistent test report.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

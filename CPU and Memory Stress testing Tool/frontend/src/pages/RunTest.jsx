import React, { useState, useMemo } from 'react';
import {
  Flame,
  Cpu,
  HardDrive,
  Layers,
  AlertTriangle,
  Play,
  Square,
  CheckCircle,
  ShieldCheck,
  Info
} from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

export function RunTest({
  metrics,
  systemInfo,
  safetySettings,
  testStatus,
  onStartTest,
  onStopTest
}) {
  const [name, setName] = useState('Experiment Run');
  const [testType, setTestType] = useState('combined'); // 'cpu' | 'memory' | 'combined'
  const [cpuWorkers, setCpuWorkers] = useState(2);
  const [cpuIntensity, setCpuIntensity] = useState(100);
  const [memoryTargetMb, setMemoryTargetMb] = useState(512);
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [monitoringInterval, setMonitoringInterval] = useState(1.0);
  const [warmupSeconds, setWarmupSeconds] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const maxDuration = safetySettings?.max_duration_seconds || 300;
  const maxWorkers = safetySettings?.max_cpu_workers || 16;
  const minReserveMb = safetySettings?.min_available_ram_mb || 1024;
  const reservePercent = safetySettings?.ram_reserve_percent || 15.0;

  const totalRamMb = systemInfo?.total_ram_mb || 8192;
  const availRamMb = metrics?.ram_available_mb || 2048;

  // Compute safe allocatable budget for memory
  const reserveBudgetMb = Math.max(minReserveMb, (totalRamMb * (reservePercent / 100.0)));
  const safeMemoryBudgetMb = Math.max(0, Math.floor(availRamMb - reserveBudgetMb));

  const isRunning = testStatus && (testStatus.status === 'running' || testStatus.status === 'starting');

  // Input Validation & Warning logic
  const { validationErrors, warnings } = useMemo(() => {
    const errs = [];
    const warns = [];

    if (!name.trim()) {
      errs.push('Test name is required.');
    }

    if (durationSeconds < 5) {
      errs.push('Duration must be at least 5 seconds.');
    } else if (durationSeconds > maxDuration) {
      errs.push(`Duration cannot exceed safety ceiling of ${maxDuration} seconds.`);
    } else if (durationSeconds > 120) {
      warns.push(`Test duration is set high (${durationSeconds}s). Keep system ventilation adequate.`);
    }

    if (testType === 'cpu' || testType === 'combined') {
      if (cpuWorkers < 1) {
        errs.push('At least 1 CPU worker is required.');
      } else if (cpuWorkers > maxWorkers) {
        errs.push(`Worker count cannot exceed safety limit of ${maxWorkers}.`);
      } else if (systemInfo?.physical_cores && cpuWorkers > systemInfo.physical_cores) {
        warns.push(`Worker count (${cpuWorkers}) exceeds physical core count (${systemInfo.physical_cores}). Hardware multithreading will be utilized.`);
      }

      if (cpuIntensity < 10 || cpuIntensity > 100) {
        errs.push('CPU intensity must be between 10% and 100%.');
      }
    }

    if (testType === 'memory' || testType === 'combined') {
      if (memoryTargetMb < 50) {
        errs.push('Memory allocation must be at least 50 MB.');
      } else if (memoryTargetMb > safeMemoryBudgetMb) {
        errs.push(`Requested memory (${memoryTargetMb} MB) exceeds safe budget (${safeMemoryBudgetMb} MB). System safety reserve requires at least ${Math.round(reserveBudgetMb)} MB.`);
      } else if (memoryTargetMb > (safeMemoryBudgetMb * 0.8)) {
        warns.push(`Allocating ${memoryTargetMb} MB consumes over 80% of current safe budget.`);
      }
    }

    return { validationErrors: errs, warnings: warns };
  }, [
    name,
    testType,
    cpuWorkers,
    cpuIntensity,
    memoryTargetMb,
    durationSeconds,
    maxDuration,
    maxWorkers,
    safeMemoryBudgetMb,
    reserveBudgetMb,
    systemInfo
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validationErrors.length > 0 || isRunning) return;

    if (warnings.length > 0) {
      setConfirmModalOpen(true);
    } else {
      executeStart();
    }
  };

  const executeStart = async () => {
    setConfirmModalOpen(false);
    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      name,
      test_type: testType,
      cpu_workers: testType === 'memory' ? 1 : cpuWorkers,
      cpu_intensity: cpuIntensity,
      memory_target_mb: testType === 'cpu' ? 100 : memoryTargetMb,
      duration_seconds: durationSeconds,
      monitoring_interval: monitoringInterval,
      warmup_seconds: warmupSeconds,
    };

    try {
      await onStartTest(payload);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <span>Stress Test Configuration</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Configure controlled operating system workloads with active safety threshold monitoring.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-950/50 border border-red-500/40 p-4 rounded-xl text-red-200 text-sm flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Config Form (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Test Name & Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Test Name / Identifier
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isRunning}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  placeholder="e.g., Matrix Multi-Core Benchmark"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Workload Engine Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cpu', label: 'CPU Only', icon: Cpu },
                    { id: 'memory', label: 'RAM Only', icon: HardDrive },
                    { id: 'combined', label: 'Combined', icon: Layers },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isSelected = testType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTestType(t.id)}
                        disabled={isRunning}
                        className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                        } disabled:opacity-50`}
                      >
                        <Icon className="w-4 h-4 mb-1" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CPU Workload Configuration */}
            {(testType === 'cpu' || testType === 'combined') && (
              <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <span>CPU Workload Parameters</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    Host: {systemInfo?.physical_cores || 4} Physical / {systemInfo?.logical_cores || 8} Logical Cores
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Concurrent Workers</span>
                      <span className="font-mono text-indigo-400 font-bold">{cpuWorkers} Processes</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max={maxWorkers}
                      value={cpuWorkers}
                      onChange={(e) => setCpuWorkers(parseInt(e.target.value, 10))}
                      disabled={isRunning}
                      className="w-full accent-indigo-500 h-2 bg-slate-700 rounded-lg cursor-pointer disabled:opacity-50"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Each worker executes mathematical loops inside an isolated OS process.
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Workload Intensity</span>
                      <span className="font-mono text-indigo-400 font-bold">{cpuIntensity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={cpuIntensity}
                      onChange={(e) => setCpuIntensity(parseInt(e.target.value, 10))}
                      disabled={isRunning}
                      className="w-full accent-indigo-500 h-2 bg-slate-700 rounded-lg cursor-pointer disabled:opacity-50"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Controls duty-cycle: 100% is continuous compute; lower introduces micro-sleep pauses.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Memory Workload Configuration */}
            {(testType === 'memory' || testType === 'combined') && (
              <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    <span>Memory Allocation Parameters</span>
                  </h4>
                  <span className="text-xs text-emerald-400 font-mono font-medium">
                    Safe Budget: {safeMemoryBudgetMb} MB
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">Target Allocation</span>
                    <span className="font-mono text-emerald-400 font-bold">{memoryTargetMb} MB ({(memoryTargetMb / 1024).toFixed(2)} GB)</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max={Math.max(100, safeMemoryBudgetMb)}
                    step="50"
                    value={memoryTargetMb}
                    onChange={(e) => setMemoryTargetMb(parseInt(e.target.value, 10))}
                    disabled={isRunning || safeMemoryBudgetMb < 50}
                    className="w-full accent-emerald-500 h-2 bg-slate-700 rounded-lg cursor-pointer disabled:opacity-50"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                    <span>50 MB min</span>
                    <span>Safety limit: {safeMemoryBudgetMb} MB max</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Allocated in 50MB bounded buffers and touched to commit real physical memory pages.
                  </p>
                </div>
              </div>
            )}

            {/* Duration and Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Duration (Seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max={maxDuration}
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(parseInt(e.target.value, 10) || 5)}
                  disabled={isRunning}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                <span className="text-[11px] text-slate-500">Max limit: {maxDuration}s</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Monitoring Interval (s)
                </label>
                <select
                  value={monitoringInterval}
                  onChange={(e) => setMonitoringInterval(parseFloat(e.target.value))}
                  disabled={isRunning}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                >
                  <option value={0.5}>0.5 seconds (High Frequency)</option>
                  <option value={1.0}>1.0 second (Standard)</option>
                  <option value={2.0}>2.0 seconds (Low Overhead)</option>
                </select>
                <span className="text-[11px] text-slate-500">Sampling rate</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Warm-up Delay (s)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={warmupSeconds}
                  onChange={(e) => setWarmupSeconds(parseInt(e.target.value, 10) || 0)}
                  disabled={isRunning}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
                <span className="text-[11px] text-slate-500">Baseline before load</span>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              {isRunning ? (
                <button
                  type="button"
                  onClick={onStopTest}
                  className="flex items-center space-x-2 px-6 py-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-red-900/30"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>HALT RUNNING WORKLOAD</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={validationErrors.length > 0 || isSubmitting}
                  className="flex items-center space-x-2 px-7 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-indigo-600/30 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isSubmitting ? 'INITIALIZING...' : 'START STRESS TEST'}</span>
                </button>
              )}

              <span className="text-xs text-slate-400">
                Cooperative cancellation & process cleanup guaranteed
              </span>
            </div>
          </form>
        </div>

        {/* Configuration Summary & Safety Sidebar (1 Col) */}
        <div className="space-y-5">
          {/* Summary Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" />
              <span>Configuration Summary</span>
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Engine Type:</span>
                <span className="font-semibold text-white uppercase">{testType}</span>
              </div>
              {(testType === 'cpu' || testType === 'combined') && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">CPU Workers:</span>
                    <span className="font-mono text-white font-semibold">{cpuWorkers}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Intensity:</span>
                    <span className="font-mono text-white font-semibold">{cpuIntensity}%</span>
                  </div>
                </>
              )}
              {(testType === 'memory' || testType === 'combined') && (
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Target Memory:</span>
                  <span className="font-mono text-emerald-400 font-semibold">{memoryTargetMb} MB</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Duration:</span>
                <span className="font-mono text-white font-semibold">{durationSeconds} seconds</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Sampling Rate:</span>
                <span className="font-mono text-white font-semibold">{monitoringInterval}s</span>
              </div>
            </div>
          </div>

          {/* Memory Safety Status Card */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>System Memory Safety Shield</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Available RAM:</span>
                <span className="font-mono text-white">{(availRamMb / 1024).toFixed(2)} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">OS Reserve Floor:</span>
                <span className="font-mono text-slate-300">{(reserveBudgetMb / 1024).toFixed(2)} GB</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                <span className="text-emerald-400">Safe Test Budget:</span>
                <span className="font-mono text-emerald-400">{(safeMemoryBudgetMb / 1024).toFixed(2)} GB</span>
              </div>
            </div>
          </div>

          {/* Validation Errors & Warnings Card */}
          {(validationErrors.length > 0 || warnings.length > 0) && (
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              {validationErrors.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-red-400 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    Validation Errors:
                  </span>
                  <ul className="list-disc list-inside text-xs text-red-300 space-y-1">
                    {validationErrors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                    <Info className="w-3.5 h-3.5 mr-1" />
                    Safety Notes:
                  </span>
                  <ul className="list-disc list-inside text-xs text-amber-300 space-y-1">
                    {warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModalOpen}
        title="Confirm Workload Launch"
        message={`You are about to launch a ${testType.toUpperCase()} stress test for ${durationSeconds} seconds. Safety warnings are active. Would you like to proceed?`}
        confirmText="Launch Workload"
        confirmVariant="primary"
        onConfirm={executeStart}
        onCancel={() => setConfirmModalOpen(false)}
      />
    </div>
  );
}

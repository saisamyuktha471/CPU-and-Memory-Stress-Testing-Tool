import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Save,
  RotateCcw,
  Check,
  AlertTriangle,
  Clock,
  Cpu,
  HardDrive
} from 'lucide-react';
import { fetchSettings, updateSettings, resetSettings } from '../services/api';
import { ConfirmationModal } from '../components/ConfirmationModal';

export function SettingsPage({ onSettingsUpdated }) {
  const [formData, setFormData] = useState({
    max_duration_seconds: 300,
    default_duration_seconds: 30,
    max_cpu_workers: 16,
    min_available_ram_mb: 1024,
    ram_reserve_percent: 15.0,
    default_monitoring_interval: 1.0,
    warning_cpu_threshold: 90.0,
    warning_ram_threshold: 85.0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchSettings();
        setFormData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }));
    setSaveSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await updateSettings(formData);
      setFormData(updated);
      setSaveSuccess(true);
      if (onSettingsUpdated) onSettingsUpdated(updated);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetModalOpen(false);
    try {
      setSaving(true);
      const defaults = await resetSettings();
      setFormData(defaults);
      setSaveSuccess(true);
      if (onSettingsUpdated) onSettingsUpdated(defaults);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(`Failed to reset: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          <span>Safety Policies & Configuration Guardrails</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Define conservative thresholds for maximum test duration, concurrent worker bounds, and memory safety reserves.
        </p>
      </div>

      {saveSuccess && (
        <div className="bg-emerald-950/50 border border-emerald-500/40 p-4 rounded-xl text-emerald-200 text-sm flex items-center space-x-3">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Safety settings successfully updated and applied to stress engines.</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading current settings...</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration Limits */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Test Duration Ceilings</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Absolute Max Duration (Seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={formData.max_duration_seconds}
                  onChange={(e) => handleChange('max_duration_seconds', parseInt(e.target.value, 10) || 5)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
                <span className="text-[11px] text-slate-400">Hard upper limit permitted (max 300s).</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Default Duration (Seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={formData.default_duration_seconds}
                  onChange={(e) => handleChange('default_duration_seconds', parseInt(e.target.value, 10) || 5)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
                <span className="text-[11px] text-slate-400">Default duration prefilled on new runs.</span>
              </div>
            </div>

            {/* Worker Limits */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <span>Worker Process Limits</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Maximum CPU Worker Processes
                </label>
                <input
                  type="number"
                  min="1"
                  max="64"
                  value={formData.max_cpu_workers}
                  onChange={(e) => handleChange('max_cpu_workers', parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
                <span className="text-[11px] text-slate-400">Restricts maximum child processes created.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Default Monitoring Interval (Seconds)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  max="5.0"
                  value={formData.default_monitoring_interval}
                  onChange={(e) => handleChange('default_monitoring_interval', parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
                <span className="text-[11px] text-slate-400">Default WebSocket sampling period.</span>
              </div>
            </div>

            {/* Memory Reserve Policies */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Operating System Memory Reserve</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Minimum Available RAM Floor (MB)
                </label>
                <input
                  type="number"
                  min="256"
                  max="8192"
                  step="128"
                  value={formData.min_available_ram_mb}
                  onChange={(e) => handleChange('min_available_ram_mb', parseInt(e.target.value, 10) || 256)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
                <span className="text-[11px] text-slate-400">Workload aborts if available RAM drops below this level.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  RAM Reserve Percentage (%)
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  step="1"
                  value={formData.ram_reserve_percent}
                  onChange={(e) => handleChange('ram_reserve_percent', parseFloat(e.target.value) || 5.0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
                <span className="text-[11px] text-slate-400">Percentage of total physical RAM kept unallocated for host apps.</span>
              </div>
            </div>

            {/* Warning Alert Thresholds */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Dashboard Warning Thresholds</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  CPU Warning Threshold (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={formData.warning_cpu_threshold}
                  onChange={(e) => handleChange('warning_cpu_threshold', parseFloat(e.target.value) || 50)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
                <span className="text-[11px] text-slate-400">Turns CPU gauge red above this utilization.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  RAM Warning Threshold (%)
                </label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={formData.warning_ram_threshold}
                  onChange={(e) => handleChange('warning_ram_threshold', parseFloat(e.target.value) || 50)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
                <span className="text-[11px] text-slate-400">Turns RAM gauge red above this utilization.</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Defaults</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Safety Policies'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={resetModalOpen}
        title="Reset Safety Policies"
        message="Are you sure you want to restore safety limits and threshold defaults?"
        confirmText="Reset Defaults"
        confirmVariant="danger"
        onConfirm={handleReset}
        onCancel={() => setResetModalOpen(false)}
      />
    </div>
  );
}

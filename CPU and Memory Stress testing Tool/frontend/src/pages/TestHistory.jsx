import React, { useState, useEffect } from 'react';
import {
  History,
  FileText,
  Download,
  Trash2,
  Filter,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  X
} from 'lucide-react';
import { fetchTestHistory, fetchTestReport, deleteTestReport, clearAllTestHistory } from '../services/api';
import { ConfirmationModal } from '../components/ConfirmationModal';

export function TestHistory() {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const [selectedReport, setSelectedReport] = useState(null);
  const [reportModalLoading, setReportModalLoading] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await fetchTestHistory();
      setHistoryList(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleOpenReport = async (testId) => {
    try {
      setReportModalLoading(true);
      const report = await fetchTestReport(testId);
      setSelectedReport(report);
    } catch (err) {
      alert(`Error loading report: ${err.message}`);
    } finally {
      setReportModalLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteTestReport(deleteTargetId);
      setDeleteTargetId(null);
      await loadHistory();
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleClearAll = async () => {
    setClearConfirmOpen(false);
    try {
      await clearAllTestHistory();
      await loadHistory();
    } catch (err) {
      alert(`Failed to clear: ${err.message}`);
    }
  };

  // Filter and Sort logic
  const filteredList = historyList
    .filter((item) => {
      if (typeFilter === 'all') return true;
      return item.test_type === typeFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.start_time) - new Date(a.start_time);
      if (sortBy === 'duration') return b.actual_duration_seconds - a.actual_duration_seconds;
      if (sortBy === 'peak_cpu') return b.peak_cpu_percent - a.peak_cpu_percent;
      if (sortBy === 'peak_ram') return b.peak_ram_percent - a.peak_ram_percent;
      return 0;
    });

  const getStatusBadge = (status) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </span>
      );
    }
    if (status === 'stopped') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertCircle className="w-3 h-3 mr-1" />
          Stopped
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <XCircle className="w-3 h-3 mr-1" />
        Failed
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title & Clear Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-400" />
            <span>Stress Test Run History</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Persisted experiment logs, time-series measurements, and analytical performance reports.
          </p>
        </div>

        {historyList.length > 0 && (
          <button
            onClick={() => setClearConfirmOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-red-950/60 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All History</span>
          </button>
        )}
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">Type:</span>
          {['all', 'cpu', 'memory', 'combined'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase transition-all ${
                typeFilter === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-xs text-white focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="duration">Longest Duration</option>
            <option value="peak_cpu">Highest Peak CPU</option>
            <option value="peak_ram">Highest Peak RAM</option>
          </select>
        </div>
      </div>

      {/* History Table / List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Loading persisted test history...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl">
          <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">No Stress Test Records Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Launch a stress test from the Run Stress Test page to record system measurements.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 border-b border-slate-700/80 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Test Details</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status & Outcome</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Peak CPU</th>
                  <th className="py-3.5 px-4">Peak RAM</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredList.map((item) => (
                  <tr key={item.test_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {item.start_time ? new Date(item.start_time).toLocaleString() : item.test_id}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-semibold text-[11px] border border-slate-700">
                        {item.test_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>{getStatusBadge(item.status)}</div>
                      <div className="text-[11px] text-slate-400 mt-1 max-w-[200px] truncate" title={item.termination_reason}>
                        {item.termination_reason}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-200">
                      {item.actual_duration_seconds}s
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="text-indigo-400 font-bold">{item.peak_cpu_percent}%</span>
                      <span className="text-slate-500 text-[10px] block">avg {item.avg_cpu_percent}%</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className="text-emerald-400 font-bold">{item.peak_ram_percent}%</span>
                      <span className="text-slate-500 text-[10px] block">avg {item.avg_ram_percent}%</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenReport(item.test_id)}
                          title="View Full Report"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`/api/tests/${item.test_id}/export/json`}
                          download
                          title="Download JSON Report"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`/api/tests/${item.test_id}/export/csv`}
                          download
                          title="Export CSV Metrics"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => setDeleteTargetId(item.test_id)}
                          title="Delete Report"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Report View Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{selectedReport.name}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedReport.test_id}</p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Outcome Banner */}
              <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[11px]">Termination Status:</span>
                  <span className="text-white font-semibold text-sm">{selectedReport.termination_reason}</span>
                </div>
                <div>{getStatusBadge(selectedReport.status)}</div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Avg CPU</span>
                  <span className="text-lg font-bold text-indigo-400 font-mono">
                    {selectedReport.summary?.avg_cpu_percent}%
                  </span>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Peak CPU</span>
                  <span className="text-lg font-bold text-indigo-400 font-mono">
                    {selectedReport.summary?.peak_cpu_percent}%
                  </span>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Avg RAM</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {selectedReport.summary?.avg_ram_percent}%
                  </span>
                </div>
                <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block">Peak RAM</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {selectedReport.summary?.peak_ram_percent}%
                  </span>
                </div>
              </div>

              {/* Workload Specifications */}
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                  Configuration Specs
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>CPU Workers: <b className="text-white">{selectedReport.config?.cpu_workers}</b></div>
                  <div>Intensity: <b className="text-white">{selectedReport.config?.cpu_intensity}%</b></div>
                  <div>Target Memory: <b className="text-white">{selectedReport.config?.memory_target_mb} MB</b></div>
                  <div>Actual Duration: <b className="text-white">{selectedReport.summary?.actual_duration_seconds}s</b></div>
                  <div>Samples Collected: <b className="text-white">{selectedReport.summary?.sample_count}</b></div>
                  <div>Engine: <b className="text-white uppercase">{selectedReport.test_type}</b></div>
                </div>
              </div>

              {/* Host Hardware Snapshot */}
              <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-800 text-slate-300 space-y-1">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                  Host Platform Snapshot
                </h4>
                <div>OS: <span className="text-white">{selectedReport.system_info?.os_platform}</span></div>
                <div>Processor: <span className="text-white">{selectedReport.system_info?.processor}</span></div>
                <div>Logical Cores: <span className="text-white">{selectedReport.system_info?.logical_cores}</span></div>
                <div>Physical Memory: <span className="text-white">{selectedReport.system_info?.total_ram_mb} MB</span></div>
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 border-t border-slate-800 flex justify-end space-x-3">
              <a
                href={`/api/tests/${selectedReport.test_id}/export/csv`}
                download
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs flex items-center space-x-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Metrics CSV</span>
              </a>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Confirmation */}
      <ConfirmationModal
        isOpen={deleteTargetId !== null}
        title="Delete Test Report"
        message="Are you sure you want to permanently delete this test report and all associated measurements?"
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Clear All Confirmation */}
      <ConfirmationModal
        isOpen={clearConfirmOpen}
        title="Clear All Test History"
        message="Are you sure you want to delete all saved test reports? This operation cannot be undone."
        confirmText="Clear All"
        confirmVariant="danger"
        onConfirm={handleClearAll}
        onCancel={() => setClearConfirmOpen(false)}
      />
    </div>
  );
}

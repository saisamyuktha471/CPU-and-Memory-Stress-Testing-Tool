import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  BarChart2,
  CheckSquare,
  Square,
  AlertCircle,
  HelpCircle,
  Cpu,
  HardDrive
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { fetchTestHistory, fetchTestReport } from '../services/api';

export function ReportsComparison() {
  const [historyList, setHistoryList] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparisonReports, setComparisonReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const list = await fetchTestHistory();
        setHistoryList(list);
        // Pre-select first 2 items if available
        if (list.length >= 2) {
          setSelectedIds([list[0].test_id, list[1].test_id]);
        } else if (list.length === 1) {
          setSelectedIds([list[0].test_id]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Fetch full details of selected reports whenever selection changes
  useEffect(() => {
    async function loadSelected() {
      if (selectedIds.length === 0) {
        setComparisonReports([]);
        return;
      }
      try {
        setLoadingDetails(true);
        const reports = await Promise.all(
          selectedIds.map((id) => fetchTestReport(id))
        );
        setComparisonReports(reports);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDetails(false);
      }
    }
    loadSelected();
  }, [selectedIds]);

  const toggleSelect = (testId) => {
    setSelectedIds((prev) => {
      if (prev.includes(testId)) {
        return prev.filter((id) => id !== testId);
      }
      if (prev.length >= 3) {
        alert('You can compare a maximum of 3 tests simultaneously.');
        return prev;
      }
      return [...prev, testId];
    });
  };

  // Prepare chart data for comparative visualization
  const chartData = comparisonReports.map((r) => ({
    name: r.name.length > 15 ? r.name.substring(0, 15) + '...' : r.name,
    avgCpu: r.summary?.avg_cpu_percent || 0,
    peakCpu: r.summary?.peak_cpu_percent || 0,
    avgRam: r.summary?.avg_ram_percent || 0,
    peakRam: r.summary?.peak_ram_percent || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <GitCompare className="w-5 h-5 text-indigo-400" />
          <span>Workload Performance Analysis & Comparison</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Evaluate operating system throughput and resource consumption between different stress test configurations.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Loading test records...</div>
      ) : historyList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-2xl text-slate-400">
          <AlertCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm">No test reports available for comparison yet. Run tests first.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Test Selector Pills */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
              Select Tests to Compare (Select 2 to 3):
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {historyList.map((item) => {
                const isChecked = selectedIds.includes(item.test_id);
                return (
                  <div
                    key={item.test_id}
                    onClick={() => toggleSelect(item.test_id)}
                    className={`cursor-pointer p-3 rounded-xl border text-xs flex items-start space-x-3 transition-all ${
                      isChecked
                        ? 'bg-indigo-950/40 border-indigo-500/80 text-white shadow-sm'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                    <div className="truncate flex-1">
                      <div className="font-bold truncate text-white">{item.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {item.test_type.toUpperCase()} • {item.actual_duration_seconds}s • Peak {item.peak_cpu_percent}% CPU
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {comparisonReports.length > 0 && (
            <>
              {/* Comparative Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CPU Comparison Chart */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <span>CPU Utilization Comparison (%)</span>
                  </h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Bar dataKey="avgCpu" name="Average CPU %" fill="#818cf8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="peakCpu" name="Peak CPU %" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* RAM Comparison Chart */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
                  <h4 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    <span>RAM Utilization Comparison (%)</span>
                  </h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Bar dataKey="avgRam" name="Average RAM %" fill="#34d399" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="peakRam" name="Peak RAM %" fill="#059669" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Comparison Matrix Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800">
                  <h4 className="text-sm font-bold text-white">Side-by-Side Parameter & Metrics Matrix</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-700 font-semibold uppercase">
                      <tr>
                        <th className="py-3 px-4 w-1/4">Metric / Dimension</th>
                        {comparisonReports.map((r) => (
                          <th key={r.test_id} className="py-3 px-4 text-white font-bold">
                            {r.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-400">Workload Type</td>
                        {comparisonReports.map((r) => (
                          <td key={r.test_id} className="py-2.5 px-4 font-bold uppercase text-indigo-400">
                            {r.test_type}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-400">Status & Termination</td>
                        {comparisonReports.map((r) => (
                          <td key={r.test_id} className="py-2.5 px-4">
                            <span className="font-bold text-white block">{r.status}</span>
                            <span className="text-[11px] text-slate-400">{r.termination_reason}</span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-400">Elapsed Duration</td>
                        {comparisonReports.map((r) => (
                          <td key={r.test_id} className="py-2.5 px-4 font-mono font-medium">
                            {r.summary?.actual_duration_seconds}s
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-400">Workers / Intensity</td>
                        {comparisonReports.map((r) => (
                          <td key={r.test_id} className="py-2.5 px-4">
                            {r.config?.cpu_workers} workers @ {r.config?.cpu_intensity}%
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-400">Target Memory</td>
                        {comparisonReports.map((r) => (
                          <td key={r.test_id} className="py-2.5 px-4 font-mono">
                            {r.config?.memory_target_mb} MB
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-400">Average / Peak CPU</td>
                        {comparisonReports.map((r) => (
                          <td key={r.test_id} className="py-2.5 px-4 font-mono">
                            <span className="text-white font-bold">{r.summary?.avg_cpu_percent}%</span> / <span className="text-indigo-400 font-bold">{r.summary?.peak_cpu_percent}%</span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-400">Average / Peak RAM</td>
                        {comparisonReports.map((r) => (
                          <td key={r.test_id} className="py-2.5 px-4 font-mono">
                            <span className="text-white font-bold">{r.summary?.avg_ram_percent}%</span> / <span className="text-emerald-400 font-bold">{r.summary?.peak_ram_percent}%</span>
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-400">Telemetry Samples</td>
                        {comparisonReports.map((r) => (
                          <td key={r.test_id} className="py-2.5 px-4 font-mono text-slate-400">
                            {r.summary?.sample_count} points
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

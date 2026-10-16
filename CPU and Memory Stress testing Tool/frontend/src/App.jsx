import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ActiveTestBanner } from './components/ActiveTestBanner';
import { Dashboard } from './pages/Dashboard';
import { RunTest } from './pages/RunTest';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { TestHistory } from './pages/TestHistory';
import { ReportsComparison } from './pages/ReportsComparison';
import { SystemInfoPage } from './pages/SystemInfoPage';
import { SettingsPage } from './pages/SettingsPage';

import { useMetricsStream } from './hooks/useMetricsStream';
import {
  fetchSystemInfo,
  fetchSettings,
  fetchTestStatus,
  startStressTest,
  stopStressTest
} from './services/api';

export function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [systemInfo, setSystemInfo] = useState(null);
  const [safetySettings, setSafetySettings] = useState(null);
  const [testStatus, setTestStatus] = useState(null);

  const {
    latestMetrics,
    history,
    isConnected,
    sendInterval
  } = useMetricsStream(40);

  // Sync testStatus with latest live metrics if available
  useEffect(() => {
    if (latestMetrics) {
      setTestStatus((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          status: latestMetrics.test_status || prev.status,
          active_workers: latestMetrics.active_workers,
          allocated_memory_mb: latestMetrics.allocated_memory_mb,
          elapsed_seconds: latestMetrics.elapsed_seconds,
          progress_percent: prev.duration_seconds > 0 
            ? Math.min(100, Math.round((latestMetrics.elapsed_seconds / prev.duration_seconds) * 100))
            : prev.progress_percent
        };
      });
    }
  }, [latestMetrics]);

  // Load initial system specs and settings
  const refreshSystemData = useCallback(async () => {
    try {
      const [info, settings, status] = await Promise.all([
        fetchSystemInfo().catch(() => null),
        fetchSettings().catch(() => null),
        fetchTestStatus().catch(() => null),
      ]);
      if (info) setSystemInfo(info);
      if (settings) setSafetySettings(settings);
      if (status) setTestStatus(status);
    } catch (err) {
      console.error('Error fetching initial system metadata:', err);
    }
  }, []);

  useEffect(() => {
    refreshSystemData();
    // Poll test status every 3 seconds to keep sync
    const interval = setInterval(() => {
      fetchTestStatus().then(setTestStatus).catch(() => {});
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshSystemData]);

  const handleStartTest = async (config) => {
    const status = await startStressTest(config);
    setTestStatus(status);
    setActivePage('dashboard');
  };

  const handleStopTest = async () => {
    const status = await stopStressTest();
    setTestStatus(status);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        testStatus={testStatus}
        onStopTest={handleStopTest}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Sticky Active Test Banner */}
        <ActiveTestBanner
          testStatus={testStatus}
          onStopTest={handleStopTest}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <Dashboard
              metrics={latestMetrics}
              history={history}
              isConnected={isConnected}
              onNavigate={setActivePage}
              testStatus={testStatus}
            />
          )}

          {activePage === 'run-test' && (
            <RunTest
              metrics={latestMetrics}
              systemInfo={systemInfo}
              safetySettings={safetySettings}
              testStatus={testStatus}
              onStartTest={handleStartTest}
              onStopTest={handleStopTest}
            />
          )}

          {activePage === 'live-monitor' && (
            <LiveMonitoring
              metrics={latestMetrics}
              history={history}
              isConnected={isConnected}
              onSendInterval={sendInterval}
            />
          )}

          {activePage === 'history' && <TestHistory />}

          {activePage === 'comparison' && <ReportsComparison />}

          {activePage === 'system-info' && <SystemInfoPage systemInfo={systemInfo} />}

          {activePage === 'settings' && (
            <SettingsPage
              onSettingsUpdated={(newSettings) => setSafetySettings(newSettings)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

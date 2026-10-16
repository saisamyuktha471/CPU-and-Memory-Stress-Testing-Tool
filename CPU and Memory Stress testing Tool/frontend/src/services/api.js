const BASE_URL = '/api';

export async function fetchHealth() {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function fetchSystemInfo() {
  const res = await fetch(`${BASE_URL}/system/info`);
  if (!res.ok) throw new Error('Failed to load system information');
  return res.json();
}

export async function fetchSystemMetrics() {
  const res = await fetch(`${BASE_URL}/system/metrics`);
  if (!res.ok) throw new Error('Failed to load system metrics');
  return res.json();
}

export async function fetchTestStatus() {
  const res = await fetch(`${BASE_URL}/tests/status`);
  if (!res.ok) throw new Error('Failed to fetch test status');
  return res.json();
}

export async function startStressTest(config) {
  const res = await fetch(`${BASE_URL}/tests/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to start stress test');
  }
  return res.json();
}

export async function stopStressTest(testId) {
  const url = testId ? `${BASE_URL}/tests/${testId}/stop` : `${BASE_URL}/tests/stop`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to stop stress test');
  }
  return res.json();
}

export async function fetchTestHistory() {
  const res = await fetch(`${BASE_URL}/tests/history`);
  if (!res.ok) throw new Error('Failed to fetch test history');
  return res.json();
}

export async function fetchTestReport(testId) {
  const res = await fetch(`${BASE_URL}/tests/${testId}/report`);
  if (!res.ok) throw new Error(`Failed to load report for ${testId}`);
  return res.json();
}

export async function deleteTestReport(testId) {
  const res = await fetch(`${BASE_URL}/tests/${testId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete report ${testId}`);
  return res.json();
}

export async function clearAllTestHistory() {
  const res = await fetch(`${BASE_URL}/tests/`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear test history');
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${BASE_URL}/settings`);
  if (!res.ok) throw new Error('Failed to fetch safety settings');
  return res.json();
}

export async function updateSettings(settingsData) {
  const res = await fetch(`${BASE_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settingsData)
  });
  if (!res.ok) throw new Error('Failed to update safety settings');
  return res.json();
}

export async function resetSettings() {
  const res = await fetch(`${BASE_URL}/settings/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset safety settings');
  return res.json();
}

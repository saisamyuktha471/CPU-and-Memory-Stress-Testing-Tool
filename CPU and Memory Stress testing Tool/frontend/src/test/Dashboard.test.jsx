import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dashboard } from '../pages/Dashboard';

describe('Dashboard Component', () => {
  const mockMetrics = {
    cpu_percent: 45.5,
    cpu_cores_percent: [40, 50, 45, 47],
    ram_percent: 62.1,
    ram_total_mb: 16000,
    ram_used_mb: 9936,
    ram_available_mb: 6064,
    swap_percent: 20.0,
    swap_total_mb: 4000,
    swap_used_mb: 800,
    cpu_frequency_mhz: 2400.0,
    uptime_seconds: 3600,
  };

  const mockTestStatus = {
    status: 'idle',
    active_workers: 0,
  };

  it('renders dashboard title and metric cards with actual values', () => {
    render(
      <Dashboard
        metrics={mockMetrics}
        history={[]}
        isConnected={true}
        onNavigate={vi.fn()}
        testStatus={mockTestStatus}
      />
    );

    expect(screen.getByText(/System Telemetry & Performance Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText('45.5%')).toBeInTheDocument();
    expect(screen.getByText('62.1%')).toBeInTheDocument();
    expect(screen.getByText(/Telemetry Streaming/i)).toBeInTheDocument();
  });
});

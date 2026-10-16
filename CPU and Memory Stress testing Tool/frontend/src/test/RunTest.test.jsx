import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RunTest } from '../pages/RunTest';

describe('RunTest Component', () => {
  const mockSystemInfo = {
    physical_cores: 4,
    logical_cores: 8,
    total_ram_mb: 16000,
  };

  const mockSafetySettings = {
    max_duration_seconds: 300,
    max_cpu_workers: 16,
    min_available_ram_mb: 1024,
    ram_reserve_percent: 15.0,
  };

  const mockMetrics = {
    ram_available_mb: 4000,
  };

  it('renders configuration inputs and allows test type selection', () => {
    const handleStart = vi.fn();
    render(
      <RunTest
        metrics={mockMetrics}
        systemInfo={mockSystemInfo}
        safetySettings={mockSafetySettings}
        testStatus={{ status: 'idle' }}
        onStartTest={handleStart}
        onStopTest={vi.fn()}
      />
    );

    expect(screen.getByText(/Stress Test Configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/CPU Only/i)).toBeInTheDocument();
    expect(screen.getByText(/RAM Only/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Combined/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/START STRESS TEST/i)).toBeInTheDocument();
  });
});

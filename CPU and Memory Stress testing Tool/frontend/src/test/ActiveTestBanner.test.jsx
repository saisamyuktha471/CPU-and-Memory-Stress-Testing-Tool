import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ActiveTestBanner } from '../components/ActiveTestBanner';

describe('ActiveTestBanner Component', () => {
  it('renders nothing when test status is idle', () => {
    const { container } = render(
      <ActiveTestBanner testStatus={{ status: 'idle' }} onStopTest={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders progress and abort button when test is running', () => {
    const handleStop = vi.fn();
    render(
      <ActiveTestBanner
        testStatus={{
          status: 'running',
          name: 'Memory Benchmark',
          test_type: 'memory',
          active_workers: 1,
          allocated_memory_mb: 512,
          elapsed_seconds: 10,
          duration_seconds: 30,
          progress_percent: 33,
        }}
        onStopTest={handleStop}
      />
    );

    expect(screen.getByText('Memory Benchmark')).toBeInTheDocument();
    expect(screen.getByText('ABORT TEST')).toBeInTheDocument();
    expect(screen.getByText(/512 MB/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('ABORT TEST'));
    expect(handleStop).toHaveBeenCalled();
  });
});

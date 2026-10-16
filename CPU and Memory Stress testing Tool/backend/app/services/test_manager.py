import asyncio
import time
import uuid
from datetime import datetime, timezone
from typing import Optional, List
import psutil

from ..config import settings
from ..models.schemas import (
    TestStatus,
    StressTestType,
    StartTestRequest,
    TestStatusResponse,
    MetricSnapshot,
    TestReport,
    TestSummaryStats
)
from .monitor import monitor
from .cpu_stress import CPUStressEngine
from .memory_stress import MemoryStressEngine
from .report_service import report_service

class TestManager:
    def __init__(self):
        self._cpu_engine = CPUStressEngine()
        self._memory_engine = MemoryStressEngine()
        self._status: TestStatus = TestStatus.IDLE
        self._current_config: Optional[StartTestRequest] = None
        self._test_id: Optional[str] = None
        self._start_time_iso: Optional[str] = None
        self._start_timestamp: float = 0.0
        self._elapsed_seconds: float = 0.0
        self._termination_reason: Optional[str] = None
        self._metrics_log: List[MetricSnapshot] = []
        self._latest_metrics: Optional[MetricSnapshot] = None
        self._task: Optional[asyncio.Task] = None
        self._stop_event = asyncio.Event()

    @property
    def status(self) -> TestStatus:
        return self._status

    @property
    def current_test_id(self) -> Optional[str]:
        return self._test_id

    def get_latest_metrics(self) -> MetricSnapshot:
        if self._latest_metrics:
            return self._latest_metrics
        return monitor.get_metrics_snapshot(
            active_workers=0,
            allocated_memory_mb=0.0,
            test_status=self._status.value,
            test_id=self._test_id,
            elapsed_seconds=self._elapsed_seconds
        )

    def get_status_response(self) -> TestStatusResponse:
        elapsed = 0.0
        progress = 0.0
        duration = 0.0
        if self._current_config:
            duration = float(self._current_config.duration_seconds)
            if self._status in [TestStatus.RUNNING, TestStatus.STARTING, TestStatus.STOPPING]:
                elapsed = max(0.0, time.time() - self._start_timestamp)
                progress = min(100.0, (elapsed / duration) * 100.0) if duration > 0 else 0.0
            else:
                elapsed = self._elapsed_seconds
                progress = 100.0 if self._status == TestStatus.COMPLETED else (
                    min(100.0, (elapsed / duration) * 100.0) if duration > 0 else 0.0
                )

        active_workers = self._cpu_engine.get_active_worker_count()
        alloc_mem = self._memory_engine.allocated_memory_mb

        return TestStatusResponse(
            status=self._status,
            test_id=self._test_id,
            name=self._current_config.name if self._current_config else None,
            test_type=self._current_config.test_type if self._current_config else None,
            duration_seconds=duration,
            elapsed_seconds=round(elapsed, 1),
            progress_percent=round(progress, 1),
            active_workers=active_workers,
            allocated_memory_mb=round(alloc_mem, 1),
            termination_reason=self._termination_reason,
            latest_metrics=self._latest_metrics
        )

    def validate_request(self, req: StartTestRequest) -> Optional[str]:
        """
        Validate safety bounds before test start. Returns error message if invalid.
        """
        if self._status in [TestStatus.RUNNING, TestStatus.STARTING, TestStatus.STOPPING]:
            return "A stress test is already running. Please stop or wait for it to complete."

        if req.duration_seconds > settings.safety.max_duration_seconds:
            return f"Duration {req.duration_seconds}s exceeds maximum safety limit of {settings.safety.max_duration_seconds}s."

        if req.duration_seconds < 5:
            return "Duration must be at least 5 seconds."

        if req.test_type in [StressTestType.CPU, StressTestType.COMBINED]:
            if req.cpu_workers > settings.safety.max_cpu_workers:
                return f"CPU workers ({req.cpu_workers}) exceeds maximum limit ({settings.safety.max_cpu_workers})."

        if req.test_type in [StressTestType.MEMORY, StressTestType.COMBINED]:
            vm = psutil.virtual_memory()
            avail_mb = vm.available / (1024 * 1024)
            # Ensure safety reserve
            reserve_mb = max(
                settings.safety.min_available_ram_mb,
                (vm.total / (1024 * 1024)) * (settings.safety.ram_reserve_percent / 100.0)
            )
            safe_budget_mb = avail_mb - reserve_mb
            if safe_budget_mb <= 100:
                return f"System memory is low ({avail_mb:.0f} MB available, safety reserve requires {reserve_mb:.0f} MB). Cannot start memory test safely."
            if req.memory_target_mb > safe_budget_mb:
                return f"Requested memory ({req.memory_target_mb} MB) exceeds safe budget ({safe_budget_mb:.0f} MB, reserving {reserve_mb:.0f} MB for OS/apps)."

        return None

    async def start_test(self, req: StartTestRequest) -> TestStatusResponse:
        err = self.validate_request(req)
        if err:
            raise ValueError(err)

        self._status = TestStatus.STARTING
        self._current_config = req
        self._test_id = f"test_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        self._start_time_iso = datetime.now(timezone.utc).isoformat()
        self._start_timestamp = time.time()
        self._elapsed_seconds = 0.0
        self._termination_reason = None
        self._metrics_log = []
        self._stop_event = asyncio.Event()

        # Launch orchestration background task
        self._task = asyncio.create_task(self._run_test_loop())
        return self.get_status_response()

    async def stop_test(self, test_id: Optional[str] = None, reason: str = "Manually stopped by user") -> TestStatusResponse:
        if self._status not in [TestStatus.RUNNING, TestStatus.STARTING]:
            return self.get_status_response()

        if test_id and self._test_id and test_id != self._test_id:
            raise ValueError(f"Test ID {test_id} does not match active test ID {self._test_id}")

        self._status = TestStatus.STOPPING
        self._termination_reason = reason
        self._stop_event.set()

        # Await task cancellation or completion
        if self._task and not self._task.done():
            try:
                await asyncio.wait_for(self._task, timeout=3.0)
            except Exception:
                pass

        self._force_cleanup_engines()
        self._status = TestStatus.STOPPED
        return self.get_status_response()

    def _force_cleanup_engines(self):
        try:
            self._cpu_engine.stop()
        except Exception:
            pass
        try:
            self._memory_engine.stop()
        except Exception:
            pass

    async def _run_test_loop(self):
        cfg = self._current_config
        req_type = cfg.test_type
        vm = psutil.virtual_memory()
        reserve_mb = int(max(
            settings.safety.min_available_ram_mb,
            (vm.total / (1024 * 1024)) * (settings.safety.ram_reserve_percent / 100.0)
        ))

        # Warmup if requested
        if cfg.warmup_seconds > 0:
            for _ in range(cfg.warmup_seconds):
                if self._stop_event.is_set():
                    self._finalize_test(TestStatus.STOPPED, self._termination_reason or "Cancelled during warmup")
                    return
                await asyncio.sleep(1.0)

        # Start workload engines
        try:
            if req_type in [StressTestType.CPU, StressTestType.COMBINED]:
                self._cpu_engine.start(cfg.cpu_workers, cfg.cpu_intensity)

            if req_type in [StressTestType.MEMORY, StressTestType.COMBINED]:
                self._memory_engine.start(cfg.memory_target_mb, min_reserve_mb=reserve_mb)
        except Exception as e:
            self._force_cleanup_engines()
            self._finalize_test(TestStatus.FAILED, f"Engine start failed: {str(e)}")
            return

        self._status = TestStatus.RUNNING
        interval = max(0.2, min(5.0, cfg.monitoring_interval))
        duration = cfg.duration_seconds
        start_t = time.time()

        while not self._stop_event.is_set():
            now = time.time()
            elapsed = now - start_t
            self._elapsed_seconds = elapsed

            # Read metrics
            workers = self._cpu_engine.get_active_worker_count()
            alloc_mb = self._memory_engine.allocated_memory_mb
            snapshot = monitor.get_metrics_snapshot(
                active_workers=workers,
                allocated_memory_mb=alloc_mb,
                test_status=self._status.value,
                test_id=self._test_id,
                elapsed_seconds=elapsed
            )
            self._latest_metrics = snapshot
            self._metrics_log.append(snapshot)

            # Safety check: memory safety trigger
            if self._memory_engine.safety_triggered:
                self._finalize_test(TestStatus.STOPPED, "Safety limit activated: RAM reserve threshold reached")
                return

            # Check duration
            if elapsed >= duration:
                self._finalize_test(TestStatus.COMPLETED, "Completed configured duration")
                return

            # Responsive sleep slice until interval or stop requested
            slice_end = time.time() + interval
            while time.time() < slice_end and not self._stop_event.is_set():
                await asyncio.sleep(min(0.1, max(0.01, slice_end - time.time())))

        # Loop exited due to stop_event
        self._finalize_test(TestStatus.STOPPED, self._termination_reason or "Manually stopped by user")

    def _finalize_test(self, final_status: TestStatus, reason: str):
        self._status = final_status
        self._termination_reason = reason
        self._force_cleanup_engines()

        end_time_iso = datetime.now(timezone.utc).isoformat()
        actual_duration = self._elapsed_seconds

        # Compute summary
        summary = report_service.calculate_summary(
            self._metrics_log,
            self._current_config,
            actual_duration
        )

        # Assemble full report
        report = TestReport(
            test_id=self._test_id or "unknown",
            name=self._current_config.name if self._current_config else "Stress Test",
            test_type=self._current_config.test_type.value if self._current_config else "cpu",
            status=final_status.value,
            termination_reason=reason,
            start_time=self._start_time_iso or end_time_iso,
            end_time=end_time_iso,
            config=self._current_config or StartTestRequest(),
            system_info=monitor.get_system_info(),
            summary=summary,
            metrics=self._metrics_log
        )

        # Persist report
        report_service.save_report(report)

    def shutdown(self):
        """
        Cleanup on application shutdown.
        """
        self._stop_event.set()
        self._force_cleanup_engines()

test_manager = TestManager()

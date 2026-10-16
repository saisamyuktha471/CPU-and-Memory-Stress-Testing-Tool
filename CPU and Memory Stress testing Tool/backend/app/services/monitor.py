import time
import platform
from datetime import datetime, timezone
from typing import Optional, List
import psutil
from ..config import settings
from ..models.schemas import SystemInfo, MetricSnapshot

# Prime psutil CPU counters on module load
try:
    psutil.cpu_percent(interval=None)
    psutil.cpu_percent(interval=None, percpu=True)
except Exception:
    pass

class SystemMonitor:
    def __init__(self):
        self._boot_time = psutil.boot_time()
        # Initial call to prime measurement
        psutil.cpu_percent(interval=None)
        psutil.cpu_percent(interval=None, percpu=True)

    def get_system_info(self) -> SystemInfo:
        vm = psutil.virtual_memory()
        phys_cores = psutil.cpu_count(logical=False) or 1
        log_cores = psutil.cpu_count(logical=True) or 1
        
        proc_name = platform.processor() or "Unknown Processor"
        
        return SystemInfo(
            os_name=platform.system(),
            os_release=platform.release(),
            os_version=platform.version(),
            os_platform=platform.platform(),
            python_version=platform.python_version(),
            cpu_architecture=platform.machine(),
            processor=proc_name,
            physical_cores=phys_cores,
            logical_cores=log_cores,
            total_ram_mb=round(vm.total / (1024 * 1024), 2),
            total_ram_bytes=vm.total,
            app_version=settings.app_version
        )

    def get_metrics_snapshot(
        self,
        active_workers: int = 0,
        allocated_memory_mb: float = 0.0,
        test_status: str = "idle",
        test_id: Optional[str] = None,
        elapsed_seconds: float = 0.0
    ) -> MetricSnapshot:
        now_ts = time.time()
        now_iso = datetime.now(timezone.utc).isoformat()
        
        cpu_total = psutil.cpu_percent(interval=None)
        cpu_cores: List[float] = psutil.cpu_percent(interval=None, percpu=True)
        
        vm = psutil.virtual_memory()
        swap = psutil.swap_memory()
        
        freq_mhz: Optional[float] = None
        try:
            freq_info = psutil.cpu_freq()
            if freq_info and freq_info.current:
                freq_mhz = round(freq_info.current, 1)
        except Exception:
            freq_mhz = None
            
        uptime = round(now_ts - self._boot_time, 1)

        return MetricSnapshot(
            timestamp=now_ts,
            timestamp_iso=now_iso,
            cpu_percent=round(cpu_total, 1),
            cpu_cores_percent=[round(c, 1) for c in cpu_cores],
            ram_total_mb=round(vm.total / (1024 * 1024), 1),
            ram_used_mb=round(vm.used / (1024 * 1024), 1),
            ram_available_mb=round(vm.available / (1024 * 1024), 1),
            ram_percent=round(vm.percent, 1),
            swap_total_mb=round(swap.total / (1024 * 1024), 1),
            swap_used_mb=round(swap.used / (1024 * 1024), 1),
            swap_percent=round(swap.percent, 1),
            cpu_frequency_mhz=freq_mhz,
            uptime_seconds=uptime,
            active_workers=active_workers,
            allocated_memory_mb=round(allocated_memory_mb, 1),
            test_status=test_status,
            test_id=test_id,
            elapsed_seconds=round(elapsed_seconds, 1)
        )

# Global monitor instance
monitor = SystemMonitor()

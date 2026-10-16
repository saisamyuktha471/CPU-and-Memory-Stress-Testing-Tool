from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class StressTestType(str, Enum):
    CPU = "cpu"
    MEMORY = "memory"
    COMBINED = "combined"

class TestStatus(str, Enum):
    IDLE = "idle"
    STARTING = "starting"
    RUNNING = "running"
    STOPPING = "stopping"
    COMPLETED = "completed"
    STOPPED = "stopped"
    FAILED = "failed"

class SystemInfo(BaseModel):
    os_name: str
    os_release: str
    os_version: str
    os_platform: str
    python_version: str
    cpu_architecture: str
    processor: str
    physical_cores: int
    logical_cores: int
    total_ram_mb: float
    total_ram_bytes: int
    app_version: str

class MetricSnapshot(BaseModel):
    timestamp: float
    timestamp_iso: str
    cpu_percent: float
    cpu_cores_percent: List[float] = Field(default_factory=list)
    ram_total_mb: float
    ram_used_mb: float
    ram_available_mb: float
    ram_percent: float
    swap_total_mb: float
    swap_used_mb: float
    swap_percent: float
    cpu_frequency_mhz: Optional[float] = None
    uptime_seconds: float
    active_workers: int = 0
    allocated_memory_mb: float = 0.0
    test_status: str = "idle"
    test_id: Optional[str] = None
    elapsed_seconds: float = 0.0

class StartTestRequest(BaseModel):
    name: str = Field(default="Stress Test", max_length=100)
    test_type: StressTestType = Field(default=StressTestType.CPU)
    cpu_workers: int = Field(default=2, ge=1, le=64)
    cpu_intensity: int = Field(default=100, ge=10, le=100, description="Percentage of compute vs sleep cycle")
    memory_target_mb: int = Field(default=512, ge=50, description="Target memory allocation in megabytes")
    duration_seconds: int = Field(default=30, ge=5, le=300, description="Duration in seconds")
    monitoring_interval: float = Field(default=1.0, ge=0.2, le=5.0)
    warmup_seconds: int = Field(default=0, ge=0, le=30)

class TestStatusResponse(BaseModel):
    status: TestStatus
    test_id: Optional[str] = None
    name: Optional[str] = None
    test_type: Optional[StressTestType] = None
    duration_seconds: float = 0.0
    elapsed_seconds: float = 0.0
    progress_percent: float = 0.0
    active_workers: int = 0
    allocated_memory_mb: float = 0.0
    termination_reason: Optional[str] = None
    latest_metrics: Optional[MetricSnapshot] = None

class TestSummaryStats(BaseModel):
    avg_cpu_percent: float = 0.0
    peak_cpu_percent: float = 0.0
    avg_ram_percent: float = 0.0
    peak_ram_percent: float = 0.0
    configured_memory_mb: int = 0
    peak_allocated_memory_mb: float = 0.0
    actual_duration_seconds: float = 0.0
    sample_count: int = 0
    cpu_workers: int = 0
    cpu_intensity: int = 100

class TestReport(BaseModel):
    test_id: str
    name: str
    test_type: str
    status: str
    termination_reason: str
    start_time: str
    end_time: Optional[str] = None
    config: StartTestRequest
    system_info: SystemInfo
    summary: TestSummaryStats
    metrics: List[MetricSnapshot] = Field(default_factory=list)

class TestReportSummary(BaseModel):
    test_id: str
    name: str
    test_type: str
    status: str
    termination_reason: str
    start_time: str
    end_time: Optional[str] = None
    actual_duration_seconds: float
    avg_cpu_percent: float
    peak_cpu_percent: float
    avg_ram_percent: float
    peak_ram_percent: float
    peak_allocated_memory_mb: float
    sample_count: int

class SafetySettingsUpdate(BaseModel):
    max_duration_seconds: Optional[int] = Field(default=None, ge=5, le=300)
    default_duration_seconds: Optional[int] = Field(default=None, ge=5, le=300)
    max_cpu_workers: Optional[int] = Field(default=None, ge=1, le=64)
    min_available_ram_mb: Optional[int] = Field(default=None, ge=256)
    ram_reserve_percent: Optional[float] = Field(default=None, ge=5.0, le=50.0)
    default_monitoring_interval: Optional[float] = Field(default=None, ge=0.2, le=5.0)
    warning_cpu_threshold: Optional[float] = Field(default=None, ge=50.0, le=100.0)
    warning_ram_threshold: Optional[float] = Field(default=None, ge=50.0, le=100.0)

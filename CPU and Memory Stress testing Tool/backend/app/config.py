import os
from pathlib import Path
from pydantic import BaseModel, Field

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
REPORTS_DIR = DATA_DIR / "reports"

# Ensure data directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

class SafetySettings(BaseModel):
    max_duration_seconds: int = Field(default=300, ge=5, le=300, description="Absolute maximum allowed duration in seconds")
    default_duration_seconds: int = Field(default=30, ge=5, le=300, description="Default test duration")
    max_cpu_workers: int = Field(default=16, ge=1, le=64, description="Maximum CPU workers allowed")
    min_available_ram_mb: int = Field(default=1024, ge=256, description="Minimum RAM that must remain available (safety reserve)")
    ram_reserve_percent: float = Field(default=15.0, ge=5.0, le=50.0, description="Percentage of total RAM reserved for OS/apps")
    default_monitoring_interval: float = Field(default=1.0, ge=0.2, le=5.0, description="Metrics polling interval in seconds")
    warning_cpu_threshold: float = Field(default=90.0, ge=50.0, le=100.0, description="CPU usage warning threshold")
    warning_ram_threshold: float = Field(default=85.0, ge=50.0, le=100.0, description="RAM usage warning threshold")

class Settings(BaseModel):
    app_name: str = "CPU and Memory Stress Testing Tool"
    app_version: str = "1.0.0"
    safety: SafetySettings = SafetySettings()

settings = Settings()

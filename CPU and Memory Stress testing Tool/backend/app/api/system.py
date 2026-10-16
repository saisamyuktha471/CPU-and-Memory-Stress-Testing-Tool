from fastapi import APIRouter
from ..models.schemas import SystemInfo, MetricSnapshot, SafetySettingsUpdate
from ..config import settings, SafetySettings
from ..services.monitor import monitor
from ..services.test_manager import test_manager

router = APIRouter(tags=["System"])

@router.get("/health")
def get_health():
    return {
        "status": "ok",
        "app": settings.app_name,
        "version": settings.app_version
    }

@router.get("/system/info", response_model=SystemInfo)
def get_system_info():
    return monitor.get_system_info()

@router.get("/system/metrics", response_model=MetricSnapshot)
def get_system_metrics():
    return test_manager.get_latest_metrics()

@router.get("/settings", response_model=SafetySettings)
def get_settings():
    return settings.safety

@router.post("/settings", response_model=SafetySettings)
def update_settings(update_data: SafetySettingsUpdate):
    for field, value in update_data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(settings.safety, field, value)
    return settings.safety

@router.post("/settings/reset", response_model=SafetySettings)
def reset_settings():
    settings.safety = SafetySettings()
    return settings.safety

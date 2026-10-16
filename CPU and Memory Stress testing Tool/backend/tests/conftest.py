import pytest
import tempfile
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.report_service import ReportService
import backend.app.services.report_service as report_service_module
import backend.app.services.test_manager as test_manager_module

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def temp_reports_dir(tmp_path):
    orig_service = report_service_module.report_service
    test_service = ReportService(reports_dir=tmp_path)
    report_service_module.report_service = test_service
    test_manager_module.report_service = test_service
    yield tmp_path
    report_service_module.report_service = orig_service
    test_manager_module.report_service = orig_service

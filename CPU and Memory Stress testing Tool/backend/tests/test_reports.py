import json
from pathlib import Path
from backend.app.models.schemas import (
    TestReport,
    StartTestRequest,
    SystemInfo,
    TestSummaryStats,
    MetricSnapshot
)
from backend.app.services.report_service import ReportService

def test_save_load_and_export_reports(tmp_path):
    svc = ReportService(reports_dir=tmp_path)

    sys_info = SystemInfo(
        os_name="Windows",
        os_release="11",
        os_version="10.0",
        os_platform="Windows-11",
        python_version="3.12.0",
        cpu_architecture="AMD64",
        processor="Test CPU",
        physical_cores=4,
        logical_cores=8,
        total_ram_mb=16000.0,
        total_ram_bytes=16777216000,
        app_version="1.0.0"
    )

    req = StartTestRequest(name="Unit Test Report", duration_seconds=10)
    summary = TestSummaryStats(
        avg_cpu_percent=45.2,
        peak_cpu_percent=78.5,
        avg_ram_percent=60.0,
        peak_ram_percent=65.0,
        actual_duration_seconds=10.0,
        sample_count=2
    )

    metrics = [
        MetricSnapshot(
            timestamp=1000.0,
            timestamp_iso="2026-10-15T12:00:00Z",
            cpu_percent=40.0,
            cpu_cores_percent=[40.0, 40.0],
            ram_total_mb=16000.0,
            ram_used_mb=9600.0,
            ram_available_mb=6400.0,
            ram_percent=60.0,
            swap_total_mb=4000.0,
            swap_used_mb=1000.0,
            swap_percent=25.0,
            uptime_seconds=500.0,
            elapsed_seconds=1.0
        ),
        MetricSnapshot(
            timestamp=1001.0,
            timestamp_iso="2026-10-15T12:00:01Z",
            cpu_percent=50.4,
            cpu_cores_percent=[50.0, 50.8],
            ram_total_mb=16000.0,
            ram_used_mb=9600.0,
            ram_available_mb=6400.0,
            ram_percent=60.0,
            swap_total_mb=4000.0,
            swap_used_mb=1000.0,
            swap_percent=25.0,
            uptime_seconds=501.0,
            elapsed_seconds=2.0
        )
    ]

    report = TestReport(
        test_id="test_sample_123",
        name="Sample Report",
        test_type="cpu",
        status="completed",
        termination_reason="Finished",
        start_time="2026-10-15T12:00:00Z",
        end_time="2026-10-15T12:00:10Z",
        config=req,
        system_info=sys_info,
        summary=summary,
        metrics=metrics
    )

    # Save
    assert svc.save_report(report) is True

    # Load
    loaded = svc.get_report("test_sample_123")
    assert loaded is not None
    assert loaded.name == "Sample Report"
    assert len(loaded.metrics) == 2

    # CSV Export
    csv_str = svc.export_csv("test_sample_123")
    assert csv_str is not None
    assert "timestamp,timestamp_iso,elapsed_seconds" in csv_str
    assert "cpu_core_0_percent" in csv_str

    # Summaries
    summaries = svc.get_all_summaries()
    assert len(summaries) == 1
    assert summaries[0].test_id == "test_sample_123"

    # Delete
    assert svc.delete_report("test_sample_123") is True
    assert svc.get_report("test_sample_123") is None

def test_corrupted_report_graceful_handling(tmp_path):
    svc = ReportService(reports_dir=tmp_path)
    corrupted_file = tmp_path / "bad_report.json"
    corrupted_file.write_text("{ incomplete json ...", encoding="utf-8")

    # Should not crash
    summaries = svc.get_all_summaries()
    assert len(summaries) == 0

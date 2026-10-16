import os
import json
import csv
import io
import re
from pathlib import Path
from typing import List, Optional
from ..config import REPORTS_DIR
from ..models.schemas import (
    TestReport,
    TestReportSummary,
    TestSummaryStats,
    MetricSnapshot,
    StartTestRequest
)

SAFE_ID_REGEX = re.compile(r"^[a-zA-Z0-9_\-]+$")

class ReportService:
    def __init__(self, reports_dir: Path = REPORTS_DIR):
        self.reports_dir = reports_dir
        self.reports_dir.mkdir(parents=True, exist_ok=True)

    def _get_report_path(self, test_id: str) -> Optional[Path]:
        if not SAFE_ID_REGEX.match(test_id):
            return None
        file_path = (self.reports_dir / f"{test_id}.json").resolve()
        # Prevent path traversal
        if not str(file_path).startswith(str(self.reports_dir.resolve())):
            return None
        return file_path

    def calculate_summary(
        self,
        metrics: List[MetricSnapshot],
        config: StartTestRequest,
        actual_duration: float
    ) -> TestSummaryStats:
        if not metrics:
            return TestSummaryStats(
                configured_memory_mb=config.memory_target_mb,
                actual_duration_seconds=round(actual_duration, 2),
                cpu_workers=config.cpu_workers,
                cpu_intensity=config.cpu_intensity
            )

        cpu_vals = [m.cpu_percent for m in metrics]
        ram_vals = [m.ram_percent for m in metrics]
        alloc_vals = [m.allocated_memory_mb for m in metrics]

        return TestSummaryStats(
            avg_cpu_percent=round(sum(cpu_vals) / len(cpu_vals), 1),
            peak_cpu_percent=round(max(cpu_vals), 1),
            avg_ram_percent=round(sum(ram_vals) / len(ram_vals), 1),
            peak_ram_percent=round(max(ram_vals), 1),
            configured_memory_mb=config.memory_target_mb,
            peak_allocated_memory_mb=round(max(alloc_vals), 1) if alloc_vals else 0.0,
            actual_duration_seconds=round(actual_duration, 2),
            sample_count=len(metrics),
            cpu_workers=config.cpu_workers,
            cpu_intensity=config.cpu_intensity
        )

    def save_report(self, report: TestReport) -> bool:
        path = self._get_report_path(report.test_id)
        if not path:
            return False
        try:
            temp_path = path.with_suffix(".tmp")
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(report.model_dump(), f, indent=2)
            temp_path.replace(path)
            return True
        except Exception:
            return False

    def get_report(self, test_id: str) -> Optional[TestReport]:
        path = self._get_report_path(test_id)
        if not path or not path.exists():
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return TestReport.model_validate(data)
        except Exception:
            return None

    def get_all_summaries(self) -> List[TestReportSummary]:
        summaries: List[TestReportSummary] = []
        for file in self.reports_dir.glob("*.json"):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                summary_data = data.get("summary", {})
                summaries.append(
                    TestReportSummary(
                        test_id=data.get("test_id", file.stem),
                        name=data.get("name", "Unnamed Test"),
                        test_type=data.get("test_type", "cpu"),
                        status=data.get("status", "completed"),
                        termination_reason=data.get("termination_reason", "Completed"),
                        start_time=data.get("start_time", ""),
                        end_time=data.get("end_time"),
                        actual_duration_seconds=summary_data.get("actual_duration_seconds", 0.0),
                        avg_cpu_percent=summary_data.get("avg_cpu_percent", 0.0),
                        peak_cpu_percent=summary_data.get("peak_cpu_percent", 0.0),
                        avg_ram_percent=summary_data.get("avg_ram_percent", 0.0),
                        peak_ram_percent=summary_data.get("peak_ram_percent", 0.0),
                        peak_allocated_memory_mb=summary_data.get("peak_allocated_memory_mb", 0.0),
                        sample_count=summary_data.get("sample_count", 0)
                    )
                )
            except Exception:
                # Gracefully skip corrupted files
                continue

        # Sort newest first
        summaries.sort(key=lambda x: x.start_time, reverse=True)
        return summaries

    def delete_report(self, test_id: str) -> bool:
        path = self._get_report_path(test_id)
        if not path or not path.exists():
            return False
        try:
            path.unlink()
            return True
        except Exception:
            return False

    def clear_all(self) -> int:
        count = 0
        for file in self.reports_dir.glob("*.json"):
            try:
                file.unlink()
                count += 1
            except Exception:
                pass
        return count

    def export_csv(self, test_id: str) -> Optional[str]:
        report = self.get_report(test_id)
        if not report or not report.metrics:
            return None

        output = io.StringIO()
        first_metric = report.metrics[0]
        num_cores = len(first_metric.cpu_cores_percent)

        fieldnames = [
            "timestamp",
            "timestamp_iso",
            "elapsed_seconds",
            "cpu_percent",
            "ram_used_mb",
            "ram_available_mb",
            "ram_total_mb",
            "ram_percent",
            "swap_percent",
            "allocated_memory_mb",
            "active_workers",
        ]
        for c in range(num_cores):
            fieldnames.append(f"cpu_core_{c}_percent")

        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        for m in report.metrics:
            row = {
                "timestamp": m.timestamp,
                "timestamp_iso": m.timestamp_iso,
                "elapsed_seconds": m.elapsed_seconds,
                "cpu_percent": m.cpu_percent,
                "ram_used_mb": m.ram_used_mb,
                "ram_available_mb": m.ram_available_mb,
                "ram_total_mb": m.ram_total_mb,
                "ram_percent": m.ram_percent,
                "swap_percent": m.swap_percent,
                "allocated_memory_mb": m.allocated_memory_mb,
                "active_workers": m.active_workers,
            }
            for c_idx, c_val in enumerate(m.cpu_cores_percent):
                row[f"cpu_core_{c_idx}_percent"] = c_val
            writer.writerow(row)

        return output.getvalue()

report_service = ReportService()

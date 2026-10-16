from fastapi import APIRouter, HTTPException, Response, status
from typing import List
from ..models.schemas import TestReport, TestReportSummary
from ..services.report_service import report_service

router = APIRouter(prefix="/tests", tags=["Reports"])

@router.get("/history", response_model=List[TestReportSummary])
def get_test_history():
    return report_service.get_all_summaries()

@router.get("/{test_id}/report", response_model=TestReport)
def get_test_report(test_id: str):
    report = report_service.get_report(test_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{test_id}' not found."
        )
    return report

@router.get("/{test_id}/export/json")
def export_test_json(test_id: str):
    report = report_service.get_report(test_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{test_id}' not found."
        )
    json_str = report.model_dump_json(indent=2)
    return Response(
        content=json_str,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{test_id}.json"'}
    )

@router.get("/{test_id}/export/csv")
def export_test_csv(test_id: str):
    csv_data = report_service.export_csv(test_id)
    if not csv_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Metrics data for report '{test_id}' not found."
        )
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{test_id}_metrics.csv"'}
    )

@router.delete("/{test_id}")
def delete_test_report(test_id: str):
    success = report_service.delete_report(test_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{test_id}' not found or could not be deleted."
        )
    return {"status": "deleted", "test_id": test_id}

@router.delete("/")
def clear_all_test_history():
    count = report_service.clear_all()
    return {"status": "cleared", "deleted_count": count}

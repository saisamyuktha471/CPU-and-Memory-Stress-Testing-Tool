from fastapi import APIRouter, HTTPException, status
from typing import Optional
from ..models.schemas import StartTestRequest, TestStatusResponse
from ..services.test_manager import test_manager

router = APIRouter(prefix="/tests", tags=["Tests"])

@router.post("/start", response_model=TestStatusResponse)
async def start_stress_test(request: StartTestRequest):
    try:
        return await test_manager.start_test(request)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to start test: {str(e)}")

@router.post("/{test_id}/stop", response_model=TestStatusResponse)
async def stop_stress_test(test_id: str):
    try:
        return await test_manager.stop_test(test_id=test_id, reason="Stopped via test ID endpoint")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/stop", response_model=TestStatusResponse)
async def stop_active_test():
    try:
        return await test_manager.stop_test(reason="Stopped by user control")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/status", response_model=TestStatusResponse)
def get_test_status():
    return test_manager.get_status_response()

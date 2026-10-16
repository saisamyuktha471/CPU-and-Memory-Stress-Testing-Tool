import asyncio
import pytest
import httpx
from backend.app.main import app

def test_validation_rejects_excessive_duration(client):
    payload = {
        "name": "Invalid Duration Test",
        "test_type": "cpu",
        "cpu_workers": 2,
        "cpu_intensity": 50,
        "memory_target_mb": 100,
        "duration_seconds": 9999,  # exceeds 300
        "monitoring_interval": 1.0
    }
    res = client.post("/api/tests/start", json=payload)
    assert res.status_code == 422 or res.status_code == 400

def test_validation_rejects_excessive_memory(client):
    payload = {
        "name": "Excessive Memory Test",
        "test_type": "memory",
        "cpu_workers": 1,
        "cpu_intensity": 50,
        "memory_target_mb": 999999,  # Far exceeds system RAM
        "duration_seconds": 10,
        "monitoring_interval": 1.0
    }
    res = client.post("/api/tests/start", json=payload)
    assert res.status_code == 400
    assert "exceeds safe budget" in res.json()["detail"] or "low" in res.json()["detail"]

@pytest.mark.asyncio
async def test_start_and_stop_active_test(temp_reports_dir):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        status_res = await ac.get("/api/tests/status")
        assert status_res.status_code == 200

        payload = {
            "name": "Quick API Stop Test",
            "test_type": "cpu",
            "cpu_workers": 1,
            "cpu_intensity": 20,
            "duration_seconds": 20,
            "monitoring_interval": 0.5
        }
        start_res = await ac.post("/api/tests/start", json=payload)
        assert start_res.status_code == 200
        test_id = start_res.json()["test_id"]
        assert test_id is not None

        # Give it a moment to run
        await asyncio.sleep(0.5)

        # Stop test
        stop_res = await ac.post(f"/api/tests/{test_id}/stop")
        assert stop_res.status_code == 200
        assert stop_res.json()["status"] == "stopped"

        # Wait a moment for workers to cleanly release
        await asyncio.sleep(0.5)

@pytest.mark.asyncio
async def test_auto_completion_lifecycle(temp_reports_dir):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "name": "Auto Completion Test",
            "test_type": "cpu",
            "cpu_workers": 1,
            "cpu_intensity": 20,
            "duration_seconds": 5,
            "monitoring_interval": 0.5
        }
        start_res = await ac.post("/api/tests/start", json=payload)
        assert start_res.status_code == 200
        test_id = start_res.json()["test_id"]
        assert test_id is not None

        # Wait up to 10 seconds for completion to accommodate Windows spawn timing
        status = "running"
        for _ in range(20):
            await asyncio.sleep(0.5)
            status_res = await ac.get("/api/tests/status")
            status = status_res.json()["status"]
            if status in ["completed", "stopped"]:
                break

        assert status in ["completed", "stopped"]

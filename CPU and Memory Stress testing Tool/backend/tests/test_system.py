def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "CPU and Memory Stress Testing Tool" in data["app"]

def test_system_info_endpoint(client):
    res = client.get("/api/system/info")
    assert res.status_code == 200
    data = res.json()
    assert "os_name" in data
    assert "logical_cores" in data
    assert data["logical_cores"] >= 1
    assert data["physical_cores"] >= 1
    assert data["total_ram_mb"] > 0
    assert "python_version" in data

def test_system_metrics_endpoint(client):
    res = client.get("/api/system/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "cpu_percent" in data
    assert "ram_used_mb" in data
    assert "ram_available_mb" in data
    assert "uptime_seconds" in data
    assert data["uptime_seconds"] > 0
    assert isinstance(data["cpu_cores_percent"], list)
    assert len(data["cpu_cores_percent"]) >= 1

def test_settings_get_and_update(client):
    res = client.get("/api/settings")
    assert res.status_code == 200
    orig = res.json()
    assert orig["max_duration_seconds"] == 300

    # Update setting
    res2 = client.post("/api/settings", json={"warning_cpu_threshold": 92.5})
    assert res2.status_code == 200
    assert res2.json()["warning_cpu_threshold"] == 92.5

    # Reset
    res3 = client.post("/api/settings/reset")
    assert res3.status_code == 200
    assert res3.json()["warning_cpu_threshold"] == 90.0

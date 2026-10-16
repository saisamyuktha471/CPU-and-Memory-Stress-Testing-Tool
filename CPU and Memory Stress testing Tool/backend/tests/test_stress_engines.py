import time
from backend.app.services.cpu_stress import CPUStressEngine
from backend.app.services.memory_stress import MemoryStressEngine

def test_cpu_stress_engine_start_and_stop():
    engine = CPUStressEngine()
    assert not engine.is_running
    assert engine.get_active_worker_count() == 0

    # Start 2 workers at 20% intensity
    started = engine.start(num_workers=2, intensity=20)
    assert started == 2
    assert engine.is_running
    
    # Wait briefly for workers to run
    time.sleep(0.5)
    assert engine.get_active_worker_count() == 2

    # Stop engine
    engine.stop(timeout=2.0)
    assert not engine.is_running
    assert engine.get_active_worker_count() == 0

def test_memory_stress_engine_start_and_cleanup():
    engine = MemoryStressEngine()
    assert not engine.is_running
    assert engine.allocated_memory_mb == 0.0

    # Allocate 50MB with 10MB chunk
    started = engine.start(target_mb=50, min_reserve_mb=100, chunk_size_mb=10)
    assert started
    assert engine.is_running

    # Wait up to 3s for allocation
    for _ in range(30):
        if engine.allocated_memory_mb >= 50:
            break
        time.sleep(0.1)

    assert engine.allocated_memory_mb > 0

    # Stop engine
    engine.stop(timeout=2.0)
    assert not engine.is_running

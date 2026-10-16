import math
import time
import multiprocessing as mp
from typing import List, Optional

def _cpu_worker_process(stop_event: mp.Event, intensity: int):
    """
    Worker process that executes real CPU-intensive mathematical calculations.
    Intensity (10 to 100) controls the compute vs sleep duty cycle within a 100ms window.
    """
    # Clamp intensity between 10 and 100
    intensity = max(10, min(100, intensity))
    duty_cycle_sec = 0.1  # 100 ms total window
    work_duration = duty_cycle_sec * (intensity / 100.0)
    sleep_duration = duty_cycle_sec - work_duration

    # Busy calculation variables
    x = 0.0001
    
    while not stop_event.is_set():
        window_start = time.perf_counter()
        # Compute phase
        while (time.perf_counter() - window_start) < work_duration:
            # Perform genuine floating-point and transcendental calculations
            for _ in range(500):
                x = math.sin(x) * math.cos(x) + math.sqrt(abs(x) + 1.0)
                if x > 10000.0:
                    x = 0.0001
            if stop_event.is_set():
                return
        
        # Rest phase for reduced intensity
        if sleep_duration > 0.002 and not stop_event.is_set():
            time.sleep(sleep_duration)

class CPUStressEngine:
    def __init__(self):
        self._workers: List[mp.Process] = []
        self._stop_event: Optional[mp.Event] = None
        self._is_running: bool = False
        self._intensity: int = 100

    @property
    def is_running(self) -> bool:
        return self._is_running

    def start(self, num_workers: int, intensity: int = 100) -> int:
        """
        Start worker processes for CPU stress testing.
        Returns the number of workers successfully started.
        """
        if self._is_running:
            self.stop()

        self._stop_event = mp.Event()
        self._intensity = max(10, min(100, intensity))
        self._workers = []

        for i in range(num_workers):
            p = mp.Process(
                target=_cpu_worker_process,
                args=(self._stop_event, self._intensity),
                name=f"cpu_stress_worker_{i+1}",
                daemon=True
            )
            p.start()
            self._workers.append(p)

        self._is_running = True
        return len(self._workers)

    def stop(self, timeout: float = 2.0):
        """
        Cooperatively stop and terminate all CPU worker processes.
        """
        self._is_running = False
        if self._stop_event:
            self._stop_event.set()

        for p in self._workers:
            if p.is_alive():
                p.join(timeout=timeout)
                if p.is_alive():
                    try:
                        p.terminate()
                        p.join(timeout=1.0)
                    except Exception:
                        pass
        self._workers.clear()
        self._stop_event = None

    def get_active_worker_count(self) -> int:
        """
        Return the number of currently alive worker processes.
        """
        return sum(1 for p in self._workers if p.is_alive())

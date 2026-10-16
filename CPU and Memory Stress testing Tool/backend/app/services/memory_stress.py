import gc
import time
import multiprocessing as mp
import psutil
from typing import Optional

def _memory_worker_process(
    stop_event: mp.Event,
    target_mb: int,
    min_reserve_mb: int,
    allocated_val: mp.Value,
    safety_aborted_val: mp.Value,
    chunk_size_mb: int = 50
):
    """
    Dedicated worker process that allocates and commits physical RAM in bounded chunks.
    Continuously checks available RAM to preserve the configured operating system safety reserve.
    """
    chunks = []
    chunk_bytes = chunk_size_mb * 1024 * 1024
    pattern = b"\xAA" * (1024 * 64)  # 64 KB pattern for fast page touch

    try:
        current_allocated_mb = 0
        while not stop_event.is_set() and current_allocated_mb < target_mb:
            # Check remaining system memory reserve before allocating
            try:
                avail_mb = psutil.virtual_memory().available / (1024 * 1024)
            except Exception:
                avail_mb = 999999.0

            if avail_mb <= min_reserve_mb:
                # System approaching safety limit! Refuse further allocation.
                safety_aborted_val.value = 1
                break

            # Determine size of next chunk (handle remainder if close to target)
            next_chunk_mb = min(chunk_size_mb, target_mb - current_allocated_mb)
            this_chunk_bytes = int(next_chunk_mb * 1024 * 1024)

            try:
                # Allocate bytearray and touch memory so OS commits physical pages
                chunk = bytearray(this_chunk_bytes)
                # Touch pages by copying pattern periodically
                pattern_len = len(pattern)
                for offset in range(0, min(this_chunk_bytes, 1024 * 1024 * 4), pattern_len):
                    chunk[offset:offset + pattern_len] = pattern
                
                chunks.append(chunk)
                current_allocated_mb += next_chunk_mb
                allocated_val.value = float(current_allocated_mb)
            except MemoryError:
                # Allocation failure handled gracefully
                safety_aborted_val.value = 1
                break

            # Brief pause between chunks to allow system metrics sampling and smooth load ramping
            time.sleep(0.05)

        # Hold allocated memory until test completes or is cancelled
        while not stop_event.is_set():
            # Continuous safety heartbeat: check if external apps consume RAM
            try:
                avail_mb = psutil.virtual_memory().available / (1024 * 1024)
                if avail_mb < (min_reserve_mb * 0.8):  # Critical drop
                    safety_aborted_val.value = 1
                    break
            except Exception:
                pass
            time.sleep(0.2)

    finally:
        # Explicit cleanup inside process
        chunks.clear()
        gc.collect()
        allocated_val.value = 0.0

class MemoryStressEngine:
    def __init__(self):
        self._worker: Optional[mp.Process] = None
        self._stop_event: Optional[mp.Event] = None
        self._allocated_val: Optional[mp.Value] = None
        self._safety_aborted_val: Optional[mp.Value] = None
        self._target_mb: int = 0

    @property
    def is_running(self) -> bool:
        return self._worker is not None and self._worker.is_alive()

    @property
    def allocated_memory_mb(self) -> float:
        if self._allocated_val:
            return float(self._allocated_val.value)
        return 0.0

    @property
    def safety_triggered(self) -> bool:
        if self._safety_aborted_val:
            return bool(self._safety_aborted_val.value == 1)
        return False

    def start(self, target_mb: int, min_reserve_mb: int = 1024, chunk_size_mb: int = 50) -> bool:
        """
        Start memory allocation worker.
        """
        if self.is_running:
            self.stop()

        self._target_mb = target_mb
        self._stop_event = mp.Event()
        self._allocated_val = mp.Value("d", 0.0)
        self._safety_aborted_val = mp.Value("i", 0)

        self._worker = mp.Process(
            target=_memory_worker_process,
            args=(
                self._stop_event,
                self._target_mb,
                min_reserve_mb,
                self._allocated_val,
                self._safety_aborted_val,
                chunk_size_mb
            ),
            name="memory_stress_worker",
            daemon=True
        )
        self._worker.start()
        return True

    def stop(self, timeout: float = 2.0):
        """
        Stop worker and free memory.
        """
        if self._stop_event:
            self._stop_event.set()

        if self._worker and self._worker.is_alive():
            self._worker.join(timeout=timeout)
            if self._worker.is_alive():
                try:
                    self._worker.terminate()
                    self._worker.join(timeout=1.0)
                except Exception:
                    pass

        self._worker = None
        self._stop_event = None
        self._allocated_val = None
        self._safety_aborted_val = None

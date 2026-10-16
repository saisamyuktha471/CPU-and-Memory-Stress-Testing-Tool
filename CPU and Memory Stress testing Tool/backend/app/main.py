import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import settings, DATA_DIR, REPORTS_DIR
from .api import system, tests, reports
from .services.monitor import monitor
from .services.test_manager import test_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Prime monitoring on startup
    monitor.get_metrics_snapshot()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    yield
    # Shutdown hook for clean termination of any lingering worker processes
    test_manager.shutdown()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Backend API and WebSocket engine for the CPU and Memory Stress Testing Tool",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(system.router, prefix="/api")
app.include_router(tests.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

@app.websocket("/ws/metrics")
async def websocket_metrics(websocket: WebSocket):
    """
    WebSocket endpoint streaming live real-time system metrics to connected clients.
    """
    await websocket.accept()
    stream_interval = settings.safety.default_monitoring_interval

    async def client_listener():
        nonlocal stream_interval
        try:
            while True:
                msg_text = await websocket.receive_text()
                try:
                    data = json.loads(msg_text)
                    if "interval" in data:
                        new_inv = float(data["interval"])
                        if 0.2 <= new_inv <= 5.0:
                            stream_interval = new_inv
                except Exception:
                    pass
        except (WebSocketDisconnect, asyncio.CancelledError):
            pass

    listener_task = asyncio.create_task(client_listener())

    try:
        while True:
            metrics = test_manager.get_latest_metrics()
            # Send current metric snapshot
            await websocket.send_text(metrics.model_dump_json())
            await asyncio.sleep(stream_interval)
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    except Exception:
        pass
    finally:
        listener_task.cancel()
        try:
            await listener_task
        except Exception:
            pass

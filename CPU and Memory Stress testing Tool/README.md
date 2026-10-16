# CPU and Memory Stress Testing Tool

An end-to-end desktop-browser systems engineering application designed for controlled CPU and memory workload generation, real-time operating systems telemetry, and performance analysis on Windows.

Built with **FastAPI**, **Python multiprocessing & psutil**, **React (Vite)**, **Tailwind CSS**, **Recharts**, and **WebSockets**.

---

## 1. Project Overview & Architecture

The application implements a clean three-tier architecture:

```
cpu-memory-stress-tool/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI server, CORS, lifespan, and WebSocket endpoint
│   │   ├── config.py                # Safety limits, path declarations, and settings models
│   │   ├── api/
│   │   │   ├── system.py            # /api/health, /api/system/info, /api/system/metrics, /api/settings
│   │   │   ├── tests.py             # /api/tests/start, /api/tests/{id}/stop, /api/tests/status
│   │   │   └── reports.py           # /api/tests/history, /api/tests/{id}/report, JSON & CSV export
│   │   ├── models/
│   │   │   └── schemas.py           # Pydantic schemas for requests, responses, metrics, and reports
│   │   └── services/
│   │       ├── monitor.py           # Hardware inspection and psutil system metric collector
│   │       ├── cpu_stress.py        # Multiprocessing CPU engine with duty-cycle intensity
│   │       ├── memory_stress.py     # Bounded chunk allocator with real physical page commitment
│   │       ├── test_manager.py      # Lifecycle orchestration, safety aborts, and test logging
│   │       └── report_service.py    # Local JSON persistence and time-series CSV generation
│   ├── tests/                       # Pytest test suite (12 passing tests)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx          # Dark theme navigation and live telemetry badge
│   │   │   ├── ActiveTestBanner.jsx # Sticky test monitor with progress and abort button
│   │   │   └── ConfirmationModal.jsx# Accessible confirmation dialogs for safety
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Real-time CPU/RAM cards and live Recharts
│   │   │   ├── RunTest.jsx          # Test configuration with dynamic safety budget
│   │   │   ├── LiveMonitoring.jsx   # Per-core gauges, paging breakdown, and telemetry control
│   │   │   ├── TestHistory.jsx      # Filter/sort history, report inspector, JSON/CSV exports
│   │   │   ├── ReportsComparison.jsx# Comparative charts and side-by-side matrix
│   │   │   ├── SystemInfoPage.jsx   # Hardware specifications and OS principles
│   │   │   └── SettingsPage.jsx     # Configurable safety floors and alert thresholds
│   │   ├── hooks/
│   │   │   └── useMetricsStream.js  # WebSocket stream hook with auto-reconnect
│   │   ├── services/
│   │   │   └── api.js               # REST client functions
│   │   ├── test/                    # Vitest and React Testing Library tests (4 passing tests)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── data/
│   └── reports/                     # Local JSON persistence for test reports
├── pytest.ini
├── .gitignore
└── README.md
```

---

## 2. Core Operating Systems Concepts Demonstrated

This project is tailored specifically for academic evaluation in Operating Systems (OS) courses:

1. **Process Management & Multiprocessing (`multiprocessing.Process`)**:
   Standard Python threads are restricted by the Global Interpreter Lock (GIL) to a single OS thread of execution. To saturate multi-core CPUs genuinely, the CPU engine spawns separate child processes with their own process control blocks (PCBs) and virtual address spaces, achieving true parallelism across physical and logical cores.

2. **CPU Scheduling & Duty-Cycle Bounded Intensity**:
   To execute variable workloads (e.g. 50% CPU intensity), workers execute a calibrated duty-cycle window (busy mathematical floating-point/transcendental computations vs cooperative sleep yielding). This demonstrates OS time-slicing and process state transitions (Running ↔ Blocked/Waiting).

3. **Demand Paging vs Physical Page Frame Commitment**:
   Modern virtual memory systems use demand paging: simply reserving a virtual memory range does not allocate physical RAM frames. The memory engine allocates memory in manageable 50 MB chunks and explicitly writes byte patterns into them, compelling the Windows kernel to allocate physical memory pages into the process working set.

4. **Operating System Memory Safety Floor (Guardrails)**:
   Stress testing must never freeze the host machine or trigger uncontrolled kernel thrashing. Before and during memory allocation, the tool samples `psutil.virtual_memory().available` against a configurable safety floor (default: 15% of total RAM or 1024 MB). If free RAM breaches the threshold, allocation immediately halts and logs a safety event.

5. **Inter-Process Communication (IPC) & Cooperative Cancellation**:
   Worker processes monitor multiprocessing synchronization flags (`mp.Event`). When a user aborts a workload or the test timer expires, workers gracefully terminate their execution loops, deallocate byte buffers, execute garbage collection, and exit. On process exit, the OS kernel unconditionally reclaims all child memory.

6. **State Transitions & Lifecycle Management**:
   The `TestManager` implements a finite state machine: `IDLE` → `STARTING` → `RUNNING` → `STOPPING` → `COMPLETED` / `STOPPED` / `FAILED`.

---

## 3. Technology Stack

- **Backend**: Python 3.12, FastAPI, Uvicorn, psutil, Pydantic v2, multiprocessing, asyncio
- **Frontend**: React 19, Vite 8, Tailwind CSS v4, Recharts 3, Lucide React icons
- **Streaming**: WebSockets (`/ws/metrics`)
- **Testing**: pytest & pytest-asyncio (Backend), Vitest & React Testing Library (Frontend)
- **Data Persistence**: Local JSON files (`data/reports/*.json`) & exported CSV time-series data

---

## 4. Setup & Running on Windows

### Prerequisites
- Windows 10 or 11
- Python 3.11+ installed (Python 3.12 verified)
- Node.js 18+ and npm installed (Node 22 verified)
- PowerShell

---

### Terminal 1: Backend Setup & Launch

Open a PowerShell terminal in the project directory:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

> **API Documentation**: Once running, open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) in your browser to inspect interactive Swagger documentation.

---

### Terminal 2: Frontend Setup & Launch

Open a second PowerShell terminal in the project directory:

```powershell
cd frontend
npm install
npm run dev
```

> **Web Application**: Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in any modern desktop browser (Chrome, Edge, Firefox).

---

## 5. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check endpoint returning status and app version |
| `GET` | `/api/system/info` | Host hardware metadata: OS, CPU model, core count, RAM |
| `GET` | `/api/system/metrics` | Snapshot of CPU %, RAM %, swap %, frequency, uptime |
| `POST` | `/api/tests/start` | Start stress test (validates parameters and safety budgets) |
| `POST` | `/api/tests/{test_id}/stop` | Cancel a running test cooperatively by ID |
| `POST` | `/api/tests/stop` | Cancel active test via user control |
| `GET` | `/api/tests/status` | Current test execution status, progress %, and metrics |
| `GET` | `/api/tests/history` | List all saved test summaries (sorted newest first) |
| `GET` | `/api/tests/{test_id}/report` | Detailed test report with complete time-series log |
| `GET` | `/api/tests/{test_id}/export/json` | Download report as structured JSON |
| `GET` | `/api/tests/{test_id}/export/csv` | Download complete time-series metrics as CSV |
| `DELETE` | `/api/tests/{test_id}` | Delete a specific test report |
| `DELETE` | `/api/tests/` | Clear all persisted history records |
| `GET` | `/api/settings` | Get current safety limits and threshold defaults |
| `POST` | `/api/settings` | Update safety limits (bounds enforced) |
| `POST` | `/api/settings/reset` | Restore default conservative safety limits |
| `WS` | `/ws/metrics` | Real-time WebSocket streaming telemetry |

---

## 6. Running Automated Tests

### Backend Tests (pytest)
Runs 12 unit and integration tests verifying health, system monitoring, workload engine start/stop, invalid config rejections, safety limits, auto-completion, JSON/CSV exports, and error handling:

```powershell
.\backend\.venv\Scripts\pytest.exe .\backend\tests -v
```

### Frontend Tests (Vitest)
Runs component tests verifying Dashboard metric rendering, RunTest validation controls, and ActiveTestBanner abort buttons:

```powershell
cd frontend
npm test
```

### Frontend Production Build
Verifies that the React bundle compiles without errors:

```powershell
cd frontend
npm run build
```

---

## 7. Project Evaluation & Demonstration Procedure

To demonstrate the application for an Operating Systems lab project evaluation:

1. **Live Telemetry Inspection (Dashboard & Live Monitoring)**:
   - Navigate to the **Dashboard** and **Live Monitoring** pages.
   - Point out that measurements are real: logical cores, physical cores, CPU clock frequency, and exact memory usage.
   - Switch the WebSocket streaming rate between 0.5s, 1.0s, and 2.0s to demonstrate dynamic telemetry streaming.

2. **CPU Stress Test Demonstration (Multiprocessing & Core Saturation)**:
   - Navigate to **Run Stress Test**.
   - Select **CPU Only**, set 4 workers, 100% intensity, 15 seconds duration.
   - Click **Start Stress Test**.
   - Open **Task Manager** (Ctrl+Shift+Esc) alongside the browser: observe child Python processes utilizing CPU cores and watch per-core meters rise on the dashboard.
   - Observe automatic test completion after 15 seconds, accompanied by immediate worker cleanup and CPU drop.

3. **Memory Stress Test & Safety Guardrail Demonstration**:
   - Navigate to **Run Stress Test**.
   - Select **RAM Only**, observe the **Safe Test Budget** calculation showing free RAM minus the OS safety reserve.
   - Set target allocation to 250 MB and duration to 15 seconds.
   - Start the test: observe allocated memory ramp up in 50 MB increments on the active banner and live charts.
   - Click the **Abort Test** button mid-run: observe instant release of all allocated memory and clean process exit.

4. **Persisted Reports, Performance Comparison & Data Export**:
   - Navigate to **Test History**: view the completed runs, inspect detailed statistics in the report modal.
   - Click **Export CSV** to download time-series measurements (`test_id_metrics.csv`).
   - Navigate to **Reports & Compare**: select previous test runs to visualize comparative bar charts comparing peak/average CPU and RAM utilization side-by-side.

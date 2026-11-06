# SmartSchoolIoT – Government School Water & Mid-Day Meal Monitoring System

An end-to-end cyber-physical IoT web application designed for government schools under the **Samagra Shiksha** mission. The platform monitors physical drinking-water storage levels, water clarity/turbidity, and kitchen ambient humidity using ESP32 microcontrollers, paired with an administrative compliance portal for manual verification of mid-day meal preparations and kitchen hygiene.

---

## 1. Project Overview
SmartSchoolIoT solves critical public health and administrative challenges in government schools by replacing guesswork with real-time physical telemetry and tamper-evident photo records:
* **Water Tank Digital Twin:** An interactive physical twin reflecting exact water height, percentage full, and calculated volume in litres.
* **Drinking Water Safety:** Optical turbidity monitoring calibrated to WHO / Bureau of Indian Standards (BIS) drinking water thresholds (&le; 5.0 NTU).
* **Kitchen Environment:** Humidity monitoring to detect damp, unsanitary cooking environments.
* **Mid-Day Meal & Kitchen Hygiene:** School staff upload meal preparation and kitchen sanitation photos for state administrator verification, flagging, or rejection.
* **Strict Multi-Tenancy:** State administrators have system-wide visibility; school operators can **only** view their own institution's data.
* **Zero Fake Data Policy:** Unconnected sensors and institutions without records strictly show neutral offline states (`"--"`, `"Hardware Not Connected"`, `"No Historical Data Available"`). No synthetic mock data is fabricated.

---

## 2. Key Features
1. **Real-Time Water Tank Monitoring & Digital Twin** with animated ultrasonic wave simulation and fluid dynamics.
2. **Drinking-Water Turbidity Monitoring** with automatic abnormal condition alarms.
3. **Kitchen Ambient Humidity Monitoring** via physical DHT sensors.
4. **Physical Buzzer Integration** triggered on the ESP32 when thresholds are breached.
5. **Mid-Day Meal Tracking** with daily menu logging and inspection shift tracking.
6. **Staff Photo Submission Workflow** (Meal Preparation & Kitchen Hygiene).
7. **Admin Manual Verification & Flagging Gallery** (NO OpenCV / NO AI claims).
8. **Institutional Registration & Multi-Stage Admin Approval Workflow**.
9. **Strict School-Level Data Isolation** enforced at the database and backend query layers (`403 Forbidden`).
10. **Hardware Watchdog** that monitors ESP32 signal heartbeats and flags disconnects after 60 seconds of silence.
11. **MySQL Workbench Compatibility** (`root:abc123`) & **Firebase Realtime Database Sync**.
12. **Immutable Audit Logging** of all administrative and security actions.

---

## 3. Architecture
```
PHYSICAL SENSORS (Ultrasonic, Turbidity, DHT Humidity)
        ↓
   ESP32 NODE (WiFi + Buzzer Alert + HTTP Client)
        ↓
   POST /api/hardware/telemetry
        ↓
FASTAPI BACKEND (Threshold Engine, JWT Auth, RBAC)
        ↓
MYSQL DATABASE (smart_school_iot) & FIREBASE SYNC
        ↓
REACT FRONTEND (Vite, Tailwind, Recharts, Digital Twin)
```

---

## 4. Initial Credentials & Database Seed
The database initializes with **strictly one approved school** and **two accounts**:

| Account Type | Email | Password | Role | Assigned School | Status |
|---|---|---|---|---|---|
| **Central Admin** | `admin@gmail.com` | `abc123` | `ADMIN` | System-Wide (All) | `ACTIVE` |
| **Field Node** | `s1@gmail.com` | `abc123` | `SCHOOL` | `ZPHS Poranki` | `ACTIVE` |

* **Initial School:** `ZPHS Poranki` (School ID: `1`, Code: `SCH-PORANKI-001`, District: `Krishna`, AP).
* **Initial Telemetry:** Zero fake sensor readings or synthetic alerts are seeded.

---

## 5. Technology Stack
* **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Axios, React Router v6.
* **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, Python-Jose (JWT), PyMySQL.
* **Database:** MySQL 8.0 (MySQL Workbench compatible) with automatic SQLite fallback.
* **Realtime Cloud:** Firebase Admin SDK for live telemetry mirroring.
* **Hardware:** ESP32 Dev Board, HC-SR04 / JSN-SR04T Ultrasonic Sensor, Optical Turbidity Sensor, DHT11/22 Humidity Sensor, Active Buzzer.

---

## 6. Installation & Setup Guide

### Prerequisites
* Python 3.10+ installed
* Node.js v18+ and npm installed
* MySQL Server (e.g., MySQL Workbench with user `root` and password `abc123`)

---

### Step 1: Database Setup (MySQL Workbench)
1. Open **MySQL Workbench**.
2. Connect to your local instance (User: `root`, Port: `3306`).
3. Run the schema creation query or execute `database/schema.sql`:
   ```sql
   CREATE DATABASE IF NOT EXISTS smart_school_iot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
*(Note: The FastAPI backend will also auto-detect and create the `smart_school_iot` database upon initial boot).*

---

### Step 2: Backend Setup
1. Open PowerShell and navigate to the backend folder:
   ```powershell
   cd smart-school-iot\backend
   ```
2. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies (if not already installed):
   ```powershell
   pip install -r requirements.txt
   ```
4. Verify your `.env` configuration:
   ```env
   PORT=8000
   HOST=0.0.0.0
   DATABASE_URL=mysql+pymysql://root:abc123@localhost:3306/smart_school_iot
   SECRET_KEY=smartschooliot_super_secret_jwt_key_2026_gov_portal
   HARDWARE_TIMEOUT_SECONDS=60
   ```
5. Start the FastAPI server:
   ```powershell
   uvicorn app.main:app --reload --port 8000
   ```
   API will be live at: `http://localhost:8000` (Interactive Docs: `http://localhost:8000/docs`).

---

### Step 3: Frontend Setup
1. Open a new PowerShell terminal and navigate to the frontend directory:
   ```powershell
   cd smart-school-iot\frontend
   ```
2. Install packages (if not already installed):
   ```powershell
   npm install
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
   Web application will be accessible at: `http://localhost:3000`.

---

## 7. User Workflows

### A. Central State Administrator
1. Navigate to `http://localhost:3000/login`.
2. Login with `admin@gmail.com` / `abc123`.
3. You will be redirected to `/admin/dashboard`.
4. Monitor state-wide institutions, view the Water Tank Digital Twin (`/admin/digital-twin`), review and verify staff photo uploads (`/admin/meals`), approve/reject new school registrations (`/admin/approvals`), and inspect security audit logs (`/admin/profile`).

### B. ZPHS Poranki (School Field Node)
1. Navigate to `http://localhost:3000/login`.
2. Login with `s1@gmail.com` / `abc123`.
3. You will be redirected to `/school/dashboard`.
4. Monitor your school's physical tank digital twin (`/school/digital-twin`), check drinking water turbidity and kitchen humidity, log daily mid-day meal menus, and upload photos (`/school/meals`).
5. **Data Isolation:** You will never see other institutions, and direct API attempts to access other school records are strictly blocked with `403 Forbidden`.

### C. New School Onboarding & Approval
1. Navigate to `http://localhost:3000/register`.
2. Fill out school details, U-DISE ID, District, Principal Name, Email, and Password.
3. Upon submission, the account is placed in `PENDING_APPROVAL` status and redirected to `/pending-approval`.
4. Attempting to log in as a pending school will display:
   > *"Your school account is awaiting administrator approval."*
5. The Admin logs in, goes to `/admin/approvals`, reviews the submission, and clicks **[APPROVE]**.
6. The school status transitions to `ACTIVE`, and the school operator can now log in to access `/school/dashboard`.

---

## 8. Hardware & ESP32 Integration

### Pin Connections
| Component | Component Pin | ESP32 Pin | Voltage Rail | Notes |
|---|---|---|---|---|
| **Ultrasonic (HC-SR04)** | VCC | - | +5V (VIN) | Sensor power |
| | TRIG | GPIO 5 | - | Output pulse |
| | ECHO | GPIO 18 | - | **Use 1kΩ / 2kΩ voltage divider (5V -> 3.3V)** |
| | GND | GND | GND | Common ground |
| **Turbidity Sensor** | VCC | - | +5V (VIN) | Optical probe power |
| | AOUT | GPIO 34 | - | Analog ADC1 input (0 - 3.3V) |
| | GND | GND | GND | Common ground |
| **Humidity (DHT11/22)** | VCC | - | +3.3V (3V3) | Sensor power |
| | DATA | GPIO 4 | - | 1-Wire signal (with 10k pull-up if bare sensor) |
| | GND | GND | GND | Common ground |
| **Active Buzzer** | (+) | GPIO 19 | - | Output driven HIGH on threshold breach |
| | (-) | GND | GND | Common ground |

### Firmware Flashing
1. Open `hardware/esp32/esp32_water_monitor.ino` in Arduino IDE.
2. In `hardware/esp32/config.h`, set your WiFi credentials and computer's local IP:
   ```c
   #define WIFI_SSID       "Your_WiFi_Network"
   #define WIFI_PASSWORD   "Your_WiFi_Password"
   #define SERVER_HOST     "http://192.168.1.100:8000"
   #define SCHOOL_ID       1
   #define HARDWARE_API_KEY "esp32_poranki_hw_key_2026"
   ```
3. Connect the ESP32 via USB and click **Upload**.
4. Open the Serial Monitor (115200 baud). Sensor values will be transmitted every 5 seconds.

### Telemetry Testing Without Hardware
To test real telemetry ingestion before wiring the physical board, run:
```powershell
cd smart-school-iot\backend
.\venv\Scripts\python.exe test_telemetry.py
```
This sends a valid sensor packet for ZPHS Poranki. The dashboard and Digital Twin will immediately transition from *"Hardware Not Connected"* to displaying real live data and water fill levels!

---

## 9. Troubleshooting

* **Issue: "email-validator is not installed"**
  - Fix: Run `pip install email-validator` in `backend/venv`.
* **Issue: MySQL Access Denied for user 'root'@'localhost'**
  - Fix: Verify MySQL server is running and password matches `abc123` in `.env`.
* **Issue: "Hardware Not Connected" displayed on dashboard**
  - Cause: This is the expected strict behavior under the **Zero Fake Data Policy**. Connect the physical ESP32 or run `test_telemetry.py` to transmit real sensor readings.
* **Issue: ESP32 Echo Pin Damage**
  - Fix: Ensure you use the 1kΩ / 2kΩ resistor divider on the HC-SR04 Echo pin to protect the ESP32's 3.3V GPIO input.

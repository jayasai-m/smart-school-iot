# SmartSchoolIoT – Government School Water & Mid-Day Meal Monitoring System

The full project source code is organized cleanly inside `smart-school-iot/`:

* **Frontend:** `smart-school-iot/frontend/`
* **Backend:** `smart-school-iot/backend/`
* **Hardware (ESP32):** `smart-school-iot/hardware/esp32/`
* **Database (MySQL / Workbench):** `smart-school-iot/database/schema.sql`
* **Documentation:** `smart-school-iot/docs/` and `smart-school-iot/README.md`

### Quick Start
1. **Backend:**
   ```powershell
   cd smart-school-iot\backend
   .\venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
   ```
2. **Frontend:**
   ```powershell
   cd smart-school-iot\frontend
   npm run dev
   ```
3. Open `http://localhost:3000` in your browser.
   * **Admin Login:** `admin@gmail.com` / `abc123`
   * **School Login (ZPHS Poranki):** `s1@gmail.com` / `abc123`

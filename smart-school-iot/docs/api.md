# SmartSchoolIoT – REST API Reference

## Base URL
`http://localhost:8000/api`

---

## 1. Authentication Endpoints

### `POST /auth/login`
Authenticates Admin or School credentials and issues a JWT token.
* **Payload:**
  ```json
  {
    "email": "admin@gmail.com",
    "password": "abc123"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "role": "ADMIN",
    "user_id": 1,
    "email": "admin@gmail.com",
    "full_name": "State Monitoring Administrator",
    "status": "ACTIVE",
    "school_id": null
  }
  ```
* **Response (403 Forbidden - Pending School):**
  ```json
  {
    "detail": "Your school account is awaiting administrator approval."
  }
  ```

### `POST /auth/register`
Submits a new school registration with status `PENDING_APPROVAL`.
* **Payload:**
  ```json
  {
    "school_name": "ZPHS Kankipadu",
    "school_code": "SCH-KANKIPADU-002",
    "district": "Krishna",
    "state": "Andhra Pradesh",
    "address": "Kankipadu Mandal, AP",
    "principal_name": "K. Venkata Rao",
    "email": "kankipadu@gmail.com",
    "phone": "+91 9876543222",
    "password": "password123",
    "confirm_password": "password123"
  }
  ```

### `GET /auth/me`
Fetches the currently authenticated profile and assigned institution.

---

## 2. Hardware Telemetry Ingestion

### `POST /hardware/telemetry`
Transmits real physical readings collected by the ESP32.
* **Headers:** `Content-Type: application/json`
* **Payload:**
  ```json
  {
    "api_key": "esp32_poranki_hw_key_2026",
    "school_id": 1,
    "device_id": "ESP32-PORANKI-01",
    "distance_cm": 45.0,
    "turbidity_ntu": 1.25,
    "turbidity_voltage": 2.85,
    "humidity_pct": 58.2,
    "temperature_c": 28.1
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "status": "success",
    "buzzer": false,
    "buzzer_reason": null,
    "message": "Telemetry recorded for ZPHS Poranki. Level: 77.5%, Turbidity: 1.25 NTU, Humidity: 58.2%"
  }
  ```
*(If turbidity > threshold or water is low/overflow, `buzzer: true` and `buzzer_reason` is returned).*

### `GET /hardware/status/{school_id}`
Returns live communication status (`CONNECTED` or `DISCONNECTED` based on 60-second watchdog timer).

---

## 3. School Endpoints (`/school/*`)
*Headers: `Authorization: Bearer <token>`*
* `GET /school/dashboard`: Returns school metadata, latest reading, active alerts count, today's meal.
* `GET /school/digital-twin`: Digital twin telemetry for the logged-in school's tank only.
* `GET /school/water`: Water level percentage, volume litres, turbidity and historical chart data.
* `GET /school/meals`: Archive of submitted menus and inspection photo reviews.
* `POST /school/meals`: Registers daily menu details.
* `POST /school/upload-image`: Multipart image upload (Meal Preparation or Kitchen Hygiene).
* `GET /school/alerts`: Alerts strictly isolated to the caller's school.
* `GET /school/profile`: Institution parameters, headmaster contacts, and ESP32 hardware credentials.

---

## 4. Admin Endpoints (`/admin/*`)
*Headers: `Authorization: Bearer <admin_token>`*
* `GET /admin/dashboard`: State-wide counters, monitored schools telemetry matrix, recent alerts and photos.
* `GET /admin/approvals`: List of schools awaiting approval (`PENDING_APPROVAL`).
* `POST /admin/approvals/{school_id}`: Performs `APPROVE`, `REJECT`, or `FLAG`.
* `GET /admin/schools`: Multi-school overview.
* `GET /admin/schools/{school_id}`: Full institutional telemetry diagnostics.
* `PUT /admin/schools/{school_id}/thresholds`: Configures tank height, capacity, turbidity, and alert triggers.
* `GET /admin/digital-twin?school_id={id}`: Water tank digital twin with multi-school selector.
* `GET /admin/water?school_id={id}`: Combined water quality & reservoir analytics across schools.
* `GET /admin/meals`: Review queue of uploaded photos across all schools.
* `POST /admin/images/{image_id}/review`: Marks submission as `VERIFIED`, `FLAGGED`, or `REJECTED`.
* `GET /admin/alerts`: Global anomaly alert list.
* `POST /admin/alerts/{alert_id}/action`: Updates alert to `ACKNOWLEDGED`, `RESOLVED`, or `FLAGGED`.
* `GET /admin/reports`: Historical compliance archives.
* `GET /admin/audit-logs`: Immutable system security trails.

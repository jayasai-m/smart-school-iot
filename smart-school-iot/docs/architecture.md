# SmartSchoolIoT – System Architecture

## 1. System Overview
**SmartSchoolIoT** is a cyber-physical monitoring platform built for government schools under the Samagra Shiksha mission. It integrates physical IoT sensor telemetry (water tank storage level, drinking-water turbidity, kitchen ambient humidity) and administrative oversight of mid-day meal preparations and kitchen hygiene.

---

## 2. Architecture Diagram

```
+--------------------------------------------------------------------------+
|                            PHYSICAL SENSORS                              |
|   HC-SR04 (Ultrasonic)  |  Turbidity (Optical)  |  DHT11/22 (Humidity)   |
+------------------------------------+-------------------------------------+
                                     | Analog / Digital GPIO
                                     v
+--------------------------------------------------------------------------+
|                          ESP32 HARDWARE NODE                             |
|  - WiFi Station Mode                                                     |
|  - Median Filtering & Signal Calibration                                 |
|  - Active Buzzer Actuation on Threshold Violations                       |
|  - HTTP Client Telemetry Transmission                                    |
+------------------------------------+-------------------------------------+
                                     | HTTPS / JSON (POST /api/hardware/telemetry)
                                     v
+--------------------------------------------------------------------------+
|                         FASTAPI PYTHON BACKEND                           |
|  - Token-Based JWT Authentication & Strict Role-Based RBAC               |
|  - Strict School Data Isolation Enforcer (403 Forbidden cross-tenant)     |
|  - Dynamic Threshold Engine & Physical Buzzer Command Dispatcher         |
|  - Real-Time Hardware Heartbeat & Disconnection Watchdog                 |
|  - Static Image Storage & Audit Logging Subsystem                        |
+------------------+------------------------------------+------------------+
                   |                                    |
                   v                                    v
+------------------------------------+   +---------------------------------+
|       RELATIONAL DATABASE          |   |     FIREBASE REALTIME DB        |
|  - MySQL 8.0 (MySQL Workbench)     |   |  - Telemetry Mirroring          |
|  - Full Foreign Key Constraints    |   |  - Real-Time Cloud Listeners    |
|  - Schools, Users, SensorReadings  |   +---------------------------------+
|  - MealSubmissions, Images, Alerts |
+------------------------------------+
                   ^
                   | REST API & Static Uploads
                   |
+--------------------------------------------------------------------------+
|                          REACT FRONTEND CLIENT                           |
|  - Central State Administration Portal (/admin/*)                        |
|  - Isolated School Node Interface (/school/*)                            |
|  - Water Tank Digital Twin with Live Ultrasonic Simulation               |
|  - Staff Photo Submission Drawer & Admin Verification Gallery            |
|  - Institutional Registration & Multi-Stage Approval Workflow            |
+--------------------------------------------------------------------------+
```

---

## 3. Strict Data Isolation Design
Multi-tenancy isolation is enforced at the backend database query layer:
* **Admin Role (`ADMIN`):** Grants access to state-wide telemetry, all school nodes, institutional approvals, and global reports.
* **School Role (`SCHOOL`):** Bound strictly to a single `school_id`. All database queries (`WHERE school_id = current_user.school_id`) prevent access to any other institution. Direct API attempts to access other schools return `403 Forbidden`.
* **Zero Fake Data Policy:** Unconnected sensors or schools with zero historical records display neutral offline states (`"--"`, `"Hardware Not Connected"`, `"No Historical Data Available"`) rather than synthetic mock numbers.

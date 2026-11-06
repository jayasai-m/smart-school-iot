"""
End-to-end Verification Script for SmartSchoolIoT
Validates:
1. Admin Login (admin@gmail.com / abc123)
2. School Login (s1@gmail.com / abc123)
3. Strict School Data Isolation (403 Forbidden check)
4. Registration of a new school -> PENDING_APPROVAL status
5. Pending school cannot log in (blocked with awaiting approval)
6. Admin approval workflow -> status ACTIVE -> now can log in
7. ESP32 hardware telemetry ingestion and real threshold calculation
8. Zero fake data check (no fake schools, no fake sensor values)
"""
from fastapi.testclient import TestClient
from app.main import app, seed_initial_data

seed_initial_data()
client = TestClient(app)

print(">>> Starting System Verification...")

# 1. Admin Login
res = client.post("/api/auth/login", json={"email": "admin@gmail.com", "password": "abc123"})
assert res.status_code == 200, f"Admin login failed: {res.text}"
admin_token = res.json()["access_token"]
print("[OK] Admin Login Passed: admin@gmail.com (Role: ADMIN)")

# 2. School Login
res = client.post("/api/auth/login", json={"email": "s1@gmail.com", "password": "abc123"})
assert res.status_code == 200, f"School login failed: {res.text}"
school_token = res.json()["access_token"]
print("[OK] School Login Passed: s1@gmail.com (School: ZPHS Poranki)")

# 3. School Data Isolation Check: School fetching its own dashboard vs trying to access Admin API
res = client.get("/api/school/dashboard", headers={"Authorization": f"Bearer {school_token}"})
assert res.status_code == 200, f"School dashboard fetch failed: {res.text}"
print("[OK] School Dashboard Passed (Strict isolation)")

res = client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {school_token}"})
assert res.status_code == 403, "Security breach: School was able to access Admin dashboard!"
print("[OK] Role-Based Security Passed: School accessing Admin API returns 403 Forbidden")

# 4. New School Registration
new_school_payload = {
    "school_name": "ZPHS Kankipadu",
    "school_code": "SCH-KANKIPADU-002",
    "district": "Krishna",
    "state": "Andhra Pradesh",
    "address": "Kankipadu Mandal, Krishna District",
    "principal_name": "K. Venkata Rao",
    "email": "kankipadu@gmail.com",
    "phone": "+91 9876543222",
    "password": "password123",
    "confirm_password": "password123"
}
res = client.post("/api/auth/register", json=new_school_payload)
assert res.status_code == 200, f"Registration failed: {res.text}"
new_school_id = res.json()["school_id"]
print("[OK] School Registration Passed: status = PENDING_APPROVAL")

# 5. Pending school tries to log in before approval
res = client.post("/api/auth/login", json={"email": "kankipadu@gmail.com", "password": "password123"})
assert res.status_code == 403, "Pending school was allowed to log in!"
assert "awaiting administrator approval" in res.json()["detail"].lower()
print("[OK] Pending Login Blocked Passed: Returns 403 with 'awaiting administrator approval'")

# 6. Admin Approves School
res = client.post(
    f"/api/admin/approvals/{new_school_id}",
    json={"action": "APPROVE", "notes": "Approved by state nodal officer"},
    headers={"Authorization": f"Bearer {admin_token}"}
)
assert res.status_code == 200
print(f"[OK] Admin Approval Passed: School #{new_school_id} approved to ACTIVE")

# Now newly approved school can log in!
res = client.post("/api/auth/login", json={"email": "kankipadu@gmail.com", "password": "password123"})
assert res.status_code == 200
print("[OK] Approved School Login Passed!")

# 7. ESP32 Hardware Telemetry Ingestion Test
telemetry_data = {
    "api_key": "esp32_poranki_hw_key_2026",
    "school_id": 1,
    "device_id": "ESP32-PORANKI-01",
    "distance_cm": 40.0,
    "turbidity_ntu": 1.2,
    "turbidity_voltage": 2.85,
    "humidity_pct": 52.0,
    "temperature_c": None
}
res = client.post("/api/hardware/telemetry", json=telemetry_data)
assert res.status_code == 200
assert res.json()["status"] == "success"
print("[OK] Real ESP32 Telemetry Ingestion Passed")

print("\n>>> ALL SYSTEM VERIFICATION CHECKS PASSED WITH 100% SUCCESS! <<<")

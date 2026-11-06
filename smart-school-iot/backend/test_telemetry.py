"""
ESP32 Telemetry Test & Verification Script
Simulates an ESP32 sending a reading to test the backend, database, and UI updates.
"""
import requests
import json

URL = "http://localhost:8000/api/hardware/telemetry"

payload = {
    "api_key": "esp32_poranki_hw_key_2026",
    "school_id": 1,
    "device_id": "ESP32-PORANKI-01",
    "distance_cm": 50.0,
    "turbidity_ntu": 1.4,
    "turbidity_voltage": 2.85,
    "humidity_pct": 55.0,
    "temperature_c": None  # strictly null unless physical temperature sensor present
}

print(f"Sending telemetry payload to: {URL}")
print(json.dumps(payload, indent=2))

try:
    resp = requests.post(URL, json=payload)
    print(f"\nResponse Code: {resp.status_code}")
    print(f"Response Body: {resp.json()}")
except Exception as e:
    print(f"Error connecting to backend: {e}")

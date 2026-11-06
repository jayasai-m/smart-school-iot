# SmartSchoolIoT – ESP32 Hardware Integration Guide

## 1. Overview
This hardware module interfaces physical ultrasonic, turbidity, and humidity sensors with an ESP32 microcontroller to send real-time school conditions to the SmartSchoolIoT server.

---

## 2. Sensor Integration Specifications

### 1. Water Level Sensor (Ultrasonic HC-SR04 / JSN-SR04T)
* **Measurement Principle:** Time-of-flight ultrasonic echo pulse.
* **Calculation Formula:**
  \[
  \text{Distance (cm)} = \frac{\text{Echo Pulse Duration (\mu s)} \times 0.0343}{2}
  \]
  \[
  \text{Water Height (cm)} = (\text{Tank Height} + \text{Sensor Offset}) - \text{Distance}
  \]
  \[
  \text{Water Level (\%)} = \left(\frac{\text{Water Height}}{\text{Tank Height}}\right) \times 100
  \]
  \[
  \text{Volume (L)} = \left(\frac{\text{Water Level (\%)}}{100}\right) \times \text{Configured Capacity (L)}
  \]
* **Safety:** Step-down voltage divider on the ECHO pin converts the 5V return pulse to 3.3V for safe ESP32 GPIO input.

### 2. Drinking-Water Turbidity Sensor (Optical Module)
* **Measurement Principle:** 940nm Infrared light transmission and scattering.
* **Calibrated Voltage to NTU:**
  - Clear water (Pure): \(\approx 2.8\text{V} - 3.0\text{V}\) \(\rightarrow\) \(< 1.0\text{ NTU}\)
  - Murky / Muddy water: \(< 2.0\text{V}\) \(\rightarrow\) \(> 5.0\text{ NTU}\) (Triggers "High turbidity detected" alert)
* **Buzzer Actuation:** When turbidity exceeds 5.0 NTU (WHO/BIS drinking water safety threshold), the backend commands the ESP32 to sound the physical buzzer.

### 3. Kitchen Humidity Sensor (DHT11 / DHT22)
* **Measurement Principle:** Capacitive humidity sensing with internal thermistor.
* **Threshold Alert:** Humidity \(> 75\%\) indicates damp kitchen conditions prone to bacterial growth.

### 4. Active Buzzer Alarm
* **Pin:** GPIO 19
* **Logic:** Sounds in rapid pulses when `buzzer: true` is returned from `/api/hardware/telemetry` due to high turbidity, tank overflow risk, or critically low water level.

---

## 3. Physical Hardware Simulation / Diagnostic Script
If you want to test hardware ingestion before flashing the physical ESP32 board, a diagnostic Python test script is provided in `backend/test_telemetry.py` which mimics the exact ESP32 HTTP POST payload.

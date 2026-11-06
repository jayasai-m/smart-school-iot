# ESP32 Firmware Setup & Calibration Guide

This guide walks you through compiling, flashing, and calibrating the ESP32 hardware node for the **SmartSchoolIoT – Government School Water & Mid-Day Meal Monitoring System**.

---

## 1. Prerequisites & Required Tools

1. **Hardware:**
   - ESP32 Development Board (ESP32-WROOM-32 or similar)
   - Micro-USB or USB-C cable (data capable)
   - HC-SR04 (or JSN-SR04T) ultrasonic distance sensor
   - Analog turbidity sensor module
   - DHT11 or DHT22 humidity sensor
   - Active buzzer (5V/3.3V)
   - Breadboard, jumper wires, and 1kΩ / 2kΩ resistors

2. **Software:**
   - [Arduino IDE 2.x](https://www.arduino.cc/en/software) or Visual Studio Code with PlatformIO.
   - Silicon Labs CP210x or CH340 USB-to-UART bridge drivers installed on Windows.

---

## 2. Arduino IDE Configuration

### Step A: Add ESP32 Board URL
1. In Arduino IDE, go to **File -> Preferences**.
2. Add the following URL into **Additional Boards Manager URLs**:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Open **Tools -> Board -> Boards Manager**, search for `esp32` by Espressif Systems, and click **Install**.

### Step B: Install Required Libraries
Open **Sketch -> Include Library -> Manage Libraries** and install:
1. `DHT sensor library` by Adafruit (also accept `Adafruit Unified Sensor` if prompted).
2. `ArduinoJson` (optional, for advanced JSON parsing).

---

## 3. Configuration (`config.h`)

Before uploading, open `hardware/esp32/config.h` and customize:
1. **WiFi Credentials:**
   ```c
   #define WIFI_SSID       "Your_School_Or_Home_WiFi"
   #define WIFI_PASSWORD   "Your_WiFi_Password"
   ```
2. **Backend Server Host:**
   - Find your host computer's local IP address on your WiFi network (e.g. run `ipconfig` in Windows PowerShell).
   - Example:
     ```c
     #define SERVER_HOST     "http://192.168.1.150:8000"
     ```
3. **School Hardware API Key:**
   - Default for ZPHS Poranki: `esp32_poranki_hw_key_2026`
   - School ID: `1`

---

## 4. Calibration Instructions

### 1. Ultrasonic Sensor Calibration (Water Tank Height)
* Measure your physical water tank's internal height in centimeters (e.g., `200.0 cm`).
* Measure the distance from the sensor face to the maximum overflow water level (e.g., `10.0 cm`).
* Set these in `config.h`:
  ```c
  #define TANK_HEIGHT_CM   200.0
  #define SENSOR_OFFSET_CM 10.0
  ```
* When empty, distance reading \(\approx 210\text{ cm}\) \(\rightarrow\) Water Level = 0%.
* When full, distance reading \(\approx 10\text{ cm}\) \(\rightarrow\) Water Level = 100%.

### 2. Turbidity Sensor Calibration
* Fill a clean glass with clear drinking water. Submerge the turbidity sensor probe.
* Observe the serial output voltage in the Serial Monitor (`[SENSOR] Turbidity: X.XX NTU (Raw Voltage: Y.YY V)`).
* Rotate the blue potentiometer on the sensor module until the voltage reads between **2.8V and 3.0V** for pure clear water.
* In clean drinking water, the turbidity will read below **1.0 NTU** (Safe according to WHO/BIS standards where limit is 5.0 NTU).
* When murky or muddy water is introduced, the voltage will drop below 2.0V, driving the calculated NTU above 5.0 NTU and automatically triggering the system alert and buzzer.

---

## 5. Uploading the Firmware

1. Connect the ESP32 to your PC via USB.
2. Select **Tools -> Board -> ESP32 Dev Module**.
3. Select the correct **COM Port** (e.g. `COM3` or `COM5`).
4. Click **Upload** (Arrow icon).
   *(Note: If the IDE shows `Connecting........_____.....`, press and hold the **BOOT** button on the ESP32 until the upload begins).*
5. Open **Tools -> Serial Monitor** and set the baud rate to **115200**.
6. You will see connection logs and live sensor readings transmitting to the backend.

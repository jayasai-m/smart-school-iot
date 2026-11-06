# SmartSchoolIoT – Hardware Wiring Guide

## Overview
This document specifies the exact physical wiring diagram for connecting the sensor suite to the ESP32 development board for the Government School Water & Mid-Day Meal Monitoring System.

---

## 1. Pin Connection Table

| Component | Component Pin | ESP32 Pin | Power Supply | Ground | Purpose / Function |
|---|---|---|---|---|---|
| **Ultrasonic Sensor (HC-SR04)** | VCC | - | +5V (VIN / VBUS) | GND | Sensor power |
| | GND | - | - | GND | Common ground |
| | TRIG | GPIO 5 | - | - | Ultrasonic pulse trigger (3.3V output from ESP32) |
| | ECHO | GPIO 18 (via Divider) | - | - | Echo pulse duration return (*Must use voltage divider!*) |
| **Turbidity Sensor (Analog)** | VCC | - | +5V (VIN) | GND | Sensor power |
| | GND | - | - | GND | Common ground |
| | AOUT (Analog) | GPIO 34 | - | - | Analog voltage corresponding to water clarity (ADC1) |
| **Kitchen Humidity Sensor (DHT11/22)** | VCC / + | - | +3.3V (3V3) | GND | Sensor power |
| | GND / - | - | - | GND | Common ground |
| | DATA / OUT | GPIO 4 | - | - | 1-Wire digital signal for humidity |
| **Active Buzzer** | VCC / (+) | GPIO 19 | - | - | Alarm trigger line (Driven HIGH on alert) |
| | GND / (-) | - | - | GND | Common ground return |
| **Built-in Status LED** | Anode | GPIO 2 | Internal | Internal | Transmission heartbeat / WiFi connection indicator |

---

## 2. Critical Electrical Safety & Voltage Protection Notes

### ⚠️ A. Ultrasonic Sensor (HC-SR04) Echo Voltage Step-Down
* The standard HC-SR04 operates at **5V** and outputs a **5V logic level** on its `ECHO` pin.
* The ESP32's GPIO pins are strictly rated for **3.3V maximum**. Connecting a 5V signal directly into an ESP32 GPIO pin will degrade or permanently damage the microcontroller.
* **Required Solution (Resistor Voltage Divider):**
  ```
  HC-SR04 ECHO Pin ──[ 1kΩ Resistor ]──┬──> ESP32 GPIO 18 (Input: ~3.3V)
                                       │
                                [ 2kΩ Resistor ]
                                       │
                                      GND
  ```
  *Formula:* \( V_{out} = 5.0V \times \frac{2k\Omega}{1k\Omega + 2k\Omega} = 3.33V \)
* Alternatively, use a 3.3V-compatible sensor like the **RCWL-1601** or the **JSN-SR04T (waterproof)** version 2.0/3.0 in 3.3V mode.

### ⚠️ B. Turbidity Sensor Analog Pin Protection
* Optical turbidity sensor modules are powered by **5V** to drive the infrared LED efficiently.
* Most modules feature an onboard signal conditioning board with an adjustable potentiometer and two output modes: **Digital (D)** and **Analog (A)**. Set the onboard switch to **"A" (Analog)**.
* Check the output voltage with a multimeter. If the sensor output reaches 4.5V in clear water, calibrate the onboard potentiometer or use a 2:1 resistive divider before connecting to **GPIO 34** (ADC1 channel 6) so that the maximum analog input does not exceed **3.3V**.

### ⚠️ C. DHT11 / DHT22 Pull-Up Resistor
* If you are using a bare 4-pin DHT sensor (not a 3-pin breakout board with built-in SMD resistor), place a **4.7kΩ to 10kΩ pull-up resistor** between the `DATA` pin (GPIO 4) and the `3.3V` rail.

### ⚠️ D. Common Ground
* All sensor grounds and the buzzer ground **MUST** be connected to a common ground rail on your breadboard that links directly to the `GND` pin of the ESP32.

---

## 3. Physical Breadboard Layout Schematic

```
               +----------------------------------+
               |             ESP32                |
               |                                  |
   [5V Rail] <---| VIN                        GND |---> [GND Rail]
 [3.3V Rail] <---| 3V3                       GPIO2 |---> (Built-in LED)
                 | GPIO5 (TRIG)            GPIO18 |<--- [ECHO via 1kΩ / 2kΩ divider]
                 | GPIO4 (DHT DATA)        GPIO19 |---> [Buzzer (+)]
                 | GPIO34 (Turbidity AOUT)        |
               +----------------------------------+
```

---

## 4. Tank Physical Mounting Considerations
1. **Ultrasonic Sensor Placement:**
   - Mount sensor facing downwards perpendicularly at the top of the water tank.
   - Maintain at least **10 cm** clearance (`SENSOR_OFFSET_CM`) from the maximum high-water mark, as ultrasonic sensors have a physical blind zone (dead band) of approximately 2 cm to 15 cm.
2. **Turbidity Sensor Placement:**
   - Submerge only the optical probe into the drinking water tank or intake manifold.
   - Do **NOT** submerge the blue adapter board! The electronics board must stay dry.
3. **Humidity Sensor Placement:**
   - Mount in the mid-day meal kitchen at breathing height (approx 1.5 meters from floor), away from direct stove flames or water splashing.

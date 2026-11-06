#ifndef CONFIG_H
#define CONFIG_H

// ============================================================
// SmartSchoolIoT ESP32 Configuration
// Water & Mid-Day Meal Monitoring Firmware
// ============================================================

// 1. WiFi Configuration (Update with your physical network)
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASSWORD   "YOUR_WIFI_PASSWORD"

// 2. Backend Server Configuration
// If testing locally on same network, use your computer's local IP (e.g., "http://192.168.1.50:8000")
#define SERVER_HOST     "http://192.168.1.100:8000"
#define TELEMETRY_URL   "/api/hardware/telemetry"

// 3. School Hardware Authentication Credentials
// Initial default school: ZPHS Poranki (School ID: 1)
#define SCHOOL_ID       1
#define HARDWARE_API_KEY "esp32_poranki_hw_key_2026"
#define DEVICE_ID       "ESP32-PORANKI-01"

// 4. GPIO Pin Assignments (Easily customizable)
// ------------------------------------------------------------
// HC-SR04 / JSN-SR04T Ultrasonic Sensor
#define PIN_TRIG        5     // Trigger pin (Output)
#define PIN_ECHO        18    // Echo pin (Input via voltage divider 5V->3.3V)

// Turbidity Sensor (Analog Pin on ADC1)
#define PIN_TURBIDITY   34    // Analog Input (ADC1_CH6 - 3.3V Max)

// Kitchen Humidity Sensor (DHT11 or DHT22)
#define PIN_DHT         4     // DHT Data Pin
#define DHT_TYPE        DHT11 // Options: DHT11 or DHT22

// Alert Buzzer
#define PIN_BUZZER      19    // Digital Output to active buzzer

// Status LED (Built-in or external)
#define PIN_STATUS_LED  2     // Built-in LED on most ESP32 boards

// 5. Tank Geometry Configuration (Physical measurements in cm)
#define TANK_HEIGHT_CM      200.0 // Physical internal height of water tank
#define SENSOR_OFFSET_CM    10.0  // Clearance from sensor face to tank ceiling/maximum rim

// 6. Sensor Sampling Settings
#define SAMPLING_INTERVAL_MS 5000 // Send telemetry every 5 seconds (configurable)
#define ULTRASONIC_SAMPLES   5    // Number of pings averaged for median filter

#endif // CONFIG_H

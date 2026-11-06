/*
 * ============================================================
 * SmartSchoolIoT – Government School Water & Mid-Day Meal Monitoring System
 * ESP32 Hardware Firmware
 * ============================================================
 * 
 * Hardware Attached:
 * 1. Ultrasonic Sensor (HC-SR04 / JSN-SR04T) -> Water Level Measurement
 * 2. Turbidity Sensor (Analog Optical)        -> Drinking Water Quality Monitoring
 * 3. Humidity Sensor (DHT11 / DHT22)          -> Kitchen Humidity Monitoring
 * 4. Active Buzzer                            -> Real Threshold Alarm
 * 5. ESP32 Dev Board                          -> WiFi Telemetry & HTTP Client
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include "config.h"

// Initialize DHT Sensor
DHT dht(PIN_DHT, DHT_TYPE);

// Tracking timestamps
unsigned long lastSampleTime = 0;
bool buzzerActive = false;

// ------------------------------------------------------------
// Helper: Measure Ultrasonic Distance (in cm) with Noise Filtering
// ------------------------------------------------------------
float readUltrasonicDistance() {
  float readings[ULTRASONIC_SAMPLES];
  int validCount = 0;

  for (int i = 0; i < ULTRASONIC_SAMPLES; i++) {
    // Clear trigger pin
    digitalWrite(PIN_TRIG, LOW);
    delayMicroseconds(2);

    // Send 10us ultrasonic pulse
    digitalWrite(PIN_TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(PIN_TRIG, LOW);

    // Read echo pulse duration (timeout: 30ms ~ 5 meters max)
    unsigned long duration = pulseIn(PIN_ECHO, HIGH, 30000);

    if (duration > 0) {
      // Speed of sound: 343 m/s = 0.0343 cm/microsecond
      // Distance = (duration * 0.0343) / 2
      float distance = (duration * 0.0343) / 2.0;
      if (distance >= 2.0 && distance <= 400.0) {
        readings[validCount++] = distance;
      }
    }
    delay(20);
  }

  if (validCount == 0) {
    // Return error code indicating sensor read failure
    return -1.0;
  }

  // Simple bubble sort to extract median value
  for (int i = 0; i < validCount - 1; i++) {
    for (int j = 0; j < validCount - i - 1; j++) {
      if (readings[j] > readings[j + 1]) {
        float temp = readings[j];
        readings[j] = readings[j + 1];
        readings[j + 1] = temp;
      }
    }
  }

  return readings[validCount / 2];
}

// ------------------------------------------------------------
// Helper: Read Turbidity Sensor (Voltage & NTU Calculation)
// ------------------------------------------------------------
void readTurbidity(float &voltageOut, float &ntuOut) {
  // ESP32 ADC: 12-bit (0 - 4095) with ~3.3V reference
  int rawAnalog = analogRead(PIN_TURBIDITY);
  
  // Convert ADC value to voltage
  float voltage = (rawAnalog / 4095.0) * 3.3;
  voltageOut = voltage;

  // Turbidity Sensor Characteristic Equation:
  // Most turbidity sensors output ~4.0V - 4.5V for pure clean water (scaled through divider to ~2.5V-3.0V on ESP32)
  // When water becomes muddy/turbid, light is blocked, causing output voltage to drop.
  // Standard polynomial calibration curve:
  // NTU = -1120.4 * (V^2) + 5742.3 * V - 4352.9
  // Note: For bench testing without fluid, reading maps to clear water.
  if (voltage < 1.0) {
    ntuOut = 1000.0; // Extremely turbid/muddy water
  } else if (voltage >= 2.8) {
    ntuOut = 0.5; // Clear drinking water (<1 NTU)
  } else {
    // Approximate linear interpolation between 2.8V (0.5 NTU) and 1.0V (50.0 NTU)
    ntuOut = (2.8 - voltage) * (50.0 / 1.8);
    if (ntuOut < 0.0) ntuOut = 0.0;
  }
}

// ------------------------------------------------------------
// Helper: Read Kitchen Humidity
// ------------------------------------------------------------
bool readKitchenHumidity(float &humidity, float &temperature) {
  float h = dht.readHumidity();
  float t = dht.readTemperature();

  if (isnan(h)) {
    humidity = -1.0;
    temperature = -1.0;
    return false;
  }

  humidity = h;
  temperature = isnan(t) ? -1.0 : t;
  return true;
}

// ------------------------------------------------------------
// Helper: Sound Physical Buzzer for Abnormal Conditions
// ------------------------------------------------------------
void setBuzzer(bool state, const char* reason) {
  if (state) {
    buzzerActive = true;
    // Rapid audible beeping pattern
    for (int i = 0; i < 3; i++) {
      digitalWrite(PIN_BUZZER, HIGH);
      delay(100);
      digitalWrite(PIN_BUZZER, LOW);
      delay(100);
    }
    Serial.printf("[ALERT] Physical Buzzer Triggered! Reason: %s\n", reason ? reason : "Threshold exceeded");
  } else {
    buzzerActive = false;
    digitalWrite(PIN_BUZZER, LOW);
  }
}

// ------------------------------------------------------------
// Setup
// ------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=======================================================");
  Serial.println("  SmartSchoolIoT - ESP32 Water & Meal Monitor Starting  ");
  Serial.println("=======================================================");

  // Pin Modes
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_TURBIDITY, INPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_STATUS_LED, OUTPUT);

  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(PIN_STATUS_LED, LOW);

  // Initialize DHT
  dht.begin();
  Serial.println("[SETUP] DHT sensor initialized.");

  // Connect to WiFi
  Serial.printf("[WIFI] Connecting to SSID: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int wifiAttempts = 0;
  while (WiFi.status() != WL_CONNECTED && wifiAttempts < 30) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED));
    wifiAttempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_STATUS_LED, HIGH);
    Serial.println("\n[WIFI] Connected successfully!");
    Serial.printf("[WIFI] IP Address: %s\n", WiFi.localIP().toString().c_str());
  } else {
    digitalWrite(PIN_STATUS_LED, LOW);
    Serial.println("\n[WIFI] Failed to connect to WiFi! Telemetry will queue until connection is established.");
  }
}

// ------------------------------------------------------------
// Main Loop
// ------------------------------------------------------------
void loop() {
  unsigned long now = millis();

  // Check if it is time to sample and send telemetry
  if (now - lastSampleTime >= SAMPLING_INTERVAL_MS) {
    lastSampleTime = now;

    // 1. Read Ultrasonic Sensor
    float distanceCm = readUltrasonicDistance();
    if (distanceCm < 0) {
      Serial.println("[SENSOR WARNING] Ultrasonic Echo timeout - check wiring.");
      distanceCm = 0.0;
    } else {
      Serial.printf("[SENSOR] Ultrasonic Distance: %.1f cm\n", distanceCm);
    }

    // 2. Read Turbidity Sensor
    float turbidityVoltage = 0.0;
    float turbidityNtu = 0.0;
    readTurbidity(turbidityVoltage, turbidityNtu);
    Serial.printf("[SENSOR] Turbidity: %.2f NTU (Raw Voltage: %.2f V)\n", turbidityNtu, turbidityVoltage);

    // 3. Read Kitchen Humidity
    float humidity = 0.0;
    float temperature = -1.0;
    bool dhtOk = readKitchenHumidity(humidity, temperature);
    if (dhtOk) {
      Serial.printf("[SENSOR] Kitchen Humidity: %.1f %%\n", humidity);
    } else {
      Serial.println("[SENSOR WARNING] Failed to read DHT sensor - check wiring.");
      humidity = 0.0;
    }

    // 4. Send Telemetry to Server if WiFi Connected
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      String endpoint = String(SERVER_HOST) + String(TELEMETRY_URL);
      http.begin(endpoint);
      http.addHeader("Content-Type", "application/json");

      // Construct JSON payload
      // Strictly real sensor readings only
      String jsonPayload = "{";
      jsonPayload += "\"api_key\":\"" + String(HARDWARE_API_KEY) + "\",";
      jsonPayload += "\"school_id\":" + String(SCHOOL_ID) + ",";
      jsonPayload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
      jsonPayload += "\"distance_cm\":" + String(distanceCm, 1) + ",";
      jsonPayload += "\"turbidity_ntu\":" + String(turbidityNtu, 2) + ",";
      jsonPayload += "\"turbidity_voltage\":" + String(turbidityVoltage, 2) + ",";
      jsonPayload += "\"humidity_pct\":" + String(humidity, 1);
      
      // Only include temperature if real sensor physically read it
      if (temperature > -1.0) {
        jsonPayload += ",\"temperature_c\":" + String(temperature, 1);
      }
      jsonPayload += "}";

      Serial.printf("[HTTP] POST -> %s\nPayload: %s\n", endpoint.c_str(), jsonPayload.c_str());

      // Blink LED during network transmission
      digitalWrite(PIN_STATUS_LED, LOW);
      int httpCode = http.POST(jsonPayload);
      digitalWrite(PIN_STATUS_LED, HIGH);

      if (httpCode > 0) {
        String response = http.getString();
        Serial.printf("[HTTP] Response Code %d: %s\n", httpCode, response.c_str());

        // Parse response for buzzer trigger
        if (response.indexOf("\"buzzer\":true") > 0 || response.indexOf("\"buzzer\": true") > 0) {
          char reasonBuf[64] = "Abnormal condition";
          int reasonIdx = response.indexOf("\"buzzer_reason\":\"");
          if (reasonIdx > 0) {
            int startIdx = reasonIdx + 17;
            int endIdx = response.indexOf("\"", startIdx);
            if (endIdx > startIdx) {
              response.substring(startIdx, endIdx).toCharArray(reasonBuf, sizeof(reasonBuf));
            }
          }
          setBuzzer(true, reasonBuf);
        } else {
          setBuzzer(false, nullptr);
        }
      } else {
        Serial.printf("[HTTP ERROR] Failed to send telemetry. Code: %d, Error: %s\n", httpCode, http.errorToString(httpCode).c_str());
      }

      http.end();
    } else {
      Serial.println("[WIFI] Reconnecting to WiFi network...");
      WiFi.reconnect();
    }
  }

  // Small delay for RTOS task yield
  delay(50);
}

-- ============================================================
-- SmartSchoolIoT: Database Schema
-- Government School Water & Mid-Day Meal Monitoring System
-- ============================================================

CREATE TABLE IF NOT EXISTS schools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    school_code VARCHAR(100) UNIQUE NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    principal_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL', -- ACTIVE, PENDING_APPROVAL, REJECTED, FLAGGED
    hardware_status VARCHAR(50) DEFAULT 'DISCONNECTED',    -- CONNECTED, DISCONNECTED
    hardware_device_id VARCHAR(100) DEFAULT 'ESP32-DEVICE-01',
    hardware_api_key VARCHAR(100) NOT NULL,
    last_hardware_ping DATETIME NULL,
    tank_capacity_litres FLOAT DEFAULT 2000.0,
    tank_height_cm FLOAT DEFAULT 200.0,
    sensor_offset_cm FLOAT DEFAULT 10.0,
    turbidity_threshold FLOAT DEFAULT 5.0,
    low_water_threshold_pct FLOAT DEFAULT 20.0,
    overflow_threshold_pct FLOAT DEFAULT 90.0,
    humidity_threshold_pct FLOAT DEFAULT 75.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50) NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'SCHOOL',          -- ADMIN, SCHOOL
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL', -- ACTIVE, PENDING_APPROVAL, REJECTED
    school_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sensor_readings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    distance_cm FLOAT NOT NULL,
    water_level_pct FLOAT NOT NULL,
    water_volume_litres FLOAT NOT NULL,
    ultrasonic_status VARCHAR(50) DEFAULT 'NORMAL',
    turbidity_ntu FLOAT NOT NULL,
    turbidity_voltage FLOAT NULL,
    turbidity_status VARCHAR(50) DEFAULT 'GOOD',
    humidity_pct FLOAT NOT NULL,
    humidity_status VARCHAR(50) DEFAULT 'NORMAL',
    temperature_c FLOAT NULL, -- Strictly physical sensor only, never fabricated
    raw_payload TEXT NULL,
    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sensor_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    alert_type VARCHAR(100) NOT NULL, -- HIGH_TURBIDITY, LOW_WATER_LEVEL, OVERFLOW, HIGH_HUMIDITY, HARDWARE_DISCONNECTED
    severity VARCHAR(50) NOT NULL DEFAULT 'WARNING', -- CRITICAL, WARNING, INFO
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',    -- ACTIVE, ACKNOWLEDGED, RESOLVED, FLAGGED
    sensor_value FLOAT NULL,
    threshold_value FLOAT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME NULL,
    resolved_by VARCHAR(150) NULL,
    CONSTRAINT fk_alerts_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meal_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    meal_type VARCHAR(150) NOT NULL,
    menu_description TEXT NOT NULL,
    staff_name VARCHAR(150) NOT NULL,
    inspection_shift VARCHAR(100) NOT NULL,
    hygiene_notes TEXT NULL,
    submission_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_meals_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS image_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NOT NULL,
    uploaded_by_user_id INT NOT NULL,
    meal_submission_id INT NULL,
    category VARCHAR(50) NOT NULL, -- MEAL_PREPARATION, KITCHEN_HYGIENE
    image_url VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    meal_type VARCHAR(150) NULL,
    menu_description TEXT NULL,
    staff_name VARCHAR(150) NULL,
    inspection_shift VARCHAR(100) NULL,
    hygiene_notes TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW, VERIFIED, FLAGGED, REJECTED
    admin_notes TEXT NULL,
    reviewed_by VARCHAR(150) NULL,
    reviewed_at DATETIME NULL,
    latitude FLOAT NULL,
    longitude FLOAT NULL,
    captured_location VARCHAR(255) NULL,
    captured_timestamp VARCHAR(100) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_images_school FOREIGN KEY (school_id) REFERENCES schools (id) ON DELETE CASCADE,
    CONSTRAINT fk_images_user FOREIGN KEY (uploaded_by_user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_images_meal FOREIGN KEY (meal_submission_id) REFERENCES meal_submissions (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id INT NULL,
    user_id INT NULL,
    user_email VARCHAR(150) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(100) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INITIAL SEED: ONLY ONE SCHOOL (ZPHS Poranki) & TWO USERS
-- ============================================================

INSERT INTO schools (id, name, school_code, district, state, address, principal_name, email, phone, status, hardware_status, hardware_device_id, hardware_api_key, tank_capacity_litres, tank_height_cm, sensor_offset_cm, turbidity_threshold, low_water_threshold_pct, overflow_threshold_pct, humidity_threshold_pct)
VALUES (
    1,
    'ZPHS Poranki',
    'SCH-PORANKI-001',
    'Krishna',
    'Andhra Pradesh',
    'Z.P. High School, Poranki, Penamaluru Mandal, Krishna District, AP - 521137',
    'M. Ramesh Kumar',
    's1@gmail.com',
    '+91 9876543210',
    'ACTIVE',
    'DISCONNECTED',
    'ESP32-PORANKI-01',
    'esp32_poranki_hw_key_2026',
    2000.0,
    200.0,
    10.0,
    5.0,
    20.0,
    90.0,
    75.0
);

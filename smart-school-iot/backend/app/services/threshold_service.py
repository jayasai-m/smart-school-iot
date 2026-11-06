from datetime import datetime
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from ..models.school import School
from ..models.sensor import SensorReading
from ..models.alert import Alert
from .firebase_service import sync_telemetry_to_firebase

def process_sensor_telemetry(
    db: Session,
    school: School,
    distance_cm: float,
    turbidity_ntu: float,
    humidity_pct: float,
    turbidity_voltage: float = None,
    temperature_c: float = None,
    raw_payload: str = None
) -> Tuple[SensorReading, bool, str]:
    """
    Computes real physical values, evaluates safety thresholds, creates real alerts if abnormal,
    and determines whether physical buzzer on the ESP32 should sound.
    Strictly follows: 'Do not generate alerts randomly. Do not create alerts without actual sensor data.'
    """
    tank_height = school.tank_height_cm if school.tank_height_cm > 0 else 200.0
    offset = school.sensor_offset_cm if school.sensor_offset_cm is not None else 10.0
    capacity = school.tank_capacity_litres if school.tank_capacity_litres > 0 else 2000.0
    
    # Calculate water level from ultrasonic distance
    # Distance is measured from sensor at the top down to the water surface
    # Water column height = tank_height + offset - distance
    calculated_height = (tank_height + offset) - distance_cm
    water_height_cm = max(0.0, min(tank_height, calculated_height))
    
    water_level_pct = round((water_height_cm / tank_height) * 100.0, 1)
    water_volume_litres = round((water_level_pct / 100.0) * capacity, 1)
    
    # Ultrasonic condition
    ultrasonic_status = "NORMAL"
    if water_level_pct >= school.overflow_threshold_pct:
        ultrasonic_status = "OVERFLOW"
    elif water_level_pct <= school.low_water_threshold_pct:
        ultrasonic_status = "LOW"
        
    # Turbidity condition
    turbidity_status = "GOOD"
    if turbidity_ntu > school.turbidity_threshold:
        turbidity_status = "POOR"
    elif turbidity_ntu > (school.turbidity_threshold * 0.7):
        turbidity_status = "MODERATE"
        
    # Kitchen humidity condition
    humidity_status = "NORMAL"
    if humidity_pct > school.humidity_threshold_pct:
        humidity_status = "HIGH"
        
    # Save reading to database
    reading = SensorReading(
        school_id=school.id,
        distance_cm=round(distance_cm, 1),
        water_level_pct=water_level_pct,
        water_volume_litres=water_volume_litres,
        ultrasonic_status=ultrasonic_status,
        turbidity_ntu=round(turbidity_ntu, 2),
        turbidity_voltage=round(turbidity_voltage, 3) if turbidity_voltage is not None else None,
        turbidity_status=turbidity_status,
        humidity_pct=round(humidity_pct, 1),
        humidity_status=humidity_status,
        temperature_c=round(temperature_c, 1) if temperature_c is not None else None,
        raw_payload=raw_payload,
        recorded_at=datetime.utcnow()
    )
    db.add(reading)
    
    # Update school hardware status
    school.hardware_status = "CONNECTED"
    school.last_hardware_ping = datetime.utcnow()
    
    # Threshold Alert Logic and Physical Buzzer Evaluation
    buzzer_needed = False
    buzzer_reason = None
    
    # 1. Turbidity Check
    if turbidity_status == "POOR":
        buzzer_needed = True
        buzzer_reason = "HIGH_TURBIDITY"
        existing_alert = db.query(Alert).filter(
            Alert.school_id == school.id,
            Alert.alert_type == "HIGH_TURBIDITY",
            Alert.status == "ACTIVE"
        ).first()
        if not existing_alert:
            new_alert = Alert(
                school_id=school.id,
                alert_type="HIGH_TURBIDITY",
                severity="CRITICAL",
                message=f"High turbidity detected: {turbidity_ntu:.2f} NTU exceeds drinking water threshold ({school.turbidity_threshold:.1f} NTU)",
                status="ACTIVE",
                sensor_value=turbidity_ntu,
                threshold_value=school.turbidity_threshold,
                created_at=datetime.utcnow()
            )
            db.add(new_alert)
            
    # 2. Low Water Check
    if ultrasonic_status == "LOW":
        buzzer_needed = True
        if not buzzer_reason:
            buzzer_reason = "LOW_WATER_LEVEL"
        existing_alert = db.query(Alert).filter(
            Alert.school_id == school.id,
            Alert.alert_type == "LOW_WATER_LEVEL",
            Alert.status == "ACTIVE"
        ).first()
        if not existing_alert:
            new_alert = Alert(
                school_id=school.id,
                alert_type="LOW_WATER_LEVEL",
                severity="WARNING",
                message=f"Low water level: {water_level_pct:.1f}% ({water_volume_litres:.0f} L) is below minimum reserve ({school.low_water_threshold_pct:.0f}%)",
                status="ACTIVE",
                sensor_value=water_level_pct,
                threshold_value=school.low_water_threshold_pct,
                created_at=datetime.utcnow()
            )
            db.add(new_alert)
            
    # 3. Overflow Check
    if ultrasonic_status == "OVERFLOW":
        buzzer_needed = True
        buzzer_reason = "OVERFLOW"
        existing_alert = db.query(Alert).filter(
            Alert.school_id == school.id,
            Alert.alert_type == "OVERFLOW",
            Alert.status == "ACTIVE"
        ).first()
        if not existing_alert:
            new_alert = Alert(
                school_id=school.id,
                alert_type="OVERFLOW",
                severity="CRITICAL",
                message=f"Water tank overflow risk: {water_level_pct:.1f}% reached overflow cutoff threshold ({school.overflow_threshold_pct:.0f}%)",
                status="ACTIVE",
                sensor_value=water_level_pct,
                threshold_value=school.overflow_threshold_pct,
                created_at=datetime.utcnow()
            )
            db.add(new_alert)
            
    # 4. Kitchen Humidity Check
    if humidity_status == "HIGH":
        existing_alert = db.query(Alert).filter(
            Alert.school_id == school.id,
            Alert.alert_type == "HIGH_HUMIDITY",
            Alert.status == "ACTIVE"
        ).first()
        if not existing_alert:
            new_alert = Alert(
                school_id=school.id,
                alert_type="HIGH_HUMIDITY",
                severity="WARNING",
                message=f"High kitchen humidity: {humidity_pct:.1f}% exceeds threshold ({school.humidity_threshold_pct:.0f}%). Potential mold/hygiene risk.",
                status="ACTIVE",
                sensor_value=humidity_pct,
                threshold_value=school.humidity_threshold_pct,
                created_at=datetime.utcnow()
            )
            db.add(new_alert)
            
    db.commit()
    db.refresh(reading)
    
    # Mirror real sensor telemetry to Firebase Realtime Database
    try:
        sync_telemetry_to_firebase(school.school_code, {
            "school_id": school.id,
            "school_name": school.name,
            "distance_cm": reading.distance_cm,
            "water_level_pct": reading.water_level_pct,
            "water_volume_litres": reading.water_volume_litres,
            "turbidity_ntu": reading.turbidity_ntu,
            "humidity_pct": reading.humidity_pct,
            "temperature_c": reading.temperature_c,
            "hardware_status": "CONNECTED"
        })
    except Exception:
        pass
    
    return reading, buzzer_needed, buzzer_reason

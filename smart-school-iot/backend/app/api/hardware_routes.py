import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..models.school import School
from ..schemas.all_schemas import TelemetryIngest, TelemetryResponse
from ..services.threshold_service import process_sensor_telemetry

router = APIRouter(prefix="/api/hardware", tags=["Hardware Telemetry"])

HARDWARE_TIMEOUT_SECONDS = int(os.getenv("HARDWARE_TIMEOUT_SECONDS", "60"))

@router.post("/telemetry", response_model=TelemetryResponse)
def receive_telemetry(data: TelemetryIngest, db: Session = Depends(get_db)):
    """
    Ingests real physical telemetry transmitted from the ESP32 microcontroller.
    - Validates school credentials (API key or school ID)
    - Processes ultrasonic distance, turbidity NTU, and kitchen humidity
    - Triggers threshold warnings and buzzer commands
    """
    school = None
    if data.api_key:
        school = db.query(School).filter(School.hardware_api_key == data.api_key).first()
    elif data.school_id:
        school = db.query(School).filter(School.id == data.school_id).first()
        
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not recognized or invalid hardware credentials"
        )
        
    if school.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"School is not active. Current status: {school.status}"
        )
        
    # Process physical sensor readings and threshold evaluations
    reading, buzzer_needed, buzzer_reason = process_sensor_telemetry(
        db=db,
        school=school,
        distance_cm=data.distance_cm,
        turbidity_ntu=data.turbidity_ntu,
        humidity_pct=data.humidity_pct,
        turbidity_voltage=data.turbidity_voltage,
        temperature_c=data.temperature_c,
        raw_payload=data.json()
    )
    
    return TelemetryResponse(
        status="success",
        buzzer=buzzer_needed,
        buzzer_reason=buzzer_reason,
        message=f"Telemetry recorded for {school.name}. Level: {reading.water_level_pct}%, Turbidity: {reading.turbidity_ntu} NTU, Humidity: {reading.humidity_pct}%"
    )

@router.get("/status/{school_id}")
def check_hardware_status(school_id: int, db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    if not school.last_hardware_ping:
        return {
            "status": "DISCONNECTED",
            "message": "Hardware Not Connected",
            "last_ping": None,
            "seconds_since_ping": None
        }
        
    now = datetime.utcnow()
    diff = (now - school.last_hardware_ping).total_seconds()
    
    if diff <= HARDWARE_TIMEOUT_SECONDS:
        return {
            "status": "CONNECTED",
            "message": "ESP32 Connected",
            "last_ping": school.last_hardware_ping.isoformat(),
            "seconds_since_ping": int(diff)
        }
    else:
        return {
            "status": "DISCONNECTED",
            "message": "ESP32 Disconnected (No signal recently)",
            "last_ping": school.last_hardware_ping.isoformat(),
            "seconds_since_ping": int(diff)
        }

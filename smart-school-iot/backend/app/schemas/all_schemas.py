from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth Schemas -----------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    email: str
    full_name: str
    status: str
    school_id: Optional[int] = None
    school_name: Optional[str] = None

class SchoolRegisterRequest(BaseModel):
    school_name: str = Field(..., min_length=2)
    school_code: str = Field(..., min_length=2) # School ID
    district: str = Field(..., min_length=2)
    state: str = Field(..., min_length=2)
    address: str = Field(..., min_length=5)
    principal_name: str = Field(..., min_length=2)
    email: EmailStr
    phone: str = Field(..., min_length=6)
    password: str = Field(..., min_length=6)
    confirm_password: str

# ----------------- School Schemas -----------------

class SchoolResponse(BaseModel):
    id: int
    name: str
    school_code: str
    district: str
    state: str
    address: str
    principal_name: str
    email: str
    phone: str
    status: str
    hardware_status: str
    hardware_device_id: str
    hardware_api_key: str
    last_hardware_ping: Optional[datetime] = None
    tank_capacity_litres: float
    tank_height_cm: float
    sensor_offset_cm: float
    turbidity_threshold: float
    low_water_threshold_pct: float
    overflow_threshold_pct: float
    humidity_threshold_pct: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SchoolApprovalAction(BaseModel):
    action: str = Field(..., description="APPROVE, REJECT, or FLAG")
    notes: Optional[str] = None

class SchoolThresholdsUpdate(BaseModel):
    tank_capacity_litres: Optional[float] = None
    tank_height_cm: Optional[float] = None
    sensor_offset_cm: Optional[float] = None
    turbidity_threshold: Optional[float] = None
    low_water_threshold_pct: Optional[float] = None
    overflow_threshold_pct: Optional[float] = None
    humidity_threshold_pct: Optional[float] = None

# ----------------- Sensor / Telemetry Schemas -----------------

class TelemetryIngest(BaseModel):
    api_key: Optional[str] = None
    school_id: Optional[int] = None
    device_id: Optional[str] = "ESP32-WATER-MONITOR"
    distance_cm: float
    turbidity_ntu: float
    turbidity_voltage: Optional[float] = None
    humidity_pct: float
    temperature_c: Optional[float] = None # Physical sensor reading only, else None

class TelemetryResponse(BaseModel):
    status: str
    buzzer: bool
    buzzer_reason: Optional[str] = None
    message: str

class SensorReadingResponse(BaseModel):
    id: int
    school_id: int
    distance_cm: float
    water_level_pct: float
    water_volume_litres: float
    ultrasonic_status: str
    turbidity_ntu: float
    turbidity_voltage: Optional[float] = None
    turbidity_status: str
    humidity_pct: float
    humidity_status: str
    temperature_c: Optional[float] = None
    recorded_at: datetime

    class Config:
        from_attributes = True

# ----------------- Meal & Image Schemas -----------------

class MealCreate(BaseModel):
    meal_type: str
    menu_description: str
    staff_name: str
    inspection_shift: str
    hygiene_notes: Optional[str] = None

class MealResponse(BaseModel):
    id: int
    school_id: int
    meal_type: str
    menu_description: str
    staff_name: str
    inspection_shift: str
    hygiene_notes: Optional[str] = None
    submission_date: date
    created_at: datetime

    class Config:
        from_attributes = True

class ImageReviewAction(BaseModel):
    status: str = Field(..., description="VERIFIED, FLAGGED, or REJECTED")
    admin_notes: Optional[str] = None

class ImageSubmissionResponse(BaseModel):
    id: int
    school_id: int
    school_name: Optional[str] = None
    uploaded_by_user_id: int
    meal_submission_id: Optional[int] = None
    category: str
    image_url: str
    file_name: str
    meal_type: Optional[str] = None
    menu_description: Optional[str] = None
    staff_name: Optional[str] = None
    inspection_shift: Optional[str] = None
    hygiene_notes: Optional[str] = None
    status: str
    admin_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    captured_location: Optional[str] = None
    captured_timestamp: Optional[str] = None
    # Computer Vision results
    cv_status: Optional[str] = None
    cv_notes: Optional[str] = None
    cv_confidence: Optional[float] = None
    cv_processed_at: Optional[datetime] = None
    cv_student_count: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Alert Schemas -----------------

class AlertResponse(BaseModel):
    id: int
    school_id: int
    school_name: Optional[str] = None
    alert_type: str
    severity: str
    message: str
    status: str
    sensor_value: Optional[float] = None
    threshold_value: Optional[float] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

    class Config:
        from_attributes = True

class AlertAction(BaseModel):
    status: str = Field(..., description="ACKNOWLEDGED, RESOLVED, or FLAGGED")
    notes: Optional[str] = None

# ----------------- Audit Log Schemas -----------------

class AuditLogResponse(BaseModel):
    id: int
    school_id: Optional[int] = None
    school_name: Optional[str] = None
    user_id: Optional[int] = None
    user_email: str
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Inspector Schemas -----------------

class InspectorRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: EmailStr
    phone: str = Field(..., min_length=6)
    district: Optional[str] = None
    password: str = Field(..., min_length=6)
    confirm_password: str

class InspectorApprovalAction(BaseModel):
    action: str = Field(..., description="APPROVE or REJECT")
    notes: Optional[str] = None

class AssignSchoolsRequest(BaseModel):
    school_ids: List[int]

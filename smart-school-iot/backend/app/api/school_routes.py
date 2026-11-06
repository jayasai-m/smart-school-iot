import os
import uuid
import shutil
import threading
from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..models.user import User
from ..models.school import School
from ..models.sensor import SensorReading
from ..models.meal import MealSubmission, ImageSubmission
from ..models.alert import Alert
from ..schemas.all_schemas import (
    SensorReadingResponse, MealCreate, MealResponse,
    ImageSubmissionResponse, AlertResponse
)
from ..auth.deps import require_school
from ..services.audit_service import log_audit
from ..services.cv_service import food_quality_check, count_students_in_image

router = APIRouter(prefix="/api/school", tags=["School Panel"])

HARDWARE_TIMEOUT_SECONDS = int(os.getenv("HARDWARE_TIMEOUT_SECONDS", "60"))
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")

def get_live_hardware_status(school: School) -> dict:
    if not school.last_hardware_ping:
        return {"status": "DISCONNECTED", "label": "Hardware Not Connected"}
    diff = (datetime.utcnow() - school.last_hardware_ping).total_seconds()
    if diff <= HARDWARE_TIMEOUT_SECONDS:
        return {"status": "CONNECTED", "label": "ESP32 Connected"}
    return {"status": "DISCONNECTED", "label": "ESP32 Disconnected"}

@router.get("/dashboard")
def get_school_dashboard(current_user: User = Depends(require_school), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    hw_info = get_live_hardware_status(school)
    
    # Latest reading - ONLY REAL DATA FROM DATABASE
    latest_reading = db.query(SensorReading).filter(
        SensorReading.school_id == school.id
    ).order_by(SensorReading.recorded_at.desc()).first()
    
    # Active alerts
    active_alerts = db.query(Alert).filter(
        Alert.school_id == school.id,
        Alert.status == "ACTIVE"
    ).order_by(Alert.created_at.desc()).all()
    
    # Today's meal
    today_meal = db.query(MealSubmission).filter(
        MealSubmission.school_id == school.id,
        MealSubmission.submission_date == date.today()
    ).first()
    
    # Recent images
    recent_images = db.query(ImageSubmission).filter(
        ImageSubmission.school_id == school.id
    ).order_by(ImageSubmission.created_at.desc()).limit(5).all()
    
    return {
        "school": {
            "id": school.id,
            "name": school.name,
            "school_code": school.school_code,
            "district": school.district,
            "state": school.state,
            "tank_capacity_litres": school.tank_capacity_litres,
            "tank_height_cm": school.tank_height_cm,
            "hardware_device_id": school.hardware_device_id,
            "hardware_api_key": school.hardware_api_key
        },
        "hardware": hw_info,
        "latest_reading": latest_reading,
        "active_alerts_count": len(active_alerts),
        "recent_alerts": active_alerts[:5],
        "today_meal": today_meal,
        "recent_images": recent_images
    }

@router.get("/digital-twin")
def get_school_digital_twin(current_user: User = Depends(require_school), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    hw_info = get_live_hardware_status(school)
    
    latest_reading = db.query(SensorReading).filter(
        SensorReading.school_id == school.id
    ).order_by(SensorReading.recorded_at.desc()).first()
    
    return {
        "school_id": school.id,
        "school_name": school.name,
        "tank_capacity_litres": school.tank_capacity_litres,
        "tank_height_cm": school.tank_height_cm,
        "hardware_status": hw_info["status"],
        "hardware_label": hw_info["label"],
        "last_sensor_update": latest_reading.recorded_at.isoformat() if latest_reading else None,
        "sensor_data": latest_reading
    }

@router.get("/water")
def get_school_water(current_user: User = Depends(require_school), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    hw_info = get_live_hardware_status(school)
    
    latest_reading = db.query(SensorReading).filter(
        SensorReading.school_id == school.id
    ).order_by(SensorReading.recorded_at.desc()).first()
    
    # Real historical records only (ordered chronologically for charts)
    history = db.query(SensorReading).filter(
        SensorReading.school_id == school.id
    ).order_by(SensorReading.recorded_at.desc()).limit(50).all()
    # Reverse to ascending order for chronological charts
    history = list(reversed(history))
    
    return {
        "school": {
            "id": school.id,
            "name": school.name,
            "tank_capacity_litres": school.tank_capacity_litres,
            "tank_height_cm": school.tank_height_cm,
            "turbidity_threshold": school.turbidity_threshold,
            "low_water_threshold_pct": school.low_water_threshold_pct,
            "overflow_threshold_pct": school.overflow_threshold_pct
        },
        "hardware": hw_info,
        "latest": latest_reading,
        "history": history
    }

@router.get("/meals")
def get_school_meals(current_user: User = Depends(require_school), db: Session = Depends(get_db)):
    meals = db.query(MealSubmission).filter(
        MealSubmission.school_id == current_user.school_id
    ).order_by(MealSubmission.created_at.desc()).all()
    
    images = db.query(ImageSubmission).filter(
        ImageSubmission.school_id == current_user.school_id
    ).order_by(ImageSubmission.created_at.desc()).all()
    
    # Also fetch humidity sensor reading if available
    latest_sensor = db.query(SensorReading).filter(
        SensorReading.school_id == current_user.school_id
    ).order_by(SensorReading.recorded_at.desc()).first()
    
    return {
        "meals": meals,
        "images": images,
        "latest_sensor": latest_sensor
    }

@router.post("/meals", response_model=MealResponse)
def submit_meal(
    meal_data: MealCreate,
    current_user: User = Depends(require_school),
    db: Session = Depends(get_db)
):
    new_meal = MealSubmission(
        school_id=current_user.school_id,
        meal_type=meal_data.meal_type,
        menu_description=meal_data.menu_description,
        staff_name=meal_data.staff_name,
        inspection_shift=meal_data.inspection_shift,
        hygiene_notes=meal_data.hygiene_notes,
        submission_date=date.today()
    )
    db.add(new_meal)
    db.commit()
    db.refresh(new_meal)
    
    log_audit(
        db=db,
        action="MEAL_SUBMITTED",
        details=f"Meal registered: {new_meal.meal_type} ({new_meal.inspection_shift}) by {new_meal.staff_name}",
        user_email=current_user.email,
        school_id=current_user.school_id,
        user_id=current_user.id
    )
    return new_meal

@router.post("/upload-image")
def upload_school_image(
    category: str = Form(...), # MEAL_PREPARATION, KITCHEN_HYGIENE, or STUDENT_EATING
    meal_type: Optional[str] = Form(None),
    menu_description: Optional[str] = Form(None),
    staff_name: Optional[str] = Form(None),
    inspection_shift: Optional[str] = Form(None),
    hygiene_notes: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    captured_location: Optional[str] = Form(None),
    captured_timestamp: Optional[str] = Form(None),
    file: UploadFile = File(...),
    request: Request = None,
    current_user: User = Depends(require_school),
    db: Session = Depends(get_db)
):
    """
    Accepts staff in-app camera captures for 3 categories:
      - MEAL_PREPARATION  → Gemini Vision CV checks food vs menu (auto-flag/pass)
      - KITCHEN_HYGIENE   → No CV, stored for manual admin review
      - STUDENT_EATING    → YOLOv8 CV counts approximate students in frame
    All photos must be live camera captures with burned-in GPS + timestamp.
    """
    VALID_CATEGORIES = ["MEAL_PREPARATION", "KITCHEN_HYGIENE", "STUDENT_EATING"]
    if category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=400,
            detail=f"Category must be one of: {', '.join(VALID_CATEGORIES)}"
        )
        
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
    if not file_ext or file_ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        file_ext = ".jpg"
        
    unique_filename = f"img_{current_user.school_id}_{uuid.uuid4().hex[:12]}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    image_url = f"/uploads/{unique_filename}"
    
    # Store submission — cv fields start as None/PENDING
    submission = ImageSubmission(
        school_id=current_user.school_id,
        uploaded_by_user_id=current_user.id,
        category=category,
        image_url=image_url,
        file_name=file.filename or unique_filename,
        meal_type=meal_type,
        menu_description=menu_description,
        staff_name=staff_name,
        inspection_shift=inspection_shift,
        hygiene_notes=hygiene_notes,
        latitude=latitude,
        longitude=longitude,
        captured_location=captured_location,
        captured_timestamp=captured_timestamp,
        status="PENDING_REVIEW",
        cv_status=None,
        cv_notes=None,
        cv_confidence=None,
        cv_processed_at=None,
        cv_student_count=None
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    submission_id = submission.id
    menu_text = menu_description or meal_type or ""

    # ── Background CV Analysis ─────────────────────────────────────────
    def run_cv_analysis(img_path: str, sub_id: int, cat: str, menu: str):
        """
        Runs in a daemon thread so the API returns immediately while CV processes.
        Opens a new DB session (thread-safe) to write back results.
        """
        from ..database.connection import SessionLocal as _SL
        _db = _SL()
        try:
            sub = _db.query(ImageSubmission).filter(ImageSubmission.id == sub_id).first()
            if not sub:
                return

            if cat == "MEAL_PREPARATION":
                result = food_quality_check(img_path, menu)
                sub.cv_status = result["cv_status"]
                sub.cv_notes = result["cv_notes"]
                sub.cv_confidence = result["cv_confidence"]
                sub.cv_processed_at = datetime.utcnow()
                # Auto-set status to CV_PASS or CV_FLAG so admin sees it clearly
                if result["cv_status"] == "CV_PASS":
                    sub.status = "CV_PASS"
                elif result["cv_status"] == "CV_FLAG":
                    sub.status = "CV_FLAG"

            elif cat == "STUDENT_EATING":
                result = count_students_in_image(img_path)
                sub.cv_status = result["cv_status"]
                sub.cv_notes = result["cv_notes"]
                sub.cv_confidence = result["cv_confidence"]
                sub.cv_student_count = result.get("cv_student_count")
                sub.cv_processed_at = datetime.utcnow()
                if result["cv_status"] == "CV_PASS":
                    sub.status = "CV_PASS"

            _db.commit()
        except Exception as e:
            import logging
            logging.getLogger("cv_service").error(f"CV background thread error: {e}")
        finally:
            _db.close()

    # Only run CV for MEAL_PREPARATION and STUDENT_EATING
    if category in ["MEAL_PREPARATION", "STUDENT_EATING"]:
        t = threading.Thread(
            target=run_cv_analysis,
            args=(file_path, submission_id, category, menu_text),
            daemon=True
        )
        t.start()
    # KITCHEN_HYGIENE stays PENDING_REVIEW for admin manual check
    
    log_audit(
        db=db,
        action="IMAGE_UPLOADED",
        details=f"Photo uploaded for {category}: {file.filename} (CV analysis {'queued' if category != 'KITCHEN_HYGIENE' else 'N/A — manual review'})",
        user_email=current_user.email,
        school_id=current_user.school_id,
        user_id=current_user.id
    )
    
    cv_info = ""
    if category == "MEAL_PREPARATION":
        cv_info = " CV food quality check is running in background."
    elif category == "STUDENT_EATING":
        cv_info = " CV student count is running in background."
    
    return {
        "status": "success",
        "message": f"Image uploaded successfully.{cv_info} Awaiting administrator verification.",
        "image": submission
    }

@router.get("/alerts", response_model=List[AlertResponse])
def get_school_alerts(current_user: User = Depends(require_school), db: Session = Depends(get_db)):
    """
    Show ONLY alerts for the logged-in school.
    """
    alerts = db.query(Alert).filter(
        Alert.school_id == current_user.school_id
    ).order_by(Alert.created_at.desc()).all()
    return alerts

@router.get("/profile")
def get_school_profile(current_user: User = Depends(require_school), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == current_user.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    return {
        "school_id": school.id,
        "school_name": school.name,
        "school_code": school.school_code,
        "district": school.district,
        "state": school.state,
        "address": school.address,
        "principal_name": school.principal_name,
        "email": school.email,
        "phone": school.phone,
        "status": school.status,
        "hardware_status": school.hardware_status,
        "hardware_device_id": school.hardware_device_id,
        "hardware_api_key": school.hardware_api_key,
        "tank_capacity_litres": school.tank_capacity_litres,
        "tank_height_cm": school.tank_height_cm,
        "user_email": current_user.email,
        "user_full_name": current_user.full_name
    }

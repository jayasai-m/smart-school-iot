import os
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..models.user import User
from ..models.school import School
from ..models.sensor import SensorReading
from ..models.meal import MealSubmission, ImageSubmission
from ..models.alert import Alert
from ..schemas.all_schemas import ImageReviewAction, AlertAction
from ..auth.deps import require_inspector
from ..services.audit_service import log_audit

router = APIRouter(prefix="/api/inspector", tags=["Field Inspector Portal"])

HARDWARE_TIMEOUT_SECONDS = int(os.getenv("HARDWARE_TIMEOUT_SECONDS", "60"))

def evaluate_hardware(school: School) -> dict:
    if not school.last_hardware_ping:
        return {"status": "DISCONNECTED", "label": "Hardware Not Connected"}
    diff = (datetime.utcnow() - school.last_hardware_ping).total_seconds()
    if diff <= HARDWARE_TIMEOUT_SECONDS:
        return {"status": "CONNECTED", "label": "ESP32 Connected"}
    return {"status": "DISCONNECTED", "label": "ESP32 Disconnected"}

@router.get("/dashboard")
def get_inspector_dashboard(
    current_user: User = Depends(require_inspector),
    db: Session = Depends(get_db)
):
    """
    Inspector overview strictly limited to schools assigned to this inspector.
    """
    assigned_schools = current_user.assigned_schools
    assigned_ids = [s.id for s in assigned_schools]
    
    if not assigned_ids:
        return {
            "stats": {
                "total_assigned_schools": 0,
                "hardware_connected": 0,
                "active_alerts": 0,
                "pending_meal_reviews": 0,
                "verified_today": 0
            },
            "schools_overview": [],
            "recent_alerts": [],
            "recent_images": []
        }
        
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    hardware_connected_count = 0
    for s in assigned_schools:
        if s.last_hardware_ping and (now - s.last_hardware_ping).total_seconds() <= HARDWARE_TIMEOUT_SECONDS:
            hardware_connected_count += 1
            
    active_alerts_count = db.query(Alert).filter(
        Alert.school_id.in_(assigned_ids),
        Alert.status == "ACTIVE"
    ).count()
    
    pending_meal_reviews = db.query(ImageSubmission).filter(
        ImageSubmission.school_id.in_(assigned_ids),
        ImageSubmission.status.in_(["PENDING_REVIEW", "CV_PASS", "CV_FLAG"])
    ).count()
    
    verified_today = db.query(ImageSubmission.school_id).filter(
        ImageSubmission.school_id.in_(assigned_ids),
        ImageSubmission.status == "VERIFIED",
        ImageSubmission.created_at >= today_start
    ).distinct().count()
    
    # Schools overview
    schools_overview = []
    for s in assigned_schools:
        hw = evaluate_hardware(s)
        latest_reading = db.query(SensorReading).filter(
            SensorReading.school_id == s.id
        ).order_by(SensorReading.recorded_at.desc()).first()
        
        # Check today's verification status
        today_img = db.query(ImageSubmission).filter(
            ImageSubmission.school_id == s.id,
            ImageSubmission.created_at >= today_start
        ).order_by(ImageSubmission.created_at.desc()).first()
        
        ver_status = "NO_SUBMISSION"
        if today_img:
            ver_status = today_img.status
            
        schools_overview.append({
            "id": s.id,
            "name": s.name,
            "school_code": s.school_code,
            "district": s.district,
            "principal_name": s.principal_name,
            "phone": s.phone,
            "hardware_status": hw["status"],
            "hardware_label": hw["label"],
            "verification_status": ver_status,
            "latest_reading": latest_reading
        })
        
    recent_alerts = db.query(Alert).filter(
        Alert.school_id.in_(assigned_ids)
    ).order_by(Alert.created_at.desc()).limit(10).all()
    
    recent_images = db.query(ImageSubmission).filter(
        ImageSubmission.school_id.in_(assigned_ids)
    ).order_by(ImageSubmission.created_at.desc()).limit(10).all()
    
    enriched_images = []
    for img in recent_images:
        enriched_images.append({
            "id": img.id,
            "school_id": img.school_id,
            "school_name": img.school.name if img.school else "Unknown",
            "category": img.category,
            "image_url": img.image_url,
            "meal_type": img.meal_type,
            "status": img.status,
            "cv_status": img.cv_status,
            "cv_notes": img.cv_notes,
            "cv_student_count": img.cv_student_count,
            "created_at": img.created_at
        })
        
    return {
        "stats": {
            "total_assigned_schools": len(assigned_schools),
            "hardware_connected": hardware_connected_count,
            "active_alerts": active_alerts_count,
            "pending_meal_reviews": pending_meal_reviews,
            "verified_today": verified_today
        },
        "schools_overview": schools_overview,
        "recent_alerts": recent_alerts,
        "recent_images": enriched_images
    }

@router.get("/schools")
def get_inspector_schools(
    current_user: User = Depends(require_inspector),
    db: Session = Depends(get_db)
):
    assigned_schools = current_user.assigned_schools
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    result = []
    
    for s in assigned_schools:
        hw = evaluate_hardware(s)
        active_alerts_cnt = db.query(Alert).filter(Alert.school_id == s.id, Alert.status == "ACTIVE").count()
        latest_reading = db.query(SensorReading).filter(
            SensorReading.school_id == s.id
        ).order_by(SensorReading.recorded_at.desc()).first()
        
        today_img = db.query(ImageSubmission).filter(
            ImageSubmission.school_id == s.id,
            ImageSubmission.created_at >= today_start
        ).order_by(ImageSubmission.created_at.desc()).first()
        
        result.append({
            "id": s.id,
            "name": s.name,
            "school_code": s.school_code,
            "district": s.district,
            "principal_name": s.principal_name,
            "email": s.email,
            "phone": s.phone,
            "hardware_status": hw["status"],
            "hardware_label": hw["label"],
            "last_hardware_ping": s.last_hardware_ping,
            "active_alerts_count": active_alerts_cnt,
            "latest_reading": latest_reading,
            "verification_status_today": today_img.status if today_img else "NO_SUBMISSION"
        })
    return result

@router.get("/digital-twin")
def get_inspector_digital_twin(
    school_id: Optional[int] = Query(None),
    current_user: User = Depends(require_inspector),
    db: Session = Depends(get_db)
):
    assigned_schools = current_user.assigned_schools
    if not assigned_schools:
        return {"schools": [], "selected_school": None, "sensor_data": None}
        
    assigned_ids = [s.id for s in assigned_schools]
    
    selected_school = None
    if school_id and school_id in assigned_ids:
        selected_school = next((s for s in assigned_schools if s.id == school_id), None)
    if not selected_school:
        selected_school = assigned_schools[0]
        
    hw = evaluate_hardware(selected_school)
    latest_reading = db.query(SensorReading).filter(
        SensorReading.school_id == selected_school.id
    ).order_by(SensorReading.recorded_at.desc()).first()
    
    return {
        "schools": [{"id": s.id, "name": s.name, "school_code": s.school_code} for s in assigned_schools],
        "selected_school": {
            "id": selected_school.id,
            "name": selected_school.name,
            "school_code": selected_school.school_code,
            "tank_capacity_litres": selected_school.tank_capacity_litres,
            "tank_height_cm": selected_school.tank_height_cm,
            "hardware_device_id": selected_school.hardware_device_id,
            "hardware_status": hw["status"],
            "hardware_label": hw["label"],
            "last_hardware_ping": selected_school.last_hardware_ping
        },
        "sensor_data": latest_reading
    }

@router.get("/water")
def get_inspector_water(
    school_id: Optional[int] = Query(None),
    current_user: User = Depends(require_inspector),
    db: Session = Depends(get_db)
):
    assigned_schools = current_user.assigned_schools
    if not assigned_schools:
        return {"schools": [], "selected_school": None, "latest": None, "history": []}
        
    assigned_ids = [s.id for s in assigned_schools]
    selected_school = None
    if school_id and school_id in assigned_ids:
        selected_school = next((s for s in assigned_schools if s.id == school_id), None)
    if not selected_school:
        selected_school = assigned_schools[0]
        
    hw = evaluate_hardware(selected_school)
    latest_reading = db.query(SensorReading).filter(
        SensorReading.school_id == selected_school.id
    ).order_by(SensorReading.recorded_at.desc()).first()
    
    history = db.query(SensorReading).filter(
        SensorReading.school_id == selected_school.id
    ).order_by(SensorReading.recorded_at.desc()).limit(50).all()
    history = list(reversed(history))
    
    return {
        "schools": [{"id": s.id, "name": s.name} for s in assigned_schools],
        "selected_school": {
            "id": selected_school.id,
            "name": selected_school.name,
            "tank_capacity_litres": selected_school.tank_capacity_litres,
            "tank_height_cm": selected_school.tank_height_cm,
            "turbidity_threshold": selected_school.turbidity_threshold,
            "low_water_threshold_pct": selected_school.low_water_threshold_pct,
            "overflow_threshold_pct": selected_school.overflow_threshold_pct,
            "hardware_status": hw["status"],
            "hardware_label": hw["label"],
            "last_hardware_ping": selected_school.last_hardware_ping
        },
        "latest": latest_reading,
        "history": history
    }

@router.get("/meals")
def get_inspector_meals(
    school_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(require_inspector),
    db: Session = Depends(get_db)
):
    assigned_schools = current_user.assigned_schools
    assigned_ids = [s.id for s in assigned_schools]
    
    if not assigned_ids:
        return {"schools": [], "images": [], "meals": []}
        
    query_img = db.query(ImageSubmission).filter(ImageSubmission.school_id.in_(assigned_ids))
    if school_id and school_id in assigned_ids:
        query_img = query_img.filter(ImageSubmission.school_id == school_id)
    if status_filter:
        query_img = query_img.filter(ImageSubmission.status == status_filter)
        
    images = query_img.order_by(ImageSubmission.created_at.desc()).all()
    
    enriched_images = []
    for img in images:
        enriched_images.append({
            "id": img.id,
            "school_id": img.school_id,
            "school_name": img.school.name if img.school else "Unknown School",
            "category": img.category,
            "image_url": img.image_url,
            "file_name": img.file_name,
            "meal_type": img.meal_type,
            "menu_description": img.menu_description,
            "staff_name": img.staff_name,
            "inspection_shift": img.inspection_shift,
            "hygiene_notes": img.hygiene_notes,
            "status": img.status,
            "admin_notes": img.admin_notes,
            "reviewed_by": img.reviewed_by,
            "reviewed_at": img.reviewed_at,
            "latitude": img.latitude,
            "longitude": img.longitude,
            "captured_location": img.captured_location,
            "captured_timestamp": img.captured_timestamp,
            "cv_status": img.cv_status,
            "cv_notes": img.cv_notes,
            "cv_confidence": img.cv_confidence,
            "cv_student_count": img.cv_student_count,
            "cv_processed_at": img.cv_processed_at,
            "created_at": img.created_at
        })
        
    meals_query = db.query(MealSubmission).filter(MealSubmission.school_id.in_(assigned_ids))
    if school_id and school_id in assigned_ids:
        meals_query = meals_query.filter(MealSubmission.school_id == school_id)
    meals = meals_query.order_by(MealSubmission.created_at.desc()).all()
    
    return {
        "schools": [{"id": s.id, "name": s.name} for s in assigned_schools],
        "images": enriched_images,
        "meals": meals
    }

@router.post("/images/{image_id}/review")
def inspector_review_image(
    image_id: int,
    review_data: ImageReviewAction,
    current_user: User = Depends(require_inspector),
    db: Session = Depends(get_db)
):
    """
    Inspector verifies/flags meal and kitchen hygiene photos for their assigned schools.
    """
    assigned_ids = [s.id for s in current_user.assigned_schools]
    image = db.query(ImageSubmission).filter(
        ImageSubmission.id == image_id,
        ImageSubmission.school_id.in_(assigned_ids)
    ).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image record not found or not in your assigned jurisdiction")
        
    status_val = review_data.status.upper()
    if status_val not in ["VERIFIED", "FLAGGED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Status must be VERIFIED, FLAGGED, or REJECTED")
        
    image.status = status_val
    image.admin_notes = review_data.admin_notes
    image.reviewed_by = f"Inspector: {current_user.full_name} ({current_user.email})"
    image.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(image)
    
    log_audit(
        db=db,
        action=f"INSPECTOR_IMAGE_{status_val}",
        details=f"Field Inspector {current_user.full_name} marked image #{image.id} ({image.category}) as {status_val}. Notes: {review_data.admin_notes or 'None'}",
        user_email=current_user.email,
        school_id=image.school_id,
        user_id=current_user.id
    )
    
    return {"status": "success", "image_status": image.status, "image_id": image.id}

@router.get("/alerts")
def get_inspector_alerts(
    school_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(require_inspector),
    db: Session = Depends(get_db)
):
    assigned_schools = current_user.assigned_schools
    assigned_ids = [s.id for s in assigned_schools]
    
    query = db.query(Alert).filter(Alert.school_id.in_(assigned_ids))
    if school_id and school_id in assigned_ids:
        query = query.filter(Alert.school_id == school_id)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
        
    alerts = query.order_by(Alert.created_at.desc()).all()
    
    result = []
    for a in alerts:
        result.append({
            "id": a.id,
            "school_id": a.school_id,
            "school_name": a.school.name if a.school else "Unknown School",
            "alert_type": a.alert_type,
            "severity": a.severity,
            "message": a.message,
            "status": a.status,
            "sensor_value": a.sensor_value,
            "threshold_value": a.threshold_value,
            "created_at": a.created_at,
            "resolved_at": a.resolved_at,
            "resolved_by": a.resolved_by
        })
    return result

@router.post("/alerts/{alert_id}/action")
def act_on_inspector_alert(
    alert_id: int,
    action_data: AlertAction,
    current_user: User = Depends(require_inspector),
    db: Session = Depends(get_db)
):
    assigned_ids = [s.id for s in current_user.assigned_schools]
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.school_id.in_(assigned_ids)
    ).first()
    
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found in your assigned jurisdiction")
        
    action_status = action_data.status.upper()
    alert.status = action_status
    if action_status == "RESOLVED":
        alert.resolved_at = datetime.utcnow()
        alert.resolved_by = f"Inspector: {current_user.full_name}"
        
    db.commit()
    db.refresh(alert)
    return {"status": "success", "alert_status": alert.status}

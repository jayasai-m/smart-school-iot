import os
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..models.user import User
from ..models.school import School
from ..models.sensor import SensorReading
from ..models.meal import MealSubmission, ImageSubmission
from ..models.alert import Alert, AuditLog
from ..schemas.all_schemas import (
    SchoolResponse, SchoolApprovalAction, SchoolThresholdsUpdate,
    ImageReviewAction, AlertAction, AlertResponse, AuditLogResponse,
    InspectorApprovalAction, AssignSchoolsRequest
)
from ..auth.deps import require_admin
from ..services.audit_service import log_audit

router = APIRouter(prefix="/api/admin", tags=["Admin Panel"])

HARDWARE_TIMEOUT_SECONDS = int(os.getenv("HARDWARE_TIMEOUT_SECONDS", "60"))

def evaluate_hardware(school: School) -> dict:
    if not school.last_hardware_ping:
        return {"status": "DISCONNECTED", "label": "Hardware Not Connected"}
    diff = (datetime.utcnow() - school.last_hardware_ping).total_seconds()
    if diff <= HARDWARE_TIMEOUT_SECONDS:
        return {"status": "CONNECTED", "label": "ESP32 Connected"}
    return {"status": "DISCONNECTED", "label": "ESP32 Disconnected"}

@router.get("/dashboard")
def get_admin_dashboard(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    """
    Main system overview. Shows actual database information only.
    No invented or simulated numbers.
    """
    # School counts
    approved_schools_count = db.query(School).filter(School.status == "ACTIVE").count()
    pending_approvals_count = db.query(School).filter(School.status == "PENDING_APPROVAL").count()
    
    # Active alerts count
    active_alerts_count = db.query(Alert).filter(Alert.status == "ACTIVE").count()
    
    # Hardware connections count: active schools with last ping within timeout
    active_schools = db.query(School).filter(School.status == "ACTIVE").all()
    hardware_connected_count = 0
    now = datetime.utcnow()
    for sch in active_schools:
        if sch.last_hardware_ping and (now - sch.last_hardware_ping).total_seconds() <= HARDWARE_TIMEOUT_SECONDS:
            hardware_connected_count += 1
            
    # Recent alerts
    recent_alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(10).all()
    
    # Recent image submissions
    recent_images = db.query(ImageSubmission).order_by(ImageSubmission.created_at.desc()).limit(10).all()
    
    # Recent meal submissions
    recent_meals = db.query(MealSubmission).order_by(MealSubmission.created_at.desc()).limit(10).all()
    
    # School status overview
    schools_overview = []
    for s in active_schools:
        hw = evaluate_hardware(s)
        latest_reading = db.query(SensorReading).filter(
            SensorReading.school_id == s.id
        ).order_by(SensorReading.recorded_at.desc()).first()
        
        schools_overview.append({
            "id": s.id,
            "name": s.name,
            "school_code": s.school_code,
            "district": s.district,
            "hardware_status": hw["status"],
            "hardware_label": hw["label"],
            "latest_reading": latest_reading
        })
        
    return {
        "stats": {
            "total_approved_schools": approved_schools_count,
            "pending_approvals": pending_approvals_count,
            "active_alerts": active_alerts_count,
            "hardware_connected": hardware_connected_count
        },
        "schools_overview": schools_overview,
        "recent_alerts": recent_alerts,
        "recent_images": recent_images,
        "recent_meals": recent_meals
    }

@router.get("/approvals")
def get_pending_approvals(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    """
    Admin workflow for new school registrations.
    """
    pending = db.query(School).filter(School.status == "PENDING_APPROVAL").order_by(School.created_at.desc()).all()
    return pending

@router.post("/approvals/{school_id}")
def process_school_approval(
    school_id: int,
    action_data: SchoolApprovalAction,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    action = action_data.action.upper()
    if action not in ["APPROVE", "REJECT", "FLAG"]:
        raise HTTPException(status_code=400, detail="Action must be APPROVE, REJECT, or FLAG")
        
    if action == "APPROVE":
        school.status = "ACTIVE"
        # Activate associated users
        for u in school.users:
            u.status = "ACTIVE"
        log_audit(
            db=db,
            action="SCHOOL_APPROVED",
            details=f"School '{school.name}' ({school.school_code}) approved by Admin {current_user.email}. Notes: {action_data.notes or 'None'}",
            user_email=current_user.email,
            school_id=school.id,
            user_id=current_user.id
        )
    elif action == "REJECT":
        school.status = "REJECTED"
        for u in school.users:
            u.status = "REJECTED"
        log_audit(
            db=db,
            action="SCHOOL_REJECTED",
            details=f"School '{school.name}' ({school.school_code}) rejected by Admin {current_user.email}. Reason: {action_data.notes or 'None'}",
            user_email=current_user.email,
            school_id=school.id,
            user_id=current_user.id
        )
    elif action == "FLAG":
        school.status = "FLAGGED"
        log_audit(
            db=db,
            action="SCHOOL_FLAGGED",
            details=f"School '{school.name}' ({school.school_code}) flagged by Admin. Reason: {action_data.notes or 'None'}",
            user_email=current_user.email,
            school_id=school.id,
            user_id=current_user.id
        )
        
    db.commit()
    db.refresh(school)
    return {"status": "success", "school_status": school.status, "school_id": school.id}

@router.get("/schools")
def get_all_schools(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    schools = db.query(School).order_by(School.created_at.asc()).all()
    result = []
    for s in schools:
        hw = evaluate_hardware(s)
        active_alerts_cnt = db.query(Alert).filter(Alert.school_id == s.id, Alert.status == "ACTIVE").count()
        latest_reading = db.query(SensorReading).filter(
            SensorReading.school_id == s.id
        ).order_by(SensorReading.recorded_at.desc()).first()
        
        result.append({
            "id": s.id,
            "name": s.name,
            "school_code": s.school_code,
            "district": s.district,
            "state": s.state,
            "address": s.address,
            "principal_name": s.principal_name,
            "email": s.email,
            "phone": s.phone,
            "status": s.status,
            "hardware_status": hw["status"],
            "hardware_label": hw["label"],
            "last_hardware_ping": s.last_hardware_ping,
            "active_alerts_count": active_alerts_cnt,
            "latest_reading": latest_reading,
            "created_at": s.created_at
        })
    return result

@router.get("/schools/{school_id}")
def get_school_details(school_id: int, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    hw = evaluate_hardware(school)
    
    latest_reading = db.query(SensorReading).filter(
        SensorReading.school_id == school.id
    ).order_by(SensorReading.recorded_at.desc()).first()
    
    alerts = db.query(Alert).filter(Alert.school_id == school.id).order_by(Alert.created_at.desc()).limit(20).all()
    meals = db.query(MealSubmission).filter(MealSubmission.school_id == school.id).order_by(MealSubmission.created_at.desc()).limit(10).all()
    images = db.query(ImageSubmission).filter(ImageSubmission.school_id == school.id).order_by(ImageSubmission.created_at.desc()).limit(15).all()
    
    return {
        "school": school,
        "hardware": hw,
        "latest_reading": latest_reading,
        "alerts": alerts,
        "meals": meals,
        "images": images
    }

@router.put("/schools/{school_id}/thresholds")
def update_school_thresholds(
    school_id: int,
    thresholds: SchoolThresholdsUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail="School not found")
        
    if thresholds.tank_capacity_litres is not None:
        school.tank_capacity_litres = thresholds.tank_capacity_litres
    if thresholds.tank_height_cm is not None:
        school.tank_height_cm = thresholds.tank_height_cm
    if thresholds.sensor_offset_cm is not None:
        school.sensor_offset_cm = thresholds.sensor_offset_cm
    if thresholds.turbidity_threshold is not None:
        school.turbidity_threshold = thresholds.turbidity_threshold
    if thresholds.low_water_threshold_pct is not None:
        school.low_water_threshold_pct = thresholds.low_water_threshold_pct
    if thresholds.overflow_threshold_pct is not None:
        school.overflow_threshold_pct = thresholds.overflow_threshold_pct
    if thresholds.humidity_threshold_pct is not None:
        school.humidity_threshold_pct = thresholds.humidity_threshold_pct
        
    db.commit()
    db.refresh(school)
    
    log_audit(
        db=db,
        action="THRESHOLDS_UPDATED",
        details=f"Updated thresholds for school {school.name}",
        user_email=current_user.email,
        school_id=school.id,
        user_id=current_user.id
    )
    return school

@router.get("/digital-twin")
def get_admin_digital_twin(
    school_id: Optional[int] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Digital Twin view for Water Tank.
    Admin can select a school from approved schools. Defaults to first active school (ZPHS Poranki).
    """
    approved_schools = db.query(School).filter(School.status == "ACTIVE").all()
    if not approved_schools:
        return {"schools": [], "selected_school": None, "sensor_data": None}
        
    selected_school = None
    if school_id:
        selected_school = db.query(School).filter(School.id == school_id).first()
    if not selected_school:
        selected_school = approved_schools[0]
        
    hw = evaluate_hardware(selected_school)
    
    latest_reading = db.query(SensorReading).filter(
        SensorReading.school_id == selected_school.id
    ).order_by(SensorReading.recorded_at.desc()).first()
    
    return {
        "schools": [{"id": s.id, "name": s.name, "school_code": s.school_code} for s in approved_schools],
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
def get_admin_water(
    school_id: Optional[int] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    approved_schools = db.query(School).filter(School.status == "ACTIVE").all()
    selected_school = None
    if school_id:
        selected_school = db.query(School).filter(School.id == school_id).first()
    if not selected_school and approved_schools:
        selected_school = approved_schools[0]
        
    if not selected_school:
        return {"schools": [], "selected_school": None, "latest": None, "history": []}
        
    hw = evaluate_hardware(selected_school)
    
    latest_reading = db.query(SensorReading).filter(
        SensorReading.school_id == selected_school.id
    ).order_by(SensorReading.recorded_at.desc()).first()
    
    # Real history only
    history = db.query(SensorReading).filter(
        SensorReading.school_id == selected_school.id
    ).order_by(SensorReading.recorded_at.desc()).limit(50).all()
    history = list(reversed(history))
    
    return {
        "schools": [{"id": s.id, "name": s.name} for s in approved_schools],
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
def get_admin_meals(
    school_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query_img = db.query(ImageSubmission)
    if school_id:
        query_img = query_img.filter(ImageSubmission.school_id == school_id)
    if status_filter:
        query_img = query_img.filter(ImageSubmission.status == status_filter)
        
    images = query_img.order_by(ImageSubmission.created_at.desc()).all()
    
    # Enrich image models with school name
    enriched_images = []
    for img in images:
        enriched_images.append({
            "id": img.id,
            "school_id": img.school_id,
            "school_name": img.school.name if img.school else "Unknown School",
            "uploaded_by_user_id": img.uploaded_by_user_id,
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
            # Computer Vision results
            "cv_status": img.cv_status,
            "cv_notes": img.cv_notes,
            "cv_confidence": img.cv_confidence,
            "cv_student_count": img.cv_student_count,
            "cv_processed_at": img.cv_processed_at,
            "created_at": img.created_at
        })
        
    meals_query = db.query(MealSubmission)
    if school_id:
        meals_query = meals_query.filter(MealSubmission.school_id == school_id)
    meals = meals_query.order_by(MealSubmission.created_at.desc()).all()
    
    # Active schools list for filters
    schools = db.query(School).filter(School.status == "ACTIVE").all()
    
    return {
        "schools": [{"id": s.id, "name": s.name} for s in schools],
        "images": enriched_images,
        "meals": meals
    }

@router.post("/images/{image_id}/review")
def review_image(
    image_id: int,
    review_data: ImageReviewAction,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Admin verification and flagging of uploaded meal & kitchen images.
    Statuses: VERIFIED, FLAGGED, REJECTED
    """
    image = db.query(ImageSubmission).filter(ImageSubmission.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image record not found")
        
    status_val = review_data.status.upper()
    if status_val not in ["VERIFIED", "FLAGGED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Status must be VERIFIED, FLAGGED, or REJECTED")
        
    image.status = status_val
    image.admin_notes = review_data.admin_notes
    image.reviewed_by = current_user.email
    image.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(image)
    
    log_audit(
        db=db,
        action=f"IMAGE_{status_val}",
        details=f"Admin {current_user.email} marked image #{image.id} ({image.category}) as {status_val}. Notes: {review_data.admin_notes or 'None'}",
        user_email=current_user.email,
        school_id=image.school_id,
        user_id=current_user.id
    )
    
    return {"status": "success", "image_status": image.status, "image_id": image.id}

@router.get("/alerts")
def get_admin_alerts(
    school_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if school_id:
        query = query.filter(Alert.school_id == school_id)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
        
    alerts = query.order_by(Alert.created_at.desc()).all()
    
    enriched = []
    for a in alerts:
        enriched.append({
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
        
    schools = db.query(School).filter(School.status == "ACTIVE").all()
    return {
        "schools": [{"id": s.id, "name": s.name} for s in schools],
        "alerts": enriched
    }

@router.post("/alerts/{alert_id}/action")
def update_alert_status(
    alert_id: int,
    action_data: AlertAction,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    action_status = action_data.status.upper()
    if action_status not in ["ACKNOWLEDGED", "RESOLVED", "FLAGGED"]:
        raise HTTPException(status_code=400, detail="Action must be ACKNOWLEDGED, RESOLVED, or FLAGGED")
        
    alert.status = action_status
    if action_status == "RESOLVED":
        alert.resolved_at = datetime.utcnow()
        alert.resolved_by = current_user.email
        
    db.commit()
    db.refresh(alert)
    
    log_audit(
        db=db,
        action=f"ALERT_{action_status}",
        details=f"Alert #{alert.id} ({alert.alert_type}) status updated to {action_status} by Admin {current_user.email}. Notes: {action_data.notes or 'None'}",
        user_email=current_user.email,
        school_id=alert.school_id,
        user_id=current_user.id
    )
    return {"status": "success", "alert_status": alert.status, "alert_id": alert.id}

@router.get("/reports")
def get_admin_reports(
    school_id: Optional[int] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Reports strictly based on real stored data.
    If no data exists: returns empty structures with has_data=False.
    """
    schools = db.query(School).filter(School.status == "ACTIVE").all()
    selected_school = None
    if school_id:
        selected_school = db.query(School).filter(School.id == school_id).first()
    elif schools:
        selected_school = schools[0]
        
    readings = []
    if selected_school:
        readings = db.query(SensorReading).filter(
            SensorReading.school_id == selected_school.id
        ).order_by(SensorReading.recorded_at.desc()).limit(100).all()
        readings = list(reversed(readings))
        
    alerts = []
    if selected_school:
        alerts = db.query(Alert).filter(
            Alert.school_id == selected_school.id
        ).order_by(Alert.created_at.desc()).all()
        
    meal_submissions_count = db.query(MealSubmission).count()
    images_verified_count = db.query(ImageSubmission).filter(ImageSubmission.status == "VERIFIED").count()
    images_flagged_count = db.query(ImageSubmission).filter(ImageSubmission.status == "FLAGGED").count()
    images_pending_count = db.query(ImageSubmission).filter(ImageSubmission.status == "PENDING_REVIEW").count()
    
    return {
        "schools": [{"id": s.id, "name": s.name} for s in schools],
        "selected_school": selected_school,
        "has_sensor_data": len(readings) > 0,
        "readings": readings,
        "alerts": alerts,
        "summary": {
            "total_meals": meal_submissions_count,
            "images_verified": images_verified_count,
            "images_flagged": images_flagged_count,
            "images_pending": images_pending_count
        }
    }

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    return logs

# ─────────────────────────────────────────────────────────────
# INSPECTOR MANAGEMENT & PROGRESS MONITORING
# ─────────────────────────────────────────────────────────────

@router.get("/inspectors")
def get_all_inspectors(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    """
    List all Field Inspectors with their assigned schools and status.
    """
    inspectors = db.query(User).filter(User.role == "INSPECTOR").order_by(User.created_at.desc()).all()
    result = []
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    for ins in inspectors:
        assigned_count = len(ins.assigned_schools)
        assigned_ids = [s.id for s in ins.assigned_schools]
        
        # Calculate how many of the inspector's schools have verified meal submissions today
        verified_today_count = 0
        if assigned_ids:
            verified_schools = db.query(ImageSubmission.school_id).filter(
                ImageSubmission.school_id.in_(assigned_ids),
                ImageSubmission.status == "VERIFIED",
                ImageSubmission.created_at >= today_start
            ).distinct().count()
            verified_today_count = verified_schools

        result.append({
            "id": ins.id,
            "full_name": ins.full_name,
            "email": ins.email,
            "phone": ins.phone,
            "district": ins.district or "General Jurisdiction",
            "status": ins.status,
            "assigned_schools_count": assigned_count,
            "verified_today_count": verified_today_count,
            "created_at": ins.created_at,
            "assigned_schools": [
                {
                    "id": s.id,
                    "name": s.name,
                    "school_code": s.school_code,
                    "district": s.district,
                    "status": s.status
                }
                for s in ins.assigned_schools
            ]
        })
    return result

@router.get("/inspectors/pending")
def get_pending_inspectors(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    """
    Fetch only pending inspector account requests for approval.
    """
    pending = db.query(User).filter(
        User.role == "INSPECTOR",
        User.status == "PENDING_APPROVAL"
    ).order_by(User.created_at.desc()).all()
    
    return [
        {
            "id": ins.id,
            "full_name": ins.full_name,
            "email": ins.email,
            "phone": ins.phone,
            "district": ins.district or "General Jurisdiction",
            "status": ins.status,
            "created_at": ins.created_at
        }
        for ins in pending
    ]

@router.post("/inspectors/{inspector_id}/approval")
def process_inspector_approval(
    inspector_id: int,
    action_data: InspectorApprovalAction,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Admin workflow to APPROVE or REJECT Field Inspector account requests.
    """
    inspector = db.query(User).filter(User.id == inspector_id, User.role == "INSPECTOR").first()
    if not inspector:
        raise HTTPException(status_code=404, detail="Inspector account not found")
        
    action = action_data.action.upper()
    if action not in ["APPROVE", "REJECT"]:
        raise HTTPException(status_code=400, detail="Action must be APPROVE or REJECT")
        
    if action == "APPROVE":
        inspector.status = "ACTIVE"
        log_audit(
            db=db,
            action="INSPECTOR_APPROVED",
            details=f"Field Inspector '{inspector.full_name}' ({inspector.email}) approved by Admin {current_user.email}. Notes: {action_data.notes or 'None'}",
            user_email=current_user.email,
            user_id=current_user.id
        )
    elif action == "REJECT":
        inspector.status = "REJECTED"
        log_audit(
            db=db,
            action="INSPECTOR_REJECTED",
            details=f"Field Inspector '{inspector.full_name}' ({inspector.email}) rejected by Admin {current_user.email}. Reason: {action_data.notes or 'None'}",
            user_email=current_user.email,
            user_id=current_user.id
        )
        
    db.commit()
    db.refresh(inspector)
    return {"status": "success", "inspector_status": inspector.status, "inspector_id": inspector.id}

@router.get("/inspectors/available-schools")
def get_available_schools_for_assignment(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Fetch all active schools so admin can easily check/uncheck them to assign to an inspector.
    """
    schools = db.query(School).filter(School.status == "ACTIVE").order_by(School.name.asc()).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "school_code": s.school_code,
            "district": s.district,
            "assigned_inspectors": [
                {"id": ins.id, "name": ins.full_name, "email": ins.email}
                for ins in s.assigned_inspectors
            ]
        }
        for s in schools
    ]

@router.post("/inspectors/{inspector_id}/assign-schools")
def assign_schools_to_inspector(
    inspector_id: int,
    payload: AssignSchoolsRequest,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Admin assigns specific government schools to a Field Inspector.
    """
    inspector = db.query(User).filter(User.id == inspector_id, User.role == "INSPECTOR").first()
    if not inspector:
        raise HTTPException(status_code=404, detail="Inspector account not found")
        
    schools = db.query(School).filter(School.id.in_(payload.school_ids)).all()
    inspector.assigned_schools = schools
    db.commit()
    db.refresh(inspector)
    
    school_names = ", ".join([s.name for s in schools]) if schools else "None"
    log_audit(
        db=db,
        action="INSPECTOR_SCHOOLS_ASSIGNED",
        details=f"Assigned {len(schools)} school(s) to Inspector {inspector.full_name} ({inspector.email}): {school_names}",
        user_email=current_user.email,
        user_id=current_user.id
    )
    
    return {
        "status": "success",
        "inspector_id": inspector.id,
        "assigned_count": len(schools),
        "assigned_schools": [{"id": s.id, "name": s.name, "code": s.school_code} for s in schools]
    }

@router.get("/inspectors/{inspector_id}/progress")
def get_inspector_progress(
    inspector_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Admin clicks on an Inspector to inspect:
    - All schools under that inspector
    - Whether each school is verified today or not
    - Detailed meal photo verification & water status
    """
    inspector = db.query(User).filter(User.id == inspector_id, User.role == "INSPECTOR").first()
    if not inspector:
        raise HTTPException(status_code=404, detail="Inspector account not found")
        
    assigned_schools = inspector.assigned_schools
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    schools_progress = []
    verified_count = 0
    pending_count = 0
    flagged_count = 0
    no_submission_count = 0
    
    for school in assigned_schools:
        hw = evaluate_hardware(school)
        latest_reading = db.query(SensorReading).filter(
            SensorReading.school_id == school.id
        ).order_by(SensorReading.recorded_at.desc()).first()
        
        # Check today's meal image submissions
        today_images = db.query(ImageSubmission).filter(
            ImageSubmission.school_id == school.id,
            ImageSubmission.created_at >= today_start
        ).order_by(ImageSubmission.created_at.desc()).all()
        
        # Check latest image overall if no today image
        latest_overall_img = None
        if not today_images:
            latest_overall_img = db.query(ImageSubmission).filter(
                ImageSubmission.school_id == school.id
            ).order_by(ImageSubmission.created_at.desc()).first()
            
        # Determine verification status
        verification_status = "NO_SUBMISSION"
        verified_by = None
        verified_at = None
        notes = None
        
        if today_images:
            has_verified = any(img.status == "VERIFIED" for img in today_images)
            has_flagged = any(img.status == "FLAGGED" for img in today_images)
            has_rejected = any(img.status == "REJECTED" for img in today_images)
            
            if has_verified:
                verification_status = "VERIFIED"
                verified_count += 1
                ver_img = next(img for img in today_images if img.status == "VERIFIED")
                verified_by = ver_img.reviewed_by
                verified_at = ver_img.reviewed_at
                notes = ver_img.admin_notes
            elif has_flagged:
                verification_status = "FLAGGED"
                flagged_count += 1
                flg_img = next(img for img in today_images if img.status == "FLAGGED")
                verified_by = flg_img.reviewed_by
                verified_at = flg_img.reviewed_at
                notes = flg_img.admin_notes
            elif has_rejected:
                verification_status = "REJECTED"
                flagged_count += 1
            else:
                verification_status = "PENDING_REVIEW"
                pending_count += 1
        else:
            no_submission_count += 1
            if latest_overall_img:
                verified_by = latest_overall_img.reviewed_by
                verified_at = latest_overall_img.reviewed_at
                notes = latest_overall_img.admin_notes
                
        schools_progress.append({
            "school_id": school.id,
            "school_name": school.name,
            "school_code": school.school_code,
            "district": school.district,
            "principal_name": school.principal_name,
            "phone": school.phone,
            "hardware_status": hw["status"],
            "hardware_label": hw["label"],
            "latest_reading": {
                "water_level_pct": latest_reading.water_level_pct if latest_reading else None,
                "water_volume_litres": latest_reading.water_volume_litres if latest_reading else None,
                "turbidity_ntu": latest_reading.turbidity_ntu if latest_reading else None,
                "recorded_at": latest_reading.recorded_at if latest_reading else None
            } if latest_reading else None,
            "today_has_submission": len(today_images) > 0,
            "today_images_count": len(today_images),
            "verification_status": verification_status, # VERIFIED, PENDING_REVIEW, FLAGGED, REJECTED, NO_SUBMISSION
            "verified_by": verified_by,
            "verified_at": verified_at,
            "verification_notes": notes,
            "today_images": [
                {
                    "id": img.id,
                    "category": img.category,
                    "image_url": img.image_url,
                    "status": img.status,
                    "meal_type": img.meal_type,
                    "menu_description": img.menu_description,
                    "cv_status": img.cv_status,
                    "cv_notes": img.cv_notes,
                    "cv_student_count": img.cv_student_count,
                    "created_at": img.created_at
                }
                for img in today_images
            ],
            "latest_past_image": {
                "id": latest_overall_img.id,
                "image_url": latest_overall_img.image_url,
                "status": latest_overall_img.status,
                "meal_type": latest_overall_img.meal_type,
                "created_at": latest_overall_img.created_at,
                "reviewed_by": latest_overall_img.reviewed_by
            } if (not today_images and latest_overall_img) else None
        })
        
    total_schools = len(assigned_schools)
    compliance_percentage = round((verified_count / total_schools * 100), 1) if total_schools > 0 else 0.0
    
    return {
        "inspector": {
            "id": inspector.id,
            "full_name": inspector.full_name,
            "email": inspector.email,
            "phone": inspector.phone,
            "district": inspector.district or "General Jurisdiction",
            "status": inspector.status,
            "created_at": inspector.created_at
        },
        "stats": {
            "total_assigned_schools": total_schools,
            "verified_today": verified_count,
            "pending_review": pending_count,
            "flagged": flagged_count,
            "no_submission_today": no_submission_count,
            "compliance_percentage": compliance_percentage
        },
        "schools": schools_progress
    }


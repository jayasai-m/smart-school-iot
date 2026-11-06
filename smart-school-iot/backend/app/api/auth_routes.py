import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..models.user import User
from ..models.school import School
from ..schemas.all_schemas import LoginRequest, TokenResponse, SchoolRegisterRequest, InspectorRegisterRequest
from ..auth.security import verify_password, hash_password, create_access_token
from ..auth.deps import get_current_user
from ..services.audit_service import log_audit

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(login_req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_req.email.lower()).first()
    
    ip_addr = request.client.host if request.client else "unknown"
    
    if not user or not verify_password(login_req.password, user.hashed_password):
        log_audit(
            db=db,
            action="LOGIN_FAILED",
            details=f"Failed login attempt for email: {login_req.email}",
            user_email=login_req.email,
            ip_address=ip_addr
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    # Check status according to exact requirements:
    if user.status == "PENDING_APPROVAL":
        msg = "Your inspector account is awaiting administrator approval." if user.role == "INSPECTOR" else "Your school account is awaiting administrator approval."
        log_audit(
            db=db,
            action="LOGIN_BLOCKED_PENDING",
            details=f"Pending {user.role.lower()} attempted login",
            user_email=user.email,
            school_id=user.school_id,
            user_id=user.id,
            ip_address=ip_addr
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=msg
        )
        
    if user.status == "REJECTED":
        msg = "Your inspector account has been rejected by the administrator." if user.role == "INSPECTOR" else "Your school account has been rejected by the administrator."
        log_audit(
            db=db,
            action="LOGIN_BLOCKED_REJECTED",
            details=f"Rejected {user.role.lower()} attempted login",
            user_email=user.email,
            school_id=user.school_id,
            user_id=user.id,
            ip_address=ip_addr
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=msg
        )
        
    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently inactive"
        )
        
    # Successful login
    school_name = None
    if user.school:
        school_name = user.school.name
        
    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "school_id": user.school_id
    }
    access_token = create_access_token(data=token_payload)
    
    log_audit(
        db=db,
        action="LOGIN_SUCCESS",
        details=f"User {user.email} logged in successfully as {user.role}",
        user_email=user.email,
        school_id=user.school_id,
        user_id=user.id,
        ip_address=ip_addr
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        status=user.status,
        school_id=user.school_id,
        school_name=school_name
    )

@router.post("/register")
def register_school(reg_data: SchoolRegisterRequest, request: Request, db: Session = Depends(get_db)):
    # Validate passwords
    if reg_data.password != reg_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
        
    # Check if email is already registered
    existing_user = db.query(User).filter(User.email == reg_data.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
        
    # Check if school code is already taken
    existing_school = db.query(School).filter(School.school_code == reg_data.school_code).first()
    if existing_school:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A school with this School ID / Code already exists"
        )
        
    ip_addr = request.client.host if request.client else "unknown"
    
    # Create school with status PENDING_APPROVAL
    new_school = School(
        name=reg_data.school_name,
        school_code=reg_data.school_code,
        district=reg_data.district,
        state=reg_data.state,
        address=reg_data.address,
        principal_name=reg_data.principal_name,
        email=reg_data.email.lower(),
        phone=reg_data.phone,
        status="PENDING_APPROVAL",
        hardware_status="DISCONNECTED",
        hardware_device_id=f"ESP32-{reg_data.school_code}",
        hardware_api_key=f"api_key_{uuid.uuid4().hex[:16]}",
        tank_capacity_litres=2000.0,
        tank_height_cm=200.0,
        sensor_offset_cm=10.0,
        turbidity_threshold=5.0,
        low_water_threshold_pct=20.0,
        overflow_threshold_pct=90.0,
        humidity_threshold_pct=75.0
    )
    db.add(new_school)
    db.commit()
    db.refresh(new_school)
    
    # Create user with role SCHOOL and status PENDING_APPROVAL
    hashed_pwd = hash_password(reg_data.password)
    new_user = User(
        email=reg_data.email.lower(),
        hashed_password=hashed_pwd,
        full_name=reg_data.principal_name,
        phone=reg_data.phone,
        role="SCHOOL",
        status="PENDING_APPROVAL",
        school_id=new_school.id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    log_audit(
        db=db,
        action="SCHOOL_REGISTERED",
        details=f"New school registered: {new_school.name} ({new_school.school_code}) - Pending Approval",
        user_email=new_user.email,
        school_id=new_school.id,
        user_id=new_user.id,
        ip_address=ip_addr
    )
    
    return {
        "status": "success",
        "message": "Registration submitted successfully. Your school account is waiting for administrator approval.",
        "school_id": new_school.id,
        "school_code": new_school.school_code,
        "status_code": "PENDING_APPROVAL"
    }

@router.post("/register-inspector")
def register_inspector(reg_data: InspectorRegisterRequest, request: Request, db: Session = Depends(get_db)):
    if reg_data.password != reg_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    if len(reg_data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters"
        )
        
    existing_user = db.query(User).filter(User.email == reg_data.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
        
    ip_addr = request.client.host if request.client else "unknown"
    
    new_inspector = User(
        email=reg_data.email.lower(),
        hashed_password=hash_password(reg_data.password),
        full_name=reg_data.full_name,
        phone=reg_data.phone,
        district=reg_data.district or "General Jurisdiction",
        role="INSPECTOR",
        status="PENDING_APPROVAL",
        school_id=None
    )
    db.add(new_inspector)
    db.commit()
    db.refresh(new_inspector)
    
    log_audit(
        db=db,
        action="INSPECTOR_REGISTERED",
        details=f"New Field Inspector registered: {new_inspector.full_name} ({new_inspector.email}) - Pending Admin Approval",
        user_email=new_inspector.email,
        user_id=new_inspector.id,
        ip_address=ip_addr
    )
    
    return {
        "status": "success",
        "message": "Inspector registration submitted successfully. Your account is awaiting administrator approval.",
        "user_id": new_inspector.id,
        "status_code": "PENDING_APPROVAL"
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "status": current_user.status,
        "school_id": current_user.school_id,
        "district": current_user.district,
        "assigned_schools": [
            {
                "id": s.id,
                "name": s.name,
                "school_code": s.school_code,
                "district": s.district,
                "status": s.status
            }
            for s in current_user.assigned_schools
        ] if current_user.role == "INSPECTOR" else [],
        "school": {
            "id": current_user.school.id,
            "name": current_user.school.name,
            "school_code": current_user.school.school_code,
            "district": current_user.school.district,
            "state": current_user.school.state,
            "address": current_user.school.address,
            "principal_name": current_user.school.principal_name,
            "hardware_status": current_user.school.hardware_status,
            "hardware_device_id": current_user.school.hardware_device_id,
            "hardware_api_key": current_user.school.hardware_api_key,
            "last_hardware_ping": current_user.school.last_hardware_ping
        } if current_user.school else None
    }


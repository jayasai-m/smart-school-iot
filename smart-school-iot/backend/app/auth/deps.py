from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..models.user import User
from ..models.school import School
from .security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
        
    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
        
    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    if current_user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active"
        )
    return current_user

def require_school(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "SCHOOL":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="School account required"
        )
    if current_user.status == "PENDING_APPROVAL":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your school account is awaiting administrator approval."
        )
    if current_user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your school account is inactive or rejected"
        )
    return current_user

def require_inspector(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "INSPECTOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inspector privileges required"
        )
    if current_user.status == "PENDING_APPROVAL":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your inspector account is awaiting administrator approval."
        )
    if current_user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your inspector account is inactive or rejected"
        )
    return current_user

def require_admin_or_inspector(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ["ADMIN", "INSPECTOR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Inspector privileges required"
        )
    if current_user.status == "PENDING_APPROVAL":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is awaiting administrator approval."
        )
    if current_user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active"
        )
    return current_user

def verify_school_access(school_id: int, user: User) -> bool:
    """
    Strict data isolation checker:
    ADMIN -> can access all schools
    SCHOOL -> can access ONLY its own school_id
    INSPECTOR -> can access ONLY schools assigned to them
    """
    if user.role == "ADMIN":
        return True
    if user.role == "SCHOOL" and user.school_id == school_id:
        return True
    if user.role == "INSPECTOR":
        assigned_ids = [s.id for s in user.assigned_schools]
        if school_id in assigned_ids:
            return True
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: This school is not assigned to your inspection jurisdiction."
        )
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Forbidden: You do not have permission to access another school's data."
    )


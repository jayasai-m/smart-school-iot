from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from ..models.alert import AuditLog

def log_audit(
    db: Session,
    action: str,
    details: str,
    user_email: str,
    school_id: Optional[int] = None,
    user_id: Optional[int] = None,
    ip_address: Optional[str] = None
):
    """
    Creates an immutable audit log entry for security and compliance tracking.
    """
    try:
        log_entry = AuditLog(
            school_id=school_id,
            user_id=user_id,
            user_email=user_email,
            action=action,
            details=details,
            ip_address=ip_address,
            created_at=datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error logging audit: {e}")

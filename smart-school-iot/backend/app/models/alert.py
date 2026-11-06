from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from ..database.connection import Base

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False, index=True)
    
    # Types: HIGH_TURBIDITY, LOW_WATER_LEVEL, OVERFLOW, HIGH_HUMIDITY, HARDWARE_DISCONNECTED
    alert_type = Column(String(100), nullable=False)
    severity = Column(String(50), nullable=False, default="WARNING") # CRITICAL, WARNING, INFO
    message = Column(Text, nullable=False)
    
    # Status: ACTIVE, ACKNOWLEDGED, RESOLVED, FLAGGED
    status = Column(String(50), default="ACTIVE", nullable=False)
    
    sensor_value = Column(Float, nullable=True)
    threshold_value = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(150), nullable=True)

    # Relationships
    school = relationship("School", back_populates="alerts")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String(150), nullable=False)
    action = Column(String(100), nullable=False) # e.g. SCHOOL_APPROVED, IMAGE_VERIFIED, ALERT_RESOLVED
    details = Column(Text, nullable=True)
    ip_address = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

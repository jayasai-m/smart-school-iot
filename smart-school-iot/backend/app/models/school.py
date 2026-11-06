from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from ..database.connection import Base

class School(Base):
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    school_code = Column(String(100), unique=True, index=True, nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    address = Column(Text, nullable=False)
    principal_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=False)
    
    # Status: ACTIVE, PENDING_APPROVAL, REJECTED, FLAGGED
    status = Column(String(50), default="PENDING_APPROVAL", nullable=False)
    
    # Hardware integration attributes
    hardware_status = Column(String(50), default="DISCONNECTED") # CONNECTED, DISCONNECTED
    hardware_device_id = Column(String(100), default="ESP32-DEVICE-01")
    hardware_api_key = Column(String(100), nullable=False)
    last_hardware_ping = Column(DateTime, nullable=True)
    
    # Physical tank configuration
    tank_capacity_litres = Column(Float, default=2000.0)
    tank_height_cm = Column(Float, default=200.0)
    sensor_offset_cm = Column(Float, default=10.0) # sensor to tank rim
    
    # Thresholds
    turbidity_threshold = Column(Float, default=5.0) # NTU
    low_water_threshold_pct = Column(Float, default=20.0) # %
    overflow_threshold_pct = Column(Float, default=90.0) # %
    humidity_threshold_pct = Column(Float, default=75.0) # %
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    users = relationship("User", back_populates="school", cascade="all, delete-orphan")
    sensor_readings = relationship("SensorReading", back_populates="school", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="school", cascade="all, delete-orphan")
    meal_submissions = relationship("MealSubmission", back_populates="school", cascade="all, delete-orphan")
    image_submissions = relationship("ImageSubmission", back_populates="school", cascade="all, delete-orphan")

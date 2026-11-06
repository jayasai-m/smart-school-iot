from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, Float
from sqlalchemy.orm import relationship
from ..database.connection import Base

class MealSubmission(Base):
    __tablename__ = "meal_submissions"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False, index=True)
    meal_type = Column(String(150), nullable=False) # e.g. "Rice & Sambar", "Vegetable Khichdi"
    menu_description = Column(Text, nullable=False)
    staff_name = Column(String(150), nullable=False)
    inspection_shift = Column(String(100), nullable=False) # Morning Prep / Lunch Serving
    hygiene_notes = Column(Text, nullable=True)
    submission_date = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    school = relationship("School", back_populates="meal_submissions")
    images = relationship("ImageSubmission", back_populates="meal_submission")

class ImageSubmission(Base):
    __tablename__ = "image_submissions"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False, index=True)
    uploaded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    meal_submission_id = Column(Integer, ForeignKey("meal_submissions.id"), nullable=True)
    
    category = Column(String(50), nullable=False) # "MEAL_PREPARATION" or "KITCHEN_HYGIENE"
    image_url = Column(String(255), nullable=False) # static path to uploaded file
    file_name = Column(String(255), nullable=False)
    
    # Metadata submitted alongside image
    meal_type = Column(String(150), nullable=True)
    menu_description = Column(Text, nullable=True)
    staff_name = Column(String(150), nullable=True)
    inspection_shift = Column(String(100), nullable=True)
    hygiene_notes = Column(Text, nullable=True)
    
    # Status: PENDING_REVIEW, VERIFIED, FLAGGED, REJECTED, CV_PASS, CV_FLAG
    status = Column(String(50), default="PENDING_REVIEW", nullable=False)
    admin_notes = Column(Text, nullable=True)
    reviewed_by = Column(String(150), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    
    # Geolocation and capture timestamp burned into photo
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    captured_location = Column(String(255), nullable=True)
    captured_timestamp = Column(String(100), nullable=True)
    
    # ── Computer Vision Analysis Results ──────────────────────
    # cv_status: CV_PASS | CV_FLAG | CV_ERROR | CV_SKIPPED
    cv_status = Column(String(50), nullable=True)
    cv_notes = Column(Text, nullable=True)
    cv_confidence = Column(Float, nullable=True)
    cv_processed_at = Column(DateTime, nullable=True)
    # For STUDENT_EATING category — person count from YOLOv8
    cv_student_count = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    school = relationship("School", back_populates="image_submissions")
    uploaded_by_user = relationship("User", back_populates="image_uploads")
    meal_submission = relationship("MealSubmission", back_populates="images")

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from ..database.connection import Base

# Association table between Inspector users and Schools
inspector_schools = Table(
    "inspector_schools",
    Base.metadata,
    Column("inspector_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("school_id", Integer, ForeignKey("schools.id", ondelete="CASCADE"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=True)
    district = Column(String(100), nullable=True)
    
    # Role: ADMIN, SCHOOL, INSPECTOR
    role = Column(String(50), nullable=False, default="SCHOOL")
    
    # Status: ACTIVE, PENDING_APPROVAL, REJECTED
    status = Column(String(50), nullable=False, default="PENDING_APPROVAL")
    
    # School relationship (NULL for Admin and Inspector)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    school = relationship("School", back_populates="users")
    image_uploads = relationship("ImageSubmission", back_populates="uploaded_by_user")
    assigned_schools = relationship("School", secondary=inspector_schools, backref="assigned_inspectors")


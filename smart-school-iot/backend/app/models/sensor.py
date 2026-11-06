from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database.connection import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False, index=True)
    
    # Ultrasonic Water Tank Readings
    distance_cm = Column(Float, nullable=False) # raw physical echo distance
    water_level_pct = Column(Float, nullable=False) # calculated percentage (0-100)
    water_volume_litres = Column(Float, nullable=False) # calculated litres based on tank capacity
    ultrasonic_status = Column(String(50), default="NORMAL") # NORMAL, LOW, OVERFLOW, ERROR
    
    # Turbidity Readings
    turbidity_ntu = Column(Float, nullable=False) # NTU value
    turbidity_voltage = Column(Float, nullable=True) # raw analog voltage
    turbidity_status = Column(String(50), default="GOOD") # GOOD, MODERATE, POOR
    
    # Kitchen Humidity Readings
    humidity_pct = Column(Float, nullable=False) # relative humidity %
    humidity_status = Column(String(50), default="NORMAL") # NORMAL, HIGH
    
    # Optional physical temperature (ONLY if physical DHT or temp sensor sends it; NEVER fabricated)
    temperature_c = Column(Float, nullable=True)
    
    raw_payload = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    school = relationship("School", back_populates="sensor_readings")

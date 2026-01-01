from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    dob = Column(String)
    history_summary = Column(Text)  # e.g. "Diabetes, Hypertension"
    status = Column(String, default="Waiting") # Waiting, Complete

    # Link to their notes
    notes = relationship("SOAPNote", back_populates="patient")

class SOAPNote(Base):
    __tablename__ = "soap_notes"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id")) # Links to Patient Table
    content = Column(Text)  # The actual note text
    created_at = Column(DateTime(timezone=True), server_default=func.now()) # Timestamp

    patient = relationship("Patient", back_populates="notes")
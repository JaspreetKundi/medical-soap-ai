from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base
import datetime

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    dob = Column(String) # Date of Birth
    gender = Column(String)
    medical_history = Column(Text) # "Hypertension, Diabetes..."
    allergies = Column(Text)       # "Penicillin, Peanuts"
    
    # We can add a photo_url later for the UI!

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer) # We will link this to Patient table later
    time = Column(String)        # "09:00 AM"
    reason = Column(String)      # "Migraine"
    status = Column(String, default="Scheduled") # Scheduled, Waiting, Complete

# ... (Patient and Appointment classes are above this) ...

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer)  # This links the note to a specific Patient
    content = Column(Text)        # The actual SOAP Note text
    created_at = Column(String)   # Date/Time (e.g., "2025-10-26 14:30")
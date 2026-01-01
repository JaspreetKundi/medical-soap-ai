from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
from pydantic import BaseModel
from typing import List, Optional
from ai_agent import generate_soap_note, suggest_followup_question
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- INPUT SCHEMAS ---
class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    dob: str
    history_summary: str

class NoteRequest(BaseModel):
    patient_id: int
    transcript: str
    vitals: str

# NEW: Schema specifically for saving a finished note
class SaveNoteRequest(BaseModel):
    patient_id: int
    content: str

class AnalysisRequest(BaseModel):
    text: str

# --- API ENDPOINTS ---

@app.get("/patients")
def get_patients(search: str = "", db: Session = Depends(get_db)):
    query = db.query(models.Patient)
    if search:
        query = query.filter(models.Patient.last_name.contains(search) | models.Patient.first_name.contains(search))
    return query.all()

@app.get("/patients/{patient_id}")
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@app.post("/patients")
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    new_patient = models.Patient(
        first_name=patient.first_name,
        last_name=patient.last_name,
        dob=patient.dob,
        history_summary=patient.history_summary,
        status="Waiting"
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient

# --- CHANGED: GENERATE ONLY (No Saving!) ---
@app.post("/generate_note")
def generate_only(request: NoteRequest):
    # Just ask AI, do NOT touch the database
    ai_text = generate_soap_note(request.transcript, request.vitals)
    return {"note": ai_text}

# --- NEW: SAVE MANUALLY ---
@app.post("/save_note")
def save_note_manually(request: SaveNoteRequest, db: Session = Depends(get_db)):
    # 1. Save the note to history
    new_note = models.SOAPNote(patient_id=request.patient_id, content=request.content)
    
    # 2. Mark patient as "Complete"
    patient = db.query(models.Patient).filter(models.Patient.id == request.patient_id).first()
    if patient:
        patient.status = "Complete"
    
    db.add(new_note)
    db.commit()
    return {"message": "Successfully saved!"}

@app.post("/analyze")
def analyze_transcript(request: AnalysisRequest):
    question = suggest_followup_question(request.text)
    return {"ai_suggestion": question}

@app.get("/patients/{patient_id}/history")
def get_history(patient_id: int, db: Session = Depends(get_db)):
    notes = db.query(models.SOAPNote).filter(models.SOAPNote.patient_id == patient_id).all()
    return notes

@app.post("/seed_data")
def seed_data(db: Session = Depends(get_db)):
    if db.query(models.Patient).first():
        return {"message": "Patients already exist!"}
    
    p1 = models.Patient(first_name="Sarah", last_name="Smith", dob="1995-04-12", history_summary="Migraines")
    p2 = models.Patient(first_name="John", last_name="Doe", dob="1980-01-01", history_summary="Diabetes")
    p3 = models.Patient(first_name="Mike", last_name="Ross", dob="1990-08-23", history_summary="Asthma")
    
    db.add_all([p1, p2, p3])
    db.commit()
    return {"message": "Added 3 Test Patients!"}

# --- ADD THIS TO MAIN.PY ---

@app.post("/reset_db")
def reset_database(db: Session = Depends(get_db)):
    # Delete all rows from both tables
    db.query(models.SOAPNote).delete()
    db.query(models.Patient).delete()
    db.commit()
    return {"message": "Database reset successfully"}
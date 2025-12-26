from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import our new files
import models
import schemas
from database import engine, get_db
from ai_agent import generate_soap_note, suggest_followup_question

# Create Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# --- SECURITY (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AI SECTION ---
class PatientRequest(BaseModel):
    text: str

@app.post("/generate")
def run_ai(request: PatientRequest):
    result = generate_soap_note(request.text)
    return {"soap_note": result}

# --- PATIENT SYSTEM SECTION (NEW) ---

# 1. Create a Patient
@app.post("/patients/", response_model=schemas.Patient)
def create_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    db_patient = models.Patient(**patient.dict())
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

# 2. Get All Patients (For the Queue)
@app.get("/patients/", response_model=list[schemas.Patient])
def read_patients(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    patients = db.query(models.Patient).offset(skip).limit(limit).all()
    return patients

# 3. Get One Patient (For the Profile Page)
@app.get("/patients/{patient_id}", response_model=schemas.Patient)
def read_patient(patient_id: int, db: Session = Depends(get_db)):
    db_patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db_patient


# --- DEBUG: SEED DATA ---
@app.post("/seed_data")
def seed_data(db: Session = Depends(get_db)):
    # Check if data already exists
    if db.query(models.Patient).first():
        return {"message": "Data already exists!"}
    
    # Create fake patients
    p1 = models.Patient(first_name="Sarah", last_name="Smith", dob="1995-04-12", gender="F", medical_history="Migraines, Hypertension", allergies="Penicillin")
    p2 = models.Patient(first_name="John", last_name="Doe", dob="1980-01-01", gender="M", medical_history="Diabetes Type 2", allergies="Peanuts")
    p3 = models.Patient(first_name="Mike", last_name="Ross", dob="1990-08-23", gender="M", medical_history="Asthma", allergies="None")
    
    db.add_all([p1, p2, p3])
    db.commit()
    return {"message": "Database populated with 3 patients!"}

# --- NEW: LIVE ANALYSIS ROUTE ---
@app.post("/analyze")
def analyze_transcript(request: PatientRequest):
    # Ask the AI for a question
    question = suggest_followup_question(request.text)
    return {"ai_suggestion": question}

# --- NEW: SAVE A NOTE ---
@app.post("/notes/", response_model=schemas.Note)
def create_note(note: schemas.NoteCreate, db: Session = Depends(get_db)):
    db_note = models.Note(**note.dict())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

# --- NEW: GET ALL NOTES FOR A SPECIFIC PATIENT ---
@app.get("/patients/{patient_id}/notes", response_model=list[schemas.Note])
def read_notes(patient_id: int, db: Session = Depends(get_db)):
    # Fetch notes only for this specific patient ID
    notes = db.query(models.Note).filter(models.Note.patient_id == patient_id).all()
    return notes
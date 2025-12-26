from pydantic import BaseModel

# 1. Base Schema (Shared data)
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    dob: str
    gender: str
    medical_history: str | None = None
    allergies: str | None = None

# 2. For Creating a Patient (What we send to the server)
class PatientCreate(PatientBase):
    pass

# 3. For Reading a Patient (What the server sends back)
class Patient(PatientBase):
    id: int

    class Config:
        from_attributes = True

# ... (Patient schemas are above this) ...

# 1. What we send to the server to SAVE a note
class NoteCreate(BaseModel):
    patient_id: int
    content: str
    created_at: str

# 2. What the server sends back when we READ a note
class Note(NoteCreate):
    id: int
    class Config:
        from_attributes = True
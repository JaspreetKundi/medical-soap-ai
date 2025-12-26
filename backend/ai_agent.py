import os
from pathlib import Path
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# --- STEP 1: LOAD THE KEY (ROBUST METHOD) ---
# This forces Python to look in the SAME folder as this script for .env
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Retrieve the key securely
api_key = os.getenv("OPENAI_API_KEY")

# Check if it loaded (for debugging)
if not api_key:
    raise ValueError("❌ API Key not found! Check your .env file.")

# --- STEP 2: SETUP THE BRAIN ---
# We pass the variable 'api_key' here, NOT the hardcoded string
llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0, openai_api_key=api_key)

# --- STEP 3: DOCTOR INSTRUCTIONS (SOAP NOTE) ---
def generate_soap_note(transcript: str, vitals: str = "None provided"):
    prompt_template = ChatPromptTemplate.from_template("""
    You are an expert medical scribe. Generate a professional SOAP note.
    
    VITALS: {vitals}
    PATIENT TRANSCRIPT: "{transcript}"
    
    INSTRUCTIONS:
    - S: Summarize subjective complaints.
    - O: List vitals. If none, say "Vitals not taken."
    - A: Likely diagnosis.
    - P: Immediate plan.
    """)
    chain = prompt_template | llm | StrOutputParser()
    return chain.invoke({"transcript": transcript, "vitals": vitals})

# --- STEP 4: NURSE INSTRUCTIONS (QUESTIONS) ---
def suggest_followup_question(text: str):
    prompt_template = ChatPromptTemplate.from_template("""
    You are a triage nurse. Identify MISSING critical info in this text: "{patient_text}"
    - If pain mentioned, ask severity (1-10).
    - If infection mentioned, ask about fever.
    - If severity/details are ALREADY present, ask about duration.
    Output ONE single follow-up question.
    """)
    chain = prompt_template | llm | StrOutputParser()
    return chain.invoke({"patient_text": text})
import os
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# --- STEP 1: LOAD THE KEY ---
# This forces Python to look in the SAME folder as this script for .env
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path)

# Retrieve the key securely
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    raise ValueError("❌ API Key not found! Check your .env file.")

# --- STEP 2: SETUP THE BRAIN ---
client = OpenAI(api_key=api_key)

# --- STEP 3: MAIN FUNCTIONS ---

def generate_soap_note(transcript: str, vitals: str = "None provided"):
    """
    Generates the full SOAP note based on the transcript and vitals.
    """
    system_prompt = """
    You are an expert medical scribe. Generate a comprehensive and professional SOAP note.
    
    CRITICAL INSTRUCTIONS:
    1. **Objective (O):** List the provided vitals clearly.
    2. **Plan (P):** You MUST explicitly address any abnormal vitals in the plan.
       - Example: If BP is low, mention IV fluids or pressors.
       - Example: If Temp is high, mention antipyretics or cooling measures.
       - Example: If HR is high, mention beta-blockers or further workup.
    3. Maintain a professional medical tone.
    
    Format:
    S: Subjective
    O: Objective
    A: Assessment
    P: Plan (Detailed steps addressing both the transcript AND the specific vitals)
    """
    
    user_message = f"""
    VITALS: {vitals}
    PATIENT TRANSCRIPT: "{transcript}"
    """

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        temperature=0.2 # Lower temperature = More focused and strict
    )

    return response.choices[0].message.content

def suggest_followup_question(transcript: str):
    """
    Analyzes the live transcript and suggests ONE follow-up question.
    """
    system_prompt = "You are a helpful medical assistant. Based on what the patient just said, suggest ONE short, professional follow-up question the nurse should ask to get more clarity."
    
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": transcript}
        ],
        temperature=0.7
    )
    
    return response.choices[0].message.content
const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get('id');

// Voice Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;
recognition.lang = 'en-US';

let isListening = false;

window.onload = async function() {
    if (!patientId) { window.location.href = 'dashboard.html'; return; }
    await loadPatientData();
    await loadNotesHistory();
};

async function loadPatientData() {
    try {
        const response = await fetch(`http://127.0.0.1:8000/patients/${patientId}`);
        const pt = await response.json();
        document.getElementById('pt-name').innerText = `${pt.last_name}, ${pt.first_name}`;
        document.getElementById('pt-dob').innerText = pt.dob;
        document.getElementById('pt-id').innerText = `#${pt.id}`;
        if (pt.allergies && pt.allergies !== "None") {
            document.getElementById('allergy-alert').style.display = 'block';
            document.getElementById('pt-allergies').innerText = pt.allergies;
        }
    } catch (error) { console.error("Error loading patient:", error); }
}

async function loadNotesHistory() {
    try {
        const response = await fetch(`http://127.0.0.1:8000/patients/${patientId}/notes`);
        const notes = await response.json();
        
        const historyList = document.getElementById('history-list');
        if (notes.length > 0) {
            historyList.innerHTML = ''; 
            
            notes.reverse().forEach(note => {
                const item = document.createElement('div');
                item.className = 'history-item';
                // Add click event to open the modal
                item.onclick = () => showNoteDetail(note.content, note.created_at);
                
                item.innerHTML = `
                    <div class="history-date">📅 ${note.created_at || 'Unknown Date'}</div>
                    <div class="history-preview">${note.content}</div>
                `;
                historyList.appendChild(item);
            });
        }
    } catch (error) { console.error("Error loading history:", error); }
}

// --- NEW: POPUP LOGIC ---
function showNoteDetail(content, date) {
    document.getElementById('modal-date').innerText = date || 'Unknown Date';
    document.getElementById('modal-text').innerText = content;
    document.getElementById('note-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('note-modal').style.display = 'none';
}
// ------------------------

function toggleMic() {
    const btn = document.getElementById('btn-mic');
    if (isListening) {
        askAIForSuggestions(); 
        recognition.stop();
        isListening = false;
        btn.innerHTML = "🎙️ Start Listening";
        btn.style.background = "#2563eb";
        btn.classList.remove('pulsing');
    } else {
        document.getElementById('ai-suggestion-box').style.display = 'none';
        recognition.start();
        isListening = true;
        btn.innerHTML = "🛑 Stop Listening";
        btn.style.background = "#ef4444";
        btn.classList.add('pulsing');
    }
}

recognition.onresult = (event) => {
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + ' ';
    }
    if (finalTranscript) {
        document.getElementById('raw-notes').value += finalTranscript;
        const p = document.querySelector('.transcript-box p');
        p.innerText = document.getElementById('raw-notes').value;
    }
};

async function askAIForSuggestions() {
    const text = document.getElementById('raw-notes').value;
    if (text.length < 5) return; 

    const box = document.getElementById('ai-suggestion-box');
    const questionText = document.getElementById('ai-question');
    
    box.style.display = 'block';
    questionText.innerText = "Thinking...";

    try {
        const response = await fetch('http://127.0.0.1:8000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });
        const data = await response.json();
        questionText.innerText = data.ai_suggestion;
        
        box.style.animation = "none";
        box.offsetHeight; 
        box.style.animation = "pulse 1s 1"; 

    } catch (error) { console.error("AI Error:", error); }
}

async function generateNote() {
    const text = document.getElementById('raw-notes').value;
    const indicator = document.getElementById('loading-indicator');
    
    if (!text) { alert("Enter notes first!"); return; }
    indicator.style.display = 'block';
    
    try {
        const response = await fetch('http://127.0.0.1:8000/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });
        const data = await response.json();
        document.getElementById('soap-note-area').value = data.soap_note;
    } catch (error) { alert("Error generating note."); } 
    finally { indicator.style.display = 'none'; }
}

async function saveNote() {
    const content = document.getElementById('soap-note-area').value;
    if (!content) { alert("Cannot save empty note!"); return; }

    try {
        const response = await fetch('http://127.0.0.1:8000/notes/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patient_id: patientId,
                content: content,
                created_at: new Date().toLocaleString()
            })
        });
        if (response.ok) {
            alert("✅ Saved!");
            loadNotesHistory(); 
        }
    } catch (error) { alert("Save failed."); }
}
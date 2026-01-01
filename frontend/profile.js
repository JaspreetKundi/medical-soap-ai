const API_URL = "http://127.0.0.1:8000";

// 1. Get Patient ID
const urlParams = new URLSearchParams(window.location.search);
const patientId = urlParams.get('id');
let currentNotes = []; 

// 2. Initialize
document.addEventListener('DOMContentLoaded', async () => {
    if (!patientId) {
        alert("No patient selected! Returning to dashboard.");
        window.location.href = "dashboard.html";
        return;
    }
    await loadPatientInfo();
    await loadHistory();
});

// --- A. LOAD PATIENT INFO ---
async function loadPatientInfo() {
    try {
        const res = await fetch(`${API_URL}/patients/${patientId}`);
        if (!res.ok) throw new Error("Patient not found");
        const p = await res.json();
        
        document.getElementById('pt-name').innerText = `${p.last_name}, ${p.first_name}`;
        document.getElementById('pt-dob').innerText = p.dob;
        document.getElementById('pt-id').innerText = `#${p.id}`;
        
        if (p.history_summary && p.history_summary.toLowerCase().includes("allergy")) {
            document.getElementById('allergy-alert').style.display = "block";
            document.getElementById('pt-allergies').innerText = p.history_summary;
        }
    } catch (e) { console.error(e); }
}

// --- B. MICROPHONE LOGIC ---
let recognition;
let isListening = false;

function toggleMic() {
    if (isListening) {
        recognition.stop();
        return;
    }
    // Browser compatibility check
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Your browser does not support voice recognition. Try Google Chrome.");
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        isListening = true;
        const btn = document.getElementById('btn-mic');
        btn.innerText = "🔴 Listening... (Click to Stop)";
        btn.classList.add("pulsing");
    };

    recognition.onend = () => {
        isListening = false;
        const btn = document.getElementById('btn-mic');
        btn.innerText = "🎙️ Start Listening";
        btn.classList.remove("pulsing");
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        
        // Update Visual Box
        const visualBox = document.querySelector('.transcript-box p');
        visualBox.innerText = transcript;
        visualBox.style.color = "#1f2937";
        visualBox.style.fontStyle = "normal";

        // Update Hidden Input
        document.getElementById('raw-notes').value += transcript + ". ";
        
        getAiSuggestion(transcript);
    };

    recognition.start();
}

// --- C. AI SUGGESTION ---
async function getAiSuggestion(text) {
    const box = document.getElementById('ai-suggestion-box');
    const questionText = document.getElementById('ai-question');
    box.style.display = "block";
    questionText.innerText = "Thinking...";

    try {
        const res = await fetch(`${API_URL}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: text })
        });
        const data = await res.json();
        questionText.innerText = data.ai_suggestion;
    } catch (e) {
        questionText.innerText = "Could not get suggestion.";
    }
}

// --- D. GENERATE SOAP NOTE (With Vitals!) ---
async function generateNote() {
    const transcript = document.getElementById('raw-notes').value;
    const outputArea = document.getElementById('soap-note-area');
    const loading = document.getElementById('loading-indicator');

    // Get Vitals
    const bp = document.getElementById('v-bp').value || "Not measured";
    const hr = document.getElementById('v-hr').value || "Not measured";
    const temp = document.getElementById('v-temp').value || "Not measured";
    const rr = document.getElementById('v-rr').value || "Not measured";
    
    const realVitals = `BP: ${bp}, HR: ${hr}, Temp: ${temp}, Resp: ${rr}`;

    if (!transcript) {
        alert("Please speak or type some notes first!");
        return;
    }

    loading.style.display = "block"; 
    
    try {
        const res = await fetch(`${API_URL}/generate_note`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                patient_id: patientId,
                transcript: transcript,
                vitals: realVitals
            })
        });

        const data = await res.json();
        outputArea.value = data.note; 

    } catch (e) {
        outputArea.value = "Error generating note. Check console.";
    } finally {
        loading.style.display = "none";
    }
}

// --- E. SAVE MANUALLY ---
async function saveNote() {
    const content = document.getElementById('soap-note-area').value;
    if (!content) {
        alert("Cannot save an empty note!");
        return;
    }
    
    await fetch(`${API_URL}/save_note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            patient_id: patientId,
            content: content
        })
    });
    
    alert("✅ Note saved to Patient History!");
    loadHistory();
}

// --- F. LOAD HISTORY LIST ---
async function loadHistory() {
    const list = document.getElementById('history-list');
    
    const res = await fetch(`${API_URL}/patients/${patientId}/history`);
    const notes = await res.json();
    
    currentNotes = notes.reverse(); 

    if (currentNotes.length === 0) {
        list.innerHTML = `<p style="color:#9ca3af;">No previous notes found.</p>`;
        return;
    }

    list.innerHTML = ""; 
    
    currentNotes.forEach((note, index) => {
        const dateObj = new Date(note.created_at + "Z"); 
        const dateStr = dateObj.toLocaleString(); 
        
        const preview = note.content.substring(0, 80) + "...";
        
        const item = `
            <div class="history-item" onclick="openModal(${index})">
                <div class="history-date">📅 ${dateStr}</div>
                <div class="history-preview">${preview}</div>
            </div>
        `;
        list.innerHTML += item;
    });
}

// --- G. MODAL LOGIC ---
function openModal(index) {
    const note = currentNotes[index];
    const dateObj = new Date(note.created_at + "Z");
    
    document.getElementById('modal-text').innerText = note.content;
    document.getElementById('modal-date').innerText = `Visit Date: ${dateObj.toLocaleString()}`;
    document.getElementById('note-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('note-modal').style.display = 'none';
}

// --- H. EXPORT TO PDF ---
function downloadPDF() {
    const content = document.getElementById('soap-note-area').value;
    const patientName = document.getElementById('pt-name').innerText;
    const date = new Date().toLocaleDateString();

    if (!content) {
        alert("No note to download!");
        return;
    }

    // Create a temporary hidden window to print
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>SOAP Note</title>');
    printWindow.document.write('<style>body{font-family:sans-serif; padding: 20px;} h1{color:#2563eb;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(`<h1>Medical Record: ${patientName}</h1>`);
    printWindow.document.write(`<p><strong>Date:</strong> ${date}</p>`);
    printWindow.document.write('<hr>');
    printWindow.document.write(`<pre style="white-space: pre-wrap; font-family: monospace; font-size: 14px;">${content}</pre>`);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.print();
}
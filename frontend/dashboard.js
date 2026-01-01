const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Set Welcome Message
    const nurseName = localStorage.getItem("nurseName") || "Nurse Jackie";
    document.getElementById("welcomeText").innerText = `Welcome back, ${nurseName} 👋`;

    // 2. Load Patients
    fetchPatients();

    // 3. Search Logic
    document.getElementById("searchInput").addEventListener("input", (e) => {
        fetchPatients(e.target.value);
    });
});

async function fetchPatients(query = "") {
    const tbody = document.getElementById("patientTableBody");
    tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4">Loading...</td></tr>`;

    try {
        // FIX: Add timestamp to force fresh data (fixes "Status not updating")
        const res = await fetch(`${API_URL}/patients?search=${query}&t=${Date.now()}`);
        const patients = await res.json();
        
        tbody.innerHTML = ""; 

        if(patients.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-muted">No patients found.</td></tr>`;
            return;
        }

        patients.forEach(p => {
            // Check status styling
            const statusClass = p.status === 'Complete' ? 'status-complete' : 'status-waiting';
            
            const row = `
                <tr>
                    <td class="ps-4 text-muted">#${p.id}</td>
                    <td class="fw-bold text-dark">${p.last_name}, ${p.first_name}</td>
                    <td>${p.dob}</td>
                    <td class="text-truncate" style="max-width: 150px;">${p.history_summary}</td>
                    <td><span class="status-badge ${statusClass}">${p.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="startVisit(${p.id})">
                            ${p.status === 'Complete' ? 'Review Note' : 'Start Visit'}
                        </button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error connecting to server.</td></tr>`;
    }
}

// --- NEW ADD PATIENT LOGIC ---
async function saveNewPatient() {
    const first = document.getElementById("newFirst").value;
    const last = document.getElementById("newLast").value;
    const dob = document.getElementById("newDob").value;
    const history = document.getElementById("newHistory").value;

    if(!first || !last) {
        alert("Name is required!");
        return;
    }

    try {
        await fetch(`${API_URL}/patients`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                first_name: first, 
                last_name: last, 
                dob: dob || "N/A", 
                history_summary: history || "Check-up"
            })
        });

        // Close Modal manually
        const modalEl = document.getElementById('addPatientModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        // Clear Form
        document.getElementById("newFirst").value = "";
        document.getElementById("newLast").value = "";

        // Refresh List
        fetchPatients();

    } catch (e) {
        alert("Error adding patient. Is backend running?");
    }
}

function startVisit(id) {
    window.location.href = `patient_profile.html?id=${id}`;
}
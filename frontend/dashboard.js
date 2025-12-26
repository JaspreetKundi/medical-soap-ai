// 1. Function to fetch patients from the backend
async function loadPatients() {
    try {
        const response = await fetch('http://127.0.0.1:8000/patients/');
        const patients = await response.json();

        // 2. Get the table body
        const tableBody = document.getElementById('patient-table-body');
        tableBody.innerHTML = ''; // Clear any loading text

        // 3. Loop through each patient and create a row
        patients.forEach(patient => {
            const row = document.createElement('tr');

            // We are faking the "Status" for now to look cool
            const status = Math.random() > 0.5 ? 'Waiting' : 'Complete';
            const statusClass = status === 'Waiting' ? 'status-waiting' : 'status-complete';

            row.innerHTML = `
                <td>#${patient.id}</td>
                <td><strong>${patient.last_name}, ${patient.first_name}</strong></td>
                <td>${patient.dob}</td>
                <td>${patient.medical_history || 'Check-up'}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>
                    <button class="btn-action" onclick="startVisit(${patient.id})">
                        Start Visit
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading patients:', error);
    }
}

// 4. Handle the "Start Visit" button
// 4. Handle the "Start Visit" button
function startVisit(patientId) {
    // Redirect to the new profile page with the ID attached
    window.location.href = `patient_profile.html?id=${patientId}`;
}

// Load data when page opens
window.onload = loadPatients;
async function generateNote() {
    const notes = document.getElementById('notes').value;
    const resultDiv = document.getElementById('result');
    const contentDiv = document.getElementById('soap-content');
    const loadingDiv = document.getElementById('loading');

    if (!notes) {
        alert("Please enter patient notes first.");
        return;
    }

    // Show loading spinner
    loadingDiv.style.display = 'block';
    resultDiv.style.display = 'none';

    try {
        // Send data to Python
        const response = await fetch('http://127.0.0.1:8000/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: notes })
        });

        const data = await response.json();

        // Show Result
        contentDiv.innerText = data.soap_note;
        resultDiv.style.display = 'block';

    } catch (error) {
        console.error("Error:", error);
        alert("Failed to connect. Is the backend running?");
    } finally {
        loadingDiv.style.display = 'none';
    }
}
// Submit a new loan application
function submitApplication() {
    const f_name = document.getElementById('f_name').value.trim();
    const l_name = document.getElementById('l_name').value.trim();
    const address = document.getElementById('address').value.trim();
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value.trim();
    const zipcode = document.getElementById('zipcode').value.trim();

    // Check if any field is empty
    if (!f_name || !l_name || !address || !city || !state || !zipcode) {
        document.getElementById('applicationResult').innerHTML =
            `<span style="color:red;">All fields are required.</span>`;
        return;
    }

    const applicationData = {
        f_name,
        l_name,
        address,
        city,
        state,
        zipcode
    };

    fetch('/api/submit_application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(applicationData)
    })
    .then(response => response.json())
    .then(data => {
        const resultDiv = document.getElementById('applicationResult');
        resultDiv.innerHTML = `Application submitted! Your tracking ID is: <b>${data.tracking_id}</b>`;
        clearApplicationForm();
    })
    .catch(error => {
        console.error('Error submitting application:', error);
    });
}

// Check the status of an existing application
function checkStatus() {
    const trackingId = document.getElementById('statusTrackingId').value;

    fetch(`/api/check_status/${trackingId}`)
        .then(response => response.json())
        .then(data => {
            const statusDiv = document.getElementById('statusResult');
            const notesDiv = document.getElementById('notesResult');

            if (data.status === "not found") {
                statusDiv.innerHTML = `<span style="color:red;">Application not found.</span>`;
                notesDiv.innerHTML = "";
                return;
            }

            statusDiv.innerHTML = `Current Status: <b>${data.status}</b>`;

            if (data.notes && data.notes.length > 0) {
                const notesList = data.notes.map(note => `<li>${note}</li>`).join('');
                notesDiv.innerHTML = `<h3>Notes</h3><ul>${notesList}</ul>`;
            } else {
                notesDiv.innerHTML = "<p>No notes available for this application.</p>";
            }
        })
        .catch(error => {
            console.error('Error checking status:', error);
        });
}

// Clear application form fields
function clearApplicationForm() {
    document.getElementById('f_name').value = '';
    document.getElementById('l_name').value = '';
    document.getElementById('address').value = '';
    document.getElementById('city').value = '';
    document.getElementById('state').value = '';
    document.getElementById('zipcode').value = '';
}

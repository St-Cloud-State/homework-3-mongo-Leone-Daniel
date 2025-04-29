// Function to submit a new application
function submitApplication() {
    const f_name = document.getElementById('f_name').value;
    const l_name = document.getElementById('l_name').value;
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const state = document.getElementById('state').value;
    const zipcode = document.getElementById('zipcode').value;

    const applicationData = {
        f_name: f_name,
        l_name: l_name,
        address: address,
        city: city,
        state: state,
        zipcode: zipcode
    };

    fetch('/api/submit_application', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
    })
    .then(response => response.json())
    .then(data => {
        const resultDiv = document.getElementById('applicationResult');
        resultDiv.innerHTML = `Application submitted! Your tracking ID is: <b>${data.tracking_id}</b>`;
        
        // Optionally clear the input fields
        document.getElementById('f_name').value = '';
        document.getElementById('l_name').value = '';
        document.getElementById('address').value = '';
        document.getElementById('city').value = '';
        document.getElementById('state').value = '';
        document.getElementById('zipcode').value = '';
    })
    .catch(error => {
        console.error('Error submitting application:', error);
    });
}

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
                toggleAcceptanceNoteSection(""); // hide section
                return;
            }

            statusDiv.innerHTML = `Current Status: <b>${data.status}</b>`;
            toggleAcceptanceNoteSection(data.status); // only show if accepted

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

function updateStatus() {
    const trackingId = document.getElementById('updateTrackingId').value;
    const newStatus = document.getElementById('newStatus').value;
    const rejectionReason = document.getElementById('rejectionReason').value;

    const updateData = {
        tracking_id: trackingId,
        new_status: newStatus
    };

    if (newStatus === 'rejected') {
        if (!rejectionReason.trim()) {
            document.getElementById('updateStatusResult').innerHTML =
                `<span style="color:red;">Rejection reason is required when rejecting an application.</span>`;
            return;
        }
        updateData.rejection_reason = rejectionReason;
    }

    fetch('/api/update_status', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(({ status, body }) => {
        const resultDiv = document.getElementById('updateStatusResult');
        if (status === 200) {
            resultDiv.innerHTML = `<span style="color:green;">${body.message}</span>`;
        } else {
            resultDiv.innerHTML = `<span style="color:red;">${body.message}</span>`;
        }
    })
    .catch(error => {
        console.error('Error updating status:', error);
    });
}

function toggleRejectionReason() {
    const status = document.getElementById('newStatus').value;
    const container = document.getElementById('rejectionReasonContainer');
    container.style.display = (status === 'rejected') ? 'block' : 'none';
}

function toggleAcceptanceNoteSection(status) {
    const section = document.getElementById('addAcceptanceNote');
    if (status === 'accepted') {
        section.style.display = 'block';
        document.getElementById('acceptanceTrackingId').value = document.getElementById('statusTrackingId').value;
    } else {
        section.style.display = 'none';
    }
}

function submitAcceptanceNote() {
    const trackingId = document.getElementById('acceptanceTrackingId').value;
    const message = document.getElementById('acceptanceMessage').value;

    if (!message.trim()) {
        document.getElementById('acceptanceNoteResult').innerHTML =
            `<span style="color:red;">Message cannot be empty.</span>`;
        return;
    }

    fetch('/api/add_acceptance_note', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tracking_id: trackingId,
            message: message
        })
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(({ status, body }) => {
        const resultDiv = document.getElementById('acceptanceNoteResult');
        if (status === 200) {
            resultDiv.innerHTML = `<span style="color:green;">${body.message}</span>`;
            document.getElementById('acceptanceMessage').value = '';
        } else {
            resultDiv.innerHTML = `<span style="color:red;">${body.message}</span>`;
        }
    })
    .catch(error => {
        console.error('Error submitting acceptance note:', error);
    });
}

function submitGeneralNote() {
    const trackingId = document.getElementById('generalTrackingId').value;
    const message = document.getElementById('generalMessage').value;

    if (!message.trim()) {
        document.getElementById('generalNoteResult').innerHTML =
            `<span style="color:red;">Message cannot be empty.</span>`;
        return;
    }

    fetch('/api/add_general_note', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tracking_id: trackingId,
            message: message
        })
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(({ status, body }) => {
        const resultDiv = document.getElementById('generalNoteResult');
        if (status === 200) {
            resultDiv.innerHTML = `<span style="color:green;">${body.message}</span>`;
            document.getElementById('generalMessage').value = '';
        } else {
            resultDiv.innerHTML = `<span style="color:red;">${body.message}</span>`;
        }
    })
    .catch(error => {
        console.error('Error submitting general note:', error);
    });
}
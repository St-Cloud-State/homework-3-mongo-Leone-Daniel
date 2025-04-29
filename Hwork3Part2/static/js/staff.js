let selectedTrackingId = null;

// === Select and Display Applications ===
function loadApplications() {
    fetch('/api/applications')
        .then(response => response.json())
        .then(data => {
            const listDiv = document.getElementById('applicationsList');
            if (data.length === 0) {
                listDiv.innerHTML = "<p>No applications found.</p>";
                return;
            }

            const rows = data.map(app => `
                <tr onclick="selectApplication('${app.tracking_id}')" style="cursor:pointer;" class="${selectedTrackingId === app.tracking_id ? 'selected-row' : ''}">
                    <td>${app.tracking_id}</td>
                    <td>${app.f_name} ${app.l_name}</td>
                    <td>${app.status}</td>
                </tr>
            `).join('');

            listDiv.innerHTML = `
                <table border="1">
                    <thead>
                        <tr><th>Tracking ID</th><th>Name</th><th>Status</th></tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <p><strong>Selected Application:</strong> <span id="selectedAppDisplay">${selectedTrackingId || 'None'}</span></p>
            `;
        })
        .catch(error => {
            console.error('Error loading applications:', error);
        });
}

function selectApplication(trackingId) {
    selectedTrackingId = trackingId;
    loadApplications();
}

// === Status Update ===
function updateStatus() {
    const trackingId = selectedTrackingId;
    const newStatus = document.getElementById('newStatus').value;
    const rejectionReason = document.getElementById('rejectionReason').value;

    if (!trackingId) {
        document.getElementById('updateStatusResult').innerHTML =
            `<span style="color:red;">Please select an application first.</span>`;
        return;
    }

    const updateData = {
        tracking_id: trackingId,
        new_status: newStatus
    };

    if (newStatus === 'rejected') {
        if (!rejectionReason.trim()) {
            document.getElementById('updateStatusResult').innerHTML =
                `<span style="color:red;">❌ Rejection reason is required for rejection.</span>`;
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
        resultDiv.innerHTML = `<span style="${status === 200 ? 'color:green' : 'color:red'};">${body.message}</span>`;
    })
    .catch(error => {
        console.error('Error updating status:', error);
    });
}

// === Show/hide rejection reason ===
function toggleRejectionReason() {
    const status = document.getElementById('newStatus').value;
    const container = document.getElementById('rejectionReasonContainer');
    container.style.display = (status === 'rejected') ? 'block' : 'none';
}

// === General Note ===
function submitGeneralNote() {
    const trackingId = selectedTrackingId;
    const message = document.getElementById('generalMessage').value;

    if (!trackingId) {
        document.getElementById('generalNoteResult').innerHTML =
            `<span style="color:red;">Please select an application first.</span>`;
        return;
    }

    if (!message.trim()) {
        document.getElementById('generalNoteResult').innerHTML =
            `<span style="color:red;">Message cannot be empty.</span>`;
        return;
    }

    fetch('/api/add_general_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_id: trackingId, message: message })
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(({ status, body }) => {
        document.getElementById('generalNoteResult').innerHTML =
            `<span style="${status === 200 ? 'color:green' : 'color:red'};">${body.message}</span>`;
    });
}

// === Processing Note ===
function submitProcessingNote() {
    const trackingId = selectedTrackingId;
    const subphase = document.getElementById('processingSubphase').value;
    const message = document.getElementById('processingMessage').value;
    const completed = document.getElementById('processingCompleted').checked;

    if (!trackingId) {
        document.getElementById('processingNoteResult').innerHTML =
            `<span style="color:red;">Please select an application first.</span>`;
        return;
    }

    if (!message.trim()) {
        document.getElementById('processingNoteResult').innerHTML =
            `<span style="color:red;">Message cannot be empty.</span>`;
        return;
    }

    fetch('/api/add_processing_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_id: trackingId, subphase, message, completed })
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(({ status, body }) => {
        document.getElementById('processingNoteResult').innerHTML =
            `<span style="${status === 200 ? 'color:green' : 'color:red'};">${body.message}</span>`;
    });
}

// === Acceptance Note ===
function submitAcceptanceNote() {
    const trackingId = selectedTrackingId;
    const message = document.getElementById('acceptanceMessage').value;

    if (!trackingId) {
        document.getElementById('acceptanceNoteResult').innerHTML =
            `<span style="color:red;">Please select an application first.</span>`;
        return;
    }

    if (!message.trim()) {
        document.getElementById('acceptanceNoteResult').innerHTML =
            `<span style="color:red;">Message cannot be empty.</span>`;
        return;
    }

    fetch('/api/add_acceptance_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_id: trackingId, message })
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(({ status, body }) => {
        document.getElementById('acceptanceNoteResult').innerHTML =
            `<span style="${status === 200 ? 'color:green' : 'color:red'};">${body.message}</span>`;
        if (status === 200) document.getElementById('acceptanceMessage').value = '';
    });
}

// === Delete Application ===
function deleteApplication() {
    const trackingId = selectedTrackingId;

    if (!trackingId) {
        document.getElementById('deleteResult').innerHTML =
            `<span style="color:red;">Please select an application to delete.</span>`;
        return;
    }

    fetch(`/api/delete_application/${trackingId}`, {
        method: 'DELETE'
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(({ status, body }) => {
        document.getElementById('deleteResult').innerHTML =
            `<span style="${status === 200 ? 'color:green' : 'color:red'};">${body.message}</span>`;
        if (status === 200) {
            selectedTrackingId = null;
            loadApplications();
        }
    });
}
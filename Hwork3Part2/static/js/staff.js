document.addEventListener('DOMContentLoaded', toggleStatusSections);
document.addEventListener('DOMContentLoaded', () => {
    toggleStatusSections();      // Hide status-specific sections
    loadApplications();          // Automatically load loan applications
});

let selectedTrackingId = null;

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
    document.getElementById('actionSections').style.display = 'block'; // show actions
}

function updateStatus() {
    const trackingId = selectedTrackingId;
    const newStatus = document.getElementById('newStatus').value;
    const rejectionReason = document.getElementById('rejectionReason')?.value;
    const processingNote = document.getElementById('processingMessage')?.value;
    const acceptanceNote = document.getElementById('acceptanceMessage')?.value;

    if (!trackingId) {
        showMessage('updateStatusResult', 'Please select an application first.', 'red');
        return;
    }

    const updateData = { tracking_id: trackingId, new_status: newStatus };

    if (newStatus === 'rejected') {
        if (!rejectionReason?.trim()) {
            showMessage('updateStatusResult', '❌ Rejection reason is required.', 'red');
            return;
        }
        updateData.rejection_reason = rejectionReason; // pass rejection note
    }

    if (newStatus === 'accepted') {
        if (!acceptanceNote?.trim()) {
            showMessage('updateStatusResult', '❌ Acceptance note is required.', 'red');
            return;
        }
        updateData.acceptance_note = acceptanceNote; // NEW: pass acceptance note
    }

    if (newStatus === 'processing') {
        if (!processingNote?.trim()) {
            showMessage('updateStatusResult', '❌ Processing note is required.', 'red');
            return;
        }
        // processing note is still submitted separately
        submitProcessingNote(true);
    }

    fetch('/api/update_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(({ status, body }) => {
        showMessage('updateStatusResult', body.message, status === 200 ? 'green' : 'red');
        if (status === 200 && newStatus === 'accepted') {
            document.getElementById('acceptanceMessage').value = ''; // clear acceptance note after successful submit
        }
        if (status === 200 && newStatus === 'rejected') {
            document.getElementById('rejectionReason').value = ''; // clear rejection reason after successful submit
        }
    });
}


function toggleStatusSections() {
    const status = document.getElementById('newStatus').value;
    document.getElementById('addProcessingNoteSection').style.display = (status === 'processing') ? 'block' : 'none';
    document.getElementById('addAcceptanceNoteSection').style.display = (status === 'accepted') ? 'block' : 'none';
    document.getElementById('addRejectionNoteSection').style.display = (status === 'rejected') ? 'block' : 'none';
    clearStatusMessages();
}

function showMessage(id, message, color) {
    const el = document.getElementById(id);
    if (el) {
        el.innerHTML = `<span style="color:${color};">${message}</span>`;
        setTimeout(() => el.innerHTML = '', 5000);
    }
}

function clearStatusMessages() {
    ['updateStatusResult', 'generalNoteResult', 'processingNoteResult', 'acceptanceNoteResult'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
}

function submitGeneralNote() {
    const trackingId = selectedTrackingId;
    const message = document.getElementById('generalMessage').value;

    if (!trackingId) {
        showMessage('generalNoteResult', 'Please select an application first.', 'red');
        return;
    }
    if (!message.trim()) {
        showMessage('generalNoteResult', 'Message cannot be empty.', 'red');
        return;
    }

    fetch('/api/add_general_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_id: trackingId, message })
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(({ status, body }) => {
        showMessage('generalNoteResult', body.message, status === 200 ? 'green' : 'red');
        if (status === 200) {
            document.getElementById('generalMessage').value = '';
        }
    });
}

function submitProcessingNote(fromStatusUpdate = false) {
    const trackingId = selectedTrackingId;
    const subphase = document.getElementById('processingSubphase').value;
    const message = document.getElementById('processingMessage').value;
    const completed = document.getElementById('processingCompleted').checked;

    if (!trackingId || !message.trim()) {
        if (!fromStatusUpdate) {
            showMessage('processingNoteResult', 'Message cannot be empty or no application selected.', 'red');
        }
        return;
    }

    fetch('/api/add_processing_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_id: trackingId, subphase, message, completed })
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(({ status, body }) => {
        if (!fromStatusUpdate) {
            showMessage('processingNoteResult', body.message, status === 200 ? 'green' : 'red');
        }
        if (status === 200) {
            document.getElementById('processingMessage').value = '';
            document.getElementById('processingCompleted').checked = false;
        }
    });
}

function submitAcceptanceNote(fromStatusUpdate = false) {
    const trackingId = selectedTrackingId;
    const message = document.getElementById('acceptanceMessage').value;

    if (!trackingId || !message.trim()) {
        if (!fromStatusUpdate) {
            showMessage('acceptanceNoteResult', 'Message cannot be empty or no application selected.', 'red');
        }
        return;
    }

    fetch('/api/add_acceptance_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_id: trackingId, message })
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(({ status, body }) => {
        if (!fromStatusUpdate) {
            showMessage('acceptanceNoteResult', body.message, status === 200 ? 'green' : 'red');
        }
        if (status === 200) {
            document.getElementById('acceptanceMessage').value = '';
        }
    });
}

function deleteApplication() {
    const trackingId = selectedTrackingId;
    if (!trackingId) {
        showMessage('deleteResult', 'Please select an application to delete.', 'red');
        return;
    }

    // Confirmation popup
    const confirmDelete = confirm(`Are you sure you want to delete application ${trackingId}?`);
    if (!confirmDelete) {
        return; // If cancelled, do nothing
    }

    fetch(`/api/delete_application/${trackingId}`, {
        method: 'DELETE'
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(({ status, body }) => {
        showMessage('deleteResult', body.message, status === 200 ? 'green' : 'red');
        if (status === 200) {
            selectedTrackingId = null;
            loadApplications();
            hideActionSections();
        }
    });
}

function hideActionSections() {
    document.getElementById('actionSections').style.display = 'none';
}
// staff.js

// Update an application's status
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
                `<span style="color:red;">❌ Rejection reason is required for rejection.`;
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

// Show/hide rejection reason input
function toggleRejectionReason() {
    const status = document.getElementById('newStatus').value;
    const container = document.getElementById('rejectionReasonContainer');
    container.style.display = (status === 'rejected') ? 'block' : 'none';
}

// Submit a new general note
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
        body: JSON.stringify({ tracking_id: trackingId, message: message })
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(({ status, body }) => {
        const resultDiv = document.getElementById('generalNoteResult');
        if (status === 200) {
            resultDiv.innerHTML = `<span style="color:green;">${body.message}</span>`;
        } else {
            resultDiv.innerHTML = `<span style="color:red;">${body.message}</span>`;
        }
    })
    .catch(error => {
        console.error('Error submitting general note:', error);
    });
}

// Submit a new processing note
function submitProcessingNote() {
    const trackingId = document.getElementById('processingTrackingId').value;
    const subphase = document.getElementById('processingSubphase').value;
    const message = document.getElementById('processingMessage').value;
    const completed = document.getElementById('processingCompleted').checked;

    if (!message.trim()) {
        document.getElementById('processingNoteResult').innerHTML =
            `<span style="color:red;">Message cannot be empty.</span>`;
        return;
    }

    fetch('/api/add_processing_note', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tracking_id: trackingId,
            subphase: subphase,
            message: message,
            completed: completed
        })
    })
    .then(response => response.json().then(data => ({ status: response.status, body: data })))
    .then(({ status, body }) => {
        const resultDiv = document.getElementById('processingNoteResult');
        if (status === 200) {
            resultDiv.innerHTML = `<span style="color:green;">${body.message}</span>`;
        } else {
            resultDiv.innerHTML = `<span style="color:red;">${body.message}</span>`;
        }
    })
    .catch(error => {
        console.error('Error submitting processing note:', error);
    });
}

// Submit a new acceptance note
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
        body: JSON.stringify({ tracking_id: trackingId, message: message })
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
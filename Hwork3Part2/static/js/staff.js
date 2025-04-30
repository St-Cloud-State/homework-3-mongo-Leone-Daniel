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
                document.getElementById('selectedAppDisplay').textContent = 'None';
                document.querySelector('button[onclick="viewApplicationHistory()"]').style.display = 'none';
                document.getElementById('applicationHistory').innerHTML = '';
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
            `;

            // Update the displayed selected application
            document.getElementById('selectedAppDisplay').textContent = selectedTrackingId || 'None';

            // Show or hide the View History button
            const historyBtn = document.querySelector('button[onclick="viewApplicationHistory()"]');
            if (historyBtn) {
                historyBtn.style.display = selectedTrackingId ? 'inline-block' : 'none';
            }

            // Optionally clear history if no app is selected
            if (!selectedTrackingId) {
                document.getElementById('applicationHistory').innerHTML = '';
            }
        })
        .catch(error => {
            console.error('Error loading applications:', error);
        });
}

function selectApplication(trackingId) {
    selectedTrackingId = trackingId;
    document.getElementById('actionSections').style.display = 'block';
    loadApplications();
}

function viewApplicationHistory() {
    if (!selectedTrackingId) return;

    fetch(`/api/application_history/${selectedTrackingId}`)
        .then(response => response.json())
        .then(data => {
            const historyDiv = document.getElementById('applicationHistory');
            if (!Array.isArray(data.history) || data.history.length === 0) {
                historyDiv.innerHTML = "<p><em>No history available.</em></p>";
                return;
            }

            const lines = data.history.map(entry => `<li>${entry.replace(/\n/g, '<br>')}</li>`).join('');
            historyDiv.innerHTML = `
                <h3>Application History for <code>${selectedTrackingId}</code>:</h3>
                <ul>${lines}</ul>
            `;
        })
        .catch(error => {
            console.error("Failed to fetch history:", error);
        });
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
            showMessage('updateStatusResult', 'Rejection reason is required.', 'red');
            return;
        }
        updateData.rejection_reason = rejectionReason;
    }

    if (newStatus === 'accepted') {
        const loanAmount = document.getElementById('loanAmount').value;
        const interestRate = document.getElementById('interestRate').value;
        const loanType = document.getElementById('loanType').value;
        const description = document.getElementById('acceptanceMessage').value;
    
        if (!loanAmount || !interestRate || !description.trim()) {
            showMessage('updateStatusResult', 'All acceptance fields must be completed.', 'red');
            return;
        }
    
        updateData.acceptance_note = {
            loan_amount: parseFloat(loanAmount),
            interest_rate: parseFloat(interestRate),
            loan_type: loanType,
            description: description.trim()
        };
    }

    if (newStatus === 'processing') {
        if (!processingNote?.trim()) {
            showMessage('updateStatusResult', 'Processing note is required.', 'red');
            return;
        }
        updateData.processing_note = processingNote;
        updateData.subphase = document.getElementById('processingSubphase').value;
        updateData.task = document.getElementById('processingTask').value;
        updateData.completed = document.getElementById('processingCompleted').checked;
    }    

    fetch('/api/update_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(({ status, body }) => {
        showMessage('updateStatusResult', body.message, status === 200 ? 'green' : 'red');

        if (status === 200) {
            if (newStatus === 'accepted') {
                document.getElementById('loanAmount').value = '';
                document.getElementById('interestRate').value = '';
                document.getElementById('loanType').value = 'Auto';
                document.getElementById('acceptanceMessage').value = '';
            }
            if (newStatus === 'rejected') {
                document.getElementById('rejectionReason').value = '';
            }
            if (newStatus === 'processing') {
                document.getElementById('processingMessage').value = '';
                document.getElementById('processingCompleted').checked = false;
            }
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
    const task = document.getElementById('processingTask').value;
    const message = document.getElementById('processingMessage').value;
    const completed = document.getElementById('processingCompleted').checked;
    const bottleneck = document.getElementById('processingBottleneck').checked;

    if (!trackingId || !subphase || !task || !message.trim()) {
        if (!fromStatusUpdate) {
            showMessage('processingNoteResult', 'All fields are required.', 'red');
        } else {
            console.warn("Incomplete processing note skipped during status update.");
        }
        return;
    }

    fetch('/api/add_processing_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tracking_id: trackingId,
            subphase,
            task,
            message,
            completed,
            bottleneck
        })
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(({ status, body }) => {
        if (!fromStatusUpdate) {
            showMessage('processingNoteResult', body.message, status === 200 ? 'green' : 'red');
        }

        if (status === 200) {
            document.getElementById('processingTask').value = '';
            document.getElementById('processingMessage').value = '';
            document.getElementById('processingCompleted').checked = false;
            document.getElementById('processingBottleneck').checked = false;
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

from pymongo import MongoClient
from datetime import datetime

client = MongoClient('mongodb://localhost:27017/')
db = client['appDB']
applications = db['applications']

def submit_application_to_db(data):
    next_id = applications.count_documents({}) + 1
    tracking_id = f"app_{next_id:05}"
    timestamp = datetime.utcnow().isoformat()

    application = {
        "tracking_id": tracking_id,
        "f_name": data.get('f_name'),
        "l_name": data.get('l_name'),
        "address": data.get('address'),
        "city": data.get('city'),
        "state": data.get('state'),
        "zipcode": data.get('zipcode'),
        "status": "received",
        "general_notes": [f"Application initiated at {timestamp}"],
        "processing": {
            "personal_details_check": [],
            "credit_check": [],
            "certification_check": []
        },
        "acceptance_notes": [],
        "rejection_reason": None
    }

    applications.insert_one(application)
    return tracking_id

def check_status_in_db(tracking_id):
    app = applications.find_one({"tracking_id": tracking_id})
    if not app:
        return {"status": "not found", "notes": []}

    timestamp = datetime.utcnow().isoformat()
    note = f"Status checked at {timestamp}"

    applications.update_one(
        {"tracking_id": tracking_id},
        {"$push": {"general_notes": note}}
    )

    notes = []
    notes.extend(app.get('general_notes', []))

    for subphase in app.get('processing', {}).values():
        for task in subphase:
            if 'message' in task:
                notes.append(task['message'])

    notes.extend(app.get('acceptance_notes', []))

    if app.get('rejection_reason'):
        notes.append(f"Rejection reason: {app['rejection_reason']}")

    return {
        "status": app['status'],
        "notes": notes
    }

def update_status_in_db(tracking_id, new_status, rejection_reason=None):
    valid_statuses = {"received", "processing", "accepted", "rejected"}
    if new_status not in valid_statuses:
        return {"success": False, "message": f"Invalid status '{new_status}'"}, 400

    timestamp = datetime.utcnow().isoformat()
    note = f"Application updated to {new_status} at {timestamp}"

    update_fields = {
        "status": new_status
    }

    # Special case: rejected must have a reason
    if new_status == "rejected":
        if not rejection_reason:
            return {"success": False, "message": "Rejection reason must be provided when rejecting an application."}, 400
        update_fields["rejection_reason"] = rejection_reason

    # Update status (and rejection reason if needed)
    result = applications.update_one(
        {"tracking_id": tracking_id},
        {
            "$set": update_fields,
            "$push": {"general_notes": note}
        }
    )

    if result.matched_count == 0:
        return {"success": False, "message": "Application not found"}, 404

    return {"success": True, "message": f"Status updated to {new_status}"}, 200

def add_acceptance_note(tracking_id, message):
    if not message.strip():
        return {"success": False, "message": "Message cannot be empty."}, 400

    app = applications.find_one({"tracking_id": tracking_id})
    if not app:
        return {"success": False, "message": "Application not found."}, 404

    if app["status"] != "accepted":
        return {"success": False, "message": "Cannot add acceptance notes to a non-accepted application."}, 400

    timestamped_message = f"{message} ({datetime.utcnow().isoformat()})"

    result = applications.update_one(
        {"tracking_id": tracking_id},
        {"$push": {"acceptance_notes": timestamped_message}}
    )

    return {"success": True, "message": "Acceptance note added."}, 200

def add_general_note(tracking_id, message):
    if not message.strip():
        return {"success": False, "message": "Message cannot be empty."}, 400

    app = applications.find_one({"tracking_id": tracking_id})
    if not app:
        return {"success": False, "message": "Application not found."}, 404

    timestamped_message = f"{message} ({datetime.utcnow().isoformat()})"

    result = applications.update_one(
        {"tracking_id": tracking_id},
        {"$push": {"general_notes": timestamped_message}}
    )

    return {"success": True, "message": "General note added."}, 200

from pymongo import MongoClient
from datetime import datetime
import re

client = MongoClient('mongodb://localhost:27017/')
db = client['appDB']
applications = db['applications']

def submit_application_to_db(data):
    tracking_id = get_next_tracking_id()
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
        "status_updated_at": timestamp,
        "general_notes": [f"SYSTEM — Application initiated at {timestamp}"],
        "acceptance_notes": [],
        "rejection_reason": None,
        "processing_notes": [],
        "processing": {},
        "app_logs": [f"SYSTEM — Application created at {timestamp}"]
    }

    applications.insert_one(application)
    return tracking_id

def check_status_in_db(tracking_id):
    app = applications.find_one({"tracking_id": tracking_id})
    if not app:
        return {"status": "not found", "notes": []}

    status = app.get("status", "unknown")
    updated_at = app.get("status_updated_at", None)
    status_display = f"{status} at {updated_at}" if updated_at else status

    # Log status check internally (not shown to user)
    timestamp = datetime.utcnow().isoformat()
    applications.update_one(
        {"tracking_id": tracking_id},
        {"$push": {"app_logs": f"SYSTEM — Status checked at {timestamp}"}}
    )

    notes = []

    # Process processing_notes: keep most recent per subphase
    if status == "processing":
        latest_per_subphase = {}
        for note in app.get("processing_notes", []):
            match = re.search(r'PROCESSING — (.*?):', note)
            if match:
                subphase = match.group(1).strip()
                latest_per_subphase[subphase] = note
        notes.extend(latest_per_subphase.values())

    # Show only most recent acceptance note
    elif status == "accepted":
        acceptance_notes = app.get("acceptance_notes", [])
        if acceptance_notes:
            notes.append(acceptance_notes[-1])
        else:
            notes.append("Your application has been accepted. Terms will be sent shortly.")

    # Show only most recent rejection note
    elif status == "rejected":
        # Show most recent rejection note (formatted + timestamped)
        rejection_notes = [
            note for note in app.get("general_notes", [])
            if note.startswith("REJECTION")
        ]
        if rejection_notes:
            notes.append(rejection_notes[-1])
        else:
            # fallback if note not saved properly
            rejection_reason = app.get("rejection_reason", "No reason provided.")
            notes.append(f"Rejection: {rejection_reason}")
    return {
        "status": status_display,
        "notes": notes
    }

def update_status_in_db(tracking_id, new_status, rejection_reason=None, processing_note=None, subphase=None, completed=False, acceptance_note=None):
    from datetime import datetime

    valid_statuses = {"received", "processing", "accepted", "rejected"}
    if new_status not in valid_statuses:
        return {"success": False, "message": f"Invalid status '{new_status}'"}, 400

    timestamp = datetime.utcnow().isoformat()

    # Validation checks
    if new_status == "rejected" and (not rejection_reason or not rejection_reason.strip()):
        return {"success": False, "message": "Rejection reason must be provided."}, 400

    if new_status == "processing":
        if not processing_note or not processing_note.strip():
            return {"success": False, "message": "Processing note is required."}, 400
        if not subphase:
            return {"success": False, "message": "Processing subphase is required."}, 400

    if new_status == "accepted" and (not acceptance_note or not acceptance_note.strip()):
        return {"success": False, "message": "Acceptance note is required."}, 400

    status_label = new_status.upper()
    user_facing_note = f"{status_label}: Status updated at {timestamp}"
    internal_log = f"SYSTEM — Status changed to {new_status} at {timestamp}"

    # Prepare update operations
    update_fields = {
        "status": new_status,
        "status_updated_at": timestamp
    }

    update_ops = {
        "$set": update_fields,
        "$push": {
            "general_notes": {
                "$each": [user_facing_note]
            },
            "app_logs": internal_log
        }
    }

    # Handling rejected status
    if new_status == "rejected":
        update_fields["rejection_reason"] = rejection_reason
        rejection_note = f"REJECTION: {rejection_reason.strip()} ({timestamp})"
        update_ops["$push"]["general_notes"]["$each"].append(rejection_note)

    # Handling accepted status
    if new_status == "accepted":
        acceptance_entry = f"ACCEPTANCE: {acceptance_note.strip()} ({timestamp})"
        update_ops["$push"]["acceptance_notes"] = acceptance_entry

    # Handling processing status
    if new_status == "processing":
        task_status = "✔ COMPLETED" if completed else "IN-PROGRESS"
        processing_entry = f"PROCESSING — {subphase.replace('_', ' ').title()}: {processing_note.strip()} [{task_status}] ({timestamp})"
        update_ops["$push"]["processing_notes"] = processing_entry

    result = applications.update_one({"tracking_id": tracking_id}, update_ops)

    if result.matched_count == 0:
        return {"success": False, "message": "Application not found."}, 404

    return {"success": True, "message": f"Status updated to {new_status}"}, 200

def add_acceptance_note(tracking_id, message):
    timestamp = datetime.utcnow().isoformat()
    note = f"ACCEPTANCE: {message.strip()} ({timestamp})"
    result = applications.update_one(
        {"tracking_id": tracking_id},
        {"$push": {"acceptance_notes": note}}
    )
    return {"success": True, "message": "Acceptance note added."}, 200

def add_general_note(tracking_id, message):
    timestamp = datetime.utcnow().isoformat()
    note = f"NOTE: {message.strip()} ({timestamp})"
    result = applications.update_one(
        {"tracking_id": tracking_id},
        {"$push": {"general_notes": note}}
    )
    return {"success": True, "message": "General note added."}, 200

def add_processing_note(tracking_id, subphase, message, completed):
    timestamp = datetime.utcnow().isoformat()
    status = "✔ COMPLETED" if completed else "IN-PROGRESS"
    note = f"PROCESSING — {subphase.replace('_', ' ').title()}: {message.strip()} [{status}] ({timestamp})"
    result = applications.update_one(
        {"tracking_id": tracking_id},
        {"$push": {"processing_notes": note}}
    )
    return {"success": True, "message": "Processing note added."}, 200

def get_all_applications(limit=100):
    cursor = applications.find({}, {
        "_id": 0,
        "tracking_id": 1,
        "f_name": 1,
        "l_name": 1,
        "status": 1
    }).limit(limit)

    return list(cursor)

def delete_application_by_id(tracking_id):
    result = applications.delete_one({"tracking_id": tracking_id})

    if result.deleted_count == 0:
        return {"success": False, "message": "Application not found"}, 404
    return {"success": True, "message": f"Application {tracking_id} deleted"}, 200

def get_next_tracking_id():
    counter = db.counters.find_one_and_update(
        {"_id": "application_id"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return f"app_{counter['seq']:05}"
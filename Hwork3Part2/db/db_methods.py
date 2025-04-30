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

    timestamp = datetime.utcnow().isoformat()
    applications.update_one(
        {"tracking_id": tracking_id},
        {"$push": {"app_logs": f"SYSTEM — Status checked at {timestamp}"}}
    )

    notes = []

    if status == "processing":
        processing_list = []
        for note in app.get("processing_notes", []):
            subphase = note.get("subphase", "General")
            task = note.get("task", "N/A")
            msg = note.get("message", "")
            completed = note.get("completed", False)
            bottleneck = note.get("bottleneck", False)
            ts = note.get("timestamp")

            # Allow notes even if subphase is missing; label it as General
            note_display = (
                f"PROCESSING — {subphase.replace('_', ' ').title()}\n"
                f"• Task: {task}\n"
                f"• Status: {'✔ COMPLETED' if completed else ('Bottleneck' if bottleneck else 'In Progress')}\n"
                f"• Message: {msg}\n"
                f"• Timestamp: {ts}"
            )
            processing_list.append(note_display)

        if processing_list:
            notes.extend(processing_list)
        else:
            notes.append("Processing has begun. Updates will be posted here as tasks are completed.")

    elif status == "accepted":
        acceptance_notes = app.get("acceptance_notes", [])
        if acceptance_notes:
            notes.append(acceptance_notes[-1])
        else:
            notes.append("Your application has been accepted. Terms will be sent shortly.")

    elif status == "rejected":
        rejection_notes = [
            note for note in app.get("general_notes", [])
            if note.startswith("REJECTION")
        ]
        if rejection_notes:
            notes.append(rejection_notes[-1])
        else:
            rejection_reason = app.get("rejection_reason", "No reason provided.")
            notes.append(f"Rejection: {rejection_reason}")



    return {
        "status": status_display,
        "notes": notes
    }

def update_status_in_db(tracking_id, new_status, rejection_reason=None, processing_note=None, subphase=None, completed=False, acceptance_note=None, task=None):
    valid_statuses = {"received", "processing", "accepted", "rejected"}
    if new_status not in valid_statuses:
        return {"success": False, "message": f"Invalid status '{new_status}'"}, 400

    timestamp = datetime.utcnow().isoformat()

    # Validation
    if new_status == "rejected" and (not rejection_reason or not rejection_reason.strip()):
        return {"success": False, "message": "Rejection reason must be provided."}, 400

    if new_status == "processing":
        if not processing_note or not processing_note.strip():
            return {"success": False, "message": "Processing note is required."}, 400
        if not subphase:
            return {"success": False, "message": "Processing subphase is required."}, 400

    if new_status == "accepted":
        if not isinstance(acceptance_note, dict) or not acceptance_note.get("description"):
            return {"success": False, "message": "Complete acceptance details are required."}, 400

    status_label = new_status.upper()
    user_facing_note = f"{status_label}: Status updated at {timestamp}"
    internal_log = f"SYSTEM — Status changed to {new_status} at {timestamp}"

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

    if new_status == "rejected":
        update_fields["rejection_reason"] = rejection_reason
        rejection_note = f"REJECTION: {rejection_reason.strip()} ({timestamp})"
        update_ops["$push"]["general_notes"]["$each"].append(rejection_note)

    if new_status == "accepted":
        loan_amount = acceptance_note.get("loan_amount")
        interest_rate = acceptance_note.get("interest_rate")
        loan_type = acceptance_note.get("loan_type")
        description = acceptance_note.get("description")

        formatted_note = (
            f"ACCEPTANCE:\n"
            f"• Loan Amount: ${loan_amount:,.2f}\n"
            f"• Interest Rate: {interest_rate:.2f}%\n"
            f"• Loan Type: {loan_type}\n"
            f"• Description: {description.strip()} ({timestamp})"
        )
        update_ops["$push"]["acceptance_notes"] = formatted_note

    if new_status == "processing":
        processing_entry = {
            "subphase": subphase,
            "task": task or "System Updated",
            "message": processing_note.strip(),
            "completed": completed,
            "bottleneck": False,
            "timestamp": timestamp
        }
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

def add_processing_note(tracking_id, subphase, task, message, completed, bottleneck):
    timestamp = datetime.utcnow().isoformat()
    entry = {
        "subphase": subphase,
        "task": task,
        "message": message.strip(),
        "completed": completed,
        "bottleneck": bottleneck,
        "timestamp": timestamp
    }
    result = applications.update_one(
        {"tracking_id": tracking_id},
        {"$push": {"processing_notes": entry}}
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
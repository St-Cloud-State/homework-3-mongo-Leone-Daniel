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
        "status_updated_at": timestamp,              # ✅ New
        "general_notes": [f"Application initiated at {timestamp}"],
        "acceptance_notes": [],
        "rejection_reason": None,
        "processing": {
            "personal_details_check": [],
            "credit_check": [],
            "certification_check": []
        },
        "app_logs": [f"Application created at {timestamp}"]  # ✅ New
    }

    applications.insert_one(application)
    return tracking_id

def check_status_in_db(tracking_id):
    app = applications.find_one({"tracking_id": tracking_id})
    if not app:
        return {"status": "not found", "notes": []}

    # ✅ Return status + timestamp in a clean format
    status = app.get("status", "unknown")
    updated_at = app.get("status_updated_at", None)
    status_display = f"{status} at {updated_at}" if updated_at else status

    # ✅ Log this check, but DO NOT show it to user
    timestamp = datetime.utcnow().isoformat()
    log_entry = f"Status checked at {timestamp}"
    applications.update_one(
        {"tracking_id": tracking_id},
        {"$push": {"app_logs": log_entry}}  # ✅ Only to logs
    )

    notes = []

    # === Conditional notes by status ===
    if status == "processing":
        for phase, tasks in app.get('processing', {}).items():
            for task in tasks:
                state = "✅ Completed" if task.get("completed") else "🔧 In Progress"
                notes.append(f"{phase.replace('_', ' ').title()}: {task.get('message')} — {state}")
    
    elif status == "accepted":
        if app.get("acceptance_notes"):
            notes.extend(app["acceptance_notes"])
        else:
            notes.append("✅ Your application has been accepted. Terms will be sent shortly.")
    
    elif status == "rejected":
        rejection_reason = app.get("rejection_reason", "No reason provided.")
        notes.append(f"❌ Rejection Reason: {rejection_reason}")

    return {
        "status": status_display,
        "notes": notes
    }

def update_status_in_db(tracking_id, new_status, rejection_reason=None):
    valid_statuses = {"received", "processing", "accepted", "rejected"}
    if new_status not in valid_statuses:
        return {"success": False, "message": f"Invalid status '{new_status}'"}, 400

    timestamp = datetime.utcnow().isoformat()
    note = f"Application updated to {new_status} at {timestamp}"

    update_fields = {
        "status": new_status,
        "status_updated_at": timestamp  # ✅ Track last status change
    }

    if new_status == "rejected":
        if not rejection_reason:
            return {"success": False, "message": "Rejection reason must be provided when rejecting an application."}, 400
        update_fields["rejection_reason"] = rejection_reason

    result = applications.update_one(
        {"tracking_id": tracking_id},
        {
            "$set": update_fields,
            "$push": {
                "general_notes": note,
                "app_logs": f"Status changed to {new_status} at {timestamp}"  # ✅ Log as internal
            }
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

    applications.update_one(
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

    applications.update_one(
        {"tracking_id": tracking_id},
        {"$push": {"general_notes": timestamped_message}}
    )

    return {"success": True, "message": "General note added."}, 200

def add_processing_note(tracking_id, subphase, message, completed):
    valid_subphases = {"personal_details_check", "credit_check", "certification_check"}

    if subphase not in valid_subphases:
        return {"success": False, "message": f"Invalid subphase '{subphase}'."}, 400

    if not message.strip():
        return {"success": False, "message": "Message cannot be empty."}, 400

    app = applications.find_one({"tracking_id": tracking_id})
    if not app:
        return {"success": False, "message": "Application not found."}, 404

    task_entry = {
        "task": message,
        "message": message,
        "completed": completed,
        "timestamp": datetime.utcnow().isoformat()
    }

    applications.update_one(
        {"tracking_id": tracking_id},
        {"$push": {f"processing.{subphase}": task_entry}}
    )

    return {"success": True, "message": f"Note added to {subphase}."}, 200

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

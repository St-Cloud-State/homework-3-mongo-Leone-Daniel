from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/')
db = client['appDB']
applications = db['applications']

def submit_application_to_db(data):
    next_id = applications.count_documents({}) + 1
    tracking_id = f"app_{next_id:05}"
    
    application = {
        "tracking_id": tracking_id,
        "f_name": data.get('f_name'),
        "l_name": data.get('l_name'),
        "address": data.get('address'),
        "city": data.get('city'),
        "state": data.get('state'),
        "zipcode": data.get('zipcode'),
        "status": "received",
        "general_notes": [],
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

def update_status_in_db(tracking_id, new_status):
    valid_statuses = {"received", "processing", "accepted", "rejected"}
    if new_status not in valid_statuses:
        return {"success": False, "message": f"Invalid status '{new_status}'"}, 400

    result = applications.update_one(
        {"tracking_id": tracking_id},
        {"$set": {"status": new_status}}
    )

    if result.matched_count == 0:
        return {"success": False, "message": "Application not found"}, 404

    return {"success": True, "message": f"Status updated to {new_status}"}, 200

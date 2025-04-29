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
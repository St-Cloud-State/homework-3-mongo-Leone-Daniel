from flask import Blueprint, request, jsonify
from db.db_methods import *

staff_routes = Blueprint('staff_routes', __name__)

@staff_routes.route('/update_status', methods=['POST'])
def update_status():
    data = request.get_json()
    tracking_id = data.get("tracking_id")
    new_status = data.get("new_status")
    acceptance_note = data.get("acceptance_note")
    rejection_reason = data.get("rejection_reason")
    processing_note = data.get("processing_note")
    subphase = data.get("subphase")
    completed = data.get("completed", False)

    if not tracking_id or not new_status:
        return jsonify({"success": False, "message": "Missing tracking_id or new_status"}), 400

    result, code = update_status_in_db(
        tracking_id,
        new_status,
        rejection_reason=rejection_reason,
        processing_note=processing_note,
        subphase=subphase,
        completed=completed,
        acceptance_note=acceptance_note
    )
    return jsonify(result), code

@staff_routes.route('/add_general_note', methods=['POST'])
def add_general_note_route():
    data = request.get_json()
    tracking_id = data.get("tracking_id")
    message = data.get("message")

    if not tracking_id or not message:
        return jsonify({"success": False, "message": "Tracking ID and message required."}), 400

    result, code = add_general_note(tracking_id, message)
    return jsonify(result), code

@staff_routes.route('/add_processing_note', methods=['POST'])
def add_processing_note_route():
    data = request.get_json()
    tracking_id = data.get("tracking_id")
    subphase = data.get("subphase")
    message = data.get("message")
    completed = data.get("completed", False)

    if not tracking_id or not subphase or not message:
        return jsonify({"success": False, "message": "Tracking ID, subphase, and message required."}), 400

    result, code = add_processing_note(tracking_id, subphase, message, completed)
    return jsonify(result), code

@staff_routes.route('/add_acceptance_note', methods=['POST'])
def add_acceptance_note_route():
    data = request.get_json()
    tracking_id = data.get("tracking_id")
    message = data.get("message")

    if not tracking_id or not message:
        return jsonify({"success": False, "message": "Tracking ID and message required."}), 400

    result, code = add_acceptance_note(tracking_id, message)
    return jsonify(result), code

@staff_routes.route('/applications', methods=['GET'])
def get_applications():
    applications = get_all_applications()
    return jsonify(applications), 200

@staff_routes.route('/delete_application/<tracking_id>', methods=['DELETE'])
def delete_application(tracking_id):
    result = delete_application_by_id(tracking_id)
    return jsonify(result)

@staff_routes.route('/application_history/<tracking_id>', methods=['GET'])
def get_application_history(tracking_id):
    app = applications.find_one({"tracking_id": tracking_id})
    if not app:
        return jsonify({"success": False, "message": "Application not found."}), 404

    history = []

    # General notes
    for note in app.get('general_notes', []):
        history.append(note)

    # Acceptance notes
    for note in app.get('acceptance_notes', []):
        history.append(note)

    # Processing notes (currently missing!)
    for note in app.get('processing_notes', []):
        history.append(note)

    # App logs (internal status transitions)
    for log in app.get('app_logs', []):
        history.append(log)

    # Sort history by embedded timestamps in string
    def extract_timestamp(text):
        import re
        match = re.search(r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})', text)
        return match.group(1) if match else ''

    history_sorted = sorted(history, key=extract_timestamp)

    return jsonify({"success": True, "history": history_sorted}), 200
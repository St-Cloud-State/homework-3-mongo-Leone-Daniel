from flask import Blueprint, request, jsonify
from db.db_methods import update_status_in_db, add_general_note, add_processing_note, add_acceptance_note

staff_routes = Blueprint('staff_routes', __name__)

@staff_routes.route('/update_status', methods=['POST'])
def update_status():
    data = request.get_json()
    tracking_id = data.get("tracking_id")
    new_status = data.get("new_status")
    rejection_reason = data.get("rejection_reason")

    if not tracking_id or not new_status:
        return jsonify({"success": False, "message": "Missing tracking_id or new_status"}), 400

    result, code = update_status_in_db(tracking_id, new_status, rejection_reason)
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

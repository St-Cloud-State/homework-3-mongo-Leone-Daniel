from flask import Flask, request, jsonify, render_template
from db_methods import *

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/submit_application', methods=['POST'])
def submit_application():
    data = request.get_json()
    tracking_id = submit_application_to_db(data)
    return jsonify({"tracking_id": tracking_id})

@app.route('/api/check_status/<tracking_id>', methods=['GET'])
def check_status(tracking_id):
    result = check_status_in_db(tracking_id)
    return jsonify(result)

@app.route('/api/update_status', methods=['POST'])
def update_status():
    data = request.get_json()
    tracking_id = data.get("tracking_id")
    new_status = data.get("new_status")
    rejection_reason = data.get("rejection_reason")  # Optional

    if not tracking_id or not new_status:
        return jsonify({"success": False, "message": "Missing tracking_id or new_status"}), 400

    result, status_code = update_status_in_db(tracking_id, new_status, rejection_reason)
    return jsonify(result), status_code

@app.route('/api/add_acceptance_note', methods=['POST'])
def add_acceptance_note_route():
    data = request.get_json()
    tracking_id = data.get("tracking_id")
    message = data.get("message")

    if not tracking_id or not message:
        return jsonify({"success": False, "message": "Tracking ID and message required."}), 400

    result, code = add_acceptance_note(tracking_id, message)
    return jsonify(result), code

@app.route('/api/add_general_note', methods=['POST'])
def add_general_note_route():
    data = request.get_json()
    tracking_id = data.get("tracking_id")
    message = data.get("message")

    if not tracking_id or not message:
        return jsonify({"success": False, "message": "Tracking ID and message required."}), 400

    result, code = add_general_note(tracking_id, message)
    return jsonify(result), code
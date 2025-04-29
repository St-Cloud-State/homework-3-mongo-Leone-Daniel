from flask import Flask, request, jsonify, render_template
from db_methods import submit_application_to_db, check_status_in_db, update_status_in_db

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

    if not tracking_id or not new_status:
        return jsonify({"success": False, "message": "Missing tracking_id or new_status"}), 400

    result, status_code = update_status_in_db(tracking_id, new_status)
    return jsonify(result), status_code

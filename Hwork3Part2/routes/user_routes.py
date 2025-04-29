from flask import Blueprint, request, jsonify
from db.db_methods import submit_application_to_db, check_status_in_db

user_routes = Blueprint('user_routes', __name__)

@user_routes.route('/submit_application', methods=['POST'])
def submit_application():
    data = request.get_json()
    tracking_id = submit_application_to_db(data)
    return jsonify({"tracking_id": tracking_id})

@user_routes.route('/check_status/<tracking_id>', methods=['GET'])
def check_status(tracking_id):
    result = check_status_in_db(tracking_id)
    return jsonify(result)

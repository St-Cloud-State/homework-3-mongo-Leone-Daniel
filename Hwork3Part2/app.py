from flask import Flask, request, jsonify, render_template
from db_methods import submit_application_to_db

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/submit_application', methods=['POST'])
def submit_application():
    data = request.get_json()
    tracking_id = submit_application_to_db(data)
    return jsonify({"tracking_id": tracking_id})

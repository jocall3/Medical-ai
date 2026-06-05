from flask import Flask, jsonify
app = Flask(__name__)

@app.route('/recommend/<patient_id>')
def get_recommendation(patient_id):
    return jsonify({'dose': 500, 'unit': 'mg', 'status': 'safe'})
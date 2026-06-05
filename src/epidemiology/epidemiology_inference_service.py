from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/predict', methods=['GET'])
def predict():
    return jsonify({'status': 'active', 'risk_map': 'high'})
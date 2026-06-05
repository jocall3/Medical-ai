from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    return jsonify({"biological_age": 32.5, "recommendation": "optimize_sleep"})
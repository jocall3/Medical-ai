from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/report/<sample_id>')
def get_report(sample_id):
    return jsonify({'status': 'success', 'data': 'Clinical Report'})
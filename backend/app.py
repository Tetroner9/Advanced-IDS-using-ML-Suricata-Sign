from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import joblib
import json
import time
from werkzeug.utils import secure_filename

# Import your existing SuricataMLIntegration class
from suricata_ml import SuricataMLIntegration

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'output'
MODEL_PATH = 'model/ml_model_xgboost.pkl'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Limit to 16MB

# Replace the process_file function:
@app.route('/api/process', methods=['POST'])
def process_file():
    # Check if the post request has the file part
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    # If user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and file.filename.endswith('.json'):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        output_path = os.path.join(OUTPUT_FOLDER, f"processed_{int(time.time())}.json")
        
        # Make sure directories exist
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        os.makedirs(OUTPUT_FOLDER, exist_ok=True)
        
        file.save(file_path)
        
        try:
            # Process the file using your existing class
            suricata_ml = SuricataMLIntegration(MODEL_PATH, file_path, output_path)
            
            # Process log and get summary results
            summary = suricata_ml.process_eve_log(simulate=False)
            
            # Read output file to get recent entries for UI
            recent_entries = []
            
            with open(output_path, 'r') as f:
                for line in f:
                    entry = json.loads(line)
                    if 'ml_prediction' in entry:
                        # Keep only the most recent entries for the UI
                        if len(recent_entries) < 10:
                            recent_entries.append({
                                'timestamp': entry.get('timestamp', ''),
                                'src_ip': entry.get('src_ip', ''),
                                'dest_ip': entry.get('dest_ip', ''),
                                'prediction': entry['ml_prediction']['label'],
                                'probability': entry['ml_prediction']['probability']
                            })
            
            # Update the results structure
            results = {
                'totalProcessed': summary['totalProcessed'],
                'classCounts': summary['classCounts'],
                'avgProbability': summary['avgProbability'],
                'recentEntries': recent_entries
            }
            
            return jsonify(results), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file format'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
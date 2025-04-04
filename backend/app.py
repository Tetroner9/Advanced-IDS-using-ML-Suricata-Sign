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
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Limit to 16MB

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
            suricata_ml.process_eve_log(simulate=False)
            
            # Read output file to get results
            recent_entries = []
            class_counts = {'BENIGN': 0, 'DoS': 0, 'Port Scan': 0, 'DDoS': 0}
            total_prob = 0
            total_entries = 0
            
            with open(output_path, 'r') as f:
                for line in f:
                    entry = json.loads(line)
                    if 'ml_prediction' in entry:
                        total_entries += 1
                        label = entry['ml_prediction']['label']
                        probability = entry['ml_prediction']['probability']
                        
                        class_counts[label] = class_counts.get(label, 0) + 1
                        total_prob += probability
                        
                        # Keep only the most recent entries for the UI
                        if len(recent_entries) < 10:
                            recent_entries.append({
                                'timestamp': entry.get('timestamp', ''),
                                'src_ip': entry.get('src_ip', ''),
                                'dest_ip': entry.get('dest_ip', ''),
                                'prediction': label,
                                'probability': probability
                            })
            
            avg_probability = total_prob / total_entries if total_entries else 0
            
            results = {
                'totalProcessed': total_entries,
                'classCounts': class_counts,
                'avgProbability': avg_probability,
                'recentEntries': recent_entries
            }
            
            return jsonify(results), 200
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    return jsonify({'error': 'Invalid file format'}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)
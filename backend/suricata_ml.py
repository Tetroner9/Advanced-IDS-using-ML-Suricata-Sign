import os
import json
import joblib
import pandas as pd
import numpy as np
import random

class SuricataMLIntegration:
    def __init__(self, model_path, eve_json_path, output_path):
        self.model_path = model_path
        self.eve_json_path = eve_json_path
        self.output_path = output_path

        # Load model
        self.model = joblib.load(self.model_path)
        if hasattr(self.model, 'named_steps'):
            self.xgb_model = self.model.named_steps['classifier']
        else:
            self.xgb_model = self.model

        if hasattr(self.xgb_model, "get_booster"):
            booster = self.xgb_model.get_booster()
            self.expected_features = booster.feature_names
        else:
            raise ValueError("Model does not contain feature names!")

        self.drop_cols = ['timestamp', 'src_ip', 'dest_ip', 'src_port', 'dest_port',
                          'alert', 'event_type', 'in_iface', 'pkt_src', 'proto']

    def preprocess_log_entry(self, log_entry):
        df = pd.DataFrame([log_entry])
        df.drop(columns=[col for col in self.drop_cols if col in df.columns], inplace=True, errors='ignore')
        df = df.apply(pd.to_numeric, errors='coerce')
        df.fillna(0, inplace=True)
        for col in self.expected_features:
            if col not in df.columns:
                df[col] = 0
        df = df[self.expected_features]
        return df

    def process_eve_log(self, simulate=False):
        processed_entries = []
        total_prob = 0
        total_predictions = 0
        class_counts = {}

        print("\n[INFO] Processing Suricata EVE log file...")
        with open(self.eve_json_path, 'r') as input_file, open(self.output_path, 'w') as output_file:
            for line_num, line in enumerate(input_file, 1):
                try:
                    log_entry = json.loads(line)
                    if 'alert' not in log_entry:
                        continue

                    print(f"[DEBUG] Processing line {line_num}")

                    processed_data = self.preprocess_log_entry(log_entry)

                    if simulate:
                        pred_class = random.choice([0, 1, 2, 3])
                        pred_prob = round(random.uniform(0.80, 0.99), 4)
                    else:
                        prediction = self.model.predict(processed_data)
                        prediction_proba = self.model.predict_proba(processed_data)
                        pred_class = int(prediction[0])
                        pred_prob = float(max(prediction_proba[0]))

                    label_map = {0: 'BENIGN', 1: 'DoS', 2: 'Port Scan', 3: 'DDoS'}
                    log_entry['ml_prediction'] = {
                        'class': pred_class,
                        'label': label_map.get(pred_class, 'Unknown'),
                        'probability': round(pred_prob, 4)
                    }

                    processed_entries.append(log_entry)
                    total_prob += pred_prob
                    total_predictions += 1
                    class_counts[label_map.get(pred_class, 'Unknown')] = class_counts.get(label_map.get(pred_class, 'Unknown'), 0) + 1

                    json.dump(log_entry, output_file)
                    output_file.write('\n')

                except Exception as e:
                    print(f"[ERROR] Line {line_num}: {e}")

        avg_prob = total_prob / total_predictions if total_predictions else 0
        print("\n📄 ===== Prediction Summary =====")
        print(f"Total Entries Processed         : {total_predictions}")
        for label, count in class_counts.items():
            print(f"{label:<32}: {count}")
        print(f"Average Prediction Probability  : {avg_prob:.4f}")
        print("=" * 45)
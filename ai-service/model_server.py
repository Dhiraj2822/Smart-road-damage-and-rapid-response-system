from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from PIL import Image
import io
import os
from damage_detector import DamageDetector
from severity_classifier import SeverityClassifier

app = Flask(__name__)
CORS(app)

detector = DamageDetector()
severity_classifier = SeverityClassifier()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'AI Damage Detection (Local Only)'})

@app.route('/api/analyze', methods=['POST'])
def analyze_image():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        file = request.files['image']
        image = Image.open(io.BytesIO(file.read()))
        image_np = np.array(image)
        image_cv = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR) if len(image_np.shape) == 3 else image_np
        
        detections = detector.detect(image_cv)
        severity_result = severity_classifier.classify(image_cv, detections)
        
        damage_type = 'OTHER'
        if detections and len(detections) > 0:
            damage_type = max(detections, key=lambda x: x['confidence'])['class']
        
        # MAP SEVERITY TO 1-5 SCORE (Strict Requirement)
        severity_map = {'LOW': 1, 'MEDIUM': 3, 'HIGH': 4, 'CRITICAL': 5}
        score = severity_map.get(severity_result['severity'], 1)

        # STRICT ADVISORY OUTPUT
        response = {
            'damageType': damage_type,
            'severityScore': score,
            'confidence': float(round(severity_result['confidence'], 2))
        }
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

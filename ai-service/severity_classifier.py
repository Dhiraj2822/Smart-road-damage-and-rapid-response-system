import numpy as np

class SeverityClassifier:
    def __init__(self):
        self.severity_levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
    
    def classify(self, image, detections):
        if not detections or len(detections) == 0:
            return {
                'severity': 'LOW',
                'confidence': 0.5,
                'reasoning': 'No significant damage detected'
            }
        
        # Calculate severity based on multiple factors
        total_area = sum(d['area'] for d in detections)
        num_detections = len(detections)
        max_confidence = max(d['confidence'] for d in detections)
        
        # Image dimensions
        image_area = image.shape[0] * image.shape[1]
        damage_ratio = total_area / image_area if image_area > 0 else 0
        
        # Severity scoring
        score = 0
        
        # Factor 1: Damage ratio (0-4 points)
        if damage_ratio > 0.3:
            score += 4
        elif damage_ratio > 0.15:
            score += 3
        elif damage_ratio > 0.05:
            score += 2
        else:
            score += 1
        
        # Factor 2: Number of detections (0-3 points)
        if num_detections > 5:
            score += 3
        elif num_detections > 2:
            score += 2
        else:
            score += 1
        
        # Factor 3: Detection confidence (0-3 points)
        if max_confidence > 0.8:
            score += 3
        elif max_confidence > 0.6:
            score += 2
        else:
            score += 1
        
        # Map score to severity level
        if score >= 8:
            severity = 'CRITICAL'
            confidence = 0.9
        elif score >= 6:
            severity = 'HIGH'
            confidence = 0.8
        elif score >= 4:
            severity = 'MEDIUM'
            confidence = 0.7
        else:
            severity = 'LOW'
            confidence = 0.6
        
        reasoning = f'Score: {score}/10, Damage ratio: {damage_ratio:.2%}, Detections: {num_detections}'
        
        return {
            'severity': severity,
            'confidence': confidence,
            'reasoning': reasoning,
            'metrics': {
                'damageRatio': damage_ratio,
                'numDetections': num_detections,
                'maxConfidence': max_confidence,
                'score': score
            }
        }

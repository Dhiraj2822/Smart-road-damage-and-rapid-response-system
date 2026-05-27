import cv2
import numpy as np
from ultralytics import YOLO
import os

class DamageDetector:
    def __init__(self, model_path='models/road_damage_yolov8.pt'):
        self.model_path = model_path
        self.model = None
        self.class_names = {
            0: 'POTHOLE',
            1: 'CRACK',
            2: 'PATCH',
            3: 'MANHOLE',
            4: 'SURFACE_FAILURE'
        }
        self.load_model()
    
    def load_model(self):
        try:
            if os.path.exists(self.model_path):
                self.model = YOLO(self.model_path)
                print(f'Model loaded from {self.model_path}')
            else:
                # Use pretrained YOLOv8 as fallback
                print('Custom model not found, using YOLOv8n pretrained')
                self.model = YOLO('yolov8n.pt')
        except Exception as e:
            print(f'Error loading model: {e}')
            self.model = None
    
    def detect(self, image):
        if self.model is None:
            return self._rule_based_detection(image)
        
        try:
            results = self.model(image, conf=0.25)
            
            detections = []
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0])
                    cls = int(box.cls[0])
                    
                    detection = {
                        'class': self.class_names.get(cls, 'OTHER'),
                        'confidence': conf,
                        'bbox': {
                            'x1': float(x1),
                            'y1': float(y1),
                            'x2': float(x2),
                            'y2': float(y2)
                        },
                        'area': float((x2 - x1) * (y2 - y1))
                    }
                    detections.append(detection)
            
            return detections
        
        except Exception as e:
            print(f'Detection error: {e}')
            return self._rule_based_detection(image)
    
    def _rule_based_detection(self, image):
        # Fallback rule-based detection using image processing
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Edge detection
        edges = cv2.Canny(gray, 50, 150)
        
        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        detections = []
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 100:  # Minimum area threshold
                x, y, w, h = cv2.boundingRect(contour)
                
                # Simple heuristic: aspect ratio to determine damage type
                aspect_ratio = w / h if h > 0 else 1
                
                if aspect_ratio > 2:
                    damage_type = 'CRACK'
                elif 0.8 < aspect_ratio < 1.2:
                    damage_type = 'POTHOLE'
                else:
                    damage_type = 'OTHER'
                
                detection = {
                    'class': damage_type,
                    'confidence': 0.5,  # Low confidence for rule-based
                    'bbox': {
                        'x1': float(x),
                        'y1': float(y),
                        'x2': float(x + w),
                        'y2': float(y + h)
                    },
                    'area': float(area)
                }
                detections.append(detection)
        
        return detections[:5]  # Return top 5 detections

import os
from ultralytics import YOLO
import yaml

def prepare_dataset():
    """
    Prepare dataset configuration for training
    """
    data_config = {
        'path': './datasets/road_damage',
        'train': 'images/train',
        'val': 'images/val',
        'test': 'images/test',
        'nc': 5,  # number of classes
        'names': ['pothole', 'crack', 'patch', 'manhole', 'surface_failure']
    }
    
    with open('road_damage.yaml', 'w') as f:
        yaml.dump(data_config, f)
    
    print('Dataset configuration created: road_damage.yaml')

def train_model(epochs=100, batch_size=16, img_size=640):
    """
    Train YOLOv8 model on road damage dataset
    """
    print('Starting model training...')
    
    # Load pretrained YOLOv8 model
    model = YOLO('yolov8n.pt')
    
    # Train the model
    results = model.train(
        data='road_damage.yaml',
        epochs=epochs,
        imgsz=img_size,
        batch=batch_size,
        name='road_damage_detector',
        patience=50,
        save=True,
        device='cpu',  # Use 'cuda' if GPU available
        workers=4,
        project='runs/train'
    )
    
    print('Training completed!')
    print(f'Best model saved at: {results.save_dir}')
    
    # Export model
    model.export(format='onnx')
    print('Model exported to ONNX format')
    
    return results

def evaluate_model(model_path='runs/train/road_damage_detector/weights/best.pt'):
    """
    Evaluate trained model on test dataset
    """
    print('Evaluating model...')
    
    model = YOLO(model_path)
    
    # Validate on test set
    metrics = model.val(data='road_damage.yaml', split='test')
    
    print(f'mAP50: {metrics.box.map50:.3f}')
    print(f'mAP50-95: {metrics.box.map:.3f}')
    
    return metrics

def download_dataset():
    """
    Download RDD2020 dataset (Road Damage Dataset)
    """
    print('To download the dataset:')
    print('1. Visit: https://github.com/sekilab/RoadDamageDetector')
    print('2. Download RDD2020 dataset')
    print('3. Extract to: ./datasets/road_damage/')
    print('4. Organize as:')
    print('   datasets/road_damage/')
    print('    images/')
    print('       train/')
    print('       val/')
    print('       test/')
    print('    labels/')
    print('        train/')
    print('        val/')
    print('        test/')

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Train road damage detection model')
    parser.add_argument('--prepare', action='store_true', help='Prepare dataset configuration')
    parser.add_argument('--download', action='store_true', help='Show dataset download instructions')
    parser.add_argument('--train', action='store_true', help='Train model')
    parser.add_argument('--evaluate', action='store_true', help='Evaluate model')
    parser.add_argument('--epochs', type=int, default=100, help='Number of epochs')
    parser.add_argument('--batch', type=int, default=16, help='Batch size')
    parser.add_argument('--img-size', type=int, default=640, help='Image size')
    
    args = parser.parse_args()
    
    if args.download:
        download_dataset()
    elif args.prepare:
        prepare_dataset()
    elif args.train:
        prepare_dataset()
        train_model(args.epochs, args.batch, args.img_size)
    elif args.evaluate:
        evaluate_model()
    else:
        print('Usage:')
        print('  python train_model.py --download  # Show download instructions')
        print('  python train_model.py --prepare   # Prepare dataset config')
        print('  python train_model.py --train     # Train model')
        print('  python train_model.py --evaluate  # Evaluate model')

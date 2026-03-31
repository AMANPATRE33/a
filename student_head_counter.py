import cv2
import torch
import threading
import time
import requests
import os
import sys
from ultralytics import YOLO

# ================== AUTO-DEPENDENCY CHECK ==================
try:
    from huggingface_hub import hf_hub_download
except ImportError:
    print("❌ ERROR: 'huggingface_hub' not found.")
    print("👉 Please run: pip install huggingface_hub ultralytics opencv-python requests")
    sys.exit(1)

# ================== CONFIGURATION ==================
# 🎥 CCTV FEED PATHS - Replace these with your actual local file paths
VIDEO_SOURCES = {
    "Camera-A": r"C:\Users\anike\Downloads\FINAL\canteen\Canteen A 10022026\CANTEEN-A_Admin Office-Canteen-Campus_Admin Office-Canteen-Campus_20260310081820_20260310082052_145763.mp4",
    "Camera-B": r"C:\Users\anike\Downloads\FINAL\canteen\Canteen B\CANTEEN-C_Admin Office-Canteen-Campus_Admin Office-Canteen-Campus_20260310092300_20260310092520_225646.mp4"
}

# 🛠️ HIGH-ACCURACY MODEL SETTINGS
# We use a specialized head-detection model from Hugging Face for maximum accuracy
REPO_ID = "keremberke/yolov8n-head"
FILENAME = "best.pt"
TRACKER_CONFIG = "bytetrack.yaml"
CONFIDENCE_THRESHOLD = 0.35      
IOU_THRESHOLD = 0.5

# 🌐 BACKEND SYNC
MAIN_BACKEND_URL = "http://localhost:5000/api/update_people_count"
SEND_FREQUENCY = 3 

# ================== GLOBAL STATE ==================
# Thread-safe storage for camera counts
camera_counts = {cam_id: 0 for cam_id in VIDEO_SOURCES}
state_lock = threading.Lock()

# ================== CAMERA PROCESSOR CLASS ==================
class CameraProcessor:
    def __init__(self, cam_id, video_path):
        self.cam_id = cam_id
        self.video_path = video_path
        self.model = None
        self._initialize_model()

    def _initialize_model(self):
        """Robustlly downloads and loads the high-accuracy head detection model."""
        try:
            print(f"📡 [{self.cam_id}] Connecting to AI Model Registry (Hugging Face)...")
            # Automatically downloads the best head detector model weights
            weights_path = hf_hub_download(repo_id=REPO_ID, filename=FILENAME)
            self.model = YOLO(weights_path)
            print(f"✅ [{self.cam_id}] High-Accuracy Head Detector Loaded.")
        except Exception as e:
            print(f"⚠️ [{self.cam_id}] Warning: Could not download specialized model ({e})")
            print(f"🔄 [{self.cam_id}] Falling back to standard 'yolov8n.pt'...")
            # Failsafe: Standard YOLO model that always works
            self.model = YOLO("yolov8n.pt")

    def start(self):
        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            print(f"❌ [{self.cam_id}] CRITICAL: Video file not found: {self.video_path}")
            return

        print(f"🎥 [{self.cam_id}] AI Node Processing - CCTV Active.")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                # Loop video for demonstration purposes if desired, else break
                # cap.set(cv2.CAP_PROP_POS_FRAMES, 0); continue
                print(f"🔚 [{self.cam_id}] Simulation Finished or Stream Ended.")
                break

            # 🛠️ EXECUTE PERSISTENT TRACKING
            # This maintains specific IDs for each person to prevent double-counting
            results = self.model.track(
                source=frame, 
                persist=True, 
                conf=CONFIDENCE_THRESHOLD, 
                iou=IOU_THRESHOLD,
                tracker=TRACKER_CONFIG,
                verbose=False
            )

            # Get Detection Boxes and IDs
            boxes = results[0].boxes.xyxy.cpu().numpy()
            track_ids = results[0].boxes.id.cpu().numpy() if (results[0].boxes.id is not None) else []
            
            # Update global state
            with state_lock:
                camera_counts[self.cam_id] = len(track_ids)

            # 🎨 RENDER VISUAL FEEDBACK
            for box, tid in zip(boxes, track_ids):
                x1, y1, x2, y2 = map(int, box)
                
                # If using the specialized head model, the box is already a head.
                # If using the fallback person model, we focus the box on the head area.
                is_person_model = "yolov8n.pt" in str(self.model.ckpt_path) if hasattr(self.model, 'ckpt_path') else False
                
                if is_person_model:
                     y2 = y1 + int((y2 - y1) * 0.2) # Crop to head for standard model
                
                # Draw accurate bounding box
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                # Label with Tracking ID
                cv2.putText(frame, f"S-{int(tid)}", (x1, y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

            # --- ON-SCREEN DASHBOARD ---
            cv2.rectangle(frame, (10, 10), (320, 90), (0, 0, 0), -1)
            cv2.putText(frame, f"NODE: {self.cam_id}", (25, 40), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(frame, f"PEOPLE INSIDE: {len(track_ids)}", (25, 75), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            
            # Show processed window (Resized for visibility)
            cv2.imshow(f"Smart Anna AI - {self.cam_id}", cv2.resize(frame, (800, 450)))
            
            # Exit on 'q' key
            if cv2.waitKey(1) & 0xFF == ord('q'): break

        cap.release()
        cv2.destroyWindow(f"Smart Anna AI - {self.cam_id}")

# ================== BACKEND SYNCHRONIZATION ==================
def sync_with_webapp():
    print(f"📡 [SYNC] Backend communication thread active.")
    while True:
        try:
            with state_lock:
                # Aggregate counts from all cameras
                total_students = sum(camera_counts.values())
            
            # Update the Smart Anna Cafeteria Backend
            payload = {"canteen_id": "Final-Project-Node", "people_count": total_students}
            response = requests.post(MAIN_BACKEND_URL, json=payload, timeout=2)
            
            if response.status_code == 200:
                print(f"✅ [SYNC] Database Updated: {total_students} students in canteen.")
            else:
                print(f"⚠️ [SYNC] Backend Issue: Status {response.status_code}")
        except Exception:
            print(f"❌ [SYNC] Error: Is server.py running on port 5000?")
            
        time.sleep(SEND_FREQUENCY)

# ================== MAIN STARTUP ==================
if __name__ == "__main__":
    print("-" * 50)
    print("🚀 SMART ANNA - HIGH ACCURACY STUDENT COUNTER")
    print("-" * 50)

    # 1. Start synchronization thread
    api_thread = threading.Thread(target=sync_with_webapp, daemon=True)
    api_thread.start()

    # 2. Launch Camera Processes
    processor_threads = []
    for cam_id, video_path in VIDEO_SOURCES.items():
        proc = CameraProcessor(cam_id, video_path)
        t = threading.Thread(target=proc.start, name=cam_id)
        t.start()
        processor_threads.append(t)

    print("\n💡 Press 'q' on any video window to exit safely.")
    
    # Wait for all camera processing to finish
    for t in processor_threads:
        t.join()

    print("\n🛑 AI Processing Node Stopped.")

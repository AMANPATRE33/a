import cv2
import threading
import time
import requests
import os
from ultralytics import YOLO

# ================== CONFIGURATION ==================
# 🔑 LOCAL YOLO MODEL PATH
MODEL_PATH = r"C:\Users\anike\Downloads\FINAL\best (1).pt"

# 🎥 CCTV FEED PATHS (Local MP4 Files)
VIDEO_SOURCES = {
    "Camera-A": r"C:\Users\anike\Downloads\FINAL\canteen\Canteen A 10022026\CANTEEN-A_Admin Office-Canteen-Campus_Admin Office-Canteen-Campus_20260310081820_20260310082052_145763.mp4",
    "Camera-B": r"C:\Users\anike\Downloads\FINAL\canteen\Canteen B\CANTEEN-C_Admin Office-Canteen-Campus_Admin Office-Canteen-Campus_20260310092300_20260310092520_225646.mp4"
}

# 🛠️ SYSTEM SETTINGS
CONFIDENCE_THRESHOLD = 0.45      # Detection sensitivity
BACKEND_URL = "http://localhost:5000/api/update_people_count"
SEND_FREQUENCY = 3               # Update backend every 3 seconds
PROCESS_WIDTH, PROCESS_HEIGHT = 800, 450

# ================== GLOBAL STATE ==================
# Thread-safe storage for camera counts
camera_counts = {cam_id: 0 for cam_id in VIDEO_SOURCES}
state_lock = threading.Lock()
stop_flag = False

# Initialize the Model (Single instance shared)
print(f"📡 Loading Local AI Model: {MODEL_PATH}...")
try:
    model = YOLO(MODEL_PATH)
    print("✅ Model Loaded Successfully.")
except Exception as e:
    print(f"❌ ERROR: Could not load model file '{MODEL_PATH}'. Ensure it exists.")
    exit(1)

# ================== CAMERA PROCESSOR CLASS ==================
class CameraProcessor:
    def __init__(self, cam_id, video_path):
        self.cam_id = cam_id
        self.video_path = video_path
        self.local_count = 0

    def start(self):
        global stop_flag
        cap = cv2.VideoCapture(self.video_path)
        
        if not cap.isOpened():
            print(f"❌ [{self.cam_id}] ERROR: Video source not found.")
            return

        print(f"🎥 [{self.cam_id}] AI Monitoring Active.")

        while cap.isOpened() and not stop_flag:
            ret, frame = cap.read()
            if not ret:
                # Video Loop: Re-open if stream ends (Demo Mode)
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue

            # 🛠️ YOLO INFERENCE
            # Run tracking to keep IDs persistent and prevent double-counting
            results = model.track(frame, persist=True, conf=CONFIDENCE_THRESHOLD, verbose=False)
            
            # Extract counting data
            if results[0].boxes is not None and results[0].boxes.id is not None:
                track_ids = results[0].boxes.id.int().cpu().tolist()
                self.local_count = len(track_ids)
            else:
                self.local_count = 0

            # Update Global Aggregator
            with state_lock:
                camera_counts[self.cam_id] = self.local_count
                total_canteen = sum(camera_counts.values())

            # 🎨 UI OVERLAY & Bounding Boxes
            annotated_frame = results[0].plot() # Draws default YOLO boxes

            # --- CUSTOM HUD DASHBOARD ---
            cv2.rectangle(annotated_frame, (10, 10), (350, 110), (0, 0, 0), -1)
            cv2.putText(annotated_frame, f"SMART ANNA NODE: {self.cam_id}", (20, 35), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            cv2.putText(annotated_frame, f"LOCAL COUNT: {self.local_count}", (20, 65), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            cv2.putText(annotated_frame, f"CANTEEN TOTAL: {total_canteen}", (20, 95), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 200, 255), 2)
            
            # Show processed window
            cv2.imshow(f"Smart Anna - {self.cam_id}", cv2.resize(annotated_frame, (PROCESS_WIDTH, PROCESS_HEIGHT)))
            
            # Safe Exit on 'q'
            if cv2.waitKey(1) & 0xFF == ord('q'):
                stop_flag = True
                break

        cap.release()
        cv2.destroyWindow(f"Smart Anna - {self.cam_id}")

# ================== BACKEND SYNCHRONIZATION ==================
def sync_with_backend():
    print("📡 [SYNC] Backend Aggregator thread started.")
    while not stop_flag:
        try:
            with state_lock:
                total_inside = sum(camera_counts.values())
            
            # Push payload to Smart Anna aggregator
            payload = {"canteen_id": "Final-Project-AI-Node", "people_count": total_inside}
            response = requests.post(BACKEND_URL, json=payload, timeout=2)
            
            if response.status_code == 200:
                print(f"✅ [SYNC] Database Updated: {total_inside} students currently active.")
            else:
                print(f"⚠️ [SYNC] Backend Alert: Status {response.status_code}")
        except Exception:
            pass # Fail silently during network drops
            
        time.sleep(SEND_FREQUENCY)

# ================== MAIN STARTUP ==================
if __name__ == "__main__":
    # 1. Launch Backend Sync Thread
    api_thread = threading.Thread(target=sync_with_backend, daemon=True)
    api_thread.start()

    # 2. Launch Camera Threads
    threads = []
    for cam_id, video_path in VIDEO_SOURCES.items():
        proc = CameraProcessor(cam_id, video_path)
        t = threading.Thread(target=proc.start, name=cam_id, daemon=True)
        t.start()
        threads.append(t)

    print("\n🚀 Smart Anna High-Accuracy Counter Running!")
    print("💡 Important: Ensure 'server.py' is running on port 5000.")
    print("💡 Press 'q' on any video window to exit safely.\n")
    
    # Wait for completion
    while not stop_flag:
        time.sleep(0.5)

    print("\n🛑 AI Processing Node Stopped.")

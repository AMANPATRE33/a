import cv2
import threading
import time
import requests
import os
from roboflow import Roboflow

# ================== CONFIGURATION ==================
# 🔑 ROBOFLOW API CREDENTIALS
ROBOFLOW_API_KEY = "RTSFKVWilwQFYhNxOrWg"
WORKSPACE_ID = "object-detection-hc2dd"
PROJECT_ID = "head-sg6h0"
VERSION_ID = 2

# 🎥 CCTV FEED PATHS
VIDEO_SOURCES = {
    "Camera-A": r"C:\Users\anike\Downloads\FINAL\canteen\Canteen A 10022026\CANTEEN-A_Admin Office-Canteen-Campus_Admin Office-Canteen-Campus_20260310081820_20260310082052_145763.mp4",
    "Camera-B": r"C:\Users\anike\Downloads\FINAL\canteen\Canteen B\CANTEEN-C_Admin Office-Canteen-Campus_Admin Office-Canteen-Campus_20260310092300_20260310092520_225646.mp4"
}

# 🛠️ PERFORMANCE TWEAK
AI_INTERVAL = 30  # Only run AI every 30 frames (approx. 1 second)
BACKEND_URL = "http://localhost:5000/api/update_people_count"
SEND_FREQUENCY = 3 

# ================== GLOBAL STATE ==================
# Thread-safe storage for current head counts from each camera
camera_counts = {cam_id: 0 for cam_id in VIDEO_SOURCES}
state_lock = threading.Lock()
stop_flag = False

# Load Roboflow Model (Single instance shared)
print("📡 Connecting to Roboflow AI Registry...")
rf = Roboflow(api_key=ROBOFLOW_API_KEY)
project = rf.workspace(WORKSPACE_ID).project(PROJECT_ID)
model = project.version(VERSION_ID).model

# ================== CAMERA PROCESSOR CLASS ==================
class CameraProcessor:
    def __init__(self, cam_id, video_path):
        self.cam_id = cam_id
        self.video_path = video_path
        self.last_predictions = []
        self.local_count = 0
        self.frame_count = 0

    def start(self):
        global stop_flag
        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            print(f"❌ [{self.cam_id}] ERROR: Could not open video source.")
            return

        print(f"🎥 [{self.cam_id}] Monitoring Active. Separate Window Initialized.")
        
        while cap.isOpened() and not stop_flag:
            ret, frame = cap.read()
            if not ret: break

            self.frame_count += 1

            # A. OPTIMIZED AI REFRESH (EVERY 30 FRAMES)
            if self.frame_count % AI_INTERVAL == 0:
                try:
                    # Run Roboflow Prediction
                    results = model.predict(frame, confidence=42).json()
                    new_predictions = results.get('predictions', [])
                    
                    # Update counts immediately with lock
                    with state_lock:
                        self.local_count = len(new_predictions)
                        # CRITICAL: Always update the global count for the sum logic
                        camera_counts[self.cam_id] = self.local_count
                        self.last_predictions = new_predictions
                        
                except Exception as e:
                    print(f"⚠️ [{self.cam_id}] Inference Lag: {e}")

            # B. FAST RENDERING (ALWAYS SMOOTH)
            for i, res in enumerate(self.last_predictions):
                x, y, w, h = int(res['x']), int(res['y']), int(res['width']), int(res['height'])
                p1 = (int(x - w/2), int(y - h/2))
                p2 = (int(x + w/2), int(y + h/2))
                cv2.rectangle(frame, p1, p2, (0, 255, 0), 2)
                cv2.putText(frame, f"S-{i+1}", (p1[0], p1[1] - 5), 1, 0.6, (255, 255, 255), 1)

            # C. HUD: INDIVIDUAL AND TOTAL COUNTS
            with state_lock:
                total_canteen = sum(camera_counts.values())

            # UI Overlay Dash
            cv2.rectangle(frame, (10, 10), (320, 100), (0, 0, 0), -1)
            cv2.putText(frame, f"NODE: {self.cam_id}", (20, 35), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            cv2.putText(frame, f"CAMERA COUNT: {self.local_count}", (20, 65), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            cv2.putText(frame, f"TOTAL INSIDE: {total_canteen}", (20, 90), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 200, 255), 1)
            
            # Show window (Fixed size for consistency)
            cv2.imshow(f"Smart Anna - {self.cam_id}", cv2.resize(frame, (800, 450)))
            
            # Non-blocking waitKey to keep both windows alive
            if cv2.waitKey(15) & 0xFF == ord('q'):
                stop_flag = True
                break

        cap.release()
        cv2.destroyWindow(f"Smart Anna - {self.cam_id}")

# ================== SYNC THREAD (AGGREGATOR) ==================
def sync_with_backend():
    print("📡 [SYNC] Backend Aggregator thread started.")
    while not stop_flag:
        try:
            with state_lock:
                # Sum all camera counts to get total students in canteen
                total_inside = sum(camera_counts.values())
            
            # Update the Smart Anna backend
            payload = {"canteen_id": "Dual-Node-AI", "people_count": total_inside}
            response = requests.post(BACKEND_URL, json=payload, timeout=2)
            
            if response.status_code == 200:
                print(f"✅ [SYNC] Database Update: {total_inside} students currently active.")
            else:
                print(f"⚠️ [SYNC] Backend Sync Warning")
        except:
            pass
            
        time.sleep(SEND_FREQUENCY)

# ================== MAIN STARTUP ==================
if __name__ == "__main__":
    # 1. Start synchronization thread
    api_thread = threading.Thread(target=sync_with_backend, daemon=True)
    api_thread.start()

    # 2. Launch Camera Threads
    threads = []
    for cam_id, video_path in VIDEO_SOURCES.items():
        proc = CameraProcessor(cam_id, video_path)
        t = threading.Thread(target=proc.start, name=cam_id, daemon=True)
        t.start()
        threads.append(t)

    print("🚀 Running Individual Monitoring. Close any window to stop.")
    
    # Wait for completion
    while not stop_flag:
        time.sleep(0.5)

    print("\n🛑 AI Processing Node Stopped.")

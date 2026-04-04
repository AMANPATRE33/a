import cv2
import threading
import time
import requests
import numpy as np
from ultralytics import YOLO

# ================== CONFIGURATION ==================
# 🔑 LOCAL YOLO MODEL PATH
MODEL_PATH = r"C:\Users\anike\Downloads\FINAL\table.pt"

# 🎯 CLASS NAME (Must match your dataset)
TARGET_CLASS = "empty_table" 

# 🎥 CCTV FEED SOURCES
VIDEO_SOURCES = {
    "Camera-A": r"C:\Users\anike\Downloads\FINAL\canteen\Canteen A 10022026\CANTEEN-A_Admin Office-Canteen-Campus_Admin Office-Canteen-Campus_20260310081820_20260310082052_145763.mp4",
    "Camera-B": r"C:\Users\anike\Downloads\FINAL\canteen\Canteen B\CANTEEN-C_Admin Office-Canteen-Campus_Admin Office-Canteen-Campus_20260310092300_20260310092520_225646.mp4"
}

# 🛠️ PERFORMANCE SETTINGS
# USER REQUEST: Confidence must be greater than 0.40
CONFIDENCE_THRESHOLD = 0.40      
IMG_SIZE = 640                  
BACKEND_URL = "http://localhost:5000/api/update_table_count" 
SEND_FREQUENCY = 3               
WINDOW_NAME = "Smart Anna - Table AI Dashboard"

# ================== GLOBAL STATE ==================
camera_counts = {cam_id: 0 for cam_id in VIDEO_SOURCES}
camera_frames = {cam_id: np.zeros((360, 640, 3), dtype=np.uint8) for cam_id in VIDEO_SOURCES}
state_lock = threading.Lock()
stop_flag = False

# ================== CAMERA PROCESSOR ==================
class CameraProcessor:
    def __init__(self, cam_id, video_path, shared_model):
        self.cam_id = cam_id
        self.video_path = video_path
        self.model = shared_model 

    def start(self):
        global stop_flag
        cap = cv2.VideoCapture(self.video_path)
        
        while cap.isOpened() and not stop_flag:
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0) # Loop on video end
                continue

            # Run YOLO AI - Single frame tracking
            # We enforce the confidence threshold during inference for performance
            results = self.model.predict(source=frame, conf=CONFIDENCE_THRESHOLD, imgsz=IMG_SIZE, verbose=False)
            
            # Count specific class
            count = 0
            if len(results) > 0 and results[0].boxes is not None:
                names = results[0].names
                for box in results[0].boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    # Double check: Only count if class matches AND confidence > 0.40
                    if names[cls_id] == TARGET_CLASS and conf > 0.40:
                        count += 1
            
            # Draw detections
            annotated_frame = results[0].plot()
            cv2.putText(annotated_frame, f"Cam: {self.cam_id} | Tables: {count}", (30, 60), 
                        cv2.FONT_HERSHEY_DUPLEX, 1.2, (0, 255, 0), 2)

            # Resize for dashboard view
            processed_frame = cv2.resize(annotated_frame, (640, 360))
            
            with state_lock:
                camera_counts[self.cam_id] = count
                camera_frames[self.cam_id] = processed_frame

        cap.release()

# ================== BACKEND SYNCHRONIZER ==================
def sync_worker():
    while not stop_flag:
        try:
            with state_lock:
                total_empty = sum(camera_counts.values())
            
            payload = {"canteen_id": "MAIN_FLOOR", "empty_tables": total_empty}
            requests.post(BACKEND_URL, json=payload, timeout=2)
            print(f"📡 [AI SYNC] {total_empty} Empty Tables (Conf > 0.40) Reported.")
        except Exception:
            pass
        time.sleep(SEND_FREQUENCY)

# ================== EXECUTION ==================
if __name__ == "__main__":
    print("🔥 INITIALIZING SMART ANNA AI NODE...")
    print(f"🎯 Target: {TARGET_CLASS} | Confidence: > {CONFIDENCE_THRESHOLD}")
    
    try:
        shared_model = YOLO(MODEL_PATH)
    except Exception as e:
        print(f"❌ MODEL LOAD ERROR: {e}")
        exit()

    # Start Workers
    threading.Thread(target=sync_worker, daemon=True).start()
    for cid, path in VIDEO_SOURCES.items():
        proc = CameraProcessor(cid, path, shared_model)
        threading.Thread(target=proc.start, daemon=True).start()

    # Unified Dashboard Loop
    while not stop_flag:
        with state_lock:
            frame_a = camera_frames["Camera-A"]
            frame_b = camera_frames["Camera-B"]
            total = sum(camera_counts.values())

        # Horizontal Stack
        dashboard = np.hstack((frame_a, frame_b))
        
        # Header Overlay
        overlay = dashboard.copy()
        cv2.rectangle(overlay, (0, 0), (dashboard.shape[1], 60), (20, 20, 20), -1)
        cv2.addWeighted(overlay, 0.7, dashboard, 0.3, 0, dashboard)
        
        cv2.putText(dashboard, "SMART ANNA - LIVE TABLE AVAILABILITY", (int(dashboard.shape[1]/2) - 250, 40), 
                    cv2.FONT_HERSHEY_TRIPLEX, 0.8, (255, 255, 255), 1)

        # Floating Result Badge
        # Made the badge red if tables are low for visual alert, green otherwise
        badge_color = (0, 200, 0) if total > 5 else (0, 0, 200)
        cv2.rectangle(dashboard, (int(dashboard.shape[1]/2) - 100, 65), (int(dashboard.shape[1]/2) + 100, 115), badge_color, -1)
        cv2.putText(dashboard, f"EMPTY: {total}", (int(dashboard.shape[1]/2) - 75, 100), 
                    cv2.FONT_HERSHEY_DUPLEX, 0.8, (0, 0, 0), 2)

        cv2.imshow(WINDOW_NAME, dashboard)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            stop_flag = True

    cv2.destroyAllWindows()

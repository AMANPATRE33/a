from roboflow import Roboflow
import cv2
import requests
import time

# --- 1. CONFIGURATION ---
ROBOFLOW_API_KEY = "RTSFKVWilwQFYhNxOrWg"
WORKSPACE_ID = "object-detection-hc2dd"
PROJECT_ID = "new-z9psz"
MODEL_VERSION = 1 

# BACKEND SYNC SETTINGS
BACKEND_URL = "http://localhost:5000/api/update_table_count" 
TOTAL_CAPACITY = 60 # Total tables in your canteen

# ⚠️ TARGET VIDEO SOURCE ⚠️
# Using your specific high-res project video
VIDEO_PATH = r"C:\Users\anike\Downloads\FINAL\canteen\Canteen A 10022026\CANTEEN-A_Admin Office-Canteen-Campus_Admin Office-Canteen-Campus_20260310081820_20260310082052_145763.mp4"

# --- 2. LOAD AI MODEL ---
print("🧠 Connecting to Roboflow AI...")
rf = Roboflow(api_key=ROBOFLOW_API_KEY)
project = rf.workspace(WORKSPACE_ID).project(PROJECT_ID)
model = project.version(MODEL_VERSION).model

cap = cv2.VideoCapture(VIDEO_PATH)

if not cap.isOpened():
    print(f"❌ ERROR: Could not open video file at: {VIDEO_PATH}")
    exit()

# --- PERFORMANCE TWEAKS ---
frame_count = 0
AI_INTERVAL = 30 # Run AI every 30 frames (approx. 1s) for smooth performance
last_predictions = []
last_empty_tables = 60

print("🚀 Smart Anna Smooth AI Node started. Press 'q' to stop.")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret: 
        print("🏁 End of video file.")
        break

    frame_count += 1

    # A. AI INFERENCE (SCHEDULED)
    if frame_count % AI_INTERVAL == 0:
        results = model.predict(frame, confidence=40).json()
        last_predictions = results['predictions']
        last_empty_tables = max(0, TOTAL_CAPACITY - len(last_predictions))
        
        # Sync with Backend
        try:
            requests.post(BACKEND_URL, json={"canteen_id": "Canteen-A", "empty_tables": last_empty_tables}, timeout=0.1)
        except:
            pass

    # B. VISUALIZATION (ALWAYS ON)
    # Using 'last_predictions' ensures boxes stay visible during smooth playback
    for i, res in enumerate(last_predictions):
        x, y, w, h = int(res['x']), int(res['y']), int(res['width']), int(res['height'])
        p1 = (int(x - w/2), int(y - h/2))
        p2 = (int(x + w/2), int(y + h/2))
        
        # Table Numbering
        cv2.rectangle(frame, p1, p2, (0, 255, 0), 2)
        cv2.putText(frame, f"T{i+1}", (p1[0], p1[1] - 5), 1, 0.8, (255, 0, 0), 1)
    
    # UI Banner
    cv2.putText(frame, f"LIVE AI: {last_empty_tables}/{TOTAL_CAPACITY} Tables Free", (20, 40), 
                cv2.FONT_HERSHEY_DUPLEX, 0.8, (0, 0, 255), 2)

    # C. SHOW THE WINDOW (SMOOTH PLAYBACK)
    cv2.imshow("Smart Anna - High Performance AI", frame)
    
    # WaitKey(20) ensures 40-50 FPS playback speed
    if cv2.waitKey(20) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
print("👋 Processor offline.")

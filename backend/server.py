import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
import random
import uuid
import math

# --- FASTAPI APP ---
app = FastAPI(title="Smart Anna API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- YOLO DATA MODELS ---
class TableUpdate(BaseModel):
    canteen_id: str
    empty_tables: int

class PeopleUpdate(BaseModel):
    canteen_id: str
    people_count: int

# --- GLOBAL LIVE STORAGE ---
# Pushed data from YOLO scripts is stored here
live_data: Dict[str, Any] = {
    "people_inside": None,
    "empty_tables": None,
}

@app.get("/")
def read_root():
    return {"message": "Smart Anna Backend is Running"}

# --- AI DATA INGESTION ---

@app.post("/api/update_table_count")
def update_table_count(update: TableUpdate):
    live_data["empty_tables"] = update.empty_tables
    print(f"📡 [AI] Table Update: {update.empty_tables} free")
    return {"status": "success"}

@app.post("/api/update_people_count")
def update_people_count(update: PeopleUpdate):
    live_data["people_inside"] = update.people_count
    print(f"📡 [AI] Student Update: {update.people_count} inside")
    return {"status": "success"}

# --- DASHBOARD API ---

@app.get("/status")
def get_status():
    if live_data["people_inside"] is not None:
        count = live_data["people_inside"]
    else:
        count = random.randint(5, 50) # Simulation fallback
    
    status = "FREE"
    if count > 20: status = "MODERATE"
    if count > 40: status = "CROWDED"
    return {"people_inside": count, "status": status}

@app.get("/api/tables")
def get_tables():
    total = 60
    if live_data["empty_tables"] is not None:
        empty = live_data["empty_tables"]
        occupied = total - empty
    else:
        dummy = live_data["people_inside"] if live_data["people_inside"] else 15
        occupied = math.ceil(dummy / 5)
        empty = total - occupied
    return {"occupied_tables": occupied, "empty_tables": empty}

# Ensure your uvicorn command is at the bottom!
if __name__ == "__main__":
    print("🚀 Smart Anna Backend Running on http://localhost:5000")
    uvicorn.run(app, host="127.0.0.1", port=5000)

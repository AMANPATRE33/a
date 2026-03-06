
import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import random
import uuid

# --- DATABASE SETUP (SQLAlchemy) ---
from sqlalchemy import create_engine, Column, Integer, String, Float, JSON, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Create SQLite Database (persistent file)
SQLALCHEMY_DATABASE_URL = "sqlite:///./cafeteria.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- DATABASE MODELS ---
class DBMenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    price = Column(Float)
    category = Column(String)
    image = Column(String)

class DBOrder(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True, index=True)
    user_email = Column(String, index=True)
    user_name = Column(String)
    total = Column(Float)
    items = Column(JSON) # Storing cart items as JSON
    timestamp = Column(DateTime, default=datetime.utcnow)
    payment_method = Column(String)

class DBFeedback(Base):
    __tablename__ = "feedback"
    id = Column(String, primary_key=True, index=True)
    user_name = Column(String)
    user_email = Column(String)
    rating = Column(Integer)
    message = Column(String)
    type = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

# Create Tables
Base.metadata.create_all(bind=engine)

# --- PYDANTIC SCHEMAS (Data Validation) ---
class MenuItemCreate(BaseModel):
    name: str
    price: float
    category: str
    image: Optional[str] = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500"

class MenuItem(MenuItemCreate):
    id: str
    class Config:
        orm_mode = True

class CartItem(MenuItemCreate):
    id: str
    quantity: int

class OrderCreate(BaseModel):
    user_id: str
    user_email: str
    user_name: str
    items: List[CartItem]
    total: float
    paymentMethod: str = "UPI"

class FeedbackCreate(BaseModel):
    user_email: str
    rating: int
    message: str
    type: str

# --- FASTAPI APP ---
app = FastAPI(title="Smart Anna API", description="The intelligent backend for Smart Anna Cafeteria")

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- ROUTES ---

@app.get("/")
def read_root():
    return {"message": "Smart Anna Backend is Running (FastAPI + SQLite)"}

@app.get("/status")
def get_status():
    """Simulates Computer Vision People Counting"""
    count = random.randint(5, 50)
    status = "FREE"
    if count > 20: status = "MODERATE"
    if count > 40: status = "CROWDED"
    return {"people_inside": count, "status": status}

@app.get("/api/tables")
def get_tables():
    """Simulates IoT Sensors"""
    total = 60
    occupied = random.randint(10, 50)
    return {"occupied_tables": occupied, "empty_tables": total - occupied}

@app.get("/cameras")
def get_cameras():
    return [
        {"id": "c1", "name": "Entrance", "url": "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800", "status": "ONLINE", "location": "Main Gate"},
        {"id": "c2", "name": "Counter", "url": "https://images.unsplash.com/photo-1556910103-1c02745a30bf?w=800", "status": "ONLINE", "location": "Food Court"},
        {"id": "c3", "name": "Seating Area", "url": "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800", "status": "MAINTENANCE", "location": "Floor 1"}
    ]

# --- MENU ENDPOINTS ---

@app.get("/menu", response_model=List[MenuItem])
def get_menu(db: Session = Depends(get_db)):
    # If DB is empty, seed it with some defaults for demo purposes
    if db.query(DBMenuItem).count() == 0:
        defaults = [
            DBMenuItem(id="1", name="Samosa (2pcs)", price=30, category="Snacks", image="https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600"),
            DBMenuItem(id="8", name="Masala Dosa", price=70, category="Meals", image="https://images.unsplash.com/photo-1589301760014-d929645603f8?w=600"),
            DBMenuItem(id="16", name="Masala Chai", price=15, category="Beverages", image="https://images.unsplash.com/photo-1619053386721-e054aeec686c?w=600")
        ]
        db.add_all(defaults)
        db.commit()
    return db.query(DBMenuItem).all()

@app.post("/menu")
def add_menu_item(item: MenuItemCreate, db: Session = Depends(get_db)):
    new_id = str(uuid.uuid4())
    db_item = DBMenuItem(
        id=new_id, 
        name=item.name, 
        price=item.price, 
        category=item.category, 
        image=item.image
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return {"success": True, "id": new_id}

@app.delete("/menu/{item_id}")
def delete_menu_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(DBMenuItem).filter(DBMenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return {"success": True}

# --- ORDER ENDPOINTS ---

@app.post("/orders")
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    # Convert Pydantic models to dict for JSON storage
    items_json = [item.dict() for item in order.items]
    
    new_order = DBOrder(
        id=str(uuid.uuid4()),
        user_email=order.user_email,
        user_name=order.user_name,
        total=order.total,
        items=items_json,
        payment_method=order.paymentMethod,
        timestamp=datetime.utcnow()
    )
    db.add(new_order)
    db.commit()
    return {"success": True, "order_id": new_order.id}

@app.get("/orders/{email}")
def get_order_history(email: str, db: Session = Depends(get_db)):
    orders = db.query(DBOrder).filter(DBOrder.user_email == email).order_by(DBOrder.timestamp.desc()).all()
    return orders

# --- FEEDBACK & ANALYTICS ---

@app.post("/feedback")
def submit_feedback(feedback: FeedbackCreate, db: Session = Depends(get_db)):
    new_feedback = DBFeedback(
        id=str(uuid.uuid4()),
        user_email=feedback.user_email,
        user_name=feedback.user_email.split('@')[0].capitalize(),
        rating=feedback.rating,
        message=feedback.message,
        type=feedback.type,
        timestamp=datetime.utcnow()
    )
    db.add(new_feedback)
    db.commit()
    return {"success": True}

@app.get("/feedback")
def get_feedback(db: Session = Depends(get_db)):
    return db.query(DBFeedback).order_by(DBFeedback.timestamp.desc()).all()

@app.get("/analytics/summary")
def get_analytics(timeframe: str = "daily", db: Session = Depends(get_db)):
    # In a real app, perform SQL aggregations here based on 'timeframe'
    total_revenue = db.query(DBOrder).with_entities(DBOrder.total).all()
    revenue_sum = sum([r[0] for r in total_revenue]) + 12500 # Add base for demo

    return {
        "total_revenue": revenue_sum,
        "avg_rating": 4.5,
        "item_sales": [{"name": "Samosa", "value": 120}, {"name": "Chai", "value": 300}],
        "revenue_trend": [{"label": "9am", "value": 100}, {"label": "12pm", "value": 500}],
        "category_split": [{"label": "Snacks", "value": 60, "color": "#f97316"}, {"label": "Meals", "value": 40, "color": "#3b82f6"}],
        "occupancy_trend": [{"label": "Mon", "value": 30}, {"label": "Tue", "value": 45}],
        "top_items": [{"name": "Masala Dosa", "rating": 4.8, "category": "Meals"}]
    }

if __name__ == "__main__":
    print("🚀 Smart Anna FastAPI Backend Running on http://127.0.0.1:5000")
    # We use port 5000 to match the frontend config, though FastAPI defaults to 8000
    uvicorn.run(app, host="127.0.0.1", port=5000)

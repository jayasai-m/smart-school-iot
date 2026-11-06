import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

from .database.connection import engine, Base, SessionLocal
from .models.school import School
from .models.user import User
from .auth.security import hash_password
from .api.auth_routes import router as auth_router
from .api.admin_routes import router as admin_router
from .api.school_routes import router as school_router
from .api.hardware_routes import router as hardware_router
from .api.inspector_routes import router as inspector_router

# Create all database tables (including inspector_schools)
Base.metadata.create_all(bind=engine)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="SmartSchoolIoT API",
    description="Government School Water & Mid-Day Meal Monitoring System Backend",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads directory for images
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(school_router)
app.include_router(hardware_router)
app.include_router(inspector_router)

@app.on_event("startup")
def seed_initial_data():
    # STRICT SEEDING RULES:
    # 1. Only ONE initial school: 'ZPHS Poranki'.
    # 2. Only TWO initial accounts:
    #    - ADMIN: admin@gmail.com / abc123
    #    - SCHOOL: s1@gmail.com / abc123
    # 3. ZERO fake sensor data.
    # 4. ZERO fake alerts.
    # 5. ZERO fake meal data.
    # 6. ZERO fake images.

    # Ensure users.district column exists before any queries
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN district VARCHAR(100) NULL"))
            conn.commit()
    except Exception:
        pass

    db = SessionLocal()
    try:
        # Check if ZPHS Penamaluru exists (also handles old 'ZPHS Poranki' name if migrated)
        penamaluru = db.query(School).filter(
            School.name.in_(["ZPHS Penamaluru", "ZPHS Poranki"])
        ).first()
        if not penamaluru:
            penamaluru = School(
                name="ZPHS Penamaluru",
                school_code="SCH-PENAMALURU-001",
                district="Krishna",
                state="Andhra Pradesh",
                address="Z.P. High School, Penamaluru, Penamaluru Mandal, Krishna District, AP - 521139",
                principal_name="Smt. Sudha Rani (Headmistress)",
                email="s1@gmail.com",
                phone="+91 9876543210",
                status="ACTIVE",
                hardware_status="DISCONNECTED",
                hardware_device_id="ESP32-PENAMALURU-01",
                hardware_api_key="esp32_penamaluru_hw_key_2026",
                last_hardware_ping=None,
                tank_capacity_litres=2000.0,
                tank_height_cm=200.0,
                sensor_offset_cm=10.0,
                turbidity_threshold=5.0,
                low_water_threshold_pct=20.0,
                overflow_threshold_pct=90.0,
                humidity_threshold_pct=75.0
            )
            db.add(penamaluru)
            db.commit()
            db.refresh(penamaluru)
            print(">>> Seeded Initial School: ZPHS Penamaluru (ACTIVE)")
        else:
            penamaluru_id = penamaluru.id

        # Seed Admin account: admin@gmail.com / abc123
        admin_user = db.query(User).filter(User.email == "admin@gmail.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@gmail.com",
                hashed_password=hash_password("abc123"),
                full_name="State Monitoring Administrator",
                phone="+91 9900000001",
                role="ADMIN",
                status="ACTIVE",
                school_id=None
            )
            db.add(admin_user)
            db.commit()
            print(">>> Seeded Admin Account: admin@gmail.com / abc123")

        # Seed School account: s1@gmail.com / abc123
        school_user = db.query(User).filter(User.email == "s1@gmail.com").first()
        if not school_user:
            school_user = User(
                email="s1@gmail.com",
                hashed_password=hash_password("abc123"),
                full_name="ZPHS Penamaluru - Headmistress Sudha Rani",
                phone="+91 9876543210",
                role="SCHOOL",
                status="ACTIVE",
                school_id=penamaluru.id
            )
            db.add(school_user)
            db.commit()
            print(">>> Seeded School Account: s1@gmail.com / abc123 (ZPHS Penamaluru)")

        # Ensure users.district exists
        from sqlalchemy import text
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN district VARCHAR(100) NULL"))
                conn.commit()
        except Exception:
            pass

        # Seed initial Inspector account: inspector@gmail.com / abc123
        inspector_user = db.query(User).filter(User.email == "inspector@gmail.com").first()
        if not inspector_user:
            inspector_user = User(
                email="inspector@gmail.com",
                hashed_password=hash_password("abc123"),
                full_name="Inspector K. Ramesh (Mandal Educational Officer)",
                phone="+91 9848022334",
                district="Krishna District",
                role="INSPECTOR",
                status="ACTIVE",
                school_id=None
            )
            db.add(inspector_user)
            db.commit()
            db.refresh(inspector_user)
            # Assign penamaluru to this initial inspector
            if penamaluru not in inspector_user.assigned_schools:
                inspector_user.assigned_schools.append(penamaluru)
                db.commit()
            print(">>> Seeded Initial Inspector Account: inspector@gmail.com / abc123 (Assigned to ZPHS Penamaluru)")

    finally:
        db.close()

@app.get("/")
def root():
    return {
        "system": "SmartSchoolIoT",
        "description": "Government School Water & Mid-Day Meal Monitoring System",
        "status": "online",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

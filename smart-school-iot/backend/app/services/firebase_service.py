import os
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

FIREBASE_DATABASE_URL = os.getenv("FIREBASE_DATABASE_URL", "")
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS_PATH", "")

_firebase_initialized = False

def init_firebase():
    global _firebase_initialized
    if _firebase_initialized:
        return True
    if not FIREBASE_DATABASE_URL and not FIREBASE_CREDENTIALS_PATH:
        return False
    try:
        import firebase_admin
        from firebase_admin import credentials
        if FIREBASE_CREDENTIALS_PATH and os.path.exists(FIREBASE_CREDENTIALS_PATH):
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred, {
                'databaseURL': FIREBASE_DATABASE_URL
            })
        elif FIREBASE_DATABASE_URL:
            firebase_admin.initialize_app(options={
                'databaseURL': FIREBASE_DATABASE_URL
            })
        _firebase_initialized = True
        return True
    except Exception as e:
        print(f"Firebase initialization notice: {e}")
        return False

def sync_telemetry_to_firebase(school_code: str, telemetry_data: dict):
    """
    Syncs live sensor telemetry to Firebase Realtime Database under:
    /schools/{school_code}/live_telemetry
    """
    if not init_firebase():
        return False
    try:
        from firebase_admin import db
        ref = db.reference(f'schools/{school_code}/live_telemetry')
        payload = telemetry_data.copy()
        payload['synced_at'] = datetime.utcnow().isoformat()
        ref.set(payload)
        return True
    except Exception as e:
        print(f"Firebase sync notice: {e}")
        return False

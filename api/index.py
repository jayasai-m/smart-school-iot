import sys
import os
import shutil

# Determine paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "smart-school-iot", "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

import tempfile

# Signal Vercel environment
os.environ["VERCEL"] = "1"
tmp_dir = "/tmp" if os.name != "nt" else tempfile.gettempdir()
upload_dir = os.path.join(tmp_dir, "uploads")
os.environ["UPLOAD_DIR"] = upload_dir
os.makedirs(upload_dir, exist_ok=True)

# Copy bundled SQLite database to writable temp directory on cold start
tmp_db = os.path.join(tmp_dir, "smart_school.db")
src_db = os.path.join(BACKEND_DIR, "smart_school.db")
if not os.path.exists(tmp_db) and os.path.exists(src_db):
    try:
        shutil.copy(src_db, tmp_db)
        print(f">>> Copied pre-seeded smart_school.db to {tmp_db}")
    except Exception as e:
        print(f"Notice: Failed to copy SQLite db to temp: {e}")

from app.main import app

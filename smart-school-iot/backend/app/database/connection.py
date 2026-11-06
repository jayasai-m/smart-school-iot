import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///smart_school.db")

# Support Render Postgres URL format
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Ensure database exists if MySQL is used
if DATABASE_URL.startswith("mysql"):
    try:
        import pymysql
        # parse host, user, password, port from URL
        # format: mysql+pymysql://root:abc123@localhost:3306/smart_school_iot
        raw = DATABASE_URL.replace("mysql+pymysql://", "").replace("mysql://", "")
        auth_part, db_part = raw.split("/", 1)
        db_name = db_part.split("?")[0]
        user_pass, host_port = auth_part.split("@", 1)
        user, password = user_pass.split(":", 1)
        host = host_port.split(":")[0]
        port = int(host_port.split(":")[1]) if ":" in host_port else 3306

        conn = pymysql.connect(host=host, user=user, password=password, port=port)
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        conn.close()
    except Exception as e:
        print(f"Notice: MySQL auto-create check: {e}")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

try:
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
        pool_recycle=3600 if DATABASE_URL.startswith("mysql") else -1
    )
    with engine.connect() as test_conn:
        pass
except Exception as e:
    print(f"Notice: Primary DB connection failed ({e}). Falling back to local SQLite database.")
    DATABASE_URL = "sqlite:///smart_school.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

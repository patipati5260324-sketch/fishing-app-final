from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

import sqlite3

DB = "fishing.db"

def get_conn():
    return sqlite3.connect(DB)

DATABASE_URL = "sqlite:///./fishing.db"

def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fish TEXT,
            size INTEGER,
            place TEXT,
            lat REAL,
            lon REAL,
            image_path TEXT,
            created_at TEXT,
            likes INTEGER DEFAULT 0,
            user_name TEXT,
            weather TEXT,
            temperature REAL,
            wind_speed REAL,
            wind_direction TEXT

        )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        UNIQUE(post_id, user_id)
    )
    """)

    cur.execute("DROP TABLE IF EXISTS users")

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL
        )
    """)

    cur.execute("""
        INSERT OR IGNORE INTO users (student_id, name)
        VALUES (?, ?)
    """, ("7023911", "管理者"))

  
    cur.execute("""
        CREATE TABLE IF NOT EXISTS points (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            created_by TEXT,
            forecast_code TEXT NOT NULL,
            amedas_code TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# ★ これが無いのが原因
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
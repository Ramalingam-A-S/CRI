"""
backend/core/db.py - SQLite Database Manager for Persistent Hotspots and Sensors
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "cri.db")

def get_db_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Hotspots table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hotspots (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            hazard_tag TEXT NOT NULL,
            geometry TEXT NOT NULL,
            notes TEXT,
            elevation REAL DEFAULT 70.0,
            slope REAL DEFAULT 2.0,
            created_at TEXT NOT NULL
        )
    """)

    # Sensors table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sensors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            readings TEXT DEFAULT '{}',
            unit TEXT DEFAULT '',
            status TEXT DEFAULT 'ONLINE',
            quality_score REAL DEFAULT 1.0,
            anomalies TEXT DEFAULT '[]',
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()

# Auto-initialize on module load
init_db()

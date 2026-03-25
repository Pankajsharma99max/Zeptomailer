import sqlite3
import os
import logging
from contextlib import contextmanager

logger = logging.getLogger(__name__)

# Persistent storage directory
DATA_DIR = os.environ.get("CERTFLOW_DATA_DIR", "/tmp/certflow_data")
DB_PATH = os.path.join(DATA_DIR, "certflow.db")

def _ensure_dir():
    os.makedirs(DATA_DIR, exist_ok=True)

_ensure_dir()

def get_connection():
    """Get a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@contextmanager
def db_cursor():
    """Provide a transactional scope around a series of operations."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        yield cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def init_db():
    with db_cursor() as cursor:
        # Users Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL
            )
        """)
        
        # Sessions Table (Simple token based auth)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at REAL NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """)
        
        # Campaigns Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS campaigns (
                id TEXT PRIMARY KEY,
                creator_id TEXT NOT NULL,
                status TEXT NOT NULL,
                config TEXT NOT NULL,
                created_at REAL NOT NULL,
                total_count INTEGER DEFAULT 0,
                last_sent_count INTEGER DEFAULT 0,
                FOREIGN KEY(creator_id) REFERENCES users(id)
            )
        """)

        # App Settings Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)
    
    # Initialize default settings if they don't exist
    from config import get_settings
    settings = get_settings()
    with db_cursor() as cursor:
        cursor.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)", ("sender_name", settings.SENDER_NAME))

    logger.info("Database initialized.")

# Call init_db on module import to ensure tables exist
init_db()

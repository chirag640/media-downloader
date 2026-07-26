from __future__ import annotations

import json
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "mediadrop.db"


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def init_db() -> None:
    with get_db_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                stage TEXT,
                progress REAL,
                message TEXT,
                filename TEXT,
                job_dir TEXT,
                path TEXT,
                error TEXT,
                failures TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS history (
                id TEXT PRIMARY KEY,
                title TEXT,
                uploader TEXT,
                thumbnail TEXT,
                filename TEXT,
                url TEXT,
                timestamp TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS presets (
                name TEXT PRIMARY KEY,
                mode TEXT,
                quality TEXT,
                audio_bitrate TEXT,
                audio_format TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()


def save_job_record(
    job_id: str,
    status: str,
    stage: str = "connecting",
    progress: float | None = None,
    message: str = "",
    filename: str | None = None,
    job_dir: str | None = None,
    path: str | None = None,
    error: str | None = None,
    failures: list | None = None,
) -> None:
    failures_json = json.dumps(failures or [])
    with get_db_connection() as conn:
        conn.execute(
            """
            INSERT INTO jobs (job_id, status, stage, progress, message, filename, job_dir, path, error, failures, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(job_id) DO UPDATE SET
                status=excluded.status,
                stage=excluded.stage,
                progress=COALESCE(excluded.progress, jobs.progress),
                message=excluded.message,
                filename=COALESCE(excluded.filename, jobs.filename),
                job_dir=COALESCE(excluded.job_dir, jobs.job_dir),
                path=COALESCE(excluded.path, jobs.path),
                error=COALESCE(excluded.error, jobs.error),
                failures=excluded.failures,
                updated_at=CURRENT_TIMESTAMP;
            """,
            (job_id, status, stage, progress, message, filename, job_dir, path, error, failures_json),
        )
        conn.commit()


def get_job_record(job_id: str) -> dict | None:
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
        if not row:
            return None
        data = dict(row)
        if data.get("failures"):
            try:
                data["failures"] = json.loads(data["failures"])
            except Exception:
                data["failures"] = []
        return data


def save_history_item(item: dict) -> None:
    with get_db_connection() as conn:
        conn.execute(
            """
            INSERT INTO history (id, title, uploader, thumbnail, filename, url, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                title=excluded.title,
                uploader=excluded.uploader,
                thumbnail=excluded.thumbnail,
                filename=excluded.filename,
                url=excluded.url,
                timestamp=excluded.timestamp;
            """,
            (
                item.get("id"),
                item.get("title"),
                item.get("uploader"),
                item.get("thumbnail"),
                item.get("filename"),
                item.get("url"),
                item.get("timestamp"),
            ),
        )
        conn.commit()


def get_history_items(query: str | None = None, platform: str | None = None, limit: int = 15) -> list[dict]:
    with get_db_connection() as conn:
        sql = "SELECT id, title, uploader, thumbnail, filename, url, timestamp FROM history WHERE 1=1"
        params = []
        if query:
            sql += " AND (title LIKE ? OR uploader LIKE ?)"
            params.extend([f"%{query}%", f"%{query}%"])
        sql += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        rows = conn.execute(sql, params).fetchall()
        return [dict(row) for row in rows]


def clear_history_items() -> None:
    with get_db_connection() as conn:
        conn.execute("DELETE FROM history;")
        conn.commit()


# Initialize database schema on module load
init_db()

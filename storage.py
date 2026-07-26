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
        # Performance indexes for frequently queried columns
        conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_jobs_updated ON jobs(updated_at);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_history_created ON history(created_at);")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_history_url ON history(url);")
        # Enable WAL mode and auto-vacuum for performance
        conn.execute("PRAGMA auto_vacuum=INCREMENTAL;")
        conn.commit()
        # Incremental vacuum to reclaim space from deleted records
        conn.execute("PRAGMA incremental_vacuum;")
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


# ─────────────────────────────────────────────
# Presets CRUD
# ─────────────────────────────────────────────
DEFAULT_PRESETS = [
    {"name": "YouTube 1080p MP4", "mode": "video", "quality": "1080", "audio_bitrate": "192", "audio_format": "mp3"},
    {"name": "Podcast MP3 320k", "mode": "audio", "quality": "best", "audio_bitrate": "320", "audio_format": "mp3"},
    {"name": "Instagram Reel", "mode": "video", "quality": "best", "audio_bitrate": "192", "audio_format": "mp3"},
    {"name": "TikTok Download", "mode": "video", "quality": "best", "audio_bitrate": "192", "audio_format": "mp3"},
    {"name": "Audio Only 128k", "mode": "audio", "quality": "best", "audio_bitrate": "128", "audio_format": "mp3"},
    {"name": "GIF Meme", "mode": "gif", "quality": "best", "audio_bitrate": "192", "audio_format": "mp3"},
]


def _ensure_default_presets() -> None:
    with get_db_connection() as conn:
        for preset in DEFAULT_PRESETS:
            conn.execute(
                "INSERT OR IGNORE INTO presets (name, mode, quality, audio_bitrate, audio_format) VALUES (?, ?, ?, ?, ?)",
                (preset["name"], preset["mode"], preset["quality"], preset["audio_bitrate"], preset["audio_format"]),
            )
        conn.commit()


def get_all_presets() -> list[dict]:
    with get_db_connection() as conn:
        rows = conn.execute("SELECT name, mode, quality, audio_bitrate, audio_format FROM presets ORDER BY created_at").fetchall()
        return [dict(row) for row in rows]


def save_preset(name: str, mode: str, quality: str, audio_bitrate: str, audio_format: str) -> None:
    with get_db_connection() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO presets (name, mode, quality, audio_bitrate, audio_format) VALUES (?, ?, ?, ?, ?)",
            (name, mode, quality, audio_bitrate, audio_format),
        )
        conn.commit()


def delete_preset(name: str) -> None:
    with get_db_connection() as conn:
        conn.execute("DELETE FROM presets WHERE name = ?", (name,))
        conn.commit()


# Initialize database schema on module load
init_db()
_ensure_default_presets()

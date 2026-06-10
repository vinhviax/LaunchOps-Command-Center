from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parent / "launchops.db"
SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_db() -> None:
    import seed_db

    with connect() as conn:
        conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        count = conn.execute("SELECT COUNT(*) AS count FROM launch_types").fetchone()["count"]
    if count == 0:
        seed_db.seed(DB_PATH)


def list_launch_types() -> list[dict[str, Any]]:
    ensure_db()
    with connect() as conn:
        rows = conn.execute("SELECT id, name, domain, description, profile_json FROM launch_types ORDER BY id").fetchall()
    return [
        {"id": row["id"], "name": row["name"], "domain": row["domain"], "description": row["description"], "profile": json.loads(row["profile_json"])}
        for row in rows
    ]


def get_type_profile(type_id: str) -> dict[str, Any] | None:
    ensure_db()
    with connect() as conn:
        row = conn.execute("SELECT profile_json FROM launch_types WHERE id = ?", (type_id,)).fetchone()
    return json.loads(row["profile_json"]) if row else None


def get_product_snapshot(game_id: str, launch_type_id: str) -> dict[str, Any] | None:
    ensure_db()
    with connect() as conn:
        row = conn.execute(
            """
            SELECT snapshot_json FROM product_snapshots
            WHERE game_id = ? AND launch_type_id = ?
            ORDER BY created_at DESC, id DESC LIMIT 1
            """,
            (game_id, launch_type_id),
        ).fetchone()
    return json.loads(row["snapshot_json"]) if row else None


def find_lessons(brief: str, launch_type_id: str, game_id: str | None = None, limit: int = 3) -> list[dict[str, Any]]:
    ensure_db()
    lowered = brief.lower()
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT id, title, lesson, trigger_keywords, severity FROM lessons
            WHERE launch_type_id = ? AND (game_id IS NULL OR game_id = ?)
            ORDER BY promoted DESC, created_at DESC
            """,
            (launch_type_id, game_id),
        ).fetchall()
    matches: list[dict[str, Any]] = []
    for row in rows:
        keywords = [item.strip().lower() for item in row["trigger_keywords"].split(",") if item.strip()]
        if not keywords or any(keyword in lowered for keyword in keywords):
            matches.append({"id": row["id"], "title": row["title"], "lesson": row["lesson"], "severity": row["severity"]})
        if len(matches) >= limit:
            break
    return matches

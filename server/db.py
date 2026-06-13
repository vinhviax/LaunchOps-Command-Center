from __future__ import annotations

import json
import os
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).resolve().parent / "launchops.db"
SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"

CLOUD_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS launches (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT '',
  target_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  brief TEXT NOT NULL DEFAULT '',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS analysis_runs (
  id TEXT PRIMARY KEY,
  launch_id TEXT NOT NULL,
  result_json TEXT NOT NULL,
  agents_trace_json TEXT NOT NULL DEFAULT '[]',
  brief_snapshot TEXT NOT NULL DEFAULT '',
  score INTEGER,
  color TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  launch_type TEXT NOT NULL,
  active_version_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS template_versions (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  template_json TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS postmortems (
  id TEXT PRIMARY KEY,
  launch_id TEXT NOT NULL,
  status TEXT NOT NULL,
  post_launch_result TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons_index (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  launch_type TEXT NOT NULL,
  memory_record_id TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'Medium',
  created_at TEXT NOT NULL
);
"""

_CLOUD_SCHEMA_READY = False


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def storage_backend() -> str:
    backend = os.getenv("LAUNCHOPS_STORAGE_BACKEND", "local").strip().lower()
    return "cloud" if backend == "cloud" else "local"


def cloud_storage_requested() -> bool:
    return storage_backend() == "cloud"


def cloud_storage_configured() -> bool:
    return bool(os.getenv("LAUNCHOPS_DB_URL", "").strip())


def storage_backend_status() -> dict[str, Any]:
    return {
        "backend": storage_backend(),
        "dbUrlConfigured": cloud_storage_configured(),
    }


def _cloud_connect():
    db_url = os.getenv("LAUNCHOPS_DB_URL", "").strip()
    if not db_url:
        raise RuntimeError("LAUNCHOPS_DB_URL is not configured")
    try:
        import psycopg
        from psycopg.rows import dict_row
    except ImportError as exc:
        raise RuntimeError("psycopg is not installed") from exc

    timeout = int(os.getenv("LAUNCHOPS_DB_TIMEOUT_SECONDS", "5"))
    return psycopg.connect(db_url, connect_timeout=timeout, row_factory=dict_row)


def ensure_cloud_schema(force: bool = False) -> None:
    global _CLOUD_SCHEMA_READY
    if _CLOUD_SCHEMA_READY and not force:
        return
    with _cloud_connect() as conn:
        with conn.cursor() as cur:
            for statement in (part.strip() for part in CLOUD_SCHEMA_SQL.split(";")):
                if statement:
                    cur.execute(statement)
    _CLOUD_SCHEMA_READY = True


def _json_dumps(value: Any, fallback: Any = None) -> str:
    if value is None:
        value = {} if fallback is None else fallback
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _json_loads(value: Any, fallback: Any) -> Any:
    if value is None:
        return fallback
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(str(value))
    except (TypeError, json.JSONDecodeError):
        return fallback


def _slug(value: Any, fallback: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", str(value or "").lower()).strip("-")
    return slug[:72] or fallback


def _product_id(launch: dict[str, Any]) -> str:
    return _slug(launch.get("productId") or launch.get("gameId") or launch.get("product") or "demo", "demo")


def _template_id(product_id: str, launch_type: str) -> str:
    return f"{product_id}-{_slug(launch_type, 'launch')}"


class ProductRepository:
    def upsert_from_launch(self, cur: Any, launch: dict[str, Any]) -> str:
        product_id = _product_id(launch)
        name = str(launch.get("productName") or launch.get("gameId") or product_id).strip() or product_id
        stamp = str(launch.get("updatedAt") or now_iso())
        metadata = {
            "source": "launchops",
            "rawProduct": launch.get("product") or launch.get("gameId") or launch.get("productId") or "demo",
        }
        cur.execute(
            """
            INSERT INTO products(id, name, status, metadata_json, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              status = EXCLUDED.status,
              metadata_json = EXCLUDED.metadata_json,
              updated_at = EXCLUDED.updated_at
            """,
            (product_id, name, "active", _json_dumps(metadata), stamp, stamp),
        )
        return product_id


class AnalysisRepository:
    def list_for_launch(self, cur: Any, launch_id: str) -> list[dict[str, Any]]:
        cur.execute(
            """
            SELECT id, result_json, agents_trace_json, brief_snapshot, created_at
            FROM analysis_runs
            WHERE launch_id = %s
            ORDER BY created_at ASC, id ASC
            """,
            (launch_id,),
        )
        records: list[dict[str, Any]] = []
        for row in cur.fetchall():
            result = _json_loads(row.get("result_json"), {})
            if isinstance(result, dict) and "agentsTrace" not in result:
                result["agentsTrace"] = _json_loads(row.get("agents_trace_json"), [])
            records.append(
                {
                    "id": row.get("id"),
                    "createdAt": row.get("created_at"),
                    "briefSnapshot": row.get("brief_snapshot") or "",
                    "result": result,
                }
            )
        return records

    def insert(self, cur: Any, launch_id: str, analysis: dict[str, Any]) -> None:
        result = analysis.get("result") if isinstance(analysis.get("result"), dict) else {}
        decision = result.get("decision") if isinstance(result.get("decision"), dict) else {}
        trace = result.get("agentsTrace") or result.get("trace") or []
        cur.execute(
            """
            INSERT INTO analysis_runs(id, launch_id, result_json, agents_trace_json, brief_snapshot, score, color, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
              result_json = EXCLUDED.result_json,
              agents_trace_json = EXCLUDED.agents_trace_json,
              brief_snapshot = EXCLUDED.brief_snapshot,
              score = EXCLUDED.score,
              color = EXCLUDED.color,
              created_at = EXCLUDED.created_at
            """,
            (
                str(analysis.get("id") or f"analysis-{int(datetime.now(timezone.utc).timestamp() * 1000)}"),
                launch_id,
                _json_dumps(result),
                _json_dumps(trace, []),
                str(analysis.get("briefSnapshot") or "")[:2000],
                decision.get("score"),
                str(decision.get("color") or ""),
                str(analysis.get("createdAt") or now_iso()),
            ),
        )


class TemplateRepository:
    def upsert_from_launch(self, cur: Any, launch: dict[str, Any], product_id: str) -> None:
        template = launch.get("template") if isinstance(launch.get("template"), dict) else None
        if not template:
            return
        launch_type = str(launch.get("type") or "Game event")
        template_id = _template_id(product_id, launch_type)
        version_id = f"{template_id}-active"
        stamp = str(launch.get("updatedAt") or now_iso())
        version = max(1, len(launch.get("templateVersions") or []) + 1)
        cur.execute(
            """
            INSERT INTO templates(id, product_id, launch_type, active_version_id, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
              active_version_id = EXCLUDED.active_version_id,
              updated_at = EXCLUDED.updated_at
            """,
            (template_id, product_id, launch_type, version_id, stamp, stamp),
        )
        cur.execute(
            """
            INSERT INTO template_versions(id, template_id, version, template_json, created_by, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
              version = EXCLUDED.version,
              template_json = EXCLUDED.template_json,
              created_by = EXCLUDED.created_by,
              created_at = EXCLUDED.created_at
            """,
            (version_id, template_id, version, _json_dumps(template), str(launch.get("owner") or ""), stamp),
        )


class LessonRepository:
    def index_from_launch(self, cur: Any, launch: dict[str, Any], product_id: str) -> None:
        lessons = launch.get("lessonsLearned") if isinstance(launch.get("lessonsLearned"), list) else []
        launch_type = str(launch.get("type") or "Game event")
        for lesson in lessons:
            if not isinstance(lesson, dict):
                continue
            lesson_id = str(lesson.get("id") or "").strip()
            text = str(lesson.get("text") or "").strip()
            if not lesson_id or not text:
                continue
            cur.execute(
                """
                INSERT INTO lessons_index(id, product_id, launch_type, memory_record_id, title, severity, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                  title = EXCLUDED.title,
                  severity = EXCLUDED.severity
                """,
                (
                    lesson_id,
                    product_id,
                    launch_type,
                    str(lesson.get("memoryRecordId") or ""),
                    text[:120],
                    str(lesson.get("severity") or "Medium"),
                    str(lesson.get("createdAt") or now_iso()),
                ),
            )


class PostmortemRepository:
    def latest_for_launch(self, cur: Any, launch_id: str) -> dict[str, Any] | None:
        cur.execute(
            """
            SELECT id, status, post_launch_result, created_at
            FROM postmortems
            WHERE launch_id = %s
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """,
            (launch_id,),
        )
        return cur.fetchone()

    def upsert_from_launch(self, cur: Any, launch: dict[str, Any]) -> None:
        launch_id = str(launch.get("id") or "").strip()
        post_launch_result = str(launch.get("postLaunchResult") or "").strip()
        if not launch_id and not post_launch_result:
            return
        cur.execute(
            """
            INSERT INTO postmortems(id, launch_id, status, post_launch_result, created_at)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
              status = EXCLUDED.status,
              post_launch_result = EXCLUDED.post_launch_result,
              created_at = EXCLUDED.created_at
            """,
            (
                f"postmortem-{launch_id}",
                launch_id,
                str(launch.get("status") or "completed"),
                post_launch_result,
                str(launch.get("updatedAt") or now_iso()),
            ),
        )


class LaunchRepository:
    def __init__(self) -> None:
        self.products = ProductRepository()
        self.templates = TemplateRepository()
        self.analyses = AnalysisRepository()
        self.postmortems = PostmortemRepository()
        self.lessons = LessonRepository()

    def _row_to_launch(self, cur: Any, row: dict[str, Any]) -> dict[str, Any]:
        metadata = _json_loads(row.get("metadata_json"), {})
        postmortem = self.postmortems.latest_for_launch(cur, str(row.get("id") or ""))
        post_launch_result = ""
        if isinstance(metadata, dict):
            post_launch_result = str(metadata.get("postLaunchResult") or "")
        if postmortem:
            post_launch_result = str(postmortem.get("post_launch_result") or post_launch_result)
        return {
            "id": row.get("id"),
            "productId": row.get("product_id"),
            "name": row.get("name"),
            "type": row.get("type"),
            "status": row.get("status"),
            "owner": row.get("owner") or "",
            "targetDate": row.get("target_date") or "",
            "endDate": row.get("end_date") or "",
            "brief": row.get("brief") or "",
            "template": metadata.get("template") if isinstance(metadata, dict) else None,
            "templateVersions": metadata.get("templateVersions") if isinstance(metadata, dict) and isinstance(metadata.get("templateVersions"), list) else [],
            "lessonSuggestions": metadata.get("lessonSuggestions") if isinstance(metadata, dict) and isinstance(metadata.get("lessonSuggestions"), list) else [],
            "analyses": self.analyses.list_for_launch(cur, str(row.get("id") or "")),
            "postLaunchResult": post_launch_result,
            "lessonsLearned": metadata.get("lessonsLearned") if isinstance(metadata, dict) and isinstance(metadata.get("lessonsLearned"), list) else [],
            "createdAt": row.get("created_at"),
            "updatedAt": row.get("updated_at"),
        }

    def list(self) -> list[dict[str, Any]]:
        ensure_cloud_schema()
        with _cloud_connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM launches ORDER BY updated_at DESC, id ASC")
                rows = cur.fetchall()
                return [self._row_to_launch(cur, row) for row in rows]

    def get(self, launch_id: str) -> dict[str, Any] | None:
        ensure_cloud_schema()
        with _cloud_connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM launches WHERE id = %s", (launch_id,))
                row = cur.fetchone()
                return self._row_to_launch(cur, row) if row else None

    def upsert(self, launch: dict[str, Any]) -> dict[str, Any]:
        ensure_cloud_schema()
        with _cloud_connect() as conn:
            with conn.cursor() as cur:
                product_id = self.products.upsert_from_launch(cur, launch)
                self.templates.upsert_from_launch(cur, launch, product_id)
                self.lessons.index_from_launch(cur, launch, product_id)
                metadata = {
                    "template": launch.get("template") if isinstance(launch.get("template"), dict) else None,
                    "templateVersions": launch.get("templateVersions") if isinstance(launch.get("templateVersions"), list) else [],
                    "lessonSuggestions": launch.get("lessonSuggestions") if isinstance(launch.get("lessonSuggestions"), list) else [],
                    "lessonsLearned": launch.get("lessonsLearned") if isinstance(launch.get("lessonsLearned"), list) else [],
                    "postLaunchResult": str(launch.get("postLaunchResult") or ""),
                }
                cur.execute(
                    """
                    INSERT INTO launches(id, product_id, name, type, status, owner, target_date, end_date, brief, metadata_json, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                      product_id = EXCLUDED.product_id,
                      name = EXCLUDED.name,
                      type = EXCLUDED.type,
                      status = EXCLUDED.status,
                      owner = EXCLUDED.owner,
                      target_date = EXCLUDED.target_date,
                      end_date = EXCLUDED.end_date,
                      brief = EXCLUDED.brief,
                      metadata_json = EXCLUDED.metadata_json,
                      updated_at = EXCLUDED.updated_at
                    """,
                    (
                        str(launch.get("id") or ""),
                        product_id,
                        str(launch.get("name") or "Launch moi"),
                        str(launch.get("type") or "Game event"),
                        str(launch.get("status") or "upcoming"),
                        str(launch.get("owner") or ""),
                        str(launch.get("targetDate") or ""),
                        str(launch.get("endDate") or ""),
                        str(launch.get("brief") or ""),
                        _json_dumps(metadata),
                        str(launch.get("createdAt") or now_iso()),
                        str(launch.get("updatedAt") or now_iso()),
                    ),
                )
                if str(launch.get("postLaunchResult") or "").strip():
                    self.postmortems.upsert_from_launch(cur, launch)
        return self.get(str(launch.get("id") or "")) or launch

    def append_analysis(self, launch: dict[str, Any], analysis: dict[str, Any]) -> dict[str, Any]:
        ensure_cloud_schema()
        launch_id = str(launch.get("id") or "").strip()
        with _cloud_connect() as conn:
            with conn.cursor() as cur:
                product_id = self.products.upsert_from_launch(cur, launch)
                self.templates.upsert_from_launch(cur, launch, product_id)
                metadata = {
                    "template": launch.get("template") if isinstance(launch.get("template"), dict) else None,
                    "templateVersions": launch.get("templateVersions") if isinstance(launch.get("templateVersions"), list) else [],
                    "lessonSuggestions": launch.get("lessonSuggestions") if isinstance(launch.get("lessonSuggestions"), list) else [],
                    "lessonsLearned": launch.get("lessonsLearned") if isinstance(launch.get("lessonsLearned"), list) else [],
                    "postLaunchResult": str(launch.get("postLaunchResult") or ""),
                }
                cur.execute(
                    """
                    INSERT INTO launches(id, product_id, name, type, status, owner, target_date, end_date, brief, metadata_json, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                      product_id = EXCLUDED.product_id,
                      name = EXCLUDED.name,
                      type = EXCLUDED.type,
                      status = EXCLUDED.status,
                      owner = EXCLUDED.owner,
                      target_date = EXCLUDED.target_date,
                      end_date = EXCLUDED.end_date,
                      brief = EXCLUDED.brief,
                      metadata_json = EXCLUDED.metadata_json,
                      updated_at = EXCLUDED.updated_at
                    """,
                    (
                        launch_id,
                        product_id,
                        str(launch.get("name") or "Launch moi"),
                        str(launch.get("type") or "Game event"),
                        str(launch.get("status") or "upcoming"),
                        str(launch.get("owner") or ""),
                        str(launch.get("targetDate") or ""),
                        str(launch.get("endDate") or ""),
                        str(launch.get("brief") or ""),
                        _json_dumps(metadata),
                        str(launch.get("createdAt") or now_iso()),
                        str(launch.get("updatedAt") or now_iso()),
                    ),
                )
                self.analyses.insert(cur, launch_id, analysis)
        return self.get(launch_id) or launch

    def save_postmortem(self, launch: dict[str, Any]) -> dict[str, Any]:
        saved = self.upsert(launch)
        ensure_cloud_schema()
        with _cloud_connect() as conn:
            with conn.cursor() as cur:
                self.postmortems.upsert_from_launch(cur, launch)
                self.lessons.index_from_launch(cur, launch, _product_id(launch))
        return self.get(str(launch.get("id") or "")) or saved

    def delete(self, launch_id: str) -> bool:
        ensure_cloud_schema()
        with _cloud_connect() as conn:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM analysis_runs WHERE launch_id = %s", (launch_id,))
                cur.execute("DELETE FROM postmortems WHERE launch_id = %s", (launch_id,))
                cur.execute("DELETE FROM launches WHERE id = %s", (launch_id,))
                return cur.rowcount > 0


def cloud_list_launches() -> list[dict[str, Any]]:
    return LaunchRepository().list()


def cloud_get_launch(launch_id: str) -> dict[str, Any] | None:
    return LaunchRepository().get(launch_id)


def cloud_save_launch(launch: dict[str, Any]) -> dict[str, Any]:
    return LaunchRepository().upsert(launch)


def cloud_append_analysis(launch: dict[str, Any], analysis: dict[str, Any]) -> dict[str, Any]:
    return LaunchRepository().append_analysis(launch, analysis)


def cloud_save_postmortem(launch: dict[str, Any]) -> dict[str, Any]:
    return LaunchRepository().save_postmortem(launch)


def cloud_delete_launch(launch_id: str) -> bool:
    return LaunchRepository().delete(launch_id)


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

def save_launch_type(type_id: str, name: str, domain: str, description: str, profile: dict[str, Any]) -> dict[str, Any]:
    ensure_db()
    clean_id = _slug(type_id or name, "custom-launch-type")
    clean_name = str(name or clean_id).strip() or clean_id
    clean_domain = str(domain or "custom").strip() or "custom"
    clean_description = str(description or "").strip()
    clean_profile = dict(profile) if isinstance(profile, dict) else {}
    clean_profile.setdefault("id", clean_id)
    clean_profile.setdefault("name", clean_name)
    clean_profile.setdefault("type", clean_id)
    risk_groups = clean_profile.get("riskGroups") if isinstance(clean_profile.get("riskGroups"), list) else []
    max_score = sum(int(item.get("maxScore") or 0) for item in risk_groups if isinstance(item, dict))
    clean_profile["maxScore"] = max_score if max_score > 0 else int(clean_profile.get("maxScore") or 12)
    created_at = now_iso()
    with connect() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO launch_types(id, name, domain, description, profile_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (clean_id, clean_name, clean_domain, clean_description, json.dumps(clean_profile, ensure_ascii=False), created_at),
        )
    return {
        "id": clean_id,
        "name": clean_name,
        "domain": clean_domain,
        "description": clean_description,
        "profile": clean_profile,
    }


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

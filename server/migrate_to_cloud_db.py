from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

SERVER_DIR = Path(__file__).resolve().parent
APP_ROOT = SERVER_DIR.parent
LAUNCHES_DIR = APP_ROOT / "memory" / "launches"

if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

from db import cloud_append_analysis, cloud_save_launch, cloud_save_postmortem, cloud_storage_configured, cloud_storage_requested


def read_launch(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def migrate_launch(launch: dict[str, Any]) -> int:
    analyses = launch.get("analyses") if isinstance(launch.get("analyses"), list) else []
    saved = cloud_save_launch({**launch, "analyses": []})
    for analysis in analyses:
        if isinstance(analysis, dict):
            saved = cloud_append_analysis(saved, analysis)
    if str(launch.get("postLaunchResult") or "").strip() or launch.get("lessonsLearned"):
        cloud_save_postmortem({**saved, "postLaunchResult": launch.get("postLaunchResult", ""), "lessonsLearned": launch.get("lessonsLearned", [])})
    return len(analyses)


def main() -> int:
    if not cloud_storage_requested() or not cloud_storage_configured():
        print("Set LAUNCHOPS_STORAGE_BACKEND=cloud and LAUNCHOPS_DB_URL before running migration.", file=sys.stderr)
        return 2
    if not LAUNCHES_DIR.exists():
        print("No local launch JSON directory found.")
        return 0

    launch_count = 0
    analysis_count = 0
    for path in sorted(LAUNCHES_DIR.glob("*.json")):
        launch = read_launch(path)
        migrate_launch(launch)
        launch_count += 1
        analysis_count += len(launch.get("analyses") or [])

    print(f"Migrated {launch_count} launches and {analysis_count} analysis runs to cloud DB.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

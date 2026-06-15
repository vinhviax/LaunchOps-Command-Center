from __future__ import annotations

import argparse
import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parent
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

import app  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Reset local LaunchOps demo samples only.")
    parser.add_argument("--apply", action="store_true", help="Actually rewrite local demo sample files.")
    args = parser.parse_args()

    app.LAUNCHES_DIR.mkdir(parents=True, exist_ok=True)
    sample_ids = sorted(app.LEGACY_SAMPLE_IDS | app.DEMO_SAMPLE_IDS)

    for sample_id in sample_ids:
        path = app.launch_file(sample_id)
        if path.exists():
            print(f"{'remove' if args.apply else 'would remove'} {path.name}")
            if args.apply:
                path.unlink()

    for launch in app.default_sample_launches():
        path = app.launch_file(str(launch["id"]))
        print(f"{'write' if args.apply else 'would write'} {path.name}")
        if args.apply:
            app.write_json(path, launch)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

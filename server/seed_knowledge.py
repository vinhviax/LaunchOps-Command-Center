#!/usr/bin/env python3
"""Seed the LaunchOps RAG knowledge store with curated launch playbooks + optional local lessons.

WS1 (Phase 4.4). The knowledge store is SEPARATE from the conversation memory store.
Records are inserted per launch-type namespace (/launchops/knowledge/{launchType}) so
recall_knowledge() in app.py can ground each agent. Each record is tagged with the
agent role(s) it helps most, for the Phase 4.5 role-aware recall.

Usage (from server/ dir, with IAM creds available like any AgentBase call):
    LAUNCHOPS_KNOWLEDGE_MEMORY_ID=mem_xxx python seed_knowledge.py
    python seed_knowledge.py --memory-id mem_xxx --include-local

NEVER commit secrets. The memory id is passed via env/arg, not hardcoded.
"""

import argparse
import os
import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parent
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

import app  # noqa: E402

# Curated playbook knowledge per launch type. Each entry: a self-contained lesson string.
# Prefix [role=...] marks which agent the record helps most (readiness|redteam|checklist|postmortem|all).
CURATED: dict[str, list[str]] = {
    "lucky_spin_event": [
        "[role=readiness] Lucky Spin chỉ nên Green khi đã có KPI, segment, reset ngày, giới hạn lượt, reward cap, anti-abuse, CS FAQ, dashboard realtime và kill switch. Thiếu reward cap hoặc kill switch thì giữ Yellow.",
        "[role=redteam] Golden Spin tháng 5 từng phát sinh ticket vì reset 05:00 không rõ; red team phải hỏi case mất lượt, hết quà, phát quà chậm và người chơi khiếu nại trong giờ đầu.",
        "[role=redteam] Người săn exploit sẽ farm lượt quay bằng tài khoản phụ nếu thiếu tuổi tài khoản, giới hạn lượt/ngày, log thiết bị/IP và hàng chờ review.",
        "[role=checklist] Checklist Lucky Spin tối thiểu: reward cap + tỷ lệ trúng (Business, T-2), eligibility + anti-abuse log (Tech, T-1), CS FAQ/macro (CS Lead, T-1), dashboard spin/reward/ticket (Tech, T-1), kill switch + ngưỡng pause (LiveOps, T-1).",
        "[role=postmortem] Post-mortem Lucky Spin cần ghi login uplift, revenue uplift, reward cost vs cap, spin success, reward delivery, ticket CS theo case và abuse flags để template lần sau tốt hơn.",
    ],
    "game_event_h5": [
        "[role=readiness] Game event H5 chỉ nên Green khi đã có: owner rõ, ngày bật/tắt, reward cap, rule chống abuse, FAQ cho CS và phương án rollback. Thiếu reward cap hoặc rollback là Red gần như chắc chắn.",
        "[role=redteam] Exploit hunter thường farm vòng quay/quà bằng nhiều tài khoản hoặc lợi dụng điều kiện nạp; nếu brief không nêu eligibility + giới hạn lượt/ngày + log bất thường thì coi như hở.",
        "[role=redteam] Angry user nổi giận khi quay trúng nhưng không nhận được quà do lỗi hệ thống; cần thông điệp in-game, rule bồi thường và đường khiếu nại trước khi mở.",
        "[role=checklist] Checklist game event tối thiểu: chốt reward pool + cap ngân sách (Business Owner, T-2), rule chống abuse (Tech, T-1), CS macro + FAQ (CS Lead, T-1), feature flag + rollback (Tech, T-1), dashboard KPI realtime (Data, Launch day).",
        "[role=postmortem] Sau event hỏi: tỉ lệ tham gia vs dự kiến, chi phí reward thực tế vs cap, số ticket CS theo loại, có ai farm được không, có cần siết rule lần sau không.",
    ],
    "campaign": [
        "[role=readiness] Campaign marketing cần KPI đo được (CTR/CVR/CAC/ROAS), ngân sách + ngưỡng dừng, creative đã duyệt, tracking link/UTM gắn đúng. Thiếu tracking hoặc ngưỡng dừng ngân sách là rủi ro lớn.",
        "[role=redteam] Business owner khó duyệt go nếu không có baseline + mục tiêu số; growth dễ đốt ngân sách nếu thiếu guardrail tạm dừng khi CAC vượt ngưỡng.",
        "[role=checklist] Checklist campaign: chốt KPI + baseline (PM, T-2), guardrail ngân sách/ngưỡng dừng (Business, T-2), kiểm tra tracking/UTM/pixel (Data, T-1), duyệt creative + compliance (Legal/Brand, T-1), recap T+48h (PM).",
        "[role=postmortem] Post-mortem campaign: ROAS thực tế, kênh nào hiệu quả nhất, có vượt ngân sách không, creative nào thắng, lesson cho lần phân bổ ngân sách sau.",
    ],
    "feature_release": [
        "[role=readiness] Feature release cần: scope rõ, feature flag, tiêu chí rollback, monitor/alert, QA pass và kế hoạch rollout theo %. Không có feature flag hoặc tiêu chí rollback => không nên Green.",
        "[role=redteam] Tech on-call khó cứu sự cố nếu thiếu dashboard, alert ngưỡng rõ và runbook; cần xác định 'tín hiệu nào thì rollback' trước giờ release.",
        "[role=checklist] Checklist feature release: QA + regression pass (QA, T-2), feature flag + kill switch (Tech, T-1), dashboard + alert (SRE, T-1), rollout theo % + tiêu chí dừng (Tech, Launch day), thông báo nội bộ (Ops, T-1).",
        "[role=postmortem] Post-mortem feature: có lỗi production nào không, thời gian phát hiện/khắc phục, flag có hoạt động đúng không, metric adoption, nợ kỹ thuật còn lại.",
    ],
    "hotfix": [
        "[role=readiness] Hotfix ưu tiên tốc độ nhưng vẫn cần: xác nhận root cause, phạm vi ảnh hưởng, cách verify sau deploy và rollback nhanh. Hotfix mù (không rõ root cause) là rủi ro cao.",
        "[role=redteam] Tech on-call lo hotfix vá triệu chứng mà không vá gốc, hoặc gây regression vùng khác; cần smoke test vùng liên quan và theo dõi sát sau deploy.",
        "[role=checklist] Checklist hotfix: xác nhận root cause + phạm vi (Tech, ngay), patch + review nhanh (Tech, ngay), smoke test vùng ảnh hưởng (QA, ngay), deploy + verify + theo dõi 1-2h (SRE, ngay), hậu kiểm tạo ticket fix gốc (PM, T+1).",
        "[role=postmortem] Post-mortem hotfix: vì sao lọt bug, phát hiện qua đâu, MTTR, có regression không, action ngăn tái diễn (test/alert/process).",
    ],
    "generic": [
        "[role=all] Mọi launch cần tối thiểu: owner rõ ràng, mốc thời gian, tiêu chí thành công đo được, phương án rollback/dừng, và người chịu trách nhiệm xử lý sự cố. Thiếu owner hoặc rollback luôn là cờ đỏ.",
        "[role=readiness] Điểm readiness phản ánh mức độ brief trả lời được: mục tiêu, owner/deadline, kỹ thuật sẵn sàng, ảnh hưởng người dùng, ngân sách/guardrail, kế hoạch học lại. Mỗi nhóm thiếu bằng chứng là mất điểm.",
        "[role=postmortem] Post-mortem tốt luôn rút được 1-3 lesson cụ thể đưa vào template lần sau, không chỉ liệt kê việc đã xảy ra.",
    ],
}


# WS2: product-specific knowledge -> seeded into the per-product namespace
# /launchops/products/{gameId}/{launchType} so recall_knowledge can prefer product lessons.
PRODUCT_CURATED: dict[str, dict[str, list[str]]] = {
    "demo_game": {
        "lucky_spin_event": [
            "[role=readiness] (demo_game) Golden Spin tháng 5 Yellow vì thiếu reset 05:00, anti-abuse dashboard và ngưỡng pause; Golden Spin v2 chỉ Green khi các mục này nằm trong brief.",
            "[role=redteam] (demo_game) Có 37 tài khoản phụ từng farm lượt quay ở Golden Spin tháng 5; cần eligibility theo tuổi tài khoản, giới hạn lượt/ngày và log thiết bị/IP.",
            "[role=checklist] (demo_game) Trước Golden Spin phải tick: reward cap 150 triệu, item hiếm tắt ở 95% cap, CS macro mất lượt/hết quà/phát chậm, kill switch đã test staging.",
            "[role=postmortem] (demo_game) Sau Golden Spin ghi lại ticket CS theo case, reward delivery p95, abuse flag, chi phí reward và lesson cập nhật cho event tháng sau.",
        ],
        "game_event_h5": [
            "[role=readiness] (demo_game) Event H5 của demo_game trước đây Red khi thiếu reward cap; team luôn yêu cầu cap ngân sách + owner LiveOps rõ trước khi duyệt.",
            "[role=redteam] (demo_game) Sự cố cũ của demo_game: người chơi farm vòng quay bằng tài khoản phụ vào cuối tuần; cần eligibility theo tuổi tài khoản + giới hạn lượt/ngày.",
            "[role=postmortem] (demo_game) Lesson demo_game: luôn so chi phí reward thực tế với cap và ghi lại tỉ lệ ticket CS theo loại để chuẩn cho event sau.",
        ],
        "campaign": [
            "[role=readiness] (demo_game) Campaign demo_game cần gắn UTM + baseline CVR từ campaign trước; thiếu tracking là lý do số 1 khiến không đo được ROAS.",
        ],
    },
}


def insert_product_records(memory_id: str, game_id: str, launch_type: str, records: list[str]) -> int:
    namespace = app.knowledge_product_namespace(game_id, launch_type)
    inserted = 0
    for text in records:
        masked = app.mask_sensitive_text(text)
        try:
            app.agentbase_memory_request(
                "POST",
                f"/memories/{memory_id}/memory-records:insert-directly",
                {"memoryRecords": [masked]},
                {"namespace": namespace},
            )
            inserted += 1
        except Exception as exc:  # noqa: BLE001
            print(f"  ! insert failed ({game_id}/{launch_type}): {type(exc).__name__}: {exc}")
    print(f"  {game_id}/{launch_type}: inserted {inserted}/{len(records)} into {namespace}")
    return inserted


def insert_records(memory_id: str, launch_type: str, records: list[str]) -> int:
    namespace = app.knowledge_namespace(launch_type)
    inserted = 0
    for text in records:
        masked = app.mask_sensitive_text(text)
        try:
            app.agentbase_memory_request(
                "POST",
                f"/memories/{memory_id}/memory-records:insert-directly",
                {"memoryRecords": [masked]},
                {"namespace": namespace},
            )
            inserted += 1
        except Exception as exc:  # noqa: BLE001
            print(f"  ! insert failed ({launch_type}): {type(exc).__name__}: {exc}")
    print(f"  {launch_type}: inserted {inserted}/{len(records)} into {namespace}")
    return inserted


def collect_local_lessons() -> dict[str, list[str]]:
    """Best-effort: pull saved local lessons per launch type for the 'auto' half of seeding."""
    out: dict[str, list[str]] = {}
    try:
        launches = app.list_launches()
    except Exception:  # noqa: BLE001
        return out
    for launch in launches:
        lt = app.infer_launch_type(str(launch.get("brief") or ""), launch)
        for lesson in (launch.get("lessonsLearned") or []):
            text = str(lesson.get("text") or lesson.get("lesson") or "").strip()
            if text:
                out.setdefault(lt, []).append(f"[role=all] (lesson thực tế) {text}")
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed LaunchOps RAG knowledge store")
    parser.add_argument("--memory-id", default=os.getenv("LAUNCHOPS_KNOWLEDGE_MEMORY_ID", "").strip())
    parser.add_argument("--include-local", action="store_true", help="Also seed from saved local lessons")
    parser.add_argument("--product-only", action="store_true", help="Seed only the per-product records (skip launch-type)")
    parser.add_argument("--role", default="", help="Per-agent stores: seed only records for this role (readiness|redteam|checklist|postmortem); 'memory'/'all'/empty keep everything.")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be inserted, no API calls")
    args = parser.parse_args()

    def _keep(text: str) -> bool:
        role = (args.role or "").strip().lower()
        if not role or role in ("memory", "all"):
            return True
        rec_role, _ = app.parse_record_role(text)
        return rec_role in (role, "all")

    if not args.memory_id and not args.dry_run:
        print("ERROR: provide --memory-id or set LAUNCHOPS_KNOWLEDGE_MEMORY_ID (or use --dry-run).")
        return 1

    plan = {} if args.product_only else {lt: [r for r in recs if _keep(r)] for lt, recs in CURATED.items()}
    if args.include_local and not args.product_only:
        for lt, recs in collect_local_lessons().items():
            plan.setdefault(lt, []).extend([r for r in recs if _keep(r)])

    product_total = sum(len(recs) for bytype in PRODUCT_CURATED.values() for recs in bytype.values())
    total = sum(len(r) for r in plan.values())
    print(f"Seeding {total} launch-type + {product_total} product records into memory {args.memory_id or '(dry-run)'}")
    if args.dry_run:
        for lt, recs in plan.items():
            print(f"  {lt}: {len(recs)} records -> {app.knowledge_namespace(lt)}")
        for gid, bytype in PRODUCT_CURATED.items():
            for lt, recs in bytype.items():
                print(f"  {gid}/{lt}: {len(recs)} records -> {app.knowledge_product_namespace(gid, lt)}")
        return 0

    inserted = 0
    for lt, recs in plan.items():
        inserted += insert_records(args.memory_id, lt, recs)
    for gid, bytype in PRODUCT_CURATED.items():
        for lt, recs in bytype.items():
            kept = [r for r in recs if _keep(r)]
            if kept:
                inserted += insert_product_records(args.memory_id, gid, lt, kept)
    print(f"Done. Inserted {inserted}/{total + product_total} records.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

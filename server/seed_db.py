from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def profile(type_id: str, name: str, risk_labels: list[str]) -> dict[str, Any]:
    return {
        "id": type_id,
        "name": name,
        "type": type_id,
        "riskGroups": [{"label": label, "maxScore": 2} for label in risk_labels],
        "redTeamPersonas": ["Angry user", "Exploit hunter", "CS lead", "Tech on-call", "Business owner"],
        "checklistExamples": ["Chốt scope", "CS FAQ", "Rollback", "Monitoring", "Postmortem"],
        "postmortemBlocks": ["Câu hỏi sau launch", "Metrics cần điền", "Action items"],
        "maxScore": len(risk_labels) * 2,
    }


def lucky_spin_profile() -> dict[str, Any]:
    return {
        "id": "lucky_spin_event",
        "name": "Sự kiện Lucky Spin",
        "type": "lucky_spin_event",
        "riskGroups": [
            {"key": "scope", "label": "Mục tiêu và segment", "maxScore": 2, "checks": ["muc tieu", "kpi", "segment", "doi tuong", "level"], "missing": "Chưa rõ KPI, segment người chơi hoặc phạm vi áp dụng.", "requirements": ["KPI đo được", "Segment người chơi", "Phạm vi áp dụng"]},
            {"key": "spin_rule", "label": "Cơ chế quay và eligibility", "maxScore": 2, "checks": ["luot quay", "eligibility", "dieu kien", "reset", "gioi han"], "missing": "Chưa rõ cách nhận lượt quay, điều kiện hợp lệ, reset ngày hoặc giới hạn lượt.", "requirements": ["Rule nhận lượt quay", "Điều kiện hợp lệ", "Reset/giới hạn lượt"]},
            {"key": "reward", "label": "Reward cap và economy", "maxScore": 2, "checks": ["reward", "phan thuong", "ti le", "ngan sach", "cap"], "missing": "Chưa chốt reward cap, tỷ lệ trúng, ngân sách hoặc tác động economy.", "requirements": ["Reward cap", "Tỷ lệ trúng", "Ngân sách tối đa"]},
            {"key": "abuse", "label": "Anti-abuse và log", "maxScore": 2, "checks": ["abuse", "farm", "tai khoan phu", "log", "bat thuong"], "missing": "Chưa có rule chống farm, log bất thường hoặc cách xử lý exploit.", "requirements": ["Rule chống farm", "Log bất thường", "Owner xử lý abuse"]},
            {"key": "cs", "label": "CS và thông điệp", "maxScore": 2, "checks": ["faq", "cs", "macro", "in-game", "ticket"], "missing": "Thiếu CS FAQ, macro trả lời, thông điệp người chơi hoặc đường leo thang.", "requirements": ["CS FAQ", "Macro trả lời", "Thông điệp in-game"]},
            {"key": "tech", "label": "Rollback và monitoring", "maxScore": 2, "checks": ["rollback", "monitoring", "dashboard", "pause", "kill switch"], "missing": "Thiếu dashboard realtime, ngưỡng pause, rollback hoặc kill switch.", "requirements": ["Dashboard realtime", "Ngưỡng pause", "Rollback/kill switch"]},
        ],
        "redTeamPersonas": ["Người chơi bức xúc", "Người săn exploit", "CS Lead", "Tech on-call", "Business owner"],
        "checklistExamples": ["Reward cap", "Anti-abuse log", "CS FAQ", "Dashboard realtime", "Kill switch", "Postmortem"],
        "postmortemBlocks": ["Kết quả Golden Spin", "Rủi ro và vận hành", "Bài học cho event sau"],
        "maxScore": 12,
    }


GAME_RISKS = [
    "Mục tiêu và scope",
    "Owner và deadline",
    "Tech readiness",
    "User impact",
    "Business và reward",
    "Learning và post-mortem",
    "Product health",
    "Exploit và abuse",
    "CS và vận hành",
]

LUCKY_SPIN_RISKS = [
    "Mục tiêu và segment",
    "Cơ chế quay và eligibility",
    "Reward cap và economy",
    "Anti-abuse và log",
    "CS và thông điệp",
    "Rollback và monitoring",
]

WEBSHOP_RISKS = [
    "Mục tiêu và scope",
    "Owner và deadline",
    "Tech readiness",
    "User impact",
    "Business và reward",
    "Learning và post-mortem",
    "Payment và fulfillment",
    "Fraud và abuse",
    "Inventory và pricing",
]

MARKETING_RISKS = [
    "Mục tiêu và scope",
    "Owner và deadline",
    "Channel readiness",
    "Audience và message",
    "Budget và ROI",
    "Learning và post-mortem",
]


def seed(db_path: Path) -> None:
    with sqlite3.connect(db_path) as conn:
        conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        created_at = now_iso()
        types = [
            ("game_event_h5", "Game Event H5/Ingame", "game", "Sự kiện H5/Ingame cho game liveops.", profile("game_event_h5", "Game Event H5/Ingame", GAME_RISKS)),
            ("webshop_promotion", "Webshop Promotion", "game", "Promotion nạp gói/webshop.", profile("webshop_promotion", "Webshop Promotion", WEBSHOP_RISKS)),
            ("marketing", "Marketing Campaign", "marketing", "Khung campaign marketing cơ bản.", profile("marketing", "Marketing Campaign", MARKETING_RISKS)),
        ]
        conn.execute("DELETE FROM launch_types WHERE id = ?", ("lucky_spin_event",))
        conn.executemany(
            "INSERT OR REPLACE INTO launch_types(id, name, domain, description, profile_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            [(type_id, name, domain, desc, json.dumps(prof, ensure_ascii=False), created_at) for type_id, name, domain, desc, prof in types],
        )
        conn.execute(
            "DELETE FROM product_snapshots WHERE game_id = ? AND launch_type_id IN (?, ?, ?)",
            ("demo_game", "lucky_spin_event", "game_event_h5", "webshop_promotion"),
        )
        snapshots = [
            {
                "game_id": "demo_game",
                "launch_type_id": "lucky_spin_event",
                "snapshot": {
                    "gameId": "demo_game",
                    "dauTrend": "down_5_percent_7d",
                    "spinSuccessRate": "98.9%",
                    "rewardDeliveryP95": "7.8s",
                    "csTicketTrend": "up_18_percent_7d",
                    "abuseFlagTrend": "watch",
                    "hotFindings": [
                        "Golden Spin tháng 5 từng tăng ticket vì reset ngày chưa rõ.",
                        "Từng có 37 tài khoản phụ farm lượt quay khi thiếu eligibility.",
                        "Reward delivery cần dashboard realtime trong 30 phút đầu launch.",
                    ],
                },
            },
            {
                "game_id": "demo_game",
                "launch_type_id": "game_event_h5",
                "snapshot": {
                    "gameId": "demo_game",
                    "dauTrend": "down_8_percent_7d",
                    "crashRate": "1.8%",
                    "paymentSuccessRate": "96.2%",
                    "csTicketTrend": "up_22_percent_7d",
                    "hotFindings": [
                        "Crash rate hơi cao trên Android low-end.",
                        "Ticket về reward delay tăng trong 7 ngày gần nhất.",
                        "DAU đang giảm, event cần message rõ để kéo quay lại.",
                    ],
                },
            },
            {
                "game_id": "demo_game",
                "launch_type_id": "webshop_promotion",
                "snapshot": {
                    "gameId": "demo_game",
                    "paymentSuccessRate": "94.8%",
                    "refundTicketTrend": "up_18_percent_7d",
                    "topIssue": "Nạp thành công nhưng item vào game chậm.",
                    "hotFindings": [
                        "Payment success thấp hơn mức mong muốn cho sale lớn.",
                        "Cần reconciliation report trước khi mở promotion.",
                    ],
                },
            },
        ]
        conn.executemany(
            "INSERT INTO product_snapshots(game_id, launch_type_id, snapshot_json, created_at) VALUES (?, ?, ?, ?)",
            [(item["game_id"], item["launch_type_id"], json.dumps(item["snapshot"], ensure_ascii=False), created_at) for item in snapshots],
        )
        lessons = [
            ("lesson-golden-spin-reset", "lucky_spin_event", "demo_game", "Reset ngày phải ghi rõ", "Golden Spin tháng 5 tạo ticket vì brief không nói rõ reset 05:00 và ví dụ mất lượt.", "golden,spin,lucky,lượt quay,reset,cs,ticket", "High", 1, created_at),
            ("lesson-golden-spin-abuse", "lucky_spin_event", "demo_game", "Chống farm lượt quay trước launch", "Event spin cần eligibility theo tuổi tài khoản, giới hạn lượt/ngày và log thiết bị/IP bất thường trước khi mở.", "golden,spin,lucky,farm,abuse,tài khoản phụ,log", "High", 1, created_at),
            ("lesson-golden-spin-reward-cap", "lucky_spin_event", "demo_game", "Reward cap phải có ngưỡng pause", "Lucky Spin phải có reward cap, rule tắt item hiếm khi chạm 95% cap và ngưỡng pause nếu reward delivery lỗi.", "golden,spin,lucky,reward,cap,item hiếm,pause", "High", 1, created_at),
            ("lesson-h5-reward-delay", "game_event_h5", "demo_game", "Reward delay dễ tạo ticket", "Nếu event có quà quay thưởng, phải có monitoring reward delivery và macro CS trước launch.", "reward,quà,spin,quay,lucky", "High", 1, created_at),
            ("lesson-h5-low-end-crash", "game_event_h5", "demo_game", "Android low-end cần smoke test", "H5 event cần test trên Android low-end vì crash nhỏ có thể phá toàn bộ funnel.", "h5,ingame,event,android", "High", 1, created_at),
            ("lesson-webshop-reconcile", "webshop_promotion", "demo_game", "Webshop cần reconciliation", "Promotion webshop phải có reconciliation report giữa payment, order và item delivery.", "webshop,nạp,gói,payment,order", "High", 1, created_at),
            ("lesson-marketing-utm", "marketing", None, "Marketing cần UTM rõ", "Campaign marketing cần UTM và owner đo ROI ngay từ brief.", "marketing,ads,campaign,utm", "Medium", 1, created_at),
        ]
        conn.executemany(
            """
            INSERT OR REPLACE INTO lessons(id, launch_type_id, game_id, title, lesson, trigger_keywords, severity, promoted, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            lessons,
        )


if __name__ == "__main__":
    seed(Path(__file__).resolve().parent / "launchops.db")
    print("Seeded launchops.db")

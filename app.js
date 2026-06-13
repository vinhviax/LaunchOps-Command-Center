const badBrief = `# Bad launch brief mẫu

Tên launch: Lucky Wheel Weekend - sự kiện quay thưởng cuối tuần cho người chơi game.

Mục tiêu: Tăng số lượt đăng nhập và tăng doanh thu gói nạp nhỏ trong 3 ngày cuối tuần.

Nội dung: Người chơi đăng nhập mỗi ngày sẽ nhận 1 lượt quay miễn phí. Nếu nạp gói bất kỳ sẽ nhận thêm 3 lượt quay. Phần thưởng có thể là vật phẩm trong game, coupon, và một số item hiếm.

Thời gian: Dự kiến launch vào tối thứ Sáu. Chưa có giờ chính xác.

Đối tượng: Tất cả người chơi.

Kênh truyền thông: Thông báo trong game và post fanpage.

Phần thưởng: Chưa chốt tỷ lệ trúng. Có thể dùng item hiếm để tạo cảm giác hấp dẫn.

Vấn đề còn mở:
- Chưa có rollback plan nếu hệ thống quay thưởng lỗi.
- Chưa có FAQ cho CS.
- Chưa có owner trực cuối tuần.
- Chưa có ngưỡng dừng sự kiện nếu có bug nghiêm trọng.
- Chưa có test tải lượng truy cập cao.
- Chưa rõ điều kiện người chơi mới và người chơi cũ.
- Chưa rõ thông điệp nếu hết quà hoặc thay đổi tỷ lệ.
- Chưa có post-mortem template.`;

const rubric = [
  {
    key: "scope",
    label: "Mục tiêu và scope",
    checks: ["muc tieu", "doi tuong", "scope", "kpi", "level"],
    missing: "Mục tiêu, đối tượng hoặc scope còn mơ hồ."
  },
  {
    key: "owner",
    label: "Người phụ trách và hạn xử lý",
    checks: ["owner", "deadline", "pm", "lead", "truc"],
    missing: "Chưa thấy owner/deadline rõ cho các nhóm."
  },
  {
    key: "tech",
    label: "Sẵn sàng kỹ thuật",
    checks: ["test", "rollback", "monitoring", "nguong", "pause", "stop"],
    missing: "Thiếu test, monitoring, rollback hoặc ngưỡng dừng."
  },
  {
    key: "user",
    label: "User impact",
    checks: ["faq", "cs", "thong diep", "ticket", "khieu nai"],
    missing: "Thiếu FAQ/CS plan hoặc thông điệp cho người dùng."
  },
  {
    key: "business",
    label: "Business và reward",
    checks: ["reward", "phan thuong", "ngan sach", "ty le", "guardrail"],
    missing: "Reward, tỷ lệ hoặc ngân sách chưa đủ guardrail."
  },
  {
    key: "learning",
    label: "Bài học sau launch",
    checks: ["post-mortem", "lesson", "metrics", "bao cao"],
    missing: "Chưa có kế hoạch học lại sau launch."
  }
];

const redTeamPersonas = [
  {
    persona: "Angry user",
    worry: "Người chơi bị lỗi quay thưởng hoặc không nhận quà sẽ phàn nàn nhanh.",
    evidence: "Brief chưa có FAQ và cách xử lý nếu không nhận phần thưởng.",
    fix: "Tạo CS FAQ, thông điệp in-game, và rule bồi thường nếu hệ thống lỗi."
  },
  {
    persona: "Exploit hunter",
    worry: "Người chơi có thể tìm cách farm lượt quay hoặc lợi dụng điều kiện nạp.",
    evidence: "Brief ghi tất cả người chơi nhưng chưa rõ điều kiện người mới/cũ và giới hạn.",
    fix: "Chốt điều kiện tham gia, giới hạn lượt mỗi ngày, và log bất thường."
  },
  {
    persona: "CS lead",
    worry: "CS sẽ bị dồn ticket vào cuối tuần nếu launch lỗi.",
    evidence: "Brief chưa có owner trực cuối tuần và chưa có FAQ.",
    fix: "Gắn người phụ trách CS, ca trực, mẫu trả lời, và đường xử lý leo thang."
  },
  {
    persona: "Tech on-call",
    worry: "Nếu hệ thống quay lỗi, team không biết khi nào phải tắt event.",
    evidence: "Brief chưa có rollback plan, test tải, và ngưỡng dừng.",
    fix: "Đặt ngưỡng pause, monitoring dashboard, rollback script, và người có quyền quyết định."
  },
  {
    persona: "Business owner",
    worry: "Reward item hiếm có thể làm vượt ngân sách hoặc gây mất cân bằng.",
    evidence: "Brief chưa chốt tỷ lệ trúng và guardrail reward.",
    fix: "Chốt tỷ lệ, ngân sách tối đa, và review tác động economy trước launch."
  }
];

const checklistTemplate = [
  ["Chốt scope, đối tượng, KPI thành công", "PM LiveOps", "T-2 ngày", "Todo", "High"],
  ["Chốt reward, tỷ lệ, ngân sách", "Business + PM", "T-2 ngày", "Todo", "High"],
  ["Viết CS FAQ và macro trả lời", "CS Lead", "T-1 ngày", "Todo", "High"],
  ["Test tải với peak x2", "Tech Owner", "T-1 ngày", "Todo", "High"],
  ["Chốt rollback plan và ngưỡng pause", "Tech + LiveOps Lead", "T-1 ngày", "Todo", "High"],
  ["Mở war room và lịch trực cuối tuần", "LiveOps Lead", "T-1 ngày", "Todo", "Medium"],
  ["Tổng hợp metrics và post-mortem", "PM LiveOps", "T+48 giờ", "Todo", "Medium"]
];

const DEFAULT_BRIEF_GUIDE = [
  "Mục tiêu, KPI, đối tượng áp dụng.",
  "Thời gian chạy, người phụ trách, team trực.",
  "Cơ chế sự kiện/chiến dịch, phần thưởng, ngân sách, giới hạn.",
  "Câu hỏi thường gặp cho CS, thông điệp cho người dùng, rủi ro khiếu nại.",
  "Kiểm thử kỹ thuật, theo dõi hệ thống, phương án quay lại, ngưỡng dừng.",
  "Sau launch sẽ đo gì và ghi bài học ở đâu."
];

const GAME_EVENT_TEMPLATE = {
  name: "Game Event Launch",
  description: "Dùng cho event/campaign trong game có người chơi, phần thưởng, CS và rủi ro lách luật.",
  briefGuide: DEFAULT_BRIEF_GUIDE,
  riskGroups: rubric.map((item) => ({
    key: item.key,
    label: item.label,
    maxScore: 2,
    checks: item.checks,
    missing: item.missing,
    requirements: []
  })),
  redTeam: redTeamPersonas,
  checklist: checklistTemplate.map(([task, owner, deadline, status, priority]) => ({ task, owner, deadline, status, priority })),
  postmortem: [
    { title: "Câu hỏi sau launch", items: ["Mục tiêu ban đầu có đạt không?", "Rủi ro nào đã được bắt đúng trước launch?", "Rủi ro nào bị bỏ sót?", "CS có đủ FAQ để xử lý ticket không?"] },
    { title: "Chỉ số cần điền", items: ["DAU/login rate trong thời gian event", "Doanh thu gói nạp liên quan", "Số ticket CS và loại ticket", "Chi phí/phát thưởng thực tế"] },
    { title: "Bài học cho lần sau", items: ["Cần đổi rule, phần thưởng, timing hay thông điệp không?", "Có rủi ro lách luật mới cần thêm vào template không?"] }
  ]
};

const PRODUCTION_SYSTEM_TEMPLATE = {
  name: "Production System Release",
  description: "Dùng cho release hệ thống production, không mặc định có người phụ trách kinh doanh.",
  briefGuide: [
    "Mục tiêu release, phạm vi thay đổi, hệ thống bị ảnh hưởng.",
    "Thời gian deploy, người phụ trách, người trực sự cố.",
    "Kế hoạch test, rollout, monitoring và alert.",
    "Rollback plan, runbook incident, ngưỡng dừng.",
    "Ảnh hưởng tới user/service/data và phương án thông báo.",
    "Sau release đo uptime, lỗi, incident và bài học vận hành."
  ],
  riskGroups: [
    { key: "scope", label: "Phạm vi thay đổi", maxScore: 2, checks: ["muc tieu", "scope", "pham vi", "service", "he thong"], missing: "Chưa rõ phạm vi thay đổi, hệ thống bị ảnh hưởng hoặc mục tiêu release.", requirements: ["Mục tiêu release rõ", "Hệ thống/service bị ảnh hưởng", "Phạm vi thay đổi và ngoài phạm vi"] },
    { key: "owner", label: "Người phụ trách và trực sự cố", maxScore: 2, checks: ["owner", "on-call", "truc", "incident commander", "lead"], missing: "Chưa rõ người phụ trách, người trực sự cố hoặc người quyết định rollback.", requirements: ["Release owner", "On-call/SRE", "Người quyết định rollback"] },
    { key: "tech", label: "Test và rollout", maxScore: 2, checks: ["test", "qa", "rollout", "canary", "staging"], missing: "Thiếu kế hoạch test, rollout hoặc môi trường kiểm tra trước production.", requirements: ["Test plan", "Rollout/canary plan", "Kết quả staging/QA"] },
    { key: "monitoring", label: "Monitoring và alert", maxScore: 2, checks: ["monitoring", "dashboard", "alert", "log", "metric"], missing: "Thiếu dashboard, alert, log hoặc metric để biết release có lỗi.", requirements: ["Dashboard theo dõi", "Alert ngưỡng lỗi", "Log/metric cần kiểm tra"] },
    { key: "rollback", label: "Rollback và incident response", maxScore: 2, checks: ["rollback", "runbook", "incident", "pause", "stop"], missing: "Chưa có rollback plan, runbook incident hoặc ngưỡng dừng.", requirements: ["Rollback plan", "Runbook incident", "Ngưỡng dừng release"] },
    { key: "security", label: "Security và data", maxScore: 2, checks: ["security", "permission", "access", "data", "privacy"], missing: "Chưa thấy đánh giá security, quyền truy cập hoặc rủi ro dữ liệu.", requirements: ["Security review", "Quyền truy cập", "Rủi ro data/privacy"] },
    { key: "user", label: "Ảnh hưởng tới người dùng", maxScore: 2, checks: ["user", "customer", "downtime", "sla", "communication"], missing: "Chưa rõ user/service bị ảnh hưởng, downtime hoặc phương án thông báo.", requirements: ["User/service bị ảnh hưởng", "SLA/downtime dự kiến", "Thông báo nếu có sự cố"] },
    { key: "learning", label: "Post-release learning", maxScore: 2, checks: ["postmortem", "lesson", "metric", "report", "review"], missing: "Chưa có kế hoạch đo kết quả và rút bài học sau release.", requirements: ["Chỉ số sau release", "Câu hỏi post-release", "Nơi lưu bài học"] }
  ],
  redTeam: [
    { persona: "SRE on-call", worry: "Release gây lỗi production nhưng đội trực không có dashboard hoặc runbook rõ.", evidence: "Brief thiếu monitoring, alert, rollback hoặc phân công on-call.", fix: "Chốt dashboard, alert, runbook, người trực và kênh war room trước release." },
    { persona: "Security reviewer", worry: "Thay đổi có thể mở quyền truy cập sai hoặc rủi ro dữ liệu.", evidence: "Brief chưa có security/access/data review.", fix: "Thêm checklist security, kiểm tra quyền, log truy cập và data impact." },
    { persona: "Data owner", worry: "Migration hoặc thay đổi dữ liệu có thể gây mất, lệch hoặc khó khôi phục.", evidence: "Brief chưa nói backup, migration validation hoặc rollback data.", fix: "Chốt backup, validation query, người duyệt data và phương án khôi phục." },
    { persona: "Incident commander", worry: "Nếu release lỗi, team không biết ai quyết định rollback và ngưỡng rollback là gì.", evidence: "Brief thiếu incident owner, escalation path và stop condition.", fix: "Chỉ định incident commander, ngưỡng rollback và timeline xử lý." },
    { persona: "End user representative", worry: "User bị downtime hoặc lỗi nhưng không được thông báo rõ.", evidence: "Brief thiếu user impact, SLA và communication plan.", fix: "Thêm danh sách user/service bị ảnh hưởng, thông báo và FAQ nếu có downtime." }
  ],
  checklist: [
    { task: "Chốt phạm vi release và service bị ảnh hưởng", owner: "Release Owner", deadline: "T-2 ngày", status: "Todo", priority: "High" },
    { task: "Hoàn tất test plan, staging result và rollout plan", owner: "QA Lead", deadline: "T-1 ngày", status: "Todo", priority: "High" },
    { task: "Chuẩn bị dashboard, alert và log cần kiểm tra", owner: "SRE on-call", deadline: "T-1 ngày", status: "Todo", priority: "High" },
    { task: "Chốt rollback plan, runbook incident và người quyết định rollback", owner: "Incident Commander", deadline: "T-1 ngày", status: "Todo", priority: "High" },
    { task: "Review security, quyền truy cập và data impact", owner: "Security reviewer", deadline: "T-1 ngày", status: "Todo", priority: "Medium" },
    { task: "Tổng kết post-release: uptime, error rate, incident, lesson", owner: "Release Owner", deadline: "T+48 giờ", status: "Todo", priority: "Medium" }
  ],
  postmortem: [
    { title: "Kết quả production", items: ["Release có downtime không?", "Error rate/latency có vượt ngưỡng không?", "Có incident hoặc rollback không?"] },
    { title: "Vận hành sự cố", items: ["Alert có bắt đúng không?", "Runbook có đủ rõ không?", "Ai mất nhiều thời gian chờ quyết định?"] },
    { title: "Bài học release sau", items: ["Cần thêm test, alert, rollback hay security check nào vào template?", "Có bước nào nên tự động hóa trước release tiếp theo?"] }
  ]
};

const GENERIC_LAUNCH_TEMPLATE = {
  name: "Generic Launch",
  description: "Dùng cho launch không thuộc game event hoặc production release.",
  briefGuide: [
    "Mục tiêu, phạm vi, đối tượng bị ảnh hưởng.",
    "Người phụ trách, người duyệt, deadline.",
    "Kế hoạch triển khai, truyền thông và hỗ trợ.",
    "Rủi ro vận hành, pháp lý, quyền truy cập hoặc dữ liệu.",
    "Phương án quay lại nếu launch lỗi.",
    "Cách đo kết quả và ghi bài học."
  ],
  riskGroups: [
    { key: "scope", label: "Mục tiêu và phạm vi", maxScore: 2, checks: ["muc tieu", "pham vi", "doi tuong", "kpi"], missing: "Chưa rõ mục tiêu, phạm vi hoặc đối tượng ảnh hưởng.", requirements: ["Mục tiêu rõ", "Phạm vi rõ", "Tiêu chí thành công"] },
    { key: "owner", label: "Người phụ trách và deadline", maxScore: 2, checks: ["owner", "deadline", "lead", "duyet"], missing: "Chưa rõ người phụ trách, người duyệt hoặc deadline.", requirements: ["Owner chính", "Người duyệt", "Deadline"] },
    { key: "execution", label: "Kế hoạch triển khai", maxScore: 2, checks: ["ke hoach", "timeline", "rollout", "trien khai"], missing: "Chưa có kế hoạch triển khai đủ rõ.", requirements: ["Timeline", "Các bước triển khai", "Điều kiện go/no-go"] },
    { key: "support", label: "Hỗ trợ và truyền thông", maxScore: 2, checks: ["faq", "support", "cs", "truyen thong", "communication"], missing: "Thiếu kế hoạch hỗ trợ hoặc truyền thông cho người bị ảnh hưởng.", requirements: ["FAQ/support owner", "Thông điệp", "Kênh hỗ trợ"] },
    { key: "risk", label: "Rủi ro và phương án quay lại", maxScore: 2, checks: ["risk", "rui ro", "rollback", "fallback", "pause"], missing: "Chưa có rủi ro chính hoặc phương án quay lại.", requirements: ["Top risks", "Fallback/rollback", "Ngưỡng dừng"] },
    { key: "learning", label: "Bài học sau launch", maxScore: 2, checks: ["lesson", "postmortem", "metric", "bao cao"], missing: "Chưa rõ cách đo kết quả và lưu bài học.", requirements: ["Metric sau launch", "Câu hỏi tổng kết", "Nơi lưu bài học"] }
  ],
  redTeam: [
    { persona: "Người dùng bị ảnh hưởng", worry: "Người dùng không hiểu thay đổi hoặc bị gián đoạn.", evidence: "Brief thiếu đối tượng ảnh hưởng, thông báo hoặc FAQ.", fix: "Bổ sung audience, thông điệp, FAQ và kênh hỗ trợ." },
    { persona: "Người vận hành", worry: "Team vận hành không biết phải làm gì khi launch lỗi.", evidence: "Brief thiếu owner, escalation hoặc phương án quay lại.", fix: "Chốt owner, escalation path, rollback/fallback và ngưỡng dừng." },
    { persona: "Người duyệt rủi ro", worry: "Launch có rủi ro quyền truy cập, dữ liệu, pháp lý hoặc compliance.", evidence: "Brief chưa có phần review rủi ro ngoài vận hành.", fix: "Thêm checklist risk/compliance/data/privacy tùy bối cảnh." },
    { persona: "Người đo hiệu quả", worry: "Sau launch không biết có thành công hay không.", evidence: "Brief thiếu KPI, metric hoặc câu hỏi tổng kết.", fix: "Chốt metric, báo cáo sau launch và nơi lưu bài học." }
  ],
  checklist: [
    { task: "Chốt mục tiêu, phạm vi và tiêu chí thành công", owner: "Launch Owner", deadline: "T-2 ngày", status: "Todo", priority: "High" },
    { task: "Chốt owner, người duyệt và timeline triển khai", owner: "Launch Owner", deadline: "T-2 ngày", status: "Todo", priority: "High" },
    { task: "Chuẩn bị FAQ/thông báo cho người bị ảnh hưởng", owner: "Support Owner", deadline: "T-1 ngày", status: "Todo", priority: "Medium" },
    { task: "Chốt rủi ro chính và phương án quay lại", owner: "Ops Owner", deadline: "T-1 ngày", status: "Todo", priority: "High" },
    { task: "Tổng kết kết quả và bài học", owner: "Launch Owner", deadline: "T+48 giờ", status: "Todo", priority: "Medium" }
  ],
  postmortem: [
    { title: "Kết quả launch", items: ["Mục tiêu có đạt không?", "Ai bị ảnh hưởng nhiều nhất?", "Có vấn đề nào phát sinh không?"] },
    { title: "Vận hành", items: ["Owner/escalation có rõ không?", "Fallback có cần dùng không?", "Thông báo/support có đủ không?"] },
    { title: "Bài học", items: ["Lần sau cần thêm tiêu chí nào?", "Template này cần sửa gì?"] }
  ]
};

const LAUNCH_TEMPLATES = {
  "Game event": GAME_EVENT_TEMPLATE,
  "Production system release": PRODUCTION_SYSTEM_TEMPLATE,
  "Feature release": PRODUCTION_SYSTEM_TEMPLATE,
  "Campaign marketing": GENERIC_LAUNCH_TEMPLATE,
  "Internal tool": GENERIC_LAUNCH_TEMPLATE,
  "Ops/process change": GENERIC_LAUNCH_TEMPLATE,
  "Partnership/commercial launch": GENERIC_LAUNCH_TEMPLATE,
  "Emergency hotfix": PRODUCTION_SYSTEM_TEMPLATE
};
const PROTECTED_LAUNCH_TYPES = Object.freeze(Object.keys(LAUNCH_TEMPLATES));
const LAUNCH_TYPE_ORDER = [
  "Game event",
  "Campaign marketing",
  "Feature release",
  "Production system release",
  "Internal tool",
  "Ops/process change",
  "Partnership/commercial launch",
  "Emergency hotfix"
];

const TEMPLATE_OPERATORS = [
  {
    id: "vinhvnn",
    name: "VinhVNN",
    role: "Owner",
    access: "Template Admin",
    canEdit: true,
    scope: "Duyệt cấu hình, chỉnh tiêu chí, khôi phục mẫu chuẩn."
  },
  {
    id: "backend-pic",
    name: "Back-end PIC",
    role: "Prompt/API owner",
    access: "Template Admin",
    canEdit: true,
    scope: "Chỉnh khung rủi ro, nhóm phản biện, checklist và format output AI."
  },
  {
    id: "frontend-pic",
    name: "Front-end PIC",
    role: "UI owner",
    access: "Viewer",
    canEdit: false,
    scope: "Xem cấu hình để làm UI/UX, không đổi luật chấm."
  },
  {
    id: "launch-reviewer",
    name: "Launch Reviewer",
    role: "Reviewer",
    access: "Viewer",
    canEdit: false,
    scope: "Xem template và góp ý trong buổi review."
  }
];
const TEMPLATE_EDITING_LOCKED = true;
const ROLE_SWITCH_LOCKED = true;
const LOCKED_LAUNCH_ROLE = "human";
// Admin bật bằng URL ?role=admin (nhớ trong session); ?role=human để tắt.
const roleQueryParam = new URLSearchParams(window.location.search).get("role");
if (roleQueryParam === "admin") window.sessionStorage.setItem("launchops_admin", "1");
else if (roleQueryParam === "human") window.sessionStorage.removeItem("launchops_admin");
function adminSessionEnabled() {
  try {
    return window.sessionStorage.getItem("launchops_admin") === "1";
  } catch (error) {
    return false;
  }
}

function resolveApiBase() {
  const configuredApiBase = (window.LAUNCHOPS_API_BASE || "").trim();
  if (configuredApiBase) return configuredApiBase.replace(/\/$/, "");

  const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
  return localHosts.has(window.location.hostname) ? "http://127.0.0.1:8788/api" : "";
}

const API_BASE = resolveApiBase();
const STATUS_ORDER = ["running", "upcoming", "completed"];
const STATUS_LABELS = {
  running: "Đang chạy",
  upcoming: "Sắp chạy",
  completed: "Đã chạy"
};
const STATUS_HINTS = {
  running: "Launch đang active hoặc đang chuẩn bị sát giờ.",
  upcoming: "Launch chưa chạy, còn thời gian sửa brief.",
  completed: "Launch đã chạy xong, cần lưu kết quả và bài học."
};
const COLOR_LABELS = {
  Green: "Xanh",
  Yellow: "Vàng",
  Red: "Đỏ"
};
const STATUS_LABELS_EN = {
  running: "Running",
  upcoming: "Upcoming",
  completed: "Completed"
};
const COLOR_LABELS_EN = {
  Green: "Green",
  Yellow: "Yellow",
  Red: "Red"
};

function uiLang() {
  try {
    return localStorage.getItem("launchops_lang") || "vi";
  } catch (error) {
    return "vi";
  }
}

function tr(vi, en) {
  return uiLang() === "en" ? en : vi;
}

function statusDisplayLabel(status) {
  return uiLang() === "en"
    ? (STATUS_LABELS_EN[status] || status || "")
    : (STATUS_LABELS[status] || status || "");
}
const PERSONA_LABELS = {
  "Angry user": "Người chơi bức xúc",
  "Exploit hunter": "Người tìm cách lách luật",
  "CS lead": "Trưởng nhóm CS",
  "Tech on-call": "Kỹ thuật trực sự cố",
  "Business owner": "Người phụ trách kinh doanh",
  "SRE on-call": "SRE trực sự cố",
  "Security reviewer": "Người rà soát bảo mật",
  "Data owner": "Người phụ trách dữ liệu",
  "Incident commander": "Chỉ huy xử lý sự cố",
  "End user representative": "Đại diện người dùng cuối",
  "Economy reviewer": "Người rà soát Economy",
  "Người chơi bức xúc": "Người chơi bức xúc",
  "Người tìm cách lách luật": "Người tìm cách lách luật",
  "Trưởng nhóm CS": "Trưởng nhóm CS",
  "Kỹ thuật trực sự cố": "Kỹ thuật trực sự cố",
  "Người phụ trách kinh doanh": "Người phụ trách kinh doanh",
  "SRE trực sự cố": "SRE trực sự cố",
  "Người rà soát bảo mật": "Người rà soát bảo mật",
  "Người phụ trách dữ liệu": "Người phụ trách dữ liệu",
  "Chỉ huy xử lý sự cố": "Chỉ huy xử lý sự cố",
  "Đại diện người dùng cuối": "Đại diện người dùng cuối",
  "Người rà soát Economy": "Người rà soát Economy"
};
const STATUS_VALUE_LABELS = {
  Todo: "Cần làm",
  Doing: "Đang làm",
  Done: "Đã xong",
  Blocked: "Đang kẹt"
};
const PRIORITY_LABELS = {
  High: "Cao",
  Medium: "Vừa",
  Low: "Thấp"
};
const RISK_LABELS = {
  "Mục tiêu và scope": "Mục tiêu và phạm vi",
  "Owner và deadline": "Người phụ trách và hạn xử lý",
  "Tech readiness": "Sẵn sàng kỹ thuật",
  "User impact": "Ảnh hưởng tới người dùng",
  "Business và reward": "Kinh doanh và phần thưởng",
  "phần thưởng và economy impact": "Phần thưởng và Economy Impact",
  "Phần thưởng và economy impact": "Phần thưởng và Economy Impact",
  "Reward và economy impact": "Phần thưởng và Economy Impact",
  "Reward and economy impact": "Phần thưởng và Economy Impact",
  "Tech stability và exploit review": "Kỹ thuật Stability và Lách luật Review",
  "kỹ thuật stability và lách luật review": "Kỹ thuật Stability và Lách luật Review",
  "Learning và post-mortem": "Bài học sau launch"
};
const RISK_REQUIREMENTS = {
  scope: [
    "Mục tiêu launch rõ",
    "Đối tượng áp dụng rõ",
    "KPI hoặc tiêu chí thành công"
  ],
  owner: [
    "Người phụ trách chính",
    "Deadline từng việc",
    "Người có quyền quyết định dừng/sửa"
  ],
  tech: [
    "Kế hoạch test",
    "Theo dõi lỗi khi chạy",
    "Phương án rollback hoặc ngưỡng dừng"
  ],
  user: [
    "Thông điệp cho người dùng",
    "FAQ cho CS",
    "Cách xử lý khi người dùng khiếu nại"
  ],
  business: [
    "Tỷ lệ/phần thưởng/ngân sách",
    "Giới hạn chống lạm dụng",
    "Ảnh hưởng tới doanh thu hoặc economy"
  ],
  learning: [
    "Chỉ số cần đo sau launch",
    "Câu hỏi tổng kết",
    "Nơi lưu bài học cho lần sau"
  ]
};
GAME_EVENT_TEMPLATE.riskGroups = GAME_EVENT_TEMPLATE.riskGroups.map((group) => ({
  ...group,
  requirements: RISK_REQUIREMENTS[group.key] || []
}));
const OWNER_LABELS = {
  "Business owner": "Phụ trách kinh doanh",
  "Business Owner": "Phụ trách kinh doanh",
  "Game Economy Owner": "Phụ trách Economy Game",
  "Tech Lead": "Lead kỹ thuật",
  "Tech Owner": "Phụ trách kỹ thuật",
  "Tech on-call": "Kỹ thuật trực sự cố",
  "QA Lead": "Lead QA",
  "CS Lead": "Lead CS",
  "LiveOps Lead": "Lead LiveOps"
};
const TYPE_LABELS = {
  "Game event": "Sự kiện game",
  "Campaign marketing": "Chiến dịch marketing",
  "Feature release": "Ra mắt tính năng",
  "Production system release": "Release hệ thống production",
  "Internal tool": "Công cụ nội bộ",
  "Ops/process change": "Thay đổi quy trình vận hành",
  "Partnership/commercial launch": "Hợp tác / thương mại",
  "Emergency hotfix": "Hotfix khẩn cấp"
};

const TEMPLATE_NAME_LABELS = {
  "Game Event Launch": "Template sự kiện game",
  "Production System Release": "Template release hệ thống",
  "Generic Launch": "Template launch chung"
};
const BASE_TEMPLATE_OPTIONS = [
  { id: "gameEvent", template: GAME_EVENT_TEMPLATE },
  { id: "production", template: PRODUCTION_SYSTEM_TEMPLATE },
  { id: "generic", template: GENERIC_LAUNCH_TEMPLATE }
];
const PROTECTED_BASE_TEMPLATE_IDS = Object.freeze(BASE_TEMPLATE_OPTIONS.map((item) => item.id));

const marketingCampaignBrief = `Tên launch: Midweek Top-up Campaign - chiến dịch nạp giữa tuần cho nhóm người chơi trả phí thấp và trung bình.

Mục tiêu: Tăng doanh thu gói nạp nhỏ trong 4 ngày, kích hoạt lại người chơi có lịch sử nạp nhưng 14 ngày gần nhất chưa nạp.

Thời gian: Dự kiến chạy từ 15/06/2026 đến 18/06/2026.

Đối tượng: Người chơi level 20 trở lên, từng nạp trong 90 ngày gần nhất, không thuộc nhóm refund/abuse.

Offer: Nạp gói 99k hoặc 199k nhận thêm coupon và vật phẩm tiêu hao. Có giới hạn 1 lần/ngày/người chơi.

Kênh truyền thông: In-game popup, inbox, fanpage post và push notification.

Việc đã có:
- Growth phụ trách target segment và tracking.
- Business phụ trách ngân sách ưu đãi.
- LiveOps phụ trách lịch chạy trong game.

Vấn đề còn mở:
- Chưa chốt ngân sách coupon tối đa.
- Chưa có guardrail nếu doanh thu tăng nhưng refund cũng tăng.
- Chưa có CS FAQ về điều kiện nhận coupon.
- Chưa chốt dashboard theo dõi conversion, refund, coupon claim.
- Chưa có ngưỡng dừng nếu coupon bị nhận sai hoặc claim trùng.
- Chưa chốt post-campaign report sau 48 giờ.`;

const mayLoginStreakBrief = `Tên launch: May Login Streak - sự kiện đăng nhập 7 ngày liên tiếp trong tháng 5.

Trạng thái: Đã chạy xong từ 28/05/2026 đến 31/05/2026.

Mục tiêu ban đầu:
- Tăng tỷ lệ quay lại game trong nhóm người chơi casual.
- Khuyến khích người chơi đăng nhập đủ 7 ngày để nhận reward cuối.
- Giữ chi phí reward thấp, không ảnh hưởng economy.

Đối tượng: Người chơi level 10 trở lên, không yêu cầu nạp.

Cơ chế: Mỗi ngày đăng nhập nhận một phần quà nhỏ. Nếu đủ chuỗi 7 ngày, người chơi nhận thêm rương tổng kết.

Kết quả thực tế:
- Login rate tăng nhẹ trong 2 ngày đầu.
- Ticket CS tăng trong 6 giờ đầu vì một số người chơi hiểu nhầm điều kiện reset ngày.
- Reward không vượt ngân sách.
- Không có lỗi nghiêm trọng về hệ thống.

Điểm thiếu khi chuẩn bị:
- FAQ cho CS có nhưng chưa giải thích rõ mốc reset ngày.
- In-game message chưa nói rõ đăng nhập phải liên tục, không được bỏ ngày.
- Chưa có ngưỡng pause nếu hệ thống ghi nhận login sai.
- Post-mortem ban đầu chưa có câu hỏi về hiểu nhầm điều kiện event.`;

const fallbackLaunches = [
  {
    id: "lucky-wheel-weekend",
    name: "Lucky Wheel Weekend",
    type: "Game event",
    status: "running",
    owner: "PM LiveOps",
    targetDate: "2026-06-12",
    endDate: "2026-06-14",
    brief: badBrief,
    analyses: [],
    postLaunchResult: "",
    lessonsLearned: []
  },
  {
    id: "midweek-topup-campaign",
    name: "Midweek Top-up Campaign",
    type: "Campaign marketing",
    status: "upcoming",
    owner: "Growth + Business",
    targetDate: "2026-06-15",
    endDate: "2026-06-18",
    brief: marketingCampaignBrief,
    analyses: [],
    postLaunchResult: "",
    lessonsLearned: []
  },
  {
    id: "may-login-streak",
    name: "May Login Streak",
    type: "Game event",
    status: "completed",
    owner: "LiveOps Lead",
    targetDate: "2026-05-28",
    endDate: "2026-05-31",
    brief: mayLoginStreakBrief,
    analyses: [
      {
        id: "analysis-local-may-login-streak",
        createdAt: new Date("2026-06-01T09:00:00+07:00").toISOString(),
        briefSnapshot: mayLoginStreakBrief.slice(0, 2000),
        result: {
          source: "memory_sample",
          decision: {
            color: "Yellow",
            score: 8,
            maxScore: 12,
            title: "Launch đã chạy được nhưng cần cải thiện chuẩn bị",
            reason: "Sự kiện đạt mục tiêu giữ chân nhẹ và không vượt ngân sách, nhưng thông điệp reset ngày, FAQ CS và ngưỡng pause chưa đủ rõ."
          },
          riskBreakdown: [
            { label: "Mục tiêu và scope", score: 2, maxScore: 2, missing: "Mục tiêu và đối tượng đã đủ rõ." },
            { label: "Người phụ trách và hạn xử lý", score: 1, maxScore: 2, missing: "Chưa ghi rõ owner trực trong 6 giờ đầu launch." },
            { label: "Sẵn sàng kỹ thuật", score: 1, maxScore: 2, missing: "Chưa có ngưỡng pause nếu hệ thống ghi nhận login sai." },
            { label: "User impact", score: 1, maxScore: 2, missing: "Thông điệp reset ngày và điều kiện chuỗi liên tục chưa đủ rõ." },
            { label: "Business và reward", score: 2, maxScore: 2, missing: "Reward không vượt ngân sách." },
            { label: "Bài học sau launch", score: 1, maxScore: 2, missing: "Post-mortem chưa có câu hỏi về hiểu nhầm điều kiện event." }
          ],
          topRisks: [
            "Người chơi hiểu nhầm mốc reset ngày và điều kiện đăng nhập liên tục.",
            "CS FAQ chưa đủ rõ cho các trường hợp mất chuỗi.",
            "Chưa có ngưỡng pause nếu hệ thống ghi nhận login sai."
          ],
          redTeam: [
            {
              persona: "Người chơi bức xúc",
              worry: "Người chơi bỏ một ngày nhưng vẫn nghĩ mình đủ điều kiện nhận rương tổng kết.",
              evidence: "Ticket CS tăng trong 6 giờ đầu vì hiểu nhầm điều kiện reset ngày.",
              fix: "Ghi rõ mốc reset ngày, điều kiện liên tục và ví dụ minh họa trong in-game message."
            },
            {
              persona: "Trưởng nhóm CS",
              worry: "CS mất thời gian giải thích lặp lại cùng một lỗi hiểu nhầm.",
              evidence: "FAQ có nhưng chưa đủ case về mất chuỗi và reset ngày.",
              fix: "Bổ sung macro trả lời theo từng trường hợp: bỏ ngày, reset ngày, claim rương tổng kết."
            }
          ],
          checklist: [
            { task: "Viết lại in-game message về mốc reset ngày và điều kiện đăng nhập liên tục", owner: "PM LiveOps", deadline: "Trước event tiếp theo", status: "Todo", priority: "High" },
            { task: "Bổ sung CS FAQ cho case mất chuỗi, reset ngày và claim rương tổng kết", owner: "CS Lead", deadline: "Trước event tiếp theo", status: "Todo", priority: "High" },
            { task: "Thêm alert nếu tỷ lệ claim reward thấp bất thường", owner: "Tech Owner", deadline: "Trước event tiếp theo", status: "Todo", priority: "Medium" }
          ],
          postmortem: [
            { title: "Bài học chính", items: ["Thông điệp điều kiện event phải có ví dụ cụ thể.", "CS FAQ cần cover các hiểu nhầm phổ biến trước launch."] },
            { title: "Cần sửa template", items: ["Thêm câu hỏi kiểm tra mốc reset ngày.", "Thêm checklist CS macro cho điều kiện nhận reward."] }
          ]
        }
      }
    ],
    postLaunchResult: "Hoàn thành launch. Login rate tăng nhẹ trong 2 ngày đầu, reward không vượt ngân sách, nhưng ticket CS tăng trong 6 giờ đầu vì người chơi hỏi mốc reset ngày và điều kiện giữ chuỗi.",
    lessonsLearned: [
      {
        id: "lesson-local-1",
        createdAt: new Date("2026-06-01T10:00:00+07:00").toISOString(),
        text: "Luôn viết rõ mốc reset ngày, điều kiện giữ chuỗi liên tục và ví dụ minh họa trong in-game message."
      },
      {
        id: "lesson-local-2",
        createdAt: new Date("2026-06-01T10:05:00+07:00").toISOString(),
        text: "CS FAQ phải có macro riêng cho case mất chuỗi, claim rương tổng kết và khiếu nại thiếu reward."
      }
    ]
  }
];

const appShell = document.getElementById("appShell");
const launchGroups = document.getElementById("launchGroups");
const launchSearch = document.getElementById("launchSearch");
const launchStatusFilterSelect = document.getElementById("launchStatusFilter");
const launchName = document.getElementById("launchName");
const launchType = document.getElementById("launchType");
const launchStatus = document.getElementById("launchStatus");
const launchOwner = document.getElementById("launchOwner");
const launchTargetDate = document.getElementById("launchTargetDate");
const launchEndDate = document.getElementById("launchEndDate");
const launchTargetDateNative = document.getElementById("launchTargetDateNative");
const launchEndDateNative = document.getElementById("launchEndDateNative");
const launchTargetDatePicker = document.getElementById("launchTargetDatePicker");
const launchEndDatePicker = document.getElementById("launchEndDatePicker");
const launchMemoryStats = document.getElementById("launchMemoryStats");
const detailTitle = document.getElementById("detailTitle");
const detailSub = document.getElementById("detailSub");
const briefInput = document.getElementById("briefInput");
const readinessMetric = document.getElementById("readinessMetric");
const readinessHelpButton = document.querySelector("#readinessMetric .help-button");
const scoreCard = document.getElementById("scoreCard");
const scoreColor = document.getElementById("scoreColor");
const scoreValue = document.getElementById("scoreValue");
const scoreReason = document.getElementById("scoreReason");
const riskBreakdown = document.getElementById("riskBreakdown");
const topRisks = document.getElementById("topRisks");
const redTeamCards = document.getElementById("redTeamCards");
const checklistRows = document.getElementById("checklistRows");
const postmortemDraft = document.getElementById("postmortemDraft");
const decisionTitle = document.getElementById("decisionTitle");
const launchGate = document.getElementById("launchGate");
const scoreDial = document.getElementById("scoreDial");
const scoreDialValue = document.getElementById("scoreDialValue");
const analysisSource = document.getElementById("analysisSource");
const analyzeButton = document.getElementById("analyzeBrief");
const analysisRunStatus = document.getElementById("analysisRunStatus");
const saveLaunchButton = document.getElementById("saveLaunch");
const deleteLaunchButton = document.getElementById("deleteLaunch");
const launchOperator = document.getElementById("launchOperator");
const demoModeButton = document.getElementById("demoMode");
const exportReportButton = document.getElementById("exportReport");
const openTemplateConfigButton = document.getElementById("openTemplateConfig");
const launchSnapshot = document.getElementById("launchSnapshot");
const analysisHistory = document.getElementById("analysisHistory");
const lessonsPanel = document.getElementById("lessonsPanel");
const lessonSuggestions = document.getElementById("lessonSuggestions");
const briefGuideDescription = document.getElementById("briefGuideDescription");
const briefGuideItems = document.getElementById("briefGuideItems");
const templateName = document.getElementById("templateName");
const templateSelector = document.getElementById("templateSelector");
const templateMaxScore = document.getElementById("templateMaxScore");
const templateRiskCount = document.getElementById("templateRiskCount");
const templatePersonaCount = document.getElementById("templatePersonaCount");
const templateOperator = document.getElementById("templateOperator");
const templatePermissionState = document.getElementById("templatePermissionState");
const templateAdminList = document.getElementById("templateAdminList");
const templateVersionHistory = document.getElementById("templateVersionHistory");
const templateManager = document.getElementById("templateManager");
const riskGroupEditor = document.getElementById("riskGroupEditor");
const personaEditor = document.getElementById("personaEditor");
const checklistEditor = document.getElementById("checklistEditor");
const lessonEditor = document.getElementById("lessonEditor");
const templateNameEditor = document.getElementById("templateNameEditor");
const classificationEditor = document.getElementById("classificationEditor");
const addBaseTemplateButton = document.getElementById("addBaseTemplate");
const addLaunchTypeButton = document.getElementById("addLaunchType");
const addRiskGroupButton = document.getElementById("addRiskGroup");
const addPersonaButton = document.getElementById("addPersona");
const addChecklistItemButton = document.getElementById("addChecklistItem");
const addLessonBlockButton = document.getElementById("addLessonBlock");
const resetTemplateButton = document.getElementById("resetTemplate");
const saveTemplateButton = document.getElementById("saveTemplate");
const openAssistantButton = document.getElementById("openAssistant");
const closeAssistantButton = document.getElementById("closeAssistant");
const assistantPanel = document.getElementById("assistantPanel");
const assistantMessages = document.getElementById("assistantMessages");
const assistantForm = document.getElementById("assistantForm");
const assistantInput = document.getElementById("assistantInput");
const introModal = document.getElementById("introModal");
const closeIntroModalButton = document.getElementById("closeIntroModal");
const enterDemoFromIntroButton = document.getElementById("enterDemoFromIntro");
const ragInsightsBody = document.getElementById("ragInsightsBody");
const traceConsoleBody = document.getElementById("traceConsoleBody");
const traceCopyButton = document.getElementById("traceCopyBtn");

let lastRagTraceResult = null;

let launches = [];
let currentLaunch = null;
let backendAvailable = Boolean(API_BASE);
let draftMode = false;
let templateOperatorId = "vinhvnn";
let launchSearchQuery = "";
let launchStatusFilter = "all";
let selectedConfigType = "Game event";
let previousLaunchView = "briefView";
let templateConfigVersions = {};
let assistantWizard = null;

function activeLaunchRole() {
  if (ROLE_SWITCH_LOCKED) return adminSessionEnabled() ? "admin" : LOCKED_LAUNCH_ROLE;
  return launchOperator?.value || "human";
}

function syncLaunchRoleLock() {
  if (!launchOperator) return;
  if (ROLE_SWITCH_LOCKED) {
    launchOperator.value = activeLaunchRole();
    launchOperator.disabled = true;
    launchOperator.title = adminSessionEnabled()
      ? "Đang ở chế độ Admin (bật qua URL ?role=admin)."
      : "Bản review public đang khóa vai trò ở Human.";
  } else {
    launchOperator.disabled = false;
    launchOperator.removeAttribute("title");
  }
}

function isLaunchAdmin() {
  return activeLaunchRole() === "admin";
}

function currentLaunchStatus() {
  return normalizeStatus(currentLaunch?.status || launchStatus?.value);
}

function canEditLaunch() {
  return draftMode || currentLaunchStatus() === "upcoming" || isLaunchAdmin();
}

function canSaveLaunchData(launchData = collectLaunchFromForm()) {
  const status = normalizeStatus(launchData?.status);
  return status === "upcoming" || isLaunchAdmin();
}

function canDeleteLaunch() {
  return Boolean(currentLaunch?.id && !draftMode && canEditLaunch());
}

function canSaveLaunchOutcome() {
  const role = activeLaunchRole();
  const status = currentLaunchStatus();
  return canEditLaunch() || (role === "human" && ["running", "completed"].includes(status));
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeText(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function normalizeStatus(status) {
  return STATUS_ORDER.includes(status) ? status : "upcoming";
}

function defaultTemplateForType(type) {
  return cloneData(LAUNCH_TEMPLATES[type] || GENERIC_LAUNCH_TEMPLATE);
}

function normalizeTemplate(template, type = "Game event") {
  const base = defaultTemplateForType(type);
  const source = template && typeof template === "object" ? template : {};
  return {
    name: source.name || base.name,
    description: source.description || base.description,
    briefGuide: Array.isArray(source.briefGuide) && source.briefGuide.length ? source.briefGuide : base.briefGuide,
    riskGroups: Array.isArray(source.riskGroups) && source.riskGroups.length ? source.riskGroups : base.riskGroups,
    redTeam: Array.isArray(source.redTeam) && source.redTeam.length ? source.redTeam : base.redTeam,
    checklist: Array.isArray(source.checklist) && source.checklist.length ? source.checklist : base.checklist,
    postmortem: Array.isArray(source.postmortem) && source.postmortem.length ? source.postmortem : base.postmortem,
    customized: Boolean(source.customized)
  };
}

function activeTemplate() {
  const launch = currentLaunch || collectLaunchFromForm();
  return defaultTemplateForType(launch?.type || launchType?.value || "Game event");
}

function configTemplateType() {
  if (!launchTypeExists(selectedConfigType)) selectedConfigType = firstLaunchType();
  return selectedConfigType;
}

function configTemplate() {
  const type = configTemplateType();
  return normalizeTemplate(LAUNCH_TEMPLATES[type], type);
}

function templateTypeOptions() {
  const orderedTypes = LAUNCH_TYPE_ORDER.filter((type) => launchTypeExists(type));
  const customTypes = Object.keys(LAUNCH_TEMPLATES).filter((type) => !orderedTypes.includes(type));
  return [...orderedTypes, ...customTypes];
}

function launchTypeExists(type) {
  return Boolean(type && Object.prototype.hasOwnProperty.call(LAUNCH_TEMPLATES, type));
}

function baseTemplateById(id) {
  return BASE_TEMPLATE_OPTIONS.find((item) => item.id === id)?.template || GENERIC_LAUNCH_TEMPLATE;
}

function baseTemplateIdForTemplate(template) {
  const templateName = template?.name;
  return BASE_TEMPLATE_OPTIONS.find((item) => item.template.name === templateName)?.id || "generic";
}

function baseTemplateIdForType(type) {
  return baseTemplateIdForTemplate(LAUNCH_TEMPLATES[type]);
}

function ensureLaunchType(type, label = type, template = GENERIC_LAUNCH_TEMPLATE) {
  if (!type) return;
  if (!launchTypeExists(type)) LAUNCH_TEMPLATES[type] = template;
  if (!TYPE_LABELS[type]) TYPE_LABELS[type] = label || type;
}

function firstLaunchType() {
  return templateTypeOptions()[0] || "Game event";
}

function renderLaunchTypeOptions(selectedType = launchType?.value || currentLaunch?.type || firstLaunchType()) {
  if (!launchType) return;
  const safeSelectedType = launchTypeExists(selectedType) ? selectedType : firstLaunchType();
  launchType.innerHTML = templateTypeOptions().map((type) => `
    <option value="${escapeHTML(type)}">${escapeHTML(typeLabel(type))}</option>
  `).join("");
  launchType.value = safeSelectedType;
}

function syncLaunchTypeOptionLabels() {
  [launchType, templateSelector].forEach((select) => {
    if (!select) return;
    Array.from(select.options || []).forEach((option) => {
      option.textContent = typeLabel(option.value);
    });
  });
}

function syncTemplateDisplayLabels() {
  if (templateName) {
    const template = activeTemplate();
    templateName.textContent = `Bộ luật: ${templateDisplayName(template)}${template.customized ? " · Đã tùy chỉnh" : ""}`;
  }
  classificationEditor?.querySelectorAll("[data-type-template] option").forEach((option) => {
    option.textContent = templateDisplayName(baseTemplateById(option.value));
  });
}

function selectedTemplateType(template = activeTemplate()) {
  if (launchTypeExists(selectedConfigType)) return selectedConfigType;
  return templateTypeOptions().find((type) => defaultTemplateForType(type).name === template.name) || "Game event";
}

function renderTemplateSelectorOptions(template = activeTemplate(), editable = canEditTemplate()) {
  if (!templateSelector) return;
  templateSelector.innerHTML = templateTypeOptions().map((type) => {
    return `<option value="${escapeHTML(type)}">${escapeHTML(typeLabel(type))}</option>`;
  }).join("");
  templateSelector.value = selectedTemplateType(template);
  templateSelector.disabled = false;
  templateSelector.title = editable
    ? "Chọn phân loại để cấu hình."
    : "Bản review public chỉ cho xem cấu hình; vẫn có thể đổi phân loại để đọc bộ luật.";
}

function renderTemplateNameEditor(editable = canEditTemplate()) {
  if (!templateNameEditor) return;
  const removableCount = BASE_TEMPLATE_OPTIONS.length > PROTECTED_BASE_TEMPLATE_IDS.length;
  templateNameEditor.innerHTML = BASE_TEMPLATE_OPTIONS.map(({ id, template }) => {
    const protectedTemplate = PROTECTED_BASE_TEMPLATE_IDS.includes(id);
    const removable = editable && !protectedTemplate && removableCount;
    return `
      <article class="catalog-row template-row" data-base-template="${escapeHTML(id)}">
        <label>
          <span>${escapeHTML(protectedTemplate ? "Template mặc định" : "Template tùy chỉnh")}</span>
          <input type="text" value="${escapeHTML(templateDisplayName(template))}" data-template-label="${escapeHTML(template.name)}"${disabledAttr(editable)}>
        </label>
        <button type="button" data-remove-base-template="${escapeHTML(id)}"${removable ? "" : " disabled"}>Xóa</button>
      </article>
    `;
  }).join("");
}

function renderClassificationEditor(editable = canEditTemplate()) {
  if (!classificationEditor) return;
  const baseOptions = BASE_TEMPLATE_OPTIONS.map(({ id, template }) => `
    <option value="${escapeHTML(id)}">${escapeHTML(templateDisplayName(template))}</option>
  `).join("");
  const launchTypes = templateTypeOptions();
  classificationEditor.innerHTML = launchTypes.map((type) => {
    const protectedType = PROTECTED_LAUNCH_TYPES.includes(type);
    const removable = editable && !protectedType && launchTypes.length > 1;
    return `
      <article class="catalog-row classification-row" data-launch-type="${escapeHTML(type)}">
        <label>
          <span>Tên phân loại</span>
          <input type="text" value="${escapeHTML(typeLabel(type))}" data-type-label${disabledAttr(editable)}>
        </label>
        <label>
          <span>Dùng bộ template</span>
          <select data-type-template${disabledAttr(editable)}>${baseOptions}</select>
        </label>
        <button type="button" data-remove-launch-type="${escapeHTML(type)}"${removable ? "" : " disabled"}>Xóa</button>
      </article>
    `;
  }).join("");
  classificationEditor.querySelectorAll("[data-type-template]").forEach((select) => {
    const type = select.closest("[data-launch-type]")?.dataset.launchType;
    select.value = baseTemplateIdForType(type);
  });
}

function renderTemplateCatalog(editable = canEditTemplate()) {
  renderTemplateNameEditor(editable);
  renderClassificationEditor(editable);
  if (addLaunchTypeButton) addLaunchTypeButton.disabled = !editable;
  if (addBaseTemplateButton) addBaseTemplateButton.disabled = !editable;
}

function templateMax(template = activeTemplate()) {
  return (template.riskGroups || []).reduce((sum, group) => sum + (Number(group.maxScore) || 2), 0);
}

function splitTemplateLine(line) {
  return String(line || "").split("|").map((part) => part.trim());
}

function splitList(value, delimiter = ";") {
  return String(value || "")
    .split(delimiter)
    .map((item) => item.trim())
    .filter(Boolean);
}

function riskGroupsToText(groups) {
  return (groups || []).map((group) => [
    group.label,
    group.maxScore || 2,
    (group.requirements || []).join("; "),
    (group.checks || []).join(", "),
    group.missing || ""
  ].join(" | ")).join("\n");
}

function personasToText(items) {
  return (items || []).map((item) => [
    item.persona,
    item.worry,
    item.evidence,
    item.fix
  ].join(" | ")).join("\n");
}

function checklistToText(items) {
  return (items || []).map((item) => [
    item.task,
    item.owner,
    item.deadline,
    item.status || "Todo",
    item.priority || "Medium"
  ].join(" | ")).join("\n");
}

function postmortemToText(blocks) {
  return (blocks || []).map((block) => [
    block.title,
    (block.items || []).join("; ")
  ].join(" | ")).join("\n");
}

function parseRiskGroups(text) {
  return String(text || "").split(/\r?\n/).map((line, index) => {
    const [label, maxScore, requirements, checks, missing] = splitTemplateLine(line);
    if (!label) return null;
    return {
      key: slugify(label).slice(0, 32) || `risk-${index + 1}`,
      label,
      maxScore: Number(maxScore) || 2,
      requirements: splitList(requirements, ";"),
      checks: splitList(checks, ","),
      missing: missing || `Thiếu thông tin cho nhóm ${label}.`
    };
  }).filter(Boolean);
}

function parsePersonas(text) {
  return String(text || "").split(/\r?\n/).map((line) => {
    const [persona, worry, evidence, fix] = splitTemplateLine(line);
    if (!persona) return null;
    return {
      persona,
      worry: worry || "Chưa có lo ngại.",
      evidence: evidence || "Chưa có dấu hiệu cần kiểm tra.",
      fix: fix || "Cần bổ sung cách xử lý."
    };
  }).filter(Boolean);
}

function parseChecklist(text) {
  return String(text || "").split(/\r?\n/).map((line) => {
    const [task, owner, deadline, status, priority] = splitTemplateLine(line);
    if (!task) return null;
    return {
      task,
      owner: owner || "Launch Owner",
      deadline: deadline || "T-1 ngày",
      status: status || "Todo",
      priority: priority || "Medium"
    };
  }).filter(Boolean);
}

function parsePostmortem(text) {
  return String(text || "").split(/\r?\n/).map((line) => {
    const [title, items] = splitTemplateLine(line);
    if (!title) return null;
    return {
      title,
      items: splitList(items, ";")
    };
  }).filter(Boolean);
}

function activeTemplateOperator() {
  return TEMPLATE_OPERATORS.find((item) => item.id === templateOperatorId) || TEMPLATE_OPERATORS[0];
}

function canEditTemplate() {
  return !TEMPLATE_EDITING_LOCKED && Boolean(activeTemplateOperator()?.canEdit);
}

function canApproveTemplateSuggestion() {
  return isLaunchAdmin() && canEditTemplate();
}

function disabledAttr(editable = canEditTemplate()) {
  return editable ? "" : " disabled";
}

function splitEditorList(value, mode = "semicolon") {
  const splitter = mode === "comma" ? /[,;\n]/ : /[;\n]/;
  return String(value || "")
    .split(splitter)
    .map((item) => item.trim())
    .filter(Boolean);
}

function cardFieldValue(card, field) {
  return card.querySelector(`[data-field="${field}"]`)?.value.trim() || "";
}

function editorCards(container, type) {
  return Array.from(container?.querySelectorAll(`[data-template-item="${type}"]`) || []);
}

function collectRiskGroupsFromEditor() {
  return editorCards(riskGroupEditor, "risk").map((card, index) => {
    const label = cardFieldValue(card, "label");
    if (!label) return null;
    return {
      key: slugify(label).slice(0, 32) || `risk-${index + 1}`,
      label,
      maxScore: Math.max(1, Number(cardFieldValue(card, "maxScore")) || 2),
      requirements: splitEditorList(cardFieldValue(card, "requirements")),
      checks: splitEditorList(cardFieldValue(card, "checks"), "comma"),
      missing: cardFieldValue(card, "missing") || `Thiếu thông tin cho nhóm ${label}.`
    };
  }).filter(Boolean);
}

function collectPersonasFromEditor() {
  return editorCards(personaEditor, "persona").map((card) => {
    const persona = cardFieldValue(card, "persona");
    if (!persona) return null;
    return {
      persona,
      worry: cardFieldValue(card, "worry") || "Chưa có lo ngại.",
      evidence: cardFieldValue(card, "evidence") || "Chưa có dấu hiệu cần kiểm tra.",
      fix: cardFieldValue(card, "fix") || "Cần bổ sung cách xử lý."
    };
  }).filter(Boolean);
}

function collectChecklistFromEditor() {
  return editorCards(checklistEditor, "checklist").map((card) => {
    const task = cardFieldValue(card, "task");
    if (!task) return null;
    return {
      task,
      owner: cardFieldValue(card, "owner") || "Launch Owner",
      deadline: cardFieldValue(card, "deadline") || "T-1 ngày",
      status: cardFieldValue(card, "status") || "Todo",
      priority: cardFieldValue(card, "priority") || "Medium"
    };
  }).filter(Boolean);
}

function collectPostmortemFromEditor() {
  return editorCards(lessonEditor, "lesson").map((card) => {
    const title = cardFieldValue(card, "title");
    if (!title) return null;
    return {
      title,
      items: splitEditorList(cardFieldValue(card, "items"))
    };
  }).filter(Boolean);
}

function templateFromEditors(base = activeTemplate()) {
  return normalizeTemplate({
    ...base,
    name: templateName?.dataset.baseName || base.name,
    riskGroups: collectRiskGroupsFromEditor(),
    redTeam: collectPersonasFromEditor(),
    checklist: collectChecklistFromEditor(),
    postmortem: collectPostmortemFromEditor(),
    customized: true
  }, configTemplateType());
}

function padDatePart(value) {
  return String(value).padStart(2, "0");
}

function parseDateOnly(value) {
  const text = String(value || "").trim();
  if (!text) return null;

  // ISO: YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm (giờ phút tùy chọn)
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2}))?/);
  if (iso) {
    return {
      year: iso[1],
      month: padDatePart(iso[2]),
      day: padDatePart(iso[3]),
      hour: iso[4] !== undefined ? padDatePart(iso[4]) : "",
      minute: iso[5] !== undefined ? iso[5] : ""
    };
  }

  // Hiển thị: dd/mm/yyyy hoặc dd/mm/yyyy HH:mm
  const display = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\s,]+(\d{1,2}):(\d{2}))?/);
  if (display) {
    return {
      year: display[3],
      month: padDatePart(display[2]),
      day: padDatePart(display[1]),
      hour: display[4] !== undefined ? padDatePart(display[4]) : "",
      minute: display[5] !== undefined ? display[5] : ""
    };
  }

  return null;
}

function dateTimeSuffix(parts) {
  return parts && parts.hour !== "" && parts.minute !== "" ? ` ${parts.hour}:${parts.minute}` : "";
}

function formatDateOnly(value, fallback = "Chưa có ngày") {
  const text = String(value || "").trim();
  if (!text) return fallback;

  const parts = parseDateOnly(text);
  if (parts) return `${parts.day}/${parts.month}/${parts.year}${dateTimeSuffix(parts)}`;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return `${padDatePart(date.getDate())}/${padDatePart(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function formatDateForInput(value) {
  const parts = parseDateOnly(value);
  if (!parts) return "";
  // datetime-local bắt buộc có giờ phút — mặc định 00:00 khi value chỉ có ngày.
  const hour = parts.hour !== "" ? parts.hour : "00";
  const minute = parts.minute !== "" ? parts.minute : "00";
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${minute}`;
}

function normalizeDateForStorage(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const parts = parseDateOnly(text);
  if (!parts) return text;
  const time = parts.hour !== "" && parts.minute !== "" ? `T${parts.hour}:${parts.minute}` : "";
  return `${parts.year}-${parts.month}-${parts.day}${time}`;
}

function setVisibleDateValue(textInput, nativeInput, value) {
  if (textInput) textInput.value = formatDateOnly(value, "");
  if (nativeInput) nativeInput.value = formatDateForInput(value);
}

function syncNativeDateFromText(textInput, nativeInput) {
  if (!textInput || !nativeInput) return;
  nativeInput.value = formatDateForInput(textInput.value);
}

function syncTextDateFromNative(textInput, nativeInput) {
  if (!textInput || !nativeInput || !nativeInput.value) return;
  textInput.value = formatDateOnly(nativeInput.value, "");
  textInput.dispatchEvent(new Event("change", { bubbles: true }));
}

function normalizeVisibleDateInput(textInput, nativeInput) {
  if (!textInput) return;
  const formatted = formatDateOnly(textInput.value, "");
  if (formatted) textInput.value = formatted;
  syncNativeDateFromText(textInput, nativeInput);
}

function openNativeDatePicker(textInput, nativeInput) {
  if (!textInput || !nativeInput || textInput.disabled) return;
  syncNativeDateFromText(textInput, nativeInput);
  if (typeof nativeInput.showPicker === "function") {
    try {
      nativeInput.showPicker();
      return;
    } catch (error) {
      console.warn("Native date picker unavailable.", error);
    }
  }
  nativeInput.focus();
  nativeInput.click();
}

function setupDateField(textInput, nativeInput, pickerButton) {
  if (!textInput || !nativeInput || !pickerButton) return;
  textInput.addEventListener("focus", () => {
    window.setTimeout(() => textInput.select(), 0);
  });
  textInput.addEventListener("input", () => syncNativeDateFromText(textInput, nativeInput));
  textInput.addEventListener("change", () => normalizeVisibleDateInput(textInput, nativeInput));
  textInput.addEventListener("blur", () => normalizeVisibleDateInput(textInput, nativeInput));
  nativeInput.addEventListener("change", () => syncTextDateFromNative(textInput, nativeInput));
  pickerButton.addEventListener("click", () => openNativeDatePicker(textInput, nativeInput));
}

function offsetDateFromLaunch(deadline, launch = currentLaunch) {
  const base = parseDateOnly(launch?.targetDate);
  if (!base) return "";

  const text = normalizeText(deadline);
  const relative = text.match(/^t\s*([+-])\s*(\d+)\s*(ngay|day|days|gio|hour|hours)?/);
  const launchDay = text === "t" || text.includes("launch day") || text.includes("ngay launch");
  if (!relative && !launchDay) return "";

  const date = new Date(Number(base.year), Number(base.month) - 1, Number(base.day));
  if (relative) {
    const direction = relative[1] === "-" ? -1 : 1;
    const amount = Number(relative[2]) || 0;
    const unit = relative[3] || "ngay";
    const days = unit.includes("gio") || unit.includes("hour")
      ? Math.ceil(amount / 24)
      : amount;
    date.setDate(date.getDate() + direction * days);
  }

  return `${padDatePart(date.getDate())}/${padDatePart(date.getMonth() + 1)}/${date.getFullYear()}`;
}

function formatDeadline(deadline, launch = currentLaunch) {
  const text = String(deadline || "").trim();
  if (!text) return "Chưa có hạn";
  return offsetDateFromLaunch(text, launch) || formatDateOnly(text);
}

function formatDate(value) {
  if (!value) return "Chưa có ngày";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${padDatePart(date.getDate())}/${padDatePart(date.getMonth() + 1)}/${date.getFullYear()} ${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`;
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72) || `launch-${Date.now()}`;
}

function scoreBrief(text, template = activeTemplate()) {
  const lower = normalizeText(text);

  return (template.riskGroups || []).map((item) => {
    const checks = item.checks || [];
    const maxScore = Number(item.maxScore) || 2;
    const hits = checks.filter((keyword) => lower.includes(normalizeText(keyword))).length;
    let score = 0;
    if (hits >= Math.min(3, checks.length || 3)) score = maxScore;
    else if (hits >= 1) score = Math.max(1, Math.min(maxScore - 1, Math.round((hits / Math.max(checks.length, 1)) * maxScore)));
    return { ...item, score, maxScore };
  });
}

function getColor(total, maxScore = 12) {
  const percent = maxScore ? total / maxScore : 0;
  if (percent >= 0.8) return "Green";
  if (percent >= 0.5) return "Yellow";
  return "Red";
}

function getRiskClass(score, maxScore = 2) {
  if (score >= maxScore) return "green";
  if (score > 0) return "yellow";
  return "red";
}

function getInitials(text) {
  return String(text || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function sourceLabelFor(result, override) {
  if (override) return override;
  if (result?.source === "llm") return "Kết quả từ AI";
  if (result?.source === "memory_sample") return "Dữ liệu mẫu đã lưu";
  if (result?.source === "fallback") return "Kết quả dự phòng";
  return "Bản local";
}

function colorLabel(color) {
  if (uiLang() === "en") return COLOR_LABELS_EN[color] || color || "N/A";
  return COLOR_LABELS[color] || color || "Chưa có";
}

function personaLabel(persona) {
  return PERSONA_LABELS[persona] || persona || "Người phản biện";
}

function statusValueLabel(status) {
  const normalized = normalizeText(status);
  if (normalized.includes("done") || normalized.includes("xong")) return "Đã xong";
  if (normalized.includes("doing") || normalized.includes("dang lam")) return "Đang làm";
  if (normalized.includes("block") || normalized.includes("ket")) return "Đang kẹt";
  if (normalized.includes("todo") || normalized.includes("can lam")) return "Cần làm";
  return STATUS_VALUE_LABELS[status] || status || "Cần làm";
}

function priorityLabel(priority) {
  const normalized = normalizeText(priority);
  if (normalized.includes("high") || normalized.includes("cao") || normalized.includes("red")) return "Cao";
  if (normalized.includes("low") || normalized.includes("thap") || normalized.includes("green")) return "Thấp";
  if (normalized.includes("medium") || normalized.includes("vua") || normalized.includes("yellow")) return "Vừa";
  return PRIORITY_LABELS[priority] || priority || "Vừa";
}

function priorityClassName(priority) {
  const normalized = normalizeText(priority);
  if (normalized.includes("high") || normalized.includes("cao") || normalized.includes("red")) return "high";
  if (normalized.includes("low") || normalized.includes("thap") || normalized.includes("green")) return "low";
  return "medium";
}

function statusClassName(status) {
  const normalized = normalizeText(status);
  if (normalized.includes("done") || normalized.includes("xong")) return "done";
  if (normalized.includes("doing") || normalized.includes("dang lam")) return "doing";
  if (normalized.includes("block") || normalized.includes("ket")) return "blocked";
  return "todo";
}

function riskLabel(label) {
  return RISK_LABELS[label] || label || "Nhóm rủi ro";
}

function riskKey(label) {
  const normalized = normalizeText(riskLabel(label));
  if (normalized.includes("muc tieu") || normalized.includes("pham vi") || normalized.includes("scope")) return "scope";
  if (normalized.includes("phu trach") || normalized.includes("owner") || normalized.includes("deadline") || normalized.includes("han xu ly")) return "owner";
  if (normalized.includes("ky thuat") || normalized.includes("tech") || normalized.includes("stability")) return "tech";
  if (normalized.includes("nguoi dung") || normalized.includes("user") || normalized.includes("cs")) return "user";
  if (normalized.includes("kinh doanh") || normalized.includes("phan thuong") || normalized.includes("business") || normalized.includes("reward") || normalized.includes("economy")) return "business";
  if (normalized.includes("bai hoc") || normalized.includes("learning") || normalized.includes("post")) return "learning";
  return "scope";
}

function riskScoreMeaning(score, maxScore = 2) {
  if (score >= maxScore) return `${maxScore}/${maxScore}: Đủ rõ để giao việc và chịu trách nhiệm.`;
  if (score > 0) return `${score}/${maxScore}: Có nhắc tới, nhưng còn thiếu chi tiết để team làm ngay.`;
  return `0/${maxScore}: Chưa thấy đủ bằng chứng trong brief.`;
}

function riskRequirements(label) {
  const normalizedLabel = normalizeText(riskLabel(label));
  const group = (activeTemplate().riskGroups || []).find((item) => normalizeText(item.label) === normalizedLabel);
  if (group?.requirements?.length) return group.requirements;
  return RISK_REQUIREMENTS[riskKey(label)] || RISK_REQUIREMENTS.scope;
}

function typeLabel(type) {
  return TYPE_LABELS[type] || type || "Chưa phân loại";
}

function templateDisplayName(templateOrName) {
  const name = typeof templateOrName === "string" ? templateOrName : templateOrName?.name;
  return TEMPLATE_NAME_LABELS[name] || name || "Template mặc định";
}

function ownerLabel(owner) {
  return OWNER_LABELS[owner] || friendlyText(owner || "Chưa gán");
}

function friendlyText(value) {
  return String(value ?? "")
    .replace(/reward và economy impact/gi, "Phần thưởng và Economy Impact")
    .replace(/phần thưởng và economy impact/gi, "Phần thưởng và Economy Impact")
    .replace(/tech stability và exploit review/gi, "Kỹ thuật Stability và Lách luật Review")
    .replace(/kỹ thuật stability và lách luật review/gi, "Kỹ thuật Stability và Lách luật Review")
    .replace(/reward table/gi, "bảng phần thưởng")
    .replace(/abnormal reward payout/gi, "chi trả phần thưởng bất thường")
    .replace(/CS escalation/gi, "quy trình chuyển CS")
    .replace(/kill switch/gi, "nút dừng khẩn cấp")
    .replace(/multi-account/gi, "nhiều tài khoản")
    .replace(/refund abuse/gi, "lạm dụng hoàn tiền")
    .replace(/load test/gi, "kiểm thử tải")
    .replace(/error rate/gi, "tỷ lệ lỗi")
    .replace(/spin success rate/gi, "tỷ lệ quay thành công")
    .replace(/reward delivery failure/gi, "lỗi phát thưởng")
    .replace(/abnormal phần thưởng payout/gi, "chi trả phần thưởng bất thường")
    .replace(/\btraffic\b/gi, "lưu lượng truy cập")
    .replace(/\blatency\b/gi, "độ trễ")
    .replace(/\bdashboard\b/gi, "bảng theo dõi")
    .replace(/\balert\b/gi, "cảnh báo")
    .replace(/\bflow\b/gi, "luồng")
    .replace(/\brule\b/gi, "quy định")
    .replace(/\bcap\b/gi, "giới hạn")
    .replace(/\btable\b/gi, "bảng")
    .replace(/item hiếm/gi, "vật phẩm hiếm")
    .replace(/\btech\b/gi, "kỹ thuật")
    .replace(/\bevent\b/gi, "sự kiện")
    .replace(/Launch bản tóm tắt/gi, "Bản tóm tắt launch")
    .replace(/phương án quay lại plan/gi, "phương án quay lại trạng thái trước đó")
    .replace(/game event/gi, "sự kiện game")
    .replace(/template/gi, "mẫu")
    .replace(/exploit/gi, "lách luật")
    .replace(/bug/gi, "lỗi nghiêm trọng")
    .replace(/launch\/running/gi, "chạy launch")
    .replace(/running/gi, "đang chạy")
    .replace(/guardrail/gi, "điều kiện kiểm soát")
    .replace(/rollback/gi, "phương án quay lại")
    .replace(/owner/gi, "người phụ trách")
    .replace(/deadline/gi, "hạn xử lý")
    .replace(/reward/gi, "phần thưởng")
    .replace(/scope/gi, "phạm vi")
    .replace(/brief/gi, "bản tóm tắt")
    .replace(/checklist/gi, "danh sách việc cần làm")
    .replace(/post-mortem/gi, "tổng kết sau launch")
    .replace(/metrics/gi, "chỉ số")
    .replace(/monitoring/gi, "theo dõi hệ thống")
    .replace(/on-call/gi, "trực sự cố")
    .replace(/fallback/gi, "phương án dự phòng")
    .replace(/macro/gi, "mẫu trả lời")
    .replace(/escalation path/gi, "đường xử lý leo thang")
    .replace(/Launch bản tóm tắt/gi, "Bản tóm tắt launch")
    .replace(/phương án quay lại plan/gi, "phương án quay lại trạng thái trước đó");
}

function headingText(value) {
  const text = friendlyText(value).trim();
  if (!text) return "";
  return text.charAt(0).toLocaleUpperCase("vi-VN") + text.slice(1);
}

function dateRangeLabel(launch) {
  const start = formatDateOnly(launch?.targetDate);
  const end = launch?.endDate ? ` - ${formatDateOnly(launch.endDate)}` : "";
  return `${start}${end}`;
}

function renderDecision({ color, score, maxScore = 12, title, reason, sourceLabel }) {
  const safeColor = ["Green", "Yellow", "Red"].includes(color) ? color : "Yellow";
  const className = safeColor.toLowerCase();
  const numericScore = Number(score) || 0;
  const numericMax = Number(maxScore) || 12;
  const percent = Math.max(0, Math.min(100, Math.round((numericScore / numericMax) * 100)));

  scoreCard.className = `decision-card ${className}`;
  if (readinessMetric) readinessMetric.className = `metric score-metric ${className}`;
  if (readinessHelpButton) {
    const riskCount = (activeTemplate().riskGroups || []).length;
    readinessHelpButton.dataset.tooltip = `Tổng điểm 0-${numericMax} từ ${riskCount} nhóm rủi ro trong cấu hình phân loại hiện tại. Điểm thấp nghĩa là brief còn thiếu dữ liệu để launch an toàn.`;
  }
  scoreDial.style.setProperty("--score-percent", `${percent}%`);
  scoreColor.textContent = colorLabel(safeColor);
  scoreValue.textContent = `${numericScore}/${numericMax}`;
  if (scoreDialValue) scoreDialValue.textContent = `${numericScore}/${numericMax}`;
  scoreReason.textContent = friendlyText(reason || (safeColor === "Green"
    ? "Có thể launch nếu không có blocker nghiêm trọng."
    : safeColor === "Yellow"
      ? "Chưa nên launch ngay. Cần sửa các mục thiếu trước."
      : "Dừng launch. Cần làm lại brief hoặc giảm scope."));
  decisionTitle.textContent = friendlyText(title || (safeColor === "Green"
    ? "Có thể chuẩn bị launch"
    : safeColor === "Yellow"
      ? "Chưa nên launch ngay"
      : "Dừng launch"));
  launchGate.className = `gate-pill ${className}`;
  launchGate.textContent = safeColor === "Green"
    ? "Kết luận: Có thể chạy có điều kiện"
    : safeColor === "Yellow"
      ? "Kết luận: Tạm giữ để sửa"
      : "Kết luận: Dừng launch";
  analysisSource.textContent = sourceLabel || "Bản local";
}

function renderRiskBreakdown(items) {
  if (!items?.length) {
    riskBreakdown.innerHTML = `<div class="empty-state">Chưa có điểm rủi ro. Bấm Chạy phân tích để tạo.</div>`;
    return;
  }

  riskBreakdown.innerHTML = items.map((item) => {
    const score = Number(item.score) || 0;
    const maxScore = Number(item.maxScore) || 2;
    const label = escapeHTML(friendlyText(riskLabel(item.label)));
    const detail = score >= maxScore ? "Ổn cho bản tóm tắt launch này." : escapeHTML(friendlyText(item.missing));
    const requirements = riskRequirements(item.label);

    return `
      <div class="risk-tile ${getRiskClass(score, maxScore)}">
        <strong>${label}</strong>
        <span class="risk-score">${score}/${maxScore}</span>
        <p class="risk-meaning">${escapeHTML(riskScoreMeaning(score, maxScore))}</p>
        <small>${detail}</small>
        <div class="risk-requirements">
          <b>Muốn đạt 2/2 cần có:</b>
          <ul>
            ${requirements.map((requirement) => `<li>${escapeHTML(requirement)}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;
  }).join("");
}

function renderTopRisks(items) {
  if (!items?.length) {
    topRisks.innerHTML = `<li>Chưa có rủi ro. Bấm Chạy phân tích để tạo.</li>`;
    return;
  }
  topRisks.innerHTML = items.map((item) => `<li>${escapeHTML(friendlyText(item))}</li>`).join("");
}

function renderScore(results, sourceLabel = "Rule-based local preview") {
  const total = results.reduce((sum, item) => sum + item.score, 0);
  const maxScore = results.reduce((sum, item) => sum + (Number(item.maxScore) || 2), 0) || 12;
  const color = getColor(total, maxScore);

  renderDecision({
    color,
    score: total,
    maxScore,
    sourceLabel
  });

  renderRiskBreakdown(results);

  const missing = results
    .filter((item) => item.score < (Number(item.maxScore) || 2))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  renderTopRisks(missing.map((item) => item.missing));
}

function buildLocalAnalysisResult(text = briefInput.value.trim(), source = "local_fallback") {
  const template = activeTemplate();
  const results = scoreBrief(text, template);
  const total = results.reduce((sum, item) => sum + item.score, 0);
  const maxScore = results.reduce((sum, item) => sum + (Number(item.maxScore) || 2), 0) || 12;
  const color = getColor(total, maxScore);
  const missing = results
    .filter((item) => item.score < (Number(item.maxScore) || 2))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return {
    source,
    decision: {
      color,
      score: total,
      maxScore,
      title: color === "Green" ? "Có thể chuẩn bị launch" : color === "Yellow" ? "Chưa nên launch ngay" : "Dừng launch",
      reason: missing.length
        ? `Cần bổ sung: ${missing.map((item) => friendlyText(item.missing)).join("; ")}.`
        : "Brief đủ rõ cho bản demo local."
    },
    riskBreakdown: results,
    topRisks: missing.map((item) => item.missing),
    redTeam: template.redTeam || [],
    checklist: template.checklist || [],
    postmortem: template.postmortem || []
  };
}

function renderRedTeam(cards = activeTemplate().redTeam) {
  if (!cards?.length) {
    redTeamCards.innerHTML = `<div class="empty-state">Chưa có góc nhìn phản biện.</div>`;
    return;
  }

  redTeamCards.innerHTML = cards.map((card) => `
    <article class="red-card">
      <div class="agent-head">
        <div class="agent-avatar">${escapeHTML(getInitials(personaLabel(card.persona)))}</div>
        <h3>${escapeHTML(personaLabel(card.persona))}</h3>
      </div>
      <div>
        <p><strong>Lo ngại:</strong> ${escapeHTML(friendlyText(card.worry))}</p>
        <p><strong>Dấu hiệu:</strong> ${escapeHTML(friendlyText(card.evidence))}</p>
        <p><strong>Cách xử lý:</strong> ${escapeHTML(friendlyText(card.fix))}</p>
      </div>
    </article>
  `).join("");
}

function renderChecklist(items = activeTemplate().checklist) {
  if (!items?.length) {
    checklistRows.innerHTML = `<div class="empty-state">Chưa có danh sách việc cần làm.</div>`;
    return;
  }

  checklistRows.innerHTML = items.map((item) => {
    const [task, owner, deadline, status, priority] = Array.isArray(item)
      ? item
      : [item.task, item.owner, item.deadline, item.status, item.priority];
    const priorityClass = priorityClassName(priority);
    const statusClass = statusClassName(status);
    return `
      <article class="timeline-card ${priorityClass}">
        <span class="timeline-date">${escapeHTML(formatDeadline(deadline))}</span>
        <h4>${escapeHTML(friendlyText(task))}</h4>
        <div class="timeline-meta">
          <span class="meta-chip owner-chip"><em>Phụ trách</em><strong>${escapeHTML(ownerLabel(owner))}</strong></span>
          <span class="meta-chip status-chip ${statusClass}"><em>Trạng thái</em><strong>${escapeHTML(statusValueLabel(status))}</strong></span>
          <span class="pill risk-priority ${priorityClass}"><em>Mức rủi ro</em><strong>${escapeHTML(priorityLabel(priority))}</strong></span>
        </div>
      </article>
    `;
  }).join("");
}

function renderPostmortem(blocks) {
  if (Array.isArray(blocks) && blocks.length) {
    postmortemDraft.innerHTML = blocks.map((block) => `
      <section class="draft-block">
        <h3>${escapeHTML(headingText(block.title))}</h3>
        <ul>
          ${(block.items || []).map((item) => `<li>${escapeHTML(friendlyText(item))}</li>`).join("")}
        </ul>
      </section>
    `).join("");
    return;
  }

  renderPostmortem(activeTemplate().postmortem || []);
}

const RAG_TRACE_TEXT = {
  vi: {
    ragEmpty: "Chưa có dữ liệu RAG cho lần phân tích này. Tri thức quá khứ chỉ có khi phân tích chạy qua backend (local 8788 hoặc AgentBase).",
    ragType: "Phân loại nhận diện",
    ragGame: "Sản phẩm",
    ragLessons: "Bài học quá khứ khớp brief",
    ragLessonsEmpty: "Không có bài học quá khứ nào khớp từ khóa trong brief.",
    ragSnapshot: "Snapshot sản phẩm",
    ragFindings: "Cảnh báo từ dữ liệu vận hành",
    traceEmpty: "Chưa có trace. Bấm Chạy phân tích để xem pipeline 5 agent hoạt động.",
    traceLocalNote: "Kết quả này do rule-based local tạo (không qua backend) nên không có trace pipeline.",
    traceJson: "Xem JSON đầy đủ (agentsTrace + llmRouting)",
    traceCopied: "Đã copy!"
  },
  en: {
    ragEmpty: "No RAG data for this analysis. Past knowledge is only available when the analysis runs through the backend (local 8788 or AgentBase).",
    ragType: "Detected type",
    ragGame: "Product",
    ragLessons: "Past lessons matching this brief",
    ragLessonsEmpty: "No past lessons matched the keywords in this brief.",
    ragSnapshot: "Product snapshot",
    ragFindings: "Operational data warnings",
    traceEmpty: "No trace yet. Click Run Analysis to watch the 5-agent pipeline.",
    traceLocalNote: "This result was generated by the rule-based local fallback (no backend), so there is no pipeline trace.",
    traceJson: "View full JSON (agentsTrace + llmRouting)",
    traceCopied: "Copied!"
  }
};

function ragTraceDict() {
  let lang = "vi";
  try {
    lang = localStorage.getItem("launchops_lang") || "vi";
  } catch (error) {
    lang = "vi";
  }
  return RAG_TRACE_TEXT[lang] || RAG_TRACE_TEXT.vi;
}

function renderRagInsights(result) {
  if (!ragInsightsBody) return;
  const dict = ragTraceDict();
  const context = result && result.productContext ? result.productContext : null;
  if (!context) {
    ragInsightsBody.innerHTML = `<div class="empty-state">${dict.ragEmpty}</div>`;
    return;
  }

  const lessons = Array.isArray(context.lessons) ? context.lessons : [];
  const snapshot = context.snapshot && typeof context.snapshot === "object" ? context.snapshot : null;
  const health = context.productHealth || {};
  const findings = Array.isArray(health.findings) ? health.findings : [];

  const chips = `
    <div class="rag-context-row">
      <span class="rag-chip">${dict.ragType}: <b>${escapeHTML(String(context.launchType || "?"))}</b></span>
      <span class="rag-chip">${dict.ragGame}: <b>${escapeHTML(String(context.gameId || "?"))}</b></span>
    </div>`;

  const lessonsHtml = lessons.length
    ? lessons.map((lesson) => {
        const severity = String(lesson.severity || "").trim();
        const severityClass = severity.toLowerCase() === "high" ? "red" : "yellow";
        return `
          <article class="rag-lesson">
            <div class="rag-lesson-head">
              <b>${escapeHTML(String(lesson.title || lesson.id || ""))}</b>
              ${severity ? `<span class="mini-pill ${severityClass}">${escapeHTML(severity)}</span>` : ""}
            </div>
            <p>${escapeHTML(String(lesson.lesson || ""))}</p>
          </article>`;
      }).join("")
    : `<div class="empty-state">${dict.ragLessonsEmpty}</div>`;

  const snapshotEntries = snapshot
    ? Object.entries(snapshot).filter(([key, value]) =>
        key !== "hotFindings" && (typeof value === "string" || typeof value === "number"))
    : [];
  const snapshotHtml = snapshotEntries.length
    ? `<div>
        <span class="rag-section-label">${dict.ragSnapshot}</span>
        <div class="rag-stats">
          ${snapshotEntries.map(([key, value]) =>
            `<div class="rag-stat"><span>${escapeHTML(key)}</span><strong>${escapeHTML(String(value))}</strong></div>`).join("")}
        </div>
      </div>`
    : "";

  const findingsHtml = findings.length
    ? `<div class="rag-findings">
        <b>${dict.ragFindings}</b>
        <ul>${findings.map((item) => `<li>${escapeHTML(String(item))}</li>`).join("")}</ul>
      </div>`
    : "";

  ragInsightsBody.innerHTML = `
    ${chips}
    <div class="rag-grid">
      <div>
        <span class="rag-section-label">${dict.ragLessons}</span>
        <div class="rag-lessons">${lessonsHtml}</div>
      </div>
      <div class="rag-side">
        ${snapshotHtml}
        ${findingsHtml}
      </div>
    </div>`;
}

function renderAgentsTrace(result) {
  if (!traceConsoleBody) return;
  const dict = ragTraceDict();
  lastRagTraceResult = result || null;

  const trace = Array.isArray(result?.agentsTrace) && result.agentsTrace.length
    ? result.agentsTrace
    : Array.isArray(result?.trace) ? result.trace : [];

  if (!trace.length) {
    traceConsoleBody.innerHTML = `<div class="empty-state">${result ? dict.traceLocalNote : dict.traceEmpty}</div>`;
    return;
  }

  const routing = result.llmRouting || {};
  const steps = trace.map((step, index) => {
    const agent = String(step.agent || `step-${index + 1}`);
    const ok = String(step.status || "ok").toLowerCase() === "ok";
    const routed = routing[agent.replace(/_/g, "")] || routing[agent] || null;
    const model = (step.llm && step.llm.model) || (routed && routed.model) || "";
    const detail = Object.entries(step)
      .filter(([key]) => key !== "agent" && key !== "status" && key !== "llm")
      .map(([key, value]) => `${key}: ${typeof value === "object" && value !== null ? JSON.stringify(value) : value}`)
      .join(" · ");
    return `
      <div class="trace-step">
        <span class="trace-step-no">${String(index + 1).padStart(2, "0")}</span>
        <span class="trace-dot ${ok ? "ok" : "error"}"></span>
        <div class="trace-step-main">
          <b>${escapeHTML(agent)}</b>
          <small>${escapeHTML(detail)}</small>
        </div>
        ${model ? `<span class="trace-model">${escapeHTML(String(model))}</span>` : ""}
      </div>`;
  }).join("");

  const payload = {
    source: result.source || "rule",
    agentsTrace: trace,
    llmRouting: result.llmRouting || null
  };
  traceConsoleBody.innerHTML = `
    ${steps}
    <details class="trace-json">
      <summary>${dict.traceJson}</summary>
      <pre>${escapeHTML(JSON.stringify(payload, null, 2))}</pre>
    </details>`;
}

if (traceCopyButton) {
  traceCopyButton.addEventListener("click", async () => {
    const result = lastRagTraceResult || {};
    const payload = {
      source: result.source || "rule",
      agentsTrace: result.agentsTrace || result.trace || [],
      llmRouting: result.llmRouting || null,
      productContext: result.productContext || null
    };
    const json = JSON.stringify(payload, null, 2);
    let copied = false;
    try {
      await navigator.clipboard.writeText(json);
      copied = true;
    } catch (error) {
      try {
        const helper = document.createElement("textarea");
        helper.value = json;
        document.body.appendChild(helper);
        helper.select();
        copied = document.execCommand("copy");
        helper.remove();
      } catch (fallbackError) {
        copied = false;
      }
    }
    if (copied) {
      const original = traceCopyButton.textContent;
      traceCopyButton.textContent = ragTraceDict().traceCopied;
      window.setTimeout(() => {
        traceCopyButton.textContent = original;
      }, 1400);
    }
  });
}

function renderLocalAnalysis(sourceLabel = "Rule-based local preview") {
  const briefText = briefInput.value.trim();
  if (!briefText) {
    renderEmptyAnalysis("Chưa có brief để phân tích.");
    return;
  }
  renderApiAnalysis(buildLocalAnalysisResult(briefText), sourceLabel);
}

function renderApiAnalysis(result, sourceOverride) {
  const decision = result?.decision || {};
  const color = decision.color || "Yellow";
  const score = Number(decision.score) || 0;
  const maxScore = Number(decision.maxScore) || 12;

  renderDecision({
    color,
    score,
    maxScore,
    title: decision.title,
    reason: decision.reason,
    sourceLabel: sourceLabelFor(result, sourceOverride)
  });
  renderRiskBreakdown(result.riskBreakdown || []);
  renderTopRisks(result.topRisks || []);
  renderRedTeam(result.redTeam || []);
  renderChecklist(result.checklist || []);
  renderPostmortem(result.postmortem || []);
  renderRagInsights(result);
  renderAgentsTrace(result);
}

function renderEmptyAnalysis(reason) {
  renderDecision({
    color: "Yellow",
    score: 0,
    maxScore: 12,
    title: "Chưa có phân tích",
    reason,
    sourceLabel: "Đang chờ brief"
  });
  renderRiskBreakdown([]);
  renderTopRisks([]);
  renderRedTeam([]);
  renderChecklist([]);
  renderPostmortem([]);
  renderRagInsights(null);
  renderAgentsTrace(null);
}

function latestHistoryTimestamp(launch) {
  const timestamps = [
    ...(launch?.analyses || []).map((item) => item.createdAt),
    ...(launch?.lessonsLearned || []).map((item) => item.createdAt)
  ].filter(Boolean);
  if (!timestamps.length) return "";
  return timestamps
    .slice()
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
}

function summarizeClientLaunch(launch) {
  const analyses = launch?.analyses || [];
  const latest = analyses.length ? analyses[analyses.length - 1].result : null;
  return {
    id: launch.id,
    name: launch.name,
    type: launch.type,
    templateName: templateDisplayName(launch.template || defaultTemplateForType(launch.type || "Game event")),
    status: normalizeStatus(launch.status),
    owner: launch.owner,
    targetDate: launch.targetDate,
    updatedAt: launch.updatedAt,
    latestHistoryAt: latestHistoryTimestamp(launch),
    analysisCount: analyses.length,
    lessonCount: (launch.lessonsLearned || []).length,
    decision: latest?.decision,
    endDate: launch.endDate
  };
}

function upsertLaunchSummary(launchOrSummary) {
  const summary = launchOrSummary.analyses ? summarizeClientLaunch(launchOrSummary) : launchOrSummary;
  const index = launches.findIndex((item) => item.id === summary.id);
  if (index >= 0) launches[index] = { ...launches[index], ...summary };
  else launches.push(summary);
}

function statusClassFromDecision(decision) {
  const color = decision?.color || "";
  return color.toLowerCase();
}

function launchMatchesBoardFilter(launch) {
  const status = normalizeStatus(launch.status);
  const matchesStatus = launchStatusFilter === "all" || status === launchStatusFilter;
  const query = normalizeText(launchSearchQuery.trim());
  if (!matchesStatus) return false;
  if (!query) return true;

  const searchText = normalizeText([
    launch.name,
    typeLabel(launch.type),
    STATUS_LABELS[status],
    launch.owner
  ].filter(Boolean).join(" "));

  return searchText.includes(query);
}

function renderLaunchGroups() {
  if (launchStatusFilterSelect) launchStatusFilterSelect.value = launchStatusFilter;

  const visibleStatuses = launchStatusFilter === "all"
    ? STATUS_ORDER
    : STATUS_ORDER.filter((status) => status === launchStatusFilter);
  const isFiltering = Boolean(launchSearchQuery.trim()) || launchStatusFilter !== "all";

  launchGroups.innerHTML = visibleStatuses.map((status) => {
    const items = launches.filter((launch) => normalizeStatus(launch.status) === status && launchMatchesBoardFilter(launch));
    const cards = items.length
      ? items.map((launch) => {
        const isActive = currentLaunch?.id === launch.id && !draftMode;
        const launchNameText = launch.name || "Launch chưa đặt tên";
        const analysisCount = Number(launch.analysisCount) || 0;
        const lessonCount = Number(launch.lessonCount) || 0;
        const lastSavedAt = launch.latestHistoryAt || launch.updatedAt || "";
        const lastSavedLabel = lastSavedAt ? formatDate(lastSavedAt) : "Chưa có";
        const templateNameText = launch.templateName || templateDisplayName(defaultTemplateForType(launch.type || "Game event"));
        const readinessClass = statusClassFromDecision(launch.decision) || "unknown";
        const readinessLabel = launch.decision
          ? `${colorLabel(launch.decision.color || "Yellow")} ${launch.decision.score ?? 0}/${launch.decision.maxScore || templateMax(defaultTemplateForType(launch.type || "Game event"))}`
          : tr("Chưa có điểm readiness", "No readiness score yet");
        return `
          <button class="launch-card ${isActive ? "active" : ""} readiness-${escapeHTML(readinessClass)}" type="button" data-launch-id="${escapeHTML(launch.id)}" aria-label="Mở chi tiết ${escapeHTML(launchNameText)}. ${escapeHTML(readinessLabel)}" title="${escapeHTML(readinessLabel)}">
            <strong>${escapeHTML(launchNameText)}</strong>
            <small class="launch-card-meta-line">${escapeHTML(typeLabel(launch.type))} · ${escapeHTML(templateNameText)}</small>
            <small class="launch-card-owner-line">${escapeHTML(launch.owner ? ownerLabel(launch.owner) : tr("Chưa có owner", "No owner yet"))} · ${escapeHTML(lastSavedLabel)}</small>
            <span class="launch-card-history ${lastSavedAt ? "" : "empty"}">
              <span>${tr("Lịch sử đã lưu", "Saved history")}</span>
              <strong>${escapeHTML(analysisCount)} ${tr("phân tích", "analyses")} · ${escapeHTML(lessonCount)} ${tr("bài học", "lessons")}</strong>
              <small>${tr("Mức sẵn sàng", "Readiness")}: ${escapeHTML(readinessLabel)}</small>
            </span>
          </button>
        `;
      }).join("")
      : `<div class="empty-state">${isFiltering ? "Không có launch phù hợp." : STATUS_HINTS[status]}</div>`;

    return `
      <section class="launch-group">
        <h3>${statusDisplayLabel(status)} <span class="launch-count">${items.length}</span></h3>
        <div class="launch-list">${cards}</div>
      </section>
    `;
  }).join("");
}

function setFormFromLaunch(launch) {
  launchName.value = launch?.name || "";
  ensureLaunchType(launch?.type || "Game event");
  renderLaunchTypeOptions(launch?.type || "Game event");
  launchType.value = launch?.type || "Game event";
  launchStatus.value = normalizeStatus(launch?.status);
  launchOwner.value = launch?.owner || "";
  setVisibleDateValue(launchTargetDate, launchTargetDateNative, launch?.targetDate);
  setVisibleDateValue(launchEndDate, launchEndDateNative, launch?.endDate);
  briefInput.value = launch?.brief || "";
  briefInput.scrollTop = 0;
  if (launch && !launch.template) launch.template = defaultTemplateForType(launch.type || "Game event");
}

function collectLaunchFromForm() {
  const selectedType = launchType.value;
  return {
    id: currentLaunch?.id,
    name: launchName.value.trim() || "Launch mới",
    type: selectedType,
    status: normalizeStatus(launchStatus.value),
    owner: launchOwner.value.trim(),
    targetDate: normalizeDateForStorage(launchTargetDate.value),
    endDate: normalizeDateForStorage(launchEndDate.value),
    brief: briefInput.value.trim(),
    template: defaultTemplateForType(selectedType),
    templateVersions: currentLaunch?.templateVersions || [],
    lessonSuggestions: currentLaunch?.lessonSuggestions || []
  };
}

function renderLaunchSnapshot() {
  const launch = currentLaunch || collectLaunchFromForm();
  const analyses = launch?.analyses || [];
  const lessons = launch?.lessonsLearned || [];
  const latest = analyses.length ? analyses[analyses.length - 1].result?.decision : null;
  launchMemoryStats.innerHTML = `
    <strong>${escapeHTML(analyses.length)} ${tr("lần phân tích", "analyses")}</strong>
    <strong>${escapeHTML(lessons.length)} ${tr("bài học", "lessons")}</strong>
  `;
  detailTitle.textContent = launch?.name || "Launch mới";
  detailSub.innerHTML = `
    <span class="meta-chip status">${escapeHTML(statusDisplayLabel(normalizeStatus(launch?.status)))}</span>
    <span class="meta-chip">${escapeHTML(typeLabel(launch?.type))}</span>
    <span class="meta-chip">${escapeHTML(launch?.owner || tr("Chưa có người phụ trách", "No owner yet"))}</span>
  `;

  launchSnapshot.innerHTML = `
    <div class="snapshot-item">
      <span>Trạng thái</span>
      <strong>${escapeHTML(STATUS_LABELS[normalizeStatus(launch?.status)])}</strong>
      <small>${escapeHTML(STATUS_HINTS[normalizeStatus(launch?.status)])}</small>
    </div>
    <div class="snapshot-item">
      <span>Kết luận mới nhất</span>
      <strong>${escapeHTML(latest ? `${colorLabel(latest.color)} ${latest.score}/${latest.maxScore || 12}` : "Chưa có")}</strong>
      <small>${analyses.length ? `Cập nhật: ${escapeHTML(formatDate(analyses[analyses.length - 1].createdAt))}` : "Bấm Chạy phân tích để lưu kết quả đầu tiên."}</small>
    </div>
    <div class="snapshot-item">
      <span>Người phụ trách</span>
      <strong>${escapeHTML(launch?.owner || "Chưa có")}</strong>
      <small>Người hoặc team chịu trách nhiệm chính.</small>
    </div>
    <div class="snapshot-item">
      <span>Start Launch</span>
      <strong>${escapeHTML(formatDateOnly(launch?.targetDate, "Chưa có"))}</strong>
      <small>Ngày bắt đầu chạy launch.</small>
    </div>
    <div class="snapshot-item">
      <span>End Launch</span>
      <strong>${escapeHTML(formatDateOnly(launch?.endDate, "Chưa có"))}</strong>
      <small>Ngày kết thúc hoặc ngày cần tổng kết.</small>
    </div>
  `;
}

function renderBriefGuide() {
  const template = activeTemplate();
  if (briefGuideDescription) {
    briefGuideDescription.textContent = template.description || "Viết như một bản mô tả launch thật. Không cần văn hay, nhưng cần đủ dữ liệu để Agent chấm rủi ro.";
  }
  if (briefGuideItems) {
    briefGuideItems.innerHTML = (template.briefGuide || DEFAULT_BRIEF_GUIDE)
      .map((item) => `<li>${escapeHTML(item)}</li>`)
      .join("");
  }
}

function renderTemplateOperatorOptions() {
  if (!templateOperator) return;
  templateOperator.innerHTML = TEMPLATE_OPERATORS.map((item) => `
    <option value="${escapeHTML(item.id)}" ${item.id === templateOperatorId ? "selected" : ""}>
      ${escapeHTML(item.name)} - ${escapeHTML(item.access)}
    </option>
  `).join("");
  templateOperator.disabled = TEMPLATE_EDITING_LOCKED;
}

function renderTemplatePermissionState() {
  if (!templatePermissionState) return;
  const operator = activeTemplateOperator();
  const stateClass = canEditTemplate() ? "allowed" : "locked";
  const title = TEMPLATE_EDITING_LOCKED
    ? "Đang khóa chỉnh cấu hình cho bản review"
    : operator.canEdit
      ? "Có quyền chỉnh cấu hình"
      : "Chỉ được xem cấu hình";
  const detail = TEMPLATE_EDITING_LOCKED
    ? "Bạn bè review chỉ xem được template. Các nút thêm/xóa/lưu/duyệt suggestion đã bị khóa để tránh sửa nhầm dữ liệu demo."
    : operator.canEdit
      ? "Thay đổi lưu vào cấu hình chung của phân loại đang chọn trong phiên local. Khi lên production cần backend/admin workflow riêng."
      : "Bạn vẫn xem được toàn bộ cấu hình, nhưng không thể thêm/xóa/sửa tiêu chí trong bản demo này.";

  templatePermissionState.className = `permission-state ${stateClass}`;
  templatePermissionState.innerHTML = `
    <span>${escapeHTML(operator.role)}</span>
    <strong>${escapeHTML(title)}</strong>
    <small>${escapeHTML(detail)}</small>
  `;
}

function renderTemplateAdminList() {
  if (!templateAdminList) return;
  templateAdminList.innerHTML = TEMPLATE_OPERATORS.map((item) => `
    <article class="admin-row ${item.canEdit ? "can-edit" : "read-only"}">
      <div>
        <strong>${escapeHTML(item.name)}</strong>
        <small>${escapeHTML(item.role)} · ${escapeHTML(item.scope)}</small>
      </div>
      <span>${escapeHTML(item.access)}</span>
    </article>
  `).join("");
}

function renderEditorActions(type, editable) {
  return `
    <button type="button" class="danger-button" data-template-remove="${escapeHTML(type)}"${disabledAttr(editable)}>Xóa</button>
  `;
}

function renderRiskGroupCard(group = {}, index = 0, editable = true) {
  return `
    <article class="template-editor-card" data-template-item="risk">
      <div class="editor-card-head">
        <div>
          <span class="config-index" data-index-label>R${index + 1}</span>
          <strong>${escapeHTML(group.label || "Nhóm rủi ro mới")}</strong>
        </div>
        ${renderEditorActions("risk", editable)}
      </div>
      <div class="editor-grid risk-editor-grid">
        <label class="field">
          <span>Tên nhóm</span>
          <input data-field="label" type="text" value="${escapeHTML(group.label || "")}"${disabledAttr(editable)}>
        </label>
        <label class="field score-input">
          <span>Điểm tối đa <button class="help-button inline" type="button" aria-label="Giải thích điểm tối đa" data-tooltip="Đây là trọng số của nhóm rủi ro này. Tổng điểm readiness bằng tổng Điểm tối đa của tất cả nhóm. Agent chấm 0 đến mức này dựa trên tiêu chí đạt điểm và nội dung brief.">?</button></span>
          <input data-field="maxScore" type="number" min="1" max="5" value="${escapeHTML(group.maxScore || 2)}"${disabledAttr(editable)}>
        </label>
        <label class="field wide">
          <span>Tiêu chí đạt điểm <button class="help-button inline" type="button" aria-label="Giải thích tiêu chí đạt điểm" data-tooltip="Đây là checklist điều kiện để nhóm này được điểm cao. AI thật sẽ đọc các tiêu chí này trong prompt; demo local dùng thêm từ khóa để chấm nhanh.">?</button></span>
          <textarea data-field="requirements" spellcheck="false"${disabledAttr(editable)}>${escapeHTML((group.requirements || []).join("\n"))}</textarea>
        </label>
        <label class="field wide">
          <span>Từ khóa demo local <button class="help-button inline" type="button" aria-label="Giải thích từ khóa demo local" data-tooltip="Chỉ dùng cho chế độ fallback/rule-based local. Nếu brief có các từ khóa này, app có thêm bằng chứng để chấm điểm nhóm rủi ro. AI thật vẫn đọc toàn bộ tiêu chí và brief.">?</button></span>
          <textarea data-field="checks" spellcheck="false"${disabledAttr(editable)}>${escapeHTML((group.checks || []).join(", "))}</textarea>
        </label>
        <label class="field wide">
          <span>Khi thiếu thì nói gì? <button class="help-button inline" type="button" aria-label="Giải thích khi thiếu thì nói gì" data-tooltip="Đây là câu Agent dùng để giải thích khi brief chưa đủ dữ liệu cho nhóm rủi ro này. Human sửa câu này rồi lưu cấu hình chung thì lần phân tích sau sẽ dùng câu mới.">?</button></span>
          <textarea data-field="missing" spellcheck="false"${disabledAttr(editable)}>${escapeHTML(group.missing || "")}</textarea>
        </label>
      </div>
    </article>
  `;
}

function renderPersonaCard(item = {}, index = 0, editable = true) {
  const displayPersona = personaLabel(item.persona);
  return `
    <article class="template-editor-card" data-template-item="persona">
      <div class="editor-card-head">
        <div>
          <span class="config-index" data-index-label>P${index + 1}</span>
          <strong>${escapeHTML(displayPersona || "Người phản biện mới")}</strong>
        </div>
        ${renderEditorActions("persona", editable)}
      </div>
      <div class="editor-grid">
        <label class="field">
          <span>Vai trò phản biện</span>
          <input data-field="persona" type="text" value="${escapeHTML(displayPersona || "")}"${disabledAttr(editable)}>
        </label>
        <label class="field">
          <span>Lo ngại chính</span>
          <textarea data-field="worry" spellcheck="false"${disabledAttr(editable)}>${escapeHTML(item.worry || "")}</textarea>
        </label>
        <label class="field">
          <span>Dấu hiệu cần tìm</span>
          <textarea data-field="evidence" spellcheck="false"${disabledAttr(editable)}>${escapeHTML(item.evidence || "")}</textarea>
        </label>
        <label class="field">
          <span>Cách xử lý</span>
          <textarea data-field="fix" spellcheck="false"${disabledAttr(editable)}>${escapeHTML(item.fix || "")}</textarea>
        </label>
      </div>
    </article>
  `;
}

function optionHTML(value, label, selectedValue) {
  return `<option value="${escapeHTML(value)}" ${value === selectedValue ? "selected" : ""}>${escapeHTML(label)}</option>`;
}

function renderChecklistCard(item = {}, index = 0, editable = true) {
  const status = item.status || "Todo";
  const priority = item.priority || "Medium";
  return `
    <article class="template-list-row" data-template-item="checklist">
      <div class="checklist-topline">
        <span class="config-index" data-index-label>C${index + 1}</span>
        <label class="field task-field">
          <span>Việc cần làm</span>
          <input data-field="task" type="text" value="${escapeHTML(item.task || "")}"${disabledAttr(editable)}>
        </label>
      </div>
      <div class="checklist-meta-line">
        <label class="field">
          <span>Phụ trách</span>
          <input data-field="owner" type="text" value="${escapeHTML(item.owner || "")}"${disabledAttr(editable)}>
        </label>
        <label class="field">
          <span>Deadline</span>
          <input data-field="deadline" type="text" value="${escapeHTML(item.deadline || "T-1 ngày")}"${disabledAttr(editable)}>
        </label>
        <label class="field">
          <span>Trạng thái</span>
          <select data-field="status"${disabledAttr(editable)}>
            ${Object.entries(STATUS_VALUE_LABELS).map(([value, label]) => optionHTML(value, label, status)).join("")}
          </select>
        </label>
        <label class="field">
          <span>Mức rủi ro</span>
          <select data-field="priority"${disabledAttr(editable)}>
            ${Object.entries(PRIORITY_LABELS).map(([value, label]) => optionHTML(value, label, priority)).join("")}
          </select>
        </label>
        ${renderEditorActions("checklist", editable)}
      </div>
    </article>
  `;
}

function renderLessonCard(block = {}, index = 0, editable = true) {
  return `
    <article class="template-editor-card" data-template-item="lesson">
      <div class="editor-card-head">
        <div>
          <span class="config-index" data-index-label>L${index + 1}</span>
          <strong>${escapeHTML(block.title || "Block bài học mới")}</strong>
        </div>
        ${renderEditorActions("lesson", editable)}
      </div>
      <div class="editor-grid">
        <label class="field">
          <span>Tiêu đề block</span>
          <input data-field="title" type="text" value="${escapeHTML(block.title || "")}"${disabledAttr(editable)}>
        </label>
        <label class="field">
          <span>Câu hỏi, mỗi dòng một câu</span>
          <textarea data-field="items" spellcheck="false"${disabledAttr(editable)}>${escapeHTML((block.items || []).join("\n"))}</textarea>
        </label>
      </div>
    </article>
  `;
}

function setTemplateEditorControls(editable) {
  [saveTemplateButton, resetTemplateButton, addRiskGroupButton, addPersonaButton, addChecklistItemButton, addLessonBlockButton]
    .filter(Boolean)
    .forEach((button) => {
      button.disabled = !editable;
    });
  templateManager?.classList.toggle("locked", !editable);
}

function updateTemplateDraftSummary() {
  if (!templateName) return;
  const riskGroups = collectRiskGroupsFromEditor();
  const personas = collectPersonasFromEditor();
  templateMaxScore.textContent = String(riskGroups.reduce((sum, group) => sum + (Number(group.maxScore) || 2), 0));
  templateRiskCount.textContent = String(riskGroups.length);
  templatePersonaCount.textContent = String(personas.length);
}

function reindexTemplateCards(container, prefix) {
  editorCards(container, container === riskGroupEditor ? "risk" : container === personaEditor ? "persona" : container === checklistEditor ? "checklist" : "lesson")
    .forEach((card, index) => {
      const label = card.querySelector("[data-index-label]");
      if (label) label.textContent = `${prefix}${index + 1}`;
    });
}

function blankTemplateItem(type) {
  const next = Date.now().toString().slice(-4);
  if (type === "risk") {
    return {
      label: `Nhóm rủi ro mới ${next}`,
      maxScore: 2,
      requirements: ["Tiêu chí cần có"],
      checks: ["tu khoa"],
      missing: "Chưa đủ thông tin cho nhóm rủi ro này."
    };
  }
  if (type === "persona") {
    return {
      persona: `Người phản biện mới ${next}`,
      worry: "Điểm đáng lo nhất là gì?",
      evidence: "Dấu hiệu nào trong brief cho thấy rủi ro này?",
      fix: "Team cần làm gì để giảm rủi ro?"
    };
  }
  if (type === "checklist") {
    return {
      task: `Việc cần làm mới ${next}`,
      owner: "Launch Owner",
      deadline: "T-1 ngày",
      status: "Todo",
      priority: "Medium"
    };
  }
  return {
    title: `Block bài học mới ${next}`,
    items: ["Câu hỏi cần trả lời sau launch"]
  };
}

function addTemplateEditorItem(type) {
  if (!canEditTemplate()) {
    analysisSource.textContent = "Bạn đang ở quyền chỉ xem, không thể chỉnh cấu hình.";
    return;
  }
  const editable = true;
  if (type === "risk" && riskGroupEditor) {
    riskGroupEditor.insertAdjacentHTML("beforeend", renderRiskGroupCard(blankTemplateItem(type), editorCards(riskGroupEditor, "risk").length, editable));
    reindexTemplateCards(riskGroupEditor, "R");
  }
  if (type === "persona" && personaEditor) {
    personaEditor.insertAdjacentHTML("beforeend", renderPersonaCard(blankTemplateItem(type), editorCards(personaEditor, "persona").length, editable));
    reindexTemplateCards(personaEditor, "P");
  }
  if (type === "checklist" && checklistEditor) {
    checklistEditor.insertAdjacentHTML("beforeend", renderChecklistCard(blankTemplateItem(type), editorCards(checklistEditor, "checklist").length, editable));
    reindexTemplateCards(checklistEditor, "C");
  }
  if (type === "lesson" && lessonEditor) {
    lessonEditor.insertAdjacentHTML("beforeend", renderLessonCard(blankTemplateItem(type), editorCards(lessonEditor, "lesson").length, editable));
    reindexTemplateCards(lessonEditor, "L");
  }
  updateTemplateDraftSummary();
}

function removeTemplateEditorItem(button) {
  if (!canEditTemplate()) {
    analysisSource.textContent = "Bạn đang ở quyền chỉ xem, không thể chỉnh cấu hình.";
    return;
  }
  const card = button.closest("[data-template-item]");
  const type = button.dataset.templateRemove;
  card?.remove();
  if (type === "risk") reindexTemplateCards(riskGroupEditor, "R");
  if (type === "persona") reindexTemplateCards(personaEditor, "P");
  if (type === "checklist") reindexTemplateCards(checklistEditor, "C");
  if (type === "lesson") reindexTemplateCards(lessonEditor, "L");
  updateTemplateDraftSummary();
}

function renderTemplateConfig() {
  if (!templateName) return;
  const template = configTemplate();
  const maxScore = templateMax(template);
  const editable = canEditTemplate();

  renderTemplateOperatorOptions();
  renderTemplatePermissionState();
  renderTemplateAdminList();
  renderTemplateVersionHistory();
  setTemplateEditorControls(editable);
  renderTemplateSelectorOptions(template, editable);
  renderLaunchTypeOptions(currentLaunch?.type || launchType?.value);
  renderTemplateCatalog(editable);

  templateName.dataset.baseName = template.name;
  templateName.textContent = `Bộ luật: ${templateDisplayName(template)}${template.customized ? " · Đã tùy chỉnh" : ""}`;
  templateMaxScore.textContent = String(maxScore);
  templateRiskCount.textContent = String((template.riskGroups || []).length);
  templatePersonaCount.textContent = String((template.redTeam || []).length);

  if (riskGroupEditor) {
    riskGroupEditor.innerHTML = (template.riskGroups || [])
      .map((group, index) => renderRiskGroupCard(group, index, editable))
      .join("");
  }
  if (personaEditor) {
    personaEditor.innerHTML = (template.redTeam || [])
      .map((item, index) => renderPersonaCard(item, index, editable))
      .join("");
  }
  if (checklistEditor) {
    checklistEditor.innerHTML = (template.checklist || [])
      .map((item, index) => renderChecklistCard(item, index, editable))
      .join("");
  }
  if (lessonEditor) {
    lessonEditor.innerHTML = (template.postmortem || [])
      .map((block, index) => renderLessonCard(block, index, editable))
      .join("");
  }
}

function renderHistory() {
  const analyses = currentLaunch?.analyses || [];
  if (!analyses.length) {
    analysisHistory.innerHTML = `<div class="empty-state">Launch này chưa có lịch sử. Bấm Chạy phân tích để tạo bản ghi đầu tiên.</div>`;
    return;
  }

  analysisHistory.innerHTML = analyses.slice().reverse().map((analysis, index) => {
    const decision = analysis.result?.decision || {};
    const label = `${colorLabel(decision.color || "Yellow")} ${decision.score ?? 0}/${decision.maxScore || 12}`;
    return `
      <article class="history-card">
        <div>
          <strong>#${analyses.length - index} · ${escapeHTML(label)}</strong>
          <small>${escapeHTML(formatDate(analysis.createdAt))} · ${escapeHTML(sourceLabelFor(analysis.result))}</small>
        </div>
        <button type="button" data-analysis-id="${escapeHTML(analysis.id)}">Mở lại</button>
      </article>
    `;
  }).join("");
}

function latestAnalysisResult() {
  const analyses = currentLaunch?.analyses || [];
  return analyses.length ? analyses[analyses.length - 1].result : null;
}

function reportResult() {
  return latestAnalysisResult() || (briefInput.value.trim() ? buildLocalAnalysisResult(briefInput.value.trim(), "local_preview") : null);
}

function markdownList(items = [], mapper = (item) => item) {
  if (!items.length) return "- Chưa có";
  return items.map((item) => `- ${mapper(item)}`).join("\n");
}

function generateLaunchReportMarkdown() {
  const launch = currentLaunch || collectLaunchFromForm();
  const result = reportResult();
  const decision = result?.decision || {};
  const template = activeTemplate();
  const lessons = launch?.lessonsLearned || [];
  const versions = launch?.templateVersions || [];

  const riskLines = markdownList(result?.riskBreakdown || [], (item) => {
    const score = Number(item.score) || 0;
    const maxScore = Number(item.maxScore) || 2;
    return `${friendlyText(riskLabel(item.label))}: ${score}/${maxScore} - ${friendlyText(item.missing || "Ổn")}`;
  });
  const redTeamLines = markdownList(result?.redTeam || template.redTeam || [], (item) =>
    `${personaLabel(item.persona)}: ${friendlyText(item.worry)} | Cách xử lý: ${friendlyText(item.fix)}`
  );
  const checklistLines = markdownList(result?.checklist || template.checklist || [], (item) => {
    const row = Array.isArray(item)
      ? { task: item[0], owner: item[1], deadline: item[2], status: item[3], priority: item[4] }
      : item;
    return `[${priorityLabel(row.priority)}] ${friendlyText(row.task)} - ${ownerLabel(row.owner)} - ${formatDeadline(row.deadline)} - ${statusValueLabel(row.status)}`;
  });
  const lessonLines = markdownList(lessons, (item) => `${friendlyText(item.text)} (${formatDate(item.createdAt)})`);
  const versionLines = markdownList(versions.slice(-5), (item) =>
    `v${item.version} - ${item.note || "Snapshot template"} - ${item.author || "Admin"} - ${formatDate(item.createdAt)}`
  );

  return `# LaunchOps Report - ${launch?.name || "Launch mới"}

## 1. Tóm tắt launch
- Phân loại: ${typeLabel(launch?.type)}
- Trạng thái: ${STATUS_LABELS[normalizeStatus(launch?.status)]}
- Người phụ trách: ${launch?.owner || "Chưa có"}
- Start Launch: ${formatDateOnly(launch?.targetDate, "Chưa có")}
- End Launch: ${formatDateOnly(launch?.endDate, "Chưa có")}
- Template: ${template.name || "Template mặc định"}

## 2. Kết luận readiness
- Màu: ${colorLabel(decision.color || "Yellow")}
- Điểm: ${decision.score ?? 0}/${decision.maxScore || templateMax(template)}
- Lý do: ${friendlyText(decision.reason || "Chưa có phân tích")}

## 3. Top risks
${markdownList(result?.topRisks || [], (item) => friendlyText(item))}

## 4. Điểm theo nhóm rủi ro
${riskLines}

## 5. Nhóm phản biện
${redTeamLines}

## 6. Checklist
${checklistLines}

## 7. Bài học đã lưu
${lessonLines}

## 8. Template version gần nhất
${versionLines}
`;
}

function downloadTextFile(filename, content) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function exportLaunchReport() {
  const launch = currentLaunch || collectLaunchFromForm();
  const markdown = generateLaunchReportMarkdown();
  const filename = `${slugify(launch?.name || "launch-report") || "launch-report"}-report.md`;
  downloadTextFile(filename, markdown);
  try {
    await navigator.clipboard.writeText(markdown);
    analysisSource.textContent = "Đã export report và copy Markdown vào clipboard";
  } catch {
    analysisSource.textContent = "Đã export report Markdown";
  }
}

function ensureTemplateVersionHistory() {
  const type = configTemplateType();
  templateConfigVersions[type] = templateConfigVersions[type] || [];
  if (templateConfigVersions[type].length) return;
  const template = configTemplate();
  templateConfigVersions[type].push({
    id: `template-version-${Date.now()}`,
    version: 1,
    createdAt: new Date().toISOString(),
    author: "System",
    note: `Template gốc cho ${typeLabel(type)}`,
    summary: `${(template.riskGroups || []).length} nhóm rủi ro · ${(template.redTeam || []).length} góc phản biện · ${templateMax(template)} điểm`,
    template: cloneData(template)
  });
}

function addTemplateVersion(note, source = "manual") {
  const type = configTemplateType();
  ensureTemplateVersionHistory();
  const template = configTemplate();
  templateConfigVersions[type].push({
    id: `template-version-${Date.now()}`,
    version: templateConfigVersions[type].length + 1,
    createdAt: new Date().toISOString(),
    author: activeTemplateOperator().name,
    note,
    source,
    summary: `${(template.riskGroups || []).length} nhóm rủi ro · ${(template.redTeam || []).length} góc phản biện · ${templateMax(template)} điểm`,
    template: cloneData(template)
  });
}

function renderTemplateVersionHistory() {
  if (!templateVersionHistory) return;
  ensureTemplateVersionHistory();
  const versions = templateConfigVersions[configTemplateType()] || [];
  templateVersionHistory.innerHTML = versions.length
    ? versions.slice().reverse().map((item) => `
      <article class="version-row">
        <div>
          <strong>v${escapeHTML(item.version)} · ${escapeHTML(item.note || "Snapshot template")}</strong>
          <small>${escapeHTML(item.summary || "")}</small>
        </div>
        <span>${escapeHTML(item.author || "Admin")} · ${escapeHTML(formatDate(item.createdAt))}</span>
      </article>
    `).join("")
    : `<div class="empty-state">Chưa có version template.</div>`;
}

function suggestionExists(id) {
  return (currentLaunch?.lessonSuggestions || []).some((item) => item.id === id);
}

function addSuggestionIfMissing(suggestion) {
  if (!currentLaunch || suggestionExists(suggestion.id)) return;
  currentLaunch.lessonSuggestions = currentLaunch.lessonSuggestions || [];
  currentLaunch.lessonSuggestions.push({
    ...suggestion,
    status: "new",
    createdAt: new Date().toISOString()
  });
}

function ensureLessonSuggestions() {
  if (!currentLaunch) return;
  currentLaunch.lessonSuggestions = currentLaunch.lessonSuggestions || [];
  const result = latestAnalysisResult() || reportResult();
  const risks = result?.riskBreakdown || [];
  risks
    .filter((item) => (Number(item.score) || 0) < (Number(item.maxScore) || 2))
    .slice(0, 3)
    .forEach((risk) => {
      const label = friendlyText(riskLabel(risk.label));
      addSuggestionIfMissing({
        id: `risk-${slugify(label)}`,
        type: "riskRequirement",
        title: `Bổ sung tiêu chí cho ${label}`,
        reason: friendlyText(risk.missing || "Nhóm này thường thiếu dữ liệu trong brief."),
        target: label,
        payload: {
          label,
          requirement: friendlyText(risk.missing || `Bổ sung dữ liệu cho ${label}`)
        }
      });
    });

  const lessonText = (currentLaunch.lessonsLearned || []).map((item) => normalizeText(item.text)).join(" ");
  const topRiskText = normalizeText((result?.topRisks || []).join(" "));
  const combined = `${lessonText} ${topRiskText}`;

  if (combined.includes("faq") || combined.includes("cs")) {
    addSuggestionIfMissing({
      id: "checklist-cs-faq",
      type: "checklist",
      title: "Thêm task CS FAQ vào checklist",
      reason: "History/lesson nhắc tới FAQ hoặc CS, nên checklist cần có việc chốt FAQ trước launch.",
      payload: { task: "Chốt CS FAQ và mẫu trả lời trước launch", owner: "CS Lead", deadline: "T-1 ngày", status: "Todo", priority: "High" }
    });
  }
  if (combined.includes("rollback") || combined.includes("pause") || combined.includes("nguong dung")) {
    addSuggestionIfMissing({
      id: "checklist-rollback-threshold",
      type: "checklist",
      title: "Thêm task rollback/ngưỡng dừng",
      reason: "History/lesson nhắc tới rollback hoặc ngưỡng dừng, nên checklist cần bắt buộc có mục này.",
      payload: { task: "Chốt rollback plan và ngưỡng dừng launch", owner: "Tech Lead", deadline: "T-1 ngày", status: "Todo", priority: "High" }
    });
  }
  if (combined.includes("reward") || combined.includes("phan thuong")) {
    addSuggestionIfMissing({
      id: "persona-economy-reviewer",
      type: "persona",
      title: "Thêm người rà soát Economy/Reward",
      reason: "History/lesson nhắc tới reward, nên cần một góc phản biện chuyên kiểm tra tỷ lệ, ngân sách và lạm dụng.",
      payload: {
        persona: "Người rà soát Economy",
        worry: "Reward hoặc tỷ lệ có thể gây vượt ngân sách, mất cân bằng hoặc bị lạm dụng.",
        evidence: "Brief thiếu tỷ lệ, ngân sách, giới hạn hoặc guardrail phần thưởng.",
        fix: "Chốt reward table, ngân sách tối đa, giới hạn và log bất thường trước launch."
      }
    });
  }
}

function renderLessonSuggestions() {
  if (!lessonSuggestions) return;
  ensureLessonSuggestions();
  const suggestions = (currentLaunch?.lessonSuggestions || []).filter((item) => item.status !== "dismissed");
  if (!suggestions.length) {
    lessonSuggestions.innerHTML = `<div class="empty-state">Chưa có đề xuất. Sau khi có phân tích hoặc bài học, AI sẽ đề xuất cập nhật template để admin duyệt.</div>`;
    return;
  }

  const permissionNote = `
    <div class="suggestion-note">
      AI chỉ đề xuất cập nhật template để Human tham khảo. Chỉ Admin mới được bấm Duyệt vào template.
    </div>
  `;
  lessonSuggestions.innerHTML = permissionNote + suggestions.map((item) => {
    const accepted = item.status === "accepted";
    const locked = !canApproveTemplateSuggestion();
    return `
      <article class="suggestion-item ${accepted ? "accepted" : ""}">
        <div>
          <span class="section-kicker">${escapeHTML(item.type)}</span>
          <h4>${escapeHTML(item.title)}</h4>
          <p>${escapeHTML(friendlyText(item.reason))}</p>
        </div>
        <div class="suggestion-actions">
          <button type="button" data-suggestion-apply="${escapeHTML(item.id)}" ${accepted || locked ? "disabled" : ""}>${accepted ? "Đã duyệt" : "Duyệt vào template"}</button>
          <button type="button" data-suggestion-dismiss="${escapeHTML(item.id)}" ${accepted || locked ? "disabled" : ""}>Bỏ qua</button>
        </div>
      </article>
    `;
  }).join("");
}

function findSuggestion(id) {
  return (currentLaunch?.lessonSuggestions || []).find((item) => item.id === id);
}

function applyLessonSuggestion(id) {
  if (!canApproveTemplateSuggestion()) {
    analysisSource.textContent = "AI suggestion chỉ là tham khảo. Chỉ Admin mới được duyệt vào template.";
    return;
  }
  if (!currentLaunch) return;
  const suggestion = findSuggestion(id);
  if (!suggestion || suggestion.status === "accepted") return;
  const type = currentLaunch.type || firstLaunchType();
  selectedConfigType = launchTypeExists(type) ? type : firstLaunchType();
  ensureTemplateVersionHistory();
  const template = configTemplate();

  if (suggestion.type === "riskRequirement") {
    const target = normalizeText(suggestion.payload?.label || suggestion.target || "");
    const group = (template.riskGroups || []).find((item) => normalizeText(item.label) === target)
      || (template.riskGroups || [])[0];
    if (group) {
      group.requirements = group.requirements || [];
      const requirement = suggestion.payload?.requirement || suggestion.reason;
      if (!group.requirements.some((item) => normalizeText(item) === normalizeText(requirement))) {
        group.requirements.push(requirement);
      }
    }
  }
  if (suggestion.type === "checklist") {
    template.checklist = template.checklist || [];
    const task = suggestion.payload?.task || suggestion.title;
    if (!template.checklist.some((item) => normalizeText(item.task) === normalizeText(task))) {
      template.checklist.push(suggestion.payload);
    }
  }
  if (suggestion.type === "persona") {
    template.redTeam = template.redTeam || [];
    const persona = suggestion.payload?.persona || suggestion.title;
    if (!template.redTeam.some((item) => normalizeText(item.persona) === normalizeText(persona))) {
      template.redTeam.push(suggestion.payload);
    }
  }
  if (suggestion.type === "postmortem") {
    template.postmortem = template.postmortem || [];
    template.postmortem.push(suggestion.payload);
  }

  suggestion.status = "accepted";
  suggestion.acceptedAt = new Date().toISOString();
  suggestion.acceptedBy = activeTemplateOperator().name;
  LAUNCH_TEMPLATES[selectedConfigType] = normalizeTemplate({ ...template, customized: true }, selectedConfigType);
  currentLaunch.template = defaultTemplateForType(selectedConfigType);
  addTemplateVersion(`Duyệt AI suggestion: ${suggestion.title}`, "ai_suggestion");
  renderLaunchWorkspace();
  analysisSource.textContent = `Đã duyệt suggestion và cập nhật cấu hình chung cho ${typeLabel(selectedConfigType)}`;
}

function dismissLessonSuggestion(id) {
  const suggestion = findSuggestion(id);
  if (!suggestion) return;
  suggestion.status = "dismissed";
  suggestion.dismissedAt = new Date().toISOString();
  renderLaunchWorkspace();
  analysisSource.textContent = "Đã bỏ qua suggestion";
}

function renderLessons() {
  const lessons = currentLaunch?.lessonsLearned || [];
  const postResult = currentLaunch?.postLaunchResult || "";
  const lessonItems = lessons.length
    ? lessons.slice().reverse().map((lesson) => `
      <div class="lesson-item">
        ${escapeHTML(lesson.text)}
        <small>${escapeHTML(formatDate(lesson.createdAt))}</small>
      </div>
    `).join("")
    : `<div class="empty-state">Chưa có bài học nào. Khi launch xong, ghi bài học ở đây để lần sau agent có thêm ngữ cảnh.</div>`;

  lessonsPanel.innerHTML = `
    <section class="lesson-box">
      <h3>Kết quả sau launch</h3>
      <textarea id="postResultInput" spellcheck="false">${escapeHTML(postResult)}</textarea>
      <label class="field">
        <span>Đổi trạng thái sau khi lưu</span>
        <select id="postResultStatus">
          <option value="completed" ${normalizeStatus(currentLaunch?.status) === "completed" ? "selected" : ""}>Đã chạy</option>
          <option value="running" ${normalizeStatus(currentLaunch?.status) === "running" ? "selected" : ""}>Đang chạy</option>
          <option value="upcoming" ${normalizeStatus(currentLaunch?.status) === "upcoming" ? "selected" : ""}>Sắp chạy</option>
        </select>
      </label>
    </section>
    <section class="lesson-box">
      <h3>Bài học rút ra</h3>
      <div class="lesson-list">${lessonItems}</div>
      <label class="field brief-field">
        <span>Thêm bài học mới</span>
        <textarea id="lessonInput" spellcheck="false" placeholder="Ví dụ: Lần sau phải chốt CS FAQ trước T-1."></textarea>
      </label>
      <div class="actions">
        <button id="saveLesson" type="button" class="primary">Lưu kết quả / bài học</button>
      </div>
    </section>
  `;
  renderLessonSuggestions();
}

function renderLaunchWorkspace() {
  renderLaunchGroups();
  renderLaunchSnapshot();
  renderBriefGuide();
  renderTemplateConfig();
  renderHistory();
  renderLessons();
  applyLaunchPermissions();
}

function setDisabled(element, disabled) {
  if (element) element.disabled = Boolean(disabled);
}

function setAnalysisRunStatus(state, message) {
  if (!analysisRunStatus) return;
  analysisRunStatus.textContent = message || "";
  analysisRunStatus.className = `analysis-run-status${state ? ` is-visible is-${state}` : ""}`;
}

// ----- Run log (tab Log, chỉ Admin) -----
const runLogEvents = [];

function logRunEvent(level, stage, message) {
  runLogEvents.push({
    time: new Date().toISOString(),
    launchId: currentLaunch?.id || "(nháp)",
    launchName: currentLaunch?.name || "Launch mới",
    level,
    stage,
    message: String(message || "")
  });
  if (runLogEvents.length > 300) runLogEvents.splice(0, runLogEvents.length - 300);
  if (document.getElementById("runLog")?.classList.contains("active")) renderRunLog();
}

function runLogTimeLabel(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? String(iso || "") : date.toLocaleTimeString("vi-VN", { hour12: false });
}

function renderRunLog() {
  const body = document.getElementById("runLogBody");
  if (!body) return;
  if (!isLaunchAdmin()) {
    body.innerHTML = `<div class="empty-state">Log chỉ dành cho Admin.</div>`;
    return;
  }

  const launchId = currentLaunch?.id || "(nháp)";
  const clientRows = runLogEvents
    .filter((event) => event.launchId === launchId)
    .slice()
    .reverse()
    .map((event) => `
      <div class="run-log-row is-${escapeHTML(event.level)}">
        <span class="run-log-time">${escapeHTML(runLogTimeLabel(event.time))}</span>
        <span class="run-log-stage">${escapeHTML(event.stage)}</span>
        <span class="run-log-message">${escapeHTML(event.message)}</span>
      </div>
    `).join("");

  const analyses = (currentLaunch?.analyses || []).slice().reverse();
  const serverBlocks = analyses.map((entry) => {
    const result = entry.result || {};
    const traceRows = (result.trace || []).map((step) => {
      const llm = step.llm || {};
      const isFallback = step.status === "fallback" || step.source === "rule";
      const details = [
        llm.model ? `model=${llm.model}` : "",
        step.source ? `source=${step.source}` : "",
        step.reason ? `lý do: ${step.reason}` : ""
      ].filter(Boolean).join(" · ");
      return `
        <div class="run-log-row is-${isFallback ? "warn" : "success"}">
          <span class="run-log-stage">${escapeHTML(step.agent || "?")}</span>
          <span class="run-log-message">${escapeHTML(`${step.status || "?"}${details ? ` — ${details}` : ""}`)}</span>
        </div>
      `;
    }).join("");
    return `
      <article class="run-log-block">
        <header>
          <strong>${escapeHTML(formatDate(entry.createdAt))}</strong>
          <span class="run-log-source is-${result.source === "llm" ? "success" : "warn"}">${escapeHTML(result.source || "?")}</span>
          ${result.warning ? `<span class="run-log-warning">${escapeHTML(result.warning)}</span>` : ""}
        </header>
        ${traceRows || `<div class="run-log-row"><span class="run-log-message">Bản ghi này không có trace agent.</span></div>`}
      </article>
    `;
  }).join("");

  body.innerHTML = `
    <h4 class="run-log-heading">Sự kiện phiên này (client)</h4>
    ${clientRows || `<div class="empty-state">Chưa có sự kiện nào trong phiên này cho launch đang chọn.</div>`}
    <h4 class="run-log-heading">Các lần phân tích đã lưu (server trace)</h4>
    ${serverBlocks || `<div class="empty-state">Launch này chưa có lần phân tích nào được lưu.</div>`}
  `;
}

function runLogPlainText() {
  const launchId = currentLaunch?.id || "(nháp)";
  const lines = [`# Run log - ${currentLaunch?.name || "Launch mới"} (${launchId})`, "", "## Client events"];
  runLogEvents.filter((event) => event.launchId === launchId).forEach((event) => {
    lines.push(`${event.time} [${event.level}] ${event.stage}: ${event.message}`);
  });
  lines.push("", "## Server traces");
  (currentLaunch?.analyses || []).forEach((entry) => {
    const result = entry.result || {};
    lines.push(`--- ${entry.createdAt} source=${result.source || "?"}${result.warning ? ` warning=${result.warning}` : ""}`);
    (result.trace || []).forEach((step) => {
      const llm = step.llm || {};
      lines.push(`  ${step.agent || "?"}: ${step.status || "?"}${llm.model ? ` model=${llm.model}` : ""}${step.reason ? ` reason=${step.reason}` : ""}`);
    });
  });
  return lines.join("\n");
}

function applyLaunchPermissions() {
  const canEdit = canEditLaunch();
  const canOutcome = canSaveLaunchOutcome();
  [launchName, launchType, launchStatus, launchOwner, launchTargetDate, launchEndDate, briefInput].forEach((control) => {
    setDisabled(control, !canEdit);
  });
  [launchTargetDateNative, launchEndDateNative, launchTargetDatePicker, launchEndDatePicker].forEach((control) => {
    setDisabled(control, !canEdit);
  });
  setDisabled(document.getElementById("loadBadBrief"), !canEdit);
  setDisabled(saveLaunchButton, !canEdit);
  setDisabled(analyzeButton, !canEdit);
  setDisabled(deleteLaunchButton, !canDeleteLaunch());
  if (deleteLaunchButton) deleteLaunchButton.hidden = !canDeleteLaunch();

  const runLogTab = document.getElementById("runLogTab");
  if (runLogTab) runLogTab.hidden = !isLaunchAdmin();

  const postResultInput = document.getElementById("postResultInput");
  const lessonInput = document.getElementById("lessonInput");
  const postResultStatus = document.getElementById("postResultStatus");
  const saveLessonButton = document.getElementById("saveLesson");
  [postResultInput, lessonInput, postResultStatus, saveLessonButton].forEach((control) => {
    setDisabled(control, !canOutcome);
  });

  const status = currentLaunchStatus();
  const roleLabel = activeLaunchRole() === "admin" ? "Admin" : activeLaunchRole() === "ai" ? "AI" : "Human";
  if (!canEdit && analysisSource) {
    analysisSource.textContent = `${roleLabel}: launch ${STATUS_LABELS[status]} chỉ Admin được sửa/xóa. Human chỉ được lưu kết quả và bài học.`;
  }
}

function renderLatestAnalysisOrPreview() {
  const analyses = currentLaunch?.analyses || [];
  const latest = analyses.length ? analyses[analyses.length - 1] : null;
  if (latest?.result) {
    renderApiAnalysis(latest.result, `Lịch sử đã lưu · ${formatDate(latest.createdAt)}`);
    return;
  }

  if (briefInput.value.trim()) {
    renderLocalAnalysis(backendAvailable ? "Xem thử local: chưa lưu lịch sử" : "Dự phòng local: backend chưa bật");
    return;
  }

  renderEmptyAnalysis("Chọn launch hoặc tạo launch mới rồi nhập brief.");
}

async function fetchJson(url, options = {}) {
  const timeoutMs = options.timeoutMs || 0;
  const controller = timeoutMs ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), timeoutMs)
    : null;
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller?.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }
    return payload;
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

async function loadLaunches() {
  if (!API_BASE) {
    backendAvailable = false;
    launches = fallbackLaunches.map(summarizeClientLaunch);
    renderLaunchGroups();
    const first = launches.find((item) => item.status === "running") || launches[0];
    if (first) {
      await selectLaunch(first.id);
    } else {
      startNewLaunch();
    }
    return;
  }

  try {
    const payload = await fetchJson(`${API_BASE}/launches`);
    backendAvailable = true;
    launches = payload.launches || [];
  } catch (error) {
    console.warn("Launch list API unavailable, using local fallback.", error);
    backendAvailable = false;
    launches = fallbackLaunches.map(summarizeClientLaunch);
  }

  renderLaunchGroups();
  const first = launches.find((item) => item.status === "running") || launches[0];
  if (first) {
    await selectLaunch(first.id);
  } else {
    startNewLaunch();
  }
}

async function selectLaunch(id) {
  try {
    if (backendAvailable) {
      const payload = await fetchJson(`${API_BASE}/launches/${encodeURIComponent(id)}`);
      currentLaunch = payload.launch;
    } else {
      currentLaunch = fallbackLaunches.find((launch) => launch.id === id) || null;
    }
    draftMode = false;
    setFormFromLaunch(currentLaunch);
    renderLaunchWorkspace();
    renderLatestAnalysisOrPreview();
    if (document.getElementById("runLog")?.classList.contains("active")) renderRunLog();
  } catch (error) {
    console.warn("Cannot load launch detail.", error);
    renderEmptyAnalysis("Không mở được launch này. Kiểm tra backend local.");
  }
}

function startNewLaunch() {
  draftMode = true;
  currentLaunch = {
    id: "",
    name: "Launch mới",
    type: "Game event",
    status: "upcoming",
    owner: "",
    targetDate: "",
    endDate: "",
    brief: "",
    template: defaultTemplateForType("Game event"),
    templateVersions: [],
    lessonSuggestions: [],
    analyses: [],
    postLaunchResult: "",
    lessonsLearned: []
  };
  setFormFromLaunch(currentLaunch);
  renderLaunchWorkspace();
  renderEmptyAnalysis("Nhập brief rồi bấm Lưu launch hoặc Chạy phân tích.");
}

async function saveCurrentLaunch({ silent = false } = {}) {
  if (!canEditLaunch()) {
    analysisSource.textContent = "Launch đang chạy/đã chạy chỉ Admin được sửa. Human chỉ được lưu kết quả và bài học ở tab Bài học.";
    throw new Error("Launch edit is not allowed for this role/status.");
  }
  const launchData = collectLaunchFromForm();
  if (!canSaveLaunchData(launchData)) {
    analysisSource.textContent = "Human/AI chỉ được lưu launch ở trạng thái Sắp chạy. Launch đang chạy/đã chạy chỉ Admin được sửa.";
    throw new Error("Only Admin can save running/completed launch metadata.");
  }
  if (!launchData.id) launchData.id = slugify(launchData.name);

  saveLaunchButton.disabled = true;
  if (!silent) saveLaunchButton.textContent = tr("Đang lưu...", "Saving...");

  try {
    if (backendAvailable) {
      const url = currentLaunch?.id && !draftMode
        ? `${API_BASE}/launches/${encodeURIComponent(currentLaunch.id)}`
        : `${API_BASE}/launches`;
      const payload = await fetchJson(url, {
        method: "POST",
        body: JSON.stringify({ launch: launchData })
      });
      currentLaunch = payload.launch;
      draftMode = false;
      upsertLaunchSummary(payload.summary || currentLaunch);
    } else {
      currentLaunch = {
        ...currentLaunch,
        ...launchData,
        id: currentLaunch?.id || launchData.id,
        analyses: currentLaunch?.analyses || [],
        templateVersions: currentLaunch?.templateVersions || [],
        lessonSuggestions: currentLaunch?.lessonSuggestions || [],
        lessonsLearned: currentLaunch?.lessonsLearned || [],
        postLaunchResult: currentLaunch?.postLaunchResult || ""
      };
      const index = fallbackLaunches.findIndex((launch) => launch.id === currentLaunch.id);
      if (index >= 0) fallbackLaunches[index] = currentLaunch;
      else fallbackLaunches.push(currentLaunch);
      upsertLaunchSummary(currentLaunch);
      draftMode = false;
    }
    setFormFromLaunch(currentLaunch);
    renderLaunchWorkspace();
    if (!silent) analysisSource.textContent = backendAvailable ? "Đã lưu launch vào bộ nhớ local" : "Dự phòng local: chưa lưu bền vững";
    return currentLaunch;
  } catch (error) {
    console.warn("Save launch failed.", error);
    analysisSource.textContent = "Lưu chưa thành công: backend chưa sẵn sàng";
    throw error;
  } finally {
    saveLaunchButton.disabled = false;
    saveLaunchButton.textContent = tr("Lưu launch", "Save launch");
    applyLaunchPermissions();
  }
}

async function deleteCurrentLaunch() {
  if (!canDeleteLaunch()) {
    analysisSource.textContent = "Bạn không có quyền xóa launch này. Launch đang chạy/đã chạy chỉ Admin được xóa.";
    return;
  }
  const launchId = currentLaunch?.id;
  const launchLabel = currentLaunch?.name || "launch này";
  if (!launchId) return;
  if (!window.confirm(`Xóa ${launchLabel}? Hành động này chỉ áp dụng trong bản demo/local hiện tại.`)) return;

  if (backendAvailable) {
    await fetchJson(`${API_BASE}/launches/${encodeURIComponent(launchId)}`, { method: "DELETE" });
  } else {
    const fallbackIndex = fallbackLaunches.findIndex((launch) => launch.id === launchId);
    if (fallbackIndex >= 0) fallbackLaunches.splice(fallbackIndex, 1);
  }

  launches = launches.filter((launch) => launch.id !== launchId);
  const next = launches.find((launch) => normalizeStatus(launch.status) === "running") || launches[0];
  analysisSource.textContent = `Đã xóa ${launchLabel}.`;
  if (next) await selectLaunch(next.id);
  else startNewLaunch();
}

// Pipeline LLM thật chạy ~90-120s trên runtime; client phải chờ lâu hơn server.
const ANALYZE_CLIENT_TIMEOUT_MS = 240000;

async function analyze() {
  const text = briefInput.value.trim();
  if (!text) {
    renderEmptyAnalysis("Chưa có brief để phân tích.");
    setAnalysisRunStatus("error", "Chưa có brief để phân tích. Nhập brief rồi chạy lại.");
    logRunEvent("error", "analyze", "Bấm Chạy phân tích nhưng brief đang trống.");
    return;
  }

  analyzeButton.disabled = true;
  analyzeButton.textContent = tr("Đang phân tích...", "Analyzing...");
  analysisSource.textContent = tr("Đang gọi AI...", "Calling AI...");
  setAnalysisRunStatus("running", "Hệ thống Agent đang phân tích dữ liệu vui lòng chờ...");
  document.body.classList.add("is-analyzing");
  const startedAt = Date.now();
  logRunEvent("info", "analyze", `Bắt đầu phân tích "${currentLaunch?.name || "Launch mới"}" (backend=${backendAvailable ? "có" : "không"}).`);

  try {
    const launch = await saveCurrentLaunch({ silent: true });
    logRunEvent("info", "save", `Đã lưu launch trước khi phân tích (id=${launch?.id || "?"}).`);

    if (backendAvailable && launch?.id) {
      logRunEvent("info", "api", `POST ${API_BASE}/launches/${launch.id}/analyze (timeout client ${Math.round(ANALYZE_CLIENT_TIMEOUT_MS / 1000)}s)...`);
      const payload = await fetchJson(`${API_BASE}/launches/${encodeURIComponent(launch.id)}/analyze`, {
        method: "POST",
        body: JSON.stringify(collectLaunchFromForm()),
        timeoutMs: ANALYZE_CLIENT_TIMEOUT_MS
      });
      currentLaunch = payload.launch;
      upsertLaunchSummary(payload.summary || currentLaunch);
      setFormFromLaunch(currentLaunch);
      renderLaunchWorkspace();
      renderApiAnalysis(payload.result);
      activateTab("redTeam");
      setAnalysisRunStatus("success", "Hoàn thành Phân Tích");
      logRunEvent("success", "api", `Phân tích xong sau ${Math.round((Date.now() - startedAt) / 1000)}s, source=${payload.result?.source || "?"}${payload.result?.warning ? `, warning=${payload.result.warning}` : ""}.`);
      return;
    }

    const result = buildLocalAnalysisResult(text);
    renderApiAnalysis(result, "Dự phòng local: backend/API chưa sẵn sàng");
    activateTab("redTeam");
    currentLaunch.analyses = currentLaunch.analyses || [];
    currentLaunch.analyses.push({
      id: `analysis-local-${Date.now()}`,
      createdAt: new Date().toISOString(),
      briefSnapshot: text.slice(0, 2000),
      result
    });
    upsertLaunchSummary(currentLaunch);
    renderLaunchWorkspace();
    setAnalysisRunStatus("success", "Hoàn thành Phân Tích");
    logRunEvent("success", "local", "Phân tích bằng rule local (không gọi backend).");
  } catch (error) {
    console.warn("Analyze failed, using local fallback.", error);
    const isTimeout = error?.name === "AbortError";
    logRunEvent("error", "api", isTimeout
      ? `Client hủy vì quá thời gian chờ ${Math.round(ANALYZE_CLIENT_TIMEOUT_MS / 1000)}s (server có thể vẫn đang chạy). Đã render kết quả rule local thay thế.`
      : `${error?.name || "Error"}: ${error?.message || error}. Đã render kết quả rule local thay thế.`);
    const result = buildLocalAnalysisResult(text);
    renderApiAnalysis(result, "Dự phòng local: backend/API chưa sẵn sàng");
    activateTab("redTeam");
    setAnalysisRunStatus("error", isTimeout
      ? "Phân tích quá thời gian chờ — đang hiển thị kết quả dự phòng. Thử lại hoặc báo Admin."
      : "Xảy ra sự cố, vui lòng thử lại hoặc báo cho Admin");
  } finally {
    document.body.classList.remove("is-analyzing");
    analyzeButton.disabled = false;
    analyzeButton.textContent = tr("Chạy phân tích", "Run analysis");
  }
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function runDemoMode() {
  demoModeButton.disabled = true;
  demoModeButton.textContent = "Đang demo...";
  try {
    draftMode = true;
    currentLaunch = {
      id: "demo-lucky-wheel-weekend",
      name: "Demo - Lucky Wheel Weekend",
      type: "Game event",
      status: "running",
      owner: "PM LiveOps",
      targetDate: "2026-06-12",
      endDate: "2026-06-14",
      brief: badBrief,
      template: defaultTemplateForType("Game event"),
      templateVersions: [],
      lessonSuggestions: [],
      analyses: [],
      postLaunchResult: "",
      lessonsLearned: []
    };
    setFormFromLaunch(currentLaunch);
    renderLaunchWorkspace();
    activateTab("briefView");
    analysisSource.textContent = "Demo mode: đã nạp brief mẫu";
    await wait(500);

    const result = buildLocalAnalysisResult(badBrief, "demo_mode");
    currentLaunch.analyses.push({
      id: `analysis-demo-${Date.now()}`,
      createdAt: new Date().toISOString(),
      briefSnapshot: badBrief.slice(0, 2000),
      result
    });
    currentLaunch.lessonsLearned.push({
      id: `lesson-demo-${Date.now()}`,
      createdAt: new Date().toISOString(),
      text: "Demo lesson: cần chốt CS FAQ, rollback plan và guardrail phần thưởng trước T-1."
    });
    upsertLaunchSummary(currentLaunch);
    ensureLessonSuggestions();
    renderLaunchWorkspace();
    renderApiAnalysis(result, "Demo mode: phân tích local");
    activateTab("redTeam");
    await wait(700);
    activateTab("checklist");
    await wait(700);
    activateTab("lessons");
    analysisSource.textContent = "Demo mode: flow mẫu đã sẵn sàng để quay video";
  } finally {
    demoModeButton.disabled = false;
    demoModeButton.textContent = "Demo mode";
  }
}

async function saveLesson() {
  if (!canSaveLaunchOutcome()) {
    analysisSource.textContent = "Bạn không có quyền lưu kết quả/bài học cho launch này.";
    return;
  }
  const postResultInput = document.getElementById("postResultInput");
  const lessonInput = document.getElementById("lessonInput");
  const postResultStatus = document.getElementById("postResultStatus");
  if (!currentLaunch) return;

  try {
    if (!currentLaunch.id || draftMode) await saveCurrentLaunch({ silent: true });
    const payload = {
      postLaunchResult: postResultInput?.value.trim() || "",
      lesson: lessonInput?.value.trim() || "",
      status: postResultStatus?.value || "completed"
    };

    if (backendAvailable) {
      const response = await fetchJson(`${API_BASE}/launches/${encodeURIComponent(currentLaunch.id)}/post-result`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      currentLaunch = response.launch;
      upsertLaunchSummary(response.summary || currentLaunch);
    } else {
      currentLaunch.status = payload.status;
      currentLaunch.postLaunchResult = payload.postLaunchResult;
      if (payload.lesson) {
        currentLaunch.lessonsLearned = currentLaunch.lessonsLearned || [];
        currentLaunch.lessonsLearned.push({
          id: `lesson-local-${Date.now()}`,
          createdAt: new Date().toISOString(),
          text: payload.lesson
        });
      }
      upsertLaunchSummary(currentLaunch);
    }

    setFormFromLaunch(currentLaunch);
    renderLaunchWorkspace();
    analysisSource.textContent = backendAvailable ? "Đã lưu bài học vào bộ nhớ local" : "Dự phòng local: bài học chưa lưu bền vững";
  } catch (error) {
    console.warn("Save lesson failed.", error);
    analysisSource.textContent = "Lưu bài học chưa thành công: backend chưa sẵn sàng";
  }
}

function showSavedAnalysis(analysisId) {
  const analysis = (currentLaunch?.analyses || []).find((item) => item.id === analysisId);
  if (!analysis) return;
  renderApiAnalysis(analysis.result, `Lịch sử đã lưu · ${formatDate(analysis.createdAt)}`);
  activateTab("redTeam");
}

function saveTemplateConfig() {
  if (!canEditTemplate()) {
    analysisSource.textContent = "Bạn đang ở quyền chỉ xem, không thể lưu cấu hình.";
    return;
  }
  const type = configTemplateType();
  ensureTemplateVersionHistory();
  LAUNCH_TEMPLATES[type] = templateFromEditors(configTemplate());
  LAUNCH_TEMPLATES[type].customized = true;
  if (currentLaunch?.type === type) {
    currentLaunch.template = defaultTemplateForType(type);
  }
  addTemplateVersion(`Admin lưu cấu hình chung cho ${typeLabel(type)}`, "manual_save");
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
  analysisSource.textContent = `Đã lưu cấu hình chung cho ${typeLabel(type)}`;
}

function resetTemplateForSelectedType() {
  if (!canEditTemplate()) {
    analysisSource.textContent = "Bạn đang ở quyền chỉ xem, không thể nạp lại cấu hình.";
    return;
  }
  const type = configTemplateType();
  ensureTemplateVersionHistory();
  LAUNCH_TEMPLATES[type] = baseTemplateById(baseTemplateIdForType(type));
  if (currentLaunch?.type === type) {
    currentLaunch.template = defaultTemplateForType(type);
  }
  addTemplateVersion(`Khôi phục mẫu chuẩn cho ${typeLabel(type)}`, "reset_default");
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
  analysisSource.textContent = `Đã nạp mẫu chuẩn cho ${typeLabel(type)}`;
}

function switchTemplateFromSelector() {
  if (!templateSelector) return;
  const selectedType = templateSelector.value;
  if (!launchTypeExists(selectedType)) return;
  selectedConfigType = selectedType;
  renderTemplateConfig();
  analysisSource.textContent = canEditTemplate()
    ? `Đang cấu hình ${typeLabel(selectedType)}`
    : `Đang xem cấu hình ${typeLabel(selectedType)}. Bản review public không cho chỉnh sửa.`;
}

function uniqueLaunchTypeKey(label) {
  const base = slugify(label || "phan-loai-moi") || "phan-loai-moi";
  let key = `custom-${base}`;
  let index = 2;
  while (launchTypeExists(key)) {
    key = `custom-${base}-${index}`;
    index += 1;
  }
  return key;
}

function uniqueBaseTemplateId() {
  let key = `custom-template-${Date.now()}`;
  let index = 2;
  while (BASE_TEMPLATE_OPTIONS.some((item) => item.id === key)) {
    key = `custom-template-${Date.now()}-${index}`;
    index += 1;
  }
  return key;
}

function addBaseTemplate() {
  if (!canEditTemplate()) {
    analysisSource.textContent = "Bạn đang ở quyền chỉ xem, không thể thêm template.";
    return;
  }
  const id = uniqueBaseTemplateId();
  const template = normalizeTemplate({
    ...configTemplate(),
    name: `Custom Template ${BASE_TEMPLATE_OPTIONS.length - PROTECTED_BASE_TEMPLATE_IDS.length + 1}`,
    customized: false
  }, configTemplateType());
  BASE_TEMPLATE_OPTIONS.push({ id, template });
  TEMPLATE_NAME_LABELS[template.name] = "Template mới";
  renderTemplateConfig();
  analysisSource.textContent = "Đã thêm template mới. Bạn có thể đổi tên rồi gán cho phân loại cần dùng.";
}

function removeBaseTemplate(id) {
  if (!canEditTemplate()) {
    analysisSource.textContent = "Bạn đang ở quyền chỉ xem, không thể xóa template.";
    return;
  }
  if (PROTECTED_BASE_TEMPLATE_IDS.includes(id)) {
    analysisSource.textContent = "Template mặc định đang được giữ lại để demo không mất dữ liệu mẫu.";
    return;
  }
  const index = BASE_TEMPLATE_OPTIONS.findIndex((item) => item.id === id);
  if (index < 0) return;
  const templateName = BASE_TEMPLATE_OPTIONS[index].template?.name;
  BASE_TEMPLATE_OPTIONS.splice(index, 1);
  if (templateName) delete TEMPLATE_NAME_LABELS[templateName];
  Object.keys(LAUNCH_TEMPLATES).forEach((type) => {
    if (LAUNCH_TEMPLATES[type]?.name === templateName) {
      LAUNCH_TEMPLATES[type] = GENERIC_LAUNCH_TEMPLATE;
    }
  });
  if (currentLaunch?.template?.name === templateName) {
    currentLaunch.template = defaultTemplateForType(currentLaunch.type || "Game event");
  }
  renderTemplateConfig();
  renderLatestAnalysisOrPreview();
  analysisSource.textContent = "Đã xóa template tùy chỉnh. Phân loại đang dùng template đó được chuyển về Template launch chung.";
}

function addLaunchType() {
  if (!canEditTemplate()) {
    analysisSource.textContent = "Bạn đang ở quyền chỉ xem, không thể thêm phân loại.";
    return;
  }
  const label = "Phân loại mới";
  const type = uniqueLaunchTypeKey(label);
  LAUNCH_TEMPLATES[type] = GENERIC_LAUNCH_TEMPLATE;
  TYPE_LABELS[type] = label;
  renderLaunchTypeOptions(currentLaunch?.type || launchType?.value);
  renderTemplateConfig();
  analysisSource.textContent = "Đã thêm phân loại mới. Bạn có thể đổi tên ngay trong bảng cấu hình.";
}

function updateTemplateLabel(input, { render = true } = {}) {
  if (!canEditTemplate()) return;
  const templateNameKey = input.dataset.templateLabel;
  if (!templateNameKey) return;
  TEMPLATE_NAME_LABELS[templateNameKey] = input.value.trim() || templateNameKey;
  if (render) {
    renderLaunchWorkspace();
    analysisSource.textContent = "Đã đổi tên hiển thị template.";
  } else {
    syncTemplateDisplayLabels();
  }
}

function updateLaunchTypeLabel(input, { render = true } = {}) {
  if (!canEditTemplate()) return;
  const type = input.closest("[data-launch-type]")?.dataset.launchType;
  if (!launchTypeExists(type)) return;
  TYPE_LABELS[type] = input.value.trim() || type;
  if (render) {
    renderLaunchTypeOptions(currentLaunch?.type || launchType?.value);
    renderLaunchWorkspace();
    analysisSource.textContent = "Đã đổi tên phân loại.";
  } else {
    syncLaunchTypeOptionLabels();
  }
}

function updateLaunchTypeTemplate(select) {
  if (!canEditTemplate()) return;
  const type = select.closest("[data-launch-type]")?.dataset.launchType;
  if (!launchTypeExists(type)) return;
  LAUNCH_TEMPLATES[type] = baseTemplateById(select.value);
  if (currentLaunch?.type === type) {
    currentLaunch.template = defaultTemplateForType(type);
  }
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
  analysisSource.textContent = `Đã đổi bộ template gốc cho ${typeLabel(type)}.`;
}

function removeLaunchType(type) {
  if (!canEditTemplate()) {
    analysisSource.textContent = "Bạn đang ở quyền chỉ xem, không thể xóa phân loại.";
    return;
  }
  if (!launchTypeExists(type) || PROTECTED_LAUNCH_TYPES.includes(type)) {
    analysisSource.textContent = "Phân loại mặc định đang được giữ lại để demo không mất dữ liệu mẫu.";
    return;
  }
  delete LAUNCH_TEMPLATES[type];
  delete TYPE_LABELS[type];
  if (currentLaunch?.type === type) {
    currentLaunch.type = firstLaunchType();
    currentLaunch.template = defaultTemplateForType(currentLaunch.type);
  }
  renderLaunchTypeOptions(currentLaunch?.type || launchType?.value);
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
  analysisSource.textContent = "Đã xóa phân loại tùy chỉnh.";
}

function handleTemplateCatalogChange(event) {
  const templateLabelInput = event.target.closest("[data-template-label]");
  if (templateLabelInput) {
    updateTemplateLabel(templateLabelInput);
    return;
  }

  const typeLabelInput = event.target.closest("[data-type-label]");
  if (typeLabelInput) {
    updateLaunchTypeLabel(typeLabelInput);
    return;
  }

  const typeTemplateSelect = event.target.closest("[data-type-template]");
  if (typeTemplateSelect) {
    updateLaunchTypeTemplate(typeTemplateSelect);
  }
}

function handleTemplateCatalogInput(event) {
  const templateLabelInput = event.target.closest("[data-template-label]");
  if (templateLabelInput) {
    updateTemplateLabel(templateLabelInput, { render: false });
    return;
  }

  const typeLabelInput = event.target.closest("[data-type-label]");
  if (typeLabelInput) {
    updateLaunchTypeLabel(typeLabelInput, { render: false });
  }
}

function syncTemplateAfterTypeChange() {
  if (!currentLaunch) return;
  currentLaunch.type = launchType.value;
  currentLaunch.template = defaultTemplateForType(launchType.value);
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
}

function activateConfigPanel(target = "catalog") {
  document.querySelectorAll("[data-config-tab]").forEach((item) => {
    item.classList.toggle("active", item.dataset.configTab === target);
  });
  document.querySelectorAll("[data-config-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.configPanel === target);
  });
}

function activateTab(target) {
  const isConfigScreen = target === "templateConfig";
  if (!isConfigScreen) previousLaunchView = target || "briefView";
  appShell?.classList.toggle("config-mode", isConfigScreen);
  document.querySelectorAll(".tab").forEach((item) => {
    const isActive = !isConfigScreen && item.dataset.view === target;
    item.classList.toggle("active", isActive);
    item.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  openTemplateConfigButton?.classList.toggle("active", isConfigScreen);
  if (openTemplateConfigButton) {
    openTemplateConfigButton.textContent = isConfigScreen ? "Quay lại launch" : "Cấu hình phân loại";
  }
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === target));
  if (target === "runLog") renderRunLog();
  if (isConfigScreen) {
    selectedConfigType = launchTypeExists(currentLaunch?.type) ? currentLaunch.type : configTemplateType();
    renderTemplateConfig();
  }
  if (isConfigScreen && !document.querySelector("[data-config-panel].active")) {
    activateConfigPanel("catalog");
  }
}

function assistantContextSummary() {
  const launch = currentLaunch || collectLaunchFromForm();
  const template = activeTemplate();
  return {
    launchName: launch?.name || "Launch mới",
    launchType: typeLabel(launch?.type),
    status: STATUS_LABELS[normalizeStatus(launch?.status)],
    owner: launch?.owner || "Chưa có người phụ trách",
    maxScore: templateMax(template),
    riskCount: (template.riskGroups || []).length,
    currentView: document.querySelector(".view.active")?.id || "briefView"
  };
}

function assistantSummaryIntent(text) {
  return text.includes("tong hop")
    || text.includes("tom tat")
    || text.includes("trich xuat")
    || (text.includes("toan bo") && text.includes("launch"))
    || (text.includes("tinh trang") && text.includes("launch"))
    || text.includes("launch nay dang sao");
}

function assistantExplainIntent(text) {
  if (text.includes("giai thich") || text.includes("huong dan") || text.includes("ho tro") || text.includes("help")) return true;
  if (text.includes("rule") || text.includes("luat") || text.includes("cach dung") || text.includes("tai sao")) return true;
  if (text.includes("readiness") || text.includes("cham diem") || text.includes("muc san sang")) return true;
  if (text.includes("red team") || text.includes("phan bien")) return true;
  if ((text.includes("brief") || text.includes("checklist") || text.includes("bai hoc")) && (text.includes("la gi") || text.includes("the nao") || text.includes("dung") || text.includes("nen"))) return true;
  return false;
}

function assistantShortList(items = [], emptyText, mapper = (item) => item, limit = 3) {
  const list = items.slice(0, limit);
  if (!list.length) return `- ${emptyText}`;
  return list.map((item, index) => `- ${mapper(item, index)}`).join("\n");
}

function assistantChecklistLine(item) {
  const row = Array.isArray(item)
    ? { task: item[0], owner: item[1], deadline: item[2], status: item[3], priority: item[4] }
    : item || {};
  return `${friendlyText(row.task || "Việc cần làm")} - ${ownerLabel(row.owner)} - ${formatDeadline(row.deadline)} - ${statusValueLabel(row.status)}`;
}

function assistantNextAction(launch, result, postResult, lessons) {
  const brief = briefInput?.value.trim() || launch?.brief || "";
  if (!brief) return "Nhập hoặc dán brief trước để LaunchOps có dữ liệu đọc.";
  if (!result) return "Chạy phân tích trước launch để có readiness, Red Team và checklist.";
  const topRisk = result.topRisks?.[0];
  if (topRisk) return `Xử lý rủi ro đầu tiên: ${friendlyText(topRisk)}`;
  if (normalizeStatus(launch?.status) !== "completed") return "Theo dõi launch; khi chạy xong thì nhập kết quả sau launch và thêm bài học.";
  if (!postResult) return "Nhập kết quả sau launch, rồi để Agent phân tích sau launch trước khi lưu bài học.";
  if (!lessons.length) return "Thêm ít nhất một bài học ngắn để lần launch sau có context tốt hơn.";
  return "Lưu lại quyết định/bài học và dùng báo cáo này cho lần launch sau.";
}

function assistantLaunchSummaryReply() {
  const launch = currentLaunch || collectLaunchFromForm();
  const result = latestAnalysisResult();
  const decision = result?.decision || null;
  const template = activeTemplate();
  const analyses = currentLaunch?.analyses || [];
  const lessons = currentLaunch?.lessonsLearned || [];
  const postResult = currentLaunch?.postLaunchResult || document.getElementById("postResultInput")?.value.trim() || "";
  const brief = briefInput?.value.trim() || launch?.brief || "";
  const readinessLine = decision
    ? `${colorLabel(decision.color || "Yellow")} ${decision.score ?? 0}/${decision.maxScore || templateMax(template)} - ${friendlyText(decision.title || decision.reason || "Đã có phân tích")}`
    : "Chưa có phân tích trước launch.";

  return {
    reply: [
      `Tổng hợp launch hiện tại: ${launch?.name || "Launch mới"}`,
      `- Phân loại: ${typeLabel(launch?.type)}`,
      `- Trạng thái: ${STATUS_LABELS[normalizeStatus(launch?.status)]}`,
      `- Owner: ${launch?.owner || "Chưa có owner"}`,
      `- Thời gian: ${formatDateOnly(launch?.targetDate, "Chưa có")} - ${formatDateOnly(launch?.endDate, "Chưa có")}`,
      `- Brief: ${brief ? friendlyText(brief).slice(0, 220) : "Chưa có brief"}`,
      `- Lịch sử: ${analyses.length} lần phân tích, ${lessons.length} bài học`,
      "",
      "Readiness:",
      `- ${readinessLine}`,
      decision?.reason ? `- Lý do: ${friendlyText(decision.reason)}` : "",
      "",
      "Top risks:",
      assistantShortList(result?.topRisks || [], "Chưa có top risk. Hãy chạy phân tích trước launch.", (item) => friendlyText(item), 3),
      "",
      "Red Team:",
      assistantShortList(result?.redTeam || [], "Chưa có phản biện. Hãy chạy phân tích trước launch.", (item) => `${personaLabel(item.persona)}: ${friendlyText(item.worry)}`, 3),
      "",
      "Checklist:",
      assistantShortList(result?.checklist || [], "Chưa có checklist. Hãy chạy phân tích trước launch.", assistantChecklistLine, 4),
      "",
      "Sau launch:",
      `- Kết quả: ${postResult ? friendlyText(postResult) : "Chưa nhập"}`,
      `- Bài học: ${lessons.length ? friendlyText(lessons[lessons.length - 1].text) : "Chưa lưu bài học"}`,
      "",
      `Gợi ý tiếp theo: ${assistantNextAction(launch, result, postResult, lessons)}`
    ].filter((line) => line !== "").join("\n"),
    options: assistantHomeOptions()
  };
}

function assistantExplainReply(rawText = "") {
  const text = normalizeText(rawText);
  const context = assistantContextSummary();
  if (text.includes("readiness") || text.includes("diem") || text.includes("cham") || text.includes("rule") || text.includes("luat")) {
    return {
      reply: `Readiness là điểm sẵn sàng trước launch. Hệ thống đọc brief theo bộ luật của phân loại hiện tại, chấm từng nhóm rủi ro rồi trả Green / Yellow / Red. Với launch "${context.launchName}", phân loại "${context.launchType}" đang có tổng ${context.maxScore} điểm từ ${context.riskCount} nhóm rủi ro. Green là có thể chạy, Yellow là cần sửa trước khi chạy, Red là nên dừng để xử lý rủi ro lớn.`,
      options: assistantHomeOptions()
    };
  }
  if (text.includes("red team") || text.includes("phan bien")) {
    return {
      reply: "Red Team là phần phản biện trước launch. Nó nhìn brief từ nhiều góc như user, exploit, CS, tech/on-call và business để chỉ ra điều dễ hỏng trước khi Human quyết định chạy.",
      options: assistantHomeOptions()
    };
  }
  if (text.includes("checklist") || text.includes("viec can lam")) {
    return {
      reply: "Checklist biến brief và rủi ro thành việc cụ thể có owner, deadline, trạng thái và độ ưu tiên. Đây là phần giúp team không chỉ thấy rủi ro mà còn biết cần làm gì tiếp.",
      options: assistantHomeOptions()
    };
  }
  if (text.includes("lesson") || text.includes("bai hoc") || text.includes("post")) {
    return {
      reply: "Bài học là phân tích bắt buộc sau launch. Flow đúng là nhập kết quả thực tế, để Agent phân tích sau launch và đề xuất, sau đó mới thêm lesson learned để dùng lại cho launch sau.",
      options: assistantHomeOptions()
    };
  }
  if (text.includes("brief") || text.includes("nap")) {
    return {
      reply: "Brief nên có mục tiêu, đối tượng, thời gian, owner, kênh truyền thông, impact/reward, rủi ro còn mở và rollback/pause plan. Không cần viết đẹp; cần đủ dữ liệu để Agent đọc và chỉ ra phần còn mơ hồ.",
      options: assistantHomeOptions()
    };
  }
  return assistantSupportReply();
}

function assistantHomeOptions() {
  return [
    { label: "Tạo launch mới", value: "assistant:create" },
    { label: "Sửa launch hiện tại", value: "assistant:edit" },
    { label: "Tổng hợp launch", value: "assistant:summary" },
    { label: "Hỗ trợ", value: "assistant:support" },
    { label: "Chạy phân tích", value: "assistant:analyze" },
    { label: "Xem bài học", value: "assistant:lessons" }
  ];
}

function assistantSupportReply() {
  return {
    reply: "Bạn cần hỗ trợ hay giải thích về tính năng nào của LaunchOps Command Center hãy chat tự do nhé mình sẽ giải thích và hướng dẫn.",
    options: [
      { label: "Tổng hợp launch", value: "assistant:summary" },
      { label: "Giải thích readiness", value: "assistant:explain:readiness" },
      { label: "Giải thích Red Team", value: "assistant:explain:red-team" },
      { label: "Giải thích checklist", value: "assistant:explain:checklist" },
      { label: "Giải thích bài học", value: "assistant:explain:lessons" },
      { label: "Tạo launch mới", value: "assistant:create" }
    ]
  };
}

function appendAssistantMessage(role, text, options = []) {
  if (!assistantMessages) return;
  const message = document.createElement("div");
  message.className = `assistant-message ${role}`;
  const messageText = document.createElement("div");
  messageText.className = "assistant-message-text";
  messageText.textContent = text;
  message.appendChild(messageText);
  if (role === "bot" && Array.isArray(options) && options.length) {
    const optionRow = document.createElement("div");
    optionRow.className = "assistant-option-row";
    options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "assistant-option";
      button.dataset.assistantValue = String(option.value || option.label || "");
      button.dataset.assistantLabel = String(option.label || option.value || "");
      button.textContent = option.label || option.value;
      optionRow.appendChild(button);
    });
    message.appendChild(optionRow);
  }
  assistantMessages.appendChild(message);
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
}

function cleanAssistantField(value) {
  return String(value || "")
    .replace(/[“”"]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[,.。;]+$/g, "")
    .trim();
}

function cleanAssistantBrief(value) {
  const headingPattern = /(Mục tiêu|Thời gian|Đối tượng|Offer|Kênh truyền thông|Việc đã có|Vấn đề còn mở|Điểm cần theo dõi trước khi chạy|Tóm tắt brief|Phân công hiện có)\s*:/giu;
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(headingPattern, "\n\n$1:")
    .replace(/:\s*-\s*/g, ":\n- ")
    .replace(/([.!?])\s*-\s*/g, "$1\n- ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractAssistantValue(rawText, patterns) {
  for (const pattern of patterns) {
    const match = rawText.match(pattern);
    if (match?.[1]) return cleanAssistantField(match[1]);
  }
  return "";
}

function extractAssistantBlock(rawText, patterns) {
  for (const pattern of patterns) {
    const match = rawText.match(pattern);
    if (match?.[1]) return cleanAssistantBrief(match[1]);
  }
  return "";
}

function inferAssistantLaunchType(rawText) {
  const text = normalizeText(rawText);
  if (text.includes("su kien game") || text.includes("game event") || /\bgame\b/.test(text)) return "Game event";
  if (text.includes("hotfix") || text.includes("khac phuc khan cap")) return "Emergency hotfix";
  if (text.includes("production") || text.includes("release he thong") || text.includes("he thong production")) return "Production system release";
  if (text.includes("feature") || text.includes("tinh nang")) return "Feature release";
  if (text.includes("marketing") || text.includes("campaign") || text.includes("chien dich")) return "Campaign marketing";
  if (text.includes("internal") || text.includes("noi bo") || text.includes("cong cu")) return "Internal tool";
  if (/\bops\b/.test(text) || text.includes("process") || text.includes("quy trinh")) return "Ops/process change";
  if (text.includes("partnership") || text.includes("hop tac") || text.includes("thuong mai")) return "Partnership/commercial launch";
  return "Game event";
}

function inferAssistantStatus(rawText) {
  const text = normalizeText(rawText);
  if (text.includes("da chay") || text.includes("completed") || text.includes("chay xong")) return "completed";
  if (text.includes("dang chay") || text.includes("running")) return "running";
  return "upcoming";
}

function normalizeAssistantDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(text)) return normalizeDateForStorage(text);
  return normalizeDateForStorage(text.replace(/-/g, "/"));
}

function parseAssistantLaunchDraft(rawText) {
  const text = normalizeText(rawText);
  const wantsCreate = /(?:tao|them)\s+(?:mot\s+)?launch\b/.test(text) || /\blaunch\s+(?:moi|new)\b/.test(text);
  if (!wantsCreate) return null;

  const name = extractAssistantValue(rawText, [
    /(?:tên|ten|name)\s*(?:launch)?\s*(?:là|la|:)?\s*[“"]?([^“”"\n]+?)(?=\s+(?:phân loại|phan loai|trạng thái|trang thai|người phụ trách|nguoi phu trach|owner|start launch|end launch|brief)\b|[,.;\n]|$)/iu,
    /(?:tạo|tao|thêm|them)\s+(?:một\s+|mot\s+)?launch(?:\s+mới|\s+moi)?\s*[“"]?([^“”"\n,.;]+?)(?=\s+(?:phân loại|phan loai|trạng thái|trang thai|người phụ trách|nguoi phu trach|owner|start launch|end launch|brief)\b|[,.;\n]|$)/iu
  ]) || "Launch mới từ Assistant";
  const owner = extractAssistantValue(rawText, [
    /(?:người phụ trách|nguoi phu trach|owner|pic)\s*(?:là|la|:)?\s*(.+?)(?=(?:\s|\n)*(?:start launch|end launch|brief)\b|[,.;\n]|$)/iu
  ]);
  const targetDate = normalizeAssistantDate(extractAssistantValue(rawText, [
    /(?:start launch|ngày bắt đầu|ngay bat dau|bắt đầu|bat dau)\s*(?:là|la|:)?\s*(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4})/iu
  ]));
  const endDate = normalizeAssistantDate(extractAssistantValue(rawText, [
    /(?:end launch|ngày kết thúc|ngay ket thuc|kết thúc|ket thuc)\s*(?:là|la|:)?\s*(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4})/iu
  ]));
  const brief = extractAssistantBlock(rawText, [
    /(?:brief|mô tả|mo ta|nội dung|noi dung)\s*[:：]\s*([\s\S]+)/iu
  ]) || rawText.trim();

  return {
    name,
    type: inferAssistantLaunchType(rawText),
    status: inferAssistantStatus(rawText),
    owner,
    targetDate,
    endDate,
    brief
  };
}

function launchTypeOptionsForAssistant() {
  return templateTypeOptions().map((type) => ({
    label: typeLabel(type),
    value: `wizard:create:type:${type}`
  }));
}

function templateOptionsForAssistant() {
  return BASE_TEMPLATE_OPTIONS.map(({ id, template }) => ({
    label: templateDisplayName(template),
    value: `wizard:create:template:${id}`
  }));
}

function assistantCancelOptions() {
  return [{ label: "Hủy", value: "assistant:cancel" }];
}

function assistantConfirmOptions() {
  return [
    { label: "Xác nhận tạo launch", value: "wizard:create:confirm" },
    { label: "Sửa lại brief", value: "wizard:create:editBrief" },
    { label: "Hủy", value: "assistant:cancel" }
  ];
}

function formatAssistantDraftSummary(draft) {
  return [
    "Tôi đã gom đủ thông tin tạo launch:",
    "",
    `Tên launch: ${draft.name || "Chưa có"}`,
    `Phân loại: ${typeLabel(draft.type || "Game event")}`,
    `Template: ${draft.templateName || templateDisplayName(defaultTemplateForType(draft.type || "Game event"))}`,
    `Owner: ${draft.owner || "Chưa có"}`,
    `Thời gian: ${formatDateOnly(draft.targetDate, "Chưa có")} - ${formatDateOnly(draft.endDate, "Chưa có")}`,
    "",
    `Mục tiêu: ${draft.objective || "Chưa có"}`,
    "",
    "Nội dung brief:",
    draft.brief || "Chưa có",
    "",
    "Bạn xác nhận tạo launch này không?"
  ].join("\n");
}

function composeAssistantLaunchBrief(draft) {
  const lines = [
    `Tên launch: ${draft.name || "Launch mới"}`,
    "",
    `Phân loại: ${typeLabel(draft.type || "Game event")}`,
    `Template sử dụng: ${draft.templateName || templateDisplayName(defaultTemplateForType(draft.type || "Game event"))}`,
    "",
    `Mục tiêu: ${draft.objective || "Chưa có mục tiêu rõ."}`,
    "",
    `Thời gian: ${formatDateOnly(draft.targetDate, "Chưa có")} đến ${formatDateOnly(draft.endDate, "Chưa có")}`,
    `Owner: ${draft.owner || "Chưa có owner."}`,
    "",
    "Nội dung brief:",
    cleanAssistantBrief(draft.brief || "")
  ];
  return lines.join("\n").trim();
}

function startCreateLaunchWizard() {
  assistantWizard = {
    mode: "create",
    step: "type",
    draft: {
      status: "upcoming",
      type: "Game event",
      templateId: baseTemplateIdForType("Game event"),
      templateName: templateDisplayName(defaultTemplateForType("Game event"))
    }
  };
  return {
    reply: "Tôi sẽ hỗ trợ bạn tạo launch mới từng bước. Trước tiên, launch này thuộc phân loại/function nào?",
    options: [...launchTypeOptionsForAssistant(), ...assistantCancelOptions()]
  };
}

function startEditLaunchWizard() {
  if (!canEditLaunch()) {
    return {
      reply: "Launch đang chạy/đã chạy chỉ Admin được sửa metadata hoặc brief. Với vai trò Human hiện tại, bạn chỉ có thể thêm kết quả sau launch và bài học ở tab Bài học.",
      options: assistantHomeOptions()
    };
  }
  assistantWizard = {
    mode: "edit",
    step: "field",
    draft: {}
  };
  return {
    reply: `Bạn muốn sửa phần nào của launch hiện tại "${currentLaunch?.name || "Launch mới"}"?`,
    options: [
      { label: "Tên launch", value: "wizard:edit:field:name" },
      { label: "Owner", value: "wizard:edit:field:owner" },
      { label: "Start/End Launch", value: "wizard:edit:field:date" },
      { label: "Nội dung brief", value: "wizard:edit:field:brief" },
      { label: "Hủy", value: "assistant:cancel" }
    ]
  };
}

function finishAssistantWizard(message = "Đã hủy luồng hiện tại.") {
  assistantWizard = null;
  return {
    reply: `${message}\n\nBạn cần tôi hỗ trợ gì tiếp?`,
    options: assistantHomeOptions()
  };
}

function handleCreateWizardInput(rawText) {
  const value = String(rawText || "").trim();
  const draft = assistantWizard?.draft || {};
  const normalized = normalizeText(value);
  if (value === "assistant:cancel" || normalized === "huy" || normalized === "cancel") {
    return finishAssistantWizard("Đã hủy tạo launch mới.");
  }

  if (assistantWizard.step === "type") {
    const selectedType = value.startsWith("wizard:create:type:")
      ? value.replace("wizard:create:type:", "")
      : inferAssistantLaunchType(value);
    draft.type = launchTypeExists(selectedType) ? selectedType : "Game event";
    draft.templateId = baseTemplateIdForType(draft.type);
    draft.templateName = templateDisplayName(defaultTemplateForType(draft.type));
    assistantWizard.step = "template";
    return {
      reply: `Đã chọn phân loại: ${typeLabel(draft.type)}.\n\nTiếp theo bạn muốn dùng template/bộ luật nào?`,
      options: [...templateOptionsForAssistant(), ...assistantCancelOptions()]
    };
  }

  if (assistantWizard.step === "template") {
    const templateId = value.startsWith("wizard:create:template:")
      ? value.replace("wizard:create:template:", "")
      : baseTemplateIdForType(draft.type);
    const template = baseTemplateById(templateId);
    draft.templateId = templateId;
    draft.templateName = templateDisplayName(template);
    draft.template = cloneData(template);
    assistantWizard.step = "owner";
    return {
      reply: `Đã chọn template: ${draft.templateName}.\n\nOwner/người phụ trách launch này là ai?`,
      options: assistantCancelOptions()
    };
  }

  if (assistantWizard.step === "owner") {
    draft.owner = cleanAssistantField(value);
    assistantWizard.step = "name";
    return {
      reply: "Tên launch là gì?",
      options: assistantCancelOptions()
    };
  }

  if (assistantWizard.step === "name") {
    draft.name = cleanAssistantField(value) || "Launch mới từ Assistant";
    assistantWizard.step = "targetDate";
    return {
      reply: "Start Launch là ngày nào? Bạn nhập theo dạng dd/mm/yyyy, ví dụ 15/06/2026.",
      options: assistantCancelOptions()
    };
  }

  if (assistantWizard.step === "targetDate") {
    const dateValue = normalizeAssistantDate(value);
    if (!parseDateOnly(dateValue)) {
      return {
        reply: "Tôi chưa đọc được ngày bắt đầu. Hãy nhập theo dạng dd/mm/yyyy, ví dụ 15/06/2026.",
        options: assistantCancelOptions()
      };
    }
    draft.targetDate = dateValue;
    assistantWizard.step = "endDate";
    return {
      reply: "End Launch là ngày nào? Bạn nhập theo dạng dd/mm/yyyy.",
      options: assistantCancelOptions()
    };
  }

  if (assistantWizard.step === "endDate") {
    const dateValue = normalizeAssistantDate(value);
    if (!parseDateOnly(dateValue)) {
      return {
        reply: "Tôi chưa đọc được ngày kết thúc. Hãy nhập theo dạng dd/mm/yyyy, ví dụ 17/06/2026.",
        options: assistantCancelOptions()
      };
    }
    draft.endDate = dateValue;
    assistantWizard.step = "objective";
    return {
      reply: "Mục tiêu chính của launch này là gì? Ví dụ: tăng DAU cuối tuần, tăng conversion, giảm lỗi vận hành...",
      options: assistantCancelOptions()
    };
  }

  if (assistantWizard.step === "objective") {
    draft.objective = cleanAssistantBrief(value);
    assistantWizard.step = "brief";
    return {
      reply: "Bây giờ hãy dán nội dung brief. Có thể dùng nhiều dòng, gồm đối tượng, cơ chế, kênh truyền thông, việc đã có và vấn đề còn mở.",
      options: assistantCancelOptions()
    };
  }

  if (assistantWizard.step === "brief" || value === "wizard:create:editBrief") {
    if (value === "wizard:create:editBrief") {
      assistantWizard.step = "brief";
      return {
        reply: "Dán lại nội dung brief bạn muốn dùng.",
        options: assistantCancelOptions()
      };
    }
    draft.brief = cleanAssistantBrief(value);
    assistantWizard.step = "confirm";
    return {
      reply: formatAssistantDraftSummary(draft),
      options: assistantConfirmOptions()
    };
  }

  if (assistantWizard.step === "confirm") {
    if (value === "wizard:create:editBrief" || normalized.includes("sua brief")) {
      assistantWizard.step = "brief";
      return {
        reply: "Dán lại nội dung brief bạn muốn dùng.",
        options: assistantCancelOptions()
      };
    }
    if (value === "wizard:create:confirm" || normalized.includes("xac nhan") || normalized === "ok" || normalized.includes("dong y")) {
      const payload = {
        ...draft,
        status: "upcoming",
        brief: composeAssistantLaunchBrief(draft)
      };
      assistantWizard = null;
      return {
        reply: `Đã xác nhận. Tôi sẽ tạo launch "${payload.name}".`,
        action: { type: "createLaunch", payload }
      };
    }
    return {
      reply: "Bạn muốn xác nhận tạo launch, sửa lại brief hay hủy?",
      options: assistantConfirmOptions()
    };
  }

  return finishAssistantWizard("Luồng tạo launch bị lệch bước, tôi đã hủy để tránh tạo sai.");
}

function applyAssistantEditDraft(field, value) {
  if (!currentLaunch) currentLaunch = collectLaunchFromForm();
  if (field === "name") launchName.value = cleanAssistantField(value) || launchName.value;
  if (field === "owner") launchOwner.value = cleanAssistantField(value) || launchOwner.value;
  if (field === "brief") briefInput.value = cleanAssistantBrief(value) || briefInput.value;
  if (field === "date") {
    const [startRaw, endRaw] = String(value || "").split(/\s*(?:-|đến|den|to)\s*/iu);
    const start = normalizeAssistantDate(startRaw);
    const end = normalizeAssistantDate(endRaw);
    if (start) setVisibleDateValue(launchTargetDate, launchTargetDateNative, start);
    if (end) setVisibleDateValue(launchEndDate, launchEndDateNative, end);
  }
  currentLaunch = {
    ...currentLaunch,
    ...collectLaunchFromForm()
  };
  setFormFromLaunch(currentLaunch);
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
}

function handleEditWizardInput(rawText) {
  const value = String(rawText || "").trim();
  const normalized = normalizeText(value);
  if (value === "assistant:cancel" || normalized === "huy" || normalized === "cancel") {
    return finishAssistantWizard("Đã hủy sửa launch.");
  }

  if (assistantWizard.step === "field") {
    const field = value.startsWith("wizard:edit:field:")
      ? value.replace("wizard:edit:field:", "")
      : "brief";
    assistantWizard.draft.field = field;
    assistantWizard.step = "value";
    const fieldLabel = field === "name" ? "tên launch"
      : field === "owner" ? "owner"
        : field === "date" ? "Start/End Launch"
          : "nội dung brief";
    return {
      reply: `Nhập giá trị mới cho ${fieldLabel}. Với thời gian, nhập dạng 15/06/2026 - 17/06/2026.`,
      options: assistantCancelOptions()
    };
  }

  if (assistantWizard.step === "value") {
    assistantWizard.draft.value = value;
    assistantWizard.step = "confirm";
    return {
      reply: `Tôi sẽ cập nhật phần này trên form nhưng chưa tự deploy hay đổi cấu hình chung.\n\nNội dung mới:\n${value}\n\nBạn xác nhận sửa không?`,
      options: [
        { label: "Xác nhận sửa", value: "wizard:edit:confirm" },
        { label: "Hủy", value: "assistant:cancel" }
      ]
    };
  }

  if (assistantWizard.step === "confirm") {
    if (value === "wizard:edit:confirm" || normalized.includes("xac nhan") || normalized === "ok") {
      applyAssistantEditDraft(assistantWizard.draft.field, assistantWizard.draft.value);
      assistantWizard = null;
      return {
        reply: "Đã cập nhật vào form launch hiện tại. Nếu muốn lưu bền vững, bấm `Lưu launch`.",
        options: assistantHomeOptions()
      };
    }
    return finishAssistantWizard("Đã hủy sửa launch.");
  }

  return finishAssistantWizard("Luồng sửa launch bị lệch bước, tôi đã hủy để tránh sửa sai.");
}

function assistantWizardReply(rawText) {
  const value = String(rawText || "").trim();
  const text = normalizeText(value);
  if (value === "assistant:cancel" || text === "huy" || text === "cancel") {
    return finishAssistantWizard();
  }
  if (value === "assistant:summary" || assistantSummaryIntent(text)) {
    return assistantLaunchSummaryReply();
  }
  if (value === "assistant:create" || (text.includes("tao") && text.includes("launch"))) {
    return startCreateLaunchWizard();
  }
  if (value === "assistant:edit" || (text.includes("sua") && text.includes("launch"))) {
    return startEditLaunchWizard();
  }
  if (value === "assistant:support" || text.includes("ho tro") || text.includes("huong dan")) {
    return assistantSupportReply();
  }
  if (value === "assistant:explain:readiness") {
    return {
      reply: "Readiness là mức sẵn sàng của launch. Hệ thống đọc brief, chấm theo bộ tiêu chí rủi ro và trả Green / Yellow / Red để team biết nên chạy, cần bổ sung hay nên dừng lại chỉnh trước.",
      options: assistantHomeOptions()
    };
  }
  if (value === "assistant:explain:red-team") {
    return {
      reply: "Red Team là phần phản biện trước launch. Nó nhìn brief từ nhiều góc như user, exploit, CS, tech/on-call và business để chỉ ra điều dễ hỏng trước khi Human quyết định chạy.",
      options: assistantHomeOptions()
    };
  }
  if (value === "assistant:explain:checklist") {
    return {
      reply: "Checklist là danh sách việc cần làm trước, trong và sau launch. Mục tiêu là biến brief thành task rõ ràng có owner, deadline và trạng thái để tránh bị sót việc.",
      options: assistantHomeOptions()
    };
  }
  if (value === "assistant:explain:lessons") {
    return {
      reply: "Bài học dùng để lưu kết quả thực tế và lesson learned sau launch. Các bài học này về sau có thể làm context để AI tư vấn khi Human chuẩn bị launch mới.",
      options: assistantHomeOptions()
    };
  }
  if (value === "assistant:analyze") {
    return { reply: "Tôi sẽ chạy phân tích cho launch hiện tại nếu brief đã có nội dung.", action: "analyze" };
  }
  if (value === "assistant:lessons") {
    return { reply: "Tôi mở tab Bài học để bạn xem kết quả sau launch và lessons learned.", action: "lessons" };
  }
  if (assistantExplainIntent(text)) {
    return assistantExplainReply(value);
  }
  if (assistantWizard?.mode === "create") return handleCreateWizardInput(value);
  if (assistantWizard?.mode === "edit") return handleEditWizardInput(value);
  return null;
}

function isAssistantConfigIntent(text) {
  return text.includes("cau hinh phan loai")
    || text.includes("cau hinh template")
    || text.includes("template")
    || text.includes("bo luat");
}

function isAssistantConfigActionIntent(text) {
  if (!isAssistantConfigIntent(text)) return false;
  return /(mo|sua|chinh|them|xoa|cap nhat|duyet|doi|luu|reset|tao|gan)\b/.test(text);
}

async function createLaunchFromAssistant(draft) {
  const status = normalizeStatus(draft?.status || "upcoming");
  if (status !== "upcoming" && !isLaunchAdmin()) {
    appendAssistantMessage("bot", `Launch ${STATUS_LABELS[status]} chỉ Admin được tạo/sửa. Bản review public đang khóa vai trò ở Human, nên tôi chưa lưu launch này. Hãy tạo launch ở trạng thái Sắp chạy.`);
    return;
  }

  const type = draft?.type || "Game event";
  if (!launchTypeExists(type)) ensureLaunchType(type, type, GENERIC_LAUNCH_TEMPLATE);
  if (!ROLE_SWITCH_LOCKED && launchOperator && activeLaunchRole() !== "admin") launchOperator.value = "ai";

  draftMode = true;
  currentLaunch = {
    id: "",
    name: draft?.name || "Launch mới từ Assistant",
    type,
    status,
    owner: draft?.owner || "",
    targetDate: draft?.targetDate || "",
    endDate: draft?.endDate || "",
    brief: draft?.brief || "",
    template: draft?.template ? normalizeTemplate(draft.template, type) : defaultTemplateForType(type),
    templateVersions: [],
    lessonSuggestions: [],
    analyses: [],
    postLaunchResult: "",
    lessonsLearned: []
  };
  setFormFromLaunch(currentLaunch);
  renderLaunchWorkspace();
  activateTab("briefView");
  await saveCurrentLaunch({ silent: true });
  renderEmptyAnalysis("Assistant đã tạo launch mới. Kiểm tra brief rồi bấm Chạy phân tích khi cần.");
  analysisSource.textContent = `Assistant đã tạo launch "${currentLaunch.name}" ở trạng thái ${STATUS_LABELS[normalizeStatus(currentLaunch.status)]}.`;
  appendAssistantMessage("bot", `Đã tạo launch "${currentLaunch.name}". Tôi đã mở tab Tóm tắt để bạn kiểm tra brief.`);
}

function scopedAssistantReply(rawText) {
  const text = normalizeText(rawText);
  const context = assistantContextSummary();
  const outsideScope = /(thoi tiet|weather|gia vang|bitcoin|coin|bong da|phim|nau an|code python|viet email|facebook|youtube|google|tin tuc)/.test(text);
  if (outsideScope) {
    return {
      reply: "Tôi chỉ hỗ trợ trong phạm vi LaunchOps Command Center: launch brief, readiness, phản biện, checklist, bài học, cấu hình phân loại và thao tác trong web này."
    };
  }

  const launchDraft = parseAssistantLaunchDraft(rawText);
  if (launchDraft) {
    return {
      reply: `Tôi sẽ tạo launch "${launchDraft.name}" trong LaunchOps Command Center.`,
      action: { type: "createLaunch", payload: launchDraft }
    };
  }

  if (assistantSummaryIntent(text)) return assistantLaunchSummaryReply();
  if (assistantExplainIntent(text)) return assistantExplainReply(rawText);

  if (isAssistantConfigActionIntent(text)) {
    return {
      reply: "Chat Box không có quyền mở, sửa, thêm, xóa, lưu hoặc duyệt Cấu hình phân loại / config Web UI. Tôi chỉ có thể giải thích ý nghĩa cấu hình để Human hoặc Admin thao tác bằng UI riêng."
    };
  }

  if (isAssistantConfigIntent(text) && !isAssistantConfigActionIntent(text)) {
    return {
      reply: "Cấu hình phân loại là bộ luật chung cho từng loại launch: nhóm rủi ro, góc phản biện, checklist và bài học. Bản review public chỉ cho xem để tránh người review sửa nhầm dữ liệu demo."
    };
  }

  if (text.includes("mo cau hinh") || text.includes("cau hinh phan loai")) {
    return {
      reply: "Chat Box không có quyền mở hoặc sửa Cấu hình phân loại. Phần đó là config chung của Web UI, chỉ Human/Admin thao tác trực tiếp bằng nút Cấu hình phân loại nếu được quyền."
    };
  }
  if (text.includes("quay lai") || text.includes("tro lai launch")) {
    return { reply: "Tôi quay lại màn launch đang làm.", action: "backToLaunch" };
  }
  if (text.includes("tom tat")) return assistantLaunchSummaryReply();
  if (text.includes("phan tich") || text.includes("red team")) return { reply: "Tôi mở tab Phân tích.", action: "redTeam" };
  if (text.includes("checklist") || text.includes("viec can lam")) return { reply: "Tôi mở tab Việc cần làm.", action: "checklist" };
  if (text.includes("lich su")) return { reply: "Tôi mở tab Lịch sử phân tích.", action: "history" };
  if (text.includes("bai hoc") || text.includes("postmortem")) return { reply: "Tôi mở tab Bài học.", action: "lessons" };
  if (text.includes("chay phan tich") || text.includes("analyze")) {
    return { reply: "Tôi sẽ chạy phân tích cho launch hiện tại nếu brief đã có nội dung.", action: "analyze" };
  }

  if (text.includes("diem toi da") || text.includes("phan diem") || text.includes("max score")) {
    return {
      reply: `Điểm tối đa là trọng số của từng nhóm rủi ro. Với phân loại hiện tại, tổng readiness là ${context.maxScore} điểm từ ${context.riskCount} nhóm rủi ro. Agent chấm từng nhóm từ 0 đến điểm tối đa dựa trên tiêu chí đạt điểm, từ khóa demo local và nội dung brief.`
    };
  }

  if (text.includes("hoc") || text.includes("human sua") || text.includes("nho cai moi") || text.includes("phan tich theo huong cu")) {
    return {
      reply: "AI không tự train lại vĩnh viễn sau mỗi lần human sửa. Nó sẽ phân tích theo cái mới nếu phần sửa được lưu vào Cấu hình phân loại hoặc được lưu thành bài học/template và gửi kèm trong request phân tích sau đó. Các phân tích cũ vẫn giữ nguyên để làm lịch sử; muốn dùng logic mới thì chạy phân tích lại."
    };
  }

  if (text.includes("ngay") || text.includes("lich") || text.includes("start") || text.includes("end")) {
    return {
      reply: "Start Launch và End Launch là ngày bắt đầu/kết thúc launch. Tôi đã dùng input ngày của browser để có nút chọn lịch. Khi lưu, app lưu theo dạng chuẩn yyyy-mm-dd nhưng vẫn hiển thị ngày dễ đọc ở các phần tổng quan."
    };
  }

  if (text.includes("diem") || text.includes("muc san sang") || text.includes("readiness")) {
    return {
      reply: `Mức sẵn sàng hiện được tính theo cấu hình phân loại của launch. Launch "${context.launchName}" thuộc "${context.launchType}", tổng điểm tối đa hiện là ${context.maxScore}. Màu Green/Yellow/Red dựa trên tỷ lệ điểm đạt được, không cố định 12 điểm.`
    };
  }

  return {
    reply: `Tôi có thể hỗ trợ trong LaunchOps: giải thích điểm, cấu hình phân loại, phản biện, checklist, bài học, hoặc thao tác mở tab/chạy phân tích. Launch hiện tại là "${context.launchName}" (${context.status}, ${context.launchType}).`
  };
}

async function assistantReply(rawText) {
  const localResult = scopedAssistantReply(rawText);
  if (!API_BASE) return localResult;

  try {
    const payload = await fetchJson(`${API_BASE}/assistant`, {
      method: "POST",
      body: JSON.stringify({
        message: rawText,
        context: assistantContextSummary(),
        localReply: localResult.reply
      }),
      timeoutMs: 45000
    });
    backendAvailable = true;
    return {
      ...localResult,
      reply: payload.reply || localResult.reply
    };
  } catch (error) {
    console.warn("Assistant API unavailable, using local assistant fallback.", error);
    backendAvailable = false;
    return localResult;
  }
}

async function applyAssistantAction(action) {
  if (!action) return;
  if (typeof action === "object") {
    if (action.type === "createLaunch") await createLaunchFromAssistant(action.payload);
    return;
  }
  if (action === "openConfig") {
    appendAssistantMessage("bot", "Chat Box không có quyền mở hoặc sửa Cấu hình phân loại / config Web UI. Bạn có thể dùng nút Cấu hình phân loại trên topbar nếu muốn xem trực tiếp.");
    return;
  }
  if (action === "backToLaunch") {
    activateTab(previousLaunchView || "briefView");
    return;
  }
  if (["briefView", "redTeam", "checklist", "history", "lessons"].includes(action)) {
    activateTab(action);
    return;
  }
  if (action === "analyze") {
    if (!canEditLaunch()) {
      appendAssistantMessage("bot", "Launch đang chạy/đã chạy không cho Human/AI ghi thêm phân tích. Hãy dùng Admin nếu cần chạy lại phân tích.");
      return;
    }
    await analyze();
  }
}

function openAssistantPanel() {
  if (!assistantPanel) return;
  assistantPanel.classList.add("open");
  assistantPanel.setAttribute("aria-hidden", "false");
  if (assistantMessages && !assistantMessages.children.length) {
    appendAssistantMessage(
      "bot",
      "Tôi là trợ lý LaunchOps. Bạn cần tôi hỗ trợ gì? Tôi có thể tạo launch mới theo từng bước, sửa launch hiện tại, chạy phân tích hoặc mở phần bài học.",
      assistantHomeOptions()
    );
  }
  assistantInput?.focus();
}

function closeAssistantPanel() {
  assistantPanel?.classList.remove("open");
  assistantPanel?.setAttribute("aria-hidden", "true");
}

function closeIntroModal() {
  if (!introModal) return;
  introModal.classList.add("closed");
  introModal.setAttribute("aria-hidden", "true");
}

function focusIntroModal() {
  if (!introModal || introModal.classList.contains("closed")) return;
  introModal.querySelector(".intro-content")?.scrollTo({ top: 0, left: 0 });
  closeIntroModalButton?.focus({ preventScroll: true });
}

document.getElementById("newLaunch").addEventListener("click", () => {
  startNewLaunch();
  activateTab("briefView");
});

// i18n-clean.js gọi hook này khi user bấm nút VI/EN — re-render các chuỗi động.
window.launchopsOnLanguageApplied = () => {
  try {
    renderLaunchGroups();
    renderLaunchWorkspace();
    renderLatestAnalysisOrPreview();
  } catch (error) {
    console.warn("Language re-render failed.", error);
  }
};


document.getElementById("runLogFilter")?.addEventListener("change", renderRunLog);
document.getElementById("clearRunLog")?.addEventListener("click", () => {
  const launchId = currentLaunch?.id || "(nh?p)";
  // Remove backwards to avoid index shifting
  for (let i = runLogEvents.length - 1; i >= 0; i--) {
    if (runLogEvents[i].launchId === launchId) {
      runLogEvents.splice(i, 1);
    }
  }
  renderRunLog();
});
document.getElementById("copyRunLog")?.addEventListener("click", async (event) => {
  try {
    await navigator.clipboard.writeText(runLogPlainText());
    event.target.textContent = "Đã copy";
  } catch (error) {
    event.target.textContent = "Copy lỗi";
  }
  window.setTimeout(() => { event.target.textContent = LAUNCHOPS_LANG_MAP[currentLang].runLogCopy; }, 1500);
});

if (openTemplateConfigButton) {
  openTemplateConfigButton.addEventListener("click", () => {
    if (appShell?.classList.contains("config-mode")) {
      activateTab(previousLaunchView || "briefView");
    } else {
      selectedConfigType = launchTypeExists(currentLaunch?.type) ? currentLaunch.type : configTemplateType();
      activateTab("templateConfig");
    }
  });
}

openAssistantButton?.addEventListener("click", openAssistantPanel);
closeAssistantButton?.addEventListener("click", closeAssistantPanel);
closeIntroModalButton?.addEventListener("click", closeIntroModal);
enterDemoFromIntroButton?.addEventListener("click", closeIntroModal);

introModal?.addEventListener("click", (event) => {
  if (event.target === introModal) {
    closeIntroModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeIntroModal();
  }
});

focusIntroModal();

async function handleAssistantUserMessage(message, displayText = message) {
  appendAssistantMessage("user", displayText);
  const wizardResult = assistantWizardReply(message);
  if (wizardResult) {
    if (wizardResult.reply) appendAssistantMessage("bot", wizardResult.reply, wizardResult.options || []);
    if (wizardResult.action) await applyAssistantAction(wizardResult.action);
    return;
  }

  try {
    const result = await assistantReply(message);
    appendAssistantMessage("bot", result.reply, result.options || []);
    await applyAssistantAction(result.action);
  } catch (error) {
    console.warn("Assistant message failed.", error);
    appendAssistantMessage("bot", "Tôi chưa thao tác được yêu cầu này. Hãy kiểm tra brief hoặc backend rồi thử lại trong LaunchOps.", assistantHomeOptions());
  }
}

assistantMessages?.addEventListener("click", (event) => {
  const option = event.target.closest("[data-assistant-value]");
  if (!option) return;
  option.closest(".assistant-option-row")?.querySelectorAll("[data-assistant-value]").forEach((button) => {
    button.disabled = true;
  });
  handleAssistantUserMessage(option.dataset.assistantValue || "", option.dataset.assistantLabel || option.textContent.trim()).catch((error) => {
    console.warn("Assistant option failed.", error);
  });
});

assistantForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = assistantInput?.value.trim();
  if (!message) return;
  assistantInput.value = "";
  handleAssistantUserMessage(message).catch((error) => {
    console.warn("Assistant submit failed.", error);
  });
});

assistantInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    assistantForm?.requestSubmit();
  }
});

appendAssistantMessage(
  "bot",
  "Tôi là trợ lý LaunchOps. Bạn cần tôi hỗ trợ gì? Tôi có thể tạo launch mới theo từng bước, sửa launch hiện tại, chạy phân tích hoặc mở phần bài học.",
  assistantHomeOptions()
);

document.getElementById("loadBadBrief").addEventListener("click", () => {
  briefInput.value = badBrief;
  renderLocalAnalysis("Xem thử local: brief mẫu");
});

saveLaunchButton.addEventListener("click", () => {
  saveCurrentLaunch().catch(() => {});
});

if (deleteLaunchButton) {
  deleteLaunchButton.addEventListener("click", () => {
    deleteCurrentLaunch().catch((error) => {
      console.warn("Delete launch failed.", error);
      analysisSource.textContent = "Xóa launch chưa thành công.";
    });
  });
}

if (launchOperator) {
  launchOperator.addEventListener("change", () => {
    syncLaunchRoleLock();
    applyLaunchPermissions();
    renderLessonSuggestions();
  });
}

analyzeButton.addEventListener("click", analyze);

if (demoModeButton) {
  demoModeButton.addEventListener("click", () => {
    runDemoMode().catch((error) => {
      console.warn("Demo mode failed.", error);
      analysisSource.textContent = "Demo mode lỗi, kiểm tra console.";
      demoModeButton.disabled = false;
      demoModeButton.textContent = "Demo mode";
    });
  });
}

if (exportReportButton) {
  exportReportButton.addEventListener("click", () => {
    exportLaunchReport().catch((error) => {
      console.warn("Export report failed.", error);
      analysisSource.textContent = "Export report chưa thành công.";
    });
  });
}

launchType.addEventListener("change", syncTemplateAfterTypeChange);

if (templateOperator) {
  templateOperator.addEventListener("change", () => {
    templateOperatorId = templateOperator.value;
    renderTemplateConfig();
  });
}

if (templateSelector) {
  templateSelector.addEventListener("change", switchTemplateFromSelector);
}

if (saveTemplateButton) {
  saveTemplateButton.addEventListener("click", saveTemplateConfig);
}

if (resetTemplateButton) {
  resetTemplateButton.addEventListener("click", resetTemplateForSelectedType);
}

if (addLaunchTypeButton) {
  addLaunchTypeButton.addEventListener("click", addLaunchType);
}

if (addBaseTemplateButton) {
  addBaseTemplateButton.addEventListener("click", addBaseTemplate);
}

if (templateNameEditor) {
  templateNameEditor.addEventListener("input", handleTemplateCatalogInput);
  templateNameEditor.addEventListener("change", handleTemplateCatalogChange);
  templateNameEditor.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-base-template]");
    if (removeButton) removeBaseTemplate(removeButton.dataset.removeBaseTemplate);
  });
}

if (classificationEditor) {
  classificationEditor.addEventListener("input", handleTemplateCatalogInput);
  classificationEditor.addEventListener("change", handleTemplateCatalogChange);
  classificationEditor.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-remove-launch-type]");
    if (removeButton) removeLaunchType(removeButton.dataset.removeLaunchType);
  });
}

if (addRiskGroupButton) {
  addRiskGroupButton.addEventListener("click", () => addTemplateEditorItem("risk"));
}

if (addPersonaButton) {
  addPersonaButton.addEventListener("click", () => addTemplateEditorItem("persona"));
}

if (addChecklistItemButton) {
  addChecklistItemButton.addEventListener("click", () => addTemplateEditorItem("checklist"));
}

if (addLessonBlockButton) {
  addLessonBlockButton.addEventListener("click", () => addTemplateEditorItem("lesson"));
}

if (templateManager) {
  templateManager.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-template-remove]");
    if (removeButton) removeTemplateEditorItem(removeButton);
  });
  templateManager.addEventListener("input", updateTemplateDraftSummary);
  templateManager.addEventListener("change", updateTemplateDraftSummary);
}

if (launchSearch) {
  launchSearch.addEventListener("input", () => {
    launchSearchQuery = launchSearch.value;
    renderLaunchGroups();
  });
}

if (launchStatusFilterSelect) {
  launchStatusFilterSelect.addEventListener("change", () => {
    launchStatusFilter = launchStatusFilterSelect.value || "all";
    renderLaunchGroups();
  });
}

launchGroups.addEventListener("click", (event) => {
  const button = event.target.closest(".launch-card");
  if (!button) return;
  selectLaunch(button.dataset.launchId);
});

analysisHistory.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-analysis-id]");
  if (!button) return;
  showSavedAnalysis(button.dataset.analysisId);
});

lessonsPanel.addEventListener("click", (event) => {
  if (event.target.id === "saveLesson") saveLesson();
});

if (lessonSuggestions) {
  lessonSuggestions.addEventListener("click", (event) => {
    const applyButton = event.target.closest("[data-suggestion-apply]");
    const dismissButton = event.target.closest("[data-suggestion-dismiss]");
    if (applyButton) applyLessonSuggestion(applyButton.dataset.suggestionApply);
    if (dismissButton) dismissLessonSuggestion(dismissButton.dataset.suggestionDismiss);
  });
}

setupDateField(launchTargetDate, launchTargetDateNative, launchTargetDatePicker);
setupDateField(launchEndDate, launchEndDateNative, launchEndDatePicker);
syncLaunchRoleLock();

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab.dataset.view));
});

document.querySelectorAll("[data-config-tab]").forEach((tab) => {
  tab.addEventListener("click", () => activateConfigPanel(tab.dataset.configTab));
});

loadLaunches();


// --- Bilingual translation system (VI / EN) ---
const LAUNCHOPS_LANG_MAP = {
  vi: {
    title: "LaunchOps Command Center",
    eyebrow: "V-Team · VinhVNN · GS9",
    newLaunch: "Tạo launch mới",
    openTemplateConfig: "Cấu hình phân loại",
    modeFriendly: "Friendly",
    modePro: "Pro",
    statusAll: "Tất cả",
    statusRunning: "Đang chạy",
    statusCompleted: "Đã chạy",
    statusUpcoming: "Sắp chạy",
    searchLabel: "Tìm kiếm",
    searchPlaceholder: "Tên hoặc phân loại",
    statusLabel: "Trạng thái",
    roleLabel: "Vai trò",
    introTitle: "LaunchOps Command Center là gì?",
    introSummary: "LaunchOps Command Center là một Super Agent / Trung tâm điều hành Launch giúp team kiểm soát rủi ro trước, trong và sau khi phát hành sự kiện, campaign, tính năng mới hoặc hệ thống nội bộ.",
    closeIntro: "Đóng",
    tabBrief: "Brief",
    tabAnalysis: "Phân tích",
    tabChecklist: "Việc cần làm",
    tabLessons: "Bài học",
    tabHistory: "Lịch sử",
    runAnalyze: "Chạy phân tích",
    saveLaunch: "Lưu launch",
    exportReport: "Tải báo cáo",
    demoMode: "Nạp demo",
    deleteLaunch: "Xóa launch",
    assistantTitle: "LaunchOps Assistant",
    assistantInputPlaceholder: "Hỏi hoặc dán brief trong LaunchOps",
    assistantSend: "Gửi",
    assistantTitleKicker: "Trợ lý trong web",
    assistantBtn: "Trợ lý",
    friendlyKicker: "Friendly mode",
    friendlyVizBriefGoal: "Chọn một launch ở danh sách bên trái, kiểm tra brief, rồi bấm 'Chạy phân tích'.",
    friendlyVizScoreReason: "Chạy phân tích để xem lý do điểm, kết luận và phần còn thiếu.",
    friendlyAnalyzeBtn: "Chạy phân tích",
    friendlyPostReviewBtn: "Phân tích sau launch",
    emptyStateAnalysis: "Chọn launch, kiểm tra brief rồi bấm Chạy phân tích.",
    emptyStateHistory: "Launch này chưa có lịch sử. Bấm Chạy phân tích để tạo bản ghi đầu tiên.",
    emptyStateRisks: "Chưa có điểm rủi ro. Bấm Chạy phân tích để tạo.",
    ragKicker: "Tri thức tham khảo · RAG",
    ragTitle: "Bài học & dữ liệu sản phẩm liên quan",
    traceKicker: "Pipeline đa agent · Debug",
    traceTitle: "Agents trace & JSON",
    traceCopyBtn: "Copy JSON"
  },
  en: {
    title: "LaunchOps Command Center",
    eyebrow: "V-Team · VinhVNN · GS9",
    newLaunch: "New Launch",
    openTemplateConfig: "Classification Config",
    modeFriendly: "Friendly",
    modePro: "Pro",
    statusAll: "All",
    statusRunning: "Running",
    statusCompleted: "Completed",
    runLogFilterAll: "All",
    runLogFilterError: "Error",
    runLogFilterWarn: "Warning",
    runLogClear: "Clear session log",
    runLogTitle: "Analysis run log (Admin)",
    runLogClient: "Session events (client)",
    runLogServer: "Saved analysis traces (server trace)",
    runLogCopy: "Copy log",
    runLogCopied: "Copied",
    runLogCopyError: "Copy error",
    runLogAdminOnly: "Logs are restricted to Admin.",
    runLogNoEvents: "No events recorded in this session for the selected launch.",
    runLogNoTraces: "No saved analysis traces found for this launch.",
    runLogNoAgentTrace: "No agent traces available for this run.",
    errTimeoutClient: "Client canceled due to 240s timeout (server might still be running). Rendered local rule fallback.",
    errTimeoutStatus: "Analysis timed out ? showing fallback results. Retry or report to Admin.",
    errNoBrief: "No brief available for analysis...",
    errNoBriefStatus: "No brief available for analysis. Enter a brief and try again.",
    statusUpcoming: "Upcoming",
    searchLabel: "Search",
    searchPlaceholder: "Name or type",
    statusLabel: "Status",
    roleLabel: "Role",
    introTitle: "What is LaunchOps Command Center?",
    introSummary: "LaunchOps Command Center is a Super Agent & Launch Dashboard that helps teams manage risks before, during, and after shipping campaigns, H5 events, features, or releases.",
    closeIntro: "Close",
    tabBrief: "Brief",
    tabAnalysis: "Analyze",
    tabChecklist: "To-do List",
    tabLessons: "Lessons",
    tabHistory: "History",
    runAnalyze: "Run Analysis",
    saveLaunch: "Save Launch",
    exportReport: "Export Report",
    demoMode: "Load Demo",
    deleteLaunch: "Delete launch",
    assistantTitle: "LaunchOps Assistant",
    assistantInputPlaceholder: "Ask assistant or paste brief...",
    assistantSend: "Send",
    assistantTitleKicker: "In-App Assistant",
    assistantBtn: "Assistant",
    friendlyKicker: "Friendly mode",
    friendlyVizBriefGoal: "Select a launch from the left sidebar, check the brief, then click 'Run Analysis'.",
    friendlyVizScoreReason: "Run analysis to view detailed scores, verdicts, and missing checklist items.",
    friendlyAnalyzeBtn: "Run Analysis",
    friendlyPostReviewBtn: "Post-Launch Review",
    emptyStateAnalysis: "Select a launch, check the brief, then click Run Analysis.",
    emptyStateHistory: "This launch has no history. Click Run Analysis to generate the first record.",
    emptyStateRisks: "No risks found. Click Run Analysis to analyze.",
    ragKicker: "Reference Knowledge · RAG",
    ragTitle: "Related lessons & product data",
    traceKicker: "Multi-agent Pipeline · Debug",
    traceTitle: "Agents trace & JSON",
    traceCopyBtn: "Copy JSON"
  }
};

let currentLang = localStorage.getItem("launchops_lang") || "vi";

function updateUILanguage(lang) {
  currentLang = lang;
  localStorage.setItem("launchops_lang", lang);
  const dict = LAUNCHOPS_LANG_MAP[lang];

  // Update active buttons state
  document.getElementById("langViBtn")?.classList.toggle("active", lang === "vi");
  document.getElementById("langEnBtn")?.classList.toggle("active", lang === "en");

  // Basic Topbar elements
  const titleEl = document.querySelector(".topbar h1");
  if (titleEl) titleEl.textContent = dict.title;
  const eyebrowEl = document.querySelector(".topbar .eyebrow");
  if (eyebrowEl) eyebrowEl.textContent = dict.eyebrow;

  const newLaunchEl = document.getElementById("newLaunch");
  if (newLaunchEl) newLaunchEl.textContent = dict.newLaunch;
  const configBtn = document.getElementById("openTemplateConfig");
  if (configBtn) configBtn.textContent = dict.openTemplateConfig;

  const modeFriendlyBtn = document.getElementById("modeFriendlyBtn");
  if (modeFriendlyBtn) modeFriendlyBtn.textContent = dict.modeFriendly;
  const modeProBtn = document.getElementById("modeProBtn");
  if (modeProBtn) modeProBtn.textContent = dict.modePro;

  // Search & Filters labels

  const runLogTitleEl = document.querySelector("#runLog .title-row h3");
  if (runLogTitleEl) runLogTitleEl.textContent = dict.runLogTitle;

  const runLogFilter = document.getElementById("runLogFilter");
  if (runLogFilter) {
    runLogFilter.options[0].text = dict.runLogFilterAll;
    runLogFilter.options[1].text = dict.runLogFilterError;
    runLogFilter.options[2].text = dict.runLogFilterWarn;
  }
  const clearRunLogBtn = document.getElementById("clearRunLog");
  if (clearRunLogBtn) clearRunLogBtn.textContent = dict.runLogClear;

  const copyRunLogBtn = document.getElementById("copyRunLog");
  if (copyRunLogBtn) copyRunLogBtn.textContent = dict.runLogCopy;

  const searchSpan = document.querySelector(".board-search span");
  if (searchSpan) searchSpan.textContent = dict.searchLabel;
  const searchInput = document.getElementById("launchSearch");
  if (searchInput) searchInput.setAttribute("placeholder", dict.searchPlaceholder);

  const statusFilterSpan = document.querySelector(".board-status-filter span");
  if (statusFilterSpan) statusFilterSpan.textContent = dict.statusLabel;
  const statusFilterSelect = document.getElementById("launchStatusFilter");
  if (statusFilterSelect) {
    statusFilterSelect.options[0].text = dict.statusAll;
    statusFilterSelect.options[1].text = dict.statusRunning;
    statusFilterSelect.options[2].text = dict.statusCompleted;
    statusFilterSelect.options[3].text = dict.statusUpcoming;
  }

  // Sidebar kicker
  const boardKicker = document.querySelector(".board-head .section-kicker");
  if (boardKicker) boardKicker.textContent = lang === "vi" ? "Danh sách theo trạng thái" : "Launches by Status";

  // Role
  const roleSpan = document.querySelector(".role-label");
  if (roleSpan) {
    // preserve help button
    const helpBtn = roleSpan.querySelector(".help-button");
    roleSpan.innerHTML = dict.roleLabel + " ";
    if (helpBtn) roleSpan.appendChild(helpBtn);
  }

  // Detail header kicker
  const heroKicker = document.querySelector(".detail-hero .section-kicker");
  if (heroKicker) heroKicker.textContent = lang === "vi" ? "Chi tiết launch" : "Launch Details";

  // Intro modal
  const introTitleEl = document.getElementById("introTitle");
  if (introTitleEl) introTitleEl.textContent = dict.introTitle;
  const introSummaryEl = document.getElementById("introSummary");
  if (introSummaryEl) introSummaryEl.textContent = dict.introSummary;
  const closeIntroEl = document.getElementById("closeIntroModal");
  if (closeIntroEl) {
    closeIntroEl.setAttribute("aria-label", dict.closeIntro);
  }

  // Tabs
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab => {
    const view = tab.getAttribute("data-view");
    if (view === "briefView") tab.textContent = dict.tabBrief;
    else if (view === "redTeam") tab.textContent = dict.tabAnalysis;
    else if (view === "checklist") tab.textContent = dict.tabChecklist;
    else if (view === "lessons") tab.textContent = dict.tabLessons;
    else if (view === "history") tab.textContent = dict.tabHistory;
  });

  // Action Buttons
  const analyzeBtn = document.getElementById("analyzeBrief");
  if (analyzeBtn && !document.body.classList.contains("is-analyzing")) analyzeBtn.textContent = dict.runAnalyze;
  const saveBtn = document.getElementById("saveLaunch");
  if (saveBtn) saveBtn.textContent = dict.saveLaunch;
  const exportBtn = document.getElementById("exportReport");
  if (exportBtn) exportBtn.textContent = dict.exportReport;
  const demoBtn = document.getElementById("demoMode");
  if (demoBtn) demoBtn.textContent = dict.demoMode;
  const deleteBtn = document.getElementById("deleteLaunch");
  if (deleteBtn) deleteBtn.textContent = dict.deleteLaunch;

  // Assistant
  const asstKicker = document.querySelector(".assistant-panel .section-kicker");
  if (asstKicker) asstKicker.textContent = dict.assistantTitleKicker;
  const asstTitle = document.querySelector(".assistant-panel strong");
  if (asstTitle) asstTitle.textContent = dict.assistantTitle;
  const asstInput = document.getElementById("assistantInput");
  if (asstInput) asstInput.setAttribute("placeholder", dict.assistantInputPlaceholder);
  const asstSubmit = document.querySelector(".assistant-form button[type='submit']");
  if (asstSubmit) asstSubmit.textContent = dict.assistantSend;
  const asstLauncher = document.getElementById("openAssistant");
  if (asstLauncher) asstLauncher.textContent = dict.assistantBtn;

  // Friendly visualize
  const frVizKicker = document.querySelector(".friendly-viz-kicker");
  if (frVizKicker) frVizKicker.textContent = dict.friendlyKicker;
  const frVizBriefGoal = document.getElementById("friendlyVizBriefGoal");
  if (frVizBriefGoal && frVizBriefGoal.textContent.includes("Chọn một launch") || frVizBriefGoal && frVizBriefGoal.textContent.includes("Select a launch")) {
    frVizBriefGoal.textContent = dict.friendlyVizBriefGoal;
  }
  const frVizScoreReason = document.getElementById("friendlyVizScoreReason");
  if (frVizScoreReason && frVizScoreReason.textContent.includes("Chạy phân tích") || frVizScoreReason && frVizScoreReason.textContent.includes("Run analysis")) {
    frVizScoreReason.textContent = dict.friendlyVizScoreReason;
  }
  const frAnalyzeBtn = document.getElementById("friendlyAnalyzeBrief");
  if (frAnalyzeBtn) frAnalyzeBtn.textContent = dict.friendlyAnalyzeBtn;
  const frPostBtn = document.querySelector("[data-friendly-action='post-review']");
  if (frPostBtn) frPostBtn.textContent = dict.friendlyPostReviewBtn;

  // Sync status
  const syncStatus = document.getElementById("analysisSource");
  if (syncStatus && (syncStatus.textContent === "Bản local đã sẵn sàng" || syncStatus.textContent === "Local backend ready")) {
    syncStatus.textContent = lang === "vi" ? "Bản local đã sẵn sàng" : "Local backend ready";
  }

  // If detailSub has default text, translate it
  const detailSub = document.getElementById("detailSub");
  if (detailSub && (detailSub.textContent === "Tạo hoặc chọn launch trước khi phân tích." || detailSub.textContent === "Create or select a launch to start analysis.")) {
    detailSub.textContent = lang === "vi" ? "Tạo hoặc chọn launch trước khi phân tích." : "Create or select a launch to start analysis.";
  }

  // Update dynamic render states if empty
  const scoreReason = document.getElementById("scoreReason");
  if (scoreReason && (scoreReason.textContent === "Chọn launch, kiểm tra brief rồi bấm Chạy phân tích." || scoreReason.textContent === "Select a launch, check the brief, then click Run Analysis.")) {
    scoreReason.textContent = dict.emptyStateAnalysis;
  }

  // RAG + Trace modules (redesign 2026-06-11)
  const ragKickerEl = document.getElementById("ragKicker");
  if (ragKickerEl) ragKickerEl.textContent = dict.ragKicker;
  const ragTitleEl = document.getElementById("ragTitle");
  if (ragTitleEl) ragTitleEl.textContent = dict.ragTitle;
  const traceKickerEl = document.getElementById("traceKicker");
  if (traceKickerEl) traceKickerEl.textContent = dict.traceKicker;
  const traceTitleEl = document.getElementById("traceTitle");
  if (traceTitleEl) traceTitleEl.textContent = dict.traceTitle;
  const traceCopyEl = document.getElementById("traceCopyBtn");
  if (traceCopyEl) traceCopyEl.textContent = dict.traceCopyBtn;
  if (typeof renderRagInsights === "function" && typeof renderAgentsTrace === "function") {
    renderRagInsights(lastRagTraceResult);
    renderAgentsTrace(lastRagTraceResult);
  }
}

// Bind language events
document.addEventListener("DOMContentLoaded", () => {
  const langVi = document.getElementById("langViBtn");
  const langEn = document.getElementById("langEnBtn");

  if (langVi) langVi.addEventListener("click", () => updateUILanguage("vi"));
  if (langEn) langEn.addEventListener("click", () => updateUILanguage("en"));

  updateUILanguage(currentLang);
});

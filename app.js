const badBrief = `# Brief mẫu cần phản biện

Tên launch: Golden Spin Weekend Risk - sự kiện Lucky Spin cuối tuần cho người chơi game.

Mục tiêu: Kéo người chơi quay lại trong cuối tuần và tăng doanh thu gói nạp nhỏ.

Cơ chế: Người chơi đăng nhập nhận 1 lượt quay miễn phí mỗi ngày. Nếu nạp gói bất kỳ sẽ nhận thêm 3 lượt quay. Có thể trúng item hiếm, coupon hoặc vật phẩm tiêu hao.

Thời gian: Dự kiến mở tối thứ Sáu và kết thúc tối Chủ nhật. Chưa chốt giờ bật/tắt chính xác.

Đối tượng: Tất cả người chơi level 10 trở lên.

Kênh truyền thông: Banner in-game, inbox và fanpage.

Phần thưởng: Chưa chốt tỷ lệ trúng item hiếm, chưa có reward cap cuối tuần, chưa có rule khi hết quà.

Việc đã có:
- PM LiveOps phụ trách brief.
- Tech đã có bản build H5 cơ bản.
- Tech có log thiết bị/IP cơ bản.
- Data đã dựng dashboard spin success bản nháp.
- Business muốn dùng item hiếm để tạo cảm giác hấp dẫn.

Vấn đề còn mở:
- Chưa có rollback plan nếu hệ thống quay thưởng lỗi hoặc phát quà chậm.
- Chưa có CS FAQ cho case không nhận lượt quay, hết quà, mất kết nối khi quay.
- Chưa có owner trực cuối tuần theo ca.
- Chưa có ngưỡng pause nếu lỗi claim reward hoặc ticket CS tăng bất thường.
- Chưa có rule chống farm lượt quay bằng tài khoản phụ.
- Chưa có dashboard realtime cho spin success, reward delivery, ticket CS.
- Chưa có post-mortem template để lưu bài học cho đợt Golden Spin tiếp theo.`;

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
const PROTECTED_LAUNCH_TYPES = Object.freeze([...Object.keys(LAUNCH_TEMPLATES), "lucky_spin_event"]);
const HIDDEN_CATALOG_LAUNCH_TYPES = new Set(["lucky_spin_event"]);
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
const TEMPLATE_EDITING_LOCKED = false;
const ROLE_SWITCH_LOCKED = false;
const LOCKED_LAUNCH_ROLE = "human";
// Public review lock: mirrors server LAUNCHOPS_PUBLIC_LOCK (read from /api/version at boot).
// When true: config/template + approval are view-only and sample launches cannot be edited/deleted.
let PUBLIC_LOCK = false;
const SAMPLE_LAUNCH_PREFIXES = ["golden-spin", "lucky-spin", "lucky-wheel", "midweek", "may-login"];
function launchIsSample(launch) {
  if (launch && typeof launch.isSample === "boolean") return launch.isSample;
  const id = String(launch?.id || "").toLowerCase();
  return SAMPLE_LAUNCH_PREFIXES.some((prefix) => id.startsWith(prefix));
}
function currentLaunchIsSample() {
  return launchIsSample(currentLaunch);
}
function sampleLaunchLocked() {
  return PUBLIC_LOCK && currentLaunchIsSample();
}
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

function configTerm(key) {
  const terms = {
    delete: { vi: "Xóa", en: "Delete" },
    newRiskGroup: { vi: "Nhóm rủi ro mới", en: "New risk group" },
    groupName: { vi: "Tên nhóm", en: "Group name" },
    maxScore: { vi: "Điểm tối đa", en: "Max score" },
    maxScoreHelpLabel: { vi: "Giải thích điểm tối đa", en: "Explain max score" },
    maxScoreTooltip: {
      vi: "Đây là trọng số của nhóm rủi ro này. Tổng điểm readiness bằng tổng Điểm tối đa của tất cả nhóm. Agent chấm 0 đến mức này dựa trên tiêu chí đạt điểm và nội dung brief.",
      en: "This is the weight of this risk group. Total readiness equals the sum of max scores across all groups. The Agent scores from 0 up to this value based on scoring criteria and the brief."
    },
    requirements: { vi: "Tiêu chí đạt điểm", en: "Scoring criteria" },
    requirementsHelpLabel: { vi: "Giải thích tiêu chí đạt điểm", en: "Explain scoring criteria" },
    requirementsTooltip: {
      vi: "Đây là checklist điều kiện để nhóm này được điểm cao. AI thật sẽ đọc các tiêu chí này trong prompt; demo local dùng thêm từ khóa để chấm nhanh.",
      en: "These are the conditions for this group to score well. The real AI reads these criteria in the prompt; the local demo also uses keywords for quick scoring."
    },
    localKeywords: { vi: "Từ khóa demo local", en: "Local demo keywords" },
    localKeywordsHelpLabel: { vi: "Giải thích từ khóa demo local", en: "Explain local demo keywords" },
    localKeywordsTooltip: {
      vi: "Chỉ dùng cho chế độ fallback/rule-based local. Nếu brief có các từ khóa này, app có thêm bằng chứng để chấm điểm nhóm rủi ro. AI thật vẫn đọc toàn bộ tiêu chí và brief.",
      en: "Only used for local fallback/rule-based mode. If the brief contains these keywords, the app has extra evidence for scoring this risk group. The real AI still reads the full criteria and brief."
    },
    missingMessage: { vi: "Khi thiếu thì nói gì?", en: "What to say when missing?" },
    missingMessageHelpLabel: { vi: "Giải thích khi thiếu thì nói gì", en: "Explain missing-data message" },
    missingMessageTooltip: {
      vi: "Đây là câu Agent dùng để giải thích khi brief chưa đủ dữ liệu cho nhóm rủi ro này. Human sửa câu này rồi lưu cấu hình chung thì lần phân tích sau sẽ dùng câu mới.",
      en: "This is what the Agent says when the brief lacks data for this risk group. If a human edits it and saves the shared config, future analyses will use the new message."
    },
    newPersona: { vi: "Người phản biện mới", en: "New red-team reviewer" },
    personaRole: { vi: "Vai trò phản biện", en: "Red-team role" },
    mainConcern: { vi: "Lo ngại chính", en: "Main concern" },
    evidenceToFind: { vi: "Dấu hiệu cần tìm", en: "Evidence to look for" },
    fix: { vi: "Cách xử lý", en: "Fix" },
    task: { vi: "Việc cần làm", en: "Task" },
    defaultTemplate: { vi: "Template mặc định", en: "Default template" },
    customTemplate: { vi: "Template tùy chỉnh", en: "Custom template" },
    classificationName: { vi: "Tên phân loại", en: "Classification name" },
    templateForClassification: { vi: "Dùng bộ template", en: "Use template" }
  };
  const entry = terms[key];
  return entry ? (entry[uiLang()] || entry.vi) : key;
}

function statusDisplayLabel(status) {
  return uiLang() === "en"
    ? (STATUS_LABELS_EN[status] || status || "")
    : (STATUS_LABELS[status] || status || "");
}

function configButtonText(isConfigScreen = false) {
  return isConfigScreen ? tr("Quay lại launch", "Back to launch") : tr("Cấu Hình", "Config");
}

const PERSONA_LABELS = {
  "Angry user": { vi: "Người chơi bức xúc", en: "Angry player" },
  "Exploit hunter": { vi: "Người tìm cách lách luật", en: "Exploit hunter" },
  "CS lead": { vi: "Trưởng nhóm CS", en: "CS lead" },
  "Tech on-call": { vi: "Kỹ thuật trực sự cố", en: "Tech on-call" },
  "Business owner": { vi: "Người phụ trách kinh doanh", en: "Business owner" },
  "SRE on-call": { vi: "SRE trực sự cố", en: "SRE on-call" },
  "Security reviewer": { vi: "Người rà soát bảo mật", en: "Security reviewer" },
  "Data owner": { vi: "Người phụ trách dữ liệu", en: "Data owner" },
  "Incident commander": { vi: "Chỉ huy xử lý sự cố", en: "Incident commander" },
  "End user representative": { vi: "Đại diện người dùng cuối", en: "End user representative" },
  "Economy reviewer": { vi: "Người rà soát Economy", en: "Economy reviewer" },
  "Người chơi bức xúc": { vi: "Người chơi bức xúc", en: "Angry player" },
  "Người tìm cách lách luật": { vi: "Người tìm cách lách luật", en: "Exploit hunter" },
  "Trưởng nhóm CS": { vi: "Trưởng nhóm CS", en: "CS lead" },
  "Kỹ thuật trực sự cố": { vi: "Kỹ thuật trực sự cố", en: "Tech on-call" },
  "Người phụ trách kinh doanh": { vi: "Người phụ trách kinh doanh", en: "Business owner" },
  "SRE trực sự cố": { vi: "SRE trực sự cố", en: "SRE on-call" },
  "Người rà soát bảo mật": { vi: "Người rà soát bảo mật", en: "Security reviewer" },
  "Người phụ trách dữ liệu": { vi: "Người phụ trách dữ liệu", en: "Data owner" },
  "Chỉ huy xử lý sự cố": { vi: "Chỉ huy xử lý sự cố", en: "Incident commander" },
  "Đại diện người dùng cuối": { vi: "Đại diện người dùng cuối", en: "End user representative" },
  "Người rà soát Economy": { vi: "Người rà soát Economy", en: "Economy reviewer" }
};
const STATUS_VALUE_LABELS = {
  Todo: "Cần làm",
  Doing: "Đang làm",
  Done: "Đã xong",
  Blocked: "Đang kẹt"
};
const STATUS_VALUE_LABELS_EN = {
  Todo: "To do",
  Doing: "Doing",
  Done: "Done",
  Blocked: "Blocked"
};
const PRIORITY_LABELS = {
  High: "Cao",
  Medium: "Vừa",
  Low: "Thấp"
};
const PRIORITY_LABELS_EN = {
  High: "High",
  Medium: "Medium",
  Low: "Low"
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

const LUCKY_SPIN_EVENT_TEMPLATE = {
  name: "Lucky Spin Event Playbook",
  description: "Template riêng cho sự kiện quay thưởng ingame có lượt quay, reward cap, chống farm, CS FAQ và rollback.",
  briefGuide: [
    "Mục tiêu/KPI của event, segment người chơi và thời gian bật/tắt.",
    "Cơ chế nhận lượt quay, điều kiện hợp lệ, reset ngày và giới hạn lượt.",
    "Reward pool, tỷ lệ trúng, ngân sách tối đa, rule khi hết quà.",
    "Rule chống farm tài khoản phụ, log bất thường và điều kiện pause.",
    "CS FAQ, thông điệp in-game, owner trực cuối tuần và escalation.",
    "Dashboard realtime, rollback/kill switch và post-mortem lesson cho event sau."
  ],
  riskGroups: [
    { key: "scope", label: "Mục tiêu và segment", maxScore: 2, checks: ["muc tieu", "kpi", "segment", "doi tuong", "level"], missing: "Chưa rõ KPI, segment người chơi hoặc phạm vi áp dụng.", requirements: ["KPI đo được", "Segment người chơi", "Phạm vi áp dụng"] },
    { key: "spin_rule", label: "Cơ chế quay và eligibility", maxScore: 2, checks: ["luot quay", "eligibility", "dieu kien", "reset", "gioi han"], missing: "Chưa rõ cách nhận lượt quay, điều kiện hợp lệ, reset ngày hoặc giới hạn lượt.", requirements: ["Rule nhận lượt quay", "Điều kiện hợp lệ", "Reset/giới hạn lượt"] },
    { key: "reward", label: "Reward cap và economy", maxScore: 2, checks: ["reward", "phan thuong", "ti le", "ngan sach", "cap"], missing: "Chưa chốt reward cap, tỷ lệ trúng, ngân sách hoặc tác động economy.", requirements: ["Reward cap", "Tỷ lệ trúng", "Ngân sách tối đa"] },
    { key: "abuse", label: "Anti-abuse và log", maxScore: 2, checks: ["abuse", "farm", "tai khoan phu", "log", "bat thuong"], missing: "Chưa có rule chống farm, log bất thường hoặc cách xử lý exploit.", requirements: ["Rule chống farm", "Log bất thường", "Owner xử lý abuse"] },
    { key: "cs", label: "CS và thông điệp", maxScore: 2, checks: ["faq", "cs", "macro", "in-game", "ticket"], missing: "Thiếu CS FAQ, macro trả lời, thông điệp người chơi hoặc đường leo thang.", requirements: ["CS FAQ", "Macro trả lời", "Thông điệp in-game"] },
    { key: "tech", label: "Rollback và monitoring", maxScore: 2, checks: ["rollback", "monitoring", "dashboard", "pause", "kill switch"], missing: "Thiếu dashboard realtime, ngưỡng pause, rollback hoặc kill switch.", requirements: ["Dashboard realtime", "Ngưỡng pause", "Rollback/kill switch"] }
  ],
  redTeam: [
    { persona: "Người chơi bức xúc", worry: "Người chơi quay trúng hoặc mất lượt nhưng không nhận quà sẽ tạo ticket nhanh.", evidence: "Brief cần nói rõ reward delivery, case mất kết nối và rule bồi thường.", fix: "Viết CS FAQ, thông điệp in-game và rule bồi thường trước khi mở event." },
    { persona: "Người săn exploit", worry: "Người chơi có thể farm lượt quay bằng tài khoản phụ hoặc reset điều kiện.", evidence: "Brief cần eligibility, giới hạn lượt/ngày và log hành vi bất thường.", fix: "Chốt rule chống farm, giới hạn lượt và dashboard abuse trước launch." },
    { persona: "CS Lead", worry: "Ticket cuối tuần sẽ dồn nếu macro chưa đủ case.", evidence: "Brief cần macro cho hết quà, không nhận reward, mất kết nối và điều kiện tham gia.", fix: "Chuẩn bị FAQ, macro theo case và lịch trực CS theo ca." },
    { persona: "Tech on-call", worry: "Nếu spin service lỗi, team cần biết khi nào pause và rollback.", evidence: "Brief cần dashboard realtime, ngưỡng pause và kill switch.", fix: "Chốt alert, kill switch, rollback script và người quyết định pause." },
    { persona: "Business owner", worry: "Item hiếm và coupon có thể vượt cap hoặc làm lệch economy.", evidence: "Brief cần reward cap, tỷ lệ trúng và ngân sách tối đa.", fix: "Chốt reward pool, cap cuối tuần và review tác động economy trước T-1." }
  ],
  checklist: [
    { task: "Chốt KPI, segment người chơi và giờ bật/tắt event", owner: "PM LiveOps", deadline: "T-2 ngày", status: "Todo", priority: "High" },
    { task: "Chốt reward pool, tỷ lệ trúng và cap ngân sách cuối tuần", owner: "Business Owner", deadline: "T-2 ngày", status: "Todo", priority: "High" },
    { task: "Hoàn tất rule chống farm tài khoản phụ và log bất thường", owner: "Tech Owner", deadline: "T-1 ngày", status: "Todo", priority: "High" },
    { task: "Viết CS FAQ cho case mất lượt, hết quà, phát quà chậm", owner: "CS Lead", deadline: "T-1 ngày", status: "Todo", priority: "High" },
    { task: "Chuẩn bị dashboard realtime, ngưỡng pause và kill switch", owner: "Tech on-call", deadline: "T-1 ngày", status: "Todo", priority: "High" },
    { task: "Tổng kết ticket, reward cost và lesson cho Golden Spin sau", owner: "PM LiveOps", deadline: "T+48 giờ", status: "Todo", priority: "Medium" }
  ],
  postmortem: [
    { title: "Kết quả Golden Spin", items: ["Tỷ lệ tham gia và lượt quay thực tế?", "Reward cost có vượt cap không?", "Spin success/reward delivery có lỗi không?"] },
    { title: "Rủi ro và vận hành", items: ["Có farm lượt quay không?", "Ticket CS tăng ở case nào?", "Ngưỡng pause/kill switch có đủ rõ không?"] },
    { title: "Bài học cho event sau", items: ["Rule nào phải thêm vào template?", "Thông điệp/FAQ nào cần chuẩn hóa?", "Checklist nào cần tick sớm hơn?"] }
  ]
};
LAUNCH_TEMPLATES.lucky_spin_event = LUCKY_SPIN_EVENT_TEMPLATE;

const IN_GAME_SHOP_COMMERCIAL_TEMPLATE = {
  name: "In-Game Shop Commercial Playbook",
  description: "Template riêng cho shop ingame dạng commercial: gói bán, pricing, cap doanh thu, economy, CS refund và kill switch offer.",
  briefGuide: [
    "Mục tiêu doanh thu, conversion, segment người chơi và khung giờ mở shop.",
    "Danh sách offer/gói bán, giá, limit mua, eligibility và thời điểm reset.",
    "Guardrail economy: cap doanh thu, cap vật phẩm hiếm, ngưỡng dừng offer và rule thay offer.",
    "Funnel tracking: impression, click, purchase success, payment fail, refund và chargeback.",
    "CS FAQ cho lỗi mua gói, nhận vật phẩm chậm, hoàn tiền, hiển thị giá sai và escalation.",
    "Owner trực launch, dashboard realtime, kill switch, rollback offer và post-mortem sau campaign."
  ],
  riskGroups: [
    { key: "scope", label: "Mục tiêu doanh thu và segment", maxScore: 2, checks: ["doanh thu", "conversion", "segment", "offer"], missing: "Chưa rõ KPI doanh thu, conversion hoặc segment người chơi.", requirements: ["KPI doanh thu", "Segment áp dụng", "Khung giờ mở shop"] },
    { key: "offer", label: "Offer, giá và limit mua", maxScore: 2, checks: ["gia", "offer", "limit", "bundle", "eligibility"], missing: "Chưa chốt giá, giới hạn mua hoặc eligibility của từng offer.", requirements: ["Giá/offer rõ", "Limit mua", "Eligibility"] },
    { key: "economy", label: "Economy guardrail", maxScore: 2, checks: ["economy", "cap", "vat pham", "nguong dung"], missing: "Thiếu cap doanh thu/vật phẩm hiếm hoặc ngưỡng dừng offer khi economy lệch.", requirements: ["Cap doanh thu", "Cap vật phẩm hiếm", "Ngưỡng dừng/đổi offer"] },
    { key: "payment", label: "Payment và refund", maxScore: 2, checks: ["payment", "refund", "chargeback", "purchase"], missing: "Thiếu kế hoạch theo dõi payment fail, refund hoặc chargeback.", requirements: ["Purchase success metric", "Refund flow", "Chargeback owner"] },
    { key: "cs", label: "CS và thông điệp bán hàng", maxScore: 2, checks: ["faq", "cs", "message", "price", "refund"], missing: "Thiếu CS FAQ, thông điệp offer hoặc xử lý giá/nhận vật phẩm sai.", requirements: ["CS FAQ", "Thông điệp bán hàng", "Escalation path"] },
    { key: "ops", label: "Dashboard và kill switch", maxScore: 2, checks: ["dashboard", "kill switch", "rollback", "alert"], missing: "Thiếu dashboard realtime, alert hoặc kill switch offer.", requirements: ["Dashboard realtime", "Alert", "Kill switch/rollback offer"] }
  ],
  redTeam: [
    { persona: "Người mua nhạy giá", worry: "Người chơi thấy giá/benefit không rõ sẽ bỏ mua hoặc khiếu nại.", evidence: "Brief phải nói rõ giá, value proposition, limit mua và thông điệp hiển thị.", fix: "Chuẩn hóa card offer, giá trước/sau giảm và ví dụ vật phẩm nhận được." },
    { persona: "Payment owner", worry: "Payment fail hoặc duplicate purchase sẽ làm CS/refund tăng mạnh.", evidence: "Brief cần metric purchase success, payment fail và owner xử lý refund.", fix: "Theo dõi payment fail realtime, FAQ refund và đường leo thang tới payment owner." },
    { persona: "Game economy owner", worry: "Offer quá mạnh có thể phá economy hoặc cannibalize shop khác.", evidence: "Brief cần cap vật phẩm hiếm, limit mua và rule dừng offer.", fix: "Chốt cap economy, limit mua theo account và ngưỡng tắt offer khi vượt guardrail." },
    { persona: "CS Lead", worry: "CS sẽ bị dồn case nhận vật phẩm chậm, giá sai hoặc hoàn tiền.", evidence: "Brief cần FAQ theo từng lỗi và SLA phản hồi.", fix: "Viết macro cho payment fail, nhận quà chậm, giá sai và escalation rõ." },
    { persona: "LiveOps trực launch", worry: "Nếu funnel rơi mạnh hoặc payment lỗi, team phải tắt offer rất nhanh.", evidence: "Brief cần dashboard, alert, kill switch và owner trực launch.", fix: "Chuẩn bị dashboard realtime, ngưỡng alert và rollback offer theo từng gói." }
  ],
  checklist: [
    { task: "Chốt KPI doanh thu, conversion và segment của campaign shop", owner: "PM Monetization", deadline: "T-2 ngày", status: "Todo", priority: "High" },
    { task: "Khóa danh sách offer, giá, limit mua và eligibility", owner: "Commercial Owner", deadline: "T-2 ngày", status: "Todo", priority: "High" },
    { task: "Review cap economy, cap vật phẩm hiếm và ngưỡng dừng offer", owner: "Game Economy Owner", deadline: "T-1 ngày", status: "Todo", priority: "High" },
    { task: "Chuẩn bị metric purchase success, payment fail, refund và chargeback", owner: "Payment Owner", deadline: "T-1 ngày", status: "Todo", priority: "High" },
    { task: "Viết CS FAQ cho lỗi mua gói, giá sai, nhận vật phẩm chậm, refund", owner: "CS Lead", deadline: "T-1 ngày", status: "Todo", priority: "High" },
    { task: "Kiểm tra dashboard realtime và kill switch từng offer", owner: "LiveOps Lead", deadline: "T-1 ngày", status: "Todo", priority: "High" }
  ],
  postmortem: [
    { title: "Kết quả commercial", items: ["Doanh thu và conversion có đạt plan không?", "Offer nào bán tốt/xấu hơn dự kiến?", "Tỷ lệ payment fail và refund có vượt guardrail không?"] },
    { title: "Tác động vận hành", items: ["Case CS nhiều nhất là gì?", "Có cần tắt offer hay đổi price card không?", "Dashboard/alert có bắt đúng lúc không?"] },
    { title: "Bài học shop sau", items: ["Offer nào nên giữ, bỏ hoặc tách segment?", "Guardrail economy nào cần siết thêm trong template?"] }
  ]
};

const LOGIN_STREAK_RETENTION_TEMPLATE = {
  name: "Login Streak Retention Playbook",
  description: "Template riêng cho sự kiện login/check-in giữ chân: streak day, milestone reward, anti-abuse, reset rule và thông điệp quay lại game.",
  briefGuide: [
    "Mục tiêu retention/login, cohort người chơi, mốc ngày chạy và baseline cần so.",
    "Luật check-in: reset mấy giờ, streak bị mất khi nào, bù streak có hay không.",
    "Milestone reward theo ngày, cap phần thưởng và rủi ro abuse nhiều account.",
    "Trigger message, push/inbox/banner và cách nhắc lại với người chơi bỏ streak.",
    "Metric theo dõi: login day 1/day N, streak completion, reward claim success, ticket CS.",
    "Owner trực event, dashboard retention, kill switch reward và post-mortem để tái dùng."
  ],
  riskGroups: [
    { key: "goal", label: "Mục tiêu retention và cohort", maxScore: 2, checks: ["retention", "login", "cohort", "baseline"], missing: "Chưa rõ mục tiêu retention/login hoặc cohort áp dụng.", requirements: ["KPI retention", "Cohort người chơi", "Baseline so sánh"] },
    { key: "rule", label: "Rule streak và reset", maxScore: 2, checks: ["streak", "reset", "mat streak", "bo bu"], missing: "Chưa khóa rule reset, mất streak hoặc bù streak.", requirements: ["Rule reset", "Mất streak khi nào", "Có/không bù streak"] },
    { key: "reward", label: "Reward milestone", maxScore: 2, checks: ["reward", "milestone", "claim", "cap"], missing: "Thiếu milestone reward, cap phần thưởng hoặc rule claim.", requirements: ["Milestone reward", "Cap phần thưởng", "Rule claim"] },
    { key: "abuse", label: "Anti-abuse và duplicate claim", maxScore: 2, checks: ["abuse", "duplicate", "multi account", "claim"], missing: "Thiếu kiểm soát multi-account hoặc duplicate claim.", requirements: ["Rule anti-abuse", "Duplicate claim check", "Owner xử lý abuse"] },
    { key: "message", label: "Nhắc lại và CS", maxScore: 2, checks: ["push", "banner", "faq", "message", "ticket"], missing: "Thiếu kế hoạch nhắc lại người chơi và CS FAQ cho mất streak/không nhận quà.", requirements: ["Trigger message", "CS FAQ", "Escalation"] },
    { key: "ops", label: "Tracking và vận hành", maxScore: 2, checks: ["dashboard", "alert", "retention", "kill switch"], missing: "Thiếu dashboard retention hoặc kill switch reward.", requirements: ["Dashboard retention", "Alert", "Kill switch reward"] }
  ],
  redTeam: [
    { persona: "Người chơi quên check-in", worry: "Người chơi mất streak sẽ bỏ event nếu rule reset không rõ.", evidence: "Brief phải nói rõ giờ reset, mất streak và có bù streak hay không.", fix: "Hiển thị rõ giờ reset trong UI, push nhắc trước reset và FAQ mất streak." },
    { persona: "Retention PM", worry: "Event tăng login ảo nhưng không kéo day-N retention thật.", evidence: "Brief cần baseline retention, cohort và metric completion.", fix: "Chốt cohort mục tiêu và đọc retention theo cohort thay vì chỉ nhìn login tổng." },
    { persona: "Reward abuse reviewer", worry: "Nhiều account có thể claim reward milestone dễ dàng.", evidence: "Brief cần anti-abuse cho duplicate claim và account phụ.", fix: "Thêm limit reward, duplicate-claim check và dashboard abuse." },
    { persona: "CS Lead", worry: "Case mất streak, không nhận quà, reset sai giờ sẽ làm ticket tăng.", evidence: "Brief cần FAQ/macro cho từng case.", fix: "Viết macro cho mất streak, reset sai giờ và reward claim fail." },
    { persona: "LiveOps trực event", worry: "Nếu reward claim lỗi hàng loạt, team cần kill switch nhanh.", evidence: "Brief cần alert, owner trực event và kill switch reward.", fix: "Chuẩn bị dashboard retention/claim success, ngưỡng alert và kill switch." }
  ],
  checklist: [
    { task: "Chốt KPI retention/login, cohort và baseline của login event", owner: "Retention PM", deadline: "T-2 ngày", status: "Todo", priority: "High" },
    { task: "Khóa rule streak, giờ reset, mất streak và bù streak", owner: "LiveOps PM", deadline: "T-2 ngày", status: "Todo", priority: "High" },
    { task: "Review milestone reward, cap phần thưởng và duplicate claim check", owner: "Economy Owner", deadline: "T-1 ngày", status: "Todo", priority: "High" },
    { task: "Chuẩn bị push/inbox/banner nhắc lại trước reset và khi bỏ streak", owner: "CRM Owner", deadline: "T-1 ngày", status: "Todo", priority: "High" },
    { task: "Viết FAQ cho mất streak, không nhận quà, reset sai giờ", owner: "CS Lead", deadline: "T-1 ngày", status: "Todo", priority: "High" },
    { task: "Kiểm tra dashboard retention, claim success và kill switch reward", owner: "LiveOps Lead", deadline: "T-1 ngày", status: "Todo", priority: "High" }
  ],
  postmortem: [
    { title: "Kết quả retention", items: ["Login day 1/day N có tăng đúng cohort không?", "Tỷ lệ hoàn thành streak tới ngày 3/5/7 là bao nhiêu?", "Reward claim success có ổn định không?"] },
    { title: "Tác động CS và abuse", items: ["Case CS lớn nhất là mất streak hay claim lỗi?", "Có duplicate claim hoặc abuse account phụ không?", "Thông điệp nhắc lại có tới đúng người không?"] },
    { title: "Bài học login sau", items: ["Rule streak nào cần đơn giản hóa?", "Milestone reward hoặc nhịp nhắc nào nên đổi cho event sau?"] }
  ]
};

const EN_BRIEF_GUIDES_BY_TEMPLATE = {
  "Game Event Launch": {
    description: "Use for in-game events or campaigns with players, rewards, CS handling, and abuse risk.",
    items: [
      "Goal, KPI, and target player segment.",
      "Launch window, owner, and on-call team.",
      "Event or campaign mechanics, rewards, budget, and limits.",
      "CS FAQ, player messaging, and complaint risks.",
      "Technical testing, monitoring, rollback plan, and pause threshold.",
      "What to measure after launch and where lessons will be saved."
    ]
  },
  "Production System Release": {
    description: "Use for production system releases that do not default to a business owner.",
    items: [
      "Release goal, scope of change, and affected systems.",
      "Deploy window, owner, and incident on-call.",
      "Test plan, rollout plan, monitoring, and alerts.",
      "Rollback plan, incident runbook, and stop thresholds.",
      "User, service, or data impact and communication plan.",
      "Post-release uptime, errors, incidents, and operating lessons."
    ]
  },
  "Generic Launch": {
    description: "Use for launches that are not game events or production releases.",
    items: [
      "Goal, scope, and affected audience.",
      "Owner, approver, and deadline.",
      "Execution, communication, and support plan.",
      "Operational, legal, access, or data risks.",
      "Fallback or rollback plan if the launch fails.",
      "How results will be measured and lessons recorded."
    ]
  },
  "Lucky Spin Event Playbook": {
    description: "Dedicated template for in-game lucky-spin events with spin attempts, reward caps, anti-farm rules, CS FAQ, and rollback.",
    items: [
      "Event goal/KPI, player segment, and start/end time.",
      "How players receive spins, eligibility rules, daily reset, and spin limits.",
      "Reward pool, drop rates, maximum budget, and rules when rewards run out.",
      "Anti-farm rules for secondary accounts, anomaly logs, and pause conditions.",
      "CS FAQ, in-game messaging, weekend owner, and escalation path.",
      "Realtime dashboard, rollback/kill switch, and post-mortem lesson for the next event."
    ]
  },
  "In-Game Shop Commercial Playbook": {
    description: "Dedicated template for in-game shop campaigns with offers, pricing, economy guardrails, payment metrics, CS refund flow, and offer kill switch.",
    items: [
      "Revenue goal, conversion target, player segment, and the shop window.",
      "Offer list, price, purchase limits, eligibility rules, and reset timing.",
      "Economy guardrails: revenue cap, rare-item cap, stop threshold, and offer-change rules.",
      "Funnel tracking for impressions, clicks, purchase success, payment failures, refunds, and chargebacks.",
      "CS FAQ for payment errors, delayed delivery, wrong price display, refund, and escalation.",
      "Live owner, realtime dashboard, offer kill switch, rollback plan, and post-mortem."
    ]
  },
  "Login Streak Retention Playbook": {
    description: "Dedicated template for login streak or check-in retention events with day milestones, reset rules, anti-abuse checks, reminder messaging, and reward kill switch.",
    items: [
      "Retention or login goal, target cohort, date range, and baseline to compare against.",
      "Streak rules: reset time, when the streak breaks, and whether streak recovery exists.",
      "Daily milestone rewards, reward caps, and claim rules.",
      "Reminder messaging through push, inbox, banner, and win-back communication for dropped streaks.",
      "Tracking for login day 1/day N, streak completion, reward claim success, and CS tickets.",
      "Live owner, retention dashboard, reward kill switch, and post-mortem lessons."
    ]
  }
};

const EN_LUCKY_SPIN_POSTMORTEM = [
  {
    title: "Golden Spin results",
    items: [
      "Actual participation rate and spin volume?",
      "Did reward cost exceed the cap?",
      "Any spin success or reward delivery errors?"
    ]
  },
  {
    title: "Risk and operations",
    items: [
      "Was there spin farming?",
      "Which CS ticket cases increased?",
      "Were the pause threshold and kill switch clear enough?"
    ]
  },
  {
    title: "Lessons for the next event",
    items: [
      "Which rule must be added to the template?",
      "Which message or FAQ should be standardized?",
      "Which checklist item should be completed earlier?"
    ]
  }
];

function englishBriefGuideForTemplate(template = {}) {
  if (EN_BRIEF_GUIDES_BY_TEMPLATE[template.name]) return EN_BRIEF_GUIDES_BY_TEMPLATE[template.name];
  const name = String(template.name || "").toLowerCase();
  const description = String(template.description || "").toLowerCase();
  const riskKeys = (template.riskGroups || []).map((group) => group.key).join(" ").toLowerCase();
  if (name.includes("lucky spin") || name.includes("sự kiện lucky spin") || description.includes("quay thưởng") || riskKeys.includes("spin_rule")) {
    return EN_BRIEF_GUIDES_BY_TEMPLATE["Lucky Spin Event Playbook"];
  }
  if (name.includes("production") || name.includes("release hệ thống") || riskKeys.includes("rollback")) {
    return EN_BRIEF_GUIDES_BY_TEMPLATE["Production System Release"];
  }
  return EN_BRIEF_GUIDES_BY_TEMPLATE["Generic Launch"];
}

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
  "lucky_spin_event": "Sự kiện game",
  "Game event": "Sự kiện game",
  "Campaign marketing": "Chiến dịch marketing",
  "Feature release": "Ra mắt tính năng",
  "Production system release": "Release hệ thống production",
  "Internal tool": "Công cụ nội bộ",
  "Ops/process change": "Thay đổi quy trình vận hành",
  "Partnership/commercial launch": "Hợp tác / thương mại",
  "Emergency hotfix": "Hotfix khẩn cấp"
};

// Nhãn phân loại tiếng Anh — dùng khi UI là EN (kể cả type có tên VI mặc định).
const TYPE_LABELS_EN = {
  "lucky_spin_event": "Game event",
  "Game event": "Game event",
  "Campaign marketing": "Marketing campaign",
  "Feature release": "Feature release",
  "Production system release": "Production system release",
  "Internal tool": "Internal tool",
  "Ops/process change": "Ops/process change",
  "Partnership/commercial launch": "Partnership/commercial launch",
  "Emergency hotfix": "Emergency hotfix"
};

const TEMPLATE_NAME_LABELS = {
  "Lucky Spin Event Playbook": "Template sự kiện Lucky Spin",
  "Game Event Launch": "Template sự kiện game",
  "In-Game Shop Commercial Playbook": "Template shop ingame thương mại",
  "Login Streak Retention Playbook": "Template đăng nhập giữ chân",
  "Production System Release": "Template release hệ thống",
  "Generic Launch": "Template launch chung"
};
const TEMPLATE_NAME_LABELS_EN = {
  "Lucky Spin Event Playbook": "Lucky Spin event template",
  "Game Event Launch": "Game event template",
  "In-Game Shop Commercial Playbook": "In-game shop commercial template",
  "Login Streak Retention Playbook": "Login streak retention template",
  "Production System Release": "Production release template",
  "Generic Launch": "Shared launch template"
};
const BASE_TEMPLATE_OPTIONS = [
  { id: "luckySpin", template: LUCKY_SPIN_EVENT_TEMPLATE },
  { id: "gameEvent", template: GAME_EVENT_TEMPLATE },
  { id: "shopCommercial", template: IN_GAME_SHOP_COMMERCIAL_TEMPLATE },
  { id: "loginRetention", template: LOGIN_STREAK_RETENTION_TEMPLATE },
  { id: "production", template: PRODUCTION_SYSTEM_TEMPLATE },
  { id: "generic", template: GENERIC_LAUNCH_TEMPLATE }
];
const PROTECTED_BASE_TEMPLATE_IDS = Object.freeze(BASE_TEMPLATE_OPTIONS.map((item) => item.id));
const TYPE_TEMPLATE_IDS = {
  "Game event": ["gameEvent", "shopCommercial", "loginRetention"],
  "Campaign marketing": ["generic"],
  "Internal tool": ["generic"],
  "Ops/process change": ["generic"],
  "Partnership/commercial launch": ["generic"],
  lucky_spin_event: ["luckySpin"]
};

const DEMO_CREATED_AT = new Date("2026-06-16T08:00:00+07:00").toISOString();
const LUCKY_SPIN_TYPE = "lucky_spin_event";

const luckySpinRetroBrief = `Tên launch: Golden Spin tháng 5 Retro - sự kiện Lucky Spin đã chạy cuối tháng 5.

Trạng thái: Đã chạy từ 29/05/2026 đến 31/05/2026.

Mục tiêu ban đầu:
- Kéo người chơi casual quay lại game vào cuối tuần.
- Tăng thử nghiệm gói nạp nhỏ 49k và 99k.
- Giữ reward cost trong cap 120 triệu.

Cơ chế đã chạy: Người chơi đăng nhập nhận 1 lượt quay miễn phí mỗi ngày, nạp gói nhỏ nhận thêm 2 lượt quay. Item hiếm giới hạn 500 phần.

Kết quả thực tế:
- Login rate tăng 6,4% trong 2 ngày đầu.
- Doanh thu gói nhỏ tăng 9,1%, reward cost trong cap.
- Ticket CS tăng mạnh trong 8 giờ đầu vì người chơi không hiểu reset ngày và case mất kết nối khi quay.
- Có 37 tài khoản phụ farm lượt quay trước khi rule bị siết thủ công.

Điểm thiếu khi chuẩn bị:
- In-game message chưa nói rõ mốc reset 05:00.
- CS FAQ thiếu macro cho mất lượt, hết quà, phát quà chậm.
- Chưa có dashboard spin success/reward delivery realtime.
- Chưa có ngưỡng pause nếu ticket CS hoặc lỗi claim reward tăng bất thường.`;

const luckySpinReadyBrief = `Tên launch: Golden Spin Weekend v2 Ready - sự kiện Lucky Spin cuối tuần đã áp dụng bài học tháng 5.

Mục tiêu:
- Tăng login cuối tuần 7%.
- Tăng doanh thu gói nhỏ 8-10%.
- Giữ reward cost dưới 150 triệu và không làm lệch economy.

Thời gian: Bật 20:00 19/06/2026, tắt 23:59 21/06/2026. War room mở từ 19:30 ngày launch.

Đối tượng: Người chơi level 10+, tài khoản tạo trước 01/06/2026, không thuộc danh sách abuse/refund.

Cơ chế:
- Mỗi ngày đăng nhập nhận 1 lượt quay miễn phí, reset lúc 05:00.
- Nạp gói 49k/99k nhận thêm tối đa 3 lượt/ngày.
- Mỗi account tối đa 9 lượt cuối tuần; thiết bị/IP bất thường sẽ vào hàng chờ review.

Reward và guardrail:
- Reward cap cuối tuần 150 triệu.
- Item hiếm giới hạn 600 phần, tắt item hiếm khi đạt 95% cap.
- Nếu reward delivery lỗi trên 1% trong 10 phút hoặc ticket CS tăng gấp 2 baseline, Tech on-call được quyền pause event.

Vận hành:
- PM LiveOps owner, CS Lead trực 2 ca, Tech on-call trực 20:00-24:00 mỗi ngày.
- CS FAQ đã có macro cho mất lượt, hết quà, phát quà chậm, reset ngày.
- Dashboard realtime có spin success, reward delivery, ticket CS, abuse flag.
- Kill switch và rollback script đã test ở staging.
- Post-mortem T+48h ghi lại ticket, reward cost, abuse case và lesson cho Golden Spin tháng 7.`;

const luckySpinDraftRetroBrief = `Tên launch: Golden Spin Demo 01 - Retro Draft.

Mục đích demo: Dùng như launch đã chạy để người trình bày nhập/chỉnh lại ngày giờ, sau đó phân tích và lưu bài học cho launch cùng loại.

Trạng thái nháp: Đã chạy. Chưa phân tích trong app.

Bối cảnh:
- Golden Spin là event quay thưởng cuối tuần cho người chơi game.
- Mục tiêu cũ là tăng login cuối tuần và kích hoạt gói nạp nhỏ.
- Event có lượt quay miễn phí khi đăng nhập và lượt quay thêm khi nạp gói 49k/99k.

Kết quả thực tế cần kể trong demo:
- Login tăng nhẹ, doanh thu gói nhỏ có tăng.
- Ticket CS tăng vì người chơi không hiểu reset ngày, mất lượt quay và thời điểm nhận quà.
- Có dấu hiệu tài khoản phụ farm lượt quay trước khi team phát hiện.
- Team thiếu dashboard realtime cho spin success, reward delivery và abuse flag.

Bài học muốn lưu lại:
- Brief Lucky Spin phải ghi rõ reset ngày, điều kiện nhận lượt và ví dụ case mất lượt.
- Phải có reward cap, giới hạn item hiếm và rule tắt item khi gần hết cap.
- CS cần FAQ/macro trước giờ mở event.
- Tech cần dashboard realtime, kill switch và ngưỡng pause.`;

const luckySpinDraftRiskBrief = `Tên launch: Golden Spin Demo 02 - Risk Draft.

Mục đích demo: Dùng như launch đang chuẩn bị/chạy nhưng còn thiếu nhiều guardrail. Human sẽ tự chỉnh thời gian rồi bấm phân tích để thấy Yellow/Red Team/checklist.

Trạng thái nháp: Đang chạy hoặc sát giờ chạy. Chưa phân tích trong app.

Mục tiêu:
- Tăng login cuối tuần.
- Tăng doanh thu gói nhỏ 49k/99k.
- Tạo cảm giác vui cho người chơi qua vòng quay may mắn.

Cơ chế dự kiến:
- Người chơi đăng nhập nhận lượt quay miễn phí mỗi ngày.
- Người chơi nạp gói bất kỳ nhận thêm lượt quay.
- Phần thưởng gồm item thường, coupon và một số item hiếm.

Điểm còn mơ hồ:
- Chưa chốt reset lúc mấy giờ và mất lượt xử lý ra sao.
- Chưa chốt reward cap, tỷ lệ trúng item hiếm và rule khi hết quà.
- Chưa có điều kiện chống tài khoản phụ farm lượt quay.
- Chưa có CS FAQ cho mất lượt, hết quà, phát quà chậm.
- Chưa rõ dashboard theo dõi, người được quyền pause và rollback script.

Gợi ý khi demo: Sau khi phân tích, dùng Red Team để bổ sung reward cap, anti-abuse, CS FAQ và monitoring.`;

const luckySpinDraftReadyBrief = `Tên launch: Golden Spin Demo 03 - Ready Draft.

Mục đích demo: Dùng như phiên bản đã học từ Retro/Risk và chuẩn bị chạy lại. Human sẽ tự chỉnh thời gian rồi phân tích để kỳ vọng chuyển sang Green.

Trạng thái nháp: Sắp chạy. Chưa phân tích trong app.

Mục tiêu:
- Tăng login cuối tuần 7%.
- Tăng doanh thu gói nhỏ 8-10%.
- Giữ reward cost dưới cap và không làm lệch economy.

Đối tượng:
- Người chơi level 10+.
- Tài khoản tạo trước ngày chốt của event.
- Loại trừ account nằm trong danh sách abuse/refund.

Cơ chế:
- Mỗi ngày đăng nhập nhận 1 lượt quay miễn phí, reset lúc 05:00.
- Nạp gói 49k/99k nhận thêm tối đa 3 lượt/ngày.
- Mỗi account tối đa 9 lượt trong toàn event.
- Thiết bị/IP bất thường được đưa vào hàng chờ review.

Reward và guardrail:
- Reward cap tổng event 150 triệu.
- Item hiếm giới hạn 600 phần.
- Tắt item hiếm khi đạt 95% cap hoặc khi reward delivery lỗi vượt ngưỡng.
- Nếu ticket CS tăng gấp 2 baseline hoặc reward delivery lỗi trên 1% trong 10 phút, Tech on-call được quyền pause event.

Vận hành:
- PM LiveOps owner.
- CS Lead trực 2 ca với FAQ/macro cho mất lượt, hết quà, phát quà chậm và reset ngày.
- Tech on-call trực giờ mở event.
- Dashboard realtime có spin success, reward delivery, ticket CS, abuse flag.
- Kill switch và rollback script đã test ở staging.
- Post-mortem T+48h sẽ ghi lại ticket, reward cost, abuse case và lesson cho lần sau.`;

const shopRetroBrief = `Tên launch: Monsoon Gem Shop Retro.

Trạng thái: Đã chạy từ 02/06/2026 đến 05/06/2026.

Mục tiêu:
- Tăng doanh thu shop ingame cho gói Gem và skin giới hạn trong 4 ngày.
- Kéo conversion của nhóm payer vừa quay lại sau 14 ngày inactive.

Điểm đã xảy ra:
- Offer bán tốt ở ngày 1 nhưng payment fail tăng mạnh trong 2 khung giờ cao điểm.
- Một số người chơi thấy giá hiển thị đúng nhưng nhận vật phẩm chậm 3-5 phút.
- Economy owner phải tắt sớm 1 offer vì item hiếm gần chạm cap.

Bài học:
- Brief shop phải khóa cap vật phẩm hiếm và ngưỡng tắt offer ngay từ đầu.
- CS cần FAQ riêng cho payment fail, nhận vật phẩm chậm và hoàn tiền.
- Dashboard phải có purchase success, payment fail, refund và chargeback theo offer.`;

const shopLiveBrief = `Tên launch: Mùa Hè Sôi Động Shop Ingame.

Trạng thái nháp: Đang chạy.

Mục tiêu:
- Tăng doanh thu net 12% trong 72 giờ.
- Đẩy conversion cho nhóm payer 7 ngày gần nhất.

Offer hiện có:
- Gói Gem 49k / 99k / 199k.
- Bundle skin mùa hè giới hạn 1 lần/account.
- Gói hoàn nguyên năng lượng mở theo giờ.

Điểm còn thiếu:
- Chưa chốt rõ cap vật phẩm hiếm của bundle skin.
- Chưa rõ owner xử lý refund/chargeback ngoài giờ.
- Chưa có ngưỡng tắt từng offer khi payment fail tăng cao.
- CS FAQ cho giá sai, mua thành công nhưng nhận item chậm còn thiếu.`;

const shopReadyBrief = `Tên launch: Festival Shop Premium Ready.

Trạng thái nháp: Sắp chạy.

Mục tiêu:
- Tăng doanh thu shop 10% trong 3 ngày.
- Nâng conversion nhóm payer cũ quay lại.

Đã chốt:
- Offer, giá, limit mua và eligibility cho từng gói.
- Cap doanh thu, cap vật phẩm hiếm và rule tắt offer khi chạm 95% cap.
- Dashboard realtime theo offer: impression, click, purchase success, payment fail, refund, chargeback.
- CS FAQ cho payment fail, giá sai, nhận item chậm, refund.
- LiveOps trực launch có kill switch theo từng offer và rollback card shop.`;

const loginRetroBrief = `Tên launch: Hành Trình Đăng Nhập 7 Ngày Retro.

Trạng thái: Đã chạy từ 26/05/2026 đến 01/06/2026.

Mục tiêu:
- Tăng login day-7 của nhóm người chơi inactive quay lại.

Điểm đã xảy ra:
- Login tăng tốt ở 3 ngày đầu nhưng tỷ lệ hoàn thành streak ngày 7 thấp.
- Ticket CS phát sinh vì người chơi không hiểu reset 05:00 và mất streak khi quên 1 ngày.
- Có nhóm account phụ claim milestone ngày 7 lặp lại.

Bài học:
- Rule streak/reset phải viết cực rõ ngay trong brief và inbox.
- Phải có duplicate-claim check cho milestone reward.
- Dashboard retention cần tách cohort thay vì chỉ nhìn login tổng.`;

const loginLiveBrief = `Tên launch: Đăng Nhập Nhận Quà Hè.

Trạng thái nháp: Đang chạy.

Mục tiêu:
- Tăng login ngày 1-5 cho nhóm free user.

Rule hiện có:
- Check-in mỗi ngày nhận 1 mốc quà.
- Milestone lớn ở ngày 3 và ngày 7.

Điểm còn thiếu:
- Chưa khóa rõ có cho bù streak hay không.
- Chưa có duplicate-claim check ở milestone ngày 7.
- Trigger push trước giờ reset và FAQ mất streak còn mơ hồ.
- Dashboard retention/claim success chưa có alert.`;

const loginReadyBrief = `Tên launch: Login Streak Festival Ready.

Trạng thái nháp: Sắp chạy.

Mục tiêu:
- Tăng login day-1/day-7 cho cohort quay lại trong 14 ngày.

Đã chốt:
- Rule streak, reset 05:00, không bù streak và copy hiển thị rõ trong event.
- Milestone reward theo ngày 1/3/5/7 với cap reward tổng.
- Duplicate-claim check, anti-abuse multi-account và owner xử lý abuse.
- Push/inbox/banner nhắc lại trước reset và khi người chơi bỏ streak.
- Dashboard retention, streak completion, reward claim success và kill switch reward đã sẵn sàng.`;

const luckySpinYellowResult = {
  source: "memory_sample",
  decision: {
    color: "Yellow",
    score: 7,
    maxScore: 12,
    title: "Cần chốt guardrail trước khi mở Golden Spin",
    reason: "Brief đã có mục tiêu và cơ chế cơ bản, nhưng còn thiếu reward cap, anti-abuse, CS FAQ, dashboard realtime và ngưỡng pause."
  },
  riskBreakdown: [
    { label: "Mục tiêu và segment", score: 2, maxScore: 2, missing: "Mục tiêu và segment đã đủ rõ." },
    { label: "Cơ chế quay và eligibility", score: 1, maxScore: 2, missing: "Chưa rõ reset ngày, giới hạn lượt và điều kiện tài khoản hợp lệ." },
    { label: "Reward cap và economy", score: 1, maxScore: 2, missing: "Chưa có reward cap, tỷ lệ trúng và rule khi hết quà." },
    { label: "Anti-abuse và log", score: 1, maxScore: 2, missing: "Chưa có rule chống farm tài khoản phụ hoặc log bất thường." },
    { label: "CS và thông điệp", score: 1, maxScore: 2, missing: "Thiếu CS FAQ cho mất lượt, hết quà và phát quà chậm." },
    { label: "Rollback và monitoring", score: 1, maxScore: 2, missing: "Thiếu dashboard realtime, ngưỡng pause và kill switch." }
  ],
  topRisks: [
    "Người chơi có thể farm lượt quay bằng tài khoản phụ.",
    "Ticket CS sẽ tăng nếu mất lượt hoặc phát quà chậm mà chưa có macro.",
    "Không có reward cap/ngưỡng pause khiến team khó dừng event đúng lúc."
  ],
  redTeam: [
    { persona: "Người chơi bức xúc", worry: "Người chơi mất lượt quay hoặc không nhận quà sẽ khiếu nại ngay trong giờ đầu.", evidence: "Brief chưa có FAQ cho mất lượt, hết quà, phát quà chậm.", fix: "Viết macro CS và thông điệp in-game cho từng case trước T-1." },
    { persona: "Người săn exploit", worry: "Tài khoản phụ có thể farm lượt quay vì eligibility chưa siết.", evidence: "Brief chưa có tuổi tài khoản, giới hạn lượt và log bất thường.", fix: "Thêm điều kiện tài khoản, giới hạn lượt/ngày và abuse dashboard." },
    { persona: "CS Lead", worry: "Cuối tuần CS không đủ kịch bản trả lời nếu ticket tăng đột biến.", evidence: "Chưa có lịch trực, macro và escalation khi ticket gấp 2 baseline.", fix: "Chốt lịch trực CS, macro theo case và ngưỡng chuyển Tech on-call." },
    { persona: "Tech on-call", worry: "Spin service lỗi nhưng chưa có kill switch hoặc ngưỡng pause.", evidence: "Brief chưa có dashboard spin success/reward delivery realtime.", fix: "Chuẩn bị alert, kill switch, rollback script và người quyết định pause." },
    { persona: "Business owner", worry: "Item hiếm có thể vượt cap hoặc ảnh hưởng economy.", evidence: "Brief chưa chốt tỷ lệ trúng, số lượng item hiếm và reward cap.", fix: "Chốt reward pool, cap ngân sách và rule tắt item hiếm khi chạm 95% cap." }
  ],
  checklist: [
    { task: "Chốt reward cap, tỷ lệ trúng và rule khi hết quà", owner: "Business Owner", deadline: "T-2 ngày", status: "Todo", priority: "High" },
    { task: "Siết eligibility, giới hạn lượt và log chống farm tài khoản phụ", owner: "Tech Owner", deadline: "T-1 ngày", status: "Todo", priority: "High" },
    { task: "Viết CS FAQ cho mất lượt, hết quà, phát quà chậm", owner: "CS Lead", deadline: "T-1 ngày", status: "Todo", priority: "High" },
    { task: "Chuẩn bị dashboard realtime và ngưỡng pause", owner: "Tech on-call", deadline: "T-1 ngày", status: "Todo", priority: "High" }
  ],
  postmortem: [
    { title: "Bài học cần dùng lại", items: ["Brief Golden Spin phải có reward cap và rule chống farm trước T-2.", "CS FAQ phải cover mất lượt, hết quà, phát quà chậm trước khi mở event."] },
    { title: "Template cần siết", items: ["Thêm câu hỏi reset ngày/eligibility.", "Thêm checklist dashboard spin success và reward delivery realtime."] }
  ],
  productContext: {
    launchType: LUCKY_SPIN_TYPE,
    gameId: "demo_game",
    lessons: [
      { id: "lesson-golden-spin-reset", title: "Reset ngày cần ghi rõ", lesson: "Golden Spin tháng 5 tạo ticket vì không nói rõ reset 05:00.", severity: "High" },
      { id: "lesson-golden-spin-abuse", title: "Cần chống farm lượt quay", lesson: "Tài khoản phụ farm lượt quay nếu thiếu eligibility và giới hạn lượt/ngày.", severity: "High" }
    ],
    productHealth: { status: "watch", findings: ["Ticket reward delivery từng tăng trong event spin.", "Abuse account farm lượt quay là rủi ro lặp lại."] }
  }
};

const luckySpinGreenResult = {
  ...luckySpinYellowResult,
  decision: {
    color: "Green",
    score: 12,
    maxScore: 12,
    title: "Golden Spin v2 đã đủ điều kiện chạy",
    reason: "Launch đã áp dụng bài học cũ: có reward cap, eligibility, anti-abuse, CS FAQ, dashboard realtime, ngưỡng pause và rollback."
  },
  riskBreakdown: [
    { label: "Mục tiêu và segment", score: 2, maxScore: 2, missing: "KPI, segment và thời gian đã rõ." },
    { label: "Cơ chế quay và eligibility", score: 2, maxScore: 2, missing: "Reset 05:00, giới hạn lượt và điều kiện tài khoản đã rõ." },
    { label: "Reward cap và economy", score: 2, maxScore: 2, missing: "Reward cap, item hiếm và rule 95% cap đã rõ." },
    { label: "Anti-abuse và log", score: 2, maxScore: 2, missing: "Đã có rule abuse, log bất thường và hàng chờ review." },
    { label: "CS và thông điệp", score: 2, maxScore: 2, missing: "CS FAQ, macro và lịch trực đã sẵn sàng." },
    { label: "Rollback và monitoring", score: 2, maxScore: 2, missing: "Dashboard, kill switch và rollback đã test staging." }
  ],
  topRisks: [],
  redTeam: [],
  checklist: [
    { task: "Kiểm tra dashboard spin success/reward delivery trước giờ mở", owner: "Tech on-call", deadline: "19/06/2026 19:30", status: "Done", priority: "High" },
    { task: "Duyệt reward cap và rule tắt item hiếm ở 95% cap", owner: "Business Owner", deadline: "T-1 ngày", status: "Done", priority: "High" },
    { task: "Brief CS 2 ca trực với macro mất lượt/hết quà/phát chậm", owner: "CS Lead", deadline: "T-1 ngày", status: "Done", priority: "High" },
    { task: "Tổng kết Golden Spin v2 và cập nhật template tháng 7", owner: "PM LiveOps", deadline: "T+48 giờ", status: "Todo", priority: "Medium" }
  ]
};

const fallbackLaunches = [
  {
    id: "golden-spin-may-retro",
    name: "Golden Spin tháng 5 Retro",
    type: LUCKY_SPIN_TYPE,
    status: "completed",
    owner: "LiveOps Lead",
    targetDate: "2026-05-29 20:00",
    endDate: "2026-05-31 23:59",
    brief: luckySpinRetroBrief,
    template: LUCKY_SPIN_EVENT_TEMPLATE,
    templateVersions: [],
    lessonSuggestions: [],
    analyses: [
      {
        id: "analysis-golden-spin-may-retro",
        createdAt: new Date("2026-06-01T09:00:00+07:00").toISOString(),
        briefSnapshot: luckySpinRetroBrief.slice(0, 2000),
        result: { ...luckySpinYellowResult, decision: { ...luckySpinYellowResult.decision, score: 8, title: "Launch tháng 5 chạy được nhưng để lại rủi ro lặp lại" } }
      }
    ],
    postLaunchResult: "Golden Spin tháng 5 đạt mục tiêu login và doanh thu nhẹ, reward cost trong cap, nhưng ticket CS tăng trong 8 giờ đầu vì reset ngày, phát quà chậm và case mất lượt. Có 37 tài khoản phụ farm lượt quay trước khi team siết thủ công.",
    lessonsLearned: [
      { id: "lesson-golden-spin-reset", createdAt: new Date("2026-06-01T10:00:00+07:00").toISOString(), text: "Golden Spin phải ghi rõ reset ngày 05:00, điều kiện nhận lượt và ví dụ mất lượt ngay trong in-game message." },
      { id: "lesson-golden-spin-cs", createdAt: new Date("2026-06-01T10:05:00+07:00").toISOString(), text: "CS FAQ phải có macro cho mất lượt, hết quà, phát quà chậm và escalation khi ticket gấp 2 baseline." },
      { id: "lesson-golden-spin-abuse", createdAt: new Date("2026-06-01T10:10:00+07:00").toISOString(), text: "Event quay thưởng phải có eligibility, giới hạn lượt/ngày và dashboard abuse trước khi mở." }
    ],
    checklistProgress: {},
    redTeamBriefSupplements: {},
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT
  },
  {
    id: "golden-spin-weekend-risk",
    name: "Golden Spin Weekend Risk",
    type: LUCKY_SPIN_TYPE,
    status: "upcoming",
    owner: "PM LiveOps",
    targetDate: "2026-06-19 20:00",
    endDate: "2026-06-21 23:59",
    brief: badBrief,
    template: LUCKY_SPIN_EVENT_TEMPLATE,
    templateVersions: [],
    lessonSuggestions: [
      { title: "Áp dụng lesson reset ngày", suggestion: "Thêm reset 05:00 và ví dụ mất lượt vào in-game message.", severity: "High" },
      { title: "Áp dụng lesson chống farm", suggestion: "Thêm tuổi tài khoản, giới hạn lượt/ngày và abuse dashboard.", severity: "High" }
    ],
    analyses: [
      {
        id: "analysis-golden-spin-weekend-risk",
        createdAt: new Date("2026-06-16T08:30:00+07:00").toISOString(),
        briefSnapshot: badBrief.slice(0, 2000),
        result: luckySpinYellowResult
      }
    ],
    postLaunchResult: "",
    lessonsLearned: [],
    checklistProgress: {},
    redTeamBriefSupplements: {},
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT
  },
  {
    id: "golden-spin-weekend-v2-ready",
    name: "Golden Spin Weekend v2 Ready",
    type: LUCKY_SPIN_TYPE,
    status: "upcoming",
    owner: "PM LiveOps + Tech on-call",
    targetDate: "2026-06-20 20:00",
    endDate: "2026-06-22 23:59",
    brief: luckySpinReadyBrief,
    template: LUCKY_SPIN_EVENT_TEMPLATE,
    templateVersions: [
      { version: 1, createdAt: new Date("2026-06-16T07:30:00+07:00").toISOString(), template: LUCKY_SPIN_EVENT_TEMPLATE }
    ],
    lessonSuggestions: [],
    analyses: [
      {
        id: "analysis-golden-spin-weekend-v2-ready",
        createdAt: new Date("2026-06-16T09:00:00+07:00").toISOString(),
        briefSnapshot: luckySpinReadyBrief.slice(0, 2000),
        result: luckySpinGreenResult
      }
    ],
    postLaunchResult: "",
    lessonsLearned: [
      { id: "lesson-applied-golden-spin-reset", createdAt: new Date("2026-06-16T09:05:00+07:00").toISOString(), text: "Đã áp dụng lesson tháng 5: reset 05:00, CS FAQ, reward cap, anti-abuse và dashboard realtime đều nằm trong brief trước khi chạy." }
    ],
    checklistProgress: {
      "kiem tra dashboard spin success/reward delivery truoc gio mo|tech on-call|19/06/2026 19:30": true,
      "duyet reward cap va rule tat item hiem o 95% cap|business owner|t-1 ngay": true,
      "brief cs 2 ca truc voi macro mat luot/het qua/phat cham|cs lead|t-1 ngay": true
    },
    redTeamBriefSupplements: {},
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT
  },
  {
    id: "golden-spin-demo-01-retro",
    name: "Golden Spin Demo 01 - Retro Draft",
    type: LUCKY_SPIN_TYPE,
    status: "completed",
    owner: "PM LiveOps",
    targetDate: "2026-06-10 20:00",
    endDate: "2026-06-12 23:59",
    brief: luckySpinDraftRetroBrief,
    template: LUCKY_SPIN_EVENT_TEMPLATE,
    templateVersions: [],
    lessonSuggestions: [],
    analyses: [],
    postLaunchResult: "",
    lessonsLearned: [],
    checklistProgress: {},
    redTeamBriefSupplements: {},
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT
  },
  {
    id: "golden-spin-demo-02-risk",
    name: "Golden Spin Demo 02 - Risk Draft",
    type: LUCKY_SPIN_TYPE,
    status: "running",
    owner: "PM LiveOps",
    targetDate: "2026-06-17 08:30",
    endDate: "2026-06-18 23:59",
    brief: luckySpinDraftRiskBrief,
    template: LUCKY_SPIN_EVENT_TEMPLATE,
    templateVersions: [],
    lessonSuggestions: [],
    analyses: [],
    postLaunchResult: "",
    lessonsLearned: [],
    checklistProgress: {},
    redTeamBriefSupplements: {},
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT
  },
  {
    id: "golden-spin-demo-03-ready",
    name: "Golden Spin Demo 03 - Ready Draft",
    type: LUCKY_SPIN_TYPE,
    status: "upcoming",
    owner: "PM LiveOps + Tech on-call",
    targetDate: "2026-06-20 20:00",
    endDate: "2026-06-22 23:59",
    brief: luckySpinDraftReadyBrief,
    template: LUCKY_SPIN_EVENT_TEMPLATE,
    templateVersions: [],
    lessonSuggestions: [],
    analyses: [],
    postLaunchResult: "",
    lessonsLearned: [],
    checklistProgress: {},
    redTeamBriefSupplements: {},
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT
  },
  {
    id: "monsoon-shop-retro",
    name: "Monsoon Gem Shop Retro",
    type: "Game event",
    status: "completed",
    owner: "PM Monetization",
    targetDate: "2026-06-02 09:00",
    endDate: "2026-06-05 23:59",
    brief: shopRetroBrief,
    template: IN_GAME_SHOP_COMMERCIAL_TEMPLATE,
    templateVersions: [],
    lessonSuggestions: [],
    analyses: [],
    postLaunchResult: "",
    lessonsLearned: [],
    checklistProgress: {},
    redTeamBriefSupplements: {},
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT
  },
  {
    id: "monsoon-shop-live",
    name: "Mùa Hè Sôi Động Shop Ingame",
    type: "Game event",
    status: "running",
    owner: "Commercial Owner",
    targetDate: "2026-06-17 09:00",
    endDate: "2026-06-19 23:59",
    brief: shopLiveBrief,
    template: IN_GAME_SHOP_COMMERCIAL_TEMPLATE,
    templateVersions: [],
    lessonSuggestions: [],
    analyses: [],
    postLaunchResult: "",
    lessonsLearned: [],
    checklistProgress: {},
    redTeamBriefSupplements: {},
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT
  },
  {
    id: "monsoon-shop-ready",
    name: "Festival Shop Premium Ready",
    type: "Game event",
    status: "upcoming",
    owner: "LiveOps Lead",
    targetDate: "2026-06-24 09:00",
    endDate: "2026-06-27 23:59",
    brief: shopReadyBrief,
    template: IN_GAME_SHOP_COMMERCIAL_TEMPLATE,
    templateVersions: [],
    lessonSuggestions: [],
    analyses: [],
    postLaunchResult: "",
    lessonsLearned: [],
    checklistProgress: {},
    redTeamBriefSupplements: {},
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT
  },
  {
    id: "hero-login-retro",
    name: "Hành Trình Đăng Nhập 7 Ngày Retro",
    type: "Game event",
    status: "completed",
    owner: "Retention PM",
    targetDate: "2026-05-26 05:00",
    endDate: "2026-06-01 23:59",
    brief: loginRetroBrief,
    template: LOGIN_STREAK_RETENTION_TEMPLATE,
    templateVersions: [],
    lessonSuggestions: [],
    analyses: [],
    postLaunchResult: "",
    lessonsLearned: [],
    checklistProgress: {},
    redTeamBriefSupplements: {},
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT
  },
  {
    id: "hero-login-live",
    name: "Đăng Nhập Nhận Quà Hè",
    type: "Game event",
    status: "running",
    owner: "LiveOps PM",
    targetDate: "2026-06-17 05:00",
    endDate: "2026-06-23 23:59",
    brief: loginLiveBrief,
    template: LOGIN_STREAK_RETENTION_TEMPLATE,
    templateVersions: [],
    lessonSuggestions: [],
    analyses: [],
    postLaunchResult: "",
    lessonsLearned: [],
    checklistProgress: {},
    redTeamBriefSupplements: {},
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT
  },
  {
    id: "hero-login-ready",
    name: "Login Streak Festival Ready",
    type: "Game event",
    status: "upcoming",
    owner: "Retention PM",
    targetDate: "2026-06-25 05:00",
    endDate: "2026-07-01 23:59",
    brief: loginReadyBrief,
    template: LOGIN_STREAK_RETENTION_TEMPLATE,
    templateVersions: [],
    lessonSuggestions: [],
    analyses: [],
    postLaunchResult: "",
    lessonsLearned: [],
    checklistProgress: {},
    redTeamBriefSupplements: {},
    createdAt: DEMO_CREATED_AT,
    updatedAt: DEMO_CREATED_AT
  }
];

const MOJIBAKE_MARKERS = [
  "Ã¡", "Ã ", "Ã¢", "Ã£", "Ã©", "Ã¨", "Ãª", "Ã­", "Ã¬", "Ã³", "Ã²", "Ã´", "Ãµ", "Ãº", "Ã¹", "Ã½",
  "Ä‘", "Ä", "áº", "á»", "Æ°", "Æ¡", "â€", "Â "
];
const LOSSY_TEXT_RE = /(?:[A-Za-zÀ-ỹ]\?[A-Za-zÀ-ỹ]|\?\?[A-Za-zÀ-ỹ]|[A-Za-zÀ-ỹ]\?\?|\?\?)/;
const CP1252_BYTE_MAP = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87,
  "ˆ": 0x88, "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e,
  "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97,
  "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f
};

function textDamageScore(text) {
  const value = String(text || "");
  let score = 0;
  MOJIBAKE_MARKERS.forEach((marker) => {
    let index = value.indexOf(marker);
    while (index >= 0) {
      score += 3;
      index = value.indexOf(marker, index + marker.length);
    }
  });
  if (LOSSY_TEXT_RE.test(value)) score += 5;
  score += (value.match(/�/g) || []).length * 5;
  return score;
}

function hasTextEncodingDamage(text) {
  return textDamageScore(text) > 0;
}

function mojibakeBytes(text) {
  const bytes = [];
  for (const char of String(text || "")) {
    const code = char.charCodeAt(0);
    if (code <= 0xff) {
      bytes.push(code);
    } else if (Object.prototype.hasOwnProperty.call(CP1252_BYTE_MAP, char)) {
      bytes.push(CP1252_BYTE_MAP[char]);
    } else {
      return null;
    }
  }
  return bytes;
}

function repairLegacyText(value) {
  const text = String(value ?? "");
  if (!hasTextEncodingDamage(text) || LOSSY_TEXT_RE.test(text)) return text;
  const bytes = mojibakeBytes(text);
  if (!bytes?.length || typeof TextDecoder === "undefined") return text;
  try {
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(Uint8Array.from(bytes));
    return textDamageScore(decoded) < textDamageScore(text) ? decoded : text;
  } catch (error) {
    return text;
  }
}

function sanitizeLegacyEncoding(value) {
  if (typeof value === "string") return repairLegacyText(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeLegacyEncoding(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitizeLegacyEncoding(item)]));
  }
  return value;
}

function containsEncodingDamage(value) {
  if (typeof value === "string") return hasTextEncodingDamage(value);
  if (Array.isArray(value)) return value.some((item) => containsEncodingDamage(item));
  if (value && typeof value === "object") return Object.values(value).some((item) => containsEncodingDamage(item));
  return false;
}

function cleanDemoSample(launch) {
  const clean = cloneData(fallbackLaunches.find((item) => item.id === launch?.id) || launch);
  return {
    ...clean,
    createdAt: launch?.createdAt || clean.createdAt,
    updatedAt: launch?.updatedAt || clean.updatedAt
  };
}

function isFullGreenAnalysis(result) {
  const decision = result?.decision || {};
  const score = Number(decision.score) || 0;
  const maxScore = Number(decision.maxScore) || 0;
  return String(decision.color || "").toLowerCase() === "green" && maxScore > 0 && score >= maxScore;
}

function clearOpenPrelaunchRisksIfReady(result) {
  if (!isFullGreenAnalysis(result)) return result;
  return {
    ...result,
    topRisks: [],
    redTeam: []
  };
}

function sanitizeAnalysisResult(result) {
  return clearOpenPrelaunchRisksIfReady(sanitizeLegacyEncoding(result || {}));
}

function sanitizeLaunchData(launch) {
  if (!launch || typeof launch !== "object") return launch;
  if (fallbackLaunches.some((item) => item.id === launch.id) && containsEncodingDamage(launch)) {
    return cleanDemoSample(launch);
  }
  return sanitizeLegacyEncoding(launch);
}

const appShell = document.getElementById("appShell");
const launchGroups = document.getElementById("launchGroups");
const launchSearch = document.getElementById("launchSearch");
const launchStatusFilterSelect = document.getElementById("launchStatusFilter");
const launchDateFromInput = document.getElementById("launchDateFrom");
const launchDateToInput = document.getElementById("launchDateTo");
const launchName = document.getElementById("launchName");
const launchType = document.getElementById("launchType");
const launchTemplate = document.getElementById("launchTemplate");
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
const topRisksTitle = document.getElementById("topRisksTitle");
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
const archiveList = document.getElementById("archiveList");
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
const openCommunicationAppsButton = document.getElementById("openCommunicationApps");
const closeCommunicationAppsButton = document.getElementById("closeCommunicationApps");
const communicationAppsModal = document.getElementById("communicationAppsModal");
const copyZaloGroupLinkButton = document.getElementById("copyZaloGroupLink");
const copyCommStarterPromptButton = document.getElementById("copyCommStarterPrompt");
const commStarterPrompt = document.getElementById("commStarterPrompt");
const commAppsToast = document.getElementById("commAppsToast");
const introModal = document.getElementById("introModal");
const closeIntroModalButton = document.getElementById("closeIntroModal");
const enterDemoFromIntroButton = document.getElementById("enterDemoFromIntro");
const productSelect = document.getElementById("productSelect");
const changeProductButton = document.getElementById("changeProduct");
const ragInsightsBody = document.getElementById("ragInsightsBody");
const traceConsoleBody = document.getElementById("traceConsoleBody");
const traceCopyButton = document.getElementById("traceCopyBtn");

let lastRagTraceResult = null;
let redTeamBriefSupplements = {};
let checklistProgress = {};

let launches = [];
let archivedLaunches = [];
let currentLaunch = null;
let backendAvailable = Boolean(API_BASE);
let draftMode = false;
let templateOperatorId = "vinhvnn";
let launchSearchQuery = "";
let launchStatusFilter = "all";
let launchDateFromFilter = "";
let launchDateToFilter = "";
let selectedConfigType = "Game event";
let selectedConfigTemplateId = "gameEvent";
let previousLaunchView = "briefView";
let templateConfigVersions = {};
let controlledLearningBusy = "";
let assistantWizard = null;

function activeLaunchRole() {
  return adminSessionEnabled() ? "admin" : LOCKED_LAUNCH_ROLE;
}

function syncLaunchRoleLock() {
  if (!launchOperator) return;
  launchOperator.value = activeLaunchRole();
  launchOperator.disabled = true;
  launchOperator.title = tr("Quyền Admin mở bằng tham số nội bộ ?role=admin.", "Admin access is enabled by the internal ?role=admin parameter.");
}

function isLaunchAdmin() {
  return activeLaunchRole() === "admin";
}

function currentLaunchStatus() {
  return normalizeStatus(currentLaunch?.status || launchStatus?.value);
}

function canEditLaunch() {
  return !sampleLaunchLocked();
}

function canSaveLaunchData(launchData = collectLaunchFromForm()) {
  return !sampleLaunchLocked();
}

function canDeleteLaunch() {
  return Boolean(currentLaunch?.id && !draftMode) && !sampleLaunchLocked();
}

function canSaveLaunchOutcome() {
  return !sampleLaunchLocked();
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function stringMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [String(key), String(item || "")])
      .filter(([key]) => key)
  );
}

function booleanMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key)
      .map(([key, item]) => [String(key), Boolean(item)])
  );
}

function loadLaunchUiState(launch) {
  redTeamBriefSupplements = stringMap(launch?.redTeamBriefSupplements);
  checklistProgress = booleanMap(launch?.checklistProgress);
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

function statusValueFromText(text) {
  const normalized = normalizeText(text || "");
  if (normalized.includes("da chay") || normalized.includes("completed") || normalized.includes("done")) return "completed";
  if (normalized.includes("dang chay") || normalized.includes("running") || normalized.includes("active")) return "running";
  if (normalized.includes("sap chay") || normalized.includes("upcoming") || normalized.includes("future")) return "upcoming";
  return normalizeStatus(text);
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
  return normalizeTemplate(launch?.template, launch?.type || launchType?.value || "Game event");
}

function configTemplateType() {
  const id = configTemplateId();
  const type = templateTypeOptions().find((item) => baseTemplateIdForType(item) === id);
  selectedConfigType = type || firstLaunchType();
  return selectedConfigType;
}

function configTemplate() {
  return normalizeTemplate(baseTemplateById(configTemplateId()), configTemplateType());
}

function templateTypeOptions() {
  const orderedTypes = LAUNCH_TYPE_ORDER.filter((type) => launchTypeExists(type));
  const customTypes = Object.keys(LAUNCH_TEMPLATES).filter((type) => !orderedTypes.includes(type));
  return [...orderedTypes, ...customTypes].filter((type) => !HIDDEN_CATALOG_LAUNCH_TYPES.has(type));
}

function launchTypeExists(type) {
  return Boolean(type && Object.prototype.hasOwnProperty.call(LAUNCH_TEMPLATES, type));
}

function baseTemplateById(id) {
  return BASE_TEMPLATE_OPTIONS.find((item) => item.id === id)?.template || GENERIC_LAUNCH_TEMPLATE;
}

function baseTemplateOptionById(id) {
  return BASE_TEMPLATE_OPTIONS.find((item) => item.id === id) || BASE_TEMPLATE_OPTIONS[0];
}

function firstBaseTemplateId() {
  return BASE_TEMPLATE_OPTIONS[0]?.id || "generic";
}

function baseTemplateExists(id) {
  return Boolean(BASE_TEMPLATE_OPTIONS.some((item) => item.id === id));
}

function baseTemplateIdForTemplate(template) {
  if (!template) return "";
  const templateName = template?.name;
  return BASE_TEMPLATE_OPTIONS.find((item) => item.template.name === templateName)?.id || "generic";
}

function baseTemplateIdForType(type) {
  const ids = (TYPE_TEMPLATE_IDS[type] || []).filter(baseTemplateExists);
  return ids[0] || baseTemplateIdForTemplate(LAUNCH_TEMPLATES[type]);
}

function baseTemplateIdForLaunch(launch) {
  return baseTemplateIdForTemplate(launch?.template) || baseTemplateIdForType(launch?.type) || firstBaseTemplateId();
}

function templateIdsForType(type, selectedId = "") {
  const ids = (TYPE_TEMPLATE_IDS[type] || []).filter(baseTemplateExists);
  const fallback = baseTemplateIdForTemplate(LAUNCH_TEMPLATES[type]) || firstBaseTemplateId();
  if (!ids.length && fallback) ids.push(fallback);
  if (selectedId && baseTemplateExists(selectedId) && !ids.includes(selectedId)) ids.unshift(selectedId);
  return ids.length ? ids : [firstBaseTemplateId()];
}

function bindTemplateToType(type, templateId, { makeDefault = true } = {}) {
  if (!launchTypeExists(type) || !baseTemplateExists(templateId)) return;
  const ids = templateIdsForType(type).filter((id) => id !== templateId);
  TYPE_TEMPLATE_IDS[type] = makeDefault ? [templateId, ...ids] : [...ids, templateId];
  LAUNCH_TEMPLATES[type] = baseTemplateById(TYPE_TEMPLATE_IDS[type][0]);
}

function typesUsingTemplateId(templateId) {
  return templateTypeOptions().filter((type) => templateIdsForType(type).includes(templateId));
}

function configTemplateId() {
  if (!baseTemplateExists(selectedConfigTemplateId)) selectedConfigTemplateId = firstBaseTemplateId();
  return selectedConfigTemplateId;
}

function ensureLaunchType(type, label = type, template = GENERIC_LAUNCH_TEMPLATE) {
  if (!type) return;
  if (!launchTypeExists(type)) LAUNCH_TEMPLATES[type] = template;
  if (!TYPE_TEMPLATE_IDS[type]) TYPE_TEMPLATE_IDS[type] = [baseTemplateIdForTemplate(template) || firstBaseTemplateId()];
  if (!TYPE_LABELS[type]) TYPE_LABELS[type] = label || type;
}

function firstLaunchType() {
  return templateTypeOptions()[0] || "Game event";
}

function renderLaunchTypeOptions(selectedType = launchType?.value || currentLaunch?.type || firstLaunchType()) {
  if (!launchType) return;
  const selectedIsHidden = launchTypeExists(selectedType) && HIDDEN_CATALOG_LAUNCH_TYPES.has(selectedType);
  const safeSelectedType = launchTypeExists(selectedType) && !HIDDEN_CATALOG_LAUNCH_TYPES.has(selectedType) ? selectedType : firstLaunchType();
  const types = selectedIsHidden ? [selectedType, ...templateTypeOptions()] : templateTypeOptions();
  launchType.innerHTML = types.map((type) => `
    <option value="${escapeHTML(type)}">${escapeHTML(typeLabel(type))}</option>
  `).join("");
  launchType.value = selectedIsHidden ? selectedType : safeSelectedType;
}

function renderLaunchTemplateOptions(selectedId = baseTemplateIdForLaunch(currentLaunch) || baseTemplateIdForType(launchType?.value) || firstBaseTemplateId()) {
  if (!launchTemplate) return;
  const selectedType = launchType?.value || currentLaunch?.type || firstLaunchType();
  const safeSelectedId = baseTemplateExists(selectedId) ? selectedId : firstBaseTemplateId();
  const optionIds = templateIdsForType(selectedType, safeSelectedId);
  launchTemplate.innerHTML = optionIds.map((id) => {
    const template = baseTemplateById(id);
    return `
    <option value="${escapeHTML(id)}">${escapeHTML(templateDisplayName(template))}</option>
  `;
  }).join("");
  launchTemplate.value = safeSelectedId;
}

function syncLaunchTypeOptionLabels() {
  [launchType].forEach((select) => {
    if (!select) return;
    Array.from(select.options || []).forEach((option) => {
      option.textContent = typeLabel(option.value);
    });
  });
}

function syncTemplateDisplayLabels() {
  if (templateName) {
    const template = configTemplate();
    templateName.textContent = `${templateDisplayName(template)}${template.customized ? tr(" · Đã tùy chỉnh", " · Customized") : ""}`;
  }
  [launchTemplate, templateSelector].forEach((select) => {
    if (!select) return;
    Array.from(select.options || []).forEach((option) => {
      option.textContent = templateDisplayName(baseTemplateById(option.value));
    });
  });
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
  templateSelector.innerHTML = BASE_TEMPLATE_OPTIONS.map(({ id, template: itemTemplate }) => {
    return `<option value="${escapeHTML(id)}">${escapeHTML(templateDisplayName(itemTemplate))}</option>`;
  }).join("");
  templateSelector.value = configTemplateId();
  templateSelector.disabled = false;
  templateSelector.title = editable
    ? tr("Chọn template để cấu hình.", "Choose the template to configure.")
    : tr("Bản review public chỉ cho xem cấu hình; vẫn có thể đổi template để đọc bộ luật.", "Public review mode is read-only; you can still switch templates to inspect their rules.");
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
          <span>${escapeHTML(protectedTemplate ? configTerm("defaultTemplate") : configTerm("customTemplate"))}</span>
          <input type="text" value="${escapeHTML(templateDisplayName(template))}" data-template-label="${escapeHTML(template.name)}"${disabledAttr(editable)}>
        </label>
        <button type="button" data-remove-base-template="${escapeHTML(id)}"${removable ? "" : " disabled"}>${configTerm("delete")}</button>
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
          <span>${configTerm("classificationName")}</span>
          <input type="text" value="${escapeHTML(typeLabel(type))}" data-type-label${disabledAttr(editable)}>
        </label>
        <label>
          <span>${configTerm("templateForClassification")}</span>
          <select data-type-template${disabledAttr(editable)}>${baseOptions}</select>
        </label>
        <button type="button" data-add-template-for-type="${escapeHTML(type)}"${editable ? "" : " disabled"} title="${escapeHTML(tr("Thêm template cho phân loại này", "Add template for this classification"))}">+</button>
        <button type="button" data-remove-launch-type="${escapeHTML(type)}"${removable ? "" : " disabled"}>${configTerm("delete")}</button>
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

function templateOperatorScope(item = {}) {
  const scopes = {
    "vinhvnn": {
      vi: "Duyệt cấu hình, chỉnh tiêu chí, khôi phục mẫu chuẩn.",
      en: "Approve config, edit criteria, and restore standard templates."
    },
    "backend-pic": {
      vi: "Chỉnh khung rủi ro, nhóm phản biện, checklist và format output AI.",
      en: "Edit risk rubric, red-team reviewers, checklist, and AI output format."
    },
    "frontend-pic": {
      vi: "Xem cấu hình để làm UI/UX, không đổi luật chấm.",
      en: "View config for UI/UX work without changing scoring rules."
    },
    "launch-reviewer": {
      vi: "Xem template và góp ý trong buổi review.",
      en: "View templates and leave feedback during review."
    }
  };
  const entry = scopes[item.id];
  return entry ? (entry[uiLang()] || entry.vi) : (item.scope || "");
}

function canEditTemplate() {
  return !PUBLIC_LOCK && isLaunchAdmin();
}

function canApproveTemplateSuggestion() {
  return !PUBLIC_LOCK && isLaunchAdmin();
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

  // ISO: YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm.
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

  // Hiển thị: dd/mm/yyyy hoặc dd/mm/yyyy HH:mm.
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

function datePartsToLocalDate(parts) {
  if (!parts) return null;
  const date = new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    parts.hour !== "" ? Number(parts.hour) : 0,
    parts.minute !== "" ? Number(parts.minute) : 0,
    0,
    0
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

function launchDateForRule(value) {
  return datePartsToLocalDate(parseDateOnly(value));
}

function dateInputBoundary(value, endOfDay = false) {
  const parts = parseDateOnly(value);
  if (!parts) return null;
  const date = new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function launchScheduleRange(launch) {
  const start = launchDateForRule(launch?.targetDate || launch?.startDate || launch?.createdAt || launch?.updatedAt);
  const end = launchDateForRule(launch?.endDate || launch?.targetDate || launch?.startDate || launch?.updatedAt || launch?.createdAt);
  const startMs = start ? start.getTime() : null;
  const endMs = end ? end.getTime() : startMs;
  return {
    startMs,
    endMs: endMs !== null && startMs !== null ? Math.max(endMs, startMs) : endMs
  };
}

function launchMatchesDateFilter(launch) {
  const filterStart = dateInputBoundary(launchDateFromFilter, false);
  const filterEnd = dateInputBoundary(launchDateToFilter, true);
  if (filterStart === null && filterEnd === null) return true;

  const range = launchScheduleRange(launch);
  if (range.startMs === null && range.endMs === null) return false;
  const launchStart = range.startMs ?? range.endMs;
  const launchEnd = range.endMs ?? range.startMs;

  if (filterStart !== null && launchEnd < filterStart) return false;
  if (filterEnd !== null && launchStart > filterEnd) return false;
  return true;
}

function inferStatusFromSchedule(launch, now = new Date()) {
  const start = launchDateForRule(launch?.targetDate);
  const end = launchDateForRule(launch?.endDate);
  if (end && end < now) return "completed";
  if (start && start < now) return "running";
  return "upcoming";
}

function validateLaunchScheduleRules(launch, now = new Date()) {
  const status = normalizeStatus(launch?.status);
  const start = launchDateForRule(launch?.targetDate);
  const end = launchDateForRule(launch?.endDate);
  if (start && end && end < start) {
    return {
      ok: false,
      error: "end_before_start",
      message: tr("End Launch không được sớm hơn Start Launch. Hãy sửa lại thời gian trước khi lưu hoặc phân tích.", "End Launch cannot be earlier than Start Launch. Fix the schedule before saving or analyzing.")
    };
  }
  if (end && end < now && (status === "running" || status === "upcoming")) {
    return {
      ok: false,
      error: "end_in_past_status",
      message: tr("End Launch đã ở quá khứ, nên launch không thể để trạng thái Đang chạy hoặc Sắp chạy. Hãy đổi sang Đã chạy hoặc sửa End Launch.", "End Launch is in the past, so the launch cannot be Running or Upcoming. Change it to Completed or update End Launch.")
    };
  }
  if (start && start > now && (status === "running" || status === "completed")) {
    return {
      ok: false,
      error: "start_in_future_not_started",
      message: tr("Start Launch còn ở tương lai, nên launch chưa thể để trạng thái Đang chạy hoặc Đã chạy. Hãy đổi sang Sắp chạy hoặc sửa Start Launch.", "Start Launch is still in the future, so the launch cannot be Running or Completed yet. Change it to Upcoming or update Start Launch.")
    };
  }
  if (start && start < now && status === "upcoming") {
    return {
      ok: false,
      error: "start_in_past_upcoming",
      message: tr("Start Launch đã ở quá khứ, nên launch không thể để trạng thái Sắp chạy. Hãy đổi sang Đang chạy/Đã chạy hoặc sửa Start Launch.", "Start Launch is in the past, so the launch cannot be Upcoming. Change it to Running/Completed or update Start Launch.")
    };
  }
  return { ok: true };
}

function showLaunchScheduleError(validation) {
  if (!validation || validation.ok) return;
  if (analysisSource) analysisSource.textContent = validation.message;
  setAnalysisRunStatus("error", validation.message);
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
  if (result?.source === "llm") return tr("Kết quả từ AI", "AI result");
  if (result?.source === "memory_sample") return tr("Dữ liệu mẫu đã lưu", "Saved sample data");
  if (result?.source === "fallback") return tr("Kết quả dự phòng", "Fallback result");
  return tr("Bản local", "Local build");
}

function colorLabel(color) {
  if (uiLang() === "en") return COLOR_LABELS_EN[color] || color || "N/A";
  return COLOR_LABELS[color] || color || "Chưa có";
}

function personaLabel(persona) {
  const mapped = PERSONA_LABELS[persona];
  if (mapped) return mapped[uiLang()] || mapped.vi || mapped.en || persona;
  return persona || tr("Người phản biện", "Reviewer");
}

function statusValueLabel(status) {
  const normalized = normalizeText(status);
  const labels = uiLang() === "en" ? STATUS_VALUE_LABELS_EN : STATUS_VALUE_LABELS;
  if (normalized.includes("done") || normalized.includes("xong")) return labels.Done;
  if (normalized.includes("doing") || normalized.includes("dang lam")) return labels.Doing;
  if (normalized.includes("block") || normalized.includes("ket")) return labels.Blocked;
  if (normalized.includes("todo") || normalized.includes("can lam")) return labels.Todo;
  return labels[status] || status || labels.Todo;
}

function priorityLabel(priority) {
  const normalized = normalizeText(priority);
  const labels = uiLang() === "en" ? PRIORITY_LABELS_EN : PRIORITY_LABELS;
  if (normalized.includes("high") || normalized.includes("cao") || normalized.includes("red")) return labels.High;
  if (normalized.includes("low") || normalized.includes("thap") || normalized.includes("green")) return labels.Low;
  if (normalized.includes("medium") || normalized.includes("vua") || normalized.includes("yellow")) return labels.Medium;
  return labels[priority] || priority || labels.Medium;
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
  if (score >= maxScore) return tr(`${maxScore}/${maxScore}: Đủ rõ để giao việc và chịu trách nhiệm.`, `${maxScore}/${maxScore}: Clear enough to assign and own.`);
  if (score > 0) return tr(`${score}/${maxScore}: Có nhắc tới, nhưng còn thiếu chi tiết để team làm ngay.`, `${score}/${maxScore}: Mentioned, but missing detail for the team to act on now.`);
  return tr(`0/${maxScore}: Chưa thấy đủ bằng chứng trong brief.`, `0/${maxScore}: Not enough evidence in the brief yet.`);
}

// Phát hiện ngôn ngữ NỘI DUNG của brief hiện tại (cho output lesson/suggestion bám theo brief,
// không bám UI). Mặc định tiếng Việt; chỉ coi là English khi không có dấu tiếng Việt và có đủ
// từ chức năng tiếng Anh (nên "Su kien quay thuong cuoi tuan" không dấu vẫn là VI).
function briefContentIsEnglish(text) {
  const source = text != null ? text : (currentLaunch?.brief || (typeof briefInput !== "undefined" && briefInput ? briefInput.value : "") || "");
  const t = String(source).trim();
  if (!t) return false;
  if (/[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i.test(t)) return false;
  const matches = (t.toLowerCase().match(/\b(the|and|to|for|with|is|are|of|this|that|will|be|on|in|we|our|your|by|from|should|must|when|after|before)\b/g) || []).length;
  const words = t.split(/\s+/).filter(Boolean).length || 1;
  return matches >= 3 && (matches / words) >= 0.04;
}

function riskRequirements(label) {
  const normalizedLabel = normalizeText(riskLabel(label));
  const group = (activeTemplate().riskGroups || []).find((item) => normalizeText(item.label) === normalizedLabel);
  if (group?.requirements?.length) return group.requirements;
  return RISK_REQUIREMENTS[riskKey(label)] || RISK_REQUIREMENTS.scope;
}

function typeLabel(type) {
  if (uiLang() === "en") return TYPE_LABELS_EN[type] || TYPE_LABELS[type] || type || "Uncategorized";
  return TYPE_LABELS[type] || type || "Chưa phân loại";
}

function templateDisplayName(templateOrName) {
  const name = typeof templateOrName === "string" ? templateOrName : templateOrName?.name;
  if (uiLang() === "en") return TEMPLATE_NAME_LABELS_EN[name] || TEMPLATE_NAME_LABELS[name] || name || "Default template";
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
    .replace(/macro trả lời/gi, "mẫu trả lời")
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
    readinessHelpButton.dataset.tooltip = uiLang() === "en"
      ? `Total score 0-${numericMax} from ${riskCount} risk groups in the current classification config. A low score means the brief lacks data for a safe launch.`
      : `Tổng điểm 0-${numericMax} từ ${riskCount} nhóm rủi ro trong cấu hình phân loại hiện tại. Điểm thấp nghĩa là brief còn thiếu dữ liệu để launch an toàn.`;
  }
  scoreDial.style.setProperty("--score-percent", `${percent}%`);
  scoreColor.textContent = colorLabel(safeColor);
  scoreValue.textContent = `${numericScore}/${numericMax}`;
  if (scoreDialValue) scoreDialValue.textContent = `${numericScore}/${numericMax}`;
  const reasonText = friendlyText(reason || (safeColor === "Green"
    ? tr("Có thể launch nếu không có blocker nghiêm trọng.", "Can launch if there is no serious blocker.")
    : safeColor === "Yellow"
      ? tr("Chưa nên launch ngay. Cần sửa các mục thiếu trước.", "Not ready to launch yet. Fix the missing items first.")
      : tr("Dừng launch. Cần làm lại brief hoặc giảm scope.", "Stop the launch. Rework the brief or reduce scope.")));
  scoreReason.innerHTML = renderDecisionReason(reasonText);
  decisionTitle.textContent = friendlyText(title || (safeColor === "Green"
    ? tr("Có thể chuẩn bị launch", "Ready to prepare the launch")
    : safeColor === "Yellow"
      ? tr("Chưa nên launch ngay", "Not ready to launch yet")
      : tr("Dừng launch", "Stop the launch")));
  launchGate.className = `gate-pill ${className}`;
  launchGate.textContent = safeColor === "Green"
    ? tr("Kết luận: Có thể chạy có điều kiện", "Verdict: Can run with conditions")
    : safeColor === "Yellow"
      ? tr("Kết luận: Tạm giữ để sửa", "Verdict: Hold to fix")
      : tr("Kết luận: Dừng launch", "Verdict: Stop the launch");
  analysisSource.textContent = sourceLabel || tr("Bản local", "Local build");
}

function renderDecisionReason(text) {
  const items = splitReadableBullets(text);
  if (!items.length) return escapeHTML(text || "");
  return items
    .map((item) => `<span class="decision-reason-item">${escapeHTML(item)}</span>`)
    .join("");
}

function renderRiskBreakdown(items) {
  if (!items?.length) {
    riskBreakdown.innerHTML = `<div class="empty-state">${tr("Chưa có điểm rủi ro. Bấm Chạy phân tích để tạo.", "No risk score yet. Click Run analysis to generate one.")}</div>`;
    return;
  }

  riskBreakdown.innerHTML = items.map((item) => {
    const score = Number(item.score) || 0;
    const maxScore = Number(item.maxScore) || 2;
    const label = escapeHTML(friendlyText(riskLabel(item.label)));
    const detail = score >= maxScore ? tr("Ổn cho bản tóm tắt launch này.", "Fine for this launch summary.") : escapeHTML(friendlyText(item.missing));
    const requirements = riskRequirements(item.label);

    return `
      <div class="risk-tile ${getRiskClass(score, maxScore)}">
        <strong>${label}</strong>
        <span class="risk-score">${score}/${maxScore}</span>
        <p class="risk-meaning">${escapeHTML(riskScoreMeaning(score, maxScore))}</p>
        <small>${detail}</small>
        <div class="risk-requirements">
          <b>${tr("Muốn đạt 2/2 cần có:", "To reach 2/2 you need:")}</b>
          <ul>
            ${requirements.map((requirement) => `<li>${escapeHTML(requirement)}</li>`).join("")}
          </ul>
        </div>
      </div>
    `;
  }).join("");
}

function renderTopRisks(items, noOpenRisks = false) {
  if (topRisksTitle) {
    topRisksTitle.textContent = noOpenRisks
      ? tr("Không còn rủi ro mở", "No open risks")
      : tr(`${Math.max(1, Math.min(items?.length || 3, 3))} việc cần xử lý trước`, `${Math.max(1, Math.min(items?.length || 3, 3))} pre-launch actions`);
  }
  if (!items?.length) {
    topRisks.innerHTML = noOpenRisks
      ? `<li>${tr("Không còn rủi ro mở trước launch. Nếu sau launch phát sinh vấn đề, ghi ở Kết quả sau launch để lưu bài học cho lần sau.", "No open risks before launch. If issues arise after launch, record them under Post-launch results to save lessons for next time.")}</li>`
      : `<li>${tr("Chưa có rủi ro. Bấm Chạy phân tích để tạo.", "No risks yet. Click Run analysis to generate them.")}</li>`;
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

  renderTopRisks(missing.map((item) => item.missing), color === "Green" && !missing.length);
}

function buildLocalAnalysisResult(text = briefInput.value.trim(), source = "local_fallback") {
  const template = activeTemplate();
  const results = scoreBrief(text, template);
  const total = results.reduce((sum, item) => sum + item.score, 0);
  const maxScore = results.reduce((sum, item) => sum + (Number(item.maxScore) || 2), 0) || 12;
  const color = getColor(total, maxScore);
  const outputEnglish = briefContentIsEnglish(text);
  const missing = results
    .filter((item) => item.score < (Number(item.maxScore) || 2))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
  const title = outputEnglish
    ? (color === "Green" ? "Ready to prepare the launch" : color === "Yellow" ? "Not ready to launch yet" : "Stop the launch")
    : (color === "Green" ? "Có thể chuẩn bị launch" : color === "Yellow" ? "Chưa nên launch ngay" : "Dừng launch");
  const reason = missing.length
    ? (outputEnglish
      ? `Need to add: ${missing.map((item) => item.missing).join("; ")}.`
      : `Cần bổ sung: ${missing.map((item) => friendlyText(item.missing)).join("; ")}.`)
    : (outputEnglish ? "The brief is clear enough for the local demo." : "Brief đủ rõ cho bản demo local.");

  return {
    source,
    decision: {
      color,
      score: total,
      maxScore,
      title,
      reason
    },
    riskBreakdown: results,
    topRisks: missing.map((item) => item.missing),
    redTeam: color === "Green" && !missing.length ? [] : template.redTeam || [],
    checklist: template.checklist || [],
    postmortem: template.postmortem || []
  };
}

function redTeamCardKey(card, index) {
  return `${index}:${normalizeText(card?.persona || `persona-${index}`)}`;
}

function collectRedTeamSupplements() {
  document.querySelectorAll("[data-redteam-brief]").forEach((field) => {
    redTeamBriefSupplements[field.dataset.redteamBrief || ""] = field.value || "";
  });
}

function redTeamFieldLabel(field) {
  if (field === "worry") return tr("LO NGẠI", "CONCERN");
  if (field === "evidence") return tr("DẤU HIỆU", "EVIDENCE");
  if (field === "fix") return tr("CÁCH XỬ LÝ", "FIX");
  return field;
}

function splitReadableBullets(text) {
  const cleaned = friendlyText(text).replace(/\r/g, "\n").trim();
  if (!cleaned) return [];
  const explicit = cleaned
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);
  const source = explicit.length > 1 ? explicit : cleaned.split(/(?<=[.!?])\s+|;\s+/);
  return source
    .map((item) => item.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 6);
}

function sentenceCaseBullet(text) {
  const value = String(text || "").trim();
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char.toLocaleLowerCase("vi-VN") !== char.toLocaleUpperCase("vi-VN")) {
      return `${value.slice(0, index)}${char.toLocaleUpperCase("vi-VN")}${value.slice(index + 1)}`;
    }
  }
  return value;
}

function renderReadableBullets(text) {
  const items = splitReadableBullets(text);
  if (!items.length) return `<p>${escapeHTML(traceNoData())}</p>`;
  return `<ul>${items.map((item) => `<li>${escapeHTML(sentenceCaseBullet(item))}</li>`).join("")}</ul>`;
}

function redTeamBriefPlaceholder(card) {
  const fix = friendlyText(card?.fix).trim();
  const fallback = tr(
    "Bổ sung owner, FAQ, escalation, ngưỡng pause, metric theo dõi hoặc rollback cụ thể cho góc nhìn này.",
    "Add owner, FAQ, escalation, pause threshold, tracking metric, or rollback detail for this perspective."
  );
  return fix ? `${tr("Gợi ý", "Suggestion")}: ${fix}` : fallback;
}

function redTeamSupplementRows() {
  collectRedTeamSupplements();
  return Object.entries(redTeamBriefSupplements)
    .map(([key, value]) => [key, String(value || "").trim()])
    .filter(([, value]) => value);
}

async function reanalyzeWithRedTeamSupplements() {
  const additions = redTeamSupplementRows();
  if (!additions.length) {
    setAnalysisRunStatus("warn", tr(
      "Chưa có brief bổ sung trong Red Card nào để phân tích lại.",
      "No Red Card supplement has been entered yet."
    ));
    return;
  }

  const cards = Array.isArray(lastRagTraceResult?.redTeam) && lastRagTraceResult.redTeam.length
    ? lastRagTraceResult.redTeam
    : activeTemplate().redTeam || [];
  const heading = tr("Bổ sung sau Red Team review:", "Additions after Red Team review:");
  const lines = additions.map(([key, value]) => {
    const index = Math.max(0, Number(String(key).split(":")[0]) || 0);
    const persona = personaLabel(cards[index]?.persona || tr("Góc phản biện", "Perspective"));
    return `- ${persona}: ${value}`;
  });
  const currentBrief = briefInput.value.trimEnd();
  briefInput.value = `${currentBrief}${currentBrief ? "\n\n" : ""}${heading}\n${lines.join("\n")}`;
  setAnalysisRunStatus("running", tr(
    "Đã thêm brief bổ sung. Đang lưu launch và phân tích lại...",
    "Added supplements. Saving the launch and re-running analysis..."
  ));
  redTeamBriefSupplements = {};
  await saveCurrentLaunch({ silent: true });
  await analyze();
}

async function saveLaunchWithRedTeamSupplements() {
  collectRedTeamSupplements();
  await saveCurrentLaunch({ silent: true });
  setAnalysisRunStatus("success", tr(
    "Đã lưu brief bổ sung. Bạn có thể quay lại điền tiếp sau.",
    "Saved the supplements. You can come back and continue later."
  ));
}

function renderRedTeam(cards = activeTemplate().redTeam, options = {}) {
  collectRedTeamSupplements();
  if (options.noOpenRisks) {
    redTeamCards.innerHTML = `<div class="empty-state">${tr("Không còn rủi ro mở trước launch. Sau khi launch chạy xong, nếu có vấn đề mới thì ghi vào Kết quả sau launch để lưu thành bài học cho lần sau.", "No open risks before launch. After the launch runs, if new issues appear, record them under Post-launch results to save lessons for next time.")}</div>`;
    return;
  }
  if (!cards?.length) {
    redTeamCards.innerHTML = `<div class="empty-state">${tr("Chưa có góc nhìn phản biện.", "No red-team perspectives yet.")}</div>`;
    return;
  }

  const cardHtml = cards.map((card, index) => {
    const key = redTeamCardKey(card, index);
    const savedSupplement = redTeamBriefSupplements[key] || "";
    return `
    <article class="red-card">
      <div class="agent-head">
        <div class="agent-avatar">${escapeHTML(getInitials(personaLabel(card.persona)))}</div>
        <h3>${escapeHTML(personaLabel(card.persona))}</h3>
      </div>
      <div class="red-card-sections">
        <section class="red-card-section">
          <h4>${redTeamFieldLabel("worry")}</h4>
          ${renderReadableBullets(card.worry)}
        </section>
        <section class="red-card-section">
          <h4>${redTeamFieldLabel("evidence")}</h4>
          ${renderReadableBullets(card.evidence)}
        </section>
        <section class="red-card-section red-card-fix">
          <h4>${redTeamFieldLabel("fix")}</h4>
          ${renderReadableBullets(card.fix)}
        </section>
      </div>
      <label class="red-card-brief">
        <span>${tr("Brief bổ sung cho góc nhìn này", "Brief supplement for this perspective")}</span>
        <textarea data-redteam-brief="${escapeHTML(key)}" rows="3" placeholder="${escapeHTML(redTeamBriefPlaceholder(card))}">${escapeHTML(savedSupplement)}</textarea>
      </label>
    </article>
  `;
  }).join("");
  redTeamCards.innerHTML = `
    ${cardHtml}
    <div class="red-team-followup">
      <div class="red-team-followup-actions">
        <button type="button" class="primary" data-redteam-reanalyze>${tr("Phân tích lại với brief bổ sung", "Re-run with brief supplements")}</button>
        <button type="button" data-redteam-save>${tr("Lưu launch", "Save launch")}</button>
      </div>
      <p>${tr("Các dòng bổ sung sẽ được thêm vào cuối Nội dung brief trước khi phân tích lại.", "Supplements will be appended to the main brief before re-analysis.")}</p>
    </div>
  `;
}

function checklistItemKey(item, index) {
  const [task, owner, deadline] = Array.isArray(item)
    ? [item[0], item[1], item[2]]
    : [item?.task, item?.owner, item?.deadline];
  const stable = [task, owner, deadline].map((value) => normalizeText(value || "").trim()).join("|");
  return stable || `checklist-${index}`;
}

function collectChecklistProgress() {
  document.querySelectorAll("[data-checklist-done]").forEach((field) => {
    checklistProgress[field.dataset.checklistDone || ""] = Boolean(field.checked);
  });
}

function renderChecklist(items = activeTemplate().checklist) {
  collectChecklistProgress();
  if (!items?.length) {
    checklistRows.innerHTML = `<div class="empty-state">${tr("Chưa có danh sách việc cần làm.", "No to-do list yet.")}</div>`;
    return;
  }

  checklistRows.innerHTML = items.map((item, index) => {
    const [task, owner, deadline, status, priority] = Array.isArray(item)
      ? item
      : [item.task, item.owner, item.deadline, item.status, item.priority];
    const priorityClass = priorityClassName(priority);
    const statusClass = statusClassName(status);
    const itemKey = checklistItemKey(item, index);
    const checked = Boolean(checklistProgress[itemKey]);
    return `
      <article class="timeline-card ${priorityClass}${checked ? " is-done" : ""}">
        <label class="checklist-done">
          <input type="checkbox" data-checklist-done="${escapeHTML(itemKey)}" ${checked ? "checked" : ""}>
          <span>${tr("Đã xong", "Done")}</span>
        </label>
        <div class="timeline-content">
          <span class="timeline-date">${escapeHTML(formatDeadline(deadline))}</span>
          <h4>${escapeHTML(friendlyText(task))}</h4>
          <div class="timeline-meta">
            <span class="meta-chip owner-chip"><em>${tr("Phụ trách", "Owner")}</em><strong>${escapeHTML(ownerLabel(owner))}</strong></span>
            <span class="meta-chip status-chip ${statusClass}"><em>${tr("Trạng thái", "Status")}</em><strong>${escapeHTML(statusValueLabel(status))}</strong></span>
            <span class="pill risk-priority ${priorityClass}"><em>${tr("Mức rủi ro", "Risk level")}</em><strong>${escapeHTML(priorityLabel(priority))}</strong></span>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderPostmortem(blocks) {
  if (Array.isArray(blocks) && blocks.length) {
    const useEnglishBlocks = uiLang() === "en" && activeTemplate().name === "Lucky Spin Event Playbook" && blocks.length === EN_LUCKY_SPIN_POSTMORTEM.length;
    const displayBlocks = useEnglishBlocks ? EN_LUCKY_SPIN_POSTMORTEM : blocks;
    postmortemDraft.innerHTML = displayBlocks.map((block) => `
      <section class="draft-block">
        <h3>${escapeHTML(useEnglishBlocks ? block.title : headingText(block.title))}</h3>
        <ul>
          ${(block.items || []).map((item) => `<li>${escapeHTML(useEnglishBlocks ? item : friendlyText(item))}</li>`).join("")}
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

const TRACE_AGENT_LABELS = {
  readiness: { vi: "Readiness", en: "Readiness" },
  red_team: { vi: "Red Team", en: "Red Team" },
  redteam: { vi: "Red Team", en: "Red Team" },
  checklist: { vi: "Checklist", en: "Checklist" },
  postmortem: { vi: "Post-mortem", en: "Post-mortem" },
  memory: { vi: "Memory", en: "Memory" },
  orchestrator: { vi: "Orchestrator", en: "Orchestrator" }
};

const TRACE_FIELD_LABELS = {
  source: { vi: "Nguồn xử lý", en: "Source" },
  model: { vi: "Model", en: "Model" },
  latencyMs: { vi: "Thời gian", en: "Latency" },
  schemaAccepted: { vi: "JSON hợp lệ", en: "Valid JSON" },
  score: { vi: "Điểm", en: "Score" },
  color: { vi: "Màu readiness", en: "Readiness color" },
  scoreMode: { vi: "Cách chấm điểm", en: "Score mode" },
  cards: { vi: "Số Red Card", en: "Red Cards" },
  tasks: { vi: "Số việc", en: "Tasks" },
  blocks: { vi: "Số block hậu kiểm", en: "Postmortem blocks" },
  recordsRecalled: { vi: "Bài học recall", en: "Records recalled" },
  inputTokens: { vi: "Token vào", en: "Input tokens" },
  outputTokens: { vi: "Token ra", en: "Output tokens" },
  totalTokens: { vi: "Tổng token", en: "Total tokens" },
  fallbackReason: { vi: "Lý do fallback", en: "Fallback reason" },
  runtimeRole: { vi: "Vai trò runtime", en: "Runtime role" },
  runtimeVersion: { vi: "Version runtime", en: "Runtime version" },
  uiCacheVersion: { vi: "Cache UI", en: "UI cache" },
  requestId: { vi: "Request ID", en: "Request ID" },
  storeId: { vi: "Memory store", en: "Memory store" },
  ragSource: { vi: "Nguồn RAG", en: "RAG source" }
};

function localizedMapValue(entry, fallback = "") {
  if (!entry) return fallback;
  if (typeof entry === "string") return entry;
  return entry[uiLang()] || entry.vi || entry.en || fallback;
}

function traceAgentLabel(agent) {
  const key = normalizeText(agent).replace(/\s+/g, "_");
  return localizedMapValue(TRACE_AGENT_LABELS[key], agent || tr("Agent", "Agent"));
}

function traceFieldLabel(key) {
  return localizedMapValue(TRACE_FIELD_LABELS[key], key);
}

function traceNoData() {
  return tr("Không có dữ liệu", "No data");
}

function traceSourceValue(value) {
  const source = String(value || "").toLowerCase();
  if (source === "llm") return tr("LLM", "LLM");
  if (source === "rule") return tr("Luật deterministic", "Deterministic rule");
  if (source === "fallback") return tr("Fallback", "Fallback");
  if (source === "remote_runtime") return tr("Runtime con", "Child runtime");
  if (source === "agentbase") return "AgentBase";
  if (source === "skipped_fast") return tr("Bỏ qua ở fast path", "Skipped in fast path");
  return value ? String(value) : traceNoData();
}

function traceBooleanValue(value) {
  if (value === true) return tr("Có", "Yes");
  if (value === false) return tr("Không", "No");
  return traceNoData();
}

function traceLatencyValue(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms) || ms <= 0) return traceNoData();
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function traceReadableValue(key, value) {
  if (value === undefined || value === null || value === "") return traceNoData();
  if (key === "source" || key === "ragSource") return traceSourceValue(value);
  if (key === "schemaAccepted") return traceBooleanValue(value);
  if (key === "latencyMs") return traceLatencyValue(value);
  if (key === "color") return colorLabel(value);
  if (key === "ragSources" && typeof value === "object") {
    return value.storeId || value.source || JSON.stringify(value);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function traceDetailEntries(step) {
  const orderedKeys = [
    "source",
    "model",
    "latencyMs",
    "schemaAccepted",
    "score",
    "color",
    "scoreMode",
    "cards",
    "tasks",
    "blocks",
    "recordsRecalled",
    "inputTokens",
    "outputTokens",
    "totalTokens",
    "fallbackReason",
    "runtimeRole",
    "runtimeVersion",
    "uiCacheVersion",
    "requestId",
    "ragSources"
  ];
  const skip = new Set(["agent", "status", "llm"]);
  const entries = [];
  orderedKeys.forEach((key) => {
    if (key in step || key === "inputTokens" || key === "outputTokens" || key === "totalTokens") {
      const label = key === "ragSources" ? traceFieldLabel("storeId") : traceFieldLabel(key);
      entries.push([label, traceReadableValue(key, step[key])]);
    }
  });
  Object.entries(step).forEach(([key, value]) => {
    if (skip.has(key) || orderedKeys.includes(key)) return;
    entries.push([traceFieldLabel(key), traceReadableValue(key, value)]);
  });
  return entries;
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
    const normalizedStep = model && !step.model ? { ...step, model } : step;
    const detail = traceDetailEntries(normalizedStep)
      .map(([label, value]) => `
        <span class="trace-detail-chip">
          <em>${escapeHTML(label)}</em>
          <strong>${escapeHTML(value)}</strong>
        </span>`)
      .join("");
    return `
      <div class="trace-step">
        <span class="trace-step-no">${String(index + 1).padStart(2, "0")}</span>
        <span class="trace-dot ${ok ? "ok" : "error"}"></span>
        <div class="trace-step-main">
          <b>${escapeHTML(traceAgentLabel(agent))}</b>
          <div class="trace-step-details">${detail}</div>
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
    renderEmptyAnalysis(tr("Chưa có brief để phân tích.", "No brief to analyze yet."));
    return;
  }
  renderApiAnalysis(buildLocalAnalysisResult(briefText), sourceLabel);
}

function renderApiAnalysis(result, sourceOverride) {
  result = sanitizeAnalysisResult(result);
  const decision = result?.decision || {};
  const color = decision.color || "Yellow";
  const score = Number(decision.score) || 0;
  const maxScore = Number(decision.maxScore) || 12;
  const noOpenRisks = isFullGreenAnalysis(result);

  renderDecision({
    color,
    score,
    maxScore,
    title: decision.title,
    reason: decision.reason,
    sourceLabel: sourceLabelFor(result, sourceOverride)
  });
  renderRiskBreakdown(result.riskBreakdown || []);
  renderTopRisks(result.topRisks || [], noOpenRisks);
  renderRedTeam(result.redTeam || [], { noOpenRisks });
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
    title: tr("Chưa có phân tích", "No analysis yet"),
    reason,
    sourceLabel: tr("Đang chờ brief", "Waiting for a brief")
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
  launch = sanitizeLaunchData(launch);
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
  const cleanLaunch = sanitizeLaunchData(launchOrSummary);
  const summary = cleanLaunch.analyses ? summarizeClientLaunch(cleanLaunch) : cleanLaunch;
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
  if (!launchMatchesDateFilter(launch)) return false;
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
  if (launchDateFromInput) launchDateFromInput.value = launchDateFromFilter;
  if (launchDateToInput) launchDateToInput.value = launchDateToFilter;

  const visibleStatuses = launchStatusFilter === "all"
    ? STATUS_ORDER
    : STATUS_ORDER.filter((status) => status === launchStatusFilter);
  const isFiltering = Boolean(launchSearchQuery.trim()) || launchStatusFilter !== "all" || Boolean(launchDateFromFilter) || Boolean(launchDateToFilter);

  // Card nháp cho launch mới chưa lưu (Pro mode) — Friendly có hệ draft riêng nên bỏ qua.
  const proDraft = (!document.body.classList.contains("ui-mode-friendly") && draftMode && currentLaunch && !currentLaunch.id)
    ? {
        status: normalizeStatus(currentLaunch.status),
        name: currentLaunch.name || "Launch mới",
        type: currentLaunch.type || "Game event",
        owner: currentLaunch.owner || "",
        targetDate: currentLaunch.targetDate || "",
        endDate: currentLaunch.endDate || ""
      }
    : null;

  launchGroups.innerHTML = visibleStatuses.map((status) => {
    const items = launches.filter((launch) => normalizeStatus(launch.status) === status && launchMatchesBoardFilter(launch));
    const draftCardHtml = (proDraft && proDraft.status === status && (!isFiltering || launchMatchesBoardFilter({ name: proDraft.name, type: proDraft.type, owner: proDraft.owner, status })))
      ? `
          <button class="launch-card active readiness-unknown pro-session-draft" type="button" data-launch-id="" aria-label="${tr("Launch mới chưa lưu", "New unsaved launch")}" title="${tr("Chưa lưu trong phiên này", "Not saved in this session")}">
            <span class="launch-card-badge readiness-unknown">${tr("Chưa lưu", "Not saved")}</span>
            <strong>${escapeHTML(proDraft.name)}</strong>
            <small class="launch-card-meta-line">${escapeHTML(typeLabel(proDraft.type))} · ${tr("Nháp", "Draft")}</small>
            <small class="launch-card-owner-line">${escapeHTML(proDraft.owner ? ownerLabel(proDraft.owner) : tr("Chưa có owner", "No owner yet"))} · ${tr("Chưa lưu", "Not saved")}</small>
            <span class="launch-card-history empty">
              <span>${tr("Lịch sử đã lưu", "Saved history")}</span>
              <strong>0 ${tr("phân tích", "analyses")} · 0 ${tr("bài học", "lessons")}</strong>
              <small>${tr("Chưa lưu", "Not saved")}</small>
            </span>
          </button>
        `
      : "";
    const itemCards = items.length
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
        const badgeLabel = launch.decision
          ? `${colorLabel(launch.decision.color || "Yellow")} ${launch.decision.score ?? 0}/${launch.decision.maxScore || templateMax(defaultTemplateForType(launch.type || "Game event"))}`
          : tr("Chưa chấm", "Not scored");
        return `
          <button class="launch-card ${isActive ? "active" : ""} readiness-${escapeHTML(readinessClass)}" type="button" data-launch-id="${escapeHTML(launch.id)}" aria-label="Mở chi tiết ${escapeHTML(launchNameText)}. ${escapeHTML(readinessLabel)}" title="${escapeHTML(readinessLabel)}">
            <span class="launch-card-badge readiness-${escapeHTML(readinessClass)}">${escapeHTML(badgeLabel)}</span>
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
      : "";
    const cards = (draftCardHtml || itemCards)
      ? `${draftCardHtml}${itemCards}`
      : `<div class="empty-state">${isFiltering ? "Không có launch phù hợp." : STATUS_HINTS[status]}</div>`;
    const groupCount = items.length + (draftCardHtml ? 1 : 0);

    return `
      <section class="launch-group">
        <h3>${statusDisplayLabel(status)} <span class="launch-count">${groupCount}</span></h3>
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
  renderLaunchTemplateOptions(baseTemplateIdForLaunch(launch));
  launchStatus.value = normalizeStatus(launch?.status);
  launchOwner.value = launch?.owner || "";
  setVisibleDateValue(launchTargetDate, launchTargetDateNative, launch?.targetDate);
  setVisibleDateValue(launchEndDate, launchEndDateNative, launch?.endDate);
  briefInput.value = launch?.brief || "";
  briefInput.scrollTop = 0;
  if (launch && !launch.template) launch.template = defaultTemplateForType(launch.type || "Game event");
}

function collectLaunchFromForm() {
  collectRedTeamSupplements();
  collectChecklistProgress();
  const selectedType = launchType.value;
  const selectedTemplate = launchTemplate?.value ? baseTemplateById(launchTemplate.value) : defaultTemplateForType(selectedType);
  return {
    id: currentLaunch?.id,
    name: launchName.value.trim() || "Launch mới",
    type: selectedType,
    status: normalizeStatus(launchStatus.value),
    owner: launchOwner.value.trim(),
    targetDate: normalizeDateForStorage(launchTargetDate.value),
    endDate: normalizeDateForStorage(launchEndDate.value),
    brief: briefInput.value.trim(),
    template: normalizeTemplate(selectedTemplate, selectedType),
    templateVersions: currentLaunch?.templateVersions || [],
    lessonSuggestions: currentLaunch?.lessonSuggestions || [],
    redTeamBriefSupplements: stringMap(redTeamBriefSupplements),
    checklistProgress: booleanMap(checklistProgress)
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
  detailTitle.textContent = launch?.name || tr("Launch mới", "New launch");
  detailSub.innerHTML = `
    <span class="meta-chip status">${escapeHTML(statusDisplayLabel(normalizeStatus(launch?.status)))}</span>
    <span class="meta-chip">${escapeHTML(typeLabel(launch?.type))}</span>
    <span class="meta-chip">${escapeHTML(launch?.owner || tr("Chưa có người phụ trách", "No owner yet"))}</span>
  `;

  launchSnapshot.innerHTML = `
    <div class="snapshot-item">
      <span>${tr("Trạng thái", "Status")}</span>
      <strong>${escapeHTML(STATUS_LABELS[normalizeStatus(launch?.status)])}</strong>
      <small>${escapeHTML(STATUS_HINTS[normalizeStatus(launch?.status)])}</small>
    </div>
    <div class="snapshot-item">
      <span>${tr("Kết luận mới nhất", "Latest verdict")}</span>
      <strong>${escapeHTML(latest ? `${colorLabel(latest.color)} ${latest.score}/${latest.maxScore || 12}` : tr("Chưa có", "None yet"))}</strong>
      <small>${analyses.length ? `${tr("Cập nhật", "Updated")}: ${escapeHTML(formatDate(analyses[analyses.length - 1].createdAt))}` : tr("Bấm Chạy phân tích để lưu kết quả đầu tiên.", "Click Run analysis to save the first result.")}</small>
    </div>
    <div class="snapshot-item">
      <span>${tr("Người phụ trách", "Owner")}</span>
      <strong>${escapeHTML(launch?.owner || tr("Chưa có", "None yet"))}</strong>
      <small>${tr("Người hoặc team chịu trách nhiệm chính.", "The person or team mainly responsible.")}</small>
    </div>
    <div class="snapshot-item">
      <span>Start Launch</span>
      <strong>${escapeHTML(formatDateOnly(launch?.targetDate, tr("Chưa có", "None yet")))}</strong>
      <small>${tr("Ngày bắt đầu chạy launch.", "The launch start date.")}</small>
    </div>
    <div class="snapshot-item">
      <span>End Launch</span>
      <strong>${escapeHTML(formatDateOnly(launch?.endDate, tr("Chưa có", "None yet")))}</strong>
      <small>${tr("Ngày kết thúc hoặc ngày cần tổng kết.", "The end or wrap-up date.")}</small>
    </div>
  `;
}

function renderBriefGuide() {
  const template = activeTemplate();
  const enGuide = uiLang() === "en" ? englishBriefGuideForTemplate(template) : null;
  if (briefGuideDescription) {
    briefGuideDescription.textContent = enGuide?.description || template.description || tr(
      "Viết như một bản mô tả launch thật. Không cần văn hay, nhưng cần đủ dữ liệu để Agent chấm rủi ro.",
      "Write this like a real launch brief. It does not need polished prose, but it needs enough data for the Agent to score risk."
    );
  }
  if (briefGuideItems) {
    briefGuideItems.innerHTML = (enGuide?.items || template.briefGuide || DEFAULT_BRIEF_GUIDE)
      .map((item) => `<li>${escapeHTML(item)}</li>`)
      .join("");
  }
}
window.renderBriefGuide = renderBriefGuide;

function renderTemplateOperatorOptions() {
  if (!templateOperator) return;
  if (!isLaunchAdmin()) templateOperatorId = "launch-reviewer";
  else if (templateOperatorId === "launch-reviewer") templateOperatorId = "vinhvnn";
  templateOperator.innerHTML = TEMPLATE_OPERATORS.map((item) => `
    <option value="${escapeHTML(item.id)}" ${item.id === templateOperatorId ? "selected" : ""}>
      ${escapeHTML(item.name)} - ${escapeHTML(item.access)}
    </option>
  `).join("");
  templateOperator.disabled = true;
}

function renderTemplatePermissionState() {
  if (!templatePermissionState) return;
  const operator = activeTemplateOperator();
  const allowed = canEditTemplate();
  const stateClass = allowed ? "allowed" : "readonly";
  const title = allowed ? tr("Full quyền chỉnh cấu hình", "Full config access") : tr("Chỉ xem cấu hình", "Read-only config");
  const detail = allowed
    ? tr("Admin nội bộ có thể sửa, lưu, khôi phục và duyệt đề xuất template.", "Internal admin can edit, save, restore, and approve template proposals.")
    : tr("Muốn mở quyền Admin nội bộ, dùng tham số ?role=admin. Bản review public vẫn khóa mọi mutation.", "Internal admin access uses ?role=admin. Public review mode still blocks mutations.");

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
        <small>${escapeHTML(item.role)} · ${escapeHTML(templateOperatorScope(item))}</small>
      </div>
      <span>${escapeHTML(item.access)}</span>
    </article>
  `).join("");
}

function renderEditorActions(type, editable) {
  return `
    <button type="button" class="danger-button" data-template-remove="${escapeHTML(type)}"${disabledAttr(editable)}>${configTerm("delete")}</button>
  `;
}

function renderRiskGroupCard(group = {}, index = 0, editable = true) {
  return `
    <article class="template-editor-card" data-template-item="risk">
      <div class="editor-card-head">
        <div>
          <span class="config-index" data-index-label>R${index + 1}</span>
          <strong>${escapeHTML(group.label || configTerm("newRiskGroup"))}</strong>
        </div>
        ${renderEditorActions("risk", editable)}
      </div>
      <div class="editor-grid risk-editor-grid">
        <label class="field">
          <span>${configTerm("groupName")}</span>
          <input data-field="label" type="text" value="${escapeHTML(group.label || "")}"${disabledAttr(editable)}>
        </label>
        <label class="field score-input">
          <span>${configTerm("maxScore")} <button class="help-button inline" type="button" aria-label="${configTerm("maxScoreHelpLabel")}" data-tooltip="${configTerm("maxScoreTooltip")}">?</button></span>
          <input data-field="maxScore" type="number" min="1" max="5" value="${escapeHTML(group.maxScore || 2)}"${disabledAttr(editable)}>
        </label>
        <label class="field wide">
          <span>${configTerm("requirements")} <button class="help-button inline" type="button" aria-label="${configTerm("requirementsHelpLabel")}" data-tooltip="${configTerm("requirementsTooltip")}">?</button></span>
          <textarea data-field="requirements" spellcheck="false"${disabledAttr(editable)}>${escapeHTML((group.requirements || []).join("\n"))}</textarea>
        </label>
        <label class="field wide">
          <span>${configTerm("localKeywords")} <button class="help-button inline" type="button" aria-label="${configTerm("localKeywordsHelpLabel")}" data-tooltip="${configTerm("localKeywordsTooltip")}">?</button></span>
          <textarea data-field="checks" spellcheck="false"${disabledAttr(editable)}>${escapeHTML((group.checks || []).join(", "))}</textarea>
        </label>
        <label class="field wide">
          <span>${configTerm("missingMessage")} <button class="help-button inline" type="button" aria-label="${configTerm("missingMessageHelpLabel")}" data-tooltip="${configTerm("missingMessageTooltip")}">?</button></span>
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
          <strong>${escapeHTML(displayPersona || configTerm("newPersona"))}</strong>
        </div>
        ${renderEditorActions("persona", editable)}
      </div>
      <div class="editor-grid">
        <label class="field">
          <span>${configTerm("personaRole")}</span>
          <input data-field="persona" type="text" value="${escapeHTML(displayPersona || "")}"${disabledAttr(editable)}>
        </label>
        <label class="field">
          <span>${configTerm("mainConcern")}</span>
          <textarea data-field="worry" spellcheck="false"${disabledAttr(editable)}>${escapeHTML(item.worry || "")}</textarea>
        </label>
        <label class="field">
          <span>${configTerm("evidenceToFind")}</span>
          <textarea data-field="evidence" spellcheck="false"${disabledAttr(editable)}>${escapeHTML(item.evidence || "")}</textarea>
        </label>
        <label class="field">
          <span>${configTerm("fix")}</span>
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
          <span>${configTerm("task")}</span>
          <input data-field="task" type="text" value="${escapeHTML(item.task || "")}"${disabledAttr(editable)}>
        </label>
      </div>
      <div class="checklist-meta-line">
        <label class="field">
          <span>${tr("Phụ trách", "Owner")}</span>
          <input data-field="owner" type="text" value="${escapeHTML(item.owner || "")}"${disabledAttr(editable)}>
        </label>
        <label class="field">
          <span>Deadline</span>
          <input data-field="deadline" type="text" value="${escapeHTML(item.deadline || tr("T-1 ngày", "T-1 day"))}"${disabledAttr(editable)}>
        </label>
        <label class="field">
          <span>${tr("Trạng thái", "Status")}</span>
          <select data-field="status"${disabledAttr(editable)}>
            ${Object.keys(STATUS_VALUE_LABELS).map((value) => optionHTML(value, statusValueLabel(value), status)).join("")}
          </select>
        </label>
        <label class="field">
          <span>${tr("Mức rủi ro", "Risk level")}</span>
          <select data-field="priority"${disabledAttr(editable)}>
            ${Object.keys(PRIORITY_LABELS).map((value) => optionHTML(value, priorityLabel(value), priority)).join("")}
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
          <strong>${escapeHTML(block.title || tr("Block bài học mới", "New lesson block"))}</strong>
        </div>
        ${renderEditorActions("lesson", editable)}
      </div>
      <div class="editor-grid">
        <label class="field">
          <span>${tr("Tiêu đề block", "Block title")}</span>
          <input data-field="title" type="text" value="${escapeHTML(block.title || "")}"${disabledAttr(editable)}>
        </label>
        <label class="field">
          <span>${tr("Câu hỏi, mỗi dòng một câu", "Questions, one per line")}</span>
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
      requirements: [tr("Tiêu chí cần có", "Required criterion")],
      checks: ["tu khoa"],
      missing: tr("Chưa đủ thông tin cho nhóm rủi ro này.", "Not enough information for this risk group.")
    };
  }
  if (type === "persona") {
    return {
      persona: `${configTerm("newPersona")} ${next}`,
      worry: tr("Điểm đáng lo nhất là gì?", "What is the biggest concern?"),
      evidence: tr("Dấu hiệu nào trong brief cho thấy rủi ro này?", "Which signal in the brief points to this risk?"),
      fix: tr("Team cần làm gì để giảm rủi ro?", "What should the team do to reduce the risk?")
    };
  }
  if (type === "checklist") {
    return {
      task: `${configTerm("task")} ${next}`,
      owner: "Launch Owner",
      deadline: tr("T-1 ngày", "T-1 day"),
      status: "Todo",
      priority: "Medium"
    };
  }
  return {
    title: `Block bài học mới ${next}`,
    items: [tr("Câu hỏi cần trả lời sau launch", "Question to answer after launch")]
  };
}

function addTemplateEditorItem(type) {
  if (!canEditTemplate()) {
    analysisSource.textContent = tr("Bạn có full quyền chỉnh cấu hình trong bản demo này.", "You have full config access in this demo.");
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
    analysisSource.textContent = tr("Bạn có full quyền chỉnh cấu hình trong bản demo này.", "You have full config access in this demo.");
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
  renderArchive();

  templateName.dataset.baseName = template.name;
  templateName.textContent = `${templateDisplayName(template)}${template.customized ? tr(" · Đã tùy chỉnh", " · Customized") : ""}`;
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
  activateConfigPanel(document.querySelector("[data-config-tab].active")?.dataset.configTab || "catalog");
}

function renderHistory() {
  const analyses = currentLaunch?.analyses || [];
  if (!analyses.length) {
    analysisHistory.innerHTML = `<div class="empty-state">${tr("Launch này chưa có lịch sử. Bấm Chạy phân tích để tạo bản ghi đầu tiên.", "This launch has no history yet. Click Run analysis to create the first record.")}</div>`;
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
        <button type="button" data-analysis-id="${escapeHTML(analysis.id)}">${tr("Mở lại", "Reopen")}</button>
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

## 9. Run log
${runLogPlainText()}
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
    analysisSource.textContent = tr("Đã export report và copy Markdown vào clipboard", "Report exported and Markdown copied to clipboard");
  } catch {
    analysisSource.textContent = tr("Đã export report Markdown", "Markdown report exported");
  }
}

function ensureTemplateVersionHistory() {
  const templateId = configTemplateId();
  templateConfigVersions[templateId] = templateConfigVersions[templateId] || [];
  if (templateConfigVersions[templateId].length) return;
  const template = configTemplate();
  templateConfigVersions[templateId].push({
    id: `template-version-${Date.now()}`,
    version: 1,
    createdAt: new Date().toISOString(),
    author: "System",
    note: uiLang() === "en" ? `Base template for ${templateDisplayName(template)}` : `Template gốc cho ${templateDisplayName(template)}`,
    summary: uiLang() === "en"
      ? `${(template.riskGroups || []).length} risk groups · ${(template.redTeam || []).length} red-team perspectives · ${templateMax(template)} pts`
      : `${(template.riskGroups || []).length} nhóm rủi ro · ${(template.redTeam || []).length} góc phản biện · ${templateMax(template)} điểm`,
    template: cloneData(template)
  });
}

function addTemplateVersion(note, source = "manual") {
  const templateId = configTemplateId();
  ensureTemplateVersionHistory();
  const template = configTemplate();
  templateConfigVersions[templateId].push({
    id: `template-version-${Date.now()}`,
    version: templateConfigVersions[templateId].length + 1,
    createdAt: new Date().toISOString(),
    author: activeTemplateOperator().name,
    note,
    source,
    summary: uiLang() === "en"
      ? `${(template.riskGroups || []).length} risk groups · ${(template.redTeam || []).length} red-team perspectives · ${templateMax(template)} pts`
      : `${(template.riskGroups || []).length} nhóm rủi ro · ${(template.redTeam || []).length} góc phản biện · ${templateMax(template)} điểm`,
    template: cloneData(template)
  });
}

function renderTemplateVersionHistory() {
  if (!templateVersionHistory) return;
  ensureTemplateVersionHistory();
  const versions = templateConfigVersions[configTemplateId()] || [];
  templateVersionHistory.innerHTML = versions.length
    ? versions.slice().reverse().map((item) => `
      <article class="version-row">
        <div>
          <strong>v${escapeHTML(item.version)} · ${escapeHTML(item.note || tr("Snapshot template", "Template snapshot"))}</strong>
          <small>${escapeHTML(item.summary || "")}</small>
        </div>
        <span>${escapeHTML(item.author || "Admin")} · ${escapeHTML(formatDate(item.createdAt))}</span>
      </article>
    `).join("")
    : `<div class="empty-state">${tr("Chưa có version template.", "No template versions yet.")}</div>`;
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

function isControlledLearningProposal(item) {
  return Boolean(item && item.kind === "controlled_self_learning" && item.delta);
}

function controlledLearningProposals() {
  return (currentLaunch?.lessonSuggestions || []).filter(isControlledLearningProposal);
}

function hasPendingControlledLearningProposal() {
  return controlledLearningProposals().some((item) => (item.status || "proposed") === "proposed");
}

function currentTemplateForDiff() {
  return currentLaunch?.template || activeTemplate();
}

function templateRiskGroups(template = currentTemplateForDiff()) {
  return Array.isArray(template?.riskGroups) ? template.riskGroups : [];
}

function templatePersonas(template = currentTemplateForDiff()) {
  if (Array.isArray(template?.redTeamPersonas)) return template.redTeamPersonas;
  if (Array.isArray(template?.redTeam)) return template.redTeam.map((item) => item.persona || item.name || item).filter(Boolean);
  return [];
}

function proposalDelta(item) {
  const delta = item?.delta && typeof item.delta === "object" ? item.delta : {};
  return {
    addRiskGroups: Array.isArray(delta.addRiskGroups) ? delta.addRiskGroups : [],
    addPersonas: Array.isArray(delta.addPersonas) ? delta.addPersonas : [],
    rationale: delta.rationale || item?.reason || ""
  };
}

function proposalPersonaLabel(persona) {
  if (persona && typeof persona === "object") {
    return persona.persona || persona.name || persona.role || JSON.stringify(persona);
  }
  const raw = String(persona || "").trim();
  const match = raw.match(/['"]persona['"]\s*:\s*['"]([^'"]+)/i);
  return (match?.[1] || raw || tr("Persona mới", "New persona")).slice(0, 120);
}

function proposalStatusLabel(status) {
  if (status === "approved") return tr("Đã duyệt", "Approved");
  if (status === "rejected") return tr("Đã từ chối", "Rejected");
  if (status === "proposed") return tr("Chờ duyệt", "Pending approval");
  return tr("Đề xuất", "Proposal");
}

function proposalSourceText() {
  const postResult = document.getElementById("postResultInput")?.value.trim() || currentLaunch?.postLaunchResult || "";
  const lessonInput = document.getElementById("lessonInput")?.value.trim() || "";
  const savedLessons = (currentLaunch?.lessonsLearned || []).map((item) => item.text || item.lesson || "").filter(Boolean).join("\n");
  return [postResult, lessonInput, savedLessons].filter(Boolean).join("\n\n").trim();
}

function proposalDiffHtml(item) {
  const delta = proposalDelta(item);
  const currentMax = templateRiskGroups().reduce((sum, group) => sum + (Number(group.maxScore) || 2), 0);
  const addedMax = delta.addRiskGroups.reduce((sum, group) => sum + (Number(group.maxScore) || 0), 0);
  const riskRows = delta.addRiskGroups.length
    ? delta.addRiskGroups.map((group) => `
      <li><b>+ ${escapeHTML(group.label || tr("Nhóm rủi ro", "Risk group"))}</b><span>${escapeHTML(group.maxScore || 2)} pts</span></li>
    `).join("")
    : `<li><b>${tr("Không thêm nhóm rủi ro", "No risk group added")}</b><span>0 pts</span></li>`;
  const personaRows = delta.addPersonas.length
    ? delta.addPersonas.map((persona) => `<li><b>+ ${escapeHTML(proposalPersonaLabel(persona))}</b><span>${tr("Red Team", "Red Team")}</span></li>`).join("")
    : `<li><b>${tr("Không thêm persona", "No persona added")}</b><span>${tr("Giữ nguyên", "No change")}</span></li>`;
  return `
    <div class="proposal-diff" aria-label="${tr("Diff đề xuất template", "Template proposal diff")}">
      <div class="proposal-score-diff">
        <span>${tr("Điểm tối đa", "Max score")}</span>
        <strong>${currentMax} -> ${currentMax + addedMax}</strong>
      </div>
      <div class="proposal-diff-grid">
        <div>
          <span class="proposal-diff-label">${tr("Rubric thêm", "Rubric additions")}</span>
          <ul>${riskRows}</ul>
        </div>
        <div>
          <span class="proposal-diff-label">${tr("Persona thêm", "Persona additions")}</span>
          <ul>${personaRows}</ul>
        </div>
      </div>
    </div>
  `;
}

function renderControlledProposalCard(item) {
  const status = item.status || "proposed";
  const pending = status === "proposed";
  const disabled = Boolean(controlledLearningBusy) || !backendAvailable || !canApproveTemplateSuggestion();
  const delta = proposalDelta(item);
  const rationale = briefContentIsEnglish()
    ? (delta.rationale || "Review this proposed template update before approving.")
    : friendlyText(delta.rationale || "Kiểm tra kỹ đề xuất trước khi duyệt vào template.");
  return `
    <article class="suggestion-item controlled-proposal status-${escapeHTML(status)}">
      <div class="proposal-head">
        <div>
          <span class="section-kicker">${escapeHTML(proposalStatusLabel(status))}</span>
          <h4>${tr("Đề xuất tự học có kiểm soát", "Controlled self-learning proposal")}</h4>
          <p>${escapeHTML(rationale)}</p>
        </div>
        <span class="proposal-status">${escapeHTML(proposalStatusLabel(status))}</span>
      </div>
      ${proposalDiffHtml(item)}
      <div class="proposal-meta">
        <span>${tr("Nguồn", "Source")}: ${escapeHTML(item.source || "deterministic")}</span>
        <span>${tr("Tạo lúc", "Created")}: ${escapeHTML(formatDate(item.createdAt))}</span>
      </div>
      <div class="suggestion-actions">
        <button type="button" data-proposal-approve="${escapeHTML(item.id)}" ${!pending || disabled ? "disabled" : ""}>${controlledLearningBusy === `approve:${item.id}` ? tr("Đang duyệt...", "Approving...") : tr("Duyệt vào template", "Approve into template")}</button>
        <button type="button" data-proposal-reject="${escapeHTML(item.id)}" ${!pending || disabled ? "disabled" : ""}>${controlledLearningBusy === `reject:${item.id}` ? tr("Đang từ chối...", "Rejecting...") : tr("Từ chối", "Reject")}</button>
      </div>
    </article>
  `;
}

function controlledLearningSnapshot() {
  const hasPending = hasPendingControlledLearningProposal();
  return {
    launchId: currentLaunch?.id || "",
    proposals: controlledLearningProposals().map((item) => ({
      id: item.id,
      status: item.status || "proposed",
      source: item.source || "deterministic",
      delta: proposalDelta(item),
      createdAt: item.createdAt || ""
    })),
    canCreate: Boolean(currentLaunch?.id && !draftMode && proposalSourceText() && !hasPending),
    busy: controlledLearningBusy,
    hasPending
  };
}

function notifyControlledLearningChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("launchops:controlled-learning", { detail: controlledLearningSnapshot() }));
}

async function createControlledLearningProposal() {
  if (!currentLaunch) return;
  if (!currentLaunch.id || draftMode) await saveCurrentLaunch({ silent: true });
  if (hasPendingControlledLearningProposal()) {
    analysisSource.textContent = tr("Đang có proposal chờ duyệt. Hãy duyệt hoặc từ chối proposal hiện tại trước khi tạo bản mới.", "There is already a pending proposal. Approve or reject it before creating a new one.");
    renderLessonSuggestions();
    return;
  }
  const sourceText = proposalSourceText();
  if (!sourceText) {
    analysisSource.textContent = tr("Cần có kết quả sau launch hoặc bài học trước khi tạo đề xuất.", "Add post-launch results or a lesson before creating a proposal.");
    return;
  }
  if (!backendAvailable) {
    analysisSource.textContent = tr("Backend chưa sẵn sàng nên chưa tạo proposal được.", "Backend is not ready, so the proposal cannot be created yet.");
    return;
  }
  controlledLearningBusy = "create";
  renderLessonSuggestions();
  try {
    const payload = await callLaunchOpsTool("lcc_propose_template_update", {
      launchId: currentLaunch.id,
      lesson: sourceText
    });
    currentLaunch = sanitizeLaunchData(payload.launch || currentLaunch);
    upsertLaunchSummary(payload.summary || currentLaunch);
    setFormFromLaunch(currentLaunch);
    renderLaunchWorkspace();
    analysisSource.textContent = tr("Đã tạo proposal tự học. Hãy xem diff rồi duyệt hoặc từ chối.", "Created the learning proposal. Review the diff, then approve or reject it.");
  } catch (error) {
    console.warn("Create controlled learning proposal failed.", error);
    analysisSource.textContent = tr("Tạo proposal chưa thành công.", "Proposal creation failed.");
  } finally {
    controlledLearningBusy = "";
    renderLessonSuggestions();
  }
}

async function reviewControlledLearningProposal(id, approve = true) {
  if (!currentLaunch?.id || !id || !backendAvailable) return;
  controlledLearningBusy = `${approve ? "approve" : "reject"}:${id}`;
  renderLessonSuggestions();
  try {
    const payload = await callLaunchOpsTool("lcc_approve_template_version", {
      launchId: currentLaunch.id,
      proposalId: id,
      approve,
      reviewer: activeTemplateOperator().name
    });
    currentLaunch = sanitizeLaunchData(payload.launch || currentLaunch);
    upsertLaunchSummary(payload.summary || currentLaunch);
    setFormFromLaunch(currentLaunch);
    renderLaunchWorkspace();
    analysisSource.textContent = approve
      ? tr("Đã duyệt proposal và cập nhật template cho launch này.", "Approved the proposal and updated this launch template.")
      : tr("Đã từ chối proposal. Template giữ nguyên.", "Rejected the proposal. Template stayed unchanged.");
  } catch (error) {
    console.warn("Review controlled learning proposal failed.", error);
    analysisSource.textContent = tr("Duyệt/từ chối proposal chưa thành công.", "Proposal review failed.");
  } finally {
    controlledLearningBusy = "";
    renderLessonSuggestions();
  }
}

window.launchopsControlledLearning = {
  snapshot: controlledLearningSnapshot,
  create: createControlledLearningProposal,
  approve: (id) => reviewControlledLearningProposal(id, true),
  reject: (id) => reviewControlledLearningProposal(id, false)
};

function renderLessonSuggestions() {
  if (!lessonSuggestions) return;
  ensureLessonSuggestions();
  const suggestions = (currentLaunch?.lessonSuggestions || []).filter((item) => item.status !== "dismissed");
  const hasPendingProposal = hasPendingControlledLearningProposal();
  const canCreateProposal = Boolean(currentLaunch?.id && !draftMode && proposalSourceText() && !hasPendingProposal);
  const createHint = hasPendingProposal
    ? tr("Đang có proposal chờ duyệt. Hãy duyệt hoặc từ chối trước khi tạo bản mới.", "A proposal is pending. Approve or reject it before creating a new one.")
    : tr("AI chỉ đề xuất. Rubric/persona chỉ đổi sau khi bạn duyệt proposal.", "AI only proposes. Rubric/persona changes only after you approve a proposal.");
  const permissionNote = `
    <div class="suggestion-note">
      <span>${createHint}</span>
      <button type="button" data-proposal-create ${!canCreateProposal || controlledLearningBusy ? "disabled" : ""}>${controlledLearningBusy === "create" ? tr("Đang tạo...", "Creating...") : tr("Tạo proposal từ bài học", "Create proposal from lesson")}</button>
    </div>
  `;
  if (!suggestions.length) {
    lessonSuggestions.innerHTML = permissionNote + `<div class="empty-state">${tr("Chưa có đề xuất. Sau khi có kết quả/bài học sau launch, bấm Tạo proposal từ bài học để AI draft delta cho template.", "No suggestions yet. After post-launch results or lessons exist, click Create proposal from lesson to draft a template delta.")}</div>`;
    notifyControlledLearningChanged();
    return;
  }

  lessonSuggestions.innerHTML = permissionNote + suggestions.map((item) => {
    if (isControlledLearningProposal(item)) return renderControlledProposalCard(item);
    const accepted = item.status === "accepted";
    const locked = !canApproveTemplateSuggestion();
    const typeLabel = item.type === "riskRequirement"
      ? tr("Yêu cầu rủi ro", "Risk requirement")
      : item.type === "checklist"
        ? tr("Checklist", "Checklist")
        : item.type === "persona"
          ? tr("Persona", "Persona")
          : item.type === "postmortem"
            ? tr("Post-mortem", "Post-mortem")
            : item.type;
    return `
      <article class="suggestion-item ${accepted ? "accepted" : ""}">
        <div>
          <span class="section-kicker">${escapeHTML(typeLabel)}</span>
          <h4>${escapeHTML(briefContentIsEnglish() ? suggestionTitleEn(item) : item.title)}</h4>
          <p>${escapeHTML(briefContentIsEnglish() ? suggestionReasonEn(item) : friendlyText(item.reason))}</p>
        </div>
        <div class="suggestion-actions">
          <button type="button" data-suggestion-apply="${escapeHTML(item.id)}" ${accepted || locked ? "disabled" : ""}>${accepted ? tr("Đã duyệt", "Approved") : tr("Duyệt vào template", "Approve into template")}</button>
          <button type="button" data-suggestion-dismiss="${escapeHTML(item.id)}" ${accepted || locked ? "disabled" : ""}>${tr("Bỏ qua", "Dismiss")}</button>
        </div>
      </article>
    `;
  }).join("");
  notifyControlledLearningChanged();
}

function suggestionTitleEn(item) {
  if (item.id === "checklist-rollback-threshold") return "Add rollback / pause-threshold task";
  if (item.id === "persona-economy-reviewer") return "Add Economy / Reward reviewer";
  if (item.type === "riskRequirement") return `Add requirement: ${riskLabelEn(item.target || item.payload?.label || "risk group")}`;
  if (item.type === "checklist") return `Add checklist task: ${item.payload?.task || item.title}`;
  if (item.type === "persona") return `Add red-team persona: ${item.payload?.persona || item.title}`;
  if (item.type === "postmortem") return `Add post-mortem question: ${item.payload?.title || item.title}`;
  return item.title;
}

function suggestionReasonEn(item) {
  if (item.id === "checklist-rollback-threshold") return "Past lessons mention rollback or pause thresholds, so the checklist should include this required action.";
  if (item.id === "persona-economy-reviewer") return "Past lessons mention rewards, so this launch needs a reviewer focused on rates, budget, and abuse risk.";
  if (item.type === "riskRequirement") return "This risk group needs a clearer requirement so future briefs can be scored consistently.";
  if (item.type === "checklist") return "Add this task so the operational follow-up is owned and tracked before launch.";
  if (item.type === "persona") return "Add this perspective so Red Team reviews catch the risk earlier.";
  if (item.type === "postmortem") return "Add this post-launch question so the next review captures the lesson.";
  return item.reason || "";
}

function riskLabelEn(label) {
  const value = normalizeText(label);
  const labels = {
    "muc tieu va pham vi": "Goals and scope",
    "muc tieu va segment": "Goals and segment",
    "nguoi phu trach va han xu ly": "Owner and deadline",
    "co che quay va eligibility": "Spin mechanics and eligibility",
    "reward cap va economy": "Reward cap and economy",
    "anti abuse va log": "Anti-abuse and logs",
    "cs va thong diep": "CS and messaging",
    "rollback va monitoring": "Rollback and monitoring"
  };
  return labels[value] || riskLabel(label);
}

function findSuggestion(id) {
  return (currentLaunch?.lessonSuggestions || []).find((item) => item.id === id);
}

function applyLessonSuggestion(id) {
  if (!canApproveTemplateSuggestion()) {
    analysisSource.textContent = tr("Bạn có full quyền duyệt đề xuất template trong bản demo này.", "You have full template-suggestion approval access in this demo.");
    return;
  }
  if (!currentLaunch) return;
  const suggestion = findSuggestion(id);
  if (!suggestion || suggestion.status === "accepted") return;
  const type = currentLaunch.type || firstLaunchType();
  selectedConfigTemplateId = baseTemplateIdForLaunch(currentLaunch);
  const templateId = configTemplateId();
  const option = baseTemplateOptionById(templateId);
  const typesUsingTemplate = typesUsingTemplateId(templateId);
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
  const savedTemplate = normalizeTemplate({ ...template, customized: true }, type);
  if (option) option.template = savedTemplate;
  typesUsingTemplate.forEach((itemType) => {
    LAUNCH_TEMPLATES[itemType] = savedTemplate;
  });
  currentLaunch.template = normalizeTemplate(savedTemplate, type);
  addTemplateVersion(`Duyệt AI suggestion: ${suggestion.title}`, "ai_suggestion");
  renderLaunchWorkspace();
  analysisSource.textContent = tr(`Đã duyệt suggestion và cập nhật template ${templateDisplayName(savedTemplate)}`, `Approved the suggestion and updated template ${templateDisplayName(savedTemplate)}`);
}

function dismissLessonSuggestion(id) {
  const suggestion = findSuggestion(id);
  if (!suggestion) return;
  suggestion.status = "dismissed";
  suggestion.dismissedAt = new Date().toISOString();
  renderLaunchWorkspace();
  analysisSource.textContent = tr("Đã bỏ qua suggestion", "Suggestion dismissed");
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
    : `<div class="empty-state">${tr("Chưa có bài học nào. Khi launch xong, ghi bài học ở đây để lần sau agent có thêm ngữ cảnh.", "No lessons yet. After the launch, record lessons here so the Agent has more context next time.")}</div>`;

  lessonsPanel.innerHTML = `
    <section class="lesson-box">
      <h3>${tr("Kết quả sau launch", "Post-launch results")}</h3>
      <textarea id="postResultInput" spellcheck="false">${escapeHTML(postResult)}</textarea>
      <label class="field">
        <span>${tr("Đổi trạng thái sau khi lưu", "Status after saving")}</span>
        <select id="postResultStatus">
          <option value="completed" ${normalizeStatus(currentLaunch?.status) === "completed" ? "selected" : ""}>${tr("Đã chạy", "Completed")}</option>
          <option value="running" ${normalizeStatus(currentLaunch?.status) === "running" ? "selected" : ""}>${tr("Đang chạy", "Running")}</option>
          <option value="upcoming" ${normalizeStatus(currentLaunch?.status) === "upcoming" ? "selected" : ""}>${tr("Sắp chạy", "Upcoming")}</option>
        </select>
      </label>
    </section>
    <section class="lesson-box">
      <h3>${tr("Bài học rút ra", "Lessons learned")}</h3>
      <div class="lesson-list">${lessonItems}</div>
      <label class="field brief-field">
        <span>${tr("Thêm bài học mới", "Add a new lesson")}</span>
        <textarea id="lessonInput" spellcheck="false" placeholder="${escapeHTML(tr("Ví dụ: Lần sau phải chốt CS FAQ trước T-1.", "Example: Next time, lock the CS FAQ before T-1."))}"></textarea>
      </label>
      <div class="actions">
        <button id="saveLesson" type="button" class="primary">${tr("Lưu kết quả / bài học", "Save results / lessons")}</button>
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

// ----- Run log (tab Log, visible to all roles) -----
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
        step.reason ? `${tr("lý do", "reason")}: ${step.reason}` : ""
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
        ${traceRows || `<div class="run-log-row"><span class="run-log-message">${tr("Bản ghi này không có trace agent.", "This record has no agent trace.")}</span></div>`}
      </article>
    `;
  }).join("");

  body.innerHTML = `
    <h4 class="run-log-heading">${tr("Sự kiện phiên này (client)", "This session's events (client)")}</h4>
    ${clientRows || `<div class="empty-state">${tr("Chưa có sự kiện nào trong phiên này cho launch đang chọn.", "No events in this session for the selected launch.")}</div>`}
    <h4 class="run-log-heading">${tr("Các lần phân tích đã lưu (server trace)", "Saved analysis runs (server trace)")}</h4>
    ${serverBlocks || `<div class="empty-state">${tr("Launch này chưa có lần phân tích nào được lưu.", "This launch has no saved analysis runs yet.")}</div>`}
  `;
}

function canMutateArchive() {
  return !PUBLIC_LOCK && isLaunchAdmin();
}

function renderArchive() {
  if (!archiveList) return;
  const canMutate = canMutateArchive();
  if (!archivedLaunches.length) {
    archiveList.innerHTML = `<div class="empty-state">${tr("Chưa có launch nào trong lưu trữ.", "No archived launches yet.")}</div>`;
    return;
  }
  archiveList.innerHTML = archivedLaunches.map((launch) => `
    <article class="archive-row" data-archive-launch="${escapeHTML(launch.id)}">
      <div>
        <strong>${escapeHTML(launch.name || launch.id)}</strong>
        <small>${escapeHTML(typeLabel(launch.type))} · ${escapeHTML(statusDisplayLabel(normalizeStatus(launch.status)))} · ${escapeHTML(formatDate(launch.archivedAt || launch.updatedAt))}</small>
      </div>
      <div class="archive-actions">
        <button type="button" data-archive-restore="${escapeHTML(launch.id)}"${canMutate ? "" : " disabled"}>${tr("Khôi phục", "Restore")}</button>
        <button type="button" class="danger-button" data-archive-purge="${escapeHTML(launch.id)}"${canMutate ? "" : " disabled"}>${tr("Xóa vĩnh viễn", "Purge")}</button>
      </div>
    </article>
  `).join("");
}

async function loadArchive() {
  if (!archiveList || !backendAvailable) {
    renderArchive();
    return;
  }
  try {
    const payload = await fetchJson(`${API_BASE}/archive`);
    archivedLaunches = (payload.launches || []).map(sanitizeLaunchData);
  } catch (error) {
    console.warn("Load archive failed.", error);
    archivedLaunches = [];
  }
  renderArchive();
}

async function restoreArchivedLaunch(id) {
  if (!canMutateArchive()) {
    analysisSource.textContent = tr("Bản review public chỉ cho xem lưu trữ, không cho khôi phục.", "Public review mode is read-only; restore is disabled.");
    return;
  }
  try {
    const payload = await fetchJson(`${API_BASE}/archive/${encodeURIComponent(id)}/restore`, { method: "POST" });
    await loadLaunches();
    await loadArchive();
    if (payload.summary?.id) await selectLaunch(payload.summary.id);
    analysisSource.textContent = tr("Đã khôi phục launch từ lưu trữ.", "Launch restored from archive.");
  } catch (error) {
    console.warn("Restore archived launch failed.", error);
    analysisSource.textContent = tr("Khôi phục chưa thành công.", "Restore failed.");
  }
}

async function purgeArchivedLaunch(id) {
  if (!canMutateArchive()) {
    analysisSource.textContent = tr("Bản review public chỉ cho xem lưu trữ, không cho xóa vĩnh viễn.", "Public review mode is read-only; purge is disabled.");
    return;
  }
  if (!window.confirm(tr("Xóa vĩnh viễn launch này khỏi lưu trữ?", "Permanently delete this archived launch?"))) return;
  try {
    await fetchJson(`${API_BASE}/archive/${encodeURIComponent(id)}`, { method: "DELETE" });
    archivedLaunches = archivedLaunches.filter((launch) => launch.id !== id);
    renderArchive();
    analysisSource.textContent = tr("Đã xóa vĩnh viễn launch khỏi lưu trữ.", "Archived launch purged.");
  } catch (error) {
    console.warn("Purge archived launch failed.", error);
    analysisSource.textContent = tr("Xóa vĩnh viễn chưa thành công.", "Purge failed.");
  }
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
  [launchName, launchType, launchTemplate, launchStatus, launchOwner, launchTargetDate, launchEndDate, briefInput].forEach((control) => {
    setDisabled(control, !canEdit);
  });
  [launchTargetDateNative, launchEndDateNative, launchTargetDatePicker, launchEndDatePicker].forEach((control) => {
    setDisabled(control, !canEdit);
  });
  setDisabled(document.getElementById("loadBadBrief"), !canEdit);
  setDisabled(saveLaunchButton, !canEdit);
  // Analyze stays enabled on locked sample launches: it shows the result without persisting.
  setDisabled(analyzeButton, false);
  setDisabled(deleteLaunchButton, !canDeleteLaunch());
  if (deleteLaunchButton) deleteLaunchButton.hidden = !canDeleteLaunch();

  const sampleNotice = document.getElementById("sampleLaunchNotice");
  if (sampleNotice) sampleNotice.hidden = !sampleLaunchLocked();

  const runLogTab = document.getElementById("runLogTab");
  if (runLogTab) runLogTab.hidden = false;
  const runLogConfigBlock = document.getElementById("runLogConfigBlock");
  if (runLogConfigBlock) runLogConfigBlock.hidden = false;

  const postResultInput = document.getElementById("postResultInput");
  const lessonInput = document.getElementById("lessonInput");
  const postResultStatus = document.getElementById("postResultStatus");
  const saveLessonButton = document.getElementById("saveLesson");
  [postResultInput, lessonInput, postResultStatus, saveLessonButton].forEach((control) => {
    setDisabled(control, !canOutcome);
  });

  if (!canEdit && analysisSource) {
    analysisSource.textContent = sampleLaunchLocked()
      ? tr("Đây là Launch mẫu, đang khóa chỉnh sửa. Hãy tạo launch mới để trải nghiệm.", "This is a sample launch and is locked for editing. Create a new launch to try it.")
      : tr("Bạn có full quyền thao tác trong bản demo này.", "You have full operator access in this demo.");
  }
}

function renderLatestAnalysisOrPreview() {
  const analyses = currentLaunch?.analyses || [];
  const latest = analyses.length ? analyses[analyses.length - 1] : null;
  if (latest?.result) {
    renderApiAnalysis(latest.result, `${tr("Lịch sử đã lưu", "Saved history")} · ${formatDate(latest.createdAt)}`);
    return;
  }

  if (briefInput.value.trim()) {
    renderLocalAnalysis(backendAvailable
      ? tr("Xem thử local: chưa lưu lịch sử", "Local preview: not saved to history")
      : tr("Dự phòng local: backend chưa bật", "Local fallback: backend offline"));
    return;
  }

  renderEmptyAnalysis(tr("Chọn launch hoặc tạo launch mới rồi nhập brief.", "Select a launch or create a new one, then enter a brief."));
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

async function callLaunchOpsTool(name, args = {}, options = {}) {
  const root = API_BASE ? API_BASE.replace(/\/api$/, "") : "";
  const response = await fetch(`${root}/tools/call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, arguments: args }),
    signal: options.signal
  });
  const envelope = await response.json();
  const text = envelope?.content?.[0]?.text;
  const payload = text ? JSON.parse(text) : envelope;
  if (!response.ok || envelope.isError || !payload.ok) {
    throw new Error(payload?.message || payload?.error || `Tool ${name} failed`);
  }
  return payload;
}

function applyPublicLockUI() {
  // Bottom-center notice when the author has locked admin actions during voting.
  let banner = document.getElementById("publicLockBanner");
  if (PUBLIC_LOCK) {
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "publicLockBanner";
      banner.style.cssText = "position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9999;max-width:min(760px,calc(100vw - 28px));text-align:center;padding:8px 14px;border-radius:8px;font-size:12px;line-height:1.4;color:#fff;background:rgba(0,0,0,0.86);box-shadow:0 10px 30px rgba(0,0,0,0.22);pointer-events:none;";
      document.body.appendChild(banner);
    }
    banner.hidden = false;
    banner.textContent = tr(
      "Tác giả tạm khóa 1 số quyền Admin để tránh dữ liệu DB xáo trộn trong quá trình vote để tránh ảnh hưởng trải nghiệm, BTC muốn review quyền Admin xin liên hệ domain: VinhVNN hoặc clone repo - Data mod không phải thực",
      "The author temporarily locked some Admin actions to keep the demo database stable during voting and protect the experience. To review Admin access, contact domain VinhVNN or clone the repo - Data mod is not the real one."
    );
  } else if (banner) {
    banner.hidden = true;
  }
  const sampleNotice = document.getElementById("sampleLaunchNotice");
  if (sampleNotice) {
    sampleNotice.textContent = tr(
      "Đây là Launch mẫu, vui lòng không điều chỉnh. Reviewer có thể tự tạo launch mới để trải nghiệm.",
      "This is a sample launch — please do not edit it. Reviewers can create a new launch to try it out."
    );
  }
}

async function loadServerConfig() {
  try {
    const res = await fetch(`${API_BASE}/version`);
    const data = await res.json();
    PUBLIC_LOCK = Boolean(data && data.publicLock);
  } catch (error) {
    PUBLIC_LOCK = false;
  }
  applyPublicLockUI();
  try { applyLaunchPermissions(); } catch (error) { /* not ready yet */ }
}

async function loadLaunches() {
  if (!API_BASE) {
    backendAvailable = false;
    launches = fallbackLaunches.map(sanitizeLaunchData).map(summarizeClientLaunch);
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
    launches = (payload.launches || []).map(sanitizeLaunchData);
  } catch (error) {
    console.warn("Launch list API unavailable, using local fallback.", error);
    backendAvailable = false;
    launches = fallbackLaunches.map(sanitizeLaunchData).map(summarizeClientLaunch);
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
      currentLaunch = sanitizeLaunchData(payload.launch);
    } else {
      currentLaunch = sanitizeLaunchData(fallbackLaunches.find((launch) => launch.id === id) || null);
    }
    loadLaunchUiState(currentLaunch);
    draftMode = false;
    setFormFromLaunch(currentLaunch);
    renderLaunchWorkspace();
    renderLatestAnalysisOrPreview();
    if (document.getElementById("runLog")?.classList.contains("active")) renderRunLog();
  } catch (error) {
    console.warn("Cannot load launch detail.", error);
    renderEmptyAnalysis(tr("Không mở được launch này. Kiểm tra backend local.", "Could not open this launch. Check the local backend."));
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
    lessonsLearned: [],
    redTeamBriefSupplements: {},
    checklistProgress: {}
  };
  loadLaunchUiState(currentLaunch);
  setFormFromLaunch(currentLaunch);
  renderLaunchWorkspace();
  renderEmptyAnalysis(tr("Nhập brief rồi bấm Lưu launch hoặc Chạy phân tích.", "Enter a brief, then click Save launch or Run analysis."));
}

async function saveCurrentLaunch({ silent = false } = {}) {
  if (!canEditLaunch()) {
    analysisSource.textContent = tr("Bạn có full quyền sửa launch trong bản demo này.", "You have full launch-edit access in this demo.");
    throw new Error("Launch edit is temporarily unavailable.");
  }
  const launchData = collectLaunchFromForm();
  const scheduleValidation = validateLaunchScheduleRules(launchData);
  if (!scheduleValidation.ok) {
    showLaunchScheduleError(scheduleValidation);
    throw new Error(scheduleValidation.error);
  }
  if (!canSaveLaunchData(launchData)) {
    analysisSource.textContent = tr("Bạn có full quyền lưu launch trong bản demo này.", "You have full launch-save access in this demo.");
    throw new Error("Launch save is temporarily unavailable.");
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
      currentLaunch = sanitizeLaunchData(payload.launch);
      loadLaunchUiState(currentLaunch);
      draftMode = false;
      upsertLaunchSummary(payload.summary || currentLaunch);
    } else {
      currentLaunch = sanitizeLaunchData({
        ...currentLaunch,
        ...launchData,
        id: currentLaunch?.id || launchData.id,
        analyses: currentLaunch?.analyses || [],
        templateVersions: currentLaunch?.templateVersions || [],
        lessonSuggestions: currentLaunch?.lessonSuggestions || [],
        redTeamBriefSupplements: stringMap(redTeamBriefSupplements),
        checklistProgress: booleanMap(checklistProgress),
        lessonsLearned: currentLaunch?.lessonsLearned || [],
        postLaunchResult: currentLaunch?.postLaunchResult || ""
      });
      loadLaunchUiState(currentLaunch);
      const index = fallbackLaunches.findIndex((launch) => launch.id === currentLaunch.id);
      if (index >= 0) fallbackLaunches[index] = currentLaunch;
      else fallbackLaunches.push(currentLaunch);
      upsertLaunchSummary(currentLaunch);
      draftMode = false;
    }
    setFormFromLaunch(currentLaunch);
    renderLaunchWorkspace();
    if (!silent) analysisSource.textContent = backendAvailable
      ? tr("Đã lưu launch vào bộ nhớ local", "Launch saved to local storage")
      : tr("Dự phòng local: chưa lưu bền vững", "Local fallback: not persisted");
    return currentLaunch;
  } catch (error) {
    console.warn("Save launch failed.", error);
    analysisSource.textContent = tr("Lưu chưa thành công: backend chưa sẵn sàng", "Save failed: backend not ready");
    throw error;
  } finally {
    saveLaunchButton.disabled = false;
    saveLaunchButton.textContent = tr("Lưu launch", "Save launch");
    applyLaunchPermissions();
  }
}

async function deleteCurrentLaunch() {
  if (!canDeleteLaunch()) {
    analysisSource.textContent = tr("Chỉ có thể xóa launch đã lưu. Launch nháp chưa có id để xóa.", "Only saved launches can be deleted. A draft has no id yet.");
    return;
  }
  const launchId = currentLaunch?.id;
  const launchLabel = currentLaunch?.name || tr("launch này", "this launch");
  if (!launchId) return;
  if (!window.confirm(tr(`Xóa ${launchLabel}? Hành động này chỉ áp dụng trong bản demo/local hiện tại.`, `Delete ${launchLabel}? This only applies to the current demo/local copy.`))) return;

  if (backendAvailable) {
    await fetchJson(`${API_BASE}/launches/${encodeURIComponent(launchId)}`, { method: "DELETE" });
  } else {
    const fallbackIndex = fallbackLaunches.findIndex((launch) => launch.id === launchId);
    if (fallbackIndex >= 0) fallbackLaunches.splice(fallbackIndex, 1);
  }

  launches = launches.filter((launch) => launch.id !== launchId);
  await loadArchive();
  const next = launches.find((launch) => normalizeStatus(launch.status) === "running") || launches[0];
  analysisSource.textContent = tr(`Đã chuyển ${launchLabel} vào Lưu trữ.`, `Moved ${launchLabel} to Archive.`);
  if (next) await selectLaunch(next.id);
  else startNewLaunch();
}

// Pipeline LLM thật chạy ~90-120s trên runtime; client phải chờ lâu hơn server.
const ANALYZE_CLIENT_TIMEOUT_MS = 240000;

async function analyze() {
  const text = briefInput.value.trim();
  if (!text) {
    renderEmptyAnalysis(tr("Chưa có brief để phân tích.", "No brief to analyze yet."));
    setAnalysisRunStatus("error", tr("Chưa có brief. Nhập brief rồi thử lại.", "No brief. Add one and try again."));
    logRunEvent("error", "analyze", "Bấm Chạy phân tích nhưng brief đang trống.");
    return;
  }
  const scheduleValidation = validateLaunchScheduleRules(collectLaunchFromForm());
  if (!scheduleValidation.ok) {
    showLaunchScheduleError(scheduleValidation);
    logRunEvent("error", "analyze", scheduleValidation.message);
    return;
  }

  analyzeButton.disabled = true;
  analyzeButton.textContent = tr("Đang phân tích...", "Analyzing...");
  analysisSource.textContent = tr("Đang gọi AI...", "Calling AI...");
  setAnalysisRunStatus("running", tr("Đang phân tích brief...", "Analyzing brief..."));
  document.body.classList.add("is-analyzing");
  const startedAt = Date.now();
  logRunEvent("info", "analyze", `Bắt đầu phân tích "${currentLaunch?.name || "Launch mới"}" (backend=${backendAvailable ? "có" : "không"}).`);

  try {
    const lockedSample = sampleLaunchLocked();
    const launch = lockedSample
      ? sanitizeLaunchData({ ...currentLaunch, ...collectLaunchFromForm(), id: currentLaunch?.id })
      : await saveCurrentLaunch({ silent: true });
    logRunEvent("info", "save", lockedSample
      ? `Bỏ qua lưu launch mẫu đang khóa trước khi phân tích (id=${launch?.id || "?"}).`
      : `Đã lưu launch trước khi phân tích (id=${launch?.id || "?"}).`);

    if (backendAvailable && launch?.id) {
      logRunEvent("info", "api", `POST ${API_BASE}/launches/${launch.id}/analyze (timeout client ${Math.round(ANALYZE_CLIENT_TIMEOUT_MS / 1000)}s)...`);
      const payload = await fetchJson(`${API_BASE}/launches/${encodeURIComponent(launch.id)}/analyze`, {
        method: "POST",
        body: JSON.stringify(collectLaunchFromForm()),
        timeoutMs: ANALYZE_CLIENT_TIMEOUT_MS
      });
      currentLaunch = sanitizeLaunchData(payload.launch);
      upsertLaunchSummary(payload.summary || currentLaunch);
      setFormFromLaunch(currentLaunch);
      renderLaunchWorkspace();
      renderApiAnalysis(payload.result);
      activateTab("redTeam");
      setAnalysisRunStatus("success", tr("Đã phân tích xong", "Analysis complete"));
      logRunEvent("success", "api", `Phân tích xong sau ${Math.round((Date.now() - startedAt) / 1000)}s, source=${payload.result?.source || "?"}${payload.result?.warning ? `, warning=${payload.result.warning}` : ""}.`);
      return;
    }

    const result = buildLocalAnalysisResult(text);
    renderApiAnalysis(result, tr("Dự phòng local: backend/API chưa sẵn sàng", "Local fallback: backend/API unavailable"));
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
    setAnalysisRunStatus("success", tr("Đã phân tích xong", "Analysis complete"));
    logRunEvent("success", "local", "Phân tích bằng rule local (không gọi backend).");
  } catch (error) {
    console.warn("Analyze failed, using local fallback.", error);
    const isTimeout = error?.name === "AbortError";
    logRunEvent("error", "api", isTimeout
      ? `Client hủy vì quá thời gian chờ ${Math.round(ANALYZE_CLIENT_TIMEOUT_MS / 1000)}s (server có thể vẫn đang chạy). Đã render kết quả rule local thay thế.`
      : `${error?.name || "Error"}: ${error?.message || error}. Đã render kết quả rule local thay thế.`);
    const result = buildLocalAnalysisResult(text);
    renderApiAnalysis(result, tr("Dự phòng local: backend/API chưa sẵn sàng", "Local fallback: backend/API unavailable"));
    activateTab("redTeam");
    setAnalysisRunStatus("error", isTimeout
      ? tr("Quá thời gian chờ. Đang hiển thị kết quả dự phòng.", "Timed out. Showing fallback results.")
      : tr("Có lỗi. Hãy thử lại sau.", "Something went wrong. Try again."));
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
      id: "demo-golden-spin-weekend",
      name: "Demo - Golden Spin Weekend",
      type: LUCKY_SPIN_TYPE,
      status: "running",
      owner: "PM LiveOps",
      targetDate: "2026-06-19",
      endDate: "2026-06-21",
      brief: badBrief,
      template: defaultTemplateForType(LUCKY_SPIN_TYPE),
      templateVersions: [],
      lessonSuggestions: [],
      analyses: [],
      postLaunchResult: "",
      lessonsLearned: []
    };
    setFormFromLaunch(currentLaunch);
    renderLaunchWorkspace();
    activateTab("briefView");
    analysisSource.textContent = tr("Demo mode: đã nạp brief mẫu", "Demo mode: sample brief loaded");
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
      text: "Demo lesson: Golden Spin cần reward cap, CS FAQ, anti-abuse dashboard và kill switch trước T-1."
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
    analysisSource.textContent = tr("Demo mode: flow mẫu đã sẵn sàng để quay video", "Demo mode: sample flow ready to record");
  } finally {
    demoModeButton.disabled = false;
    demoModeButton.textContent = "Demo mode";
  }
}

async function saveLesson() {
  if (!canSaveLaunchOutcome()) {
    analysisSource.textContent = tr("Bạn có full quyền lưu kết quả và bài học trong bản demo này.", "You have full result- and lesson-save access in this demo.");
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
    analysisSource.textContent = backendAvailable
      ? tr("Đã lưu bài học vào bộ nhớ local", "Lesson saved to local storage")
      : tr("Dự phòng local: bài học chưa lưu bền vững", "Local fallback: lesson not persisted");
  } catch (error) {
    console.warn("Save lesson failed.", error);
    analysisSource.textContent = tr("Lưu bài học chưa thành công: backend chưa sẵn sàng", "Lesson save failed: backend not ready");
  }
}

function showSavedAnalysis(analysisId) {
  const analysis = (currentLaunch?.analyses || []).find((item) => item.id === analysisId);
  if (!analysis) return;
  renderApiAnalysis(sanitizeAnalysisResult(analysis.result), `Lịch sử đã lưu · ${formatDate(analysis.createdAt)}`);
  activateTab("redTeam");
}

function saveTemplateConfig() {
  if (!canEditTemplate()) {
    analysisSource.textContent = tr("Bạn có full quyền lưu cấu hình trong bản demo này.", "You have full config-save access in this demo.");
    return;
  }
  const templateId = configTemplateId();
  const option = baseTemplateOptionById(templateId);
  const typesUsingTemplate = typesUsingTemplateId(templateId);
  ensureTemplateVersionHistory();
  const savedTemplate = templateFromEditors(configTemplate());
  savedTemplate.customized = true;
  if (option) option.template = savedTemplate;
  typesUsingTemplate.forEach((type) => {
    LAUNCH_TEMPLATES[type] = savedTemplate;
  });
  if (currentLaunch && baseTemplateIdForLaunch(currentLaunch) === templateId) {
    currentLaunch.template = normalizeTemplate(savedTemplate, currentLaunch.type || firstLaunchType());
  }
  addTemplateVersion(`Người thao tác lưu cấu hình template ${templateDisplayName(savedTemplate)}`, "manual_save");
  renderLaunchTemplateOptions(launchTemplate?.value || baseTemplateIdForLaunch(currentLaunch));
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
  analysisSource.textContent = tr(`Đã lưu cấu hình template ${templateDisplayName(savedTemplate)}`, `Saved template config for ${templateDisplayName(savedTemplate)}`);
}

function resetTemplateForSelectedType() {
  if (!canEditTemplate()) {
    analysisSource.textContent = tr("Bạn có full quyền nạp lại cấu hình trong bản demo này.", "You have full config-reload access in this demo.");
    return;
  }
  const templateId = configTemplateId();
  const option = baseTemplateOptionById(templateId);
  const template = option?.template || configTemplate();
  const typesUsingTemplate = typesUsingTemplateId(templateId);
  ensureTemplateVersionHistory();
  typesUsingTemplate.forEach((type) => {
    LAUNCH_TEMPLATES[type] = template;
  });
  if (currentLaunch && baseTemplateIdForLaunch(currentLaunch) === templateId) {
    currentLaunch.template = normalizeTemplate(template, currentLaunch.type || firstLaunchType());
  }
  addTemplateVersion(`Khôi phục template ${templateDisplayName(template)}`, "reset_default");
  renderLaunchTemplateOptions(launchTemplate?.value || baseTemplateIdForLaunch(currentLaunch));
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
  analysisSource.textContent = tr(`Đã nạp template ${templateDisplayName(template)}`, `Loaded template ${templateDisplayName(template)}`);
}

function switchTemplateFromSelector() {
  if (!templateSelector) return;
  const selectedTemplateId = templateSelector.value;
  if (!baseTemplateExists(selectedTemplateId)) return;
  selectedConfigTemplateId = selectedTemplateId;
  renderTemplateConfig();
  const selectedTemplate = configTemplate();
  analysisSource.textContent = canEditTemplate()
    ? tr(`Đang cấu hình template ${templateDisplayName(selectedTemplate)}`, `Configuring template ${templateDisplayName(selectedTemplate)}`)
    : tr(`Đang xem template ${templateDisplayName(selectedTemplate)}. Bản review public không cho chỉnh sửa.`, `Viewing template ${templateDisplayName(selectedTemplate)}. The public review build is read-only.`);
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
    analysisSource.textContent = tr("Bạn có full quyền thêm template trong bản demo này.", "You have full template-add access in this demo.");
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
  TEMPLATE_NAME_LABELS_EN[template.name] = "New template";
  selectedConfigTemplateId = id;
  renderTemplateConfig();
  analysisSource.textContent = tr("Đã thêm template mới. Bạn có thể đổi tên rồi gán cho phân loại cần dùng.", "New template added. You can rename it and assign it to a type.");
}

function addTemplateForLaunchType(type) {
  if (!canEditTemplate()) {
    analysisSource.textContent = tr("Bản review public chỉ cho xem cấu hình, chưa cho thêm template.", "Public review mode is read-only; templates cannot be added.");
    return;
  }
  if (!launchTypeExists(type)) return;
  const id = uniqueBaseTemplateId();
  const template = normalizeTemplate({
    ...defaultTemplateForType(type),
    name: `Custom Template ${BASE_TEMPLATE_OPTIONS.length - PROTECTED_BASE_TEMPLATE_IDS.length + 1}`,
    customized: false
  }, type);
  BASE_TEMPLATE_OPTIONS.push({ id, template });
  TEMPLATE_NAME_LABELS[template.name] = "Template mới";
  TEMPLATE_NAME_LABELS_EN[template.name] = "New template";
  bindTemplateToType(type, id);
  selectedConfigTemplateId = id;
  if (currentLaunch?.type === type) {
    currentLaunch.template = normalizeTemplate(template, type);
    renderLaunchTemplateOptions(id);
  }
  renderTemplateConfig();
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
  analysisSource.textContent = tr(`Đã thêm template mới cho ${typeLabel(type)}.`, `New template added for ${typeLabel(type)}.`);
}

function removeBaseTemplate(id) {
  if (!canEditTemplate()) {
    analysisSource.textContent = tr("Bạn có full quyền xóa template trong bản demo này.", "You have full template-delete access in this demo.");
    return;
  }
  if (PROTECTED_BASE_TEMPLATE_IDS.includes(id)) {
    analysisSource.textContent = tr("Template mặc định đang được giữ lại để demo không mất dữ liệu mẫu.", "The default template is kept so the demo does not lose sample data.");
    return;
  }
  const index = BASE_TEMPLATE_OPTIONS.findIndex((item) => item.id === id);
  if (index < 0) return;
  const templateName = BASE_TEMPLATE_OPTIONS[index].template?.name;
  BASE_TEMPLATE_OPTIONS.splice(index, 1);
  if (templateName) delete TEMPLATE_NAME_LABELS[templateName];
  if (templateName) delete TEMPLATE_NAME_LABELS_EN[templateName];
  if (selectedConfigTemplateId === id) {
    selectedConfigTemplateId = firstBaseTemplateId();
  }
  Object.keys(LAUNCH_TEMPLATES).forEach((type) => {
    TYPE_TEMPLATE_IDS[type] = templateIdsForType(type).filter((templateId) => templateId !== id);
    if (LAUNCH_TEMPLATES[type]?.name === templateName) {
      LAUNCH_TEMPLATES[type] = GENERIC_LAUNCH_TEMPLATE;
      TYPE_TEMPLATE_IDS[type] = ["generic"];
    }
  });
  if (currentLaunch?.template?.name === templateName) {
    currentLaunch.template = defaultTemplateForType(currentLaunch.type || "Game event");
    renderLaunchTemplateOptions(baseTemplateIdForLaunch(currentLaunch));
  }
  renderTemplateConfig();
  renderLatestAnalysisOrPreview();
  analysisSource.textContent = tr("Đã xóa template tùy chỉnh. Phân loại đang dùng template đó được chuyển về Template launch chung.", "Custom template deleted. Types using it were moved to the shared launch template.");
}

function addLaunchType() {
  if (!canEditTemplate()) {
    analysisSource.textContent = tr("Bạn có full quyền thêm phân loại trong bản demo này.", "You have full type-add access in this demo.");
    return;
  }
  const label = "Phân loại mới";
  const type = uniqueLaunchTypeKey(label);
  LAUNCH_TEMPLATES[type] = GENERIC_LAUNCH_TEMPLATE;
  TYPE_TEMPLATE_IDS[type] = ["generic"];
  TYPE_LABELS[type] = label;
  TYPE_LABELS_EN[type] = "New classification";
  renderLaunchTypeOptions(currentLaunch?.type || launchType?.value);
  renderTemplateConfig();
  analysisSource.textContent = tr("Đã thêm phân loại mới. Bạn có thể đổi tên ngay trong bảng cấu hình.", "New type added. You can rename it right in the config table.");
}

function updateTemplateLabel(input, { render = true } = {}) {
  if (!canEditTemplate()) return;
  const templateNameKey = input.dataset.templateLabel;
  if (!templateNameKey) return;
  TEMPLATE_NAME_LABELS[templateNameKey] = input.value.trim() || templateNameKey;
  TEMPLATE_NAME_LABELS_EN[templateNameKey] = input.value.trim() || templateNameKey;
  if (render) {
    renderLaunchWorkspace();
    analysisSource.textContent = tr("Đã đổi tên hiển thị template.", "Template display name updated.");
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
    analysisSource.textContent = tr("Đã đổi tên phân loại.", "Type renamed.");
  } else {
    syncLaunchTypeOptionLabels();
  }
}

function updateLaunchTypeTemplate(select) {
  if (!canEditTemplate()) return;
  const type = select.closest("[data-launch-type]")?.dataset.launchType;
  if (!launchTypeExists(type)) return;
  const template = baseTemplateById(select.value);
  bindTemplateToType(type, select.value);
  if (currentLaunch?.type === type) {
    currentLaunch.template = normalizeTemplate(template, type);
    renderLaunchTemplateOptions(select.value);
  }
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
  analysisSource.textContent = tr(`Đã đổi bộ template gốc cho ${typeLabel(type)}.`, `Changed the base template for ${typeLabel(type)}.`);
}

function removeLaunchType(type) {
  if (!canEditTemplate()) {
    analysisSource.textContent = tr("Bạn có full quyền xóa phân loại trong bản demo này.", "You have full type-delete access in this demo.");
    return;
  }
  if (!launchTypeExists(type) || PROTECTED_LAUNCH_TYPES.includes(type)) {
    analysisSource.textContent = tr("Phân loại mặc định đang được giữ lại để demo không mất dữ liệu mẫu.", "The default type is kept so the demo does not lose sample data.");
    return;
  }
  delete LAUNCH_TEMPLATES[type];
  delete TYPE_TEMPLATE_IDS[type];
  delete TYPE_LABELS[type];
  if (currentLaunch?.type === type) {
    currentLaunch.type = firstLaunchType();
    currentLaunch.template = defaultTemplateForType(currentLaunch.type);
  }
  renderLaunchTypeOptions(currentLaunch?.type || launchType?.value);
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
  analysisSource.textContent = tr("Đã xóa phân loại tùy chỉnh.", "Custom type deleted.");
}

function handleTemplateCatalogChange(event) {
  const addTemplateButton = event.target.closest("[data-add-template-for-type]");
  if (addTemplateButton) {
    addTemplateForLaunchType(addTemplateButton.dataset.addTemplateForType);
    return;
  }

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
  const templateId = baseTemplateIdForType(launchType.value) || firstBaseTemplateId();
  renderLaunchTemplateOptions(templateId);
  currentLaunch.template = normalizeTemplate(baseTemplateById(templateId), launchType.value);
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
}

function syncLaunchTemplateAfterTemplateChange() {
  if (!currentLaunch || !launchTemplate) return;
  currentLaunch.template = normalizeTemplate(baseTemplateById(launchTemplate.value), launchType?.value || currentLaunch.type || firstLaunchType());
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
}

function activateConfigPanel(target = "catalog") {
  document.querySelectorAll("[data-config-tab]").forEach((item) => {
    const on = item.dataset.configTab === target;
    item.classList.toggle("active", on);
    item.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll("[data-config-panel]").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.configPanel === target);
  });
  const summaryDisabled = target === "catalog" || target === "archive";
  document.querySelector(".template-summary")?.classList.toggle("is-disabled", summaryDisabled);
  if (templateSelector) templateSelector.disabled = summaryDisabled;
  if (target === "archive") {
    void loadArchive();
  }
}

function activateTab(target) {
  const currentActiveView = document.querySelector(".view.active")?.id || "briefView";
  const isConfigScreen = target === "templateConfig";
  if (isConfigScreen || (target && target !== currentActiveView)) previousLaunchView = currentActiveView;
  appShell?.classList.toggle("config-mode", isConfigScreen);
  document.querySelectorAll(".tab").forEach((item) => {
    const isActive = !isConfigScreen && item.dataset.view === target;
    item.classList.toggle("active", isActive);
    item.setAttribute("aria-selected", isActive ? "true" : "false");
  });
  openTemplateConfigButton?.classList.toggle("active", isConfigScreen);
  if (openTemplateConfigButton) {
    openTemplateConfigButton.textContent = configButtonText(isConfigScreen);
  }
  document.querySelectorAll(".view").forEach((view) => view.classList.toggle("active", view.id === target));
  if (target === "runLog") renderRunLog();
  if (isConfigScreen) {
    selectedConfigTemplateId = baseTemplateIdForLaunch(currentLaunch);
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
    { label: "Chọn sản phẩm", value: "assistant:product" },
    { label: "Hỗ trợ", value: "assistant:support" },
    { label: "Chạy phân tích", value: "assistant:analyze" },
    { label: "Xem bài học", value: "assistant:lessons" }
  ];
}

function assistantLaunchNavigationOptions(topic) {
  const options = [];
  if (topic !== "summary") options.push({ label: "Tổng hợp launch", value: "assistant:summary" });
  if (topic !== "analyze") options.push({ label: "Chạy phân tích", value: "assistant:analyze" });
  if (topic !== "lessons") options.push({ label: "Xem bài học", value: "assistant:lessons" });
  options.push({ label: "Quay lại launch", value: "assistant:back" });
  return options;
}

function assistantProductOptions() {
  return [
    { label: "Demo", value: "assistant:product:demo" },
    { label: "Sản Phẩm XYZ", value: "assistant:product:xyz" },
    { label: "Mở chọn sản phẩm", value: "assistant:product:open" }
  ];
}

function assistantProductReply(rawText = "") {
  const text = normalizeText(rawText);
  const wantsLocked = text.includes("xyz") || text.includes("san pham xyz") || text.includes("product xyz") || text.includes("locked");
  const wantsDemo = text.includes("demo") && !wantsLocked;
  if (wantsLocked) {
    return {
      reply: tr(
        "Sản Phẩm XYZ đang khóa trong bản demo này hoặc tài khoản hiện tại chưa có quyền truy cập. Vui lòng liên hệ Admin để được mở quyền.",
        "Product XYZ is locked in this demo or your current account does not have access. Please contact Admin to request access."
      ),
      options: assistantProductOptions()
    };
  }
  if (wantsDemo) {
    return {
      reply: tr(
        "Sản phẩm Demo đang khả dụng. Tôi sẽ chọn Demo và đưa bạn vào mode Pro để thao tác LaunchOps.",
        "The Demo product is available. I will select Demo and switch you into Pro mode for LaunchOps."
      ),
      action: "selectDemoProduct",
      options: assistantHomeOptions()
    };
  }
  return {
    reply: tr(
      "Hiện bản demo chỉ cho phép dùng sản phẩm Demo. Sản Phẩm XYZ đang khóa hoặc chưa có quyền truy cập, vui lòng liên hệ Admin nếu cần mở.",
      "This demo currently allows only the Demo product. Product XYZ is locked or not permitted yet; please contact Admin if you need access."
    ),
    action: "openProductSelect",
    options: assistantProductOptions()
  };
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
      { label: "Chọn sản phẩm", value: "assistant:product" },
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

function setAssistantTyping(visible, text = "Agent đang soạn câu trả lời...") {
  if (!assistantMessages) return;
  const existing = assistantMessages.querySelector(".assistant-message.typing");
  if (!visible) {
    existing?.remove();
    return;
  }
  if (existing) {
    const node = existing.querySelector(".assistant-message-text");
    if (node) node.textContent = text;
    assistantMessages.scrollTop = assistantMessages.scrollHeight;
    return;
  }
  const message = document.createElement("div");
  message.className = "assistant-message bot typing";
  const messageText = document.createElement("div");
  messageText.className = "assistant-message-text";
  messageText.textContent = text;
  message.appendChild(messageText);
  assistantMessages.appendChild(message);
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
}

function autoGrowTextareaField(textarea, minHeight = 72, maxHeight = 220) {
  if (!textarea) return;
  textarea.style.height = "auto";
  const nextHeight = Math.max(minHeight, Math.min(textarea.scrollHeight || minHeight, maxHeight));
  textarea.style.height = `${nextHeight}px`;
  textarea.style.overflowY = (textarea.scrollHeight || nextHeight) > maxHeight ? "auto" : "hidden";
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
  if (/^\d{4}-\d{1,2}-\d{1,2}(?:[T\s]\d{1,2}:\d{2})?$/.test(text)) return normalizeDateForStorage(text);
  return normalizeDateForStorage(text.replace(/-/g, "/"));
}

function hasRequiredLaunchDateTime(value) {
  const parts = parseDateOnly(normalizeAssistantDate(value));
  return Boolean(parts && parts.hour !== "" && parts.minute !== "");
}

function normalizeAssistantDateTime(value) {
  return hasRequiredLaunchDateTime(value) ? normalizeAssistantDate(value) : "";
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
  const targetDate = normalizeAssistantDateTime(extractAssistantValue(rawText, [
    /(?:start launch|ngay bat dau|bat dau|start)\s*(?:la|:)?\s*(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4}(?:[T\s,]+\d{1,2}:\d{2}))/iu,
    /(?:start launch|ngày bắt đầu|ngay bat dau|bắt đầu|bat dau)\s*(?:là|la|:)?\s*(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4})/iu
  ]));
  const endDate = normalizeAssistantDateTime(extractAssistantValue(rawText, [
    /(?:end launch|ngay ket thuc|ket thuc|end)\s*(?:la|:)?\s*(\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4}(?:[T\s,]+\d{1,2}:\d{2}))/iu,
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
    { label: "Sửa lại Launch", value: "wizard:create:editLaunch" },
    { label: "Hủy", value: "assistant:cancel" }
  ];
}

function assistantCreateEditOptions() {
  return [
    { label: "Tên launch", value: "wizard:create:field:name" },
    { label: "Phân loại", value: "wizard:create:field:type" },
    { label: "Template", value: "wizard:create:field:template" },
    { label: "Owner", value: "wizard:create:field:owner" },
    { label: "Start Launch", value: "wizard:create:field:targetDate" },
    { label: "End Launch", value: "wizard:create:field:endDate" },
    { label: "Trạng thái", value: "wizard:create:field:status" },
    { label: "Nội dung brief", value: "wizard:create:field:brief" },
    { label: "Quay lại xác nhận", value: "wizard:create:backConfirm" },
    { label: "Hủy", value: "assistant:cancel" }
  ];
}

function formatAssistantDraftSummary(draft) {
  const draftStatus = normalizeStatus(draft.status || "upcoming");
  return [
    "Tôi đã gom đủ thông tin tạo launch:",
    "",
    `Tên launch: ${draft.name || "Chưa có"}`,
    `Phân loại: ${typeLabel(draft.type || "Game event")}`,
    `Template: ${draft.templateName || templateDisplayName(defaultTemplateForType(draft.type || "Game event"))}`,
    `Owner: ${draft.owner || "Chưa có"}`,
    `Start Launch: ${formatDateOnly(draft.targetDate, "Chưa có")}`,
    `End Launch: ${formatDateOnly(draft.endDate, "Chưa có")}`,
    `Trạng thái: ${STATUS_LABELS[draftStatus]}`,
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
    `Start Launch: ${formatDateOnly(draft.targetDate, "Chưa có")}`,
    `End Launch: ${formatDateOnly(draft.endDate, "Chưa có")}`,
    `Trạng thái: ${STATUS_LABELS[normalizeStatus(draft.status || "upcoming")]}`,
    `Owner: ${draft.owner || "Chưa có owner."}`,
    "",
    "Nội dung brief:",
    cleanAssistantBrief(draft.brief || "")
  ];
  return lines.join("\n").trim();
}

function assistantDraftToLaunch(draft) {
  const type = draft?.type || "Game event";
  const templateId = draft?.templateId || baseTemplateIdForType(type);
  const template = draft?.template || cloneData(baseTemplateById(templateId) || defaultTemplateForType(type));
  return {
    id: "",
    name: draft?.name || "Launch mới từ Assistant",
    type,
    status: normalizeStatus(draft?.status || "upcoming"),
    owner: draft?.owner || "",
    targetDate: draft?.targetDate || "",
    endDate: draft?.endDate || "",
    brief: cleanAssistantBrief(draft?.brief || ""),
    template: normalizeTemplate(template, type),
    templateVersions: [],
    lessonSuggestions: [],
    analyses: [],
    postLaunchResult: "",
    lessonsLearned: [],
    redTeamBriefSupplements: {},
    checklistProgress: {}
  };
}

function captureAssistantRestoreState() {
  const currentView = document.querySelector(".view.active")?.id || "briefView";
  const launch = currentLaunch
    ? sanitizeLaunchData({ ...cloneData(currentLaunch), ...collectLaunchFromForm() })
    : sanitizeLaunchData(collectLaunchFromForm());
  return {
    launch,
    draftMode,
    currentView
  };
}

function restoreAssistantDraftPreview(state) {
  if (!state?.launch) return;
  draftMode = Boolean(state.draftMode);
  currentLaunch = cloneData(state.launch);
  loadLaunchUiState(currentLaunch);
  setFormFromLaunch(currentLaunch);
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
  activateTab(state.currentView || "briefView");
}

function syncLaunchPreviewFromForm() {
  if (!currentLaunch) currentLaunch = collectLaunchFromForm();
  currentLaunch = {
    ...currentLaunch,
    ...collectLaunchFromForm()
  };
  setFormFromLaunch(currentLaunch);
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
}
window.syncLaunchPreviewFromForm = syncLaunchPreviewFromForm;

function syncAssistantDraftPreview(draft) {
  draftMode = true;
  currentLaunch = assistantDraftToLaunch(draft);
  loadLaunchUiState(currentLaunch);
  setFormFromLaunch(currentLaunch);
  renderLaunchWorkspace();
  renderLatestAnalysisOrPreview();
  activateTab("briefView");
}

function startCreateLaunchWizard() {
  assistantWizard = {
    mode: "create",
    step: "name",
    restoreState: captureAssistantRestoreState(),
    previewActive: false,
    draft: {
      name: "",
      type: "Game event",
      templateId: baseTemplateIdForType("Game event"),
      templateName: templateDisplayName(defaultTemplateForType("Game event")),
      owner: "",
      targetDate: "",
      endDate: "",
      status: "upcoming",
      brief: ""
    }
  };
  return {
    reply: "Tôi sẽ hỗ trợ bạn tạo launch mới từng bước. Trước tiên, tên launch là gì?",
    options: assistantCancelOptions()
  };
}

function startEditLaunchWizard() {
  if (!canEditLaunch()) {
    return {
      reply: "Bạn có full quyền sửa metadata, brief, kết quả sau launch và bài học trong bản demo này.",
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
      { label: "Trạng thái", value: "wizard:edit:field:status" },
      { label: "Owner", value: "wizard:edit:field:owner" },
      { label: "Start/End Launch", value: "wizard:edit:field:date" },
      { label: "Nội dung brief", value: "wizard:edit:field:brief" },
      { label: "Hủy", value: "assistant:cancel" }
    ]
  };
}

function finishAssistantWizard(message = "Đã hủy luồng hiện tại.") {
  const wizard = assistantWizard;
  if (wizard?.mode === "create" && wizard.previewActive && wizard.restoreState) {
    restoreAssistantDraftPreview(wizard.restoreState);
  }
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

  if (value === "wizard:create:editLaunch" || normalized.includes("sua launch")) {
    assistantWizard.step = "editField";
    return {
      reply: "Bạn muốn sửa phần nào của launch nháp này?",
      options: assistantCreateEditOptions()
    };
  }

  if (assistantWizard.step === "editField") {
    if (value === "wizard:create:backConfirm") {
      assistantWizard.step = "confirm";
      return { reply: formatAssistantDraftSummary(draft), options: assistantConfirmOptions() };
    }
    const field = value.startsWith("wizard:create:field:")
      ? value.replace("wizard:create:field:", "")
      : "brief";
    assistantWizard.draft.editField = field;
    assistantWizard.step = "editValue";
    if (field === "type") {
      return { reply: "Chọn lại phân loại launch.", options: [...launchTypeOptionsForAssistant(), ...assistantCancelOptions()] };
    }
    if (field === "template") {
      return { reply: "Chọn lại template/bộ luật cho launch.", options: [...templateOptionsForAssistant(), ...assistantCancelOptions()] };
    }
    if (field === "status") {
      return {
        reply: "Chọn lại trạng thái launch.",
        options: [
          { label: "Đã chạy", value: "completed" },
          { label: "Đang chạy", value: "running" },
          { label: "Sắp chạy", value: "upcoming" },
          ...assistantCancelOptions()
        ]
      };
    }
    const label = field === "name" ? "tên launch"
      : field === "owner" ? "owner"
        : field === "targetDate" ? "Start Launch"
          : field === "endDate" ? "End Launch"
            : "nội dung brief";
    return {
      reply: field === "targetDate"
        ? "Nhập lại Start Launch đầy đủ giờ phút, ví dụ 15/06/2026 08:30."
        : field === "endDate"
          ? "Nhập lại End Launch đầy đủ giờ phút, ví dụ 17/06/2026 23:59."
        : `Nhập lại ${label}.`,
      options: assistantCancelOptions()
    };
  }

  if (assistantWizard.step === "editValue") {
    const field = assistantWizard.draft.editField || "brief";
    if (field === "name") draft.name = cleanAssistantField(value) || draft.name;
    if (field === "owner") draft.owner = cleanAssistantField(value) || draft.owner;
    if (field === "brief") draft.brief = cleanAssistantBrief(value) || draft.brief;
    if (field === "status") {
      const normalizedStatus = normalizeText(value || "");
      const validStatusText = /(da chay|completed|done|dang chay|running|active|sap chay|upcoming|future)/.test(normalizedStatus);
      if (!validStatusText) {
        return {
          reply: "Tôi chưa hiểu trạng thái này. Hãy chọn Đã chạy, Đang chạy, hoặc Sắp chạy.",
          options: [
            { label: "Đã chạy", value: "completed" },
            { label: "Đang chạy", value: "running" },
            { label: "Sắp chạy", value: "upcoming" },
            ...assistantCancelOptions()
          ]
        };
      }
      draft.status = statusValueFromText(value) || draft.status || "upcoming";
    }
    if (field === "type") {
      const selectedType = value.startsWith("wizard:create:type:")
        ? value.replace("wizard:create:type:", "")
        : inferAssistantLaunchType(value);
      draft.type = launchTypeExists(selectedType) ? selectedType : draft.type || "Game event";
      draft.templateId = baseTemplateIdForType(draft.type);
      const template = defaultTemplateForType(draft.type);
      draft.templateName = templateDisplayName(template);
      draft.template = cloneData(template);
    }
    if (field === "template") {
      const templateId = value.startsWith("wizard:create:template:")
        ? value.replace("wizard:create:template:", "")
        : draft.templateId || baseTemplateIdForType(draft.type || "Game event");
      const template = baseTemplateById(templateId);
      draft.templateId = templateId;
      draft.templateName = templateDisplayName(template);
      draft.template = cloneData(template);
    }
    if (field === "targetDate") {
      const start = normalizeAssistantDateTime(value);
      if (!start) {
        return {
          reply: "Tôi chưa đọc được Start Launch đủ ngày giờ. Hãy nhập dạng 15/06/2026 08:30.",
          options: assistantCancelOptions()
        };
      }
      draft.targetDate = start;
    }
    if (field === "endDate") {
      const end = normalizeAssistantDateTime(value);
      if (!end) {
        return {
          reply: "Tôi chưa đọc được End Launch đủ ngày giờ. Hãy nhập dạng 17/06/2026 23:59.",
          options: assistantCancelOptions()
        };
      }
      draft.endDate = end;
    }
    const validation = validateLaunchScheduleRules({ ...draft, status: draft.status || "upcoming" });
    if (!validation.ok) {
      return { reply: validation.message, options: assistantCreateEditOptions() };
    }
    syncAssistantDraftPreview(draft);
    assistantWizard.previewActive = true;
    assistantWizard.step = "confirm";
    return {
      reply: `${field === "targetDate" || field === "endDate" ? "Đã cập nhật thời gian launch." : "Đã cập nhật launch nháp."}\n\n${formatAssistantDraftSummary(draft)}`,
      options: assistantConfirmOptions()
    };
  }

  if (assistantWizard.step === "name") {
    draft.name = cleanAssistantField(value) || "Launch mới từ Assistant";
    syncAssistantDraftPreview(draft);
    assistantWizard.previewActive = true;
    assistantWizard.step = "type";
    return {
      reply: `Đã ghi tên launch: ${draft.name}.\n\nLaunch này thuộc phân loại/function nào?`,
      options: [...launchTypeOptionsForAssistant(), ...assistantCancelOptions()]
    };
  }

  if (assistantWizard.step === "type") {
    const selectedType = value.startsWith("wizard:create:type:")
      ? value.replace("wizard:create:type:", "")
      : inferAssistantLaunchType(value);
    draft.type = launchTypeExists(selectedType) ? selectedType : "Game event";
    draft.templateId = baseTemplateIdForType(draft.type);
    draft.templateName = templateDisplayName(defaultTemplateForType(draft.type));
    draft.template = cloneData(defaultTemplateForType(draft.type));
    syncAssistantDraftPreview(draft);
    assistantWizard.previewActive = true;
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
    syncAssistantDraftPreview(draft);
    assistantWizard.previewActive = true;
    assistantWizard.step = "owner";
    return {
      reply: `Đã chọn template: ${draft.templateName}.\n\nOwner/người phụ trách launch này là ai?`,
      options: assistantCancelOptions()
    };
  }

  if (assistantWizard.step === "owner") {
    draft.owner = cleanAssistantField(value);
    syncAssistantDraftPreview(draft);
    assistantWizard.previewActive = true;
    assistantWizard.step = "targetDate";
    return {
      reply: "Start Launch là ngày giờ nào? Bạn phải nhập đủ dạng dd/mm/yyyy hh:mm, ví dụ 15/06/2026 08:30.",
      options: assistantCancelOptions()
    };
  }

  if (assistantWizard.step === "targetDate") {
    const dateValue = normalizeAssistantDateTime(value);
    if (!dateValue) {
      return {
        reply: "Tôi chưa đọc được Start Launch đủ ngày giờ. Hãy nhập đúng dạng dd/mm/yyyy hh:mm, ví dụ 15/06/2026 08:30.",
        options: assistantCancelOptions()
      };
    }
    draft.targetDate = dateValue;
    syncAssistantDraftPreview(draft);
    assistantWizard.previewActive = true;
    assistantWizard.step = "endDate";
    return {
      reply: "End Launch là ngày giờ nào? Bạn phải nhập đủ dạng dd/mm/yyyy hh:mm, ví dụ 17/06/2026 23:59.",
      options: assistantCancelOptions()
    };
  }

  if (assistantWizard.step === "endDate") {
    const dateValue = normalizeAssistantDateTime(value);
    if (!dateValue) {
      return {
        reply: "Tôi chưa đọc được End Launch đủ ngày giờ. Hãy nhập đúng dạng dd/mm/yyyy hh:mm, ví dụ 17/06/2026 23:59.",
        options: assistantCancelOptions()
      };
    }
    draft.endDate = dateValue;
    const validation = validateLaunchScheduleRules({ ...draft, status: draft.status || "upcoming" });
    if (!validation.ok) {
      return {
        reply: validation.message,
        options: assistantCancelOptions()
      };
    }
    syncAssistantDraftPreview(draft);
    assistantWizard.previewActive = true;
    assistantWizard.step = "status";
    return {
      reply: "Chọn trạng thái launch: Sắp chạy, Đang chạy, hoặc Đã chạy.",
      options: [
        { label: "Đã chạy", value: "completed" },
        { label: "Đang chạy", value: "running" },
        { label: "Sắp chạy", value: "upcoming" },
        ...assistantCancelOptions()
      ]
    };
  }

  if (assistantWizard.step === "status") {
    const normalizedStatus = normalizeText(value || "");
    const validStatusText = /(da chay|completed|done|dang chay|running|active|sap chay|upcoming|future)/.test(normalizedStatus);
    if (!validStatusText) {
      return {
        reply: "Tôi chưa hiểu trạng thái này. Hãy chọn Đã chạy, Đang chạy, hoặc Sắp chạy.",
        options: [
          { label: "Đã chạy", value: "completed" },
          { label: "Đang chạy", value: "running" },
          { label: "Sắp chạy", value: "upcoming" },
          ...assistantCancelOptions()
        ]
      };
    }
    const status = statusValueFromText(value);
    const validation = validateLaunchScheduleRules({ ...draft, status });
    if (!validation.ok) {
      return {
        reply: validation.message,
        options: [
          { label: "Đã chạy", value: "completed" },
          { label: "Đang chạy", value: "running" },
          { label: "Sắp chạy", value: "upcoming" },
          ...assistantCancelOptions()
        ]
      };
    }
    draft.status = status;
    syncAssistantDraftPreview(draft);
    assistantWizard.previewActive = true;
    assistantWizard.step = "brief";
    return {
      reply: "Bây giờ hãy dán nội dung brief. Có thể dùng nhiều dòng, gồm đối tượng, cơ chế, kênh truyền thông, việc đã có và vấn đề còn mở.",
      options: assistantCancelOptions()
    };
  }

  if (assistantWizard.step === "brief") {
    draft.brief = cleanAssistantBrief(value);
    syncAssistantDraftPreview(draft);
    assistantWizard.previewActive = true;
    assistantWizard.step = "confirm";
    return {
      reply: formatAssistantDraftSummary(draft),
      options: assistantConfirmOptions()
    };
  }

  if (assistantWizard.step === "confirm") {
    if (value === "wizard:create:editLaunch" || normalized.includes("sua launch") || normalized.includes("sua brief")) {
      assistantWizard.step = "editField";
      return {
        reply: "Bạn muốn sửa phần nào của launch nháp này?",
        options: assistantCreateEditOptions()
      };
    }
    if (value === "wizard:create:confirm" || normalized.includes("xac nhan") || normalized === "ok" || normalized.includes("dong y")) {
      const explicitStatus = normalizeStatus(draft.status || "upcoming");
      const validation = validateLaunchScheduleRules({ ...draft, status: explicitStatus });
      if (!validation.ok) {
        return {
          reply: validation.message,
          options: assistantCreateEditOptions()
        };
      }
      const payload = {
        ...draft,
        status: explicitStatus,
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
  if (field === "status") launchStatus.value = statusValueFromText(value);
  if (field === "owner") launchOwner.value = cleanAssistantField(value) || launchOwner.value;
  if (field === "brief") briefInput.value = cleanAssistantBrief(value) || briefInput.value;
  if (field === "date") {
    const [startRaw, endRaw] = String(value || "").split(/\s*(?:-|đến|den|to)\s*/iu);
    const start = normalizeAssistantDateTime(startRaw);
    const end = normalizeAssistantDateTime(endRaw);
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
      : field === "status" ? "trạng thái"
      : field === "owner" ? "owner"
        : field === "date" ? "Start/End Launch"
          : "nội dung brief";
    return {
      reply: field === "status"
        ? "Chọn trạng thái mới cho launch. Lưu ý: nếu End Launch đã qua thì không được chọn Đang chạy/Sắp chạy; nếu Start Launch đã qua thì không được chọn Sắp chạy."
        : `Nhập giá trị mới cho ${fieldLabel}. Với thời gian, bắt buộc nhập đủ giờ phút dạng 15/06/2026 08:30 - 17/06/2026 23:59.`,
      options: field === "status"
        ? [
          { label: "Đã chạy", value: "completed" },
          { label: "Đang chạy", value: "running" },
          { label: "Sắp chạy", value: "upcoming" },
          ...assistantCancelOptions()
        ]
        : assistantCancelOptions()
    };
  }

  if (assistantWizard.step === "value") {
    if (assistantWizard.draft.field === "status") {
      const status = statusValueFromText(value);
      const validation = validateLaunchScheduleRules({ ...collectLaunchFromForm(), status });
      if (!validation.ok) {
        return {
          reply: validation.message,
          options: [
            { label: "Đã chạy", value: "completed" },
            { label: "Đang chạy", value: "running" },
            { label: "Sắp chạy", value: "upcoming" },
            ...assistantCancelOptions()
          ]
        };
      }
    }
    if (assistantWizard.draft.field === "date") {
      const [startRaw, endRaw] = String(value || "").split(/\s*(?:-|đến|den|to)\s*/iu);
      const start = normalizeAssistantDateTime(startRaw);
      const end = normalizeAssistantDateTime(endRaw);
      if (!start || !end) {
        return {
          reply: "Tôi chưa đọc được đủ Start/End Launch kèm giờ phút. Hãy nhập dạng 15/06/2026 08:30 - 17/06/2026 23:59.",
          options: assistantCancelOptions()
        };
      }
      const validation = validateLaunchScheduleRules({ ...collectLaunchFromForm(), targetDate: start, endDate: end });
      if (!validation.ok) {
        return {
          reply: validation.message,
          options: assistantCancelOptions()
        };
      }
    }
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

function shouldUseAssistantLLMForFreeText(normalizedText) {
  const text = String(normalizedText || "");
  const wantsBriefHelp = /(viet|soan|draft|tao|lam|goi y|huong dan|ho tro|tu van).*(brief|event|launch|campaign|su kien|tang qua|qua tang|khong biet|lam sao)/.test(text)
    || /(brief|event|launch|campaign|su kien|tang qua|qua tang).*(viet|soan|draft|goi y|huong dan|ho tro|tu van|khong biet|lam sao)/.test(text);
  const wizardNeedsHumanText = assistantWizard?.mode && ["brief", "editValue"].includes(assistantWizard.step);
  const asksForAdvice = /(ho tro|tu van|goi y|huong dan|lam sao|khong biet|viet|soan|draft)/.test(text);
  return Boolean(wantsBriefHelp || (wizardNeedsHumanText && asksForAdvice));
}

function assistantWizardReply(rawText) {
  const value = String(rawText || "").trim();
  const text = normalizeText(value);
  if (value === "assistant:cancel" || text === "huy" || text === "cancel") {
    return finishAssistantWizard();
  }
  if (value === "assistant:back") {
    return {
      reply: "Tôi quay lại màn launch đang làm.",
      action: "backToLaunch",
      options: assistantHomeOptions()
    };
  }
  if (shouldUseAssistantLLMForFreeText(text)) return null;
  if (value === "assistant:summary" || assistantSummaryIntent(text)) {
    return assistantLaunchSummaryReply();
  }
  if (value === "assistant:create" || (text.includes("tao") && text.includes("launch"))) {
    return startCreateLaunchWizard();
  }
  if (value === "assistant:edit" || (text.includes("sua") && text.includes("launch"))) {
    return startEditLaunchWizard();
  }
  if (value === "assistant:support" || ((text.includes("ho tro") || text.includes("huong dan")) && !shouldUseAssistantLLMForFreeText(text))) {
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
    return {
      reply: "Tôi sẽ chạy phân tích cho launch hiện tại nếu brief đã có nội dung.",
      action: "analyze",
      options: assistantLaunchNavigationOptions("analyze")
    };
  }
  if (value === "assistant:lessons") {
    return {
      reply: "Tôi mở tab Bài học để bạn xem kết quả sau launch và lessons learned.",
      action: "lessons",
      options: assistantLaunchNavigationOptions("lessons")
    };
  }
  if (value === "assistant:product" || value === "assistant:product:open" || text.includes("chon san pham") || text.includes("doi san pham") || text.includes("switch product") || text.includes("select product")) {
    return assistantProductReply(value);
  }
  if (value === "assistant:product:demo" || value === "assistant:product:xyz" || text.includes("san pham xyz") || text.includes("product xyz")) {
    return assistantProductReply(value);
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
  const status = normalizeStatus(draft?.status || inferStatusFromSchedule(draft));
  const validation = validateLaunchScheduleRules({ ...draft, status });
  if (!validation.ok) {
    appendAssistantMessage("bot", validation.message, assistantHomeOptions());
    showLaunchScheduleError(validation);
    return;
  }
  if (status !== "upcoming" && !isLaunchAdmin()) {
    appendAssistantMessage("bot", `Bạn có full quyền tạo/sửa launch ${STATUS_LABELS[status]} trong bản demo này.`);
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
  renderEmptyAnalysis(tr("Assistant đã tạo launch mới. Kiểm tra brief rồi bấm Chạy phân tích khi cần.", "Assistant created a new launch. Review the brief, then click Run analysis."));
  analysisSource.textContent = tr(`Assistant đã tạo launch "${currentLaunch.name}" ở trạng thái ${STATUS_LABELS[normalizeStatus(currentLaunch.status)]}.`, `Assistant created launch "${currentLaunch.name}" with status ${STATUS_LABELS[normalizeStatus(currentLaunch.status)]}.`);
  appendAssistantMessage("bot", tr(`Đã tạo launch "${currentLaunch.name}". Tôi đã mở tab Tóm tắt để bạn kiểm tra brief.`, `Created launch "${currentLaunch.name}". I opened the Summary tab so you can review the brief.`));
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

  if (shouldUseAssistantLLMForFreeText(text)) {
    return {
      reply: [
        "Tôi có thể hỗ trợ bạn viết brief launch. Với event tặng quà, brief nên có:",
        "- Mục tiêu/KPI: muốn tăng DAU, retention, doanh thu hay engagement.",
        "- Đối tượng nhận quà và điều kiện đủ điều kiện.",
        "- Cơ chế nhận/quay/đổi quà, giới hạn lượt và thời gian chạy.",
        "- Reward cap, ngân sách, tỷ lệ trúng hoặc rule hết quà.",
        "- CS FAQ, chống abuse, rollback/pause threshold và dashboard theo dõi.",
        "",
        "Nếu muốn, hãy gửi vài ý thô như tên event, sản phẩm, thời gian và quà tặng; tôi sẽ soạn thành brief rõ ràng hơn."
      ].join("\n")
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

  if (text.includes("chon san pham") || text.includes("doi san pham") || text.includes("san pham xyz") || text.includes("product xyz") || text.includes("switch product") || text.includes("select product")) {
    return assistantProductReply(rawText);
  }

  if (isAssistantConfigActionIntent(text)) {
    return {
      reply: "Tôi mở Cấu hình phân loại. Bản demo hiện mở full quyền thao tác, bạn có thể sửa/lưu/duyệt trực tiếp trong UI.",
      action: "openConfig",
      options: assistantLaunchNavigationOptions("config")
    };
  }

  if (isAssistantConfigIntent(text) && !isAssistantConfigActionIntent(text)) {
    return {
      reply: "Cấu hình phân loại là bộ luật chung cho từng loại launch: nhóm rủi ro, góc phản biện, checklist và bài học. Bản review public chỉ cho xem để tránh người review sửa nhầm dữ liệu demo."
    };
  }

  if (text.includes("mo cau hinh") || text.includes("cau hinh phan loai")) {
    return {
      reply: "Tôi mở Cấu hình phân loại. Bạn có thể chỉnh template, checklist và rule phản biện trực tiếp trong UI.",
      action: "openConfig",
      options: assistantLaunchNavigationOptions("config")
    };
  }
  if (text.includes("quay lai") || text.includes("tro lai launch")) {
    return { reply: "Tôi quay lại màn launch đang làm.", action: "backToLaunch", options: assistantHomeOptions() };
  }
  if (text.includes("tom tat")) return assistantLaunchSummaryReply();
  if (text.includes("phan tich") || text.includes("red team")) return { reply: "Tôi mở tab Phân tích.", action: "redTeam", options: assistantLaunchNavigationOptions("redTeam") };
  if (text.includes("checklist") || text.includes("viec can lam")) return { reply: "Tôi mở tab Việc cần làm.", action: "checklist", options: assistantLaunchNavigationOptions("checklist") };
  if (text.includes("lich su")) return { reply: "Tôi mở tab Lịch sử phân tích.", action: "history", options: assistantLaunchNavigationOptions("history") };
  if (text.includes("bai hoc") || text.includes("postmortem")) return { reply: "Tôi mở tab Bài học.", action: "lessons", options: assistantLaunchNavigationOptions("lessons") };
  if (text.includes("chay phan tich") || text.includes("analyze")) {
    return { reply: "Tôi sẽ chạy phân tích cho launch hiện tại nếu brief đã có nội dung.", action: "analyze", options: assistantLaunchNavigationOptions("analyze") };
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
      reply: "Start Launch và End Launch là ngày giờ bắt đầu/kết thúc launch. Với Bot Chat, bắt buộc nhập đủ giờ phút theo dạng dd/mm/yyyy hh:mm, ví dụ 15/06/2026 08:30. Nếu chỉ có ngày, tôi sẽ hỏi lại thay vì tự đoán giờ."
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
        language: uiLang(),
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
    selectedConfigTemplateId = baseTemplateIdForLaunch(currentLaunch);
    activateTab("templateConfig");
    return;
  }
  if (action === "backToLaunch") {
    activateTab(previousLaunchView || "briefView");
    return;
  }
  if (action === "openProductSelect") {
    openProductSelect();
    return;
  }
  if (action === "selectDemoProduct") {
    selectProduct("demo");
    return;
  }
  if (["briefView", "redTeam", "checklist", "history", "lessons"].includes(action)) {
    activateTab(action);
    return;
  }
  if (action === "analyze") {
    if (!canEditLaunch()) {
      appendAssistantMessage("bot", "Bạn có full quyền chạy lại phân tích trong bản demo này.");
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

function openCommunicationAppsModal() {
  if (!communicationAppsModal) return;
  try {
    updateUILanguage(localStorage.getItem("launchops_lang") || currentLang || "vi");
  } catch (error) {
    console.warn("Communication Apps i18n sync failed.", error);
  }
  communicationAppsModal.classList.remove("closed");
  communicationAppsModal.setAttribute("aria-hidden", "false");
  closeCommunicationAppsButton?.focus({ preventScroll: true });
}

function closeCommunicationAppsModal() {
  communicationAppsModal?.classList.add("closed");
  communicationAppsModal?.setAttribute("aria-hidden", "true");
  commAppsToast?.classList.remove("visible");
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }
  textarea.remove();
  return copied;
}

async function copyCommunicationAppLink(url) {
  if (!url) return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch (error) {
    console.warn("Clipboard API unavailable, trying fallback copy.", error);
  }
  return fallbackCopyText(url);
}

let commAppsToastTimer = null;
function showCommunicationAppsToast(messageOrSuccess = true) {
  if (!commAppsToast) return;
  const message = typeof messageOrSuccess === "string"
    ? messageOrSuccess
    : (messageOrSuccess
      ? tr("Dán link Bot vào nhóm Zalo mà bạn muốn mời", "Paste the Bot link into the Zalo group you want to invite")
      : tr("Chưa copy được link. Bạn có thể mở Zalo DM và copy link thủ công.", "Could not copy the link. Open Zalo DM and copy it manually."));
  commAppsToast.textContent = message;
  commAppsToast.classList.add("visible");
  window.clearTimeout(commAppsToastTimer);
  commAppsToastTimer = window.setTimeout(() => {
    commAppsToast.classList.remove("visible");
  }, 3000);
}

function closeIntroModal() {
  if (!introModal) return;
  if (introModal.classList.contains("closed")) return;
  introModal.classList.add("closed");
  introModal.setAttribute("aria-hidden", "true");
  openProductSelect();
}

function openProductSelect() {
  if (!productSelect) return;
  productSelect.classList.remove("closed");
  productSelect.setAttribute("aria-hidden", "false");
}

function closeProductSelect() {
  if (!productSelect) return;
  productSelect.classList.add("closed");
  productSelect.setAttribute("aria-hidden", "true");
}

function forceProModeForProductEntry() {
  try { localStorage.setItem("launchops_ui_mode", "pro"); } catch (error) {}
  document.body.classList.remove("ui-mode-friendly");
  document.body.classList.add("ui-mode-pro");
  document.querySelectorAll(".mode-btn[data-mode]").forEach((button) => {
    const active = button.dataset.mode === "pro";
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function selectProduct(id) {
  if (id !== "demo") return; // Product XYZ is locked in this demo
  try { localStorage.setItem("launchops_product", id); } catch (error) {}
  forceProModeForProductEntry();
  closeProductSelect();
}

function showLockedProductMessage() {
  const message = tr(
    "Sản Phẩm XYZ đang khóa trong bản demo này hoặc tài khoản hiện tại chưa có quyền truy cập. Vui lòng liên hệ Admin để được mở quyền.",
    "Product XYZ is locked in this demo or your current account does not have access. Please contact Admin to request access."
  );
  analysisSource.textContent = message;
  if (assistantMessages) appendAssistantMessage("bot", message, assistantProductOptions());
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
    currentLang = localStorage.getItem("launchops_lang") || currentLang || "vi";
    renderLaunchGroups();
    renderLaunchWorkspace();
    renderLaunchTypeOptions(currentLaunch?.type || launchType?.value);
    renderLaunchTemplateOptions(launchTemplate?.value || baseTemplateIdForLaunch(currentLaunch));
    syncLaunchTypeOptionLabels();
    syncTemplateDisplayLabels();
    renderLatestAnalysisOrPreview();
    if (openTemplateConfigButton) openTemplateConfigButton.textContent = configButtonText(appShell?.classList.contains("config-mode"));
  } catch (error) {
    console.warn("Language re-render failed.", error);
  }
};


document.getElementById("runLogFilter")?.addEventListener("change", renderRunLog);
redTeamCards?.addEventListener("input", (event) => {
  const field = event.target.closest("[data-redteam-brief]");
  if (!field) return;
  redTeamBriefSupplements[field.dataset.redteamBrief || ""] = field.value || "";
});
redTeamCards?.addEventListener("click", (event) => {
  const reanalyzeButton = event.target.closest("[data-redteam-reanalyze]");
  if (reanalyzeButton) {
    reanalyzeWithRedTeamSupplements().catch((error) => {
      console.warn("Red Team re-analysis failed.", error);
      setAnalysisRunStatus("error", tr("Phân tích lại chưa thành công. Hãy kiểm tra backend hoặc thử lại.", "Re-analysis failed. Check the backend or try again."));
    });
    return;
  }
  const saveButton = event.target.closest("[data-redteam-save]");
  if (saveButton) {
    saveLaunchWithRedTeamSupplements().catch((error) => {
      console.warn("Red Team supplement save failed.", error);
      setAnalysisRunStatus("error", tr("Lưu brief bổ sung chưa thành công. Hãy thử lại.", "Could not save supplements. Try again."));
    });
  }
});
checklistRows?.addEventListener("change", (event) => {
  const field = event.target.closest("[data-checklist-done]");
  if (!field) return;
  checklistProgress[field.dataset.checklistDone || ""] = Boolean(field.checked);
  field.closest(".timeline-card")?.classList.toggle("is-done", Boolean(field.checked));
});
document.getElementById("clearRunLog")?.addEventListener("click", () => {
  const launchId = currentLaunch?.id || "(nháp)";
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
    event.target.textContent = tr("Đã copy", "Copied");
  } catch (error) {
    event.target.textContent = tr("Copy lỗi", "Copy failed");
  }
  window.setTimeout(() => { event.target.textContent = LAUNCHOPS_LANG_MAP[currentLang].runLogCopy; }, 1500);
});

if (openTemplateConfigButton) {
  openTemplateConfigButton.addEventListener("click", () => {
    if (appShell?.classList.contains("config-mode")) {
      activateTab(previousLaunchView || "briefView");
    } else {
      selectedConfigTemplateId = baseTemplateIdForLaunch(currentLaunch);
      activateTab("templateConfig");
    }
  });
}

openAssistantButton?.addEventListener("click", openAssistantPanel);
closeAssistantButton?.addEventListener("click", closeAssistantPanel);
openCommunicationAppsButton?.addEventListener("click", openCommunicationAppsModal);
closeCommunicationAppsButton?.addEventListener("click", closeCommunicationAppsModal);
copyZaloGroupLinkButton?.addEventListener("click", async () => {
  const url = copyZaloGroupLinkButton.dataset.copyUrl || "https://bot.zaloplatforms.com/groups/invite/bot.AKFMGNfj";
  const copied = await copyCommunicationAppLink(url);
  showCommunicationAppsToast(copied);
});
copyCommStarterPromptButton?.addEventListener("click", async () => {
  const prompt = commStarterPrompt?.textContent?.trim() || "";
  const copied = await copyCommunicationAppLink(prompt);
  showCommunicationAppsToast(copied
    ? tr("Đã copy prompt khởi đầu cho Bot.", "Copied the starter prompt for the Bot.")
    : tr("Chưa copy được prompt. Hãy chọn và copy thủ công.", "Could not copy the prompt. Select and copy it manually."));
});
closeIntroModalButton?.addEventListener("click", closeIntroModal);
enterDemoFromIntroButton?.addEventListener("click", closeIntroModal);

productSelect?.addEventListener("click", (event) => {
  const card = event.target.closest(".product-card");
  if (!card) return;
  if (card.classList.contains("locked")) {
    showLockedProductMessage();
    return;
  }
  selectProduct(card.dataset.product);
});
changeProductButton?.addEventListener("click", openProductSelect);

introModal?.addEventListener("click", (event) => {
  if (event.target === introModal) {
    closeIntroModal();
  }
});

communicationAppsModal?.addEventListener("click", (event) => {
  if (event.target === communicationAppsModal) {
    closeCommunicationAppsModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCommunicationAppsModal();
    closeIntroModal();
  }
});

focusIntroModal();

async function handleAssistantUserMessage(message, displayText = message) {
  appendAssistantMessage("user", displayText);
  const wizardResult = assistantWizardReply(message);
  if (wizardResult) {
    setAssistantTyping(false);
    if (wizardResult.reply) appendAssistantMessage("bot", wizardResult.reply, wizardResult.options || []);
    if (wizardResult.action) await applyAssistantAction(wizardResult.action);
    return;
  }

  try {
    setAssistantTyping(true);
    const result = await assistantReply(message);
    setAssistantTyping(false);
    appendAssistantMessage("bot", result.reply, result.options || []);
    await applyAssistantAction(result.action);
  } catch (error) {
    setAssistantTyping(false);
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
  autoGrowTextareaField(assistantInput);
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

assistantInput?.addEventListener("input", () => {
  autoGrowTextareaField(assistantInput);
});

autoGrowTextareaField(assistantInput);

appendAssistantMessage(
  "bot",
  "Tôi là trợ lý LaunchOps. Bạn cần tôi hỗ trợ gì? Tôi có thể tạo launch mới theo từng bước, sửa launch hiện tại, chạy phân tích hoặc mở phần bài học.",
  assistantHomeOptions()
);

document.getElementById("loadBadBrief").addEventListener("click", () => {
  const sample = cloneData(fallbackLaunches.find((launch) => launch.id === "golden-spin-weekend-risk") || fallbackLaunches[0]);
  sample.id = "";
  sample.name = tr("Brief Mẫu", "Sample Brief");
  sample.analyses = [];
  sample.lessonsLearned = [];
  sample.lessonSuggestions = [];
  sample.postLaunchResult = "";
  sample.redTeamBriefSupplements = {};
  sample.checklistProgress = {};
  currentLaunch = sample;
  draftMode = true;
  loadLaunchUiState(currentLaunch);
  setFormFromLaunch(currentLaunch);
  renderLaunchWorkspace();
  renderEmptyAnalysis(tr("Brief mẫu đã được nạp. Bấm Chạy phân tích để tạo score.", "Sample brief loaded. Click Run Analysis to generate a score."));
});

saveLaunchButton.addEventListener("click", () => {
  saveCurrentLaunch().catch(() => {});
});

if (deleteLaunchButton) {
  deleteLaunchButton.addEventListener("click", () => {
    deleteCurrentLaunch().catch((error) => {
      console.warn("Delete launch failed.", error);
      analysisSource.textContent = tr("Xóa launch chưa thành công.", "Delete launch failed.");
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
      analysisSource.textContent = tr("Demo mode lỗi, kiểm tra console.", "Demo mode failed, check the console.");
      demoModeButton.disabled = false;
      demoModeButton.textContent = "Demo mode";
    });
  });
}

if (exportReportButton) {
  exportReportButton.addEventListener("click", () => {
    exportLaunchReport().catch((error) => {
      console.warn("Export report failed.", error);
      analysisSource.textContent = tr("Export report chưa thành công.", "Export report failed.");
    });
  });
}

launchType.addEventListener("change", syncTemplateAfterTypeChange);

if (launchTemplate) {
  launchTemplate.addEventListener("change", syncLaunchTemplateAfterTemplateChange);
}

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
    const addTemplateButton = event.target.closest("[data-add-template-for-type]");
    if (addTemplateButton) {
      addTemplateForLaunchType(addTemplateButton.dataset.addTemplateForType);
      return;
    }
    const removeButton = event.target.closest("[data-remove-launch-type]");
    if (removeButton) removeLaunchType(removeButton.dataset.removeLaunchType);
  });
}

if (archiveList) {
  archiveList.addEventListener("click", (event) => {
    const restoreButton = event.target.closest("[data-archive-restore]");
    if (restoreButton) {
      void restoreArchivedLaunch(restoreButton.dataset.archiveRestore);
      return;
    }
    const purgeButton = event.target.closest("[data-archive-purge]");
    if (purgeButton) {
      void purgeArchivedLaunch(purgeButton.dataset.archivePurge);
    }
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

if (launchDateFromInput) {
  launchDateFromInput.addEventListener("change", () => {
    launchDateFromFilter = launchDateFromInput.value || "";
    renderLaunchGroups();
  });
}

if (launchDateToInput) {
  launchDateToInput.addEventListener("change", () => {
    launchDateToFilter = launchDateToInput.value || "";
    renderLaunchGroups();
  });
}

launchGroups.addEventListener("click", (event) => {
  const button = event.target.closest(".launch-card");
  if (!button) return;
  if (button.classList.contains("pro-session-draft") || !button.dataset.launchId) return;
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
    const createButton = event.target.closest("[data-proposal-create]");
    const approveButton = event.target.closest("[data-proposal-approve]");
    const rejectButton = event.target.closest("[data-proposal-reject]");
    const applyButton = event.target.closest("[data-suggestion-apply]");
    const dismissButton = event.target.closest("[data-suggestion-dismiss]");
    if (createButton) createControlledLearningProposal();
    if (approveButton) reviewControlledLearningProposal(approveButton.dataset.proposalApprove, true);
    if (rejectButton) reviewControlledLearningProposal(rejectButton.dataset.proposalReject, false);
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
loadServerConfig();


// --- Bilingual translation system (VI / EN) ---
const LAUNCHOPS_LANG_MAP = {
  vi: {
    title: "LaunchOps Command Center",
    eyebrow: "V-Team · VinhVNN · GS9",
    newLaunch: "Tạo launch mới",
    openTemplateConfig: "Cấu Hình",
    modeFriendly: "Friendly",
    modePro: "Pro",
    statusAll: "Tất cả",
    statusRunning: "Đang chạy",
    statusCompleted: "Đã chạy",
    statusUpcoming: "Sắp chạy",
    searchLabel: "Tìm kiếm",
    searchPlaceholder: "Tên hoặc phân loại",
    dateFromLabel: "Từ ngày",
    dateToLabel: "Đến ngày",
    statusLabel: "Trạng thái",
    roleLabel: "Vai trò",
    introTitle: "LaunchOps Command Center là gì?",
    introSummary: "LaunchOps Command Center là một <strong>multi-agent command center</strong> giúp điều phối các agent chuyên trách để <strong>kiểm soát rủi ro launch</strong> trước, trong và sau khi phát hành sự kiện, campaign, tính năng mới hoặc hệ thống nội bộ.",
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
    commAppsBtn: "Kết Nối Ứng Dụng Chat",
    commAppsKicker: "Kết nối kênh chat",
    commAppsTitle: "Kết Nối Ứng Dụng Chat",
    commAppsSubtitle: "Chọn kênh để kết nối LaunchOps Bot vào DM hoặc nhóm làm việc.",
    commAppsClose: "Đóng kết nối ứng dụng chat",
    commZaloStatus: "Đang hỗ trợ",
    commComingSoon: "Sắp có",
    commZaloDmHint: "Mở bot Zalo để chat trực tiếp với LaunchOps.",
    commZaloGroupHint: "Copy link Zalo Group và dán vào nhóm Zalo mà bạn muốn mời.",
    commTelegramDmHint: "Bot Telegram sẽ được mở sau.",
    commTelegramGroupHint: "Kết nối nhóm Telegram sẽ được mở sau.",
    commDiscordDmHint: "Bot Discord DM sẽ được mở sau.",
    commDiscordChannelHint: "Kết nối channel Discord sẽ được mở sau.",
    commConnect: "Connect",
    commCopy: "Copy",
    commComingSoonCta: "Coming Soon",
    commZaloGroupNote: "(chưa chính thức có thể bị disable)",
    commPromptTitle: "Prompt khởi đầu cho Bot",
    commPromptStatus: "Gọi lcc_docs",
    commPromptHint: "Copy prompt này để Bot trả hướng dẫn LCC, ví dụ lệnh/tool và cách bắt đầu phân tích hoặc tạo launch.",
    commStarterPrompt: "lcc docs\nHãy giới thiệu đầy đủ nhưng gọn về LCC (LaunchOps Command Center): LCC là gì, luồng Brief -> Chấm điểm sẵn sàng (Green/Yellow/Red) -> Phản biện Red Team -> Checklist hành động -> Post-mortem -> Bài học kinh nghiệm. Sau đó liệt kê cách tôi có thể yêu cầu Bot hỗ trợ: phân tích rủi ro từ brief, liệt kê/xem/tạo/cập nhật/xóa launch, xem catalog sản phẩm/phân loại/template hợp lệ, và giải thích rõ phần cấu hình phân loại/template/sản phẩm là quyền Human Admin, Bot chỉ được đọc catalog. Cuối cùng liệt kê các tool/lệnh chính và khi nào dùng từng tool. Trả lời bằng tiếng Việt, có heading và bullet rõ ràng.",
    commPromptCopy: "Copy prompt",
    commCopyToast: "Dán link Bot vào nhóm Zalo mà bạn muốn mời",
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
    traceCopyBtn: "Copy JSON",
    runLogFilterAll: "Tất cả",
    runLogFilterError: "Lỗi",
    runLogFilterWarn: "Cảnh báo",
    runLogClear: "Xóa log phiên",
    runLogTitle: "Log chạy phân tích",
    runLogClient: "Sự kiện phiên này (client)",
    runLogServer: "Các lần phân tích đã lưu (server trace)",
    runLogCopy: "Copy log",
    runLogCopied: "Đã copy",
    runLogCopyError: "Copy lỗi",
    runLogAdminOnly: "Log đang mở cho mọi vai trò.",
    runLogNoEvents: "Chưa có sự kiện nào trong phiên này cho launch đang chọn.",
    runLogNoTraces: "Launch này chưa có lần phân tích nào được lưu.",
    runLogNoAgentTrace: "Bản ghi này không có trace agent."
  },
  en: {
    title: "LaunchOps Command Center",
    eyebrow: "V-Team · VinhVNN · GS9",
    newLaunch: "New Launch",
    openTemplateConfig: "Config",
    modeFriendly: "Friendly",
    modePro: "Pro",
    statusAll: "All",
    statusRunning: "Running",
    statusCompleted: "Completed",
    runLogFilterAll: "All",
    runLogFilterError: "Error",
    runLogFilterWarn: "Warning",
    runLogClear: "Clear session log",
    runLogTitle: "Analysis run log",
    runLogClient: "Session events (client)",
    runLogServer: "Saved analysis traces (server trace)",
    runLogCopy: "Copy log",
    runLogCopied: "Copied",
    runLogCopyError: "Copy error",
    runLogAdminOnly: "Logs are visible to all roles.",
    runLogNoEvents: "No events recorded in this session for the selected launch.",
    runLogNoTraces: "No saved analysis traces found for this launch.",
    runLogNoAgentTrace: "No agent traces available for this run.",
    errTimeoutClient: "Client canceled due to 240s timeout (server might still be running). Rendered local rule fallback.",
    errTimeoutStatus: "Analysis timed out ? showing fallback results. Retry from the Log tab if needed.",
    errNoBrief: "No brief available for analysis...",
    errNoBriefStatus: "No brief available for analysis. Enter a brief and try again.",
    statusUpcoming: "Upcoming",
    searchLabel: "Search",
    searchPlaceholder: "Name or type",
    dateFromLabel: "From",
    dateToLabel: "To",
    statusLabel: "Status",
    roleLabel: "Role",
    introTitle: "What is LaunchOps Command Center?",
    introSummary: "LaunchOps Command Center is a <strong>multi-agent command center</strong> that orchestrates specialized agents to manage <strong>launch risk</strong> before, during, and after campaigns, H5 events, features, or internal releases.",
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
    commAppsBtn: "Communication Apps",
    commAppsKicker: "Chat channel connections",
    commAppsTitle: "Communication Apps",
    commAppsSubtitle: "Choose a channel to connect the LaunchOps Bot to DMs or team groups.",
    commAppsClose: "Close communication apps",
    commZaloStatus: "Available",
    commComingSoon: "Coming soon",
    commZaloDmHint: "Open the Zalo bot to chat directly with LaunchOps.",
    commZaloGroupHint: "Copy the Zalo Group link and paste it into the Zalo group you want to invite.",
    commTelegramDmHint: "Telegram DM bot will be available later.",
    commTelegramGroupHint: "Telegram Group connection will be available later.",
    commDiscordDmHint: "Discord DM bot will be available later.",
    commDiscordChannelHint: "Discord Channel connection will be available later.",
    commConnect: "Connect",
    commCopy: "Copy",
    commComingSoonCta: "Coming Soon",
    commZaloGroupNote: "(not official yet, may be disabled)",
    commPromptTitle: "Starter prompt for the Bot",
    commPromptStatus: "Calls lcc_docs",
    commPromptHint: "Copy this prompt so the Bot returns the LCC guide, command/tool examples, and how to start analyzing or creating a launch.",
    commStarterPrompt: "lcc docs\nIntroduce LCC (LaunchOps Command Center) fully but concisely: what LCC is, the Brief -> Readiness scoring (Green/Yellow/Red) -> Red Team review -> Action checklist -> Post-mortem -> Lessons learned flow. Then list how I can ask the Bot for help: analyze launch risk from a brief, list/view/create/update/delete launches, view the valid product/classification/template catalog, and clearly explain that product/classification/template configuration is Human Admin only while the Bot may only read the catalog. Finally list the main tools/commands and when to use each tool. Reply in English with clear headings and bullets.",
    commPromptCopy: "Copy prompt",
    commCopyToast: "Paste the Bot link into the Zalo group you want to invite",
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
  try { applyPublicLockUI(); } catch (error) { /* banner not ready */ }

  // Update active buttons state
  document.getElementById("langViBtn")?.classList.toggle("active", lang === "vi");
  document.getElementById("langEnBtn")?.classList.toggle("active", lang === "en");
  document.getElementById("introLangViBtn")?.classList.toggle("active", lang === "vi");
  document.getElementById("introLangEnBtn")?.classList.toggle("active", lang === "en");
  document.getElementById("introLangViBtn")?.setAttribute("aria-pressed", lang === "vi" ? "true" : "false");
  document.getElementById("introLangEnBtn")?.setAttribute("aria-pressed", lang === "en" ? "true" : "false");

  // Basic Topbar elements
  const titleEl = document.querySelector(".topbar h1");
  if (titleEl) titleEl.textContent = dict.title;
  const eyebrowEl = document.querySelector(".topbar .eyebrow");
  if (eyebrowEl) eyebrowEl.textContent = dict.eyebrow;

  const newLaunchEl = document.getElementById("newLaunch");
  if (newLaunchEl) newLaunchEl.textContent = dict.newLaunch;
  const configBtn = document.getElementById("openTemplateConfig");
  if (configBtn) configBtn.textContent = configButtonText(appShell?.classList.contains("config-mode"));

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
  const dateFromSpan = document.querySelector(".board-date-from span");
  if (dateFromSpan) dateFromSpan.textContent = dict.dateFromLabel;
  const dateToSpan = document.querySelector(".board-date-to span");
  if (dateToSpan) dateToSpan.textContent = dict.dateToLabel;
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
  if (introSummaryEl) introSummaryEl.innerHTML = dict.introSummary;
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

  const commLauncher = document.getElementById("openCommunicationApps");
  if (commLauncher) commLauncher.textContent = dict.commAppsBtn;
  const commKicker = document.getElementById("commAppsKicker");
  if (commKicker) commKicker.textContent = dict.commAppsKicker;
  const commTitle = document.getElementById("commAppsTitle");
  if (commTitle) commTitle.textContent = dict.commAppsTitle;
  const commSubtitle = document.getElementById("commAppsSubtitle");
  if (commSubtitle) commSubtitle.textContent = dict.commAppsSubtitle;
  const commClose = document.getElementById("closeCommunicationApps");
  if (commClose) commClose.setAttribute("aria-label", dict.commAppsClose);
  const commZaloStatus = document.getElementById("commZaloStatus");
  if (commZaloStatus) commZaloStatus.textContent = dict.commZaloStatus;
  const commTelegramStatus = document.getElementById("commTelegramStatus");
  if (commTelegramStatus) commTelegramStatus.textContent = dict.commComingSoon;
  const commDiscordStatus = document.getElementById("commDiscordStatus");
  if (commDiscordStatus) commDiscordStatus.textContent = dict.commComingSoon;
  const commZaloDmHint = document.getElementById("commZaloDmHint");
  if (commZaloDmHint) commZaloDmHint.textContent = dict.commZaloDmHint;
  const commZaloGroupHint = document.getElementById("commZaloGroupHint");
  if (commZaloGroupHint) commZaloGroupHint.textContent = dict.commZaloGroupHint;
  const commTelegramDmHint = document.getElementById("commTelegramDmHint");
  if (commTelegramDmHint) commTelegramDmHint.textContent = dict.commTelegramDmHint;
  const commTelegramGroupHint = document.getElementById("commTelegramGroupHint");
  if (commTelegramGroupHint) commTelegramGroupHint.textContent = dict.commTelegramGroupHint;
  const commDiscordDmHint = document.getElementById("commDiscordDmHint");
  if (commDiscordDmHint) commDiscordDmHint.textContent = dict.commDiscordDmHint;
  const commDiscordChannelHint = document.getElementById("commDiscordChannelHint");
  if (commDiscordChannelHint) commDiscordChannelHint.textContent = dict.commDiscordChannelHint;
  const commZaloDmConnect = document.getElementById("commZaloDmConnect");
  if (commZaloDmConnect) commZaloDmConnect.textContent = dict.commConnect;
  const copyZaloGroup = document.getElementById("copyZaloGroupLink");
  if (copyZaloGroup) copyZaloGroup.textContent = dict.commCopy;
  const commZaloGroupNote = document.getElementById("commZaloGroupNote");
  if (commZaloGroupNote) commZaloGroupNote.textContent = dict.commZaloGroupNote;
  const commPromptTitle = document.getElementById("commPromptTitle");
  if (commPromptTitle) commPromptTitle.textContent = dict.commPromptTitle;
  const commPromptStatus = document.getElementById("commPromptStatus");
  if (commPromptStatus) commPromptStatus.textContent = dict.commPromptStatus;
  const commPromptHint = document.getElementById("commPromptHint");
  if (commPromptHint) commPromptHint.textContent = dict.commPromptHint;
  const commStarterPromptEl = document.getElementById("commStarterPrompt");
  if (commStarterPromptEl) commStarterPromptEl.textContent = dict.commStarterPrompt;
  const copyCommPrompt = document.getElementById("copyCommStarterPrompt");
  if (copyCommPrompt) copyCommPrompt.textContent = dict.commPromptCopy;
  ["commTelegramDmCta", "commTelegramGroupCta", "commDiscordDmCta", "commDiscordChannelCta"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = dict.commComingSoonCta;
  });
  const commToast = document.getElementById("commAppsToast");
  if (commToast && !commToast.classList.contains("visible")) commToast.textContent = dict.commCopyToast;

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

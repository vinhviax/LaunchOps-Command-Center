// i18n-clean.js - Clean bilingual data and DOM text restoration
const CLEAN_I18N_DICT = {
  vi: {
    introKicker: "Giới thiệu demo",
    introTitle: "LaunchOps Command Center là gì?",
    introSummary: "LaunchOps Command Center là một <strong>multi-agent command center</strong> giúp điều phối các agent chuyên trách để <strong>kiểm soát rủi ro launch</strong> trước, trong và sau khi phát hành sự kiện, campaign, tính năng mới hoặc hệ thống nội bộ.",
    introBody: "Công cụ có thể dùng trực tiếp trên <strong>Web UI</strong> như bản demo này, hoặc tích hợp thành <strong>Bot Chat</strong> trên <strong>Zalo, Discord, Telegram</strong> và mọi Communication Apps có hỗ trợ <strong>OpenClaw / autonomous agentic framework</strong>.",
    introGoalTitle: "Mục tiêu hướng tới",
    introGoal1: "<strong>Không còn launch mù quáng:</strong> team nhìn nhanh launch đã đủ an toàn chưa qua Green / Yellow / Red.",
    introGoal2: "<strong>Giảm thiểu thiếu sót trước launch:</strong> hệ thống nhắc các phần dễ quên như owner, deadline, tracking, dashboard, CS FAQ, rollback plan và tiêu chí dừng.",
    introGoal3: "<strong>Biến brief thành hành động:</strong> từ một mô tả launch, hệ thống tạo checklist có owner, deadline và trạng thái.",
    introGoal4: "<strong>Tích lũy bài học vận hành:</strong> lưu lịch sử phân tích, kết quả sau launch và lessons learned để các lần launch sau tốt hơn.",
    introAgentTitle: "LaunchOps Command Center dùng 6 agent/mode chính",
    introAgent1Title: "1. Mission Control Agent",
    introAgent1Body: "Đọc brief, nhận diện loại launch, điều phối các agent còn lại và giữ toàn bộ flow trong phạm vi LaunchOps.",
    introAgent2Title: "2. Launch Readiness Agent",
    introAgent2Body: "Chấm mức sẵn sàng theo bộ tiêu chí rủi ro, trả kết quả Green / Yellow / Red và điểm readiness.",
    introAgent3Title: "3. Red Team Agent",
    introAgent3Body: "Phản biện launch từ nhiều góc nhìn như user, kỹ thuật, CS, business và LiveOps để phát hiện rủi ro trước khi chạy.",
    introAgent4Title: "4. Checklist Agent",
    introAgent4Body: "Tạo danh sách việc cần làm theo từng mốc trước launch, ngày launch, trong lúc chạy và sau launch, có owner/deadline/status.",
    introAgent5Title: "5. Post-mortem & Lessons Agent",
    introAgent5Body: "Gợi ý câu hỏi tổng kết, lưu kết quả thực tế và bài học sau launch để tránh lặp lại lỗi cũ.",
    introAgent6Title: "6. LaunchOps Assistant / Channel Agent",
    introAgent6Body: "Bot Chat hỗ trợ giải thích, tạo launch, điều hướng trong Web UI và có thể mở rộng sang Zalo, Discord, Telegram hoặc các communication apps có hỗ trợ OpenClaw / Autonomous Agentic Framework.",
    introValueTitle: "Tác dụng thực tế",
    introValueBody: "LaunchOps Command Center giúp biến một launch brief còn mơ hồ thành quy trình vận hành rõ ràng: có điểm số, có rủi ro, có checklist, có owner và có bài học sau launch.",
    introBtn: "Vào demo",
    closeIntro: "Đóng",
    eyebrow: "V-Team · VinhVNN · GS9",
    title: "LaunchOps Command Center",
    roleLabel: "Vai trò",
    newLaunch: "Tạo launch mới",
    openTemplateConfig: "Cấu hình phân loại",
    statusFilterLabel: "Trạng thái",
    searchLabel: "Tìm kiếm",
    searchPlaceholder: "Tên hoặc phân loại",
    statusAll: "Tất cả",
    statusRunning: "Đang chạy",
    statusCompleted: "Đã chạy",
    statusUpcoming: "Sắp chạy",
    detailKicker: "Chi tiết launch",
    detailSub: "Tạo hoặc chọn launch trước khi phân tích.",
    boardKicker: "Danh sách theo trạng thái",
    helpActionBtn: "Giải thích các nút thao tác launch",
    helpActionTooltip: "Demo mode: nạp nhanh kịch bản mẫu để quay demo. Export report: tải báo cáo Markdown của launch hiện tại. Lưu launch: lưu metadata và brief sau khi bạn chỉnh. Chạy phân tích: gửi brief cho backend/AI để tạo readiness, phản biện, checklist và lưu vào lịch sử.",
    helpHistoryBtn: "Giải thích lịch sử phân tích",
    helpHistoryTooltip: "Mỗi lần bấm Chạy phân tích sẽ lưu một bản ghi. Bấm Mở lại để xem kết quả cũ và so sánh với lần mới.",
    actionDemo: "Demo mode",
    actionExport: "Tải báo cáo",
    actionSave: "Lưu launch",
    actionAnalyze: "Chạy phân tích",
    actionDelete: "Xóa launch",
    metricReadiness: "Mức sẵn sàng",
    metricHistory: "Lịch sử",
    metricLocal: "Lưu local",
    formTitle: "Thông tin launch",
    loadBadBrief: "Nạp Brief Mẫu",
    briefGuideTitle: "Brief nên nhập gì?",
    labelBriefContent: "Nội dung brief",
    labelName: "Tên launch",
    labelType: "Phân loại",
    labelStatus: "Trạng thái",
    labelOwner: "Người phụ trách",
    labelStart: "Start Launch",
    labelEnd: "End Launch",
    statusOptUpcoming: "Sắp chạy",
    statusOptRunning: "Đang chạy",
    statusOptCompleted: "Đã chạy",
    tabBrief: "Tóm tắt",
    tabAnalysis: "Phân tích",
    tabChecklist: "Việc cần làm",
    tabHistory: "Lịch sử",
    tabLessons: "Bài học",
    tabLog: "Log",
    vizKicker: "Friendly mode",
    vizTitle: "Visualize 5 bước trước khi launch",
    vizReplay: "Về bước 1",
    vizPrev: "Trước",
    vizNext: "Tiếp",
    vizSteps: ["Đọc brief", "Chấm điểm", "Phản biện", "Việc cần làm", "Bài học"],
    friendlyReady: "Sẵn sàng",
    friendlyIdleSpeech: "Đang chờ lệnh. Nếu bạn nhập gì, tôi sẽ gắn vào launch đang mở.",
    friendlyNoAnalysis: "Chưa phân tích",
    friendlyNoScore: "Chưa có điểm",
    friendlyNoLaunchTitle: "Chưa chọn launch",
    friendlyBriefGoal: 'Chọn một launch ở danh sách bên trái, kiểm tra brief, rồi bấm "Chạy phân tích".',
    friendlyBriefMissing: "Agent sẽ đọc phần còn thiếu sau khi có kết quả.",
    friendlyChatTitle: "Chat với Mission Control",
    friendlyChatSubtitle: "Chọn nhanh hoặc gõ từng ý để tạo/sửa launch.",
    friendlyTypedHint: "Gợi ý tiếp theo: chọn thao tác hoặc gõ trực tiếp cho Mission Control.",
    friendlyChatPlaceholder: "Gõ câu trả lời hoặc dán brief ở đây",
    friendlyChatSend: "Gửi",
    friendlyScoreGate: "Chưa có kết luận",
    friendlyScoreReason: "Chạy phân tích để xem lý do điểm, kết luận và phần còn thiếu.",
    friendlyMemo: "Kết quả phân tích đã sẵn sàng để team xử lý.",
    friendlyLessonText: "Bài học, rủi ro và quyết định sẽ được lưu lại để lần launch sau an toàn hơn.",
    friendlyLessonTitle: "Chat sau launch",
    friendlyLessonStatus: "Nhập kết quả sau launch trước, sau đó Agent mới đề xuất bài học.",
    friendlyLessonGate: "Chưa sẵn sàng",
    friendlyLessonPlaceholder: "Nhập kết quả sau launch ở đây",
    friendlyLessonSave: "Lưu kết quả / bài học",
    vizTitleReadiness: "Mức độ sẵn sàng",
    vizTitleRedteam: "Năm góc nhìn phản biện",
    vizTitleTasks: "Việc cần làm trước khi launch",
    vizTitleLessons: "Lưu quyết định và bài học",
    faPostResult: "Nhập kết quả sau launch",
    faPostReview: "Phân tích sau launch",
    faLesson: "Thêm bài học",
    faSaveLesson: "Lưu kết quả / bài học",
    kickerVerdict: "Kết luận",
    kickerNextActions: "Việc cần làm tiếp",
    scoreGuide0: "Chưa đủ dữ liệu",
    scoreGuide1: "Có nhắc tới nhưng chưa giao việc được",
    scoreGuide2: "Đủ rõ để chịu trách nhiệm",
    changeProduct: "Đổi sản phẩm",
    productKicker: "Chọn sản phẩm",
    productCreateLabel: "Tạo sản phẩm",
    productCreateHint: "Chỉ Admin",
    productCreateTitle: "Demo không cho tạo sản phẩm. Chỉ Admin mới được tạo.",
    productTitle: "Bạn đang vận hành sản phẩm nào?",
    productSubtitle: "Mỗi sản phẩm có bộ phân loại và template riêng. Chọn một sản phẩm để vào LaunchOps Command Center.",
    productDemoDesc: "Bản demo dùng chung — đầy đủ phân loại mẫu (game event, marketing, feature release...).",
    productDemoCta: "Vào →",
    productLockBadge: "Sắp có",
    productLockedTitle: "Sản Phẩm XYZ",
    productLockedDesc: "Bộ phân loại & template riêng cho Sản Phẩm XYZ. Đang khóa trong bản demo này.",
    productLockedCta: "Đã khóa",
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
    commCopyToast: "Dán link Bot vào nhóm Zalo mà bạn muốn mời",
    commZaloGroupNote: "(chưa chính thức có thể bị disable)",
    commPromptTitle: "Prompt khởi đầu cho Bot",
    commPromptStatus: "Gọi lcc_docs",
    commPromptHint: "Copy prompt này để Bot trả hướng dẫn LCC, ví dụ lệnh/tool và cách bắt đầu phân tích hoặc tạo launch.",
    commStarterPrompt: "lcc docs\nHãy giới thiệu đầy đủ nhưng gọn về LCC (LaunchOps Command Center): LCC là gì, luồng Brief -> Chấm điểm sẵn sàng (Green/Yellow/Red) -> Phản biện Red Team -> Checklist hành động -> Post-mortem -> Bài học kinh nghiệm. Sau đó liệt kê cách tôi có thể yêu cầu Bot hỗ trợ: phân tích rủi ro từ brief, liệt kê/xem/tạo/cập nhật/xóa launch, xem catalog sản phẩm/phân loại/template hợp lệ, và giải thích rõ phần cấu hình phân loại/template/sản phẩm là quyền Human Admin, Bot chỉ được đọc catalog. Cuối cùng liệt kê các tool/lệnh chính và khi nào dùng từng tool. Trả lời bằng tiếng Việt, có heading và bullet rõ ràng.",
    commPromptCopy: "Copy prompt"
  },
  en: {
    introKicker: "Demo Introduction",
    introTitle: "What is LaunchOps Command Center?",
    introSummary: "LaunchOps Command Center is a <strong>multi-agent command center</strong> that orchestrates specialized agents to manage <strong>launch risk</strong> before, during, and after campaigns, H5 events, features, or internal releases.",
    introBody: "This tool can be used directly in the <strong>Web UI</strong>, or integrated as a <strong>Bot Chat</strong> in <strong>Zalo, Discord, Telegram</strong>, and any communication app that supports <strong>OpenClaw / autonomous agentic frameworks</strong>.",
    introGoalTitle: "Main Objectives",
    introGoal1: "<strong>No more blind launches:</strong> teams instantly see if a launch is safe enough via Green / Yellow / Red states.",
    introGoal2: "<strong>Reduce launch day omissions:</strong> the system reminds you of easily forgotten items like owners, deadlines, tracking, dashboards, CS FAQs, rollback plans, and pause thresholds.",
    introGoal3: "<strong>Turn briefs into action:</strong> from a single launch description, the system automatically builds an owner-based checklist with deadlines and status tracking.",
    introGoal4: "<strong>Accumulate operational lessons:</strong> logs analysis history, post-launch results, and lessons learned to ensure future launches run even smoother.",
    introAgentTitle: "LaunchOps Command Center uses 6 core agents/modes",
    introAgent1Title: "1. Mission Control Agent",
    introAgent1Body: "Reads the brief, identifies the launch type, orchestrates other agents, and ensures the flow stays within LaunchOps context.",
    introAgent2Title: "2. Launch Readiness Agent",
    introAgent2Body: "Scores readiness based on a launch risk rubric, returning Green / Yellow / Red status and readiness scores.",
    introAgent3Title: "3. Red Team Agent",
    introAgent3Body: "Challenges the launch from multiple perspectives including user, tech, CS, business, and LiveOps to spot risks beforehand.",
    introAgent4Title: "4. Checklist Agent",
    introAgent4Body: "Generates step-by-step tasks for pre-launch, launch day, running phase, and post-launch with owners, deadlines, and status.",
    introAgent5Title: "5. Post-mortem & Lessons Agent",
    introAgent5Body: "Suggests wrap-up questions, saves real-world outcomes and lessons learned to prevent repeating past mistakes.",
    introAgent6Title: "6. LaunchOps Assistant / Channel Agent",
    introAgent6Body: "Bot Chat that explains, creates launches, navigates the Web UI, and can extend to Zalo, Discord, Telegram, or communication apps that support OpenClaw / autonomous agentic frameworks.",
    introValueTitle: "Real-world Value",
    introValueBody: "LaunchOps Command Center turns a vague launch brief into a clear operational pipeline: with a score, identified risks, owner-based checklist, and lessons learned.",
    introBtn: "Enter Demo",
    closeIntro: "Close",
    eyebrow: "V-Team · VinhVNN · GS9",
    title: "LaunchOps Command Center",
    roleLabel: "Role",
    newLaunch: "New Launch",
    openTemplateConfig: "Classification Config",
    statusFilterLabel: "Status",
    searchLabel: "Search",
    searchPlaceholder: "Name or type",
    statusAll: "All",
    statusRunning: "Running",
    statusCompleted: "Completed",
    statusUpcoming: "Upcoming",
    detailKicker: "Launch details",
    detailSub: "Create or select a launch to start analysis.",
    boardKicker: "Launches by Status",
    helpActionBtn: "Explain action buttons",
    helpActionTooltip: "Demo mode: load a mock brief to record a demo. Export report: download the Markdown report for this launch. Save launch: save metadata and brief. Run Analysis: send brief to backend/AI to generate readiness, red team, and checklist.",
    helpHistoryBtn: "Explain analysis history",
    helpHistoryTooltip: "Every Run Analysis click saves a record. Click Reopen to load history and compare with the latest run.",
    actionDemo: "Demo mode",
    actionExport: "Export report",
    actionSave: "Save launch",
    actionAnalyze: "Run analysis",
    actionDelete: "Delete launch",
    metricReadiness: "Readiness",
    metricHistory: "History",
    metricLocal: "Saved locally",
    formTitle: "Launch info",
    loadBadBrief: "Load Sample Brief",
    briefGuideTitle: "What should the brief include?",
    labelBriefContent: "Brief content",
    labelName: "Launch name",
    labelType: "Type",
    labelStatus: "Status",
    labelOwner: "Owner",
    labelStart: "Start Launch",
    labelEnd: "End Launch",
    statusOptUpcoming: "Upcoming",
    statusOptRunning: "Running",
    statusOptCompleted: "Completed",
    tabBrief: "Brief",
    tabAnalysis: "Analysis",
    tabChecklist: "To-do",
    tabHistory: "History",
    tabLessons: "Lessons",
    tabLog: "Log",
    vizKicker: "Friendly mode",
    vizTitle: "Visualize the 5 pre-launch steps",
    vizReplay: "Back to step 1",
    vizPrev: "Back",
    vizNext: "Next",
    vizSteps: ["Read brief", "Scoring", "Red team", "To-do", "Lessons"],
    friendlyReady: "Ready",
    friendlyIdleSpeech: "Waiting for a command. If you type something, I will attach it to the open launch.",
    friendlyNoAnalysis: "No analysis yet",
    friendlyNoScore: "No score yet",
    friendlyNoLaunchTitle: "No launch selected",
    friendlyBriefGoal: 'Pick a launch from the left, review the brief, then click "Run analysis".',
    friendlyBriefMissing: "The Agent will read missing parts once results are available.",
    friendlyChatTitle: "Chat with Mission Control",
    friendlyChatSubtitle: "Use quick actions or type step by step to create/edit a launch.",
    friendlyTypedHint: "Next hint: pick an action or type directly to Mission Control.",
    friendlyChatPlaceholder: "Type an answer or paste the brief here",
    friendlyChatSend: "Send",
    friendlyScoreGate: "No verdict yet",
    friendlyScoreReason: "Run analysis to see score reasons, verdict, and missing parts.",
    friendlyMemo: "The analysis result is ready for the team to act on.",
    friendlyLessonText: "Lessons, risks, and decisions will be saved so the next launch is safer.",
    friendlyLessonTitle: "Post-launch chat",
    friendlyLessonStatus: "Enter post-launch results first, then the Agent will suggest lessons.",
    friendlyLessonGate: "Not ready",
    friendlyLessonPlaceholder: "Enter post-launch results here",
    friendlyLessonSave: "Save results / lessons",
    vizTitleReadiness: "Readiness level",
    vizTitleRedteam: "Five red-team perspectives",
    vizTitleTasks: "Tasks before launch",
    vizTitleLessons: "Save decisions & lessons",
    faPostResult: "Enter post-launch results",
    faPostReview: "Post-launch analysis",
    faLesson: "Add a lesson",
    faSaveLesson: "Save results / lessons",
    kickerVerdict: "Verdict",
    kickerNextActions: "Next actions",
    scoreGuide0: "Not enough data",
    scoreGuide1: "Mentioned but not actionable",
    scoreGuide2: "Clear enough to be owned",
    changeProduct: "Switch product",
    productKicker: "Select product",
    productCreateLabel: "Create Product",
    productCreateHint: "Admin only",
    productCreateTitle: "Product creation is locked in Demo. Only an Admin can create products.",
    productTitle: "Which product are you operating?",
    productSubtitle: "Each product has its own classifications and templates. Pick one to enter LaunchOps Command Center.",
    productDemoDesc: "Shared demo build — full sample classifications (game event, marketing, feature release...).",
    productDemoCta: "Enter →",
    productLockBadge: "Coming soon",
    productLockedTitle: "Product XYZ",
    productLockedDesc: "Dedicated classifications & templates for Product XYZ. Locked in this demo.",
    productLockedCta: "Locked",
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
    commCopyToast: "Paste the Bot link into the Zalo group you want to invite",
    commZaloGroupNote: "(not official yet, may be disabled)",
    commPromptTitle: "Starter prompt for the Bot",
    commPromptStatus: "Calls lcc_docs",
    commPromptHint: "Copy this prompt so the Bot returns the LCC guide, command/tool examples, and how to start analyzing or creating a launch.",
    commStarterPrompt: "lcc docs\nIntroduce LCC (LaunchOps Command Center) fully but concisely: what LCC is, the Brief -> Readiness scoring (Green/Yellow/Red) -> Red Team review -> Action checklist -> Post-mortem -> Lessons learned flow. Then list how I can ask the Bot for help: analyze launch risk from a brief, list/view/create/update/delete launches, view the valid product/classification/template catalog, and clearly explain that product/classification/template configuration is Human Admin only while the Bot may only read the catalog. Finally list the main tools/commands and when to use each tool. Reply in English with clear headings and bullets.",
    commPromptCopy: "Copy prompt"
  }
};

// Generic tooltip translations (VI canonical -> EN). The DOM keeps VI in HTML;
// applyCleanTranslations snapshots the original VI once and maps to EN per language.
const TOOLTIP_I18N = {
  "Mức sẵn sàng: tổng điểm theo cấu hình phân loại hiện tại, điểm thấp nghĩa là brief còn thiếu dữ liệu để launch an toàn. Lịch sử: số lần đã phân tích và số bài học đã lưu sau launch.": "Readiness: total score from the current classification config; a low score means the brief lacks data for a safe launch. History: how many times this launch was analyzed and how many lessons were saved.",
  "3 việc ưu tiên nhất cần xử lý trước khi launch. Đây là phần để team biết sửa gì trước, không phải toàn bộ checklist.": "The 3 top-priority items to handle before launch. This shows the team what to fix first, not the full checklist.",
  "AI đọc lịch sử phân tích và bài học đã lưu để đề xuất sửa template. Bản demo hiện mở quyền duyệt để bạn áp dụng trực tiếp.": "AI reads analysis history and saved lessons to suggest template edits. Approval is open in this demo so you can apply suggestions directly.",
  "Bản demo này mô phỏng người thao tác ở frontend. Khi lên production, danh sách này phải nối với đăng nhập thật hoặc quyền backend.": "This demo simulates operators on the frontend. In production, this list should connect to real authentication or backend permissions.",
  "Checklist biến phân tích thành việc cụ thể: làm gì, ai phụ trách, hạn nào, trạng thái ra sao và mức rủi ro thế nào.": "The checklist turns analysis into concrete tasks: what to do, who owns it, the deadline, the status, and the risk level.",
  "Chọn loại launch để Agent hiểu ngữ cảnh: game event, marketing, feature release, internal tool hoặc hotfix.": "Pick the launch type so the Agent understands the context: game event, marketing, feature release, internal tool, or hotfix.",
  "Bản demo hiện mở full quyền thao tác: xem Log, sửa launch, chỉnh template và duyệt đề xuất đều dùng được.": "This demo opens full operator access: logs, launch edits, template editing, and suggestion approval are all available.",
  "Demo mode: nạp nhanh kịch bản mẫu để quay demo. Export report: tải báo cáo Markdown của launch hiện tại. Lưu launch: lưu metadata và brief sau khi bạn chỉnh. Chạy phân tích: gửi brief cho backend/AI để tạo readiness, phản biện, checklist và lưu vào lịch sử.": "Demo mode: quickly load a sample scenario for recording. Export report: download the Markdown report for this launch. Save launch: save metadata and brief after edits. Run analysis: send the brief to the backend/AI to generate readiness, red team, and checklist, and save it to history.",
  "Dán brief thô vào đây. Nếu chưa biết viết gì, bấm Nạp Brief Mẫu để xem ví dụ một brief còn thiếu dữ liệu.": "Paste the raw brief here. Not sure what to write? Click Load Sample Brief to see an example of an incomplete brief.",
  "Hệ thống đối chiếu từ khóa trong brief với kho bài học và snapshot sản phẩm (SQLite) để lôi ra kinh nghiệm cũ liên quan. Đây là phần tri thức RAG hỗ trợ quyết định, không phải kết quả chấm điểm.": "The system matches keywords in the brief against the lessons store and product snapshots (SQLite) to surface relevant past experience. This is RAG knowledge that supports the decision, not a scoring result.",
  "Kết luận tổng hợp cho biết launch nên chạy, giữ lại để sửa hay dừng. Dựa trên tổng điểm và các rủi ro thiếu dữ liệu.": "The overall verdict tells you whether to launch, hold to fix, or stop — based on the total score and missing-data risks.",
  "Mỗi lần bấm Chạy phân tích sẽ lưu một bản ghi. Bấm Mở lại để xem kết quả cũ và so sánh với lần mới.": "Every Run Analysis click saves a record. Click Reopen to view a past result and compare it with the latest run.",
  "Mỗi nhóm được chấm 0-2 điểm. Mục này giúp biết brief thiếu phần nào và cần bổ sung gì để đạt 2/2.": "Each group is scored 0-2. This shows which parts of the brief are weak and what to add to reach 2/2.",
  "Mỗi phân loại launch dùng một bộ luật đánh giá. Bạn có thể đổi tên phân loại, chọn template gốc, rồi chỉnh nhóm rủi ro, phản biện, checklist và câu hỏi bài học.": "Each launch type uses its own scoring rules. You can rename the type, pick a base template, then edit the risk groups, red team, checklist, and lesson questions.",
  "Ngày giờ bắt đầu launch (dd/mm/yyyy hh:mm — bắt buộc có giờ phút). Bấm biểu tượng lịch để chọn nhanh.": "Launch start date & time (dd/mm/yyyy hh:mm — time is required). Click the calendar icon to pick quickly.",
  "Ngày giờ kết thúc hoặc tổng kết launch (dd/mm/yyyy hh:mm — bắt buộc có giờ phút). Bấm biểu tượng lịch để chọn nhanh.": "Launch end or wrap-up date & time (dd/mm/yyyy hh:mm — time is required). Click the calendar icon to pick quickly.",
  "Người hoặc team chịu trách nhiệm chính cho launch. Có thể là PM LiveOps, Tech Lead, CS Lead hoặc Business Owner.": "The person or team mainly responsible for the launch — e.g. PM LiveOps, Tech Lead, CS Lead, or Business Owner.",
  "Nhóm phản biện giả lập nhiều góc nhìn như người dùng bức xúc, người tìm cách lách luật, CS, kỹ thuật và kinh doanh để bắt rủi ro trước launch.": "The red team simulates multiple perspectives — frustrated users, exploiters, CS, tech, and business — to catch risks before launch.",
  "Nhật ký từng agent trong pipeline (readiness, red team, checklist, post-mortem): trạng thái, nguồn rule/LLM và model định tuyến. Mở JSON đầy đủ để debug hoặc làm bằng chứng multi-agent.": "Log of each agent in the pipeline (readiness, red team, checklist, post-mortem): status, rule/LLM source, and routed model. Open the full JSON to debug or as multi-agent evidence.",
  "Nhật ký từng bước của mỗi lần chạy phân tích cho launch này: client gọi gì, agent nào chạy, model nào, fallback ở đâu. Bản demo hiện mở Log cho mọi vai trò.": "Step-by-step log of each analysis run for this launch: what the client called, which agent ran, which model, and where it fell back. Logs are visible to all roles in this demo.",
  "Sau khi launch xong, dùng phần này để ghi kết quả thật và bài học. Lần sau Agent có thể dùng lại bài học này.": "After the launch, use this to record real results and lessons. The Agent can reuse these lessons next time.",
  "Sắp chạy: còn chuẩn bị. Đang chạy: đang active hoặc sát giờ. Đã chạy: dùng để lưu kết quả và bài học.": "Upcoming: still preparing. Running: active or near go-time. Completed: used to save results and lessons.",
  "Số lần đã phân tích launch này và số bài học đã lưu sau launch. Dùng để xem lại quyết định cũ.": "How many times this launch was analyzed and how many lessons were saved. Use it to review past decisions.",
  "Tên ngắn để phân biệt launch này với các launch khác, ví dụ Golden Spin Weekend.": "A short name to tell this launch apart from others, e.g. Golden Spin Weekend.",
  "Tổng điểm được tính theo cấu hình phân loại hiện tại. Điểm thấp nghĩa là brief còn thiếu dữ liệu để launch an toàn.": "The total score computed from the current classification config. A low score means the brief lacks data for a safe launch.",
  "Điền metadata ngắn để Agent hiểu đây là launch gì, ai phụ trách, bắt đầu/kết thúc ngày giờ nào và đang ở trạng thái nào.": "Fill in short metadata so the Agent knows what this launch is, who owns it, its start/end date and time, and its current status."
};

// Generic static plain-text translations (VI canonical -> EN). Only applied to elements
// with no child nodes whose VI text matches a key; everything else is left untouched.
const STATIC_TEXT_I18N = {
  "3 việc cần xử lý trước": "Top 3 things to fix first",
  "Các góc nhìn phản biện": "Red-team perspectives",
  "Điểm theo nhóm rủi ro": "Score by risk group",
  "Danh sách việc cần làm": "To-do list",
  "Các lần đã phân tích": "Past analyses",
  "Câu hỏi sau launch": "Post-launch questions",
  "Log chạy phân tích": "Analysis run log",
  "Điểm readiness": "Readiness score",
  "AI đề xuất cập nhật template": "AI template suggestions",
  "Đề xuất cải tiến": "Improvement suggestions",
  "Cách đọc điểm": "How to read the score",
  "Mỗi nhóm tối đa 2 điểm. Điểm càng thấp nghĩa là brief càng thiếu dữ liệu để team ra quyết định launch.": "Each group scores up to 2. A lower score means the brief lacks data for the team to decide on the launch."
};

const CONFIG_TEXT = {
  vi: {
    kicker: "Cấu hình phân loại",
    title: "Cách Agent đánh giá từng phân loại",
    reset: "Nạp mẫu chuẩn",
    save: "Lưu cấu hình chung",
    operator: "Người đang thao tác",
    selectedType: "Phân loại đang cấu hình",
    templateDefault: "Template mặc định",
    maxScore: "Điểm tối đa",
    riskGroups: "Nhóm rủi ro",
    personas: "Góc phản biện",
    tabs: ["Phân loại", "Rủi ro", "Phản biện", "Checklist", "Bài học", "Người thao tác"],
    catalogKicker: "Cấu hình chung",
    catalogTitle: "Phân loại & template gốc",
    quickTitle: "Cách hiểu nhanh",
    quickBody: '<b>Phân loại</b> là loại launch người dùng chọn, ví dụ Sự kiện game hoặc Ra mắt tính năng. <b>Template</b> là bộ luật đánh giá mà phân loại đó dùng. Một template có thể dùng lại cho nhiều phân loại.',
    templateHelp: "Template là bộ luật đánh giá. Tạo template mới khi bạn muốn một bộ luật khác hẳn các mẫu có sẵn.",
    addTemplate: "Thêm template",
    typeKicker: "Phân loại launch",
    typeHelp: "Phân loại là lựa chọn bên ngoài form launch. Mỗi phân loại sẽ trỏ tới một template để Agent biết dùng bộ luật nào.",
    addType: "Thêm phân loại",
    riskKicker: "Khung rủi ro",
    riskTitle: "Nhóm rủi ro",
    addRisk: "Thêm nhóm",
    scoreTitle: "Cách hiểu điểm tối đa",
    scoreBody: "Mỗi nhóm rủi ro có một điểm tối đa riêng. Tổng readiness bằng tổng điểm của tất cả nhóm rủi ro, không cố định 12. Agent dựa vào tiêu chí đạt điểm, từ khóa demo local và nội dung brief để chấm từ 0 đến điểm tối đa của nhóm đó.",
    personaKicker: "Nhóm phản biện",
    personaTitle: "Góc phản biện",
    addPersona: "Thêm người phản biện",
    checklistKicker: "Thực thi",
    checklistTitle: "Checklist mẫu",
    addChecklist: "Thêm việc",
    lessonKicker: "Bài học",
    lessonTitle: "Câu hỏi bài học",
    addLesson: "Thêm block",
    operatorKicker: "Người thao tác",
    operatorTitle: "Danh sách người thao tác",
    formatKicker: "Format dữ liệu",
    formatTitle: "Cấu hình là gì?",
    formatBody: "Cấu hình là một template JSON gồm 4 phần. Người dùng thường không cần thấy JSON; form sẽ tự đổi thành đúng format cho Agent.",
    formatBlocks: ["1. Nhóm rủi ro", "2. Góc phản biện", "3. Checklist mẫu", "4. Bài học"],
    personaCode: "vai trò, lo ngại, dấu hiệu, cách xử lý",
    versionKicker: "Version history",
    versionTitle: "Lịch sử template",
    versionBody: "Mỗi lần lưu cấu hình, app tạo một snapshot version cho phân loại đang cấu hình.",
    runLogKicker: "Log phiên",
    runLogTitle: "Nhật ký chạy phân tích",
    runLogBody: "Xóa toàn bộ sự kiện client của launch đang chọn trong phiên hiện tại. Không ảnh hưởng server trace đã lưu. Xem chi tiết ở tab Log.",
    clearLog: "Xóa log phiên"
  },
  en: {
    kicker: "Classification Config",
    title: "How the Agent scores each classification",
    reset: "Load standard template",
    save: "Save shared config",
    operator: "Current operator",
    selectedType: "Classification being configured",
    templateDefault: "Default template",
    maxScore: "Max score",
    riskGroups: "Risk groups",
    personas: "Red-team perspectives",
    tabs: ["Classification", "Risk", "Red team", "Checklist", "Lessons", "Operators"],
    catalogKicker: "Shared config",
    catalogTitle: "Classification & base template",
    quickTitle: "Quick mental model",
    quickBody: '<b>Classification</b> is what the user picks on the launch form, such as Game event or Feature release. <b>Template</b> is the scoring rule set used by that classification. One template can be reused by multiple classifications.',
    templateHelp: "A template is a scoring rule set. Create a new template when you need rules that are clearly different from the existing presets.",
    addTemplate: "Add template",
    typeKicker: "Launch classification",
    typeHelp: "Classification is the external choice on the launch form. Each classification points to a template so the Agent knows which rule set to use.",
    addType: "Add classification",
    riskKicker: "Risk rubric",
    riskTitle: "Risk groups",
    addRisk: "Add group",
    scoreTitle: "How max score works",
    scoreBody: "Each risk group has its own max score. Total readiness is the sum of all risk-group scores, not a fixed 12. The Agent uses scoring criteria, local-demo keywords, and the brief to score from 0 up to that group's max score.",
    personaKicker: "Red-team group",
    personaTitle: "Red-team perspectives",
    addPersona: "Add reviewer",
    checklistKicker: "Execution",
    checklistTitle: "Checklist template",
    addChecklist: "Add task",
    lessonKicker: "Lessons",
    lessonTitle: "Lesson questions",
    addLesson: "Add block",
    operatorKicker: "Operators",
    operatorTitle: "Operator list",
    formatKicker: "Data format",
    formatTitle: "What is config?",
    formatBody: "Config is a template JSON with 4 sections. Users usually do not need to see JSON; the form converts changes into the correct Agent format.",
    formatBlocks: ["1. Risk groups", "2. Red-team perspectives", "3. Checklist template", "4. Lessons"],
    personaCode: "role, concern, evidence, fix",
    versionKicker: "Version history",
    versionTitle: "Template history",
    versionBody: "Every time config is saved, the app creates a version snapshot for the classification currently being configured.",
    runLogKicker: "Session log",
    runLogTitle: "Analysis run log",
    runLogBody: "Clear all client events for the selected launch in the current session. Saved server traces are not affected. See details in the Log tab.",
    clearLog: "Clear session log"
  }
};

const HELP_LABEL_I18N = {
  "Giải thích mức sẵn sàng và lịch sử": "Explain readiness and history",
  "Giải thích thông tin launch": "Explain launch information",
  "Giải thích tên launch": "Explain launch name",
  "Giải thích phân loại": "Explain classification",
  "Giải thích trạng thái launch": "Explain launch status",
  "Giải thích người phụ trách": "Explain owner",
  "Giải thích Start Launch": "Explain Start Launch",
  "Giải thích End Launch": "Explain End Launch",
  "Giải thích các nút thao tác launch": "Explain launch actions",
  "Giải thích nội dung brief": "Explain brief content",
  "Giải thích kết luận": "Explain conclusion",
  "Giải thích việc cần làm tiếp": "Explain next actions",
  "Giải thích phản biện rủi ro": "Explain risk red-team review",
  "Giải thích nhóm rủi ro": "Explain risk groups",
  "Giải thích RAG insights": "Explain RAG insights",
  "Giải thích danh sách việc cần làm": "Explain checklist",
  "Giải thích lịch sử phân tích": "Explain analysis history",
  "Giải thích log chạy": "Explain run log",
  "Giải thích agents trace": "Explain agents trace",
  "Giải thích câu hỏi sau launch": "Explain post-launch questions",
  "Giải thích AI đề xuất cập nhật template": "Explain AI template-update proposals",
  "Giải thích cấu hình phân loại": "Explain classification config",
  "Giải thích người đang thao tác": "Explain active operator"
};

let activeLang = localStorage.getItem("launchops_lang") || "vi";

function applyCleanTranslations(lang) {
  activeLang = lang;
  localStorage.setItem("launchops_lang", lang);
  document.documentElement.setAttribute("lang", lang);
  const dict = CLEAN_I18N_DICT[lang];

  // Generic tooltip translator: snapshot the original VI tooltip once, then map per language.
  document.querySelectorAll("[data-tooltip]").forEach((el) => {
    if (el.closest("#readinessMetric")) return; // built dynamically (language-aware) by app.js
    if (!el.dataset.tipVi) el.dataset.tipVi = el.getAttribute("data-tooltip");
    if (!el.dataset.labelVi) el.dataset.labelVi = el.getAttribute("aria-label") || "";
    const vi = el.dataset.tipVi;
    el.setAttribute("data-tooltip", lang === "en" ? (TOOLTIP_I18N[vi] || vi) : vi);
    const labelVi = el.dataset.labelVi;
    if (labelVi) el.setAttribute("aria-label", lang === "en" ? (HELP_LABEL_I18N[labelVi] || labelVi) : labelVi);
  });

  // Update language buttons active class
  const viBtn = document.getElementById("langViBtn");
  const enBtn = document.getElementById("langEnBtn");
  if (viBtn) viBtn.classList.toggle("active", lang === "vi");
  if (enBtn) enBtn.classList.toggle("active", lang === "en");
  const introViBtn = document.getElementById("introLangViBtn");
  const introEnBtn = document.getElementById("introLangEnBtn");
  if (introViBtn) {
    introViBtn.classList.toggle("active", lang === "vi");
    introViBtn.setAttribute("aria-pressed", lang === "vi" ? "true" : "false");
  }
  if (introEnBtn) {
    introEnBtn.classList.toggle("active", lang === "en");
    introEnBtn.setAttribute("aria-pressed", lang === "en" ? "true" : "false");
  }

  // Topbar
  const h1 = document.querySelector(".topbar h1");
  if (h1) h1.textContent = dict.title;
  const eyebrow = document.querySelector(".topbar .eyebrow");
  if (eyebrow) eyebrow.textContent = dict.eyebrow;

  const roleLabelSpan = document.querySelector(".role-label");
  if (roleLabelSpan) {
    const help = roleLabelSpan.querySelector(".help-button");
    roleLabelSpan.innerHTML = dict.roleLabel + " ";
    if (help) roleLabelSpan.appendChild(help);
  }

  const openConfig = document.getElementById("openTemplateConfig");
  if (openConfig) openConfig.textContent = dict.openTemplateConfig;

  const newL = document.getElementById("newLaunch");
  if (newL) newL.textContent = dict.newLaunch;

  // Board filters & search
  const bKicker = document.querySelector(".board-head .section-kicker");
  if (bKicker) bKicker.textContent = dict.boardKicker;

  const searchSpan = document.querySelector(".board-search span");
  if (searchSpan) searchSpan.textContent = dict.searchLabel;
  const searchInput = document.getElementById("launchSearch");
  if (searchInput) searchInput.setAttribute("placeholder", dict.searchPlaceholder);

  const statusSpan = document.querySelector(".board-status-filter span");
  if (statusSpan) statusSpan.textContent = dict.statusFilterLabel;

  const statusSelect = document.getElementById("launchStatusFilter");
  if (statusSelect) {
    statusSelect.options[0].text = dict.statusAll;
    statusSelect.options[1].text = dict.statusRunning;
    statusSelect.options[2].text = dict.statusCompleted;
    statusSelect.options[3].text = dict.statusUpcoming;
  }

  // Detail header kicker & title default
  const dKicker = document.querySelector(".detail-hero .section-kicker");
  if (dKicker) dKicker.textContent = dict.detailKicker;
  const detailSub = document.getElementById("detailSub");
  if (detailSub && (detailSub.textContent.includes("Tạo hoặc chọn") || detailSub.textContent.includes("Create or select"))) {
    detailSub.textContent = dict.detailSub;
  }

  // Intro Modal clean DOM translation
  const introModal = document.getElementById("introModal");
  if (introModal) {
    const k = introModal.querySelector(".section-kicker");
    if (k) k.textContent = dict.introKicker;

    const t = document.getElementById("introTitle");
    if (t) t.textContent = dict.introTitle;

    const s = document.getElementById("introSummary");
    if (s) s.innerHTML = dict.introSummary;

    // Second paragraph of body
    const bodyP = introModal.querySelector(".intro-content > p:not(#introSummary)");
    if (bodyP) bodyP.innerHTML = dict.introBody;

    // Grid sections
    const secHeaders = introModal.querySelectorAll(".intro-section h3");
    if (secHeaders.length >= 3) {
      secHeaders[0].textContent = dict.introGoalTitle;
      secHeaders[1].textContent = dict.introAgentTitle;
      secHeaders[2].textContent = dict.introValueTitle;
    }

    const goalListItems = introModal.querySelectorAll(".intro-list li");
    if (goalListItems.length >= 4) {
      goalListItems[0].innerHTML = dict.introGoal1;
      goalListItems[1].innerHTML = dict.introGoal2;
      goalListItems[2].innerHTML = dict.introGoal3;
      goalListItems[3].innerHTML = dict.introGoal4;
    }

    const agentRows = introModal.querySelectorAll(".intro-agent-row");
    if (agentRows.length >= 6) {
      const rowData = [
        [dict.introAgent1Title, dict.introAgent1Body],
        [dict.introAgent2Title, dict.introAgent2Body],
        [dict.introAgent3Title, dict.introAgent3Body],
        [dict.introAgent4Title, dict.introAgent4Body],
        [dict.introAgent5Title, dict.introAgent5Body],
        [dict.introAgent6Title, dict.introAgent6Body]
      ];
      agentRows.forEach((row, idx) => {
        const strong = row.querySelector("strong");
        if (strong) strong.textContent = rowData[idx][0];
        const span = row.querySelector("span");
        if (span) span.textContent = rowData[idx][1];
      });
    }

    const valP = introModal.querySelector(".intro-section:nth-of-type(3) p");
    if (valP) valP.textContent = dict.introValueBody;

    const closeBtn = document.getElementById("closeIntroModal");
    if (closeBtn) closeBtn.setAttribute("aria-label", dict.closeIntro);

    const enterBtn = document.getElementById("enterDemoFromIntro");
    if (enterBtn) enterBtn.textContent = dict.introBtn;
  }

  // Help buttons tooltip & labels
  const actHelpBtn = document.querySelector(".action-help");
  if (actHelpBtn) {
    actHelpBtn.setAttribute("aria-label", dict.helpActionBtn);
  }
  const histHelpBtn = document.querySelector("#historyView .help-button");
  if (histHelpBtn) {
    histHelpBtn.setAttribute("aria-label", dict.helpHistoryBtn);
  }

  // Action buttons. force=true sets the label even when the button is disabled,
  // so VI/EN is correct right at load. analyzeBrief is still skipped while analyzing.
  const setButtonText = (id, text, force) => {
    const btn = document.getElementById(id);
    if (btn && (force || !btn.disabled)) btn.textContent = text;
  };
  setButtonText("demoMode", dict.actionDemo, true);
  setButtonText("exportReport", dict.actionExport, true);
  setButtonText("saveLaunch", dict.actionSave, true);
  if (!document.body.classList.contains("is-analyzing")) setButtonText("analyzeBrief", dict.actionAnalyze, true);
  setButtonText("deleteLaunch", dict.actionDelete, true);

  // Hero metrics labels (giữ help-button bên trong span)
  const setLabelKeepHelp = (span, text) => {
    if (!span) return;
    const help = span.querySelector(".help-button");
    span.textContent = `${text} `;
    if (help) span.appendChild(help);
  };
  setLabelKeepHelp(document.querySelector("#readinessMetric > span"), dict.metricReadiness);
  const historyMetric = document.querySelector(".hero-metrics .metric:nth-child(2)");
  if (historyMetric) {
    setLabelKeepHelp(historyMetric.querySelector(":scope > span"), dict.metricHistory);
    const localNote = historyMetric.querySelector(":scope > small");
    if (localNote) localNote.textContent = dict.metricLocal;
  }

  // Form thông tin launch
  const formTitle = document.querySelector("#briefView .card-head .title-row h3");
  if (formTitle) formTitle.textContent = dict.formTitle;
  setButtonText("loadBadBrief", dict.loadBadBrief, true);
  const briefGuideTitleEl = document.querySelector(".brief-guide strong");
  if (briefGuideTitleEl) briefGuideTitleEl.textContent = dict.briefGuideTitle;
  if (typeof window.renderBriefGuide === "function") window.renderBriefGuide();
  const fieldLabel = (inputId) => document.getElementById(inputId)?.closest(".field")?.querySelector(":scope > span");
  setLabelKeepHelp(fieldLabel("launchName"), dict.labelName);
  setLabelKeepHelp(fieldLabel("launchType"), dict.labelType);
  setLabelKeepHelp(fieldLabel("launchStatus"), dict.labelStatus);
  setLabelKeepHelp(fieldLabel("launchOwner"), dict.labelOwner);
  setLabelKeepHelp(fieldLabel("launchTargetDate"), dict.labelStart);
  setLabelKeepHelp(fieldLabel("launchEndDate"), dict.labelEnd);
  setLabelKeepHelp(fieldLabel("briefInput"), dict.labelBriefContent);
  const launchStatusSelect = document.getElementById("launchStatus");
  if (launchStatusSelect) {
    [...launchStatusSelect.options].forEach((opt) => {
      if (opt.value === "upcoming") opt.text = dict.statusOptUpcoming;
      if (opt.value === "running") opt.text = dict.statusOptRunning;
      if (opt.value === "completed") opt.text = dict.statusOptCompleted;
    });
  }

  // Tabs theo data-view
  const tabDict = {
    briefView: dict.tabBrief,
    redTeam: dict.tabAnalysis,
    checklist: dict.tabChecklist,
    history: dict.tabHistory,
    lessons: dict.tabLessons,
    runLog: dict.tabLog
  };
  document.querySelectorAll(".tabs .tab").forEach((tab) => {
    const text = tabDict[tab.dataset.view];
    if (text) tab.textContent = text;
  });

  // Friendly visualize statics
  const vizKicker = document.querySelector(".friendly-viz-kicker");
  if (vizKicker) vizKicker.textContent = dict.vizKicker;
  const vizTitle = document.querySelector(".friendly-viz-head h3");
  if (vizTitle) vizTitle.textContent = dict.vizTitle;
  setButtonText("friendlyVizReplay", dict.vizReplay);
  setButtonText("friendlyVizPrev", dict.vizPrev);
  setButtonText("friendlyVizNext", dict.vizNext);
  document.querySelectorAll("#friendlyVisualize .friendly-viz-step b").forEach((label, index) => {
    if (dict.vizSteps[index]) label.textContent = dict.vizSteps[index];
  });

  // Friendly chat + visualize defaults. Do not overwrite real analysis/LLM output:
  // only replace known initial/fallback copy.
  const setFriendlyTextById = (id, text, defaults) => {
    const el = document.getElementById(id);
    if (!el || !text) return;
    if (!defaults || defaults.some((value) => el.textContent.trim() === value)) el.textContent = text;
  };
  const defaultText = (...keys) => keys.flatMap((key) => [CLEAN_I18N_DICT.vi[key], CLEAN_I18N_DICT.en[key]]).filter(Boolean);
  setFriendlyTextById("friendlyVizAgentName", dict.friendlyReady, defaultText("friendlyReady"));
  setFriendlyTextById("friendlyVizSpeech", dict.friendlyIdleSpeech, defaultText("friendlyIdleSpeech"));
  setFriendlyTextById("friendlyVizVerdict", dict.friendlyNoAnalysis, defaultText("friendlyNoAnalysis"));
  setFriendlyTextById("friendlyVizScore", dict.friendlyNoScore, defaultText("friendlyNoScore"));
  setFriendlyTextById("friendlyVizBriefTitle", dict.friendlyNoLaunchTitle, defaultText("friendlyNoLaunchTitle"));
  setFriendlyTextById("friendlyVizBriefGoal", dict.friendlyBriefGoal, defaultText("friendlyBriefGoal"));
  setFriendlyTextById("friendlyVizBriefMissing", dict.friendlyBriefMissing, defaultText("friendlyBriefMissing"));
  setFriendlyTextById("friendlyVizTyped", dict.friendlyTypedHint, defaultText("friendlyTypedHint"));
  setFriendlyTextById("friendlyVizScoreDecision", dict.friendlyNoAnalysis, defaultText("friendlyNoAnalysis"));
  setFriendlyTextById("friendlyVizScoreGate", dict.friendlyScoreGate, defaultText("friendlyScoreGate"));
  setFriendlyTextById("friendlyVizScoreReason", dict.friendlyScoreReason, defaultText("friendlyScoreReason"));
  setFriendlyTextById("friendlyVizMemo", dict.friendlyMemo, defaultText("friendlyMemo"));
  setFriendlyTextById("friendlyVizLessonText", dict.friendlyLessonText, defaultText("friendlyLessonText"));
  setFriendlyTextById("friendlyLessonStatusText", dict.friendlyLessonStatus, defaultText("friendlyLessonStatus"));
  setFriendlyTextById("friendlyLessonGate", dict.friendlyLessonGate, defaultText("friendlyLessonGate"));

  const chatHead = document.querySelector(".friendly-chat .friendly-chat-head");
  if (chatHead) {
    const title = chatHead.querySelector("b");
    const subtitle = chatHead.querySelector("span");
    if (title) title.textContent = dict.friendlyChatTitle;
    if (subtitle) subtitle.textContent = dict.friendlyChatSubtitle;
  }
  const chatInput = document.getElementById("friendlyChatInput");
  if (chatInput && defaultText("friendlyChatPlaceholder").includes(chatInput.placeholder.trim())) {
    chatInput.placeholder = dict.friendlyChatPlaceholder;
  }
  setButtonText("friendlyChatSend", dict.friendlyChatSend, true);
  setButtonText("friendlyLoadBadBrief", dict.loadBadBrief, true);
  setButtonText("friendlySaveLaunch", dict.actionSave, true);
  setButtonText("friendlyAnalyzeBrief", dict.actionAnalyze, true);

  const lessonHead = document.querySelector(".friendly-lesson-chat .friendly-lesson-head");
  if (lessonHead) {
    const title = lessonHead.querySelector("b");
    if (title) title.textContent = dict.friendlyLessonTitle;
  }
  const lessonInput = document.getElementById("friendlyLessonChatInput");
  if (lessonInput && defaultText("friendlyLessonPlaceholder").includes(lessonInput.placeholder.trim())) {
    lessonInput.placeholder = dict.friendlyLessonPlaceholder;
  }
  const lessonSend = document.querySelector("#friendlyLessonChatForm button");
  if (lessonSend) lessonSend.textContent = dict.friendlyChatSend;
  setButtonText("friendlySaveLesson", dict.friendlyLessonSave, true);

  // Friendly visualize stage titles (4 stages, in order)
  const vizTitleTexts = [dict.vizTitleReadiness, dict.vizTitleRedteam, dict.vizTitleTasks, dict.vizTitleLessons];
  document.querySelectorAll(".friendly-viz-title").forEach((el, i) => {
    if (vizTitleTexts[i]) el.textContent = vizTitleTexts[i];
  });

  // Friendly lesson action buttons
  const lessonActionText = {
    "post-result": dict.faPostResult,
    "post-review": dict.faPostReview,
    "lesson": dict.faLesson,
    "save-lesson": dict.faSaveLesson
  };
  document.querySelectorAll("#friendlyLessonActions [data-friendly-action]").forEach((b) => {
    const t = lessonActionText[b.dataset.friendlyAction];
    if (t) b.textContent = t;
  });

  // Analyze-tab static headings / kickers / risk guide.
  // Plain-text pass: only translate elements with no child nodes whose VI text is mapped.
  document.querySelectorAll("#redTeam h3, #redTeam .section-kicker, #checklist h3, #history h3, #lessons h3, #lessons .section-kicker, #runLog h3, .risk-guide strong, .risk-guide p").forEach((el) => {
    if (el.children.length) return;
    if (!el.dataset.txtVi) el.dataset.txtVi = el.textContent.trim();
    const en = STATIC_TEXT_I18N[el.dataset.txtVi];
    if (en) el.textContent = lang === "en" ? en : el.dataset.txtVi;
  });
  // Kickers that contain a help button (keep the button)
  setLabelKeepHelp(document.querySelector("#scoreCard .section-kicker"), dict.kickerVerdict);
  setLabelKeepHelp(document.querySelector(".next-action-card .section-kicker"), dict.kickerNextActions);
  // Risk score-guide lines (keep the <strong> ratio)
  const scoreGuideSpans = document.querySelectorAll(".score-guide span");
  if (scoreGuideSpans.length >= 3) {
    scoreGuideSpans[0].innerHTML = `<strong>0/2</strong> ${dict.scoreGuide0}`;
    scoreGuideSpans[1].innerHTML = `<strong>1/2</strong> ${dict.scoreGuide1}`;
    scoreGuideSpans[2].innerHTML = `<strong>2/2</strong> ${dict.scoreGuide2}`;
  }

  // Classification config screen: static guide copy, tabs, and action labels.
  const cfg = CONFIG_TEXT[lang];
  const templateConfig = document.getElementById("templateConfig");
  if (templateConfig && cfg) {
    const configHero = templateConfig.querySelector(".config-hero");
    if (configHero) {
      const kicker = configHero.querySelector(".card-head .section-kicker");
      if (kicker) kicker.textContent = cfg.kicker;
      const title = configHero.querySelector(".title-row h3");
      if (title) title.textContent = cfg.title;
    }
    setButtonText("resetTemplate", cfg.reset, true);
    setButtonText("saveTemplate", cfg.save, true);
    setLabelKeepHelp(document.getElementById("templateOperator")?.closest(".field")?.querySelector(":scope > span"), cfg.operator);
    const summary = templateConfig.querySelector(".template-summary");
    if (summary) {
      const selectorSpan = summary.querySelector(".template-selector-card > span");
      if (selectorSpan) selectorSpan.textContent = cfg.selectedType;
      const defaultName = document.getElementById("templateName");
      if (defaultName && ["Template mặc định", "Default template"].includes(defaultName.textContent.trim())) {
        defaultName.textContent = cfg.templateDefault;
      }
      const statSpans = summary.querySelectorAll(".template-stat > span");
      if (statSpans[0]) statSpans[0].textContent = cfg.maxScore;
      if (statSpans[1]) statSpans[1].textContent = cfg.riskGroups;
      if (statSpans[2]) statSpans[2].textContent = cfg.personas;
    }
    templateConfig.querySelectorAll(".config-tabs .config-tab").forEach((tab, index) => {
      if (cfg.tabs[index]) tab.textContent = cfg.tabs[index];
    });

    const catalog = templateConfig.querySelector('[data-config-panel="catalog"]');
    if (catalog) {
      const head = catalog.querySelector(".card-head.compact");
      if (head) {
        const kicker = head.querySelector(".section-kicker");
        const title = head.querySelector("h3");
        if (kicker) kicker.textContent = cfg.catalogKicker;
        if (title) title.textContent = cfg.catalogTitle;
      }
      const explainer = catalog.querySelector(".catalog-explainer");
      if (explainer) {
        const strong = explainer.querySelector("strong");
        const p = explainer.querySelector("p");
        if (strong) strong.textContent = cfg.quickTitle;
        if (p) p.innerHTML = cfg.quickBody;
      }
      const panels = catalog.querySelectorAll(".catalog-panel");
      if (panels[0]) {
        const p = panels[0].querySelector(".catalog-panel-head p");
        if (p) p.textContent = cfg.templateHelp;
        const btn = panels[0].querySelector("#addBaseTemplate");
        if (btn) btn.textContent = cfg.addTemplate;
      }
      if (panels[1]) {
        const kicker = panels[1].querySelector(".section-kicker");
        const p = panels[1].querySelector(".catalog-panel-head p");
        if (kicker) kicker.textContent = cfg.typeKicker;
        if (p) p.textContent = cfg.typeHelp;
        const btn = panels[1].querySelector("#addLaunchType");
        if (btn) btn.textContent = cfg.addType;
      }
    }

    const setPaneHead = (panelName, kickerText, titleText, buttonId, buttonText) => {
      const panel = templateConfig.querySelector(`[data-config-panel="${panelName}"]`);
      if (!panel) return;
      const kicker = panel.querySelector(".card-head .section-kicker");
      const title = panel.querySelector(".card-head h3");
      if (kicker) kicker.textContent = kickerText;
      if (title) title.textContent = titleText;
      if (buttonId) setButtonText(buttonId, buttonText, true);
    };
    setPaneHead("risk", cfg.riskKicker, cfg.riskTitle, "addRiskGroup", cfg.addRisk);
    const scoreExplainer = templateConfig.querySelector(".score-explainer");
    if (scoreExplainer) {
      const strong = scoreExplainer.querySelector("strong");
      const p = scoreExplainer.querySelector("p");
      if (strong) strong.textContent = cfg.scoreTitle;
      if (p) p.textContent = cfg.scoreBody;
    }
    setPaneHead("persona", cfg.personaKicker, cfg.personaTitle, "addPersona", cfg.addPersona);
    setPaneHead("checklist", cfg.checklistKicker, cfg.checklistTitle, "addChecklistItem", cfg.addChecklist);
    setPaneHead("lesson", cfg.lessonKicker, cfg.lessonTitle, "addLessonBlock", cfg.addLesson);

    const admin = templateConfig.querySelector('[data-config-panel="admin"]');
    if (admin) {
      const adminHead = admin.querySelector(".card-head.compact");
      if (adminHead) {
        const kicker = adminHead.querySelector(".section-kicker");
        const title = adminHead.querySelector("h3");
        if (kicker) kicker.textContent = cfg.operatorKicker;
        if (title) title.textContent = cfg.operatorTitle;
      }
      const guides = admin.querySelectorAll(".format-guide");
      if (guides[0]) {
        const kicker = guides[0].querySelector(".section-kicker");
        const title = guides[0].querySelector("h3");
        const p = guides[0].querySelector("p");
        if (kicker) kicker.textContent = cfg.formatKicker;
        if (title) title.textContent = cfg.formatTitle;
        if (p) p.textContent = cfg.formatBody;
        guides[0].querySelectorAll(".format-block strong").forEach((el, index) => {
          if (cfg.formatBlocks[index]) el.textContent = cfg.formatBlocks[index];
        });
        const personaCode = guides[0].querySelectorAll(".format-block code")[1];
        if (personaCode) personaCode.textContent = cfg.personaCode;
      }
      if (guides[1]) {
        const kicker = guides[1].querySelector(".section-kicker");
        const title = guides[1].querySelector("h3");
        const p = guides[1].querySelector("p");
        if (kicker) kicker.textContent = cfg.versionKicker;
        if (title) title.textContent = cfg.versionTitle;
        if (p) p.textContent = cfg.versionBody;
      }
      if (guides[2]) {
        const kicker = guides[2].querySelector(".section-kicker");
        const title = guides[2].querySelector("h3");
        const p = guides[2].querySelector("p");
        if (kicker) kicker.textContent = cfg.runLogKicker;
        if (title) title.textContent = cfg.runLogTitle;
        if (p) p.textContent = cfg.runLogBody;
        setButtonText("clearRunLog", cfg.clearLog, true);
      }
    }
  }

  // Product selector overlay + change-product button
  const setTextById = (id, text) => { const el = document.getElementById(id); if (el && text) el.textContent = text; };
  setTextById("changeProduct", dict.changeProduct);
  setTextById("productSelectKicker", dict.productKicker);
  setTextById("createProductLabel", dict.productCreateLabel);
  setTextById("createProductHint", dict.productCreateHint);
  const createProductLocked = document.getElementById("createProductLocked");
  if (createProductLocked) {
    createProductLocked.setAttribute("title", dict.productCreateTitle);
    createProductLocked.setAttribute("aria-label", `${dict.productCreateLabel} - ${dict.productCreateTitle}`);
  }
  setTextById("productSelectTitle", dict.productTitle);
  setTextById("productSelectSubtitle", dict.productSubtitle);
  setTextById("productDemoDesc", dict.productDemoDesc);
  setTextById("productDemoCta", dict.productDemoCta);
  setTextById("productLockBadge", dict.productLockBadge);
  setTextById("productLockedTitle", dict.productLockedTitle);
  setTextById("productLockedDesc", dict.productLockedDesc);
  setTextById("productLockedCta", dict.productLockedCta);

  // Communication Apps modal + launcher
  setTextById("openCommunicationApps", dict.commAppsBtn);
  setTextById("commAppsKicker", dict.commAppsKicker);
  setTextById("commAppsTitle", dict.commAppsTitle);
  setTextById("commAppsSubtitle", dict.commAppsSubtitle);
  const commClose = document.getElementById("closeCommunicationApps");
  if (commClose) commClose.setAttribute("aria-label", dict.commAppsClose);
  setTextById("commZaloStatus", dict.commZaloStatus);
  setTextById("commTelegramStatus", dict.commComingSoon);
  setTextById("commDiscordStatus", dict.commComingSoon);
  setTextById("commZaloDmHint", dict.commZaloDmHint);
  setTextById("commZaloGroupHint", dict.commZaloGroupHint);
  setTextById("commTelegramDmHint", dict.commTelegramDmHint);
  setTextById("commTelegramGroupHint", dict.commTelegramGroupHint);
  setTextById("commDiscordDmHint", dict.commDiscordDmHint);
  setTextById("commDiscordChannelHint", dict.commDiscordChannelHint);
  setTextById("commZaloDmConnect", dict.commConnect);
  setTextById("copyZaloGroupLink", dict.commCopy);
  setTextById("commZaloGroupNote", dict.commZaloGroupNote);
  setTextById("commPromptTitle", dict.commPromptTitle);
  setTextById("commPromptStatus", dict.commPromptStatus);
  setTextById("commPromptHint", dict.commPromptHint);
  setTextById("commStarterPrompt", dict.commStarterPrompt);
  setTextById("copyCommStarterPrompt", dict.commPromptCopy);
  ["commTelegramDmCta", "commTelegramGroupCta", "commDiscordDmCta", "commDiscordChannelCta"].forEach((id) => setTextById(id, dict.commComingSoonCta));
  const commToast = document.getElementById("commAppsToast");
  if (commToast && !commToast.classList.contains("visible")) commToast.textContent = dict.commCopyToast;
}

// Bind language elements on early load and window triggers
document.addEventListener("DOMContentLoaded", () => {
  const viBtn = document.getElementById("langViBtn");
  const enBtn = document.getElementById("langEnBtn");
  const introViBtn = document.getElementById("introLangViBtn");
  const introEnBtn = document.getElementById("introLangEnBtn");

  const applyAndRerender = (lang) => {
    applyCleanTranslations(lang);
    // app.js re-render các chuỗi động (group titles, chips, score color...)
    if (typeof window.launchopsOnLanguageApplied === "function") window.launchopsOnLanguageApplied();
    if (typeof window.friendlyRetranslateChips === "function") window.friendlyRetranslateChips();
  };
  if (viBtn) viBtn.addEventListener("click", () => applyAndRerender("vi"));
  if (enBtn) enBtn.addEventListener("click", () => applyAndRerender("en"));
  if (introViBtn) introViBtn.addEventListener("click", () => applyAndRerender("vi"));
  if (introEnBtn) introEnBtn.addEventListener("click", () => applyAndRerender("en"));

  applyCleanTranslations(activeLang);

  // Re-run translations inside other reactive view loads
  const observer = new MutationObserver(() => {
    applyCleanTranslations(activeLang);
  });
  const detailTitle = document.getElementById("detailTitle");
  if (detailTitle) observer.observe(detailTitle, { childList: true });
});

// Run once immediately
applyCleanTranslations(activeLang);

// i18n-clean.js - Clean bilingual data and DOM text restoration
const CLEAN_I18N_DICT = {
  vi: {
    introKicker: "Giới thiệu demo",
    introTitle: "LaunchOps Command Center là gì?",
    introSummary: "LaunchOps Command Center là một Super Agent / Trung tâm điều hành Launch giúp team kiểm soát rủi ro trước, trong và sau khi phát hành sự kiện, campaign, tính năng mới hoặc hệ thống nội bộ.",
    introBody: "Công cụ có thể dùng trực tiếp trên Web UI như bản demo này, hoặc tích hợp thành chatbot trên các kênh làm việc quen thuộc như Zalo, Discord, Telegram, Slack để team gửi brief, hỏi trạng thái launch, xem checklist và nhận cảnh báo rủi ro ngay trong nơi đang làm việc.",
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
    introAgent6Body: "Chatbot hỗ trợ giải thích, tạo launch, điều hướng trong Web UI và có thể mở rộng sang Zalo, Discord, Telegram hoặc Slack.",
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
    helpHistoryTooltip: "Mỗi lần bấm Chạy phân tích sẽ lưu một bản ghi. Bấm Mở lại để xem kết quả cũ và so sánh với lần mới."
  },
  en: {
    introKicker: "Demo Introduction",
    introTitle: "What is LaunchOps Command Center?",
    introSummary: "LaunchOps Command Center is a Super Agent & Launch Dashboard that helps teams manage risks before, during, and after shipping campaigns, H5 events, features, or releases.",
    introBody: "This tool can be used directly on the Web UI as shown in this demo, or integrated as a chatbot in work channels like Zalo, Discord, Telegram, or Slack to send briefs, check launch status, view checklists, and receive risk alerts where teams already collaborate.",
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
    introAgent6Body: "Chatbot assisting with explanations, creating launches, navigating the Web UI, and extensible to Zalo, Discord, Telegram, or Slack.",
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
    helpHistoryTooltip: "Every Run Analysis click saves a record. Click Reopen to load history and compare with the latest run."
  }
};

let activeLang = localStorage.getItem("launchops_lang") || "vi";

function applyCleanTranslations(lang) {
  activeLang = lang;
  localStorage.setItem("launchops_lang", lang);
  const dict = CLEAN_I18N_DICT[lang];

  // Update language buttons active class
  const viBtn = document.getElementById("langViBtn");
  const enBtn = document.getElementById("langEnBtn");
  if (viBtn) viBtn.classList.toggle("active", lang === "vi");
  if (enBtn) enBtn.classList.toggle("active", lang === "en");

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
    if (s) s.textContent = dict.introSummary;

    // Second paragraph of body
    const bodyP = introModal.querySelector(".intro-content > p:not(#introSummary)");
    if (bodyP) bodyP.textContent = dict.introBody;

    // Grid sections
    const secHeaders = introModal.querySelectorAll(".intro-section h3");
    if (secHeaders.length >= 2) {
      secHeaders[0].textContent = dict.introGoalTitle;
      secHeaders[1].textContent = dict.introValueTitle;
    }

    const goalListItems = introModal.querySelectorAll(".intro-list li");
    if (goalListItems.length >= 4) {
      goalListItems[0].innerHTML = dict.introGoal1;
      goalListItems[1].innerHTML = dict.introGoal2;
      goalListItems[2].innerHTML = dict.introGoal3;
      goalListItems[3].innerHTML = dict.introGoal4;
    }

    const agentTitle = introModal.querySelector(".intro-section:nth-of-type(2) h3");
    if (agentTitle) agentTitle.textContent = dict.introAgentTitle;

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

    const valP = introModal.querySelector(".intro-section:nth-of-type(2) p");
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
    actHelpBtn.setAttribute("data-tooltip", dict.helpActionTooltip);
  }
  const histHelpBtn = document.querySelector("#historyView .help-button");
  if (histHelpBtn) {
    histHelpBtn.setAttribute("aria-label", dict.helpHistoryBtn);
    histHelpBtn.setAttribute("data-tooltip", dict.helpHistoryTooltip);
  }
}

// Bind language elements on early load and window triggers
document.addEventListener("DOMContentLoaded", () => {
  const viBtn = document.getElementById("langViBtn");
  const enBtn = document.getElementById("langEnBtn");

  if (viBtn) viBtn.addEventListener("click", () => applyCleanTranslations("vi"));
  if (enBtn) enBtn.addEventListener("click", () => applyCleanTranslations("en"));

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

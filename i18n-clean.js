// i18n-clean.js - Clean bilingual data and DOM text restoration
const CLEAN_I18N_DICT = {
  vi: {
    introKicker: "Gi?i thi?u demo",
    introTitle: "LaunchOps Command Center l? g??",
    introSummary: "LaunchOps Command Center l? m?t Super Agent / Trung t?m ?i?u h?nh Launch gi?p team ki?m so?t r?i ro tr??c, trong v? sau khi ph?t h?nh s? ki?n, campaign, t?nh n?ng m?i ho?c h? th?ng n?i b?.",
    introBody: "C?ng c? c? th? d?ng tr?c ti?p tr?n Web UI nh? b?n demo n?y, ho?c t?ch h?p th?nh chatbot tr?n c?c k?nh l?m vi?c quen thu?c nh? Zalo, Discord, Telegram, Slack ?? team g?i brief, h?i tr?ng th?i launch, xem checklist v? nh?n c?nh b?o r?i ro ngay trong n?i ?ang l?m vi?c.",
    introGoalTitle: "M?c ti?u h??ng t?i",
    introGoal1: "<strong>Kh?ng c?n launch m? qu?ng:</strong> team nh?n nhanh launch ?? ?? an to?n ch?a qua Green / Yellow / Red.",
    introGoal2: "<strong>Gi?m thi?u thi?u s?t tr??c launch:</strong> h? th?ng nh?c c?c ph?n d? qu?n nh? owner, deadline, tracking, dashboard, CS FAQ, rollback plan v? ti?u ch? d?ng.",
    introGoal3: "<strong>Bi?n brief th?nh h?nh ??ng:</strong> t? m?t m? t? launch, h? th?ng t?o checklist c? owner, deadline v? tr?ng th?i.",
    introGoal4: "<strong>T?ch l?y b?i h?c v?n h?nh:</strong> l?u l?ch s? ph?n t?ch, k?t qu? sau launch v? lessons learned ?? c?c l?n launch sau t?t h?n.",
    introAgentTitle: "LaunchOps Command Center d?ng 6 agent/mode ch?nh",
    introAgent1Title: "1. Mission Control Agent",
    introAgent1Body: "??c brief, nh?n di?n lo?i launch, ?i?u ph?i c?c agent c?n l?i v? gi? to?n b? flow trong ph?m vi LaunchOps.",
    introAgent2Title: "2. Launch Readiness Agent",
    introAgent2Body: "Ch?m m?c s?n s?ng theo b? ti?u ch? r?i ro, tr? k?t qu? Green / Yellow / Red v? ?i?m readiness.",
    introAgent3Title: "3. Red Team Agent",
    introAgent3Body: "Ph?n bi?n launch t? nhi?u g?c nh?n nh? user, k? thu?t, CS, business v? LiveOps ?? ph?t hi?n r?i ro tr??c khi ch?y.",
    introAgent4Title: "4. Checklist Agent",
    introAgent4Body: "T?o danh s?ch vi?c c?n l?m theo t?ng m?c tr??c launch, ng?y launch, trong l?c ch?y v? sau launch, c? owner/deadline/status.",
    introAgent5Title: "5. Post-mortem & Lessons Agent",
    introAgent5Body: "G?i ? c?u h?i t?ng k?t, l?u k?t qu? th?c t? v? b?i h?c sau launch ?? tr?nh l?p l?i l?i c?.",
    introAgent6Title: "6. LaunchOps Assistant / Channel Agent",
    introAgent6Body: "Chatbot h? tr? gi?i th?ch, t?o launch, ?i?u h??ng trong Web UI v? c? th? m? r?ng sang Zalo, Discord, Telegram ho?c Slack.",
    introValueTitle: "T?c d?ng th?c t?",
    introValueBody: "LaunchOps Command Center gi?p bi?n m?t launch brief c?n m? h? th?nh quy tr?nh v?n h?nh r? r?ng: c? ?i?m s?, c? r?i ro, c? checklist, c? owner v? c? b?i h?c sau launch.",
    introBtn: "V?o demo",
    closeIntro: "??ng",
    eyebrow: "V-Team ? VinhVNN ? GS9",
    title: "LaunchOps Command Center",
    roleLabel: "Vai tr?",
    newLaunch: "T?o launch m?i",
    openTemplateConfig: "C?u h?nh ph?n lo?i",
    statusFilterLabel: "Tr?ng th?i",
    searchLabel: "T?m ki?m",
    searchPlaceholder: "T?n ho?c ph?n lo?i",
    statusAll: "T?t c?",
    statusRunning: "?ang ch?y",
    statusCompleted: "?? ch?y",
    statusUpcoming: "S?p ch?y",
    detailKicker: "Chi ti?t launch",
    detailSub: "T?o ho?c ch?n launch tr??c khi ph?n t?ch.",
    boardKicker: "Danh s?ch theo tr?ng th?i",
    helpActionBtn: "Gi?i th?ch c?c n?t thao t?c launch",
    helpActionTooltip: "Demo mode: n?p nhanh k?ch b?n m?u ?? quay demo. Export report: t?i b?o c?o Markdown c?a launch hi?n t?i. L?u launch: l?u metadata v? brief sau khi b?n ch?nh. Ch?y ph?n t?ch: g?i brief cho backend/AI ?? t?o readiness, ph?n bi?n, checklist v? l?u v?o l?ch s?.",
    helpHistoryBtn: "Gi?i th?ch l?ch s? ph?n t?ch",
    helpHistoryTooltip: "M?i l?n b?m Ch?y ph?n t?ch s? l?u m?t b?n ghi. B?m M? l?i ?? xem k?t qu? c? v? so s?nh v?i l?n m?i."
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
    eyebrow: "V-Team ? VinhVNN ? GS9",
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
  if (detailSub && (detailSub.textContent.includes("T?o ho?c ch?n") || detailSub.textContent.includes("Create or select"))) {
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

/* guided-demo.js - Man DEMO RIENG (standalone), ban rut gon de hieu LCC hoat dong the nao.
   KHONG dieu khien/khong de len web that. Tu chua noi dung mau; nut "Phan Tich LLM" goi API that. */
(function () {
  "use strict";

  var API = "/api";
  var GOLDEN_ID = "golden-spin-retro-lessons";

  function lang() {
    try { return localStorage.getItem("launchops_lang") === "en" ? "en" : "vi"; }
    catch (e) { return "vi"; }
  }
  function byId(id) { return document.getElementById(id); }
  function esc(s) { return String(s); }

  var T = {
    vi: {
      tag: "Demo có hướng dẫn", sub: "Bản rút gọn — xem LCC hoạt động thế nào",
      exit: "Thoát demo", prev: "Lùi", finish: "Kết thúc demo",
      hint: "Đây là màn demo riêng, không ảnh hưởng web thật",
      nextTo: "Tiếp: ",
      steps: ["Brief", "Chấm điểm", "Phản biện", "Việc cần làm", "Bài học"],
      sp: [
        "Đây là một brief launch — mô tả sự kiện bạn sắp chạy. LCC sẽ đọc và kiểm tra giúp bạn.",
        "Chọn cách phân tích: bản Demo cho kết quả ngay, hoặc LLM để agent thật chấm điểm.",
        "Nhiều agent phản biện launch từ các góc: người dùng, kỹ thuật, chăm sóc KH...",
        "Từ rủi ro, LCC tạo việc cần làm có người phụ trách và hạn chót.",
        "Sau launch, LCC lưu bài học để lần sau tốt hơn — điểm có thể lên Xanh."
      ],
      briefKick: "BRIEF MẪU",
      briefTitle: "Vòng Quay Golden Spin cuối tuần",
      briefBody: "Sự kiện quay thưởng cuối tuần, phần thưởng giới hạn. Mục tiêu tăng lượt quay và doanh thu nạp — chưa nêu rõ kế hoạch rollback và ngưỡng cảnh báo khi máy chủ quá tải.",
      anaKick: "CHỌN CÁCH PHÂN TÍCH",
      btnDemo: "Phân Tích Demo", btnDemoSub: "ngay",
      btnLlm: "Phân Tích LLM", btnLlmSub: "agent thật",
      anaNote: "Demo: kết quả mẫu, nhanh. LLM: gọi agent thật (có thể 1–2 phút).",
      verdictY: "Vàng — cân nhắc",
      risks: ["Chưa có kế hoạch rollback rõ ràng", "Chỉ tiêu KPI chưa lượng hoá", "Thiếu kịch bản CS khi quá tải"],
      llmRun: "Đang gọi agent thật...", llmWait: "Có thể mất 1–2 phút",
      llmOk: "Agent đã phân tích xong", llmReadi: "Mức sẵn sàng",
      llmSee: "Xem chi tiết trong tool", llmFail: "Agent đang bận hoặc cần cấu hình LLM — bạn xem bản Demo nhé.",
      rtKick: "PHẢN BIỆN ĐA CHIỀU",
      personas: [
        ["Người dùng", "Phần thưởng giới hạn dễ gây hụt hẫng nếu hết sớm."],
        ["Kỹ thuật", "Chưa có ngưỡng cảnh báo khi máy chủ quá tải giờ cao điểm."],
        ["Chăm sóc KH", "Chưa có FAQ/kịch bản trả lời khi người chơi khiếu nại."]
      ],
      taskKick: "VIỆC CẦN LÀM",
      tasks: [
        ["Viết kế hoạch rollback", "LiveOps · trước launch 1 ngày"],
        ["Lượng hoá KPI lượt quay & doanh thu", "PM · trước launch"],
        ["Chuẩn bị FAQ + kịch bản CS quá tải", "CS · trước launch"]
      ],
      lessonKick: "BÀI HỌC & KẾT",
      lessonBody: "Lần trước thiếu rollback và FAQ CS. Lần này áp bài học → chuẩn bị đủ trước giờ G.",
      lessonNote: "Hệ thống nhớ và cải thiện qua từng lần — cùng loại launch sau khi học có thể lên Xanh.",
      useReal: "Vào dùng thật"
    },
    en: {
      tag: "Guided demo", sub: "Quick tour — see how LCC works",
      exit: "Exit demo", prev: "Back", finish: "Finish demo",
      hint: "This is a separate demo, it does not affect the real app",
      nextTo: "Next: ",
      steps: ["Brief", "Readiness", "Red team", "To-do", "Lessons"],
      sp: [
        "This is a launch brief — a description of the event you plan to run. LCC reads and checks it for you.",
        "Pick how to analyze: a Demo result instantly, or LLM to let the real agents score it.",
        "Several agents challenge the launch from different angles: users, engineering, support...",
        "From the risks, LCC builds a to-do list with owners and deadlines.",
        "After launch, LCC stores lessons so next time is better — the score can turn Green."
      ],
      briefKick: "SAMPLE BRIEF",
      briefTitle: "Golden Spin weekend event",
      briefBody: "A weekend gacha event with limited rewards. Goal: lift spins and recharge revenue — but no rollback plan and no overload alert threshold yet.",
      anaKick: "CHOOSE HOW TO ANALYZE",
      btnDemo: "Demo analysis", btnDemoSub: "instant",
      btnLlm: "LLM analysis", btnLlmSub: "real agents",
      anaNote: "Demo: sample result, instant. LLM: calls real agents (may take 1–2 min).",
      verdictY: "Yellow — caution",
      risks: ["No clear rollback plan", "KPIs not quantified", "No CS overload playbook"],
      llmRun: "Calling real agents...", llmWait: "May take 1–2 minutes",
      llmOk: "Agents finished the analysis", llmReadi: "Readiness",
      llmSee: "See full result in the tool", llmFail: "Agents busy or LLM not configured — try the Demo result.",
      rtKick: "MULTI-ANGLE REVIEW",
      personas: [
        ["User", "Limited rewards may frustrate players if they run out early."],
        ["Engineering", "No overload alert threshold for peak hours yet."],
        ["Support", "No FAQ/playbook for handling complaints."]
      ],
      taskKick: "TO-DO",
      tasks: [
        ["Write a rollback plan", "LiveOps · 1 day before launch"],
        ["Quantify spin & revenue KPIs", "PM · before launch"],
        ["Prepare FAQ + CS overload playbook", "CS · before launch"]
      ],
      lessonKick: "LESSONS & WRAP-UP",
      lessonBody: "Last time lacked rollback and CS FAQ. This time, applying lessons → everything ready before go time.",
      lessonNote: "The system remembers and improves each time — the same launch, after lessons, can turn Green.",
      useReal: "Open the real app"
    }
  };

  var MASCOT =
    '<svg class="lcc-mascot" viewBox="0 0 200 196" role="img" aria-label="Mascot">' +
    '<line x1="100" y1="42" x2="100" y2="22" stroke="#f05a22" stroke-width="5" stroke-linecap="round"/>' +
    '<circle cx="100" cy="17" r="8" fill="#f05a22"/>' +
    '<rect x="44" y="42" width="112" height="98" rx="30" fill="#fff" stroke="#f05a22" stroke-width="4"/>' +
    '<circle cx="80" cy="86" r="10" fill="#1a1714"/><circle cx="120" cy="86" r="10" fill="#1a1714"/>' +
    '<circle cx="83" cy="83" r="3" fill="#fff"/><circle cx="123" cy="83" r="3" fill="#fff"/>' +
    '<path class="lcc-m-mouth lcc-m-happy" d="M82 106 Q100 126 118 106" fill="none" stroke="#1a1714" stroke-width="4.5" stroke-linecap="round"/>' +
    '<line class="lcc-m-mouth lcc-m-flat" x1="86" y1="112" x2="114" y2="112" stroke="#1a1714" stroke-width="4.5" stroke-linecap="round"/>' +
    '<path class="lcc-m-mouth lcc-m-warn" d="M84 116 Q100 104 116 116" fill="none" stroke="#1a1714" stroke-width="4.5" stroke-linecap="round"/>' +
    '<circle class="lcc-m-mouth lcc-m-alert" cx="100" cy="114" r="8" fill="none" stroke="#1a1714" stroke-width="4.5"/>' +
    '</svg>';

  function gauge(score, max, color) {
    var dash = Math.round((score / max) * 402 * 10) / 10;
    return '<svg width="116" height="116" viewBox="0 0 160 160" role="img" aria-label="' + score + '/' + max + '">' +
      '<circle cx="80" cy="80" r="64" fill="none" stroke="#efece6" stroke-width="15"/>' +
      '<circle cx="80" cy="80" r="64" fill="none" stroke="' + color + '" stroke-width="15" stroke-linecap="round" stroke-dasharray="' + dash + ' 402" transform="rotate(-90 80 80)"/>' +
      '<text x="80" y="76" text-anchor="middle" font-family="Be Vietnam Pro,sans-serif" font-size="34" font-weight="800" fill="#1a1714">' + score + '</text>' +
      '<text x="80" y="98" text-anchor="middle" font-family="Be Vietnam Pro,sans-serif" font-size="13" fill="#6b675f">/ ' + max + '</text></svg>';
  }

  var step = 0;
  var mascotState = ["idle", "thinking", "yellow", "yellow", "green"];

  function stageHTML(s, t) {
    if (s === 0) {
      return '<div class="lcc-demo-kick">' + t.briefKick + '</div>' +
        '<div class="lcc-demo-card"><div style="font-weight:700;font-size:15px;">' + t.briefTitle + '</div>' +
        '<div style="font-size:13.5px;color:var(--muted);line-height:1.6;margin-top:6px;">' + t.briefBody + '</div></div>';
    }
    if (s === 1) {
      return '<div class="lcc-demo-card" style="padding:12px 15px;"><div style="font-weight:600;font-size:14px;">' + t.briefTitle + '</div></div>' +
        '<div class="lcc-demo-kick" style="margin-top:14px;">' + t.anaKick + '</div>' +
        '<div style="display:flex;gap:11px;flex-wrap:wrap;">' +
        '<button id="lccDemoAnaDemo" class="lcc-btn lcc-btn--primary" type="button">' + t.btnDemo + ' <span style="font-weight:400;opacity:.85;font-size:12px;">· ' + t.btnDemoSub + '</span></button>' +
        '<button id="lccDemoAnaLlm" class="lcc-btn lcc-btn--ghost" type="button">' + t.btnLlm + ' <span style="font-weight:400;color:var(--muted);font-size:12px;">· ' + t.btnLlmSub + '</span></button>' +
        '</div>' +
        '<div style="font-size:12px;color:var(--muted-2);margin-top:9px;">' + t.anaNote + '</div>' +
        '<div id="lccDemoResult" style="margin-top:14px;"></div>';
    }
    if (s === 2) {
      var html = '<div class="lcc-demo-kick">' + t.rtKick + '</div>';
      t.personas.forEach(function (p) {
        html += '<div class="lcc-persona"><div class="lcc-persona-ic">' + p[0].charAt(0) + '</div>' +
          '<div><div style="font-weight:600;font-size:13.5px;">' + p[0] + '</div>' +
          '<div style="font-size:13px;color:var(--muted);line-height:1.5;margin-top:2px;">' + p[1] + '</div></div></div>';
      });
      return html;
    }
    if (s === 3) {
      var h = '<div class="lcc-demo-kick">' + t.taskKick + '</div><div class="lcc-demo-card">';
      t.tasks.forEach(function (tk) {
        h += '<div class="lcc-task"><span class="lcc-task-box"></span><div><div>' + tk[0] + '</div><div class="lcc-task-meta">' + tk[1] + '</div></div></div>';
      });
      return h + '</div>';
    }
    return '<div class="lcc-demo-kick">' + t.lessonKick + '</div>' +
      '<div class="lcc-demo-card"><div style="font-size:13.5px;line-height:1.6;">' + t.lessonBody + '</div></div>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-top:12px;">' +
      '<span class="lcc-badge lcc-badge--green"><span class="lcc-dot lcc-dot--green"></span> Xanh</span>' +
      '<span style="font-size:13px;color:var(--muted);line-height:1.5;">' + t.lessonNote + '</span></div>' +
      '<button id="lccDemoUseReal" class="lcc-btn lcc-btn--primary" style="margin-top:16px;" type="button">' + t.useReal + '</button>';
  }

  function renderDemoResult(t) {
    var el = byId("lccDemoResult");
    if (!el) return;
    el.innerHTML = '<div class="lcc-demo-gaugewrap">' + gauge(6, 12, "#e0a400") +
      '<div><span class="lcc-badge lcc-badge--yellow"><span class="lcc-dot lcc-dot--yellow"></span> ' + t.verdictY + '</span>' +
      '<div style="margin-top:10px;">' +
      t.risks.map(function (r) { return '<div class="lcc-chip-warn">⚠ ' + r + '</div>'; }).join("") +
      '</div></div></div>';
  }

  function extractReadiness(p) {
    var r = (p && p.result) || {};
    var color = (r.readiness && r.readiness.color) || r.color || r.readinessColor || (p && p.summary && p.summary.color) || null;
    var score = (r.readiness && r.readiness.score) || r.score || (p && p.summary && p.summary.score) || null;
    return { color: color, score: score };
  }

  function runLlm(t) {
    var el = byId("lccDemoResult");
    if (!el) return;
    el.innerHTML = '<div class="lcc-demo-card" style="display:flex;align-items:center;gap:12px;"><div class="lcc-spin"></div>' +
      '<div><div style="font-weight:600;font-size:13.5px;">' + t.llmRun + '</div><div style="font-size:12px;color:var(--muted);">' + t.llmWait + '</div></div></div>';
    fetch(API + "/launches/" + encodeURIComponent(GOLDEN_ID) + "/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}"
    }).then(function (r) { return r.json(); }).then(function (p) {
      var rd = extractReadiness(p);
      var line = rd.color ? (t.llmReadi + ": " + rd.color + (rd.score != null ? " " + rd.score : "")) : "";
      el.innerHTML = '<div class="lcc-demo-card">' +
        '<div style="font-weight:600;font-size:14px;color:var(--green);">✓ ' + t.llmOk + '</div>' +
        (line ? '<div style="font-size:13px;color:var(--muted);margin-top:5px;">' + line + '</div>' : "") +
        '<button id="lccDemoSeeReal" class="lcc-btn lcc-btn--ghost" style="margin-top:12px;" type="button">' + t.llmSee + ' ↗</button>' +
        '</div>';
      var b = byId("lccDemoSeeReal");
      if (b) b.addEventListener("click", gotoReal);
    }).catch(function () {
      el.innerHTML = '<div class="lcc-chip-warn">⚠ ' + t.llmFail + '</div>';
    });
  }

  function render() {
    var t = T[lang()];
    var ov = byId("lccDemoOverlay");
    if (!ov) return;
    var dots = "";
    for (var i = 0; i < t.steps.length; i++) dots += '<span class="lcc-demo-dot' + (i === step ? " on" : "") + '"></span>';
    var nextLabel = step >= t.steps.length - 1 ? t.finish : (t.nextTo + t.steps[step + 1] + " →");
    ov.querySelector(".lcc-demo-screen").innerHTML =
      '<div class="lcc-demo-bar">' +
        '<span class="lcc-demo-tag">▶ ' + t.tag + '</span>' +
        '<span class="lcc-demo-sub">' + t.sub + '</span>' +
        '<span class="lcc-demo-dots">' + dots + '</span>' +
        '<button class="lcc-demo-exit" id="lccDemoExit" type="button">✕ ' + t.exit + '</button>' +
      '</div>' +
      '<div class="lcc-demo-body">' +
        '<div class="lcc-demo-guide"><div class="lcc-mascot-wrap" data-mascot="' + mascotState[step] + '" style="width:108px;height:108px;">' + MASCOT + '</div>' +
          '<div class="lcc-demo-bubble">' + t.sp[step] + '</div></div>' +
        '<div class="lcc-demo-stage">' + stageHTML(step, t) + '</div>' +
      '</div>' +
      '<div class="lcc-demo-nav">' +
        '<button class="lcc-btn lcc-btn--ghost" id="lccDemoPrev" type="button"' + (step === 0 ? " disabled" : "") + '>← ' + t.prev + '</button>' +
        '<span class="lcc-demo-hint">' + t.hint + '</span>' +
        '<button class="lcc-btn lcc-btn--primary" id="lccDemoNext" type="button">' + nextLabel + '</button>' +
      '</div>';

    byId("lccDemoExit").addEventListener("click", close);
    byId("lccDemoPrev").addEventListener("click", function () { if (step > 0) { step--; render(); } });
    byId("lccDemoNext").addEventListener("click", function () {
      if (step >= t.steps.length - 1) { close(); return; }
      step++; render();
    });
    if (step === 1) {
      var bd = byId("lccDemoAnaDemo"); if (bd) bd.addEventListener("click", function () { mascotState[1] = "yellow"; renderDemoResult(t); var w = document.querySelector('.lcc-demo-guide .lcc-mascot-wrap'); if (w) w.setAttribute("data-mascot", "yellow"); });
      var bl = byId("lccDemoAnaLlm"); if (bl) bl.addEventListener("click", function () { runLlm(t); });
    }
    if (step === 4) {
      var ur = byId("lccDemoUseReal"); if (ur) ur.addEventListener("click", gotoReal);
    }
  }

  function open() {
    var ov = byId("lccDemoOverlay");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "lccDemoOverlay";
      ov.className = "lcc-demo";
      ov.innerHTML = '<div class="lcc-demo-screen"></div>';
      document.body.appendChild(ov);
    }
    step = 0;
    mascotState = ["idle", "thinking", "yellow", "yellow", "green"];
    render();
    ov.classList.add("is-on");
  }
  function close() {
    var ov = byId("lccDemoOverlay");
    if (ov) ov.classList.remove("is-on");
  }
  function gotoReal() {
    window.location.href = "/demo";
  }

  function startGuidedDemo() { gotoReal(); }
  window.startGuidedDemo = startGuidedDemo;

  function bindButton() {
    var btn = byId("startGuidedDemo");
    if (btn && !btn.__lccBound) {
      btn.__lccBound = true;
      btn.addEventListener("click", function (e) { e.preventDefault(); startGuidedDemo(); });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindButton);
  } else {
    bindButton();
  }
})();

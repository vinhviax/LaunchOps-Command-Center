/* friendly-ui.js - Web UI redesign layer (2 mode: Pro / Friendly)
   Them 2026-06-08. KHONG sua app.js goc.
   Friendly Visualize doc DOM that app.js da render bang MutationObserver.
   Rollback: bo link script nay trong index.html. */
(function () {
  'use strict';

  var STORAGE_KEY = 'launchops_ui_mode';
  var DEFAULT_MODE = 'pro';

  function getMode() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_MODE;
    } catch (e) {
      return DEFAULT_MODE;
    }
  }

  function friendlyLang() {
    try {
      return localStorage.getItem('launchops_lang') === 'en' ? 'en' : 'vi';
    } catch (e) {
      return 'vi';
    }
  }

  function ftr(vi, en) {
    return friendlyLang() === 'en' ? en : vi;
  }

  function applyMode(mode) {
    var appShell = document.getElementById('appShell');
    var configMode = appShell && appShell.classList.contains('config-mode');
    var m = (mode === 'friendly' && !configMode) ? 'friendly' : 'pro';
    var body = document.body;
    body.classList.remove('ui-mode-pro', 'ui-mode-friendly');
    body.classList.add('ui-mode-' + m);
    if (m === 'friendly') closeFloatingAssistant();

    var btns = document.querySelectorAll('.mode-btn');
    for (var i = 0; i < btns.length; i++) {
      if (!btns[i].getAttribute('data-mode')) continue; // skip lang buttons (VI/EN)
      var on = btns[i].getAttribute('data-mode') === m;
      btns[i].classList.toggle('active', on);
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    syncModeLock();

    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch (e) { /* ignore */ }
  }

  function closeFloatingAssistant() {
    var panel = document.getElementById('assistantPanel');
    if (!panel) return;
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  }

  function syncModeLock() {
    var appShell = document.getElementById('appShell');
    var friendlyBtn = document.getElementById('modeFriendlyBtn');
    var configMode = appShell && appShell.classList.contains('config-mode');
    if (!friendlyBtn) return;
    friendlyBtn.disabled = Boolean(configMode);
    friendlyBtn.setAttribute('aria-disabled', configMode ? 'true' : 'false');
    friendlyBtn.title = configMode ? 'Friendly bị tắt khi đang cấu hình phân loại. Quay lại launch để dùng Friendly.' : '';
    if (configMode && document.body.classList.contains('ui-mode-friendly')) {
      applyMode('pro');
    }
  }

  function init() {
    applyMode(getMode());
    var btns = document.querySelectorAll('.mode-btn');
    for (var i = 0; i < btns.length; i++) {
      if (!btns[i].getAttribute('data-mode')) continue; // skip lang buttons (VI/EN)
      btns[i].addEventListener('click', function () {
        if (this.disabled) return;
        applyMode(this.getAttribute('data-mode'));
      });
    }
    var appShell = document.getElementById('appShell');
    if (appShell) {
      var observer = new MutationObserver(syncModeLock);
      observer.observe(appShell, { attributes: true, attributeFilter: ['class'] });
    }
    syncModeLock();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* Friendly Visualize: read real rendered DOM, do not call scoring/API logic. */
(function () {
  'use strict';

  var STEPS = ['Mission Control', 'Launch Readiness', 'Red Team', 'Checklist', 'Post-mortem'];
  var STEP_DELAYS = [2500, 3100, 2700, 3200];
  var DASH = 377;
  var currentStep = 0;
  var autoTimer = null;
  var effectTimers = [];
  var effectIntervals = [];
  var runToken = 0;
  var lastPlayedToken = -1;
  var lastStatusKind = 'idle';
  var lastSnapshot = null;
  var syncingFriendlyForm = false;
  var friendlySpeechOverride = '';
  var chatAwaiting = '';
  var chatSeeded = false;
  var chatFlow = '';
  var chatFlowSteps = [];
  var chatFlowIndex = -1;
  var lastLaunchKey = '';
  var lessonAwaiting = '';
  var postReviewDone = false;
  var postReviewKey = '';
  var friendlyAnalyzeBypass = false;
  var analysisAutoAdvancePending = false;
  var launchCardSwitchPending = false;
  var friendlyNewDrafts = {};
  var friendlyNewDraftOrder = [];
  var friendlyDraftCounter = 0;
  var activeFriendlyDraftId = '';
  var friendlyEditDrafts = {};
  var pendingFriendlyRestoreId = '';
  var restoringFriendlySession = false;
  var savingFriendlyDraftId = '';
  var savingFriendlyEditId = '';
  var renderingFriendlyDraftCards = false;
  var FRIENDLY_STATUS_ORDER = ['running', 'upcoming', 'completed'];
  var LAUNCH_CONFIG_FLOW = ['name', 'type', 'owner', 'dates', 'brief'];
  var NEW_LAUNCH_FLOW = LAUNCH_CONFIG_FLOW.slice();
  var EDIT_LAUNCH_FLOW = LAUNCH_CONFIG_FLOW.slice();

  function byId(id) {
    return document.getElementById(id);
  }

  function normalize(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function fold(value) {
    return normalize(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function isSkipText(value) {
    var low = fold(value);
    return low === 'giu nguyen' || low === 'bo qua' || low === 'skip' || low === 'next' || low === 'tiep';
  }

  function ownText(element) {
    return normalize(element ? element.textContent : '');
  }

  function firstText(root, selector) {
    return root ? ownText(root.querySelector(selector)) : '';
  }

  function selectedText(select) {
    if (!select) return '';
    var option = select.options && select.options[select.selectedIndex];
    return normalize(option ? option.textContent : select.value);
  }

  function optionValueFromText(selectId, text) {
    var select = byId(selectId);
    var low = fold(text);
    if (!select || !low) return '';
    var options = [].slice.call(select.options || []);
    var exact = options.find(function (option) {
      return fold(option.textContent) === low || fold(option.value) === low;
    });
    if (exact) return exact.value;
    var partial = options.find(function (option) {
      var label = fold(option.textContent);
      var value = fold(option.value);
      return label.indexOf(low) !== -1 || low.indexOf(label) !== -1 || value.indexOf(low) !== -1 || low.indexOf(value) !== -1;
    });
    return partial ? partial.value : '';
  }

  function dispatchControlEvents(control) {
    if (!control) return;
    control.dispatchEvent(new Event('input', { bubbles: true }));
    control.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function setControlValue(control, value) {
    if (!control) return;
    var next = value == null ? '' : String(value);
    if (control.value !== next) control.value = next;
  }

  function copySelectOptions(sourceId, targetId) {
    var source = byId(sourceId);
    var target = byId(targetId);
    if (!source || !target) return;
    var value = source.value;
    while (target.firstChild) target.removeChild(target.firstChild);
    [].slice.call(source.options || []).forEach(function (option) {
      var clone = document.createElement('option');
      clone.value = option.value;
      clone.textContent = option.textContent;
      target.appendChild(clone);
    });
    target.value = value;
  }

  function syncProxyFromReal(proxyId, realId) {
    var proxy = byId(proxyId);
    var real = byId(realId);
    if (!proxy) return;
    if (!real) {
      proxy.disabled = true;
      return;
    }
    setControlValue(proxy, real.value);
    proxy.disabled = Boolean(real.disabled);
  }

  function syncButtonFromReal(proxyId, realId) {
    var proxy = byId(proxyId);
    var real = byId(realId);
    if (!proxy) return;
    proxy.disabled = !real || Boolean(real.disabled);
  }

  function syncRealFromProxy(proxyId, realId) {
    if (syncingFriendlyForm) return;
    var proxy = byId(proxyId);
    var real = byId(realId);
    if (!proxy || !real || proxy.disabled) return;
    setControlValue(real, proxy.value);
    dispatchControlEvents(real);
  }

  function syncLaunchFieldsFromFriendly() {
    [
      ['friendlyLaunchName', 'launchName'],
      ['friendlyLaunchType', 'launchType'],
      ['friendlyLaunchStatus', 'launchStatus'],
      ['friendlyLaunchOwner', 'launchOwner'],
      ['friendlyLaunchTargetDate', 'launchTargetDate'],
      ['friendlyLaunchEndDate', 'launchEndDate'],
      ['friendlyBriefInput', 'briefInput']
    ].forEach(function (pair) {
      syncRealFromProxy(pair[0], pair[1]);
    });
  }

  function syncLessonFieldsFromFriendly() {
    [
      ['friendlyPostResultInput', 'postResultInput'],
      ['friendlyPostResultStatus', 'postResultStatus'],
      ['friendlyLessonInput', 'lessonInput']
    ].forEach(function (pair) {
      syncRealFromProxy(pair[0], pair[1]);
    });
  }

  function syncFriendlyFormFromReal() {
    if (syncingFriendlyForm) return;
    syncingFriendlyForm = true;
    copySelectOptions('launchType', 'friendlyLaunchType');
    copySelectOptions('postResultStatus', 'friendlyPostResultStatus');

    [
      ['friendlyLaunchName', 'launchName'],
      ['friendlyLaunchType', 'launchType'],
      ['friendlyLaunchStatus', 'launchStatus'],
      ['friendlyLaunchOwner', 'launchOwner'],
      ['friendlyLaunchTargetDate', 'launchTargetDate'],
      ['friendlyLaunchEndDate', 'launchEndDate'],
      ['friendlyBriefInput', 'briefInput'],
      ['friendlyPostResultInput', 'postResultInput'],
      ['friendlyPostResultStatus', 'postResultStatus'],
      ['friendlyLessonInput', 'lessonInput']
    ].forEach(function (pair) {
      syncProxyFromReal(pair[0], pair[1]);
    });

    syncButtonFromReal('friendlyLoadBadBrief', 'loadBadBrief');
    syncButtonFromReal('friendlySaveLaunch', 'saveLaunch');
    syncButtonFromReal('friendlyAnalyzeBrief', 'analyzeBrief');
    syncButtonFromReal('friendlySaveLesson', 'saveLesson');
    syncingFriendlyForm = false;
  }

  function focusFriendlyFirstInput() {
    var control = byId('friendlyChatInput');
    if (!control) return;
    try {
      control.focus({ preventScroll: true });
    } catch (e) {
      control.focus();
    }
  }

  function cardReadiness(card) {
    if (card.classList.contains('readiness-green')) return 'green';
    if (card.classList.contains('readiness-yellow')) return 'yellow';
    if (card.classList.contains('readiness-red')) return 'red';
    var title = normalize(card.getAttribute('title') || '').toLowerCase();
    if (title.indexOf('green') !== -1 || title.indexOf('xanh') !== -1) return 'green';
    if (title.indexOf('yellow') !== -1 || title.indexOf('vang') !== -1 || title.indexOf('vàng') !== -1) return 'yellow';
    if (title.indexOf('red') !== -1 || title.indexOf('do ') !== -1 || title.indexOf('đỏ') !== -1) return 'red';
    return 'unknown';
  }

  function readinessBadge(card, state) {
    var title = normalize(card.getAttribute('title') || '');
    var score = title.match(/\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?/);
    if (card && card.classList.contains('active') && state !== 'unknown' && hasRealAnalysis()) {
      var currentScore = normalize(ownText(byId('scoreValue')));
      var currentColor = normalize(ownText(byId('scoreColor')));
      if (currentScore) return (currentColor || colorText(state)) + ' ' + currentScore;
    }
    if (state === 'green') return 'Green' + (score ? ' ' + score[0] : '');
    if (state === 'yellow') return 'Yellow' + (score ? ' ' + score[0] : '');
    if (state === 'red') return 'Red' + (score ? ' ' + score[0] : '');
    return ftr('Chưa chấm', 'Not scored');
  }

  function enhanceLaunchCards() {
    [].slice.call(document.querySelectorAll('.launch-card')).forEach(function (card) {
      var state = cardReadiness(card);
      if (state === 'unknown' && card.classList.contains('active') && hasRealAnalysis()) {
        var liveState = detectState();
        if (liveState === 'green' || liveState === 'yellow' || liveState === 'red') state = liveState;
      }
      var label = readinessBadge(card, state);
      var launchId = card.getAttribute('data-launch-id') || '';
      if (card.classList.contains('friendly-session-draft')) {
        state = 'unknown';
        label = 'Chưa lưu';
      } else if (launchId && friendlyEditDrafts[launchId]) {
        label = 'Đang sửa';
      }
      if (card.getAttribute('data-friendly-readiness') !== state) {
        card.setAttribute('data-friendly-readiness', state);
      }
      if (card.getAttribute('data-friendly-badge') !== label) {
        card.setAttribute('data-friendly-badge', label);
      }
    });
  }

  function activeLaunchKey() {
    if (activeFriendlyDraftId && friendlyNewDrafts[activeFriendlyDraftId]) {
      return 'friendly-draft:' + activeFriendlyDraftId;
    }
    var active = document.querySelector('.launch-card.active');
    if (active) return 'launch:' + (active.getAttribute('data-launch-id') || normalize(active.textContent));
    var name = normalize((byId('launchName') && byId('launchName').value) || ownText(byId('detailTitle')));
    if (!name || name === 'Launch detail' || name === 'Chi tiết launch') return '';
    return 'draft';
  }

  function resetFriendlyChatForLaunch() {
    var messages = byId('friendlyChatMessages');
    clearNode(messages);
    chatAwaiting = '';
    chatFlow = '';
    chatFlowSteps = [];
    chatFlowIndex = -1;
    lessonAwaiting = '';
    postReviewDone = false;
    postReviewKey = '';
    friendlySpeechOverride = '';
    clearNode(byId('friendlyLessonMessages'));
    clearNode(byId('friendlyLessonSuggestions'));
    stopAutoplay();
    setStep(0);
    showHomeActions();
    refreshChatSummary();
    refreshPostLaunchPanel();
    addChatMessage('agent', ftr('Mình đã chuyển sang launch này. Lịch sử chat đã reset để không lẫn với launch trước.', 'I switched to this launch. Chat history was reset so it does not mix with the previous launch.'));
    setNpcSpeech(ftr('Đã đổi launch, tôi đang đọc trạng thái mới.', 'Switched launch. Reading the new state.'));
    updateGuidance();
  }

  function maybeResetChatForLaunch() {
    var key = activeLaunchKey();
    if (!key) return;
    if (!lastLaunchKey) {
      lastLaunchKey = key;
      return;
    }
    if (key === lastLaunchKey) {
      launchCardSwitchPending = false;
      return;
    }
    var oldWasLaunch = lastLaunchKey.indexOf('launch:') === 0;
    var newIsLaunch = key.indexOf('launch:') === 0;
    if (!launchCardSwitchPending && !(oldWasLaunch && newIsLaunch)) {
      lastLaunchKey = key;
      return;
    }
    lastLaunchKey = key;
    launchCardSwitchPending = false;
    resetFriendlyChatForLaunch();
  }

  function isFriendlyMode() {
    return document.body && document.body.classList.contains('ui-mode-friendly');
  }

  function statusLabel(value) {
    if (value === 'running') return 'Đang chạy';
    if (value === 'completed') return 'Đã chạy';
    return 'Sắp chạy';
  }

  function launchStatusValue() {
    return byId('launchStatus') ? byId('launchStatus').value : 'upcoming';
  }

  function statusValueFromText(text) {
    var low = fold(text);
    if (!low) return '';
    if (low.indexOf('da chay') !== -1 || low.indexOf('completed') !== -1 || low === 'done') return 'completed';
    if (low.indexOf('dang chay') !== -1 || low.indexOf('running') !== -1 || low === 'live') return 'running';
    if (low.indexOf('sap chay') !== -1 || low.indexOf('upcoming') !== -1 || low === 'draft') return 'upcoming';
    return '';
  }

  function activeRealLaunchId() {
    var active = document.querySelector('.launch-card.active[data-launch-id]');
    return active ? active.getAttribute('data-launch-id') || '' : '';
  }

  function labelForSelectValue(selectId, value) {
    var select = byId(selectId);
    if (!select) return value || '';
    var options = [].slice.call(select.options || []);
    var option = options.find(function (item) { return item.value === value; });
    return normalize(option ? option.textContent : value);
  }

  function readFriendlyFormData() {
    return {
      name: normalize((byId('launchName') && byId('launchName').value) || 'Launch mới'),
      type: (byId('launchType') && byId('launchType').value) || 'Game event',
      status: (byId('launchStatus') && byId('launchStatus').value) || 'upcoming',
      owner: normalize((byId('launchOwner') && byId('launchOwner').value) || ''),
      targetDate: (byId('launchTargetDate') && byId('launchTargetDate').value) || '',
      endDate: (byId('launchEndDate') && byId('launchEndDate').value) || '',
      brief: (byId('briefInput') && byId('briefInput').value) || '',
      postLaunchResult: (byId('postResultInput') && byId('postResultInput').value) || '',
      postResultStatus: (byId('postResultStatus') && byId('postResultStatus').value) || 'completed',
      lesson: (byId('lessonInput') && byId('lessonInput').value) || '',
      updatedAt: Date.now()
    };
  }

  function writeFriendlyFormData(data) {
    if (!data) return;
    restoringFriendlySession = true;
    [
      ['launchName', data.name || 'Launch mới'],
      ['launchType', data.type || 'Game event'],
      ['launchStatus', data.status || 'upcoming'],
      ['launchOwner', data.owner || ''],
      ['launchTargetDate', data.targetDate || ''],
      ['launchEndDate', data.endDate || ''],
      ['briefInput', data.brief || ''],
      ['postResultInput', data.postLaunchResult || ''],
      ['postResultStatus', data.postResultStatus || 'completed'],
      ['lessonInput', data.lesson || '']
    ].forEach(function (pair) {
      var control = byId(pair[0]);
      if (!control) return;
      setControlValue(control, pair[1]);
      dispatchControlEvents(control);
    });
    restoringFriendlySession = false;
    syncFriendlyFormFromReal();
    refreshFriendlyDetailPreview();
    refreshChatSummary();
    refreshPostLaunchPanel();
  }

  function makeFriendlyDraftId() {
    friendlyDraftCounter += 1;
    return 'draft-' + Date.now().toString(36) + '-' + friendlyDraftCounter;
  }

  function createFriendlyNewDraft() {
    var id = makeFriendlyDraftId();
    var data = readFriendlyFormData();
    data.id = id;
    data.createdAt = Date.now();
    data.updatedAt = data.createdAt;
    friendlyNewDrafts[id] = data;
    friendlyNewDraftOrder.unshift(id);
    activeFriendlyDraftId = id;
    renderFriendlyDraftCards();
    return id;
  }

  function persistActiveFriendlySession(markRealEdit) {
    if (restoringFriendlySession) return;
    var data = readFriendlyFormData();
    if (activeFriendlyDraftId && friendlyNewDrafts[activeFriendlyDraftId]) {
      friendlyNewDrafts[activeFriendlyDraftId] = Object.assign({}, friendlyNewDrafts[activeFriendlyDraftId], data);
      renderFriendlyDraftCards();
      return;
    }
    var realId = activeRealLaunchId();
    if (realId && (markRealEdit || friendlyEditDrafts[realId])) {
      friendlyEditDrafts[realId] = Object.assign({}, data, { id: realId });
      renderFriendlyDraftCards();
    }
  }

  function friendlyDraftMatchesSearch(data) {
    var input = byId('launchSearch');
    var query = fold(input ? input.value : '');
    if (!query) return true;
    return [
      data.name,
      labelForSelectValue('launchType', data.type),
      data.owner,
      statusLabel(data.status || 'upcoming')
    ].some(function (item) {
      return fold(item).indexOf(query) !== -1;
    });
  }

  function friendlyVisibleStatuses() {
    var filter = byId('launchStatusFilter');
    var value = filter ? filter.value : 'all';
    return value && value !== 'all' ? [value] : FRIENDLY_STATUS_ORDER.slice();
  }

  function friendlyListForStatus(status) {
    var groups = [].slice.call(document.querySelectorAll('#launchGroups .launch-group'));
    var statuses = friendlyVisibleStatuses();
    var index = statuses.indexOf(status || 'upcoming');
    if (index < 0) return null;
    var group = groups[index];
    return group ? group.querySelector('.launch-list') : null;
  }

  function removeDraftId(id) {
    delete friendlyNewDrafts[id];
    friendlyNewDraftOrder = friendlyNewDraftOrder.filter(function (item) { return item !== id; });
    if (activeFriendlyDraftId === id) activeFriendlyDraftId = '';
  }

  function updateFriendlyCardContent(card, data, mode) {
    if (!card || !data) return;
    var name = data.name || 'Launch mới';
    var typeLabelText = labelForSelectValue('launchType', data.type || 'Game event') || 'Chưa chọn phân loại';
    var owner = data.owner ? 'Owner: ' + data.owner : 'Chưa có owner';
    var saved = mode === 'new' ? 'Chưa lưu' : 'Đang sửa';
    var statusText = statusLabel(data.status || 'upcoming');
    var historyKey = [name, typeLabelText, owner, saved, statusText, mode].join('|');
    var history = card.querySelector('.launch-card-history');

    card.classList.toggle('active', mode === 'new' && data.id === activeFriendlyDraftId);
    card.classList.toggle('friendly-session-draft', mode === 'new');
    card.classList.toggle('friendly-session-edit', mode === 'edit');
    card.setAttribute('data-friendly-readiness', mode === 'new' ? 'unknown' : (cardReadiness(card) || 'unknown'));
    card.setAttribute('data-friendly-badge', mode === 'new' ? 'Chưa lưu' : 'Đang sửa');
    card.setAttribute('aria-label', 'Mở ' + name + '. ' + saved + ' trong Friendly mode.');
    card.setAttribute('title', saved + ' trong phiên này. F5 trước khi lưu sẽ mất bản nháp.');

    var title = card.querySelector('strong');
    var meta = card.querySelector('.launch-card-meta-line');
    var ownerLine = card.querySelector('.launch-card-owner-line');
    if (title) title.textContent = name;
    if (meta) meta.textContent = typeLabelText + ' · Nháp Friendly';
    if (ownerLine) ownerLine.textContent = owner + ' · ' + saved;
    if (history && history.getAttribute('data-friendly-history-key') !== historyKey) {
      history.setAttribute('data-friendly-history-key', historyKey);
      history.innerHTML = '<span>' + statusText + '</span><strong>0 phân tích · 0 bài học</strong><small>' + saved + '</small>';
    }
  }

  function createFriendlyDraftCard(id, data) {
    var card = document.createElement('button');
    card.type = 'button';
    card.className = 'launch-card friendly-session-draft readiness-unknown';
    card.setAttribute('data-friendly-draft-id', id);
    card.innerHTML = '<strong></strong><small class="launch-card-meta-line"></small><small class="launch-card-owner-line"></small><span class="launch-card-history empty"></span>';
    updateFriendlyCardContent(card, data, 'new');
    return card;
  }

  function decorateFriendlyEditedCards() {
    [].slice.call(document.querySelectorAll('.launch-card[data-launch-id]')).forEach(function (card) {
      var id = card.getAttribute('data-launch-id');
      var data = friendlyEditDrafts[id];
      card.classList.toggle('friendly-session-edit', Boolean(data));
      if (data) updateFriendlyCardContent(card, data, 'edit');
    });
  }

  function renderFriendlyDraftCards() {
    var groups = byId('launchGroups');
    if (!groups || renderingFriendlyDraftCards) return;
    // Draft Friendly chỉ tồn tại trong Friendly mode; ở Pro phải gỡ khỏi sidebar
    // (nếu không nó cướp highlight .active của launch thật sau mỗi lần re-render).
    if (!document.body.classList.contains('ui-mode-friendly')) {
      renderingFriendlyDraftCards = true;
      try {
        [].slice.call(document.querySelectorAll('[data-friendly-draft-id]')).forEach(function (card) { card.remove(); });
      } finally {
        renderingFriendlyDraftCards = false;
      }
      return;
    }
    renderingFriendlyDraftCards = true;
    try {
      var visible = {};
      friendlyNewDraftOrder.forEach(function (id) {
        var data = friendlyNewDrafts[id];
        if (!data || !friendlyDraftMatchesSearch(data)) return;
        var status = data.status || 'upcoming';
        var list = friendlyListForStatus(status);
        if (!list) return;
        visible[id] = true;
        var empty = list.querySelector('.empty-state');
        if (empty) empty.remove();
        var allCards = [].slice.call(document.querySelectorAll('[data-friendly-draft-id="' + id + '"]'));
        var card = allCards.shift() || null;
        allCards.forEach(function (dup) { dup.remove(); });
        if (!card) {
          card = createFriendlyDraftCard(id, data);
          list.insertBefore(card, list.firstChild);
        } else if (card.parentElement !== list) {
          list.insertBefore(card, list.firstChild);
        }
        updateFriendlyCardContent(card, data, 'new');
      });
      [].slice.call(document.querySelectorAll('[data-friendly-draft-id]')).forEach(function (card) {
        var id = card.getAttribute('data-friendly-draft-id');
        if (!visible[id]) card.remove();
      });
      decorateFriendlyEditedCards();
      syncFriendlyActiveDraftCard();
    } finally {
      renderingFriendlyDraftCards = false;
    }
  }

  function syncFriendlyActiveDraftCard() {
    if (!document.body.classList.contains('ui-mode-friendly')) return;
    if (!activeFriendlyDraftId || !friendlyNewDrafts[activeFriendlyDraftId]) return;
    [].slice.call(document.querySelectorAll('.launch-card.active[data-launch-id]')).forEach(function (card) {
      card.classList.remove('active');
    });
    var draft = document.querySelector('[data-friendly-draft-id="' + activeFriendlyDraftId + '"]');
    if (draft) draft.classList.add('active');
  }

  function restorePendingFriendlyEdit() {
    if (!pendingFriendlyRestoreId) return false;
    var id = pendingFriendlyRestoreId;
    if (activeRealLaunchId() !== id) return false;
    pendingFriendlyRestoreId = '';
    activeFriendlyDraftId = '';
    if (!friendlyEditDrafts[id]) return false;
    writeFriendlyFormData(friendlyEditDrafts[id]);
    setNpcSpeech(ftr('Đã khôi phục phần đang sửa tạm của launch này.', 'Restored the unsaved draft for this launch.'));
    return true;
  }

  function selectFriendlyDraft(id) {
    var data = friendlyNewDrafts[id];
    if (!data) return;
    persistActiveFriendlySession(false);
    activeFriendlyDraftId = id;
    pendingFriendlyRestoreId = '';
    [].slice.call(document.querySelectorAll('.launch-card.active[data-launch-id]')).forEach(function (card) {
      card.classList.remove('active');
    });
    writeFriendlyFormData(data);
    renderFriendlyDraftCards();
    var key = 'friendly-draft:' + id;
    var oldKey = lastLaunchKey;
    lastLaunchKey = key;
    stopAutoplay();
    setStep(0);
    if (oldKey && oldKey !== key) {
      resetFriendlyChatForLaunch();
    } else {
      refreshChatSummary();
      updateGuidance();
    }
    setNpcSpeech(ftr('Đã mở lại launch nháp. Bạn có thể tiếp tục cấu hình hoặc lưu.', 'Reopened draft launch. You can continue configuring or save it.'));
  }

  function scheduleFriendlySaveCleanup(draftId, editId) {
    savingFriendlyDraftId = draftId || activeFriendlyDraftId || '';
    savingFriendlyEditId = editId || activeRealLaunchId() || '';
    [700, 1600, 2800].forEach(function (ms) {
      setTimeout(cleanupFriendlySavedDrafts, ms);
    });
  }

  function cleanupFriendlySavedDrafts() {
    var realId = activeRealLaunchId();
    if (!realId) return;
    if (savingFriendlyDraftId) {
      removeDraftId(savingFriendlyDraftId);
      savingFriendlyDraftId = '';
    }
    if (savingFriendlyEditId && realId === savingFriendlyEditId) {
      delete friendlyEditDrafts[savingFriendlyEditId];
      savingFriendlyEditId = '';
    }
    renderFriendlyDraftCards();
  }

  function isPostLaunchOpen() {
    return launchStatusValue() === 'completed';
  }

  function addChip(container, text, extraClass) {
    if (!container || !text) return;
    var chip = document.createElement('span');
    chip.className = extraClass ? 'meta-chip ' + extraClass : 'meta-chip';
    chip.textContent = text;
    container.appendChild(chip);
  }

  function refreshFriendlyDetailPreview() {
    if (!isFriendlyMode()) return;
    var title = byId('detailTitle');
    var sub = byId('detailSub');
    var launchName = normalize((byId('launchName') && byId('launchName').value) || ownText(title) || 'Launch mới');
    var type = selectedText(byId('launchType')) || 'Chưa chọn phân loại';
    var status = byId('launchStatus') ? statusLabel(byId('launchStatus').value) : '';
    var owner = normalize((byId('launchOwner') && byId('launchOwner').value) || 'Chưa có owner');
    if (title && title.textContent !== (launchName || 'Launch mới')) title.textContent = launchName || 'Launch mới';
    if (sub) {
      clearNode(sub);
      addChip(sub, status, 'status');
      addChip(sub, type, '');
      addChip(sub, owner, '');
    }
  }

  function refreshChatSummary() {
    var box = byId('friendlyChatSummary');
    if (!box) return;
    clearNode(box);
    [
      normalize((byId('launchName') && byId('launchName').value) || 'Launch mới'),
      selectedText(byId('launchType')) || 'Chưa chọn phân loại',
      normalize((byId('launchOwner') && byId('launchOwner').value) || 'Chưa có owner')
    ].forEach(function (item) {
      var chip = document.createElement('span');
      chip.textContent = item;
      box.appendChild(chip);
    });
  }

  function setNpcSpeech(text) {
    friendlySpeechOverride = normalize(text);
    if (friendlySpeechOverride) setText('friendlyVizSpeech', friendlySpeechOverride);
  }

  function clearNpcSpeech() {
    friendlySpeechOverride = '';
    if (lastSnapshot) updateSpeech(lastSnapshot, currentStep);
  }

  function addChatMessage(role, text) {
    var box = byId('friendlyChatMessages');
    if (!box || !text) return;
    var msg = document.createElement('div');
    msg.className = 'friendly-chat-message ' + (role === 'human' ? 'human' : 'agent');
    msg.textContent = text;
    box.appendChild(msg);
    while (box.children.length > 9) box.removeChild(box.firstElementChild);
    box.scrollTop = box.scrollHeight;
  }

  function addLessonMessage(role, text) {
    var box = byId('friendlyLessonMessages');
    if (!box || !text) return;
    var msg = document.createElement('div');
    msg.className = 'friendly-chat-message ' + (role === 'human' ? 'human' : 'agent');
    msg.textContent = text;
    box.appendChild(msg);
    while (box.children.length > 7) box.removeChild(box.firstElementChild);
    box.scrollTop = box.scrollHeight;
  }

  var FRIENDLY_CHIP_I18N = {
    'Bài học': 'Lessons',
    'Chưa có điểm rủi ro': 'No risk score yet',
    'Chạy phân tích': 'Run analysis',
    'Chỉnh sửa lại': 'Edit again',
    'Hỗ trợ / giải thích': 'Help / explain',
    'Lưu launch': 'Save launch',
    'Nạp Brief Mẫu': 'Load Sample Brief',
    'Xóa launch này': 'Delete launch',
    'Demo mode': 'Demo mode',
    'Export report': 'Export report',
    'Phân loại': 'Type',
    'Phân tích ngay': 'Analyze now',
    'Quay lại': 'Back',
    'Rà soát tuần tự': 'Sequential review',
    'Sắp chạy': 'Upcoming',
    'Sửa launch này': 'Edit this launch',
    'Thời gian': 'Schedule',
    'Trạng thái': 'Status',
    'Tên launch': 'Launch name',
    'Tạo launch mới': 'New launch',
    'Tạo/sửa launch': 'Create/edit launch',
    'Tổng hợp launch': 'Summarize launch',
    'Xem Red Team': 'View Red Team',
    'Xem checklist': 'View checklist',
    'Xem lại brief': 'Review brief',
    'Xem readiness': 'View readiness',
    'Đang chạy': 'Running',
    'Đã chạy': 'Completed'
  };
  var lastChatActions = null;
  function setChatActions(actions) {
    var box = byId('friendlyChatQuickActions');
    if (!box) return;
    lastChatActions = actions;
    var enLang = (localStorage.getItem('launchops_lang') || 'vi') === 'en';
    clearNode(box);
    (actions || []).forEach(function (item) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = enLang ? (FRIENDLY_CHIP_I18N[item.label] || item.label) : item.label;
      button.setAttribute('data-friendly-action', item.action);
      if (item.value !== undefined) button.setAttribute('data-friendly-value', item.value);
      box.appendChild(button);
    });
  }
  // Allow the language switcher (i18n-clean.js) to re-translate chips on toggle.
  window.friendlyRetranslateChips = function () { if (lastChatActions) setChatActions(lastChatActions); };

  function setLessonButtonsDisabled(disabled) {
    [].slice.call(document.querySelectorAll('#friendlyLessonActions button, #friendlyLessonChatForm textarea, #friendlyLessonChatForm button')).forEach(function (control) {
      control.disabled = Boolean(disabled);
    });
  }

  function setLessonActionState() {
    var locked = !isPostLaunchOpen();
    var resultText = normalize((byId('postResultInput') && byId('postResultInput').value) || (byId('friendlyPostResultInput') && byId('friendlyPostResultInput').value));
    var lessonText = normalize((byId('lessonInput') && byId('lessonInput').value) || (byId('friendlyLessonInput') && byId('friendlyLessonInput').value));
    var canReview = !locked && Boolean(resultText);
    var canLesson = canReview && postReviewDone;
    var canSave = canLesson && Boolean(lessonText);

    var post = document.querySelector('#friendlyLessonActions [data-friendly-action="post-result"]');
    var review = document.querySelector('#friendlyLessonActions [data-friendly-action="post-review"]');
    var lesson = document.querySelector('#friendlyLessonActions [data-friendly-action="lesson"]');
    var save = document.querySelector('#friendlyLessonActions [data-friendly-action="save-lesson"]');
    var input = byId('friendlyLessonChatInput');
    var send = document.querySelector('#friendlyLessonChatForm button');

    [post, review, lesson, save, input, send].forEach(function (control) {
      if (control) control.disabled = locked;
    });
    if (review) review.disabled = !canReview;
    if (lesson) lesson.disabled = !canLesson;
    if (save) save.disabled = !canSave;
  }

  function chatInputPlaceholder(text) {
    var input = byId('friendlyChatInput');
    if (input) input.placeholder = text || ftr('Gõ câu trả lời hoặc dán brief ở đây', 'Type an answer or paste the brief here');
  }

  function fieldHint(field) {
    if (field === 'name') return 'đặt tên launch ngắn, dễ nhận ra trong danh sách.';
    if (field === 'type') return 'chọn phân loại để dùng đúng bộ luật đánh giá.';
    if (field === 'owner') return 'nhập owner chính để checklist có người chịu trách nhiệm.';
    if (field === 'dates') return 'nhập Start - End theo dạng dd/mm/yyyy - dd/mm/yyyy.';
    if (field === 'brief') return 'dán brief thô, càng rõ mục tiêu và phạm vi càng tốt.';
    if (field === 'postResult') return 'ghi kết quả thật sau launch để lưu bài học.';
    if (field === 'lesson') return 'ghi bài học ngắn, có thể dùng lại cho launch sau.';
    return 'chọn thao tác hoặc gõ trực tiếp cho Mission Control.';
  }

  function guidanceText(snapshot) {
    if (chatAwaiting) return ftr('Gợi ý tiếp theo: ', 'Next suggestion: ') + fieldHint(chatAwaiting);
    if (chatFlow === 'new') return ftr('Gợi ý tiếp theo: mình sẽ tự dẫn từng mục cho tới khi đủ launch brief.', 'Next suggestion: I will walk through each field until the launch brief is complete.');
    if (!snapshot || snapshot.state === 'idle') return ftr('Gợi ý tiếp theo: tạo/sửa launch bằng chat, hoặc chạy phân tích khi brief đã đủ.', 'Next suggestion: create/edit a launch in chat, or run analysis when the brief is ready.');
    if (snapshot.topRisks && snapshot.topRisks.length) return ftr('Gợi ý tiếp theo: xử lý "', 'Next suggestion: fix "') + shorten(snapshot.topRisks[0], 86) + ftr('" trước khi launch.', '" before launch.');
    return ftr('Gợi ý tiếp theo: xem readiness, phản biện và checklist trước khi lưu quyết định.', 'Next suggestion: review readiness, red-team notes, and checklist before saving the decision.');
  }

  function updateGuidance(text) {
    typeText(text || guidanceText(lastSnapshot));
  }

  function postResultText() {
    return normalize((byId('postResultInput') && byId('postResultInput').value) || (byId('friendlyPostResultInput') && byId('friendlyPostResultInput').value));
  }

  function lessonText() {
    return normalize((byId('lessonInput') && byId('lessonInput').value) || (byId('friendlyLessonInput') && byId('friendlyLessonInput').value));
  }

  function postReviewSuggestions(resultText) {
    var folded = fold(resultText);
    var suggestions = [
      {
        title: 'So sánh mục tiêu ban đầu với kết quả thật',
        detail: 'Ghi rõ đạt/chưa đạt, lệch ở chỉ số nào, và nguyên nhân vận hành có thể kiểm chứng.'
      }
    ];
    if (folded.indexOf('faq') !== -1 || folded.indexOf('cs') !== -1 || folded.indexOf('support') !== -1) {
      suggestions.push({
        title: 'Đưa CS FAQ vào checklist trước launch',
        detail: 'Kết quả có nhắc tới CS/FAQ, nên lần sau cần chốt câu trả lời mẫu trước T-1.'
      });
    }
    if (folded.indexOf('rollback') !== -1 || folded.indexOf('pause') !== -1 || folded.indexOf('dung') !== -1) {
      suggestions.push({
        title: 'Chốt ngưỡng dừng hoặc rollback sớm hơn',
        detail: 'Kết quả có tín hiệu phải dừng/rollback, nên brief sau cần có ngưỡng quyết định rõ.'
      });
    }
    if (folded.indexOf('reward') !== -1 || folded.indexOf('thuong') !== -1 || folded.indexOf('qua') !== -1) {
      suggestions.push({
        title: 'Thêm reviewer Economy/Reward',
        detail: 'Kết quả có liên quan phần thưởng, nên cần người rà soát ngân sách và khả năng lạm dụng.'
      });
    }
    if (lastSnapshot && lastSnapshot.topRisks && lastSnapshot.topRisks.length) {
      suggestions.push({
        title: 'Biến rủi ro pre-launch thành bài học',
        detail: shorten(lastSnapshot.topRisks[0], 130)
      });
    }
    return suggestions.slice(0, 4);
  }

  function renderPostReviewSuggestions(items) {
    var box = byId('friendlyLessonSuggestions');
    if (!box) return;
    clearNode(box);
    (items || []).forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'friendly-lesson-suggestion';
      var title = document.createElement('b');
      title.textContent = item.title;
      var detail = document.createElement('span');
      detail.textContent = item.detail;
      row.appendChild(title);
      row.appendChild(detail);
      box.appendChild(row);
    });
  }

  function runPostLaunchReview() {
    var resultText = postResultText();
    if (!resultText) {
      addLessonMessage('agent', ftr('Cần nhập kết quả sau launch trước, rồi mình mới phân tích sau launch được.', 'Post-launch result is required before I can run the post-launch review.'));
      lessonAwaiting = 'postResult';
      setLessonActionState();
      return false;
    }
    var key = resultText + '|' + (lastSnapshot && lastSnapshot.decision ? lastSnapshot.decision : '');
    postReviewKey = key;
    postReviewDone = true;
    renderPostReviewSuggestions(postReviewSuggestions(resultText));
    addLessonMessage('agent', ftr('Mình đã phân tích kết quả sau launch và đưa đề xuất bên dưới. Bước tiếp theo: thêm bài học ngắn để lưu lại.', 'I have reviewed the post-launch result and added suggestions below. Next: add a short lesson to save.'));
    setNpcSpeech(ftr('Đã phân tích sau launch, đang chờ bài học cuối cùng.', 'Post-launch reviewed. Waiting for the final lesson.'));
    lessonAwaiting = 'lesson';
    var input = byId('friendlyLessonChatInput');
    if (input) input.placeholder = ftr('Nhập bài học rút ra sau launch', 'Enter lesson learned');
    setLessonActionState();
    return true;
  }

  function refreshPostLaunchPanel() {
    var panel = document.querySelector('.friendly-lesson-chat');
    var gate = byId('friendlyLessonGate');
    var status = byId('friendlyLessonStatusText');
    var input = byId('friendlyLessonChatInput');
    if (!panel) return;

    var locked = !isPostLaunchOpen();
    panel.classList.toggle('is-locked', locked);
    if (gate) {
      gate.classList.toggle('is-locked', locked);
      gate.classList.toggle('is-ready', !locked);
      gate.textContent = locked ? ftr('Chưa tới sau launch', 'Post-launch not yet') : ftr('Sau launch', 'Post-launch');
    }
    if (status) {
      status.textContent = locked
        ? ftr('Launch chưa ở trạng thái Đã chạy. Sau khi launch xong, quay lại nhập kết quả và bài học.', 'Launch is not completed yet. Once it finishes, come back to enter results and lessons.')
        : ftr('Flow bắt buộc: nhập kết quả sau launch -> Agent phân tích -> thêm bài học -> lưu.', 'Required flow: enter post-launch result → Agent reviews → add lesson → save.');
    }
    if (input) {
      input.placeholder = locked
        ? ftr('Chỉ nhập sau khi launch đã chạy xong', 'Only available after the launch has completed')
        : (lessonAwaiting === 'lesson' ? ftr('Nhập bài học rút ra sau launch', 'Enter lesson learned') : ftr('Nhập kết quả sau launch ở đây', 'Enter post-launch result here'));
    }
    var currentResult = postResultText();
    var currentKey = currentResult + '|' + (lastSnapshot && lastSnapshot.decision ? lastSnapshot.decision : '');
    if (!currentResult) {
      postReviewDone = false;
      postReviewKey = '';
      renderPostReviewSuggestions([]);
    } else if (postReviewDone && postReviewKey && postReviewKey !== currentKey) {
      postReviewDone = false;
      renderPostReviewSuggestions([]);
    }
    setLessonActionState();
  }

  function showHomeActions() {
    chatAwaiting = '';
    chatFlow = '';
    chatFlowSteps = [];
    chatFlowIndex = -1;
    chatInputPlaceholder(ftr('Gõ yêu cầu, ví dụ: đổi owner thành PM LiveOps', 'Type a request, e.g. change owner to PM LiveOps'));
    updateGuidance();
    setChatActions([
      { label: 'Tạo launch mới', action: 'new' },
      { label: 'Sửa launch này', action: 'edit' },
      { label: 'Tổng hợp launch', action: 'summarize' },
      { label: 'Hỗ trợ / giải thích', action: 'support' },
      { label: 'Nạp Brief Mẫu', action: 'sample' },
      { label: 'Lưu launch', action: 'save' },
      { label: 'Xóa launch này', action: 'delete' },
      { label: 'Chạy phân tích', action: 'analyze' },
      { label: 'Demo mode', action: 'demo' },
      { label: 'Export report', action: 'export' },
      { label: 'Bài học', action: 'lesson' }
    ]);
  }

  function showEditActions() {
    chatAwaiting = '';
    chatFlow = 'edit';
    chatFlowSteps = [];
    chatFlowIndex = -1;
    chatInputPlaceholder(ftr('Chọn mục cần sửa hoặc gõ nội dung', 'Pick a field to edit or type directly'));
    updateGuidance('Gợi ý tiếp theo: chọn một mục cần sửa, mình sẽ cập nhật ngay trong Chi tiết launch.');
    setChatActions([
      { label: 'Tên launch', action: 'field', value: 'name' },
      { label: 'Phân loại', action: 'field', value: 'type' },
      { label: 'Owner', action: 'field', value: 'owner' },
      { label: 'Thời gian', action: 'field', value: 'dates' },
      { label: 'Trạng thái', action: 'field', value: 'status' },
      { label: 'Brief', action: 'field', value: 'brief' },
      { label: 'Rà soát tuần tự', action: 'edit-sequential' },
      { label: 'Lưu launch', action: 'save' }
    ]);
  }

  function setRealField(realId, value) {
    var real = byId(realId);
    if (!real) return false;
    if (real.disabled) {
      addChatMessage('agent', ftr('Bản demo hiện mở full quyền thao tác. Nếu nút chưa dùng được, hãy kiểm tra launch đã có dữ liệu hợp lệ hoặc mở Pro để xem chi tiết.', 'This demo allows full actions. If a button is not available, check that the launch has valid data or switch to Pro for details.'));
      return false;
    }
    setControlValue(real, value);
    dispatchControlEvents(real);
    syncFriendlyFormFromReal();
    persistActiveFriendlySession(true);
    refreshFriendlyDetailPreview();
    refreshChatSummary();
    return true;
  }

  function clickRealButton(realId) {
    var real = byId(realId);
    if (!real || real.disabled) {
      addChatMessage('agent', ftr('Nút này hiện chưa dùng được với dữ liệu launch hiện tại. Hãy kiểm tra brief hoặc trạng thái launch rồi thử lại.', 'This button is not available for the current launch data. Check the brief or launch status, then try again.'));
      return false;
    }
    real.click();
    return true;
  }

  function showTypeActions() {
    var select = byId('launchType');
    var actions = [].slice.call((select && select.options) || []).slice(0, 8).map(function (option) {
      return { label: option.textContent, action: 'set-type', value: option.value };
    });
    actions.push({ label: 'Quay lại', action: 'edit' });
    setChatActions(actions);
  }

  function showStatusActions() {
    setChatActions([
      { label: 'Sắp chạy', action: 'set-status', value: 'upcoming' },
      { label: 'Đang chạy', action: 'set-status', value: 'running' },
      { label: 'Đã chạy', action: 'set-status', value: 'completed' },
      { label: 'Quay lại', action: 'edit' }
    ]);
  }

  function promptField(field) {
    chatAwaiting = field;
    setChatActions([]);
    updateGuidance('Gợi ý tiếp theo: ' + fieldHint(field));
    if (field === 'name') {
      addChatMessage('agent', ftr('Bạn đặt tên launch là gì?', 'What should we call this launch?'));
      chatInputPlaceholder(ftr('Ví dụ: Golden Spin Weekend', 'e.g. Golden Spin Weekend'));
      setNpcSpeech(ftr('Đang chờ tên launch. Tôi sẽ gắn tên này vào chi tiết ngay khi bạn gửi.', 'Waiting for launch name. I will fill it in as soon as you send.'));
    } else if (field === 'type') {
      chatAwaiting = 'type';
      addChatMessage('agent', ftr('Chọn hoặc gõ phân loại launch để mình dùng đúng template. Ví dụ: Sự kiện game.', 'Choose or type the launch type so I use the right template. e.g. Game event.'));
      chatInputPlaceholder(ftr('Gõ phân loại, hoặc gõ "giữ nguyên"', 'Type a type, or type "keep"'));
      setNpcSpeech(ftr('Đang chờ bạn chọn phân loại.', 'Waiting for launch type.'));
      showTypeActions();
    } else if (field === 'status') {
      chatAwaiting = 'status';
      addChatMessage('agent', ftr('Chọn hoặc gõ trạng thái launch: Sắp chạy, Đang chạy, hoặc Đã chạy.', 'Choose or type the launch status: Upcoming, Running, or Completed.'));
      chatInputPlaceholder(ftr('Gõ trạng thái, hoặc gõ "giữ nguyên"', 'Type a status, or type "keep"'));
      setNpcSpeech(ftr('Đang chờ trạng thái launch.', 'Waiting for launch status.'));
      showStatusActions();
    } else if (field === 'owner') {
      addChatMessage('agent', ftr('Ai là owner chính của launch này?', 'Who is the main owner of this launch?'));
      chatInputPlaceholder(ftr('Ví dụ: PM LiveOps', 'e.g. PM LiveOps'));
      setNpcSpeech(ftr('Đang chờ owner để cập nhật phần chi tiết launch.', 'Waiting for owner to update launch details.'));
    } else if (field === 'dates') {
      addChatMessage('agent', ftr('Gõ thời gian dạng Start - End. Ví dụ: 12/06/2026 - 14/06/2026.', 'Type dates as Start - End. e.g. 12/06/2026 - 14/06/2026.'));
      chatInputPlaceholder(ftr('12/06/2026 - 14/06/2026', '12/06/2026 - 14/06/2026'));
      setNpcSpeech(ftr('Đang chờ mốc thời gian. Chỉ cần nhập Start - End.', 'Waiting for dates. Just type Start - End.'));
    } else if (field === 'brief') {
      addChatMessage('agent', ftr('Dán brief thô vào đây. Không cần văn hay, chỉ cần đủ dữ liệu để Agent đọc.', 'Paste the raw brief here. No need to be polished — just enough data for the Agent to read.'));
      chatInputPlaceholder(ftr('Dán brief launch...', 'Paste brief here...'));
      setNpcSpeech(ftr('Đang chờ brief. Tôi sẽ đọc mục tiêu, phạm vi và phần còn mơ hồ.', 'Waiting for brief. I will read goals, scope, and unclear areas.'));
    } else if (field === 'postResult') {
      addChatMessage('agent', ftr('Kết quả sau launch thực tế là gì?', 'What was the actual post-launch result?'));
      chatInputPlaceholder(ftr('Ví dụ: đạt 82% target, còn lỗi CS FAQ...', 'e.g. hit 82% target, CS FAQ had issues...'));
      setNpcSpeech(ftr('Đang chờ kết quả thật sau launch.', 'Waiting for the actual post-launch result.'));
    } else if (field === 'lesson') {
      addChatMessage('agent', ftr('Bài học mới cần lưu là gì?', 'What lesson should we save?'));
      chatInputPlaceholder(ftr('Ví dụ: Lần sau phải chốt FAQ trước T-1.', 'e.g. Next time confirm FAQ by T-1.'));
      setNpcSpeech(ftr('Đang chờ bài học để lưu lại cho lần sau.', 'Waiting for a lesson to save for next time.'));
    } else {
      chatAwaiting = '';
      addChatMessage('agent', ftr('Bạn muốn sửa mục nào?', 'Which field do you want to edit?'));
      showEditActions();
    }
  }

  function parseDates(text) {
    var parts = String(text || '').split(/\s*(?:-|->|đến|den|to)\s*/i).map(normalize).filter(Boolean);
    return {
      start: parts[0] || '',
      end: parts[1] || ''
    };
  }

  function beginNewLaunchFlow() {
    chatFlow = 'new';
    chatFlowSteps = NEW_LAUNCH_FLOW.slice();
    chatFlowIndex = 0;
    chatAwaiting = '';
    clearNode(byId('friendlyChatMessages'));
    addChatMessage('agent', ftr('Mình bắt đầu một launch mới. Mình sẽ hỏi từng phần và tự điền vào LaunchOps.', 'Starting a new launch. I will ask step by step and fill in LaunchOps for you.'));
    setNpcSpeech(ftr('Bắt đầu cấu hình launch mới.', 'Starting new launch setup.'));
    promptField(chatFlowSteps[chatFlowIndex]);
    focusFriendlyFirstInput();
  }

  function beginEditLaunchFlow() {
    chatFlow = 'edit';
    chatFlowSteps = EDIT_LAUNCH_FLOW.slice();
    chatFlowIndex = 0;
    chatAwaiting = '';
    clearNode(byId('friendlyChatMessages'));
    addChatMessage('agent', ftr('Mình sẽ rà soát launch đang lưu theo từng mục. Nếu mục nào giữ nguyên, bạn gõ "giữ nguyên".', 'I will go through each field. If a field stays the same, type "keep".'));
    setNpcSpeech(ftr('Bắt đầu flow sửa launch tuần tự.', 'Starting sequential edit flow.'));
    promptField(chatFlowSteps[chatFlowIndex]);
    focusFriendlyFirstInput();
  }

  function briefReviewText() {
    return [
      'Tóm tắt trước khi phân tích:',
      '- Tên: ' + normalize((byId('launchName') && byId('launchName').value) || 'Chưa có'),
      '- Phân loại: ' + (selectedText(byId('launchType')) || 'Chưa chọn'),
      '- Owner: ' + normalize((byId('launchOwner') && byId('launchOwner').value) || 'Chưa có'),
      '- Thời gian: ' + [normalize((byId('launchTargetDate') && byId('launchTargetDate').value) || ''), normalize((byId('launchEndDate') && byId('launchEndDate').value) || '')].filter(Boolean).join(' - '),
      '- Brief: ' + shorten((byId('briefInput') && byId('briefInput').value) || 'Chưa có brief', 220)
    ].join('\n');
  }

  function friendlyList(items, emptyText, mapper, limit) {
    var list = (items || []).slice(0, limit || 3);
    if (!list.length) return '- ' + emptyText;
    return list.map(function (item, index) {
      return '- ' + (mapper ? mapper(item, index) : item);
    }).join('\n');
  }

  function launchSummaryText() {
    var snapshot = collectSnapshot();
    var hasAnalysis = hasRealAnalysis();
    var status = selectedText(byId('launchStatus')) || 'Chưa rõ';
    var owner = normalize((byId('launchOwner') && byId('launchOwner').value) || 'Chưa có owner');
    var start = normalize((byId('launchTargetDate') && byId('launchTargetDate').value) || '');
    var end = normalize((byId('launchEndDate') && byId('launchEndDate').value) || '');
    var dateText = [start, end].filter(Boolean).join(' - ') || 'Chưa có thời gian';
    var brief = normalize((byId('briefInput') && byId('briefInput').value) || '');
    var postResult = postResultText();
    var savedLesson = lessonText();
    var nextAction = '';

    if (!brief) nextAction = 'Nhập brief trước để Mission Control có dữ liệu đọc.';
    else if (!hasAnalysis) nextAction = 'Chốt brief rồi chạy phân tích trước launch để có readiness, Red Team và checklist.';
    else if (snapshot.topRisks && snapshot.topRisks.length) nextAction = 'Xử lý rủi ro đầu tiên: ' + shorten(snapshot.topRisks[0], 120);
    else if (!isPostLaunchOpen()) nextAction = 'Theo dõi launch; khi chạy xong thì chuyển sang Bài học để nhập kết quả sau launch.';
    else if (!postResult) nextAction = 'Nhập kết quả sau launch trước, rồi để Agent phân tích sau launch.';
    else if (!postReviewDone) nextAction = 'Chạy phân tích sau launch để có đề xuất trước khi lưu bài học.';
    else if (!savedLesson) nextAction = 'Thêm ít nhất một bài học ngắn rồi lưu kết quả / bài học.';
    else nextAction = 'Lưu kết quả / bài học và dùng lại cho launch sau.';

    return [
      'Tổng hợp launch hiện tại:',
      '- Tên: ' + snapshot.launchName,
      '- Phân loại: ' + snapshot.launchType,
      '- Trạng thái: ' + status,
      '- Owner: ' + owner,
      '- Thời gian: ' + dateText,
      '- Brief: ' + shorten(snapshot.briefGoal || brief || 'Chưa có brief', 180),
      '',
      'Readiness:',
      hasAnalysis
        ? '- ' + snapshot.scoreLabel + ' ' + snapshot.score.text + ' | ' + snapshot.decision + ' | ' + snapshot.gate
        : '- Chưa có phân tích trước launch.',
      snapshot.scoreReason ? '- Lý do: ' + shorten(snapshot.scoreReason, 180) : '',
      '',
      'Top risks:',
      friendlyList(snapshot.topRisks, 'Chưa có top risk. Hãy chạy phân tích trước launch.', function (item) { return shorten(item, 150); }, 3),
      '',
      'Red Team:',
      friendlyList(snapshot.voices, 'Chưa có phản biện. Hãy chạy phân tích trước launch.', function (item) {
        return item.persona + ': ' + shorten(item.worry, 130);
      }, 3),
      '',
      'Checklist:',
      friendlyList(snapshot.tasks, 'Chưa có checklist. Hãy chạy phân tích trước launch.', function (item) {
        return item.name + (item.meta ? ' | ' + item.meta : '');
      }, 4),
      '',
      'Sau launch:',
      '- Kết quả: ' + (postResult ? shorten(postResult, 160) : 'Chưa nhập'),
      '- Bài học: ' + (savedLesson ? shorten(savedLesson, 160) : 'Chưa lưu bài học mới trong form Friendly'),
      '',
      'Gợi ý tiếp theo: ' + nextAction
    ].filter(function (line) { return line !== ''; }).join('\n');
  }

  function friendlySupportActions() {
    return [
      { label: 'Tổng hợp launch', action: 'summarize' },
      { label: 'Rule readiness', action: 'support-topic', value: 'readiness' },
      { label: 'Red Team', action: 'support-topic', value: 'red-team' },
      { label: 'Checklist', action: 'support-topic', value: 'checklist' },
      { label: 'Bài học', action: 'support-topic', value: 'lessons' },
      { label: 'Tạo/sửa launch', action: 'support-topic', value: 'flow' }
    ];
  }

  function supportText(topic) {
    var low = fold(topic || '');
    var snapshot = collectSnapshot();
    if (low.indexOf('readiness') !== -1 || low.indexOf('diem') !== -1 || low.indexOf('cham') !== -1 || low.indexOf('rule') !== -1 || low.indexOf('luat') !== -1) {
      return [
        'Rule readiness dùng để trả lời câu hỏi: launch này đã đủ an toàn để chạy chưa?',
        'Friendly không tự chấm điểm lại. Nó đọc kết quả thật từ bản Pro sau khi bạn bấm Chạy phân tích.',
        'Điểm được gom từ các nhóm rủi ro của phân loại/template hiện tại. Green nghĩa là tương đối sẵn sàng, Yellow nghĩa là cần sửa trước khi launch, Red nghĩa là nên dừng để xử lý rủi ro lớn.',
        snapshot.score && hasRealAnalysis() ? 'Launch hiện tại đang là ' + snapshot.scoreLabel + ' ' + snapshot.score.text + ': ' + snapshot.gate + '.' : 'Launch hiện tại chưa có phân tích, nên chưa có màu readiness thật.'
      ].join('\n');
    }
    if (low.indexOf('red') !== -1 || low.indexOf('phan bien') !== -1) {
      return 'Red Team là nhóm góc nhìn phản biện trước launch. Nó không thay Human quyết định, mà chỉ chỉ ra chỗ dễ hỏng: người chơi hiểu nhầm, CS bị quá tải, kỹ thuật thiếu rollback, reward bị exploit, hoặc business guardrail chưa rõ. Sau khi phân tích, Friendly sẽ đọc các thẻ Red Team thật từ DOM.';
    }
    if (low.indexOf('checklist') !== -1 || low.indexOf('viec') !== -1) {
      return 'Checklist biến brief và rủi ro thành việc cần làm có owner, deadline và trạng thái. Với Friendly, Human có thể chat để sửa brief/owner/thời gian; sau khi chạy phân tích thì checklist thật từ Pro sẽ hiện ở bước Việc cần làm.';
    }
    if (low.indexOf('lesson') !== -1 || low.indexOf('bai hoc') !== -1 || low.indexOf('post') !== -1) {
      return 'Bài học là phân tích bắt buộc lần thứ hai, sau khi launch đã chạy. Flow đúng là: nhập kết quả sau launch, để Agent phân tích và đề xuất, sau đó mới thêm bài học và lưu lại cho launch sau.';
    }
    if (low.indexOf('brief') !== -1 || low.indexOf('nap') !== -1) {
      return 'Brief không cần văn hay, nhưng nên có mục tiêu, đối tượng, thời gian, owner, kênh truyền thông, reward/impact, rủi ro còn mở và cách dừng/rollback. Nếu thiếu, cứ dán thô vào chat; Mission Control sẽ chỉ ra phần còn mơ hồ sau khi phân tích.';
    }
    if (low.indexOf('flow') !== -1 || low.indexOf('tao') !== -1 || low.indexOf('sua') !== -1 || low.indexOf('cach dung') !== -1 || low.indexOf('huong dan') !== -1) {
      return 'Friendly khác Pro ở cách thao tác: Human chat hoặc bấm nút nhanh, Mission Control dẫn từng bước và tự điền vào form thật. Pro là bảng điều khiển thủ công. Khi tạo/sửa launch, bạn có thể gõ tự nhiên như "đổi owner thành PM LiveOps", "sửa thời gian 12/06 - 18/06", hoặc "dán brief".';
    }
    return [
      'Mình có thể hỗ trợ trong phạm vi LaunchOps Command Center:',
      '- Tổng hợp tình trạng launch hiện tại.',
      '- Giải thích rule readiness, Green/Yellow/Red và vì sao cần phân tích trước launch.',
      '- Giải thích Red Team, checklist, post-launch và bài học.',
      '- Hướng dẫn tạo/sửa launch bằng chat, nhưng không thay Human quyết định.',
      'Bạn có thể hỏi kiểu: "tổng hợp launch này", "giải thích rule chấm điểm", hoặc "nạp brief thế nào cho đúng?".'
    ].join('\n');
  }

  function isSummaryIntent(text) {
    var low = fold(text);
    return low.indexOf('tong hop') !== -1
      || low.indexOf('tom tat') !== -1
      || low.indexOf('trich xuat') !== -1
      || (low.indexOf('toan bo') !== -1 && low.indexOf('launch') !== -1)
      || (low.indexOf('tinh trang') !== -1 && low.indexOf('launch') !== -1)
      || low.indexOf('launch nay dang sao') !== -1;
  }

  function isSupportIntent(text) {
    var low = fold(text);
    if (low.indexOf('giai thich') !== -1 || low.indexOf('huong dan') !== -1 || low.indexOf('ho tro') !== -1 || low.indexOf('help') !== -1) return true;
    if (low.indexOf('rule') !== -1 || low.indexOf('luat') !== -1 || low.indexOf('cach dung') !== -1 || low.indexOf('tai sao') !== -1) return true;
    if (low.indexOf('readiness') !== -1 || low.indexOf('cham diem') !== -1 || low.indexOf('muc san sang') !== -1) return true;
    if (low.indexOf('red team') !== -1 || low.indexOf('phan bien') !== -1) return true;
    if ((low.indexOf('brief') !== -1 || low.indexOf('checklist') !== -1 || low.indexOf('bai hoc') !== -1) && (low.indexOf('la gi') !== -1 || low.indexOf('the nao') !== -1 || low.indexOf('dung') !== -1 || low.indexOf('nen') !== -1)) return true;
    return false;
  }

  // Nhận diện yêu cầu xóa launch hiện tại
  function isDeleteIntent(text) {
    var low = fold(text);
    if (low.indexOf('xoa launch') !== -1) return true;
    if (low.indexOf('delete launch') !== -1) return true;
    if (low.indexOf('huy launch') !== -1 || low.indexOf('huy bo launch') !== -1) return true;
    if (low === 'xoa' || low === 'delete' || low === 'xoa di' || low === 'xoa no') return true;
    if ((low.indexOf('xoa') !== -1 || low.indexOf('delete') !== -1) && (low.indexOf('launch') !== -1 || low.indexOf('cai nay') !== -1 || low.indexOf('no di') !== -1 || low.indexOf('item') !== -1)) return true;
    return false;
  }

  // Nhận diện yêu cầu LLM viết brief từ ý tưởng thô của Human
  function isWriteBriefIntent(text) {
    var low = fold(text);
    if (low.indexOf('viet brief') !== -1) return true;
    if (low.indexOf('viet ho') !== -1 || low.indexOf('viet giup') !== -1) return true;
    if (low.indexOf('soan brief') !== -1) return true;
    if (low.indexOf('viet hoan chinh') !== -1) return true;
    if ((low.indexOf('giup') !== -1 || low.indexOf('giùm') !== -1) && low.indexOf('brief') !== -1) return true;
    if (low.indexOf('tu y tuong') !== -1 || low.indexOf('expand brief') !== -1) return true;
    if (low.indexOf('lam brief') !== -1 || low.indexOf('tao brief') !== -1) return true;
    return false;
  }

  // Gọi backend yêu cầu LLM viết brief launch hoàn chỉnh từ ý tưởng thô
  function callAssistantForBriefWriter(idea, callback) {
    var base = (window.LAUNCHOPS_API_BASE || '').trim().replace(/\/$/, '');
    if (!base) {
      var hostLocal = ['127.0.0.1', 'localhost', '::1'].indexOf(window.location.hostname) !== -1;
      base = hostLocal ? 'http://127.0.0.1:8788/api' : '';
    }
    if (!base) { callback(null); return; }
    // Prompt NGẮN để né timeout 35s mặc định của backend.
    var prompt = 'Viết brief launch ngắn gọn (8 mục, mỗi mục 1-2 câu, dạng "- Mục: nội dung", không markdown):\n'
      + '- Mục tiêu + KPI\n- Đối tượng\n- Cơ chế\n- Phần thưởng/ngân sách\n- Thời gian\n- Rủi ro + phòng\n- CS/owner\n- Đo lường\n\n'
      + 'Ý tưởng: ' + (idea || '');
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 35000);
    fetch(base + '/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.json(); })
      .then(function (data) { clearTimeout(timer); callback(data && data.reply ? String(data.reply) : null); })
      .catch(function () { clearTimeout(timer); callback(null); });
  }

  // Nhận diện câu hỏi mở: xin góp ý / đánh giá / review / cải tiến / lời khuyên
  function isAdviceIntent(text) {
    var low = fold(text);
    if (low.indexOf('gop y') !== -1) return true;
    if (low.indexOf('danh gia') !== -1) return true;
    if (low.indexOf('nhan xet') !== -1) return true;
    if (low.indexOf('review') !== -1 || low.indexOf('feedback') !== -1) return true;
    if (low.indexOf('y kien') !== -1) return true;
    if (low.indexOf('loi khuyen') !== -1 || low.indexOf('khuyen') !== -1) return true;
    if (low.indexOf('cai tien') !== -1 || low.indexOf('cai thien') !== -1) return true;
    if (low.indexOf('de xuat') !== -1) return true;
    if (low.indexOf('thieu gi') !== -1 || low.indexOf('con thieu') !== -1) return true;
    return false;
  }

  // Đọc context launch hiện tại từ DOM (không gọi lại logic chấm điểm)
  function currentLaunchContextForChat() {
    var ctx = { name: '', type: '', status: '', owner: '', brief: '', score: '', readinessColor: '', risks: '' };
    try {
      var nameEl = byId('launchName'); if (nameEl) ctx.name = nameEl.value || '';
      var typeEl = byId('launchType'); if (typeEl) ctx.type = typeEl.options && typeEl.selectedIndex >= 0 ? typeEl.options[typeEl.selectedIndex].text : (typeEl.value || '');
      var statusEl = byId('launchStatus'); if (statusEl) ctx.status = statusEl.options && statusEl.selectedIndex >= 0 ? statusEl.options[statusEl.selectedIndex].text : (statusEl.value || '');
      var ownerEl = byId('launchOwner'); if (ownerEl) ctx.owner = ownerEl.value || '';
      var briefEl = byId('briefInput'); if (briefEl) ctx.brief = briefEl.value || '';
      var sv = byId('scoreValue'); if (sv) ctx.score = (sv.textContent || '').trim();
      var sc = byId('scoreColor'); if (sc) ctx.readinessColor = (sc.textContent || '').trim();
      var risks = byId('topRisks');
      if (risks) {
        var items = risks.querySelectorAll('li');
        var arr = [];
        for (var i = 0; i < items.length && i < 6; i++) arr.push((items[i].textContent || '').trim());
        ctx.risks = arr.filter(function (x) { return x; }).join(' | ');
      }
    } catch (e) { /* fail silent */ }
    return ctx;
  }

  // Gọi backend /api/assistant với context launch hiện tại. callback(reply|null).
  function callAssistantForChat(userMessage, ctx, callback) {
    var base = (window.LAUNCHOPS_API_BASE || '').trim().replace(/\/$/, '');
    if (!base) {
      var hostLocal = ['127.0.0.1', 'localhost', '::1'].indexOf(window.location.hostname) !== -1;
      base = hostLocal ? 'http://127.0.0.1:8788/api' : '';
    }
    if (!base) { callback(null); return; }
    var contextBlock = '';
    if (ctx && (ctx.brief || ctx.name)) {
      contextBlock = '\n\n--- Context launch hiện tại (do Human đang mở) ---\n'
        + 'Tên: ' + (ctx.name || '(chưa đặt)') + '\n'
        + 'Phân loại: ' + (ctx.type || '(chưa chọn)') + '\n'
        + 'Trạng thái: ' + (ctx.status || '(chưa rõ)') + '\n'
        + 'Owner: ' + (ctx.owner || '(chưa giao)') + '\n'
        + 'Mức sẵn sàng: ' + (ctx.score || '(chưa phân tích)') + ' ' + (ctx.readinessColor || '') + '\n'
        + (ctx.risks ? 'Rủi ro hàng đầu đang nổi: ' + ctx.risks + '\n' : '')
        + 'Brief hiện tại:\n' + (ctx.brief || '(chưa có brief)') + '\n'
        + '--- Hết context ---';
    }
    var payload = JSON.stringify({ message: userMessage + contextBlock });
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 28000);
    fetch(base + '/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) { return r.json(); })
      .then(function (data) { clearTimeout(timer); callback(data && data.reply ? String(data.reply) : null); })
      .catch(function () { clearTimeout(timer); callback(null); });
  }

  function showPreAnalyzeDecision() {
    chatFlow = 'final';
    chatFlowSteps = [];
    chatFlowIndex = -1;
    chatAwaiting = 'finalDecision';
    addChatMessage('agent', briefReviewText());
    addChatMessage('agent', ftr('Bạn đã chốt final brief chưa? Gõ "phân tích" để chạy phân tích trước launch, "xem lại" để xem brief, hoặc "sửa" để chỉnh tiếp.', 'Is the brief finalized? Type "analyze" to run pre-launch analysis, "review" to read the brief, or "edit" to keep adjusting.'));
    setNpcSpeech(ftr('Đang chờ Human chốt final trước phân tích pre-launch.', 'Waiting for final confirmation before pre-launch analysis.'));
    updateGuidance('Gợi ý tiếp theo: chốt final rồi mới chạy phân tích trước launch.');
    chatInputPlaceholder(ftr('Gõ: phân tích / xem lại / sửa', 'Type: analyze / review / edit'));
    setChatActions([
      { label: 'Phân tích ngay', action: 'final-analyze' },
      { label: 'Xem lại brief', action: 'final-review' },
      { label: 'Chỉnh sửa lại', action: 'final-edit' },
      { label: 'Lưu launch', action: 'save' }
    ]);
  }

  function advanceLaunchFlow(doneField) {
    if (chatFlow !== 'new' && chatFlow !== 'edit') return false;
    if (chatFlowSteps[chatFlowIndex] !== doneField) return false;
    chatFlowIndex += 1;
    if (chatFlowIndex >= chatFlowSteps.length) {
      showPreAnalyzeDecision();
      return true;
    }
    promptField(chatFlowSteps[chatFlowIndex]);
    return true;
  }

  function finishField(message, field) {
    addChatMessage('agent', message);
    chatAwaiting = '';
    if (field && advanceLaunchFlow(field)) return;
    showEditActions();
  }

  function handleChatText(text) {
    var value = normalize(text);
    if (!value) return;
    addChatMessage('human', value);

    if (isSummaryIntent(value)) {
      addChatMessage('agent', launchSummaryText());
      setNpcSpeech(ftr('Đang tổng hợp tình trạng launch hiện tại cho Human.', 'Summarising the current launch status.'));
      updateGuidance('Gợi ý tiếp theo: hỏi tiếp về rule, rủi ro, checklist hoặc chốt phân tích trước launch.');
      setChatActions(friendlySupportActions());
      return;
    }

    if (isSupportIntent(value)) {
      addChatMessage('agent', supportText(value));
      setNpcSpeech(ftr('Đang giải thích theo ngữ cảnh thao tác của Human.', 'Explaining based on current action context.'));
      updateGuidance('Gợi ý tiếp theo: hỏi rõ phần bạn muốn hiểu, hoặc quay lại tạo/sửa launch.');
      setChatActions(friendlySupportActions());
      return;
    }

    // Xóa launch hiện tại — gọi nút thật #deleteLaunch (app.js sẽ hỏi xác nhận).
    if (isDeleteIntent(value)) {
      handleFriendlyAction('delete');
      return;
    }

    // Human yêu cầu LLM viết brief từ ý tưởng thô.
    // Đặt TRƯỚC nhánh `chatAwaiting === 'brief'` để khỏi bị wizard nuốt text thô vào field.
    if (isWriteBriefIntent(value)) {
      var ideaSeed = text; // dùng raw text giữ nguyên dấu câu
      addChatMessage('agent', ftr('Mình đang đọc ý tưởng và soạn brief launch đầy đủ theo format LaunchOps. Đợi mình một chút...', 'Reading your idea and drafting a full launch brief in LaunchOps format. Just a moment...'));
      setNpcSpeech(ftr('Đang nhờ Agent AI soạn brief đầy đủ từ ý tưởng của Human.', 'Asking AI Agent to draft a full brief from your idea.'));
      updateGuidance('Đang chờ Agent AI viết brief...');
      callAssistantForBriefWriter(ideaSeed, function (reply) {
        if (reply) {
          if (setRealField('briefInput', reply)) {
            addChatMessage('agent', ftr('Mình đã soạn brief đầy đủ và ghi vào ô brief launch. Bản brief:', 'I have drafted the full brief and filled it in. Here it is:'));
            addChatMessage('agent', reply);
            setNpcSpeech(ftr('Brief đã được Agent AI viết, mời Human kiểm tra.', 'Brief drafted by AI Agent. Please review.'));
            updateGuidance('Gợi ý: kiểm tra brief, sửa thêm nếu cần, rồi bấm Chạy phân tích.');
            // Nếu đang ở wizard step brief, đẩy flow đi tiếp; nếu không thì show edit actions
            if (chatAwaiting === 'brief') {
              finishField('Brief đã được AI soạn và nạp vào ô brief.', 'brief');
            } else {
              setChatActions(friendlySupportActions());
            }
          } else {
            addChatMessage('agent', ftr('Mình đã có bản brief nhưng chưa ghi được vào ô brief (form có thể đang đóng). Brief đề xuất:', 'I have a draft brief but could not write it to the field (the form may be closed). Suggested brief:'));
            addChatMessage('agent', reply);
            setChatActions(friendlySupportActions());
          }
        } else {
          addChatMessage('agent', ftr('Mình chưa gọi được Agent AI để viết brief lúc này. Bạn có thể tự gõ ý tưởng vào ô brief, hoặc thử lại sau.', 'I could not reach the AI Agent right now. You can type your idea into the brief field directly, or try again later.'));
          setNpcSpeech(ftr('Agent AI tạm không phản hồi.', 'AI Agent is temporarily unavailable.'));
          setChatActions(friendlySupportActions());
        }
      });
      return;
    }

    // Câu hỏi mở (góp ý / đánh giá / review / nhận xét / lời khuyên / cải tiến).
    // Gọi backend /api/assistant với context launch hiện tại để LLM trả lời thật.
    // Đặt TRƯỚC các nhánh rule-based "brief/owner/..." để không bị nuốt thành prompt field.
    if (isAdviceIntent(value)) {
      var ctxForAdvice = currentLaunchContextForChat();
      addChatMessage('agent', ftr('Mình đang xem brief, readiness và rủi ro để góp ý cụ thể cho bạn...', 'Reviewing the brief, readiness, and risks to give you specific feedback...'));
      setNpcSpeech(ftr('Đang xin góp ý từ Agent AI dựa trên brief và rủi ro hiện tại.', 'Asking AI Agent for feedback on the current brief and risks.'));
      updateGuidance('Đang chờ Agent AI trả lời...');
      callAssistantForChat(value, ctxForAdvice, function (reply) {
        if (reply) {
          addChatMessage('agent', reply);
          setNpcSpeech(ftr('Agent AI vừa góp ý dựa trên brief launch hiện tại.', 'AI Agent just gave feedback on the current launch brief.'));
          updateGuidance('Bạn có thể hỏi tiếp về rủi ro, Red Team, checklist hoặc bấm Chạy phân tích.');
        } else {
          addChatMessage('agent', ftr('Mình chưa gọi được Agent AI lúc này (backend hoặc mạng có thể tạm gián đoạn). Bạn có thể bấm "Chạy phân tích" để chấm rủi ro local, hoặc hỏi lại sau.', 'I could not reach the AI Agent right now (backend or network may be down). You can click "Run analysis" to score locally, or try again later.'));
          setNpcSpeech(ftr('Agent AI tạm không phản hồi, dùng local fallback.', 'AI Agent unavailable, using local fallback.'));
          updateGuidance('Gợi ý: bấm Chạy phân tích hoặc hỏi lại.');
        }
        setChatActions(friendlySupportActions());
      });
      return;
    }

    if (chatAwaiting === 'finalDecision') {
      var finalLow = fold(value);
      if (finalLow.indexOf('phan tich') !== -1 || finalLow.indexOf('chot') !== -1 || finalLow.indexOf('final') !== -1 || finalLow === 'ok') {
        runPreLaunchAnalyze();
      } else if (finalLow.indexOf('luu') !== -1) {
        handleFriendlyAction('save');
      } else if (finalLow.indexOf('xem') !== -1 || finalLow.indexOf('review') !== -1) {
        addChatMessage('agent', briefReviewText());
        addChatMessage('agent', ftr('Nếu đã ổn, gõ "phân tích". Nếu cần sửa, gõ "sửa".', 'If it looks good, type "analyze". If you need changes, type "edit".'));
      } else if (finalLow.indexOf('sua') !== -1 || finalLow.indexOf('chinh') !== -1) {
        showEditActions();
        addChatMessage('agent', ftr('Bạn muốn sửa phần nào trước? Chọn nút hoặc gõ trực tiếp.', 'Which part do you want to edit first? Pick a button or type directly.'));
      } else {
        addChatMessage('agent', ftr('Mình chưa rõ. Bạn gõ "phân tích", "xem lại", hoặc "sửa" nhé.', 'I am not sure. Try typing "analyze", "review", or "edit".'));
      }
      return;
    }

    if (chatAwaiting && isSkipText(value)) {
      finishField('Giữ nguyên mục này.', chatAwaiting);
      return;
    }

    if (chatAwaiting === 'type') {
      var typeValue = optionValueFromText('launchType', value);
      if (typeValue && setRealField('launchType', typeValue)) finishField('Đã cập nhật phân loại launch.', 'type');
      else addChatMessage('agent', ftr('Mình chưa khớp được phân loại này. Bạn có thể gõ "Sự kiện game", "Chiến dịch marketing", "Ra mắt tính năng"...', 'I could not match that type. Try "Game event", "Marketing campaign", "Feature launch"...'));
      return;
    }

    if (chatAwaiting === 'status') {
      var statusValue = statusValueFromText(value);
      if (statusValue && setRealField('launchStatus', statusValue)) finishField('Đã cập nhật trạng thái launch.', 'status');
      else addChatMessage('agent', ftr('Mình chưa khớp được trạng thái. Bạn gõ Sắp chạy, Đang chạy, hoặc Đã chạy nhé.', 'I could not match that status. Try Upcoming, Running, or Completed.'));
      return;
    }

    if (chatAwaiting === 'name') {
      if (setRealField('launchName', value)) finishField('Đã cập nhật tên launch.', 'name');
      return;
    }
    if (chatAwaiting === 'owner') {
      if (setRealField('launchOwner', value)) finishField('Đã cập nhật owner và hiển thị ngay trên Chi tiết launch.', 'owner');
      return;
    }
    if (chatAwaiting === 'dates') {
      var dates = parseDates(value);
      var changedDates = false;
      if (dates.start) changedDates = setRealField('launchTargetDate', dates.start) || changedDates;
      if (dates.end) changedDates = setRealField('launchEndDate', dates.end) || changedDates;
      if (changedDates) finishField('Đã cập nhật thời gian launch.', 'dates');
      else addChatMessage('agent', ftr('Mình chưa đọc được thời gian. Bạn gõ theo dạng 12/06/2026 - 14/06/2026 nhé.', 'I could not read the dates. Please type them as 12/06/2026 - 14/06/2026.'));
      return;
    }
    if (chatAwaiting === 'brief') {
      if (setRealField('briefInput', text)) finishField('Đã nhận brief. Khi sẵn sàng, bạn có thể bấm Chạy phân tích.', 'brief');
      return;
    }
    if (chatAwaiting === 'postResult') {
      if (setRealField('postResultInput', text)) finishField('Đã nhận kết quả sau launch. Bạn có thể thêm bài học hoặc lưu lại.', 'postResult');
      return;
    }
    if (chatAwaiting === 'lesson') {
      if (setRealField('lessonInput', text)) finishField('Đã nhận bài học mới. Bấm Lưu kết quả / bài học để ghi lại.', 'lesson');
      return;
    }

    var low = value.toLowerCase();
    if (fold(value).indexOf('tao launch') !== -1 || fold(value).indexOf('launch moi') !== -1) {
      clickRealButton('newLaunch');
    } else if (fold(value).indexOf('sua launch') !== -1 || fold(value).indexOf('chinh launch') !== -1) {
      showEditActions();
      addChatMessage('agent', ftr('Bạn muốn sửa phần nào của launch này? Chọn nút hoặc gõ trực tiếp.', 'Which part of this launch do you want to edit? Pick a button or type directly.'));
    } else if (fold(value).indexOf('phan tich') !== -1 || fold(value).indexOf('chay phan tich') !== -1) {
      showPreAnalyzeDecision();
    } else if (fold(value).indexOf('demo') !== -1) {
      handleFriendlyAction('demo');
    } else if (fold(value).indexOf('export') !== -1 || fold(value).indexOf('xuat report') !== -1 || fold(value).indexOf('xuat bao cao') !== -1) {
      handleFriendlyAction('export');
    } else if (low.indexOf('owner') !== -1) promptField('owner');
    else if (low.indexOf('brief') !== -1) promptField('brief');
    else if (low.indexOf('tên') !== -1 || low.indexOf('ten') !== -1) promptField('name');
    else if (fold(value).indexOf('ket qua sau launch') !== -1 || fold(value).indexOf('post launch') !== -1) {
      setStep(4);
      beginPostLaunchFlow('postResult');
    }
    else if (low.indexOf('bài học') !== -1 || low.indexOf('bai hoc') !== -1) {
      setStep(4);
      beginPostLaunchFlow('lesson');
    }
    else {
      addChatMessage('agent', ftr('Mình có thể tạo launch, sửa tên, phân loại, owner, thời gian, brief, hoặc chạy phân tích. Bạn chọn một nút nhanh nhé.', 'I can create a launch, edit name, type, owner, dates, brief, or run analysis. Pick a quick button.'));
      showHomeActions();
    }
  }

  function runPreLaunchAnalyze() {
    chatAwaiting = '';
    syncLaunchFieldsFromFriendly();
    persistActiveFriendlySession(true);
    friendlyAnalyzeBypass = true;
    analysisAutoAdvancePending = true;
    scheduleFriendlySaveCleanup(activeFriendlyDraftId, activeRealLaunchId());
    if (clickRealButton('analyzeBrief')) {
      setStep(0);
      addChatMessage('agent', ftr('Mình đang chạy phân tích trước launch. Khi xong, readiness, Red Team và checklist sẽ cập nhật bằng dữ liệu thật.', 'Running pre-launch analysis. When done, readiness, Red Team, and checklist will update with real data.'));
      setNpcSpeech(ftr('Đang phân tích trước launch từ brief đã chốt.', 'Running pre-launch analysis from the finalized brief.'));
      updateGuidance('Gợi ý tiếp theo: chờ phân tích xong rồi xem readiness, phản biện và checklist.');
      setChatActions([
        { label: 'Xem readiness', action: 'step', value: '1' },
        { label: 'Xem Red Team', action: 'step', value: '2' },
        { label: 'Xem checklist', action: 'step', value: '3' }
      ]);
    } else {
      analysisAutoAdvancePending = false;
    }
    setTimeout(function () {
      friendlyAnalyzeBypass = false;
    }, 0);
  }

  function beginPostLaunchFlow(target) {
    lessonAwaiting = target || 'postResult';
    refreshPostLaunchPanel();
    if (!isPostLaunchOpen()) {
      addLessonMessage('agent', ftr('Launch này chưa ở trạng thái Đã chạy. Sau khi launch chạy xong, quay lại đây để nhập kết quả sau launch, phân tích sau launch, thêm bài học rồi lưu.', 'This launch is not completed yet. Once it finishes, come back to enter post-launch results, run post-launch review, add a lesson, and save.'));
      setNpcSpeech(ftr('Chưa mở flow sau launch vì launch chưa hoàn tất.', 'Post-launch flow is not open yet because the launch is not completed.'));
      return;
    }
    if (lessonAwaiting === 'lesson') {
      if (!postResultText()) {
        addLessonMessage('agent', ftr('Cần nhập kết quả sau launch trước. Sau đó mình mới phân tích và mở bước thêm bài học.', 'Post-launch result is required first. Then I can review and open the add-lesson step.'));
        lessonAwaiting = 'postResult';
      } else if (!postReviewDone) {
        runPostLaunchReview();
      } else {
        addLessonMessage('agent', ftr('Bạn nhập bài học rút ra sau launch nhé.', 'Enter a lesson learned from this launch.'));
      }
    } else {
      addLessonMessage('agent', ftr('Bạn nhập kết quả sau launch thực tế trước. Đây là lần phân tích bắt buộc thứ hai, sau khi launch đã chạy.', 'Enter the actual post-launch result first. This is the required second review, after the launch has run.'));
    }
    var input = byId('friendlyLessonChatInput');
    if (input) {
      input.placeholder = lessonAwaiting === 'lesson' ? ftr('Nhập bài học rút ra sau launch', 'Enter lesson learned') : ftr('Nhập kết quả sau launch', 'Enter post-launch result');
      try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
    }
    setLessonActionState();
  }

  function handleLessonChatText(text) {
    var value = normalize(text);
    if (!value) return;
    addLessonMessage('human', value);
    if (!isPostLaunchOpen()) {
      addLessonMessage('agent', ftr('Flow sau launch đang bị khóa. Khi launch chuyển sang Đã chạy, bạn quay lại nhập kết quả sau launch.', 'Post-launch flow is locked. Once the launch status changes to Completed, come back to enter the result.'));
      return;
    }
    if (lessonAwaiting === 'lesson') {
      if (setRealField('lessonInput', text)) {
        addLessonMessage('agent', ftr('Đã nhận bài học. Bây giờ bạn có thể lưu kết quả / bài học.', 'Lesson received. You can now save the result and lesson.'));
        setNpcSpeech(ftr('Đã có bài học, sẵn sàng lưu.', 'Lesson ready. Ready to save.'));
      }
      refreshPostLaunchPanel();
      return;
    }
    if (setRealField('postResultInput', text)) {
      setRealField('postResultStatus', 'completed');
      addLessonMessage('agent', ftr('Đã nhận kết quả sau launch. Mình sẽ phân tích sau launch và đưa đề xuất.', 'Post-launch result received. I will run the post-launch review and add suggestions.'));
      runPostLaunchReview();
      refreshPostLaunchPanel();
    }
  }

  function handleFriendlyAction(action, value) {
    if (!action) return;
    if (action === 'new') {
      addChatMessage('human', ftr('Tạo launch mới', 'New launch'));
      clickRealButton('newLaunch');
      return;
    }
    if (action === 'edit') {
      addChatMessage('human', ftr('Sửa launch này', 'Edit this launch'));
      showEditActions();
      addChatMessage('agent', ftr('Bạn muốn sửa phần nào? Chọn một mục bên dưới hoặc gõ trực tiếp, ví dụ: đổi owner thành PM LiveOps.', 'Which part do you want to change? Pick one below or type directly, e.g. change owner to PM LiveOps.'));
      setNpcSpeech(ftr('Đang chờ Human chọn phần cần sửa của launch này.', 'Waiting for you to pick a field to edit.'));
      focusFriendlyFirstInput();
      return;
    }
    if (action === 'edit-sequential') {
      addChatMessage('human', ftr('Rà soát tuần tự', 'Sequential review'));
      beginEditLaunchFlow();
      return;
    }
    if (action === 'summarize') {
      addChatMessage('human', ftr('Tổng hợp launch', 'Summarize launch'));
      addChatMessage('agent', launchSummaryText());
      setNpcSpeech(ftr('Đang tổng hợp tình trạng launch hiện tại cho Human.', 'Summarising the current launch status.'));
      setChatActions(friendlySupportActions());
      return;
    }
    if (action === 'support') {
      addChatMessage('human', ftr('Hỗ trợ / giải thích', 'Support / explain'));
      addChatMessage('agent', supportText(''));
      setNpcSpeech(ftr('Đang mở chế độ hỗ trợ, giải thích cách dùng và rule LaunchOps.', 'Opening support mode, explaining usage and LaunchOps rules.'));
      setChatActions(friendlySupportActions());
      return;
    }
    if (action === 'support-topic') {
      addChatMessage('human', value === 'readiness' ? 'Giải thích rule readiness' : 'Giải thích ' + (value || 'LaunchOps'));
      addChatMessage('agent', supportText(value));
      setChatActions(friendlySupportActions());
      return;
    }
    if (action === 'field') {
      promptField(value);
      return;
    }
    if (action === 'set-type') {
      if (setRealField('launchType', value)) finishField('Đã cập nhật phân loại launch.', 'type');
      return;
    }
    if (action === 'set-status') {
      if (setRealField('launchStatus', value)) finishField('Đã cập nhật trạng thái launch.', 'status');
      return;
    }
    if (action === 'sample') {
      addChatMessage('human', ftr('Nạp Brief Mẫu', 'Load Sample Brief'));
      if (clickRealButton('loadBadBrief')) {
        setTimeout(function () {
          syncFriendlyFormFromReal();
          persistActiveFriendlySession(true);
          refreshFriendlyDetailPreview();
          refreshChatSummary();
          addChatMessage('agent', ftr('Đã nạp brief mẫu. Bạn có thể sửa brief hoặc chạy phân tích.', 'Sample brief loaded. You can edit the brief or run analysis.'));
          setNpcSpeech(ftr('Brief mẫu đã được nạp, tôi đang chờ bạn kiểm tra lại.', 'Sample brief is loaded. I am waiting for you to review it.'));
          updateGuidance(ftr('Gợi ý tiếp theo: kiểm tra brief rồi bấm Chạy phân tích.', 'Next suggestion: review the brief, then click Run analysis.'));
        }, 100);
      }
      return;
    }
    if (action === 'demo') {
      addChatMessage('human', 'Demo mode');
      persistActiveFriendlySession(false);
      activeFriendlyDraftId = '';
      if (clickRealButton('demoMode')) {
        addChatMessage('agent', ftr('Demo mode nạp một launch mẫu và tự tạo đủ readiness, Red Team, checklist, bài học để quay hoặc review nhanh.', 'Demo mode loads a sample launch and generates readiness, Red Team, checklist, and lessons so you can record or review quickly.'));
        setNpcSpeech(ftr('Đang nạp flow demo mẫu.', 'Loading demo flow.'));
        [500, 1300, 2300].forEach(function (ms) { setTimeout(updateFromDom, ms); });
      }
      return;
    }
    if (action === 'export') {
      addChatMessage('human', 'Export report');
      syncLaunchFieldsFromFriendly();
      persistActiveFriendlySession(false);
      if (clickRealButton('exportReport')) {
        addChatMessage('agent', ftr('Report Markdown đã được xuất bằng nút thật. Nếu trình duyệt không hiện popup, hãy kiểm tra thư mục Downloads hoặc clipboard.', 'Markdown report exported via the real button. If the browser did not show a popup, check your Downloads folder or clipboard.'));
        setNpcSpeech(ftr('Đã gửi lệnh xuất report cho launch đang mở.', 'Triggered export report for the current launch.'));
      }
      return;
    }
    if (action === 'save') {
      addChatMessage('human', ftr('Lưu launch', 'Save launch'));
      syncLaunchFieldsFromFriendly();
      persistActiveFriendlySession(true);
      scheduleFriendlySaveCleanup(activeFriendlyDraftId, activeRealLaunchId());
      if (clickRealButton('saveLaunch')) {
        addChatMessage('agent', ftr('Mình đã gửi lệnh lưu bằng nút Lưu launch thật.', 'I triggered the real Save launch button.'));
        setNpcSpeech(ftr('Đang lưu launch vào dữ liệu thật.', 'Saving the launch into real data.'));
      }
      return;
    }
    if (action === 'delete') {
      addChatMessage('human', ftr('Xóa launch này', 'Delete launch'));
      var deleteBtn = byId('deleteLaunch');
      if (!deleteBtn) {
        addChatMessage('agent', ftr('Mình không tìm thấy nút xóa thật trên giao diện. Có thể launch này không hỗ trợ xóa, hoặc bạn cần mở Pro mode để thao tác trực tiếp.', 'I could not find the real delete button. This launch may not support deletion, or you may need Pro mode to act directly.'));
        setNpcSpeech(ftr('Không tìm thấy nút xóa.', 'Delete button not found.'));
        return;
      }
      if (deleteBtn.disabled) {
        addChatMessage('agent', ftr('Launch này hiện chưa xóa được, thường vì launch nháp chưa có id hoặc dữ liệu chưa lưu. Hãy lưu launch rồi thử lại trong Pro mode nếu cần.', 'This launch cannot be deleted yet, usually because a draft has no id or saved data. Save it first, then try again in Pro mode if needed.'));
        setNpcSpeech(ftr('Quyền xóa bị khóa.', 'Delete is locked.'));
        return;
      }
      addChatMessage('agent', ftr('Mình đang gửi lệnh xóa launch này. Trình duyệt sẽ hỏi xác nhận — bạn bấm OK nếu chắc chắn muốn xóa.', 'I am sending the delete command. The browser will ask for confirmation; click OK only if you are sure.'));
      setNpcSpeech(ftr('Đang xóa launch hiện tại theo lệnh.', 'Deleting the current launch as requested.'));
      // app.js gắn handler vào click → sẽ confirm() rồi xóa
      deleteBtn.click();
      // Refresh chat sau khi xóa xong (DOM đã đổi launch khác)
      setTimeout(function () {
        try { refreshChatSummary(); } catch (e) {}
        try { syncFriendlyFormFromReal(); } catch (e) {}
        try { refreshFriendlyDetailPreview(); } catch (e) {}
      }, 600);
      return;
    }
    if (action === 'analyze') {
      addChatMessage('human', ftr('Chạy phân tích', 'Run analysis'));
      showPreAnalyzeDecision();
      return;
    }
    if (action === 'final-analyze') {
      addChatMessage('human', ftr('Phân tích ngay', 'Analyze now'));
      runPreLaunchAnalyze();
      return;
    }
    if (action === 'final-review') {
      addChatMessage('human', ftr('Xem lại brief', 'Review brief'));
      addChatMessage('agent', briefReviewText());
      addChatMessage('agent', ftr('Nếu đã ổn, gõ "phân tích" hoặc bấm Phân tích ngay. Nếu cần sửa, gõ "sửa".', 'If it looks good, type "analyze" or click Analyze now. If it needs changes, type "edit".'));
      chatAwaiting = 'finalDecision';
      return;
    }
    if (action === 'final-edit') {
      addChatMessage('human', ftr('Chỉnh sửa lại', 'Edit again'));
      showEditActions();
      addChatMessage('agent', ftr('Bạn muốn sửa phần nào trước? Chọn nút hoặc gõ trực tiếp.', 'Which part should we edit first? Pick a button or type directly.'));
      return;
    }
    if (action === 'lesson') {
      setStep(4);
      beginPostLaunchFlow('lesson');
      return;
    }
    if (action === 'post-result') {
      setStep(4);
      beginPostLaunchFlow('postResult');
      return;
    }
    if (action === 'post-review') {
      setStep(4);
      runPostLaunchReview();
      return;
    }
    if (action === 'save-lesson') {
      if (!isPostLaunchOpen()) {
        addLessonMessage('agent', ftr('Chưa thể lưu. Launch cần ở trạng thái Đã chạy trước.', 'Cannot save yet. The launch must be in Completed status first.'));
        return;
      }
      if (!postResultText()) {
        addLessonMessage('agent', ftr('Chưa thể lưu. Bạn cần nhập kết quả sau launch trước.', 'Cannot save yet. Please enter the post-launch result first.'));
        beginPostLaunchFlow('postResult');
        return;
      }
      if (!postReviewDone) {
        addLessonMessage('agent', ftr('Chưa thể lưu. Mình cần phân tích sau launch và đưa đề xuất trước.', 'Cannot save yet. I need to run the post-launch review and add suggestions first.'));
        runPostLaunchReview();
        return;
      }
      if (!lessonText()) {
        addLessonMessage('agent', ftr('Chưa thể lưu. Bạn cần thêm ít nhất một bài học ngắn.', 'Cannot save yet. Please add at least one short lesson.'));
        beginPostLaunchFlow('lesson');
        return;
      }
      syncLessonFieldsFromFriendly();
      if (clickRealButton('saveLesson')) {
        addLessonMessage('agent', ftr('Mình đã gửi lệnh lưu kết quả / bài học bằng nút thật.', 'I triggered the real save result / lesson button.'));
        setNpcSpeech(ftr('Đang lưu kết quả và bài học.', 'Saving result and lesson.'));
      }
      return;
    }
    if (action === 'step') {
      setStep(Number(value) || 0);
    }
  }

  function setupFriendlyChat() {
    var form = byId('friendlyChatForm');
    var actions = byId('friendlyChatQuickActions');
    var input = byId('friendlyChatInput');
    var lessonForm = byId('friendlyLessonChatForm');
    var lessonInput = byId('friendlyLessonChatInput');
    if (chatSeeded || !form || !actions || !input) return;
    chatSeeded = true;
    addChatMessage('agent', ftr('Bạn muốn tạo launch mới, sửa launch đang chọn, hay chạy phân tích? Mình sẽ hỏi từng bước và tự điền vào LaunchOps.', 'Do you want to create a new launch, edit the selected launch, or run analysis? I will ask step by step and fill LaunchOps for you.'));
    showHomeActions();
    refreshChatSummary();

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var text = input.value;
      input.value = '';
      handleChatText(text);
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (form.requestSubmit) form.requestSubmit();
        else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    });

    actions.addEventListener('click', function (event) {
      var button = event.target.closest('[data-friendly-action]');
      if (!button) return;
      handleFriendlyAction(button.getAttribute('data-friendly-action'), button.getAttribute('data-friendly-value'));
    });

    document.addEventListener('click', function (event) {
      var button = event.target.closest('.friendly-lesson-chat [data-friendly-action]');
      if (!button) return;
      handleFriendlyAction(button.getAttribute('data-friendly-action'), button.getAttribute('data-friendly-value'));
    });

    if (lessonForm && lessonInput) {
      lessonForm.addEventListener('submit', function (event) {
        event.preventDefault();
        var text = lessonInput.value;
        lessonInput.value = '';
        handleLessonChatText(text);
      });
      lessonInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          if (lessonForm.requestSubmit) lessonForm.requestSubmit();
          else lessonForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      });
    }
  }

  function shorten(value, max) {
    var text = normalize(value);
    if (!text || text.length <= max) return text;
    return text.slice(0, Math.max(0, max - 1)).trim() + '...';
  }

  function parseScore(value) {
    var match = normalize(value).match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
    if (!match) return { score: 0, max: 12, text: '0/12' };
    var score = Number(match[1]) || 0;
    var max = Number(match[2]) || 12;
    return {
      score: score,
      max: max,
      text: Math.round(score) + '/' + Math.round(max)
    };
  }

  function statusKind() {
    var status = byId('analysisRunStatus');
    var cls = status ? status.className : '';
    var text = status ? normalize(status.textContent).toLowerCase() : '';
    if (cls.indexOf('is-running') !== -1 || text.indexOf('dang phan tich') !== -1 || text.indexOf('đang phân tích') !== -1 || text.indexOf('vui lòng chờ') !== -1) return 'running';
    if (cls.indexOf('is-success') !== -1 || text.indexOf('hoàn thành') !== -1 || text.indexOf('hoan thanh') !== -1) return 'success';
    if (cls.indexOf('is-error') !== -1 || text.indexOf('sự cố') !== -1 || text.indexOf('su co') !== -1) return 'error';
    return 'idle';
  }

  function hasRealAnalysis() {
    var decision = ownText(byId('decisionTitle')).toLowerCase();
    if (!decision) return false;
    if (decision.indexOf('chưa có phân tích') !== -1 || decision.indexOf('chua co phan tich') !== -1) return false;
    return true;
  }

  function detectState() {
    var kind = statusKind();
    if (kind === 'running') return 'thinking';
    if (!hasRealAnalysis()) return 'idle';

    var metric = byId('readinessMetric');
    if (metric) {
      if (metric.classList.contains('green')) return 'green';
      if (metric.classList.contains('red')) return 'red';
      if (metric.classList.contains('yellow')) return 'yellow';
    }
    return 'yellow';
  }

  function colorText(state) {
    if (state === 'green') return ftr('Xanh', 'Green');
    if (state === 'red') return ftr('Đỏ', 'Red');
    if (state === 'yellow') return ftr('Vàng', 'Yellow');
    return ftr('Chưa rõ', 'Unknown');
  }

  function verdictText(state) {
    if (state === 'green') return ftr('Có thể launch', 'Ready to launch');
    if (state === 'yellow') return ftr('Cần sửa trước khi launch', 'Fix before launch');
    if (state === 'red') return ftr('Dừng để xử lý rủi ro', 'Stop and fix risks');
    if (state === 'thinking') return ftr('Đang phân tích', 'Analyzing');
    return ftr('Chưa phân tích', 'Not analyzed');
  }

  function cleanAnalysisLine(value) {
    return normalize(value)
      .replace(/^Lo ngại:\s*/i, '')
      .replace(/^Dấu hiệu:\s*/i, '')
      .replace(/^Cách xử lý:\s*/i, '');
  }

  function briefGoal(text) {
    var lines = String(text || '').split(/\n+/).map(normalize).filter(Boolean);
    if (!lines.length) return ftr('Brief đang trống. Hãy nhập hoặc chọn launch có brief trước khi chạy phân tích.', 'Brief is empty. Enter or select a launch with a brief before running analysis.');
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].charAt(0) !== '-' && lines[i].charAt(0) !== '*') return shorten(lines[i], 150);
    }
    return shorten(lines[0], 150);
  }

  function collectRisks() {
    var nodes = [].slice.call(document.querySelectorAll('#riskBreakdown .risk-tile'));
    return nodes.map(function (node) {
      var parsed = parseScore(firstText(node, '.risk-score'));
      return {
        label: firstText(node, 'strong') || ftr('Nhóm rủi ro', 'Risk group'),
        score: parsed.score,
        max: parsed.max,
        detail: firstText(node, 'small') || firstText(node, '.risk-meaning') || ftr('Cần kiểm tra thêm.', 'Needs more review.')
      };
    }).filter(function (item) {
      return item.label && item.label.toLowerCase().indexOf('chưa có') === -1;
    });
  }

  function collectTopRisks() {
    return [].slice.call(document.querySelectorAll('#topRisks li'))
      .map(ownText)
      .filter(function (item) {
        var low = item.toLowerCase();
        return item && low.indexOf('chưa có rủi ro') === -1;
      });
  }

  function collectVoices(topRisks) {
    var cards = [].slice.call(document.querySelectorAll('#redTeamCards .red-card'));
    var voices = cards.map(function (card) {
      var paragraphs = [].slice.call(card.querySelectorAll('p')).map(ownText).map(cleanAnalysisLine).filter(Boolean);
      var detail = {
        worry: '',
        evidence: '',
        fix: ''
      };
      paragraphs.forEach(function (line) {
        var low = fold(line);
        if (low.indexOf('lo ngai') === 0) detail.worry = cleanAnalysisLine(line);
        else if (low.indexOf('dau hieu') === 0) detail.evidence = cleanAnalysisLine(line);
        else if (low.indexOf('cach xu ly') === 0) detail.fix = cleanAnalysisLine(line);
      });
      return {
        initials: firstText(card, '.agent-avatar') || 'RT',
        persona: firstText(card, 'h3') || 'Red Team',
        worry: detail.worry || paragraphs[0] || 'Cần phản biện thêm trước khi launch.',
        evidence: detail.evidence || paragraphs[1] || '',
        fix: detail.fix || paragraphs[2] || '',
        summary: paragraphs.join(' ')
      };
    }).filter(function (item) {
      return item.worry && item.persona.toLowerCase().indexOf('chưa có') === -1;
    });

    if (voices.length) return voices.slice(0, 5);
    return (topRisks || []).slice(0, 3).map(function (risk, index) {
      return {
        initials: 'R' + (index + 1),
        persona: ftr('Nhóm phản biện', 'Review group'),
        worry: risk,
        evidence: ftr('Rủi ro này đang đứng trong top risks của analysis.', 'This risk appears in the analysis top risks.'),
        fix: ftr('Cần chốt cách xử lý trong brief hoặc checklist.', 'Lock the mitigation in the brief or checklist.'),
        summary: risk
      };
    });
  }

  function collectTasks() {
    var cards = [].slice.call(document.querySelectorAll('#checklistRows .timeline-card'));
    return cards.map(function (card) {
      var owner = firstText(card, '.owner-chip strong');
      var status = firstText(card, '.status-chip strong');
      var deadline = firstText(card, '.timeline-date');
      return {
        name: firstText(card, 'h4') || ftr('Việc cần làm', 'Task'),
        meta: [owner, deadline || status].filter(Boolean).join(' - ')
      };
    }).filter(function (item) {
      return item.name && item.name.toLowerCase().indexOf('chưa có') === -1;
    }).slice(0, 5);
  }

  function collectLessonText(topRisks) {
    var blocks = [].slice.call(document.querySelectorAll('#postmortemDraft .draft-block'));
    if (blocks.length) {
      var first = blocks[0];
      var title = firstText(first, 'h3');
      var item = firstText(first, 'li');
      return {
        memo: title || ftr('Đã có câu hỏi post-mortem', 'Post-mortem questions are ready'),
        detail: item || ftr('Dùng phần bài học sau launch để ghi lại quyết định và kết quả thật.', 'Use the post-launch lesson area to record decisions and real results.')
      };
    }
    if (topRisks && topRisks.length) {
      return {
      memo: ftr('Đã gom rủi ro chính', 'Main risks collected'),
        detail: shorten(topRisks[0], 150)
      };
    }
    return {
      memo: ftr('Kết quả phân tích đã sẵn sàng', 'Analysis result is ready'),
      detail: ftr('Bài học, rủi ro và quyết định sẽ được lưu lại để lần launch sau an toàn hơn.', 'Lessons, risks, and decisions will be saved so the next launch is safer.')
    };
  }

  function collectSnapshot() {
    var score = parseScore(ownText(byId('scoreValue')));
    var topRisks = collectTopRisks();
    var state = detectState();
    var brief = byId('briefInput') ? byId('briefInput').value : '';
    var launchName = (byId('launchName') && byId('launchName').value) || ownText(byId('detailTitle')) || ftr('Launch chưa đặt tên', 'Untitled launch');
    var launchType = selectedText(byId('launchType')) || 'Launch';
    var lesson = collectLessonText(topRisks);

    return {
      state: state,
      status: statusKind(),
      score: score,
      scoreLabel: ownText(byId('scoreColor')) || colorText(state),
      scoreReason: ownText(byId('scoreReason')) || '',
      launchName: normalize(launchName),
      launchType: launchType,
      briefGoal: briefGoal(brief),
      decision: ownText(byId('decisionTitle')) || ftr('Chưa có phân tích', 'No analysis yet'),
      gate: ownText(byId('launchGate')) || verdictText(state),
      topRisks: topRisks,
      risks: collectRisks(),
      voices: collectVoices(topRisks),
      tasks: collectTasks(),
      lessonMemo: lesson.memo,
      lessonDetail: lesson.detail
    };
  }

  function setText(id, value) {
    var el = byId(id);
    if (el) el.textContent = value;
  }

  function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function makeEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function renderRiskBars(risks) {
    var box = byId('friendlyVizRiskBars');
    if (!box) return;
    clearNode(box);
    var items = risks && risks.length ? risks : [{ label: ftr('Chưa có điểm rủi ro', 'No risk score yet'), score: 0, max: 2, detail: '' }];
    items.slice(0, 6).forEach(function (risk) {
      var row = makeEl('div', 'friendly-viz-bar');
      var label = makeEl('span', '', shorten(risk.label, 38));
      var track = makeEl('div', 'friendly-viz-bar-track');
      var fill = document.createElement('i');
      var detail = makeEl('small', 'risk-detail', shorten(risk.detail || '', 74));
      var max = Number(risk.max) || 2;
      var score = Math.max(0, Number(risk.score) || 0);
      fill.setAttribute('data-width', Math.max(0, Math.min(100, Math.round((score / max) * 100))) + '%');
      track.appendChild(fill);
      row.appendChild(label);
      row.appendChild(track);
      row.appendChild(makeEl('small', '', Math.round(score) + '/' + Math.round(max)));
      box.appendChild(row);
      if (detail.textContent) box.appendChild(detail);
    });
  }

  function renderTopRiskChips(topRisks) {
    var box = byId('friendlyVizScoreTopRisks');
    if (!box) return;
    clearNode(box);
    var items = topRisks && topRisks.length ? topRisks.slice(0, 3) : [ftr('Chưa có top risk rõ ràng', 'No clear top risk yet')];
    items.forEach(function (item) {
      box.appendChild(makeEl('span', 'friendly-viz-score-chip', shorten(item, 54)));
    });
  }

  function renderVoices(voices) {
    var box = byId('friendlyVizVoices');
    if (!box) return;
    clearNode(box);
    var items = voices && voices.length ? voices : [{ initials: 'RT', persona: 'Red Team', worry: ftr('Chạy phân tích để xem các góc phản biện.', 'Run analysis to see red-team perspectives.'), evidence: ftr('Khi có kết quả thật, từng vai phản biện sẽ hiển thị đầy đủ.', 'When a real result exists, each reviewer role will be shown.'), fix: ftr('Mở brief và bổ sung phần còn thiếu trước launch.', 'Open the brief and add missing parts before launch.'), summary: ftr('Chạy phân tích để xem các góc phản biện.', 'Run analysis to see red-team perspectives.') }];
    items.slice(0, 5).forEach(function (voice, index) {
      var row = makeEl('div', 'friendly-viz-voice');
      row.style.animationDelay = (index * 0.16) + 's';
      row.appendChild(makeEl('div', 'friendly-viz-avatar', shorten(voice.initials || 'RT', 3)));
      var body = makeEl('div', 'friendly-viz-voice-body');
      body.appendChild(makeEl('b', '', voice.persona || 'Red Team'));
      body.appendChild(makeVoiceLine(ftr('Lo ngại', 'Concern'), voice.worry || voice.concern || ''));
      if (voice.evidence) body.appendChild(makeVoiceLine(ftr('Dấu hiệu', 'Evidence'), voice.evidence));
      if (voice.fix) body.appendChild(makeVoiceLine(ftr('Cách xử lý', 'Fix'), voice.fix));
      if (voice.summary) body.appendChild(makeEl('p', 'friendly-viz-voice-summary', shorten(voice.summary, 170)));
      row.appendChild(body);
      box.appendChild(row);
    });
  }

  function renderTasks(tasks) {
    var box = byId('friendlyVizTasks');
    if (!box) return;
    clearNode(box);
    var items = tasks && tasks.length ? tasks : [{ name: ftr('Chạy phân tích để tạo checklist', 'Run analysis to create checklist'), meta: 'Agent' }];
    items.slice(0, 5).forEach(function (task, index) {
      var row = makeEl('div', 'friendly-viz-task');
      row.style.animationDelay = (index * 0.18) + 's';
      var check = makeEl('div', 'friendly-viz-check');
      check.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12l5 5L20 6"/></svg>';
      row.appendChild(check);
      row.appendChild(makeEl('div', 'friendly-viz-task-name', task.name));
      row.appendChild(makeEl('div', 'friendly-viz-task-meta', task.meta || ''));
      box.appendChild(row);
    });
  }

  function makeVoiceLine(label, value) {
    var line = document.createElement('p');
    line.className = 'friendly-viz-voice-line';
    var strong = document.createElement('strong');
    strong.textContent = label + ': ';
    var span = document.createElement('span');
    span.textContent = shorten(value || '', 180);
    line.appendChild(strong);
    line.appendChild(span);
    return line;
  }

  function renderSnapshot(snapshot) {
    var visual = byId('friendlyVisualize');
    var rail = byId('friendlyVizRail');
    var lights = byId('friendlyVizLights');
    if (!visual || !snapshot) return;

    visual.setAttribute('data-state', snapshot.state);
    if (rail) rail.setAttribute('data-state', snapshot.state);
    if (lights) lights.setAttribute('data-on', snapshot.state === 'idle' ? 'idle' : snapshot.state);

    setText('friendlyVizVerdict', verdictText(snapshot.state));
    setText('friendlyVizScore', snapshot.state === 'idle' ? ftr('Chưa có điểm', 'No score yet') : snapshot.score.text + ' - ' + snapshot.scoreLabel);
    setText('friendlyVizScoreDecision', snapshot.decision || ftr('Chưa có phân tích', 'No analysis yet'));
    setText('friendlyVizScoreGate', snapshot.gate || verdictText(snapshot.state));
    setText('friendlyVizScoreReason', snapshot.scoreReason || snapshot.decision || ftr('Chạy phân tích để xem lý do điểm, kết luận và phần còn thiếu.', 'Run analysis to see score reasons, verdict, and missing parts.'));
    setText('friendlyVizBriefTitle', snapshot.launchName + ' - ' + snapshot.launchType);
    setText('friendlyVizBriefGoal', snapshot.briefGoal);
    setText('friendlyVizBriefMissing', snapshot.topRisks.length ? ftr('Thiếu: ', 'Missing: ') + snapshot.topRisks.slice(0, 3).map(function (item) { return shorten(item, 48); }).join(' | ') : ftr('Agent sẽ đọc phần còn thiếu sau khi có kết quả.', 'The Agent will identify missing parts after analysis.'));
    setText('friendlyVizGaugeNumber', Math.round(snapshot.score.score));
    setText('friendlyVizGaugeMax', '/ ' + Math.round(snapshot.score.max) + ' - ' + snapshot.scoreLabel);
    renderTopRiskChips(snapshot.topRisks);
    setText('friendlyVizMemo', snapshot.lessonMemo);
    setText('friendlyVizLessonText', snapshot.lessonDetail);

    renderRiskBars(snapshot.risks);
    renderVoices(snapshot.voices);
    renderTasks(snapshot.tasks);
    updateSpeech(snapshot, currentStep);
  }

  function updateSpeech(snapshot, step) {
    if (!snapshot) return;
    var agent = byId('friendlyVizAgentName');
    if (agent) agent.textContent = (STEPS[step] || 'LaunchOps') + ' Agent';

    var speech = ftr('Đang chờ lệnh. Nếu bạn nhập gì, tôi sẽ gắn vào launch đang mở.', 'Waiting for your command. If you type something, I will apply it to the open launch.');
    if (snapshot.state === 'thinking') {
      speech = ftr('Đang tập trung đọc brief và gom tín hiệu rủi ro.', 'Reading the brief and collecting risk signals.');
    } else if (snapshot.state !== 'idle') {
      if (step === 0) speech = ftr('Đang soi brief của ', 'Reviewing the ') + snapshot.launchType + ftr(', ưu tiên phần còn mơ hồ.', ' brief, starting with unclear parts.');
      if (step === 1) speech = ftr('Đang nhìn readiness: ', 'Reviewing readiness: ') + snapshot.score.text + ftr(', trạng thái ', ', status ') + snapshot.scoreLabel + '.';
      if (step === 2) speech = ftr('Đang bật chế độ phản biện, ưu tiên câu hỏi khó.', 'Running red-team mode and prioritizing hard questions.');
      if (step === 3) speech = ftr('Đang gom việc cần owner và deadline rõ ràng.', 'Collecting tasks that need clear owners and deadlines.');
      if (step === 4) speech = ftr('Đang chuẩn bị lưu quyết định và bài học cho lần sau.', 'Preparing to save decisions and lessons for next time.');
    }
    if (friendlySpeechOverride) speech = friendlySpeechOverride;
    setText('friendlyVizSpeech', speech);
  }

  function manualStepSpeech(step) {
    if (step === 1) return ftr('Tôi đang nhìn đồng hồ readiness, chưa tự chuyển bước.', 'I am reviewing the readiness gauge and staying on this step.');
    if (step === 2) return ftr('Tôi đang bật mặt khó tính của Red Team.', 'I am switching into Red Team mode.');
    if (step === 3) return ftr('Tôi đang lọc việc nào cần chủ sở hữu rõ ràng.', 'I am filtering tasks that need clear ownership.');
    if (step === 4) return ftr('Tôi đang giữ chỗ cho kết quả và bài học sau launch.', 'I am holding space for post-launch results and lessons.');
    return ftr('Tôi đang ở Mission Control, chờ thao tác cấu hình launch.', 'I am at Mission Control, waiting for launch setup actions.');
  }

  function clearEffects() {
    effectTimers.forEach(function (id) { clearTimeout(id); });
    effectIntervals.forEach(function (id) { clearInterval(id); });
    effectTimers = [];
    effectIntervals = [];
  }

  function later(fn, ms) {
    var id = setTimeout(fn, ms);
    effectTimers.push(id);
    return id;
  }

  function stopAutoplay() {
    if (autoTimer) clearTimeout(autoTimer);
    autoTimer = null;
  }

  function typeText(text) {
    var el = byId('friendlyVizTyped');
    if (!el) return;
    el.textContent = shorten(text, 170);
  }

  function runGauge(snapshot) {
    var arc = byId('friendlyVizArc');
    var num = byId('friendlyVizGaugeNumber');
    if (!arc || !num || !snapshot) return;
    var score = Math.max(0, Math.round(snapshot.score.score));
    var max = Math.max(1, Math.round(snapshot.score.max));
    var percent = Math.max(0, Math.min(1, score / max));
    arc.style.transition = 'none';
    arc.style.strokeDashoffset = DASH;
    num.textContent = '0';

    later(function () {
      arc.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1)';
      arc.style.strokeDashoffset = String(DASH - DASH * percent);
    }, 120);

    var n = 0;
    var interval = setInterval(function () {
      if (score <= 0) {
        num.textContent = '0';
        clearInterval(interval);
        return;
      }
      n += 1;
      num.textContent = String(n);
      if (n >= score) clearInterval(interval);
    }, Math.max(70, Math.round(900 / Math.max(1, score))));
    effectIntervals.push(interval);

    [].slice.call(document.querySelectorAll('#friendlyVizRiskBars .friendly-viz-bar-track i')).forEach(function (fill, index) {
      fill.style.width = '0';
      later(function () {
        fill.style.width = fill.getAttribute('data-width') || '0';
      }, 240 + index * 120);
    });
  }

  function runTasks() {
    [].slice.call(document.querySelectorAll('#friendlyVizTasks .friendly-viz-task')).forEach(function (task, index) {
      task.classList.remove('is-on');
      later(function () {
        task.classList.add('is-on');
      }, 600 + index * 320);
    });
  }

  function setStep(step) {
    var scenes = [].slice.call(document.querySelectorAll('#friendlyVisualize .friendly-viz-scene'));
    var dots = [].slice.call(document.querySelectorAll('#friendlyVisualize .friendly-viz-step'));
    if (!scenes.length) return;
    currentStep = Math.max(0, Math.min(step, scenes.length - 1));
    clearEffects();

    scenes.forEach(function (scene, index) {
      scene.classList.toggle('active', index === currentStep);
      scene.classList.remove('is-running');
    });
    dots.forEach(function (dot, index) {
      dot.classList.toggle('is-active', index === currentStep);
      dot.classList.toggle('is-done', index < currentStep);
    });

    var active = scenes[currentStep];
    if (active) {
      void active.offsetWidth;
      active.classList.add('is-running');
    }

    if (lastSnapshot) {
      updateSpeech(lastSnapshot, currentStep);
      if (currentStep === 0) updateGuidance(guidanceText(lastSnapshot));
      if (currentStep === 1) runGauge(lastSnapshot);
      if (currentStep === 3) runTasks();
    }
  }

  function autoplay() {
    stopAutoplay();
    setStep(0);
    var index = 0;
    function next() {
      if (index >= STEP_DELAYS.length) return;
      autoTimer = setTimeout(function () {
        setStep(index + 1);
        index += 1;
        next();
      }, STEP_DELAYS[index]);
    }
    next();
  }

  function updateFromDom() {
    restorePendingFriendlyEdit();
    lastSnapshot = collectSnapshot();
    renderSnapshot(lastSnapshot);
    syncFriendlyFormFromReal();
    refreshFriendlyDetailPreview();
    refreshChatSummary();
    refreshPostLaunchPanel();
    enhanceLaunchCards();
    renderFriendlyDraftCards();
    syncFriendlyActiveDraftCard();
    maybeResetChatForLaunch();

    var kind = lastSnapshot.status;
    if (kind === 'running' && lastStatusKind !== 'running') {
      runToken += 1;
      stopAutoplay();
      setStep(0);
    }
    if ((kind === 'success' || kind === 'error') && runToken !== lastPlayedToken && hasRealAnalysis()) {
      lastPlayedToken = runToken;
      addChatMessage('agent', ftr('Phân tích đã xong. Kết quả thật đã cập nhật vào readiness, Red Team và checklist.', 'Analysis is complete. The real result updated readiness, Red Team, and checklist.'));
      if (analysisAutoAdvancePending) {
        analysisAutoAdvancePending = false;
        setStep(1);
        addChatMessage('agent', ftr('Mình đưa bạn sang Chấm điểm để xem kết luận và lý do điểm trước.', 'I moved you to Scoring so you can review the verdict and score reason first.'));
        setNpcSpeech(ftr('Phân tích xong, đang ở bước Chấm điểm.', 'Analysis complete, now on the Scoring step.'));
        updateGuidance(ftr('Gợi ý tiếp theo: đọc lý do điểm, top risks, rồi chuyển sang Phản biện.', 'Next suggestion: read the score reason and top risks, then move to Red Team.'));
      } else {
        setNpcSpeech(ftr('Phân tích xong, kết quả đã đồng bộ vào Friendly.', 'Analysis complete, result synced into Friendly.'));
        updateGuidance(ftr('Gợi ý tiếp theo: dùng Trước/Tiếp ở rail trái để xem readiness, phản biện và checklist.', 'Next suggestion: use Back/Next on the left rail to review readiness, red-team notes, and checklist.'));
      }
    }
    lastStatusKind = kind;
  }

  function observeElement(observer, id, options) {
    var el = byId(id);
    if (el) observer.observe(el, options || { attributes: true, childList: true, characterData: true, subtree: true });
  }

  function setupFriendlyEditor() {
    [
      ['friendlyLaunchName', 'launchName'],
      ['friendlyLaunchOwner', 'launchOwner'],
      ['friendlyLaunchTargetDate', 'launchTargetDate'],
      ['friendlyLaunchEndDate', 'launchEndDate'],
      ['friendlyBriefInput', 'briefInput'],
      ['friendlyPostResultInput', 'postResultInput'],
      ['friendlyLessonInput', 'lessonInput']
    ].forEach(function (pair) {
      var proxy = byId(pair[0]);
      if (!proxy) return;
      proxy.addEventListener('input', function () {
        syncRealFromProxy(pair[0], pair[1]);
        persistActiveFriendlySession(true);
        updateFromDom();
      });
    });

    [
      ['friendlyLaunchType', 'launchType'],
      ['friendlyLaunchStatus', 'launchStatus'],
      ['friendlyPostResultStatus', 'postResultStatus']
    ].forEach(function (pair) {
      var proxy = byId(pair[0]);
      if (!proxy) return;
      proxy.addEventListener('change', function () {
        syncRealFromProxy(pair[0], pair[1]);
        persistActiveFriendlySession(true);
        updateFromDom();
      });
    });

    var sample = byId('friendlyLoadBadBrief');
    if (sample) sample.addEventListener('click', function () {
      var real = byId('loadBadBrief');
      if (!real || real.disabled) return;
      real.click();
      persistActiveFriendlySession(true);
      setTimeout(updateFromDom, 80);
    });

    var save = byId('friendlySaveLaunch');
    if (save) save.addEventListener('click', function () {
      var real = byId('saveLaunch');
      if (!real || real.disabled) return;
      syncLaunchFieldsFromFriendly();
      persistActiveFriendlySession(true);
      scheduleFriendlySaveCleanup(activeFriendlyDraftId, activeRealLaunchId());
      real.click();
      setTimeout(updateFromDom, 120);
    });

    var analyze = byId('friendlyAnalyzeBrief');
    if (analyze) analyze.addEventListener('click', function () {
      var real = byId('analyzeBrief');
      if (!real || real.disabled) return;
      syncLaunchFieldsFromFriendly();
      persistActiveFriendlySession(true);
      scheduleFriendlySaveCleanup(activeFriendlyDraftId, activeRealLaunchId());
      real.click();
      setStep(0);
      setTimeout(updateFromDom, 120);
    });

    var saveLesson = byId('friendlySaveLesson');
    if (saveLesson) saveLesson.addEventListener('click', function () {
      var real = byId('saveLesson');
      if (!real || real.disabled) return;
      syncLessonFieldsFromFriendly();
      real.click();
      setTimeout(updateFromDom, 160);
    });
  }

  function setupLaunchListObserver() {
    var groups = byId('launchGroups');
    if (!groups) return;
    enhanceLaunchCards();
    renderFriendlyDraftCards();
    var observer = new MutationObserver(function () {
      enhanceLaunchCards();
      renderFriendlyDraftCards();
    });
    observer.observe(groups, { childList: true, subtree: false, attributes: true, attributeFilter: ['class', 'data-friendly-readiness', 'data-friendly-badge'] });
    groups.addEventListener('click', function (event) {
      var draftCard = event.target.closest('[data-friendly-draft-id]');
      if (draftCard) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        selectFriendlyDraft(draftCard.getAttribute('data-friendly-draft-id'));
        return;
      }
      var realCard = event.target.closest('.launch-card[data-launch-id]');
      if (!realCard) return;
      persistActiveFriendlySession(false);
      activeFriendlyDraftId = '';
      pendingFriendlyRestoreId = realCard.getAttribute('data-launch-id') || '';
      launchCardSwitchPending = true;
    }, true);
    groups.addEventListener('click', function (event) {
      if (!event.target.closest('.launch-card')) return;
      launchCardSwitchPending = true;
      setTimeout(updateFromDom, 180);
      setTimeout(updateFromDom, 520);
    });
  }

  function setupControls() {
    var replay = byId('friendlyVizReplay');
    var prev = byId('friendlyVizPrev');
    var next = byId('friendlyVizNext');
    var newLaunch = byId('newLaunch');
    var saveLaunch = byId('saveLaunch');
    var analyze = byId('analyzeBrief');
    if (replay) replay.addEventListener('click', function () {
      stopAutoplay();
      setStep(0);
      addChatMessage('agent', ftr('Mình đã đưa bạn về bước Đọc brief. Bạn có thể tiếp tục chat để tạo hoặc sửa launch.', 'I moved you back to Read brief. You can keep chatting to create or edit the launch.'));
    });
    if (prev) prev.addEventListener('click', function () {
      stopAutoplay();
      setStep(currentStep - 1);
      setNpcSpeech(manualStepSpeech(currentStep));
    });
    if (next) next.addEventListener('click', function () {
      stopAutoplay();
      setStep(currentStep + 1);
      setNpcSpeech(manualStepSpeech(currentStep));
    });

    [].slice.call(document.querySelectorAll('#friendlyVisualize .friendly-viz-step')).forEach(function (step) {
      step.addEventListener('click', function () {
        stopAutoplay();
        var stepIndex = Number(step.getAttribute('data-step')) || 0;
        setStep(stepIndex);
        setNpcSpeech(manualStepSpeech(stepIndex));
      });
    });

    if (newLaunch) {
      newLaunch.addEventListener('click', function () {
        if (!document.body.classList.contains('ui-mode-friendly')) return;
        persistActiveFriendlySession(false);
      }, true);
      newLaunch.addEventListener('click', function () {
        if (!document.body.classList.contains('ui-mode-friendly')) return;
        setTimeout(function () {
          stopAutoplay();
          setStep(0);
          var draftId = createFriendlyNewDraft();
          lastLaunchKey = 'friendly-draft:' + draftId;
          updateFromDom();
          beginNewLaunchFlow();
        }, 120);
      });
    }
    if (saveLaunch) {
      saveLaunch.addEventListener('click', function () {
        if (!document.body.classList.contains('ui-mode-friendly')) return;
        persistActiveFriendlySession(true);
        scheduleFriendlySaveCleanup(activeFriendlyDraftId, activeRealLaunchId());
      }, true);
    }
    if (analyze) {
      analyze.addEventListener('click', function (event) {
        if (!document.body.classList.contains('ui-mode-friendly') || friendlyAnalyzeBypass) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        showPreAnalyzeDecision();
      }, true);
    }
  }

  function setup() {
    if (!byId('friendlyVisualize')) return;
    setupFriendlyEditor();
    setupFriendlyChat();
    setupLaunchListObserver();
    setupControls();
    updateFromDom();
    setStep(0);

    var observer = new MutationObserver(function () {
      updateFromDom();
    });
    ['launchMemoryStats', 'readinessMetric', 'scoreValue', 'scoreColor', 'decisionTitle', 'launchGate', 'redTeamCards', 'topRisks', 'riskBreakdown', 'checklistRows', 'postmortemDraft', 'lessonsPanel', 'analysisRunStatus'].forEach(function (id) {
      observeElement(observer, id);
    });

    // Đổi mode Pro/Friendly (class trên body) thì gỡ/khôi phục draft card ngay,
    // không chờ observer của #launchGroups (nó không bắt sự kiện đổi mode).
    var modeClassObserver = new MutationObserver(function () {
      renderFriendlyDraftCards();
      syncFriendlyActiveDraftCard();
    });
    modeClassObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    ['launchName', 'launchType', 'launchStatus', 'launchOwner', 'launchTargetDate', 'launchEndDate', 'briefInput'].forEach(function (id) {
      var el = byId(id);
      if (!el) return;
      el.addEventListener('input', function () {
        if (isFriendlyMode()) persistActiveFriendlySession(true);
        updateFromDom();
      });
      el.addEventListener('change', function () {
        if (isFriendlyMode()) persistActiveFriendlySession(true);
        updateFromDom();
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();

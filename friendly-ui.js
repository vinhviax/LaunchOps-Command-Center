/* friendly-ui.js - Web UI redesign layer (2 mode: Pro / Friendly)
   Them 2026-06-08. KHONG sua app.js goc.
   Friendly Visualize doc DOM that app.js da render bang MutationObserver.
   Rollback: bo link script nay trong index.html. */
(function () {
  'use strict';

  var STORAGE_KEY = 'launchops_ui_mode';
  // Mac dinh Friendly sau khi da test xong layout Visualize.
  var DEFAULT_MODE = 'friendly';

  function getMode() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_MODE;
    } catch (e) {
      return DEFAULT_MODE;
    }
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
    friendlyBtn.title = configMode ? 'Friendly bị tắt khi đang cấu h�nh ph�n loại. Quay lại launch để d�ng Friendly.' : '';
    if (configMode && document.body.classList.contains('ui-mode-friendly')) {
      applyMode('pro');
    }
  }

  function init() {
    applyMode(getMode());
    var btns = document.querySelectorAll('.mode-btn');
    for (var i = 0; i < btns.length; i++) {
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
    if (title.indexOf('yellow') !== -1 || title.indexOf('vang') !== -1 || title.indexOf('v�ng') !== -1) return 'yellow';
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
    return 'Chưa chấm';
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
    addChatMessage('agent', 'M�nh đ� chuyển sang launch n�y. Lịch sử chat đ� reset để kh�ng lẫn với launch trước.');
    setNpcSpeech('Đ� đổi launch, t�i đang đọc trạng th�i mới.');
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
    if (value === 'completed') return 'Đ� chạy';
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
    var typeLabelText = labelForSelectValue('launchType', data.type || 'Game event') || 'Chưa chọn ph�n loại';
    var owner = data.owner ? 'Owner: ' + data.owner : 'Chưa c� owner';
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
    card.setAttribute('title', saved + ' trong phi�n n�y. F5 trước khi lưu sẽ mất bản nh�p.');

    var title = card.querySelector('strong');
    var meta = card.querySelector('.launch-card-meta-line');
    var ownerLine = card.querySelector('.launch-card-owner-line');
    if (title) title.textContent = name;
    if (meta) meta.textContent = typeLabelText + ' � Nh�p Friendly';
    if (ownerLine) ownerLine.textContent = owner + ' � ' + saved;
    if (history && history.getAttribute('data-friendly-history-key') !== historyKey) {
      history.setAttribute('data-friendly-history-key', historyKey);
      history.innerHTML = '<span>' + statusText + '</span><strong>0 ph�n t�ch � 0 b�i học</strong><small>' + saved + '</small>';
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
    setNpcSpeech('Đ� kh�i phục phần đang sửa tạm của launch n�y.');
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
    setNpcSpeech('Đ� mở lại launch nh�p. Bạn c� thể tiếp tục cấu h�nh hoặc lưu.');
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
    var type = selectedText(byId('launchType')) || 'Chưa chọn ph�n loại';
    var status = byId('launchStatus') ? statusLabel(byId('launchStatus').value) : '';
    var owner = normalize((byId('launchOwner') && byId('launchOwner').value) || 'Chưa c� owner');
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
      selectedText(byId('launchType')) || 'Chưa chọn ph�n loại',
      normalize((byId('launchOwner') && byId('launchOwner').value) || 'Chưa c� owner')
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

  function setChatActions(actions) {
    var box = byId('friendlyChatQuickActions');
    if (!box) return;
    clearNode(box);
    (actions || []).forEach(function (item) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = item.label;
      button.setAttribute('data-friendly-action', item.action);
      if (item.value !== undefined) button.setAttribute('data-friendly-value', item.value);
      box.appendChild(button);
    });
  }

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
    if (input) input.placeholder = text || 'G� c�u trả lời hoặc d�n brief ở đ�y';
  }

  function fieldHint(field) {
    if (field === 'name') return 'đặt t�n launch ngắn, dễ nhận ra trong danh s�ch.';
    if (field === 'type') return 'chọn ph�n loại để d�ng đ�ng bộ luật đ�nh gi�.';
    if (field === 'owner') return 'nhập owner ch�nh để checklist c� người chịu tr�ch nhiệm.';
    if (field === 'dates') return 'nhập Start - End theo dạng dd/mm/yyyy - dd/mm/yyyy.';
    if (field === 'brief') return 'd�n brief th�, c�ng r� mục ti�u v� phạm vi c�ng tốt.';
    if (field === 'postResult') return 'ghi kết quả thật sau launch để lưu b�i học.';
    if (field === 'lesson') return 'ghi b�i học ngắn, c� thể d�ng lại cho launch sau.';
    return 'chọn thao t�c hoặc g� trực tiếp cho Mission Control.';
  }

  function guidanceText(snapshot) {
    if (chatAwaiting) return 'Gợi � tiếp theo: ' + fieldHint(chatAwaiting);
    if (chatFlow === 'new') return 'Gợi � tiếp theo: m�nh sẽ tự dẫn từng mục cho tới khi đủ launch brief.';
    if (!snapshot || snapshot.state === 'idle') return 'Gợi � tiếp theo: tạo/sửa launch bằng chat, hoặc chạy ph�n t�ch khi brief đ� đủ.';
    if (snapshot.topRisks && snapshot.topRisks.length) return 'Gợi � tiếp theo: xử l� "' + shorten(snapshot.topRisks[0], 86) + '" trước khi launch.';
    return 'Gợi � tiếp theo: xem readiness, phản biện v� checklist trước khi lưu quyết định.';
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
        title: 'So s�nh mục ti�u ban đầu với kết quả thật',
        detail: 'Ghi r� đạt/chưa đạt, lệch ở chỉ số n�o, v� nguy�n nh�n vận h�nh c� thể kiểm chứng.'
      }
    ];
    if (folded.indexOf('faq') !== -1 || folded.indexOf('cs') !== -1 || folded.indexOf('support') !== -1) {
      suggestions.push({
        title: 'Đưa CS FAQ v�o checklist trước launch',
        detail: 'Kết quả c� nhắc tới CS/FAQ, n�n lần sau cần chốt c�u trả lời mẫu trước T-1.'
      });
    }
    if (folded.indexOf('rollback') !== -1 || folded.indexOf('pause') !== -1 || folded.indexOf('dung') !== -1) {
      suggestions.push({
        title: 'Chốt ngưỡng dừng hoặc rollback sớm hơn',
        detail: 'Kết quả c� t�n hiệu phải dừng/rollback, n�n brief sau cần c� ngưỡng quyết định r�.'
      });
    }
    if (folded.indexOf('reward') !== -1 || folded.indexOf('thuong') !== -1 || folded.indexOf('qua') !== -1) {
      suggestions.push({
        title: 'Th�m reviewer Economy/Reward',
        detail: 'Kết quả c� li�n quan phần thưởng, n�n cần người r� so�t ng�n s�ch v� khả năng lạm dụng.'
      });
    }
    if (lastSnapshot && lastSnapshot.topRisks && lastSnapshot.topRisks.length) {
      suggestions.push({
        title: 'Biến rủi ro pre-launch th�nh b�i học',
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
      addLessonMessage('agent', 'Cần nhập kết quả sau launch trước, rồi m�nh mới ph�n t�ch sau launch được.');
      lessonAwaiting = 'postResult';
      setLessonActionState();
      return false;
    }
    var key = resultText + '|' + (lastSnapshot && lastSnapshot.decision ? lastSnapshot.decision : '');
    postReviewKey = key;
    postReviewDone = true;
    renderPostReviewSuggestions(postReviewSuggestions(resultText));
    addLessonMessage('agent', 'M�nh đ� ph�n t�ch kết quả sau launch v� đưa đề xuất b�n dưới. Bước tiếp theo: th�m b�i học ngắn để lưu lại.');
    setNpcSpeech('Đ� ph�n t�ch sau launch, đang chờ b�i học cuối c�ng.');
    lessonAwaiting = 'lesson';
    var input = byId('friendlyLessonChatInput');
    if (input) input.placeholder = 'Nhập b�i học r�t ra sau launch';
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
      gate.textContent = locked ? 'Chưa tới sau launch' : 'Sau launch';
    }
    if (status) {
      status.textContent = locked
        ? 'Launch chưa ở trạng th�i Đ� chạy. Sau khi launch xong, quay lại nhập kết quả v� b�i học.'
        : 'Flow bắt buộc: nhập kết quả sau launch -> Agent ph�n t�ch -> th�m b�i học -> lưu.';
    }
    if (input) {
      input.placeholder = locked
        ? 'Chỉ nhập sau khi launch đ� chạy xong'
        : (lessonAwaiting === 'lesson' ? 'Nhập b�i học r�t ra sau launch' : 'Nhập kết quả sau launch ở đ�y');
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
    chatInputPlaceholder('G� y�u cầu, v� dụ: đổi owner th�nh PM LiveOps');
    updateGuidance();
    setChatActions([
      { label: 'Tạo launch mới', action: 'new' },
      { label: 'Sửa launch n�y', action: 'edit' },
      { label: 'Tổng hợp launch', action: 'summarize' },
      { label: 'Hỗ trợ / giải th�ch', action: 'support' },
      { label: 'Nạp Brief Mẫu', action: 'sample' },
      { label: 'Chạy ph�n t�ch', action: 'analyze' },
      { label: 'Demo mode', action: 'demo' },
      { label: 'Export report', action: 'export' },
      { label: 'B�i học', action: 'lesson' }
    ]);
  }

  function showEditActions() {
    chatAwaiting = '';
    chatFlow = 'edit';
    chatFlowSteps = [];
    chatFlowIndex = -1;
    chatInputPlaceholder('Chọn mục cần sửa hoặc g� nội dung');
    updateGuidance('Gợi � tiếp theo: chọn một mục cần sửa, m�nh sẽ cập nhật ngay trong Chi tiết launch.');
    setChatActions([
      { label: 'T�n launch', action: 'field', value: 'name' },
      { label: 'Ph�n loại', action: 'field', value: 'type' },
      { label: 'Owner', action: 'field', value: 'owner' },
      { label: 'Thời gian', action: 'field', value: 'dates' },
      { label: 'Trạng th�i', action: 'field', value: 'status' },
      { label: 'Brief', action: 'field', value: 'brief' },
      { label: 'R� so�t tuần tự', action: 'edit-sequential' },
      { label: 'Lưu launch', action: 'save' }
    ]);
  }

  function setRealField(realId, value) {
    var real = byId(realId);
    if (!real) return false;
    if (real.disabled) {
      addChatMessage('agent', 'Mục n�y đang bị kh�a theo quyền/trạng th�i launch. Nếu cần sửa launch đang chạy hoặc đ� chạy, h�y chuyển sang Admin trong bản Pro.');
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
      addChatMessage('agent', 'N�t n�y hiện chưa d�ng được với quyền hoặc trạng th�i launch hiện tại.');
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
      { label: 'Đ� chạy', action: 'set-status', value: 'completed' },
      { label: 'Quay lại', action: 'edit' }
    ]);
  }

  function promptField(field) {
    chatAwaiting = field;
    setChatActions([]);
    updateGuidance('Gợi � tiếp theo: ' + fieldHint(field));
    if (field === 'name') {
      addChatMessage('agent', 'Bạn đặt t�n launch l� g�?');
      chatInputPlaceholder('V� dụ: Lucky Wheel Weekend');
      setNpcSpeech('Đang chờ t�n launch. T�i sẽ gắn t�n n�y v�o chi tiết ngay khi bạn gửi.');
    } else if (field === 'type') {
      chatAwaiting = 'type';
      addChatMessage('agent', 'Chọn hoặc g� ph�n loại launch để m�nh d�ng đ�ng template. V� dụ: Sự kiện game.');
      chatInputPlaceholder('G� ph�n loại, hoặc g� "giữ nguy�n"');
      setNpcSpeech('Đang chờ bạn chọn ph�n loại.');
      showTypeActions();
    } else if (field === 'status') {
      chatAwaiting = 'status';
      addChatMessage('agent', 'Chọn hoặc g� trạng th�i launch: Sắp chạy, Đang chạy, hoặc Đ� chạy.');
      chatInputPlaceholder('G� trạng th�i, hoặc g� "giữ nguy�n"');
      setNpcSpeech('Đang chờ trạng th�i launch.');
      showStatusActions();
    } else if (field === 'owner') {
      addChatMessage('agent', 'Ai l� owner ch�nh của launch n�y?');
      chatInputPlaceholder('V� dụ: PM LiveOps');
      setNpcSpeech('Đang chờ owner để cập nhật phần chi tiết launch.');
    } else if (field === 'dates') {
      addChatMessage('agent', 'G� thời gian dạng Start - End. V� dụ: 12/06/2026 - 14/06/2026.');
      chatInputPlaceholder('12/06/2026 - 14/06/2026');
      setNpcSpeech('Đang chờ mốc thời gian. Chỉ cần nhập Start - End.');
    } else if (field === 'brief') {
      addChatMessage('agent', 'D�n brief th� v�o đ�y. Kh�ng cần văn hay, chỉ cần đủ dữ liệu để Agent đọc.');
      chatInputPlaceholder('D�n brief launch...');
      setNpcSpeech('Đang chờ brief. T�i sẽ đọc mục ti�u, phạm vi v� phần c�n mơ hồ.');
    } else if (field === 'postResult') {
      addChatMessage('agent', 'Kết quả sau launch thực tế l� g�?');
      chatInputPlaceholder('V� dụ: đạt 82% target, c�n lỗi CS FAQ...');
      setNpcSpeech('Đang chờ kết quả thật sau launch.');
    } else if (field === 'lesson') {
      addChatMessage('agent', 'B�i học mới cần lưu l� g�?');
      chatInputPlaceholder('V� dụ: Lần sau phải chốt FAQ trước T-1.');
      setNpcSpeech('Đang chờ b�i học để lưu lại cho lần sau.');
    } else {
      chatAwaiting = '';
      addChatMessage('agent', 'Bạn muốn sửa mục n�o?');
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
    addChatMessage('agent', 'M�nh bắt đầu một launch mới. M�nh sẽ hỏi từng phần v� tự điền v�o LaunchOps.');
    setNpcSpeech('Bắt đầu cấu h�nh launch mới.');
    promptField(chatFlowSteps[chatFlowIndex]);
    focusFriendlyFirstInput();
  }

  function beginEditLaunchFlow() {
    chatFlow = 'edit';
    chatFlowSteps = EDIT_LAUNCH_FLOW.slice();
    chatFlowIndex = 0;
    chatAwaiting = '';
    clearNode(byId('friendlyChatMessages'));
    addChatMessage('agent', 'M�nh sẽ r� so�t launch đang lưu theo từng mục. Nếu mục n�o giữ nguy�n, bạn g� "giữ nguy�n".');
    setNpcSpeech('Bắt đầu flow sửa launch tuần tự.');
    promptField(chatFlowSteps[chatFlowIndex]);
    focusFriendlyFirstInput();
  }

  function briefReviewText() {
    return [
      'T�m tắt trước khi ph�n t�ch:',
      '- T�n: ' + normalize((byId('launchName') && byId('launchName').value) || 'Chưa c�'),
      '- Ph�n loại: ' + (selectedText(byId('launchType')) || 'Chưa chọn'),
      '- Owner: ' + normalize((byId('launchOwner') && byId('launchOwner').value) || 'Chưa c�'),
      '- Thời gian: ' + [normalize((byId('launchTargetDate') && byId('launchTargetDate').value) || ''), normalize((byId('launchEndDate') && byId('launchEndDate').value) || '')].filter(Boolean).join(' - '),
      '- Brief: ' + shorten((byId('briefInput') && byId('briefInput').value) || 'Chưa c� brief', 220)
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
    var status = selectedText(byId('launchStatus')) || 'Chưa r�';
    var owner = normalize((byId('launchOwner') && byId('launchOwner').value) || 'Chưa c� owner');
    var start = normalize((byId('launchTargetDate') && byId('launchTargetDate').value) || '');
    var end = normalize((byId('launchEndDate') && byId('launchEndDate').value) || '');
    var dateText = [start, end].filter(Boolean).join(' - ') || 'Chưa c� thời gian';
    var brief = normalize((byId('briefInput') && byId('briefInput').value) || '');
    var postResult = postResultText();
    var savedLesson = lessonText();
    var nextAction = '';

    if (!brief) nextAction = 'Nhập brief trước để Mission Control c� dữ liệu đọc.';
    else if (!hasAnalysis) nextAction = 'Chốt brief rồi chạy ph�n t�ch trước launch để c� readiness, Red Team v� checklist.';
    else if (snapshot.topRisks && snapshot.topRisks.length) nextAction = 'Xử l� rủi ro đầu ti�n: ' + shorten(snapshot.topRisks[0], 120);
    else if (!isPostLaunchOpen()) nextAction = 'Theo d�i launch; khi chạy xong th� chuyển sang B�i học để nhập kết quả sau launch.';
    else if (!postResult) nextAction = 'Nhập kết quả sau launch trước, rồi để Agent ph�n t�ch sau launch.';
    else if (!postReviewDone) nextAction = 'Chạy ph�n t�ch sau launch để c� đề xuất trước khi lưu b�i học.';
    else if (!savedLesson) nextAction = 'Th�m �t nhất một b�i học ngắn rồi lưu kết quả / b�i học.';
    else nextAction = 'Lưu kết quả / b�i học v� d�ng lại cho launch sau.';

    return [
      'Tổng hợp launch hiện tại:',
      '- T�n: ' + snapshot.launchName,
      '- Ph�n loại: ' + snapshot.launchType,
      '- Trạng th�i: ' + status,
      '- Owner: ' + owner,
      '- Thời gian: ' + dateText,
      '- Brief: ' + shorten(snapshot.briefGoal || brief || 'Chưa c� brief', 180),
      '',
      'Readiness:',
      hasAnalysis
        ? '- ' + snapshot.scoreLabel + ' ' + snapshot.score.text + ' | ' + snapshot.decision + ' | ' + snapshot.gate
        : '- Chưa c� ph�n t�ch trước launch.',
      snapshot.scoreReason ? '- L� do: ' + shorten(snapshot.scoreReason, 180) : '',
      '',
      'Top risks:',
      friendlyList(snapshot.topRisks, 'Chưa c� top risk. H�y chạy ph�n t�ch trước launch.', function (item) { return shorten(item, 150); }, 3),
      '',
      'Red Team:',
      friendlyList(snapshot.voices, 'Chưa c� phản biện. H�y chạy ph�n t�ch trước launch.', function (item) {
        return item.persona + ': ' + shorten(item.worry, 130);
      }, 3),
      '',
      'Checklist:',
      friendlyList(snapshot.tasks, 'Chưa c� checklist. H�y chạy ph�n t�ch trước launch.', function (item) {
        return item.name + (item.meta ? ' | ' + item.meta : '');
      }, 4),
      '',
      'Sau launch:',
      '- Kết quả: ' + (postResult ? shorten(postResult, 160) : 'Chưa nhập'),
      '- B�i học: ' + (savedLesson ? shorten(savedLesson, 160) : 'Chưa lưu b�i học mới trong form Friendly'),
      '',
      'Gợi � tiếp theo: ' + nextAction
    ].filter(function (line) { return line !== ''; }).join('\n');
  }

  function friendlySupportActions() {
    return [
      { label: 'Tổng hợp launch', action: 'summarize' },
      { label: 'Rule readiness', action: 'support-topic', value: 'readiness' },
      { label: 'Red Team', action: 'support-topic', value: 'red-team' },
      { label: 'Checklist', action: 'support-topic', value: 'checklist' },
      { label: 'B�i học', action: 'support-topic', value: 'lessons' },
      { label: 'Tạo/sửa launch', action: 'support-topic', value: 'flow' }
    ];
  }

  function supportText(topic) {
    var low = fold(topic || '');
    var snapshot = collectSnapshot();
    if (low.indexOf('readiness') !== -1 || low.indexOf('diem') !== -1 || low.indexOf('cham') !== -1 || low.indexOf('rule') !== -1 || low.indexOf('luat') !== -1) {
      return [
        'Rule readiness d�ng để trả lời c�u hỏi: launch n�y đ� đủ an to�n để chạy chưa?',
        'Friendly kh�ng tự chấm điểm lại. N� đọc kết quả thật từ bản Pro sau khi bạn bấm Chạy ph�n t�ch.',
        'Điểm được gom từ c�c nh�m rủi ro của ph�n loại/template hiện tại. Green nghĩa l� tương đối sẵn s�ng, Yellow nghĩa l� cần sửa trước khi launch, Red nghĩa l� n�n dừng để xử l� rủi ro lớn.',
        snapshot.score && hasRealAnalysis() ? 'Launch hiện tại đang l� ' + snapshot.scoreLabel + ' ' + snapshot.score.text + ': ' + snapshot.gate + '.' : 'Launch hiện tại chưa c� ph�n t�ch, n�n chưa c� m�u readiness thật.'
      ].join('\n');
    }
    if (low.indexOf('red') !== -1 || low.indexOf('phan bien') !== -1) {
      return 'Red Team l� nh�m g�c nh�n phản biện trước launch. N� kh�ng thay Human quyết định, m� chỉ chỉ ra chỗ dễ hỏng: người chơi hiểu nhầm, CS bị qu� tải, kỹ thuật thiếu rollback, reward bị exploit, hoặc business guardrail chưa r�. Sau khi ph�n t�ch, Friendly sẽ đọc c�c thẻ Red Team thật từ DOM.';
    }
    if (low.indexOf('checklist') !== -1 || low.indexOf('viec') !== -1) {
      return 'Checklist biến brief v� rủi ro th�nh việc cần l�m c� owner, deadline v� trạng th�i. Với Friendly, Human c� thể chat để sửa brief/owner/thời gian; sau khi chạy ph�n t�ch th� checklist thật từ Pro sẽ hiện ở bước Việc cần l�m.';
    }
    if (low.indexOf('lesson') !== -1 || low.indexOf('bai hoc') !== -1 || low.indexOf('post') !== -1) {
      return 'B�i học l� ph�n t�ch bắt buộc lần thứ hai, sau khi launch đ� chạy. Flow đ�ng l�: nhập kết quả sau launch, để Agent ph�n t�ch v� đề xuất, sau đ� mới th�m b�i học v� lưu lại cho launch sau.';
    }
    if (low.indexOf('brief') !== -1 || low.indexOf('nap') !== -1) {
      return 'Brief kh�ng cần văn hay, nhưng n�n c� mục ti�u, đối tượng, thời gian, owner, k�nh truyền th�ng, reward/impact, rủi ro c�n mở v� c�ch dừng/rollback. Nếu thiếu, cứ d�n th� v�o chat; Mission Control sẽ chỉ ra phần c�n mơ hồ sau khi ph�n t�ch.';
    }
    if (low.indexOf('flow') !== -1 || low.indexOf('tao') !== -1 || low.indexOf('sua') !== -1 || low.indexOf('cach dung') !== -1 || low.indexOf('huong dan') !== -1) {
      return 'Friendly kh�c Pro ở c�ch thao t�c: Human chat hoặc bấm n�t nhanh, Mission Control dẫn từng bước v� tự điền v�o form thật. Pro l� bảng điều khiển thủ c�ng. Khi tạo/sửa launch, bạn c� thể g� tự nhi�n như "đổi owner th�nh PM LiveOps", "sửa thời gian 12/06 - 18/06", hoặc "d�n brief".';
    }
    return [
      'M�nh c� thể hỗ trợ trong phạm vi LaunchOps Command Center:',
      '- Tổng hợp t�nh trạng launch hiện tại.',
      '- Giải th�ch rule readiness, Green/Yellow/Red v� v� sao cần ph�n t�ch trước launch.',
      '- Giải th�ch Red Team, checklist, post-launch v� b�i học.',
      '- Hướng dẫn tạo/sửa launch bằng chat, nhưng kh�ng thay Human quyết định.',
      'Bạn c� thể hỏi kiểu: "tổng hợp launch n�y", "giải th�ch rule chấm điểm", hoặc "nạp brief thế n�o cho đ�ng?".'
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

  // Nhận diện y�u cầu x�a launch hiện tại
  function isDeleteIntent(text) {
    var low = fold(text);
    if (low.indexOf('xoa launch') !== -1) return true;
    if (low.indexOf('delete launch') !== -1) return true;
    if (low.indexOf('huy launch') !== -1 || low.indexOf('huy bo launch') !== -1) return true;
    if (low === 'xoa' || low === 'delete' || low === 'xoa di' || low === 'xoa no') return true;
    if ((low.indexOf('xoa') !== -1 || low.indexOf('delete') !== -1) && (low.indexOf('launch') !== -1 || low.indexOf('cai nay') !== -1 || low.indexOf('no di') !== -1 || low.indexOf('item') !== -1)) return true;
    return false;
  }

  // Nhận diện y�u cầu LLM viết brief từ � tưởng th� của Human
  function isWriteBriefIntent(text) {
    var low = fold(text);
    if (low.indexOf('viet brief') !== -1) return true;
    if (low.indexOf('viet ho') !== -1 || low.indexOf('viet giup') !== -1) return true;
    if (low.indexOf('soan brief') !== -1) return true;
    if (low.indexOf('viet hoan chinh') !== -1) return true;
    if ((low.indexOf('giup') !== -1 || low.indexOf('gi�m') !== -1) && low.indexOf('brief') !== -1) return true;
    if (low.indexOf('tu y tuong') !== -1 || low.indexOf('expand brief') !== -1) return true;
    if (low.indexOf('lam brief') !== -1 || low.indexOf('tao brief') !== -1) return true;
    return false;
  }

  // Gọi backend y�u cầu LLM viết brief launch ho�n chỉnh từ � tưởng th�
  function callAssistantForBriefWriter(idea, callback) {
    var base = (window.LAUNCHOPS_API_BASE || '').trim().replace(/\/$/, '');
    if (!base) {
      var hostLocal = ['127.0.0.1', 'localhost', '::1'].indexOf(window.location.hostname) !== -1;
      base = hostLocal ? 'http://127.0.0.1:8788/api' : '';
    }
    if (!base) { callback(null); return; }
    // Prompt NGẮN để n� timeout 35s mặc định của backend.
    var prompt = 'Viết brief launch ngắn gọn (8 mục, mỗi mục 1-2 c�u, dạng "- Mục: nội dung", kh�ng markdown):\n'
      + '- Mục ti�u + KPI\n- Đối tượng\n- Cơ chế\n- Phần thưởng/ng�n s�ch\n- Thời gian\n- Rủi ro + ph�ng\n- CS/owner\n- Đo lường\n\n'
      + '� tưởng: ' + (idea || '');
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

  // Nhận diện c�u hỏi mở: xin g�p � / đ�nh gi� / review / cải tiến / lời khuy�n
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

  // Đọc context launch hiện tại từ DOM (kh�ng gọi lại logic chấm điểm)
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
        + 'T�n: ' + (ctx.name || '(chưa đặt)') + '\n'
        + 'Ph�n loại: ' + (ctx.type || '(chưa chọn)') + '\n'
        + 'Trạng th�i: ' + (ctx.status || '(chưa r�)') + '\n'
        + 'Owner: ' + (ctx.owner || '(chưa giao)') + '\n'
        + 'Mức sẵn s�ng: ' + (ctx.score || '(chưa ph�n t�ch)') + ' ' + (ctx.readinessColor || '') + '\n'
        + (ctx.risks ? 'Rủi ro h�ng đầu đang nổi: ' + ctx.risks + '\n' : '')
        + 'Brief hiện tại:\n' + (ctx.brief || '(chưa c� brief)') + '\n'
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
    addChatMessage('agent', 'Bạn đ� chốt final brief chưa? G� "ph�n t�ch" để chạy ph�n t�ch trước launch, "xem lại" để xem brief, hoặc "sửa" để chỉnh tiếp.');
    setNpcSpeech('Đang chờ Human chốt final trước ph�n t�ch pre-launch.');
    updateGuidance('Gợi � tiếp theo: chốt final rồi mới chạy ph�n t�ch trước launch.');
    chatInputPlaceholder('G�: ph�n t�ch / xem lại / sửa');
    setChatActions([
      { label: 'Ph�n t�ch ngay', action: 'final-analyze' },
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
      setNpcSpeech('Đang tổng hợp t�nh trạng launch hiện tại cho Human.');
      updateGuidance('Gợi � tiếp theo: hỏi tiếp về rule, rủi ro, checklist hoặc chốt ph�n t�ch trước launch.');
      setChatActions(friendlySupportActions());
      return;
    }

    if (isSupportIntent(value)) {
      addChatMessage('agent', supportText(value));
      setNpcSpeech('Đang giải th�ch theo ngữ cảnh thao t�c của Human.');
      updateGuidance('Gợi � tiếp theo: hỏi r� phần bạn muốn hiểu, hoặc quay lại tạo/sửa launch.');
      setChatActions(friendlySupportActions());
      return;
    }

    // X�a launch hiện tại — gọi n�t thật #deleteLaunch (app.js sẽ hỏi x�c nhận).
    if (isDeleteIntent(value)) {
      handleFriendlyAction('delete');
      return;
    }

    // Human y�u cầu LLM viết brief từ � tưởng th�.
    // Đặt TRƯỚC nh�nh `chatAwaiting === 'brief'` để khỏi bị wizard nuốt text th� v�o field.
    if (isWriteBriefIntent(value)) {
      var ideaSeed = text; // d�ng raw text giữ nguy�n dấu c�u
      addChatMessage('agent', 'M�nh đang đọc � tưởng v� soạn brief launch đầy đủ theo format LaunchOps. Đợi m�nh một ch�t...');
      setNpcSpeech('Đang nhờ Agent AI soạn brief đầy đủ từ � tưởng của Human.');
      updateGuidance('Đang chờ Agent AI viết brief...');
      callAssistantForBriefWriter(ideaSeed, function (reply) {
        if (reply) {
          if (setRealField('briefInput', reply)) {
            addChatMessage('agent', 'M�nh đ� soạn brief đầy đủ v� ghi v�o � brief launch. Bản brief:');
            addChatMessage('agent', reply);
            setNpcSpeech('Brief đ� được Agent AI viết, mời Human kiểm tra.');
            updateGuidance('Gợi �: kiểm tra brief, sửa th�m nếu cần, rồi bấm Chạy ph�n t�ch.');
            // Nếu đang ở wizard step brief, đẩy flow đi tiếp; nếu kh�ng th� show edit actions
            if (chatAwaiting === 'brief') {
              finishField('Brief đ� được AI soạn v� nạp v�o � brief.', 'brief');
            } else {
              setChatActions(friendlySupportActions());
            }
          } else {
            addChatMessage('agent', 'M�nh đ� c� bản brief nhưng chưa ghi được v�o � brief (form c� thể đang đ�ng). Brief đề xuất:');
            addChatMessage('agent', reply);
            setChatActions(friendlySupportActions());
          }
        } else {
          addChatMessage('agent', 'M�nh chưa gọi được Agent AI để viết brief l�c n�y. Bạn c� thể tự g� � tưởng v�o � brief, hoặc thử lại sau.');
          setNpcSpeech('Agent AI tạm kh�ng phản hồi.');
          setChatActions(friendlySupportActions());
        }
      });
      return;
    }

    // C�u hỏi mở (g�p � / đ�nh gi� / review / nhận x�t / lời khuy�n / cải tiến).
    // Gọi backend /api/assistant với context launch hiện tại để LLM trả lời thật.
    // Đặt TRƯỚC c�c nh�nh rule-based "brief/owner/..." để kh�ng bị nuốt th�nh prompt field.
    if (isAdviceIntent(value)) {
      var ctxForAdvice = currentLaunchContextForChat();
      addChatMessage('agent', 'M�nh đang xem brief, readiness v� rủi ro để g�p � cụ thể cho bạn...');
      setNpcSpeech('Đang xin g�p � từ Agent AI dựa tr�n brief v� rủi ro hiện tại.');
      updateGuidance('Đang chờ Agent AI trả lời...');
      callAssistantForChat(value, ctxForAdvice, function (reply) {
        if (reply) {
          addChatMessage('agent', reply);
          setNpcSpeech('Agent AI vừa g�p � dựa tr�n brief launch hiện tại.');
          updateGuidance('Bạn c� thể hỏi tiếp về rủi ro, Red Team, checklist hoặc bấm Chạy ph�n t�ch.');
        } else {
          addChatMessage('agent', 'M�nh chưa gọi được Agent AI l�c n�y (backend hoặc mạng c� thể tạm gi�n đoạn). Bạn c� thể bấm "Chạy ph�n t�ch" để chấm rủi ro local, hoặc hỏi lại sau.');
          setNpcSpeech('Agent AI tạm kh�ng phản hồi, d�ng local fallback.');
          updateGuidance('Gợi �: bấm Chạy ph�n t�ch hoặc hỏi lại.');
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
        addChatMessage('agent', 'Nếu đ� ổn, g� "ph�n t�ch". Nếu cần sửa, g� "sửa".');
      } else if (finalLow.indexOf('sua') !== -1 || finalLow.indexOf('chinh') !== -1) {
        showEditActions();
        addChatMessage('agent', 'Bạn muốn sửa phần n�o trước? Chọn n�t hoặc g� trực tiếp.');
      } else {
        addChatMessage('agent', 'M�nh chưa r�. Bạn g� "ph�n t�ch", "xem lại", hoặc "sửa" nh�.');
      }
      return;
    }

    if (chatAwaiting && isSkipText(value)) {
      finishField('Giữ nguy�n mục n�y.', chatAwaiting);
      return;
    }

    if (chatAwaiting === 'type') {
      var typeValue = optionValueFromText('launchType', value);
      if (typeValue && setRealField('launchType', typeValue)) finishField('Đ� cập nhật ph�n loại launch.', 'type');
      else addChatMessage('agent', 'M�nh chưa khớp được ph�n loại n�y. Bạn c� thể g� "Sự kiện game", "Chiến dịch marketing", "Ra mắt t�nh năng"...');
      return;
    }

    if (chatAwaiting === 'status') {
      var statusValue = statusValueFromText(value);
      if (statusValue && setRealField('launchStatus', statusValue)) finishField('Đ� cập nhật trạng th�i launch.', 'status');
      else addChatMessage('agent', 'M�nh chưa khớp được trạng th�i. Bạn g� Sắp chạy, Đang chạy, hoặc Đ� chạy nh�.');
      return;
    }

    if (chatAwaiting === 'name') {
      if (setRealField('launchName', value)) finishField('Đ� cập nhật t�n launch.', 'name');
      return;
    }
    if (chatAwaiting === 'owner') {
      if (setRealField('launchOwner', value)) finishField('Đ� cập nhật owner v� hiển thị ngay tr�n Chi tiết launch.', 'owner');
      return;
    }
    if (chatAwaiting === 'dates') {
      var dates = parseDates(value);
      var changedDates = false;
      if (dates.start) changedDates = setRealField('launchTargetDate', dates.start) || changedDates;
      if (dates.end) changedDates = setRealField('launchEndDate', dates.end) || changedDates;
      if (changedDates) finishField('Đ� cập nhật thời gian launch.', 'dates');
      else addChatMessage('agent', 'M�nh chưa đọc được thời gian. Bạn g� theo dạng 12/06/2026 - 14/06/2026 nh�.');
      return;
    }
    if (chatAwaiting === 'brief') {
      if (setRealField('briefInput', text)) finishField('Đ� nhận brief. Khi sẵn s�ng, bạn c� thể bấm Chạy ph�n t�ch.', 'brief');
      return;
    }
    if (chatAwaiting === 'postResult') {
      if (setRealField('postResultInput', text)) finishField('Đ� nhận kết quả sau launch. Bạn c� thể th�m b�i học hoặc lưu lại.', 'postResult');
      return;
    }
    if (chatAwaiting === 'lesson') {
      if (setRealField('lessonInput', text)) finishField('Đ� nhận b�i học mới. Bấm Lưu kết quả / b�i học để ghi lại.', 'lesson');
      return;
    }

    var low = value.toLowerCase();
    if (fold(value).indexOf('tao launch') !== -1 || fold(value).indexOf('launch moi') !== -1) {
      clickRealButton('newLaunch');
    } else if (fold(value).indexOf('sua launch') !== -1 || fold(value).indexOf('chinh launch') !== -1) {
      showEditActions();
      addChatMessage('agent', 'Bạn muốn sửa phần n�o của launch n�y? Chọn n�t hoặc g� trực tiếp.');
    } else if (fold(value).indexOf('phan tich') !== -1 || fold(value).indexOf('chay phan tich') !== -1) {
      showPreAnalyzeDecision();
    } else if (fold(value).indexOf('demo') !== -1) {
      handleFriendlyAction('demo');
    } else if (fold(value).indexOf('export') !== -1 || fold(value).indexOf('xuat report') !== -1 || fold(value).indexOf('xuat bao cao') !== -1) {
      handleFriendlyAction('export');
    } else if (low.indexOf('owner') !== -1) promptField('owner');
    else if (low.indexOf('brief') !== -1) promptField('brief');
    else if (low.indexOf('t�n') !== -1 || low.indexOf('ten') !== -1) promptField('name');
    else if (fold(value).indexOf('ket qua sau launch') !== -1 || fold(value).indexOf('post launch') !== -1) {
      setStep(4);
      beginPostLaunchFlow('postResult');
    }
    else if (low.indexOf('b�i học') !== -1 || low.indexOf('bai hoc') !== -1) {
      setStep(4);
      beginPostLaunchFlow('lesson');
    }
    else {
      addChatMessage('agent', 'M�nh c� thể tạo launch, sửa t�n, ph�n loại, owner, thời gian, brief, hoặc chạy ph�n t�ch. Bạn chọn một n�t nhanh nh�.');
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
      addChatMessage('agent', 'M�nh đang chạy ph�n t�ch trước launch. Khi xong, readiness, Red Team v� checklist sẽ cập nhật bằng dữ liệu thật.');
      setNpcSpeech('Đang ph�n t�ch trước launch từ brief đ� chốt.');
      updateGuidance('Gợi � tiếp theo: chờ ph�n t�ch xong rồi xem readiness, phản biện v� checklist.');
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
      addLessonMessage('agent', 'Launch n�y chưa ở trạng th�i Đ� chạy. Sau khi launch chạy xong, quay lại đ�y để nhập kết quả sau launch, ph�n t�ch sau launch, th�m b�i học rồi lưu.');
      setNpcSpeech('Chưa mở flow sau launch v� launch chưa ho�n tất.');
      return;
    }
    if (lessonAwaiting === 'lesson') {
      if (!postResultText()) {
        addLessonMessage('agent', 'Cần nhập kết quả sau launch trước. Sau đ� m�nh mới ph�n t�ch v� mở bước th�m b�i học.');
        lessonAwaiting = 'postResult';
      } else if (!postReviewDone) {
        runPostLaunchReview();
      } else {
        addLessonMessage('agent', 'Bạn nhập b�i học r�t ra sau launch nh�.');
      }
    } else {
      addLessonMessage('agent', 'Bạn nhập kết quả sau launch thực tế trước. Đ�y l� lần ph�n t�ch bắt buộc thứ hai, sau khi launch đ� chạy.');
    }
    var input = byId('friendlyLessonChatInput');
    if (input) {
      input.placeholder = lessonAwaiting === 'lesson' ? 'Nhập b�i học r�t ra sau launch' : 'Nhập kết quả sau launch';
      try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
    }
    setLessonActionState();
  }

  function handleLessonChatText(text) {
    var value = normalize(text);
    if (!value) return;
    addLessonMessage('human', value);
    if (!isPostLaunchOpen()) {
      addLessonMessage('agent', 'Flow sau launch đang bị kh�a. Khi launch chuyển sang Đ� chạy, bạn quay lại nhập kết quả sau launch.');
      return;
    }
    if (lessonAwaiting === 'lesson') {
      if (setRealField('lessonInput', text)) {
        addLessonMessage('agent', 'Đ� nhận b�i học. B�y giờ bạn c� thể lưu kết quả / b�i học.');
        setNpcSpeech('Đ� c� b�i học, sẵn s�ng lưu.');
      }
      refreshPostLaunchPanel();
      return;
    }
    if (setRealField('postResultInput', text)) {
      setRealField('postResultStatus', 'completed');
      addLessonMessage('agent', 'Đ� nhận kết quả sau launch. M�nh sẽ ph�n t�ch sau launch v� đưa đề xuất.');
      runPostLaunchReview();
      refreshPostLaunchPanel();
    }
  }

  function handleFriendlyAction(action, value) {
    if (!action) return;
    if (action === 'new') {
      addChatMessage('human', 'Tạo launch mới');
      clickRealButton('newLaunch');
      return;
    }
    if (action === 'edit') {
      addChatMessage('human', 'Sửa launch n�y');
      showEditActions();
      addChatMessage('agent', 'Bạn muốn sửa phần n�o? Chọn một mục b�n dưới hoặc g� trực tiếp, v� dụ: đổi owner th�nh PM LiveOps.');
      setNpcSpeech('Đang chờ Human chọn phần cần sửa của launch n�y.');
      focusFriendlyFirstInput();
      return;
    }
    if (action === 'edit-sequential') {
      addChatMessage('human', 'R� so�t tuần tự');
      beginEditLaunchFlow();
      return;
    }
    if (action === 'summarize') {
      addChatMessage('human', 'Tổng hợp launch');
      addChatMessage('agent', launchSummaryText());
      setNpcSpeech('Đang tổng hợp t�nh trạng launch hiện tại cho Human.');
      setChatActions(friendlySupportActions());
      return;
    }
    if (action === 'support') {
      addChatMessage('human', 'Hỗ trợ / giải th�ch');
      addChatMessage('agent', supportText(''));
      setNpcSpeech('Đang mở chế độ hỗ trợ, giải th�ch c�ch d�ng v� rule LaunchOps.');
      setChatActions(friendlySupportActions());
      return;
    }
    if (action === 'support-topic') {
      addChatMessage('human', value === 'readiness' ? 'Giải th�ch rule readiness' : 'Giải th�ch ' + (value || 'LaunchOps'));
      addChatMessage('agent', supportText(value));
      setChatActions(friendlySupportActions());
      return;
    }
    if (action === 'field') {
      promptField(value);
      return;
    }
    if (action === 'set-type') {
      if (setRealField('launchType', value)) finishField('Đ� cập nhật ph�n loại launch.', 'type');
      return;
    }
    if (action === 'set-status') {
      if (setRealField('launchStatus', value)) finishField('Đ� cập nhật trạng th�i launch.', 'status');
      return;
    }
    if (action === 'sample') {
      addChatMessage('human', 'Nạp Brief Mẫu');
      if (clickRealButton('loadBadBrief')) {
        setTimeout(function () {
          syncFriendlyFormFromReal();
          persistActiveFriendlySession(true);
          refreshFriendlyDetailPreview();
          refreshChatSummary();
          addChatMessage('agent', 'Đ� nạp brief mẫu. Bạn c� thể sửa brief hoặc chạy ph�n t�ch.');
          setNpcSpeech('Brief mẫu đ� được nạp, t�i đang chờ bạn kiểm tra lại.');
          updateGuidance('Gợi � tiếp theo: kiểm tra brief rồi bấm Chạy ph�n t�ch.');
        }, 100);
      }
      return;
    }
    if (action === 'demo') {
      addChatMessage('human', 'Demo mode');
      persistActiveFriendlySession(false);
      activeFriendlyDraftId = '';
      if (clickRealButton('demoMode')) {
        addChatMessage('agent', 'Demo mode nạp một launch mẫu v� tự tạo đủ readiness, Red Team, checklist, b�i học để quay hoặc review nhanh.');
        setNpcSpeech('Đang nạp flow demo mẫu.');
        [500, 1300, 2300].forEach(function (ms) { setTimeout(updateFromDom, ms); });
      }
      return;
    }
    if (action === 'export') {
      addChatMessage('human', 'Export report');
      syncLaunchFieldsFromFriendly();
      persistActiveFriendlySession(false);
      if (clickRealButton('exportReport')) {
        addChatMessage('agent', 'Report Markdown đ� được xuất bằng n�t thật. Nếu tr�nh duyệt kh�ng hiện popup, h�y kiểm tra thư mục Downloads hoặc clipboard.');
        setNpcSpeech('Đ� gửi lệnh xuất report cho launch đang mở.');
      }
      return;
    }
    if (action === 'save') {
      addChatMessage('human', 'Lưu launch');
      syncLaunchFieldsFromFriendly();
      persistActiveFriendlySession(true);
      scheduleFriendlySaveCleanup(activeFriendlyDraftId, activeRealLaunchId());
      if (clickRealButton('saveLaunch')) {
        addChatMessage('agent', 'M�nh đ� gửi lệnh lưu bằng n�t Lưu launch thật.');
        setNpcSpeech('Đang lưu launch v�o dữ liệu thật.');
      }
      return;
    }
    if (action === 'delete') {
      addChatMessage('human', 'X�a launch n�y');
      var deleteBtn = byId('deleteLaunch');
      if (!deleteBtn) {
        addChatMessage('agent', 'M�nh kh�ng t�m thấy n�t x�a thật tr�n giao diện. C� thể launch n�y kh�ng hỗ trợ x�a, hoặc bạn cần mở Pro mode để thao t�c trực tiếp.');
        setNpcSpeech('Kh�ng t�m thấy n�t x�a.');
        return;
      }
      if (deleteBtn.disabled) {
        addChatMessage('agent', 'Launch n�y hiện kh�ng được ph�p x�a (c� thể do quyền role hoặc trạng th�i launch). Kiểm tra lại role thao t�c hoặc đổi sang Pro mode để xem chi tiết.');
        setNpcSpeech('Quyền x�a bị kh�a.');
        return;
      }
      addChatMessage('agent', 'M�nh đang gửi lệnh x�a launch n�y. Tr�nh duyệt sẽ hỏi x�c nhận — bạn bấm OK nếu chắc chắn muốn x�a.');
      setNpcSpeech('Đang x�a launch hiện tại theo lệnh.');
      // app.js gắn handler v�o click → sẽ confirm() rồi x�a
      deleteBtn.click();
      // Refresh chat sau khi x�a xong (DOM đ� đổi launch kh�c)
      setTimeout(function () {
        try { refreshChatSummary(); } catch (e) {}
        try { syncFriendlyFormFromReal(); } catch (e) {}
        try { refreshFriendlyDetailPreview(); } catch (e) {}
      }, 600);
      return;
    }
    if (action === 'analyze') {
      addChatMessage('human', 'Chạy ph�n t�ch');
      showPreAnalyzeDecision();
      return;
    }
    if (action === 'final-analyze') {
      addChatMessage('human', 'Ph�n t�ch ngay');
      runPreLaunchAnalyze();
      return;
    }
    if (action === 'final-review') {
      addChatMessage('human', 'Xem lại brief');
      addChatMessage('agent', briefReviewText());
      addChatMessage('agent', 'Nếu đ� ổn, g� "ph�n t�ch" hoặc bấm Ph�n t�ch ngay. Nếu cần sửa, g� "sửa".');
      chatAwaiting = 'finalDecision';
      return;
    }
    if (action === 'final-edit') {
      addChatMessage('human', 'Chỉnh sửa lại');
      showEditActions();
      addChatMessage('agent', 'Bạn muốn sửa phần n�o trước? Chọn n�t hoặc g� trực tiếp.');
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
        addLessonMessage('agent', 'Chưa thể lưu. Launch cần ở trạng th�i Đ� chạy trước.');
        return;
      }
      if (!postResultText()) {
        addLessonMessage('agent', 'Chưa thể lưu. Bạn cần nhập kết quả sau launch trước.');
        beginPostLaunchFlow('postResult');
        return;
      }
      if (!postReviewDone) {
        addLessonMessage('agent', 'Chưa thể lưu. M�nh cần ph�n t�ch sau launch v� đưa đề xuất trước.');
        runPostLaunchReview();
        return;
      }
      if (!lessonText()) {
        addLessonMessage('agent', 'Chưa thể lưu. Bạn cần th�m �t nhất một b�i học ngắn.');
        beginPostLaunchFlow('lesson');
        return;
      }
      syncLessonFieldsFromFriendly();
      if (clickRealButton('saveLesson')) {
        addLessonMessage('agent', 'M�nh đ� gửi lệnh lưu kết quả / b�i học bằng n�t thật.');
        setNpcSpeech('Đang lưu kết quả v� b�i học.');
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
    addChatMessage('agent', 'Bạn muốn tạo launch mới, sửa launch đang chọn, hay chạy ph�n t�ch? M�nh sẽ hỏi từng bước v� tự điền v�o LaunchOps.');
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
    if (cls.indexOf('is-running') !== -1 || text.indexOf('dang phan tich') !== -1 || text.indexOf('đang ph�n t�ch') !== -1 || text.indexOf('vui l�ng chờ') !== -1) return 'running';
    if (cls.indexOf('is-success') !== -1 || text.indexOf('ho�n th�nh') !== -1 || text.indexOf('hoan thanh') !== -1) return 'success';
    if (cls.indexOf('is-error') !== -1 || text.indexOf('sự cố') !== -1 || text.indexOf('su co') !== -1) return 'error';
    return 'idle';
  }

  function hasRealAnalysis() {
    var decision = ownText(byId('decisionTitle')).toLowerCase();
    if (!decision) return false;
    if (decision.indexOf('chưa c� ph�n t�ch') !== -1 || decision.indexOf('chua co phan tich') !== -1) return false;
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
    if (state === 'green') return 'Xanh';
    if (state === 'red') return 'Đỏ';
    if (state === 'yellow') return 'V�ng';
    return 'Chưa r�';
  }

  function verdictText(state) {
    if (state === 'green') return 'C� thể launch';
    if (state === 'yellow') return 'Cần sửa trước khi launch';
    if (state === 'red') return 'Dừng để xử l� rủi ro';
    if (state === 'thinking') return 'Đang ph�n t�ch';
    return 'Chưa ph�n t�ch';
  }

  function cleanAnalysisLine(value) {
    return normalize(value)
      .replace(/^Lo ngại:\s*/i, '')
      .replace(/^Dấu hiệu:\s*/i, '')
      .replace(/^C�ch xử l�:\s*/i, '');
  }

  function briefGoal(text) {
    var lines = String(text || '').split(/\n+/).map(normalize).filter(Boolean);
    if (!lines.length) return 'Brief đang trống. H�y nhập hoặc chọn launch c� brief trước khi chạy ph�n t�ch.';
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
        label: firstText(node, 'strong') || 'Nh�m rủi ro',
        score: parsed.score,
        max: parsed.max,
        detail: firstText(node, 'small') || firstText(node, '.risk-meaning') || 'Cần kiểm tra th�m.'
      };
    }).filter(function (item) {
      return item.label && item.label.toLowerCase().indexOf('chưa c�') === -1;
    });
  }

  function collectTopRisks() {
    return [].slice.call(document.querySelectorAll('#topRisks li'))
      .map(ownText)
      .filter(function (item) {
        var low = item.toLowerCase();
        return item && low.indexOf('chưa c� rủi ro') === -1;
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
        worry: detail.worry || paragraphs[0] || 'Cần phản biện th�m trước khi launch.',
        evidence: detail.evidence || paragraphs[1] || '',
        fix: detail.fix || paragraphs[2] || '',
        summary: paragraphs.join(' ')
      };
    }).filter(function (item) {
      return item.worry && item.persona.toLowerCase().indexOf('chưa c�') === -1;
    });

    if (voices.length) return voices.slice(0, 5);
    return (topRisks || []).slice(0, 3).map(function (risk, index) {
      return {
        initials: 'R' + (index + 1),
        persona: 'Nh�m phản biện',
        worry: risk,
        evidence: 'Rủi ro n�y đang đứng trong top risks của analysis.',
        fix: 'Cần chốt c�ch xử l� trong brief hoặc checklist.',
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
        name: firstText(card, 'h4') || 'Việc cần l�m',
        meta: [owner, deadline || status].filter(Boolean).join(' - ')
      };
    }).filter(function (item) {
      return item.name && item.name.toLowerCase().indexOf('chưa c�') === -1;
    }).slice(0, 5);
  }

  function collectLessonText(topRisks) {
    var blocks = [].slice.call(document.querySelectorAll('#postmortemDraft .draft-block'));
    if (blocks.length) {
      var first = blocks[0];
      var title = firstText(first, 'h3');
      var item = firstText(first, 'li');
      return {
        memo: title || 'Đ� c� c�u hỏi post-mortem',
        detail: item || 'D�ng phần b�i học sau launch để ghi lại quyết định v� kết quả thật.'
      };
    }
    if (topRisks && topRisks.length) {
      return {
        memo: 'Đ� gom rủi ro ch�nh',
        detail: shorten(topRisks[0], 150)
      };
    }
    return {
      memo: 'Kết quả ph�n t�ch đ� sẵn s�ng',
      detail: 'B�i học, rủi ro v� quyết định sẽ được lưu lại để lần launch sau an to�n hơn.'
    };
  }

  function collectSnapshot() {
    var score = parseScore(ownText(byId('scoreValue')));
    var topRisks = collectTopRisks();
    var state = detectState();
    var brief = byId('briefInput') ? byId('briefInput').value : '';
    var launchName = (byId('launchName') && byId('launchName').value) || ownText(byId('detailTitle')) || 'Launch chưa đặt t�n';
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
      decision: ownText(byId('decisionTitle')) || 'Chưa c� ph�n t�ch',
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
    var items = risks && risks.length ? risks : [{ label: 'Chưa c� điểm rủi ro', score: 0, max: 2, detail: '' }];
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
    var items = topRisks && topRisks.length ? topRisks.slice(0, 3) : ['Chưa c� top risk r� r�ng'];
    items.forEach(function (item) {
      box.appendChild(makeEl('span', 'friendly-viz-score-chip', shorten(item, 54)));
    });
  }

  function renderVoices(voices) {
    var box = byId('friendlyVizVoices');
    if (!box) return;
    clearNode(box);
    var items = voices && voices.length ? voices : [{ initials: 'RT', persona: 'Red Team', worry: 'Chạy ph�n t�ch để xem c�c g�c phản biện.', evidence: 'Khi c� kết quả thật, từng vai phản biện sẽ hiển thị đầy đủ.', fix: 'Mở brief v� bổ sung phần c�n thiếu trước launch.', summary: 'Chạy ph�n t�ch để xem c�c g�c phản biện.' }];
    items.slice(0, 5).forEach(function (voice, index) {
      var row = makeEl('div', 'friendly-viz-voice');
      row.style.animationDelay = (index * 0.16) + 's';
      row.appendChild(makeEl('div', 'friendly-viz-avatar', shorten(voice.initials || 'RT', 3)));
      var body = makeEl('div', 'friendly-viz-voice-body');
      body.appendChild(makeEl('b', '', voice.persona || 'Red Team'));
      body.appendChild(makeVoiceLine('Lo ngại', voice.worry || voice.concern || ''));
      if (voice.evidence) body.appendChild(makeVoiceLine('Dấu hiệu', voice.evidence));
      if (voice.fix) body.appendChild(makeVoiceLine('C�ch xử l�', voice.fix));
      if (voice.summary) body.appendChild(makeEl('p', 'friendly-viz-voice-summary', shorten(voice.summary, 170)));
      row.appendChild(body);
      box.appendChild(row);
    });
  }

  function renderTasks(tasks) {
    var box = byId('friendlyVizTasks');
    if (!box) return;
    clearNode(box);
    var items = tasks && tasks.length ? tasks : [{ name: 'Chạy ph�n t�ch để tạo checklist', meta: 'Agent' }];
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
    setText('friendlyVizScore', snapshot.state === 'idle' ? 'Chưa c� điểm' : snapshot.score.text + ' - ' + snapshot.scoreLabel);
    setText('friendlyVizScoreDecision', snapshot.decision || 'Chưa c� ph�n t�ch');
    setText('friendlyVizScoreGate', snapshot.gate || verdictText(snapshot.state));
    setText('friendlyVizScoreReason', snapshot.scoreReason || snapshot.decision || 'Chạy ph�n t�ch để xem l� do điểm, kết luận v� phần c�n thiếu.');
    setText('friendlyVizBriefTitle', snapshot.launchName + ' - ' + snapshot.launchType);
    setText('friendlyVizBriefGoal', snapshot.briefGoal);
    setText('friendlyVizBriefMissing', snapshot.topRisks.length ? 'Thiếu: ' + snapshot.topRisks.slice(0, 3).map(function (item) { return shorten(item, 48); }).join(' | ') : 'Agent sẽ đọc phần c�n thiếu sau khi c� kết quả.');
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

    var speech = 'Đang chờ lệnh. Nếu bạn nhập g�, t�i sẽ gắn v�o launch đang mở.';
    if (snapshot.state === 'thinking') {
      speech = 'Đang tập trung đọc brief v� gom t�n hiệu rủi ro.';
    } else if (snapshot.state !== 'idle') {
      if (step === 0) speech = 'Đang soi brief của ' + snapshot.launchType + ', ưu ti�n phần c�n mơ hồ.';
      if (step === 1) speech = 'Đang nh�n readiness: ' + snapshot.score.text + ', trạng th�i ' + snapshot.scoreLabel + '.';
      if (step === 2) speech = 'Đang bật chế độ phản biện, ưu ti�n c�u hỏi kh�.';
      if (step === 3) speech = 'Đang gom việc cần owner v� deadline r� r�ng.';
      if (step === 4) speech = 'Đang chuẩn bị lưu quyết định v� b�i học cho lần sau.';
    }
    if (friendlySpeechOverride) speech = friendlySpeechOverride;
    setText('friendlyVizSpeech', speech);
  }

  function manualStepSpeech(step) {
    if (step === 1) return 'T�i đang nh�n đồng hồ readiness, chưa tự chuyển bước.';
    if (step === 2) return 'T�i đang bật mặt kh� t�nh của Red Team.';
    if (step === 3) return 'T�i đang lọc việc n�o cần chủ sở hữu r� r�ng.';
    if (step === 4) return 'T�i đang giữ chỗ cho kết quả v� b�i học sau launch.';
    return 'T�i đang ở Mission Control, chờ thao t�c cấu h�nh launch.';
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
      addChatMessage('agent', 'Ph�n t�ch đ� xong. Kết quả thật đ� cập nhật v�o readiness, Red Team v� checklist.');
      if (analysisAutoAdvancePending) {
        analysisAutoAdvancePending = false;
        setStep(1);
        addChatMessage('agent', 'M�nh đưa bạn sang Chấm điểm để xem kết luận v� l� do điểm trước.');
        setNpcSpeech('Ph�n t�ch xong, đang ở bước Chấm điểm.');
        updateGuidance('Gợi � tiếp theo: đọc l� do điểm, top risks, rồi chuyển sang Phản biện.');
      } else {
        setNpcSpeech('Ph�n t�ch xong, kết quả đ� đồng bộ v�o Friendly.');
        updateGuidance('Gợi � tiếp theo: d�ng Trước/Tiếp ở rail tr�i để xem readiness, phản biện v� checklist.');
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
      addChatMessage('agent', 'M�nh đ� đưa bạn về bước Đọc brief. Bạn c� thể tiếp tục chat để tạo hoặc sửa launch.');
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

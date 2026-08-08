/* ============================================================
   chat.js — 逢甲宿舍網路報修 Chatbot 主控制器
   ============================================================ */
'use strict';

const Chat = (() => {
  /* ── DOM 元素 ── */
  const messagesEl = document.getElementById('chat-messages');
  const inputEl = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');

  /* ── 狀態 ── */
  let sessionToken = null;
  let clientId = null;
  let activeButtons = [];

  /** 取得 Client ID（持久化於 localStorage，用於依使用者計數限流） */
  function getClientId() {
    if (clientId) return clientId;
    const STORAGE_KEY = 'fcu_client_id';
    try {
      let id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        id = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : 'cid_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem(STORAGE_KEY, id);
      }
      clientId = id;
    } catch (e) {
      clientId = 'cid_temp_' + Date.now();
    }
    return clientId;
  }

  /** 取得一次性 Token */
  function getToken() { return sessionToken; }

  /** 向後端取得一次性 Token */
  async function _fetchToken() {
    if (!CONFIG.GAS_URL || CONFIG.GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') return;
    try {
      const url = CONFIG.GAS_URL + (CONFIG.GAS_URL.includes('?') ? '&' : '?') + 'action=get_token';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.token) {
        sessionToken = data.token;
      }
    } catch (e) {
      console.warn('Failed to fetch session token:', e);
    }
  }

  /** 重設 / 重新取得 Token */
  async function refreshToken() {
    sessionToken = null;
    await _fetchToken();
    return sessionToken;
  }

  /* ── 語系字典捷徑存取 ── */
  function _R() { return CONFIG.RESPONSES[I18N.getLang()]; }
  function _B() { return CONFIG.BUTTON_LABELS[I18N.getLang()]; }
  function _L() { return CONFIG.INTENT_LABELS[I18N.getLang()]; }

  /* ── XSS 防護 ── */
  function _escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ── Markdown 簡易渲染 ── */
  function _parseMarkdown(text) {
    if (!text) return '';
    let html = _escapeHTML(text);
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      const escapedUrl = _escapeHTML(url);
      if (escapedUrl.startsWith('http://') || escapedUrl.startsWith('https://')) {
        return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="chat-link">${linkText}</a>`;
      }
      return linkText;
    });
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\_([^_]+)\_/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  /* ── 訊息操作 ── */
  function addMessage(text, isUser = false, isHtml = false) {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = `msg-wrapper ${isUser ? 'user' : 'bot'}`;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'msg-avatar';
    avatarDiv.setAttribute('aria-hidden', 'true');
    avatarDiv.textContent = isUser ? '👤' : '🔧';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'msg-content';

    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'msg-bubble';

    if (isHtml) {
      bubbleDiv.innerHTML = text;
    } else if (isUser) {
      bubbleDiv.textContent = text;
    } else {
      bubbleDiv.innerHTML = _parseMarkdown(text);
    }

    contentDiv.appendChild(bubbleDiv);
    wrapperDiv.appendChild(avatarDiv);
    wrapperDiv.appendChild(contentDiv);

    messagesEl.appendChild(wrapperDiv);
    _scrollToBottom();
  }

  function addBotMessage(text, isHtml = false) {
    addMessage(text, false, isHtml);
  }

  function addUserMessage(text) {
    addMessage(text, true, false);
  }

  function _scrollToBottom() {
    requestAnimationFrame(() => {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  /* ── 打字指示器 ── */
  function _showTyping() {
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'msg-wrapper bot typing-indicator-msg';
    wrapperDiv.id = 'typing-indicator';

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'msg-avatar';
    avatarDiv.setAttribute('aria-hidden', 'true');
    avatarDiv.textContent = '🔧';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'msg-content';

    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.setAttribute('aria-label', I18N.getLang() === 'en' ? 'Typing' : '正在輸入');

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span');
      typingDiv.appendChild(dot);
    }

    contentDiv.appendChild(typingDiv);
    wrapperDiv.appendChild(avatarDiv);
    wrapperDiv.appendChild(contentDiv);

    messagesEl.appendChild(wrapperDiv);
    _scrollToBottom();
  }

  function _hideTyping() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
  }

  /* ── 選項按鈕管理 ── */
  function _removeActiveButtons() {
    const group = document.getElementById('active-button-group');
    if (group) group.remove();
    activeButtons = [];
  }

  function _addButtonGroup(buttons) {
    _removeActiveButtons();

    const groupDiv = document.createElement('div');
    groupDiv.className = 'button-group';
    groupDiv.id = 'active-button-group';

    buttons.forEach(btn => {
      const btnEl = document.createElement('button');
      btnEl.className = `quick-reply-btn ${btn.className || ''}`;
      btnEl.dataset.action = btn.action;

      if (btn.data) {
        btnEl.dataset.extra = JSON.stringify(btn.data);
      }

      const iconSpan = document.createElement('span');
      iconSpan.setAttribute('aria-hidden', 'true');
      iconSpan.textContent = btn.icon;

      const labelText = document.createTextNode(` ${btn.label}`);

      btnEl.appendChild(iconSpan);
      btnEl.appendChild(labelText);

      btnEl.addEventListener('click', () => _handleButtonClick(btn.action, btn.data, btn.label));
      groupDiv.appendChild(btnEl);
      activeButtons.push(btnEl);
    });

    messagesEl.appendChild(groupDiv);
    _scrollToBottom();
  }

  /* ── 主選單按鈕 ── */
  function _showMainButtons() {
    _addButtonGroup([
      { label: _B().TEACH, icon: '📚', action: 'teach' },
      { label: _B().SETTING, icon: '⚙️', action: 'setting' },
      { label: _B().REPORT, icon: '🔧', action: 'report', className: 'btn-highlight' }
    ]);
  }

  /* ── 按鈕點擊處理 ── */
  function _handleButtonClick(action, data, label) {
    if (label) addUserMessage(label);

    switch (action) {
      case 'teach':
        _handleTeachFlow();
        break;
      case 'teach_win':
        _handleTeachDoc('win');
        break;
      case 'teach_mac':
        _handleTeachDoc('mac');
        break;
      case 'back-to-main':
        _showMainButtons();
        break;
      case 'need-help':
        _handleReportFlow();
        break;
      case 'setting':
        _handleSettingFlow();
        break;
      case 'report':
        _handleReportFlow();
        break;
      case 'confirm_intent':
        if (data && data.intent) {
          _handleConfirmedIntent(data.intent);
        }
        break;
      case 'copy_teams_account':
        Teams.copyAccountName();
        break;
      default:
        _showMainButtons();
    }
  }

  /* ── 流程處理 ── */
  function _handleTeachFlow() {
    addBotMessage(_R().TEACH_CHOOSE);
    _addButtonGroup([
      { label: _B().TEACH_WIN, icon: '💻', action: 'teach_win' },
      { label: _B().TEACH_MAC, icon: '🍎', action: 'teach_mac' },
      { label: _B().BACK_MAIN, icon: '↩️', action: 'back-to-main' }
    ]);
  }

  function _handleTeachDoc(sys) {
    const isWin = sys === 'win';
    const rawTemplate = isWin ? _R().TEACH_WINDOWS : _R().TEACH_MAC;
    const url = isWin ? CONFIG.DOCS.WINDOWS : CONFIG.DOCS.MAC;
    const text = rawTemplate.replace('{WINDOWS_URL}', url).replace('{MAC_URL}', url);

    addBotMessage(text);
    _addButtonGroup([
      { label: _B().NEED_HELP, icon: '🔧', action: 'need-help', className: 'btn-highlight' },
      { label: _B().BACK_MAIN, icon: '↩️', action: 'back-to-main' }
    ]);
  }

  function _handleSettingFlow() {
    const items = _R().SETTING_ITEMS;
    let text = `${_R().SETTING_HEADER}\n\n`;
    text += `${items.ACCOUNT}\n\n`;
    text += `${items.ADAPTER}\n\n`;
    text += `${items.WIFI_SIGNAL}\n\n`;
    text += `${items.AC_BILLING}`;

    addBotMessage(text);
    _addButtonGroup([
      { label: _B().NEED_HELP, icon: '🔧', action: 'need-help', className: 'btn-highlight' },
      { label: _B().BACK_MAIN, icon: '↩️', action: 'back-to-main' }
    ]);
  }

  function _handleSettingSubtopic(topic) {
    const items = _R().SETTING_ITEMS;
    let text = `${_R().SETTING_HEADER}\n\n`;
    switch (topic) {
      case 'ACCOUNT':
        text += items.ACCOUNT;
        break;
      case 'ADAPTER':
        text += items.ADAPTER;
        break;
      case 'WIFI_SIGNAL':
        text += items.WIFI_SIGNAL;
        break;
      case 'AC_BILLING':
        text += items.AC_BILLING;
        break;
      default:
        text += `${items.ACCOUNT}\n\n${items.ADAPTER}\n\n${items.WIFI_SIGNAL}\n\n${items.AC_BILLING}`;
    }

    addBotMessage(text);
    _addButtonGroup([
      { label: _B().NEED_HELP, icon: '🔧', action: 'need-help', className: 'btn-highlight' },
      { label: _B().BACK_MAIN, icon: '↩️', action: 'back-to-main' }
    ]);
  }

  function _handleReportFlow() {
    addBotMessage(_R().REPORT_TRIGGER);
    _addButtonGroup([
      { label: _B().OPEN_REPORT, icon: '📝', action: 'open_modal', className: 'btn-highlight' },
      { label: _B().BACK_MAIN, icon: '↩️', action: 'back-to-main' }
    ]);

    const modalBtn = document.querySelector('[data-action="open_modal"]');
    if (modalBtn) {
      modalBtn.addEventListener('click', () => {
        _removeActiveButtons();
        ReportForm.open();
      });
    }
  }

  function _handleConfirmedIntent(intent) {
    switch (intent) {
      case 'BUTTON_TEACH':
        _handleTeachFlow();
        break;
      case 'BUTTON_SETTING':
        _handleSettingFlow();
        break;
      case 'BUTTON_REPORT':
      case 'STICKER_PORT':
        _handleReportFlow();
        break;
      default:
        _showMainButtons();
    }
  }

  function _handleTeamsClick() {
    addBotMessage(_R().TEAMS_FALLBACK);

    _addButtonGroup([
      { label: _B().TEAMS_COPY, icon: '📋', action: 'copy_teams_account', className: 'btn-highlight' },
      { label: _B().BACK_MAIN, icon: '↩️', action: 'back-to-main' }
    ]);

    Teams.open();
  }

  /* ── 訊息發送與 LLM 意圖判讀 ── */
  async function _handleTextInput() {
    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';
    addUserMessage(text);
    _removeActiveButtons();
    _showTyping();

    try {
      const result = await Intent.classify(text);
      _hideTyping();

      if (result.isSystemError) {
        addBotMessage(_R().SYSTEM_ERROR);
        _showMainButtons();
        return;
      }

      if (result.needsConfirmation && result.intent !== 'UNKNOWN') {
        const label = _L()[result.intent] || result.intent;
        const confirmMsg = _R().CONFIRM_HINT.replace('{INTENT_LABEL}', label);
        addBotMessage(confirmMsg);

        const yesLabel = `${_B().CONFIRM_YES_PREFIX} ${label}`;
        _addButtonGroup([
          { label: yesLabel, icon: '✅', action: 'confirm_intent', data: { intent: result.intent }, className: 'btn-highlight' },
          { label: _B().TEACH, icon: '📚', action: 'teach' },
          { label: _B().SETTING, icon: '⚙️', action: 'setting' },
          { label: _B().REPORT, icon: '🔧', action: 'report' }
        ]);
        return;
      }

      switch (result.intent) {
        case 'BUTTON_TEACH':
          _handleTeachFlow();
          break;
        case 'BUTTON_SETTING':
          if (result.topic && result.topic !== 'ALL') {
            _handleSettingSubtopic(result.topic);
          } else {
            _handleSettingFlow();
          }
          break;
        case 'BUTTON_REPORT':
        case 'STICKER_PORT':
          _handleReportFlow();
          break;
        case 'NON_NETWORK':
          addBotMessage(_R().NON_NETWORK);
          _showMainButtons();
          break;
        case 'UNKNOWN':
        default:
          addBotMessage(_R().UNKNOWN);
          _showMainButtons();
          break;
      }
    } catch (e) {
      _hideTyping();
      console.error('Text input handler error:', e);
      addBotMessage(_R().SYSTEM_ERROR);
      _showMainButtons();
    }
  }

  /* ── 事件綁定 ── */
  function _bindEvents() {
    sendBtn.addEventListener('click', _handleTextInput);

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        _handleTextInput();
      }
    });

    inputEl.addEventListener('input', () => {
      inputEl.style.height = 'auto';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    });

    const teamsBtn = document.getElementById('teams-header-btn');
    if (teamsBtn) {
      teamsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        _handleTeamsClick();
      });
    }
  }

  /* ── 初始化 ── */
  function init() {
    getClientId();
    if (CONFIG.GAS_URL && CONFIG.GAS_URL !== 'YOUR_GAS_WEB_APP_URL_HERE') {
      _fetchToken();
    }
    addBotMessage(_R().WELCOME);
    _showMainButtons();
    _bindEvents();
  }

  return {
    init,
    addBotMessage,
    addUserMessage,
    getToken,
    refreshToken,
    getClientId
  };
})();

document.addEventListener('DOMContentLoaded', () => Chat.init());

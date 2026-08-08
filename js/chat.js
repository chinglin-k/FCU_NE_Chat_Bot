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
  let currentMenuState = 'main'; // 'main', 'teach', 'setting', 'report', 'teams'
  let isWaitingForResponse = false;

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
  function addMessage(text, isUser = false, isHtml = false, i18nMarkdownKey = null) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (i18nMarkdownKey) {
      contentDiv.setAttribute('data-i18n-markdown', i18nMarkdownKey);
      contentDiv.innerHTML = _parseMarkdown(I18N.t(i18nMarkdownKey));
    } else if (isHtml) {
      contentDiv.innerHTML = text;
    } else if (isUser) {
      contentDiv.textContent = text;
    } else {
      contentDiv.innerHTML = _parseMarkdown(text);
    }

    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    const now = new Date();
    timeSpan.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    msgDiv.appendChild(contentDiv);
    msgDiv.appendChild(timeSpan);
    messagesEl.appendChild(msgDiv);
    _scrollToBottom();
  }

  function addBotMessage(text, isHtml = false, i18nMarkdownKey = null) {
    addMessage(text, false, isHtml, i18nMarkdownKey);
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
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator-msg';
    typingDiv.id = 'typing-indicator';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'typing-dots';
    dotsDiv.setAttribute('aria-label', I18N.t('typing.aria'));
    dotsDiv.innerHTML = '<span></span><span></span><span></span>';

    contentDiv.appendChild(dotsDiv);
    typingDiv.appendChild(contentDiv);
    messagesEl.appendChild(typingDiv);
    _scrollToBottom();
  }

  function _hideTyping() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) indicator.remove();
  }

  /* ── 按鈕群組 ── */
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
        Object.keys(btn.data).forEach(k => {
          btnEl.dataset[k] = btn.data[k];
        });
      }

      if (btn.icon) {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'btn-icon';
        iconSpan.setAttribute('aria-hidden', 'true');
        iconSpan.textContent = btn.icon;
        btnEl.appendChild(iconSpan);
        btnEl.appendChild(document.createTextNode(' ' + btn.label));
      } else {
        btnEl.textContent = btn.label;
      }

      btnEl.addEventListener('click', () => _handleButtonClick(btn, groupDiv));
      groupDiv.appendChild(btnEl);
      activeButtons.push(btnEl);
    });

    messagesEl.appendChild(groupDiv);
    _scrollToBottom();
  }

  function _removeActiveButtons() {
    const group = document.getElementById('active-button-group');
    if (group) group.remove();
    activeButtons = [];
  }

  /* ── 主選單按鈕 ── */
  function _showMainButtons() {
    currentMenuState = 'main';
    _addButtonGroup([
      { label: _B().TEACH, icon: '📚', action: 'teach' },
      { label: _B().SETTING, icon: '⚙️', action: 'setting' },
      { label: _B().REPORT, icon: '🔧', action: 'report', className: 'btn-highlight' }
    ]);
  }

  /* ── 按鈕點擊處理 ── */
  function _handleButtonClick(btn, groupDiv) {
    if (isWaitingForResponse) return;
    _removeActiveButtons();
    addUserMessage(btn.label);

    switch (btn.action) {
      case 'teach':
        _handleTeachFlow();
        break;
      case 'setting':
        _handleSettingFlow();
        break;
      case 'setting_subtopic':
        _handleSettingSubtopic(btn.data ? btn.data.topic : 'ALL');
        break;
      case 'report':
        _handleReportFlow();
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
      case 'confirm_intent':
        _handleConfirmedIntent(btn.data ? btn.data.intent : '');
        break;
      case 'teams-fallback':
        _handleTeamsClick();
        break;
      default:
        _showMainButtons();
    }
  }

  /* ── 流程處理 ── */
  function _handleTeachFlow() {
    currentMenuState = 'teach';
    addBotMessage(_R().TEACH_CHOOSE);
    _addButtonGroup([
      { label: _B().TEACH_WIN, icon: '💻', action: 'teach_win' },
      { label: _B().TEACH_MAC, icon: '🍎', action: 'teach_mac' },
      { label: _B().BACK_MAIN, icon: '↩️', action: 'back-to-main' }
    ]);
  }

  function _handleTeachDoc(sys) {
    currentMenuState = 'sub_action';
    const isWin = sys === 'win';
    const rawTemplate = isWin ? _R().TEACH_WINDOWS : _R().TEACH_MAC;
    const url = isWin ? CONFIG.DOCS.WINDOWS : CONFIG.DOCS.MAC;
    const text = rawTemplate.replace(isWin ? '{WINDOWS_URL}' : '{MAC_URL}', url);

    addBotMessage(text);
    _addButtonGroup([
      { label: _B().NEED_HELP, icon: '🔧', action: 'need-help', className: 'btn-highlight' },
      { label: _B().BACK_MAIN, icon: '↩️', action: 'back-to-main' }
    ]);
  }

  function _handleSettingFlow() {
    currentMenuState = 'sub_action';
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
    currentMenuState = 'sub_action';
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
    currentMenuState = 'report';
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
    currentMenuState = 'teams';
    addBotMessage(_R().TEAMS_FALLBACK);

    _addButtonGroup([
      { label: _B().TEAMS_COPY, icon: '📋', action: 'copy_teams_account', className: 'btn-highlight' },
      { label: _B().BACK_MAIN, icon: '↩️', action: 'back-to-main' }
    ]);

    const copyBtn = document.querySelector('[data-action="copy_teams_account"]');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        Teams.copyAccountName();
        addBotMessage(_R().TEAMS_COPY_SUCCESS);
      });
    }
  }

  /* ── 處理使用者自由輸入 ── */
  async function _handleTextInput() {
    const text = inputEl.value.trim();
    if (!text || isWaitingForResponse) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';
    _removeActiveButtons();
    addUserMessage(text);

    isWaitingForResponse = true;
    _showTyping();

    try {
      const result = await Intent.classify(text);
      _hideTyping();
      isWaitingForResponse = false;

      if (result.isSystemError) {
        addBotMessage(_R().SYSTEM_ERROR);
        _showMainButtons();
        return;
      }

      if (result.needsConfirmation && result.intent !== 'UNKNOWN') {
        const label = _L()[result.intent] || result.intent;
        const hintText = _R().CONFIRM_HINT.replace('{INTENT_LABEL}', label);
        addBotMessage(hintText);

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
          _handleSettingSubtopic(result.topic || 'ALL');
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
      }

    } catch (err) {
      console.error('Text input error:', err);
      _hideTyping();
      isWaitingForResponse = false;
      addBotMessage(_R().SYSTEM_ERROR);
      _showMainButtons();
    }
  }

  /* ── 事件監聽 ── */
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
      inputEl.style.height = `${Math.min(inputEl.scrollHeight, 120)}px`;
    });

    const teamsBtn = document.getElementById('teams-header-btn');
    if (teamsBtn) {
      teamsBtn.addEventListener('click', () => {
        Teams.open();
      });
    }

    // 語言變更時，重繪 activeButtons
    document.addEventListener('i18n:changed', () => {
      const group = document.getElementById('active-button-group');
      if (group && activeButtons.length > 0) {
        if (currentMenuState === 'main') {
          _showMainButtons();
        } else if (currentMenuState === 'teach') {
          _addButtonGroup([
            { label: _B().TEACH_WIN, icon: '💻', action: 'teach_win' },
            { label: _B().TEACH_MAC, icon: '🍎', action: 'teach_mac' },
            { label: _B().BACK_MAIN, icon: '↩️', action: 'back-to-main' }
          ]);
        } else if (currentMenuState === 'report') {
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
        } else if (currentMenuState === 'sub_action') {
          _addButtonGroup([
            { label: _B().NEED_HELP, icon: '🔧', action: 'need-help', className: 'btn-highlight' },
            { label: _B().BACK_MAIN, icon: '↩️', action: 'back-to-main' }
          ]);
        }
      }
    });
  }

  /* ── 初始化 ── */
  function init() {
    getClientId();
    if (CONFIG.GAS_URL && CONFIG.GAS_URL !== 'YOUR_GAS_WEB_APP_URL_HERE') {
      _fetchToken();
    }
    // 歡迎訊息使用 data-i18n-markdown="welcome" 支援即時語言切換
    addBotMessage('', false, 'welcome');
    _showMainButtons();
    _bindEvents();
  }

  return {
    init,
    addBotMessage,
    addUserMessage,
    getToken,
    getClientId,
    refreshToken
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  Chat.init();
});

/* ============================================================
   chat.js — 主對話邏輯控制器
   ── 管理對話流程、訊息渲染、按鈕互動、意圖分類串接
   ============================================================ */
'use strict';

/* exported Chat */
const Chat = (() => {

  /* ── DOM 參照 ── */
  const messagesEl = () => document.getElementById('chat-messages');
  const inputEl    = () => document.getElementById('chat-input');
  const sendBtnEl  = () => document.getElementById('send-btn');

  /* ── 打字指示器 DOM ── */
  let typingEl = null;

  /* ── 當前 session 的按鈕群組（用於停用） ── */
  let activeButtons = [];

  /* ── 並發控制旗標（防止按鈕重複點擊或訊息重複送出） ── */
  let _isProcessing = false;

  /* ══════════════════════════════════════
     一次性 Token 與 ClientID 管理
  ══════════════════════════════════════ */
  let _token = null;

  let _clientId = localStorage.getItem('fcu_chat_client_id');
  if (!_clientId) {
    _clientId = 'C_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('fcu_chat_client_id', _clientId);
  }
  function getClientId() { return _clientId; }

  /** 取得目前語言的回應字典（縮寫存取） */
  function _R() { return CONFIG.RESPONSES[I18N.getLang()]; }
  function _B() { return CONFIG.BUTTON_LABELS[I18N.getLang()]; }


  /** 向 GAS 取得新 Token，存入記憶體 */
  async function _fetchToken() {
    try {
      const res = await fetch(`${CONFIG.GAS_URL}?action=get_token`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && data.token) {
        _token = data.token;
        console.log('[Chat][Token] 取得新 token 成功');
      } else {
        console.warn('[Chat][Token] 取得 token 失敗:', data.error);
      }
    } catch (e) {
      console.warn('[Chat][Token] 網路錯誤，無法取得 token:', e);
    }
  }

  /** 供 intent.js / report.js 呼叫：取得目前 token */
  function getToken() { return _token; }

  /** 供 intent.js / report.js 呼叫：重取 token（INVALID_TOKEN 時使用） */
  async function refreshToken() { await _fetchToken(); return _token; }

  /* ══════════════════════════════════════
     Markdown 簡易渲染器
     支援：**bold**、[text](url)、換行
  ══════════════════════════════════════ */
  function _renderMarkdown(text) {
    return text
      // 粗體
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // 斜體
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      // 連結（僅允許 https:// 或 http:// 協議，防止 javascript: 等惡意連結）
      .replace(/\[(.+?)\]\((.+?)\)/g, (_, label, url) => {
        const safeUrl = /^https?:\/\//i.test(url) ? url : '#';
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
      })
      // 換行
      .replace(/\n/g, '<br>');
  }

  /* ══════════════════════════════════════
     訊息渲染
  ══════════════════════════════════════ */

  // ⚠️ 安全性警告：此函式使用 _renderMarkdown 而非 _escapeHTML，
  // 前提假設是傳入的 text 永遠來自 CONFIG.RESPONSES 等內部常數。
  // 禁止將使用者輸入或任何外部 API（含 Gemini）回傳內容直接傳入此函式，
  // 否則會產生 XSS 漏洞。如需顯示使用者輸入或外部內容，請改用會呼叫
  // _escapeHTML 的訊息渲染路徑。
  //
  // ⚠️ SECURITY WARNING: This function uses _renderMarkdown instead of _escapeHTML.
  // It assumes the input `text` always comes from internal constants like CONFIG.RESPONSES.
  // Do NOT pass user input or any external API response (including Gemini) directly to this
  // function, as it will create an XSS vulnerability. Use the _escapeHTML rendering path
  // instead for any user-supplied or externally-sourced content.
  /** 新增 Bot 訊息泡泡 */
  function addBotMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'msg-wrapper bot';
    wrapper.innerHTML = `
      <div class="msg-avatar" aria-hidden="true">🤖</div>
      <div class="msg-content">
        <div class="msg-bubble">${_renderMarkdown(text)}</div>
      </div>`;
    _append(wrapper);
    return wrapper;
  }

  /** 新增 User 訊息泡泡 */
  function addUserMessage(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'msg-wrapper user';
    wrapper.innerHTML = `
      <div class="msg-avatar" aria-hidden="true">🎓</div>
      <div class="msg-content">
        <div class="msg-bubble">${_escapeHTML(text)}</div>
      </div>`;
    _append(wrapper);
    return wrapper;
  }

  /** 新增快速回覆按鈕群組 */
  function _addButtonGroup(buttons) {
    // 停用先前未被點擊的按鈕
    _disableActiveButtons();

    const group = document.createElement('div');
    group.className = 'btn-group';

    buttons.forEach(({ id, icon, label, action, primary = false }) => {
      const btn = document.createElement('button');
      btn.id        = id;
      btn.className = `quick-btn${primary ? ' primary' : ''}`;
      btn.setAttribute('data-action', action);

      // 安全組合 icon + label：用 DOM 操作避免 innerHTML XSS
      const iconSpan = document.createElement('span');
      iconSpan.setAttribute('aria-hidden', 'true');
      iconSpan.textContent = icon;          // textContent 自動轉義
      btn.appendChild(iconSpan);
      btn.appendChild(document.createTextNode('\u00a0' + label)); // \u00a0 = &nbsp;

      btn.addEventListener('click', () => _handleButtonClick(action, label, btn));
      group.appendChild(btn);
      activeButtons.push(btn);
    });

    _append(group);
    return group;
  }

  /** DOM 輔助：附加並捲動至底部 */
  function _append(el) {
    const container = messagesEl();
    if (!container) return;
    container.appendChild(el);
    _scrollToBottom();
  }

  /** 捲動到底部 */
  function _scrollToBottom() {
    const el = messagesEl();
    if (el) el.scrollTop = el.scrollHeight;
  }

  /** 停用所有當前 active 的按鈕 */
  function _disableActiveButtons() {
    activeButtons.forEach(btn => { btn.disabled = true; });
    activeButtons = [];
  }

  /** HTML 轉義（避免 XSS）— 涵蓋 &、<、>、"、' 五種字元 */
  function _escapeHTML(str) {
    return str
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g,  '&#39;');
  }

  /* ══════════════════════════════════════
     打字指示器
  ══════════════════════════════════════ */

  function _showTyping() {
    if (typingEl) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'msg-wrapper bot';
    wrapper.id = 'typing-wrapper';
    wrapper.innerHTML = `
      <div class="msg-avatar" aria-hidden="true">🤖</div>
      <div class="msg-content">
        <div class="typing-indicator" aria-label="正在輸入" data-i18n-aria-label="typing.aria">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>`;
    typingEl = wrapper;
    _append(wrapper);
  }

  function _hideTyping() {
    if (typingEl) {
      typingEl.remove();
      typingEl = null;
    }
  }

  /** 模擬思考延遲 */
  function _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /* ══════════════════════
     常見問題 FAQ 顯示輔助函式
     每個項目各自顯示為一個獨立對話框
  ══════════════════════ */

  /**
   * 顯示常見問題 FAQ 卡片
   * @param {string} [topic='ALL'] - 子主題代碼
   *   'ALL' ｜不存在的 key → 顯示全部 4 則
   *   'ACCOUNT'|'ADAPTER'|'WIFI_SIGNAL'|'AC_BILLING' → 只顯示對應那一則
   */
  async function _showSettingFAQ(topic = 'ALL') {
    addBotMessage(_R().SETTING_HEADER);
    const items = _R().SETTING_ITEMS;

    // 若 topic 指定了存在的單一子項目 key，只顯示那一則
    const isSingleTopic = (topic !== 'ALL') && Object.prototype.hasOwnProperty.call(items, topic);
    const keys = isSingleTopic ? [topic] : Object.keys(items);

    for (const key of keys) {
      _showTyping();
      await _delay(400);
      _hideTyping();
      addBotMessage(items[key]);
    }
  }

  /* ══════════════════════
     按鈕互動處理
  ══════════════════════ */

  async function _handleButtonClick(action, label, clickedBtn) {
    // 「開啟報修表單」特殊處理：只靜默重開 Modal，不停用按鈕群組，不顯示使用者訊息
    if (action === 'open-report') {
      ReportForm.open();
      return;
    }

    // 「開啟查詢視窗」特殊處理：只靜默重開 Modal，不停用按鈕群組，不顯示使用者訊息
    if (action === 'open-query') {
      QueryCase.open();
      return;
    }

    // 防止並發：處理中時忽略新的點擊
    if (_isProcessing) return;
    _isProcessing = true;

    // 標記被點擊的按鈕為視覺反饋
    clickedBtn.disabled = true;
    _disableActiveButtons();

    // 顯示使用者點了什麼
    addUserMessage(label);

    try {
      switch (action) {
        case 'teach':
          _showTyping();
          await _delay(600);
          _hideTyping();
          addBotMessage(_R().TEACH_CHOOSE);
          _addButtonGroup([
            { id: 'btn-teach-win',  icon: '🪟', label: `${_B().TEACH_WIN}`,  action: 'teach-windows' },
            { id: 'btn-teach-mac',  icon: '🍎', label: _B().TEACH_MAC,         action: 'teach-mac'    },
            { id: 'btn-teach-wifi', icon: '📡', label: _B().TEACH_WIFI,        action: 'teach-wifi'   }
          ]);
          break;

        case 'setting':
          _showTyping();
          await _delay(700);
          _hideTyping();
          await _showSettingFAQ();
          _addButtonGroup([
            { id: 'btn-need-help-setting', icon: '🆘', label: _B().NEED_HELP,        action: 'need-help'   },
            { id: 'btn-back-main-setting', icon: '🏠', label: _B().BACK_MAIN, action: 'back-to-main' }
          ]);
          break;

        case 'report':
        case 'need-help':
          _showTyping();
          await _delay(500);
          _hideTyping();
          addBotMessage(_R().REPORT_TRIGGER);
          ReportForm.open();
          _addButtonGroup([
            { id: 'btn-open-report',      icon: '📝', label: _B().OPEN_REPORT, action: 'open-report'   },
            { id: 'btn-back-main-report', icon: '🏠', label: _B().BACK_MAIN,  action: 'back-to-main' }
          ]);
          break;

        // 'open-report' 已在函式開頭提早處理，此處不應到達

        case 'teach-windows': {
          _showTyping();
          await _delay(800);
          _hideTyping();
          const msgWin = _R().TEACH_WINDOWS
            .replace('{WINDOWS_URL}', CONFIG.DOCS.WINDOWS);
          addBotMessage(msgWin);
          _addButtonGroup([
            { id: 'btn-need-help-win', icon: '🆘', label: _B().NEED_HELP,        action: 'need-help'   },
            { id: 'btn-back-main-win', icon: '🏠', label: _B().BACK_MAIN, action: 'back-to-main' }
          ]);
          break;
        }

        case 'teach-mac': {
          _showTyping();
          await _delay(800);
          _hideTyping();
          const msgMac = _R().TEACH_MAC
            .replace('{MAC_URL}', CONFIG.DOCS.MAC);
          addBotMessage(msgMac);
          _addButtonGroup([
            { id: 'btn-need-help-mac', icon: '🆘', label: _B().NEED_HELP,        action: 'need-help'   },
            { id: 'btn-back-main-mac', icon: '🏠', label: _B().BACK_MAIN, action: 'back-to-main' }
          ]);
          break;
        }

        case 'teach-wifi': {
          _showTyping();
          await _delay(800);
          _hideTyping();
          addBotMessage(_R().TEACH_WIFI);
          WifiModal.open();
          _addButtonGroup([
            { id: 'btn-need-help-wifi', icon: '🆘', label: _B().NEED_HELP,   action: 'need-help'   },
            { id: 'btn-back-main-wifi', icon: '🏠', label: _B().BACK_MAIN,  action: 'back-to-main' }
          ]);
          break;
        }

        case 'back-to-main':
          _showTyping();
          await _delay(400);
          _hideTyping();
          addBotMessage(_R().BACK_TO_MAIN);
          _showMainButtons();
          break;

        case 'query':
          _showTyping();
          await _delay(500);
          _hideTyping();
          addBotMessage(_R().QUERY_PROMPT);
          QueryCase.open();
          _addButtonGroup([
            { id: 'btn-open-query',      icon: '🔍', label: _B().QUERY,     action: 'open-query'   },
            { id: 'btn-back-main-query', icon: '🏠', label: _B().BACK_MAIN, action: 'back-to-main' }
          ]);
          break;
      }
    } finally {
      _isProcessing = false;
    }
  }

  /* ══════════════════════════════════════
     主選單按鈕
  ══════════════════════════════════════ */

  function _showMainButtons() {
    _addButtonGroup([
      { id: 'btn-teach',   icon: '📚', label: _B().TEACH,   action: 'teach'   },
      { id: 'btn-setting', icon: '⚙️', label: _B().SETTING, action: 'setting' },
      { id: 'btn-query',   icon: '🔍', label: _B().QUERY,   action: 'query' },
      { id: 'btn-report',  icon: '🔧', label: _B().REPORT,  action: 'report',  primary: true }
    ]);
  }

  /* ══════════════════════════════════════
     文字輸入處理（意圖分類）
  ══════════════════════════════════════ */

  async function _handleTextInput(message) {
    message = message.trim();
    if (!message) return;

    // 防止並發：處理中時忽略新的送出
    if (_isProcessing) return;
    _isProcessing = true;

    // 清空輸入框
    const el = inputEl();
    if (el) { el.value = ''; el.style.height = 'auto'; }

    addUserMessage(message);

    try {
      // GAS 未設定時
      if (CONFIG.GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
        _showTyping();
        await _delay(500);
        _hideTyping();
        addBotMessage(_R().GAS_NOT_CONFIGURED);
        _showMainButtons();
        return;
      }

      // 顯示打字中
      _showTyping();

      // classify() 現在回傳 { intent, confidence, needsConfirmation, isSystemError, topic }
      let intentResult;
      try {
        intentResult = await Intent.classify(message);
      } catch (e) {
        // Intent.classify() 本身不應拋出（已有內部 try/catch），
        // 此處作最後一道保護，標記為系統錯誤
        console.error('[Chat][系統錯誤] Intent.classify() 拋出未預期例外：', e);
        intentResult = { intent: Intent.INTENTS.UNKNOWN, confidence: 0, needsConfirmation: false, isSystemError: true };
      }

      _hideTyping();
      await _delay(200);

      const { INTENTS } = Intent;
      const { intent, needsConfirmation } = intentResult;

      // ── 低信心：顯示確認提示 ──
      if (needsConfirmation && intent !== INTENTS.UNKNOWN) {
        const label    = CONFIG.INTENT_LABELS[I18N.getLang()][intent] || '未知';
        const hintText = _R().CONFIRM_HINT.replace('{INTENT_LABEL}', label);
        addBotMessage(hintText);
        // 顯示推薦按鈕（依判斷到的意圖）+ 主選單三顆按鈕讓使用者自行選擇
        _addButtonGroup([
          { id: 'btn-confirm-intent', icon: '✅', label: `${_B().CONFIRM_YES_PREFIX} ${label}`, action: _intentToAction(intent), primary: true },
          { id: 'btn-confirm-teach',   icon: '📚', label: _B().TEACH,                               action: 'teach'   },
          { id: 'btn-confirm-setting', icon: '⚙️', label: _B().SETTING,                                 action: 'setting' },
          { id: 'btn-confirm-report',  icon: '🔧', label: _B().REPORT, action: 'report'  }
        ]);
        return;
      }

      switch (intent) {
        case INTENTS.BUTTON_TEACH:
          addBotMessage(_R().TEACH_CHOOSE);
          _addButtonGroup([
            { id: 'btn-teach-win-txt',  icon: '🪟', label: `${_B().TEACH_WIN}`, action: 'teach-windows' },
            { id: 'btn-teach-mac-txt',  icon: '🍎', label: _B().TEACH_MAC,         action: 'teach-mac'    },
            { id: 'btn-teach-wifi-txt', icon: '📡', label: _B().TEACH_WIFI,        action: 'teach-wifi'   }
          ]);
          break;

        case INTENTS.BUTTON_SETTING: {
          const topic = intentResult.topic || 'ALL';
          await _showSettingFAQ(topic);
          // 如果只顯示單一子項目，額外加一顆「查看所有常見問題」按鈕
          const isSingleTopic = (topic !== 'ALL') &&
            Object.prototype.hasOwnProperty.call(_R().SETTING_ITEMS, topic);
          const buttons = [
            { id: 'btn-need-help-txt', icon: '🆘', label: _B().NEED_HELP, action: 'need-help' }
          ];
          if (isSingleTopic) {
            buttons.push({ id: 'btn-view-all-setting', icon: '📋', label: _B().VIEW_ALL_FAQ, action: 'setting' });
          }
          buttons.push({ id: 'btn-back-main-setting-txt', icon: '🏠', label: _B().BACK_MAIN, action: 'back-to-main' });
          _addButtonGroup(buttons);
          break;
        }

        case INTENTS.BUTTON_REPORT:
        case INTENTS.STICKER_PORT:
          addBotMessage(_R().REPORT_TRIGGER);
          ReportForm.open();
          _addButtonGroup([
            { id: 'btn-open-report-txt',      icon: '📝', label: _B().OPEN_REPORT, action: 'open-report'   },
            { id: 'btn-back-main-report-txt', icon: '🏠', label: _B().BACK_MAIN,  action: 'back-to-main' }
          ]);
          break;

        case INTENTS.BUTTON_QUERY:
          addBotMessage(_R().QUERY_PROMPT);
          QueryCase.open();
          _addButtonGroup([
            { id: 'btn-open-query-txt',      icon: '🔍', label: _B().QUERY,     action: 'open-query'   },
            { id: 'btn-back-main-query-txt', icon: '🏠', label: _B().BACK_MAIN, action: 'back-to-main' }
          ]);
          break;

        case INTENTS.NON_NETWORK:
          addBotMessage(_R().NON_NETWORK);
          _addButtonGroup([
            { id: 'btn-back-main-txt', icon: '🏠', label: _B().BACK_MAIN, action: 'back-to-main' }
          ]);
          break;

        default: { // UNKNOWN
          if (intentResult.isSystemError) {
            // B. 系統/API 問題：逾時、HTTP 錯誤、GAS 回傳失敗等
            console.warn('[Chat][系統錯誤] 顯示 SYSTEM_ERROR fallback');
            addBotMessage(_R().SYSTEM_ERROR);
          } else {
            // A. 理解失敗：意圖辨識信心值過低或無法比對
            console.log('[Chat][理解失敗] 顯示 UNKNOWN fallback');
            addBotMessage(_R().UNKNOWN);
          }
          _showMainButtons();
          break;
        }
      }
    } finally {
      _isProcessing = false;
    }
  }

  /**
   * 意圖代碼 → 按鈕 action 字串（供低信心確認按鈕使用）
   * @param {string} intent
   * @returns {string}
   */
  function _intentToAction(intent) {
    const map = {
      BUTTON_TEACH:   'teach',
      BUTTON_SETTING: 'setting',
      BUTTON_REPORT:  'report',
      BUTTON_QUERY:   'query',
      STICKER_PORT:   'report',
      NON_NETWORK:    'back-to-main'
    };
    return map[intent] || 'back-to-main';
  }

  /* ══════════════════════════════════════
     公開 API：報修成功回呼
  ══════════════════════════════════════ */

  function onReportSuccess() {
    const wrapper = document.createElement('div');
    wrapper.className = 'msg-wrapper bot success';
    wrapper.innerHTML = `
      <div class="msg-avatar" aria-hidden="true">✅</div>
      <div class="msg-content">
        <div class="msg-bubble">${_renderMarkdown(_R().REPORT_SUCCESS)}</div>
      </div>`;
    _append(wrapper);
    _showMainButtons();
  }

  /* ══════════════════════════════════════
     初始化
  ══════════════════════════════════════ */

  function init() {

    document.addEventListener('i18n:changed', () => {
      // 語言切換時，停用先前的按鈕並重新印出歡迎訊息與主選單
      _disableActiveButtons();
      addBotMessage(_R().WELCOME);
      _showMainButtons();
    });
    /* 取得一次性 Token（供後續 classify / report 使用）*/
    if (CONFIG.GAS_URL !== 'YOUR_GAS_WEB_APP_URL_HERE') {
      _fetchToken();
    }

    /* 歡迎訊息 + 主選單 */
    addBotMessage(_R().WELCOME);
    _showMainButtons();

    /* 計數器 */
    Counter.init();

    /* 報修表單 */
    ReportForm.init();

    /* 查詢案件 */
    QueryCase.init();

    /* 送出按鈕 */
    sendBtnEl()?.addEventListener('click', () => {
      const msg = inputEl()?.value || '';
      _handleTextInput(msg);
    });

    /* Enter 送出（Shift+Enter 換行） */
    inputEl()?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const msg = inputEl()?.value || '';
        _handleTextInput(msg);
      }
    });

    /* 自動調整 textarea 高度 */
    inputEl()?.addEventListener('input', (e) => {
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    });

    /* Teams Header 常駐連結 */
    document.getElementById('teams-header-btn')?.addEventListener('click', () => {
      _handleTeamsClick();
    });
  }

  /**
   * Teams Header 連結點擊處理
   *  1. 在聊天區顯示備援步驟說明 + 一鍵複製按鈕
   *  2. 呼叫 Teams.open() 嘗試開啟深連結
   */
  async function _handleTeamsClick() {
    // 防止並發處理中重複點擊
    if (_isProcessing) return;
    _isProcessing = true;

    try {
      _showTyping();
      await _delay(400);
      _hideTyping();

      // 顯示備援說明
      addBotMessage(_R().TEAMS_FALLBACK);

      // 顯示一鍵複製按鈕（特殊 DOM 設計，不用 _addButtonGroup）
      const copyGroup = document.createElement('div');
      copyGroup.className = 'btn-group';
      const copyBtn = document.createElement('button');
      copyBtn.id        = 'teams-copy-btn';
      copyBtn.className = 'quick-btn teams-copy-btn';
      copyBtn.innerHTML = `<span aria-hidden="true">📋</span> ${_B().TEAMS_COPY}`;
      copyBtn.addEventListener('click', () => Teams.copyAccountName(copyBtn));
      copyGroup.appendChild(copyBtn);
      _append(copyGroup);
      activeButtons.push(copyBtn);

      // 嘗試開啟 Teams
      Teams.open();
    } finally {
      _isProcessing = false;
    }
  }

  return { init, addBotMessage, addUserMessage, onReportSuccess, getToken, refreshToken, getClientId };
})();

/* ── 啟動 ── */
document.addEventListener('DOMContentLoaded', () => Chat.init());

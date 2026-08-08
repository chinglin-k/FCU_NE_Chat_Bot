/* ============================================================
   chat.js — 主對話邏輯控制器
   ── 管理對話流程、訊息渲染、按鈕互動、意圖分類串接
   ============================================================ */
'use strict';

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
     一次性 Token 管理
     Token 存在記憶體變數（不存 localStorage/sessionStorage）
     頁面重整後會重取，是可接受的行為
  ══════════════════════════════════════ */
  let _token = null;

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
     Client ID 管理（依使用者區分頻率限制用）
     與上方的一次性 Token 不同：Token 每次請求後即失效、故意不落地儲存；
     Client ID 則需要「跨頁面重整仍保持穩定」才能讓後端的每使用者限流生效，
     否則使用者只要重新整理頁面就能無限繞過限制，因此改存在 localStorage。

     ⚠️ 這不是身分驗證，僅是一組隨機亂數，前端可被使用者自行清除或偽造；
        後端仍會搭配「全域上限」作為第二層防護，兩者合併使用。
        內容不含任何個資，也未回傳給第三方。
  ══════════════════════════════════════ */
  const CLIENT_ID_STORAGE_KEY = 'fcu_client_id';

  function _generateUuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    // 舊瀏覽器 fallback（不需要密碼學等級亂數，僅作限流用途的識別碼）
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function _getOrCreateClientId() {
    try {
      let id = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
      if (!id) {
        id = _generateUuid();
        window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, id);
      }
      return id;
    } catch (e) {
      // localStorage 被封鎖（無痕模式等）：退回單次 session 用的隨機值
      console.warn('[Chat][ClientId] localStorage 無法使用，改用單次 session 識別碼:', e);
      return _generateUuid();
    }
  }

  const _clientId = _getOrCreateClientId();

  /** 供 intent.js / report.js 呼叫：取得裝置識別碼（供後端依使用者區分限流） */
  function getClientId() { return _clientId; }

  /* ══════════════════════════════════════
     Markdown 簡易渲染器
     支援：**bold**、[text](url)、換行
  ══════════════════════════════════════ */
  function _renderMarkdown(text) {
    return text
      // 粗體
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
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
        <div class="typing-indicator" aria-label="正在輸入">
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
    addBotMessage(CONFIG.RESPONSES.SETTING_HEADER);
    const items = CONFIG.RESPONSES.SETTING_ITEMS;

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
          addBotMessage(CONFIG.RESPONSES.TEACH_CHOOSE);
          _addButtonGroup([
            { id: 'btn-teach-win', icon: '🪟', label: 'Windows 系統 / Windows', action: 'teach-windows' },
            { id: 'btn-teach-mac', icon: '🍎', label: 'Mac 系統 / Mac',         action: 'teach-mac'    }
          ]);
          break;

        case 'setting':
          _showTyping();
          await _delay(700);
          _hideTyping();
          await _showSettingFAQ();
          _addButtonGroup([
            { id: 'btn-need-help-setting', icon: '🆘', label: '我需要協助 / I Need Help',        action: 'need-help'   },
            { id: 'btn-back-main-setting', icon: '🏠', label: '回到主選單 / Back to Main Menu', action: 'back-to-main' }
          ]);
          break;

        case 'report':
        case 'need-help':
          _showTyping();
          await _delay(500);
          _hideTyping();
          addBotMessage(CONFIG.RESPONSES.REPORT_TRIGGER);
          ReportForm.open();
          _addButtonGroup([
            { id: 'btn-open-report',      icon: '📝', label: '開啟報修表單 / Open Repair Form', action: 'open-report'   },
            { id: 'btn-back-main-report', icon: '🏠', label: '回到主選單 / Back to Main Menu',  action: 'back-to-main' }
          ]);
          break;

        // 'open-report' 已在函式開頭提早處理，此處不應到達

        case 'teach-windows': {
          _showTyping();
          await _delay(800);
          _hideTyping();
          const msgWin = CONFIG.RESPONSES.TEACH_WINDOWS
            .replace('{WINDOWS_URL}', CONFIG.DOCS.WINDOWS);
          addBotMessage(msgWin);
          _addButtonGroup([
            { id: 'btn-need-help-win', icon: '🆘', label: '我需要協助 / I Need Help',        action: 'need-help'   },
            { id: 'btn-back-main-win', icon: '🏠', label: '回到主選單 / Back to Main Menu', action: 'back-to-main' }
          ]);
          break;
        }

        case 'teach-mac': {
          _showTyping();
          await _delay(800);
          _hideTyping();
          const msgMac = CONFIG.RESPONSES.TEACH_MAC
            .replace('{MAC_URL}', CONFIG.DOCS.MAC);
          addBotMessage(msgMac);
          _addButtonGroup([
            { id: 'btn-need-help-mac', icon: '🆘', label: '我需要協助 / I Need Help',        action: 'need-help'   },
            { id: 'btn-back-main-mac', icon: '🏠', label: '回到主選單 / Back to Main Menu', action: 'back-to-main' }
          ]);
          break;
        }

        case 'back-to-main':
          _showTyping();
          await _delay(400);
          _hideTyping();
          addBotMessage('還有其他問題嗎？請選擇：\n*Any other questions? Please choose:*');
          _showMainButtons();
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
      { id: 'btn-teach',   icon: '📚', label: '教學 / Tutorials',                              action: 'teach'   },
      { id: 'btn-setting', icon: '⚙️', label: '常見問題 / FAQ',                                action: 'setting' },
      { id: 'btn-report',  icon: '🔧', label: '我要實體協助、報修 / Request On-site Help', action: 'report',  primary: true }
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
        addBotMessage(CONFIG.RESPONSES.GAS_NOT_CONFIGURED);
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
        const label    = CONFIG.INTENT_LABELS[intent] || '未知';
        const hintText = CONFIG.RESPONSES.CONFIRM_HINT.replace('{INTENT_LABEL}', label);
        addBotMessage(hintText);
        // 顯示推薦按鈕（依判斷到的意圖）+ 主選單三顆按鈕讓使用者自行選擇
        _addButtonGroup([
          { id: 'btn-confirm-intent', icon: '✅', label: `是 / Yes — ${label}`, action: _intentToAction(intent), primary: true },
          { id: 'btn-confirm-teach',   icon: '📚', label: '教學 / Tutorials',                               action: 'teach'   },
          { id: 'btn-confirm-setting', icon: '⚙️', label: '常見問題 / FAQ',                                 action: 'setting' },
          { id: 'btn-confirm-report',  icon: '🔧', label: '我要實體協助、報修 / Request On-site Help', action: 'report'  }
        ]);
        return;
      }

      switch (intent) {
        case INTENTS.BUTTON_TEACH:
          addBotMessage(CONFIG.RESPONSES.TEACH_CHOOSE);
          _addButtonGroup([
            { id: 'btn-teach-win-txt', icon: '🪟', label: 'Windows 系統 / Windows', action: 'teach-windows' },
            { id: 'btn-teach-mac-txt', icon: '🍎', label: 'Mac 系統 / Mac',         action: 'teach-mac'    }
          ]);
          break;

        case INTENTS.BUTTON_SETTING: {
          const topic = intentResult.topic || 'ALL';
          await _showSettingFAQ(topic);
          // 如果只顯示單一子項目，額外加一顆「查看所有常見問題」按鈕
          const isSingleTopic = (topic !== 'ALL') &&
            Object.prototype.hasOwnProperty.call(CONFIG.RESPONSES.SETTING_ITEMS, topic);
          const buttons = [
            { id: 'btn-need-help-txt', icon: '🆘', label: '我需要協助 / I Need Help', action: 'need-help' }
          ];
          if (isSingleTopic) {
            buttons.push({ id: 'btn-view-all-setting', icon: '📋', label: '查看所有常見問題 / View All FAQs', action: 'setting' });
          }
          buttons.push({ id: 'btn-back-main-setting-txt', icon: '🏠', label: '回到主選單 / Back to Main Menu', action: 'back-to-main' });
          _addButtonGroup(buttons);
          break;
        }

        case INTENTS.BUTTON_REPORT:
        case INTENTS.STICKER_PORT:
          addBotMessage(CONFIG.RESPONSES.REPORT_TRIGGER);
          ReportForm.open();
          _addButtonGroup([
            { id: 'btn-open-report-txt',      icon: '📝', label: '開啟報修表單 / Open Repair Form', action: 'open-report'   },
            { id: 'btn-back-main-report-txt', icon: '🏠', label: '回到主選單 / Back to Main Menu',  action: 'back-to-main' }
          ]);
          break;

        case INTENTS.NON_NETWORK:
          addBotMessage(CONFIG.RESPONSES.NON_NETWORK);
          _addButtonGroup([
            { id: 'btn-back-main-txt', icon: '🏠', label: '回到主選單 / Back to Main Menu', action: 'back-to-main' }
          ]);
          break;

        default: { // UNKNOWN
          if (intentResult.isSystemError) {
            // B. 系統/API 問題：逾時、HTTP 錯誤、GAS 回傳失敗等
            console.warn('[Chat][系統錯誤] 顯示 SYSTEM_ERROR fallback');
            addBotMessage(CONFIG.RESPONSES.SYSTEM_ERROR);
          } else {
            // A. 理解失敗：意圖辨識信心值過低或無法比對
            console.log('[Chat][理解失敗] 顯示 UNKNOWN fallback');
            addBotMessage(CONFIG.RESPONSES.UNKNOWN);
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
        <div class="msg-bubble">${_renderMarkdown(CONFIG.RESPONSES.REPORT_SUCCESS)}</div>
      </div>`;
    _append(wrapper);
    _showMainButtons();
  }

  /* ══════════════════════════════════════
     初始化
  ══════════════════════════════════════ */

  function init() {
    /* 取得一次性 Token（供後續 classify / report 使用）*/
    if (CONFIG.GAS_URL !== 'YOUR_GAS_WEB_APP_URL_HERE') {
      _fetchToken();
    }

    /* 歡迎訊息 + 主選單 */
    addBotMessage(CONFIG.RESPONSES.WELCOME);
    _showMainButtons();

    /* 計數器 */
    Counter.init();

    /* 報修表單 */
    ReportForm.init();

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
      addBotMessage(CONFIG.RESPONSES.TEAMS_FALLBACK);

      // 顯示一鍵複製按鈕（特殊 DOM 設計，不用 _addButtonGroup）
      const copyGroup = document.createElement('div');
      copyGroup.className = 'btn-group';
      const copyBtn = document.createElement('button');
      copyBtn.id        = 'teams-copy-btn';
      copyBtn.className = 'quick-btn teams-copy-btn';
      copyBtn.innerHTML = '<span aria-hidden="true">📋</span> 複製「福星宿舍網路報修平台」/ Copy Account Name';
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

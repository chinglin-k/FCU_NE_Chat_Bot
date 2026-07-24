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
      btn.innerHTML = `<span aria-hidden="true">${icon}</span> ${label}`;
      btn.setAttribute('data-action', action);
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

  /** HTML 轉義（避免 XSS） */
  function _escapeHTML(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
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

  async function _showSettingFAQ() {
    addBotMessage(CONFIG.RESPONSES.SETTING_HEADER);
    for (const item of CONFIG.RESPONSES.SETTING_ITEMS) {
      _showTyping();
      await _delay(400);
      _hideTyping();
      addBotMessage(item);
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
            { id: 'btn-teach-win', icon: '🪟', label: 'Windows 系統', action: 'teach-windows' },
            { id: 'btn-teach-mac', icon: '🍎', label: 'Mac 系統',     action: 'teach-mac'    }
          ]);
          break;

        case 'setting':
          _showTyping();
          await _delay(700);
          _hideTyping();
          await _showSettingFAQ();
          _addButtonGroup([
            { id: 'btn-need-help-setting', icon: '🆘', label: '我需要協助', action: 'need-help' },
            { id: 'btn-back-main-setting', icon: '🏠', label: '回到主選單', action: 'back-to-main' }
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
            { id: 'btn-open-report',      icon: '📝', label: '開啟報修表單', action: 'open-report' },
            { id: 'btn-back-main-report', icon: '🏠', label: '回到主選單', action: 'back-to-main' }
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
            { id: 'btn-need-help-win', icon: '🆘', label: '我需要協助', action: 'need-help' },
            { id: 'btn-back-main-win', icon: '🏠', label: '回到主選單', action: 'back-to-main' }
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
            { id: 'btn-need-help-mac', icon: '🆘', label: '我需要協助', action: 'need-help' },
            { id: 'btn-back-main-mac', icon: '🏠', label: '回到主選單', action: 'back-to-main' }
          ]);
          break;
        }

        case 'back-to-main':
          _showTyping();
          await _delay(400);
          _hideTyping();
          addBotMessage('還有其他問題嗎？請選擇：');
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
      { id: 'btn-teach',   icon: '📚', label: '教學',                              action: 'teach'   },
      { id: 'btn-setting', icon: '⚙️', label: '常見問題',                           action: 'setting' },
      { id: 'btn-report',  icon: '🔧', label: '我要實體協助、報修', action: 'report',  primary: true }
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

      let intent;
      try {
        intent = await Intent.classify(message);
      } catch (e) {
        intent = Intent.INTENTS.UNKNOWN;
      }

      _hideTyping();
      await _delay(200);

      const { INTENTS } = Intent;

      switch (intent) {
        case INTENTS.BUTTON_TEACH:
          addBotMessage(CONFIG.RESPONSES.TEACH_CHOOSE);
          _addButtonGroup([
            { id: 'btn-teach-win-txt', icon: '🪟', label: 'Windows 系統', action: 'teach-windows' },
            { id: 'btn-teach-mac-txt', icon: '🍎', label: 'Mac 系統',     action: 'teach-mac'    }
          ]);
          break;

        case INTENTS.BUTTON_SETTING:
          await _showSettingFAQ();
          _addButtonGroup([
            { id: 'btn-need-help-txt', icon: '🆘', label: '我需要協助', action: 'need-help' }
          ]);
          break;

        case INTENTS.BUTTON_REPORT:
        case INTENTS.STICKER_PORT:
          addBotMessage(CONFIG.RESPONSES.REPORT_TRIGGER);
          ReportForm.open();
          break;

        case INTENTS.NON_NETWORK:
          addBotMessage(CONFIG.RESPONSES.NON_NETWORK);
          _addButtonGroup([
            { id: 'btn-back-main-txt', icon: '🏠', label: '回到主選單', action: 'back-to-main' }
          ]);
          break;

        default: // UNKNOWN
          addBotMessage(CONFIG.RESPONSES.UNKNOWN);
          _showMainButtons();
          break;
      }
    } finally {
      _isProcessing = false;
    }
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
  }

  return { init, addBotMessage, addUserMessage, onReportSuccess };
})();

/* ── 啟動 ── */
document.addEventListener('DOMContentLoaded', () => Chat.init());

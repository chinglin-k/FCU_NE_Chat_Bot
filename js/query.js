/* ============================================================
   query.js — 報修案件查詢模組
   ── 學生輸入學號＋報修時填寫的手機末 4 碼查詢自己的報修案件狀態
   ── 透過 GAS 後端 queryReport() 查詢試算表資料
   ============================================================ */
/* exported QueryCase */
'use strict';

const QueryCase = (() => {
  /* ── DOM 元素 ── */
  const modal     = document.getElementById('query-modal');
  const form      = document.getElementById('query-form');
  const closeBtn  = document.getElementById('query-modal-close-btn');
  const cancelBtn = document.getElementById('query-cancel-btn');
  const submitBtn = document.getElementById('query-submit-btn');
  const errorMsg  = document.getElementById('query-error-msg');
  const inputEl   = document.getElementById('query-student-id');
  const phoneEl   = document.getElementById('query-phone-last4');

  function _R() { return CONFIG.RESPONSES[I18N.getLang()]; }

  /* ── 開啟 / 關閉 Modal ── */
  function open() {
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    _resetForm();
    if (inputEl) inputEl.focus();
  }

  function close() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  function _resetForm() {
    form.reset();
    _hideError();
    _setLoading(false);
  }

  function _showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.removeAttribute('hidden');
  }

  function _hideError() {
    errorMsg.textContent = '';
    errorMsg.setAttribute('hidden', '');
  }

  function _setLoading(loading) {
    const btnText    = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    if (loading) {
      submitBtn.disabled = true;
      if (btnText)    btnText.hidden = true;
      if (btnLoading) btnLoading.hidden = false;
    } else {
      submitBtn.disabled = false;
      if (btnText)    btnText.hidden = false;
      if (btnLoading) btnLoading.hidden = true;
    }
  }

  /* ── 驗證 ── */
  function _validate() {
    const sid = (inputEl.value || '').trim();
    const V = _R().VALIDATION;
    // BUG-12 修正：分拆「空學號」與「格式錯誤」兩種情況，
    // 使前端訊息與後端 GAS queryReport() 回傳的錯誤訊息語意一致。
    if (!sid) {
      return V.QUERY_STUDENT_ID_REQUIRED;
    }
    if (!/^[a-zA-Z][0-9]{7}$/.test(sid)) {
      return V.QUERY_STUDENT_ID_FORMAT;
    }
    // SEC-QUERY-01：須同時提供報修時填寫的手機末 4 碼，避免他人僅憑學號查詢案件
    const last4 = (phoneEl.value || '').trim();
    if (!last4) {
      return V.QUERY_PHONE_LAST4_REQUIRED;
    }
    if (!/^[0-9]{4}$/.test(last4)) {
      return V.QUERY_PHONE_LAST4_FORMAT;
    }
    return null;
  }

  /**
   * 將案件狀態轉換為帶 emoji 的可讀文字
   * @param {object} c - 案件物件 {dispatched, completed}
   * @returns {string}
   */
  function _statusText(c) {
    const lang = I18N.getLang();
    if (c.completed && c.completed.trim()) {
      return lang === 'zh' ? '✅ 已完成' : '✅ Completed';
    }
    if (c.dispatched && c.dispatched.trim()) {
      return lang === 'zh' ? '🔧 已派人處理' : '🔧 Dispatched';
    }
    return lang === 'zh' ? '⏳ 待處理' : '⏳ Pending';
  }

  /**
   * HTML 轉義輔助（防止試算表欄位觸發 XSS）
   * ⚠️ BUG-13 修正：試算表中的欄位值由使用者在報修表單填寫，
   * 屬使用者可控資料（user-controlled data）。若直接插入字串後
   * 傳給 addBotMessage()（內部走 _renderMarkdown，不做 HTML 轉義），
   * 惡意輸入（如 <script>、javascript: URL）可造成 XSS。
   * 修正方式：所有試算表欄位值在嵌入 template string 前先做 HTML 轉義。
   * ⚠️ SEC-QUERY-02：另需轉義 Markdown 語法字元（[ ] ( ) * _），否則描述欄
   * 填入「[點我](https://釣魚網站)」會被 _renderMarkdown 轉成可點擊連結，
   * 偽裝成機器人訊息誘導點擊。轉為 HTML entity 後 Markdown 正則不再匹配，
   * 瀏覽器仍顯示原字元。
   * @param {string} str
   * @returns {string}
   */
  function _esc(str) {
    return String(str || '')
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g,  '&#39;')
      .replace(/\[/g, '&#91;')
      .replace(/\]/g, '&#93;')
      .replace(/\(/g, '&#40;')
      .replace(/\)/g, '&#41;')
      .replace(/\*/g, '&#42;')
      .replace(/_/g,  '&#95;');
  }

  /**
   * 將查詢結果渲染為聊天訊息
   * @param {Array} cases - 案件陣列
   */
  function _renderResults(cases) {
    Chat.addBotMessage(_R().QUERY_RESULT_HEADER);

    const lang = I18N.getLang();
    cases.forEach((c, idx) => {
      // BUG-13：所有欄位值先做 HTML 轉義，防止試算表資料觸發 XSS
      const date        = _esc(c.date);
      const time        = _esc(c.time);
      const room        = _esc(c.room);
      const bed         = _esc(c.bed);
      const description = _esc(c.description);
      const note        = _esc(c.note);
      const status      = _statusText(c); // emoji 狀態由內部邏輯產生，安全

      const lines = [];

      if (lang === 'zh') {
        lines.push(`**案件 #${idx + 1}**`);
        lines.push(`📅 日期：${date} ${time}`);
        lines.push(`🏠 房號：${room} ／床號：${bed}`);
        lines.push(`📝 問題：${description}`);
        lines.push(`📊 狀態：${status}`);
        if (note && note.trim()) {
          lines.push(`💬 備註：${note}`);
        }
      } else {
        lines.push(`**Case #${idx + 1}**`);
        lines.push(`📅 Date: ${date} ${time}`);
        lines.push(`🏠 Room: ${room} / Bed: ${bed}`);
        lines.push(`📝 Issue: ${description}`);
        lines.push(`📊 Status: ${status}`);
        if (note && note.trim()) {
          lines.push(`💬 Note: ${note}`);
        }
      }

      Chat.addBotMessage(lines.join('\n'));
    });
  }

  /* ── 送出查詢至 GAS ── */
  async function _submitQuery() {
    if (!CONFIG.GAS_URL || CONFIG.GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
      Chat.addBotMessage(_R().GAS_NOT_CONFIGURED);
      close();
      return;
    }

    _setLoading(true);
    _hideError();

    const sid   = (inputEl.value || '').trim().toUpperCase();
    const last4 = (phoneEl.value || '').trim();

    try {
      // reCAPTCHA v3：與報修表單相同機制，後端驗證 action 必須為 query_report
      let recaptchaToken = '';
      if (typeof grecaptcha !== 'undefined' && CONFIG.RECAPTCHA_SITE_KEY) {
        recaptchaToken = await new Promise((resolve) => {
          grecaptcha.ready(() => {
            grecaptcha.execute(CONFIG.RECAPTCHA_SITE_KEY, { action: 'query_report' })
              .then(resolve)
              .catch((err) => {
                console.warn('reCAPTCHA execution error:', err);
                resolve('');
              });
          });
        });
      }

      let token = Chat.getToken();
      if (!token) {
        token = await Chat.refreshToken();
      }

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 15000);

      const payloadData = {
        action:         'query',
        studentId:      sid,
        phoneLast4:     last4,
        token:          token,
        clientId:       Chat.getClientId(),
        recaptchaToken: recaptchaToken
      };

      let response = await fetch(CONFIG.GAS_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body:    JSON.stringify(payloadData),
        signal:  controller.signal
      });

      clearTimeout(timeoutId);
      let data = await response.json();

      // Token 失效：自動重取後重試一次
      if (data.error === 'INVALID_TOKEN') {
        const newToken = await Chat.refreshToken();
        if (newToken) {
          payloadData.token = newToken;
          const retryController = new AbortController();
          const retryTimeoutId  = setTimeout(() => retryController.abort(), 15000);
          try {
            response = await fetch(CONFIG.GAS_URL, {
              method:  'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body:    JSON.stringify(payloadData),
              signal:  retryController.signal
            });
            data = await response.json();
          } finally {
            clearTimeout(retryTimeoutId);
          }
        }
      }

      // 頻率限制或其他錯誤
      const _isInternalCode = (err) => typeof err === 'string' && /^[A-Z_]+$/.test(err);
      const _friendlyError  = (err) => {
        if (!_isInternalCode(err)) return err || _R().QUERY_ERROR;
        if (err === 'RATE_LIMITED') return _R().SYSTEM_ERROR;
        if (err.startsWith('VALIDATION_')) {
          const key = err.replace('VALIDATION_', '');
          if (_R().VALIDATION[key]) return _R().VALIDATION[key];
        }
        return _R().QUERY_ERROR;
      };

      if (!data.success) {
        _showError(_friendlyError(data.error));
        _setLoading(false);
        return;
      }

      // 查詢成功：關閉 Modal，在聊天區渲染結果
      close();

      if (!data.cases || data.cases.length === 0) {
        Chat.addBotMessage(_R().QUERY_NO_RESULT);
      } else {
        _renderResults(data.cases);
      }

      // 查詢完成後：顯示返回主選單和報修按鈕
      Chat.onQuerySuccess();

    } catch (err) {
      console.error('[QueryCase] 查詢錯誤:', err);
      _showError(_R().QUERY_ERROR);
      _setLoading(false);
    }
  }

  /* ── 事件綁定 ── */
  function _bindEvents() {
    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hasAttribute('hidden')) {
        close();
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // 防止雙擊重複送出
      if (submitBtn.disabled) return;

      const err = _validate();
      if (err) {
        _showError(err);
        return;
      }

      _submitQuery();
    });
  }

  function init() {
    _bindEvents();
  }

  return { init, open, close };
})();

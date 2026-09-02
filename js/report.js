/* ============================================================
   report.js — 報修表單處理模組
   ============================================================ */
/* exported ReportForm */
'use strict';

const ReportForm = (() => {
  /* ── DOM 元素 ── */
  const modal = document.getElementById('report-modal');
  const form = document.getElementById('report-form');
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('form-cancel-btn');
  const submitBtn = document.getElementById('form-submit-btn');
  const errorMsg = document.getElementById('form-error-msg');

  function _R() { return CONFIG.RESPONSES[I18N.getLang()]; }

  /* ── 開啟 / 關閉 ── */
  function open() {
    modal.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
    _resetForm();
    const firstInput = form.querySelector('input');
    if (firstInput) firstInput.focus();
  }

  function close() {
    modal.setAttribute('hidden', '');
    document.body.style.overflow = '';
  }

  function _resetForm() {
    form.reset();
    _hideError();
    _setLoading(false);

    const hStart = document.getElementById('field-repair-hour-start');
    const mStart = document.getElementById('field-repair-min-start');
    const hEnd = document.getElementById('field-repair-hour-end');
    const mEnd = document.getElementById('field-repair-min-end');

    if (hStart) hStart.value = '';
    if (mStart) mStart.value = '';
    if (hEnd) hEnd.value = '';
    if (mEnd) mEnd.value = '';
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
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');

    if (loading) {
      submitBtn.disabled = true;
      if (btnText) btnText.hidden = true;
      if (btnLoading) btnLoading.hidden = false;
    } else {
      submitBtn.disabled = false;
      if (btnText) btnText.hidden = false;
      if (btnLoading) btnLoading.hidden = true;
    }
  }

  /* ── 驗證 ── */
  function _validate() {
    const name = form.name.value.trim();
    const studentId = form.studentId.value.trim();
    const room = form.roomNumber.value.trim();
    const bed = form.bedNumber.value.trim();
    const phone = form.phone.value.trim();
    const hStart = document.getElementById('field-repair-hour-start').value.trim();
    const mStart = document.getElementById('field-repair-min-start').value.trim();
    const hEnd = document.getElementById('field-repair-hour-end').value.trim();
    const mEnd = document.getElementById('field-repair-min-end').value.trim();
    const description = form.description.value.trim();

    const V = _R().VALIDATION;

    if (!name) return V.NAME_REQUIRED;
    if (!studentId || !/^[a-zA-Z][0-9]{7}$/.test(studentId)) return V.STUDENT_ID_FORMAT;
    if (!room) return V.ROOM_REQUIRED;
    // 房號格式：前綴 H、I、G、FA~FF，後接 1~4 位數字，可選一個 "-"
    if (!/^(H|I|G|F[ABCDEF])[0-9]{1,4}(-[0-9]+)?$/i.test(room)) return V.ROOM_FORMAT;
    if (!bed || !/^[0-9]$/.test(bed)) return V.BED_FORMAT;
    if (!phone || !/^[0-9]{10}$/.test(phone)) return V.PHONE_FORMAT;

    const hs = parseInt(hStart, 10);
    const ms = parseInt(mStart, 10);
    const he = parseInt(hEnd, 10);
    const me = parseInt(mEnd, 10);

    if (isNaN(hs) || hs < 0 || hs > 23 || isNaN(ms) || ms < 0 || ms > 59 ||
        isNaN(he) || he < 0 || he > 23 || isNaN(me) || me < 0 || me > 59) {
      return V.REPAIR_TIME_RANGE;
    }

    if (!description) return V.DESCRIPTION_REQUIRED;

    return null;
  }

  /* ── 送出至 GAS ── */
  async function _submitToGAS(data) {
    if (!CONFIG.GAS_URL || CONFIG.GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
      Chat.addBotMessage(_R().GAS_NOT_CONFIGURED);
      close();
      return;
    }

    _setLoading(true);
    _hideError();

    try {
      let recaptchaToken = '';
      if (typeof grecaptcha !== 'undefined' && CONFIG.RECAPTCHA_SITE_KEY) {
        recaptchaToken = await new Promise((resolve) => {
          grecaptcha.ready(() => {
            grecaptcha.execute(CONFIG.RECAPTCHA_SITE_KEY, { action: 'submit_report' })
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
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const payloadData = {
        action: 'report',
        payload: data,
        token: token,
        clientId: Chat.getClientId(),
        recaptchaToken: recaptchaToken
      };

      const response = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payloadData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const resData = await response.json();

      // ── 判斷後端回傳的 error 是否為「內部代碼」（如 INVALID_TOKEN、
      //    INTERNAL_ERROR、RECAPTCHA_FAILED 等全大寫底線格式），
      //    這類代碼不是給使用者看的句子，一律改顯示通用錯誤訊息；
      //    其餘則是後端已組好的中文驗證訊息（如「手機號碼格式錯誤...」），
      //    可直接顯示給使用者。
      const _isInternalCode = (err) => typeof err === 'string' && /^[A-Z_]+$/.test(err);
      const _friendlyError  = (err) => {
        if (!_isInternalCode(err)) return err || _R().REPORT_ERROR;
        if (err === 'RATE_LIMITED') return _R().SYSTEM_ERROR;
        if (err.startsWith('VALIDATION_')) {
          const key = err.replace('VALIDATION_', '');
          if (_R().VALIDATION[key]) return _R().VALIDATION[key];
        }
        return _R().REPORT_ERROR;
      };

      if (resData.error === 'INVALID_TOKEN') {
        const newToken = await Chat.refreshToken();
        if (newToken) {
          payloadData.token = newToken;
          const retryController = new AbortController();
          const retryTimeoutId = setTimeout(() => retryController.abort(), 30000);
          try {
            const retryRes = await fetch(CONFIG.GAS_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify(payloadData),
              signal: retryController.signal
            });
            const retryData = await retryRes.json();
            if (retryData.success) {
              _handleSuccess();
              return;
            }
            // ⚠️ 修正（v1.3.1 / BUG-04）：重試後仍失敗時，不得把內部代碼
            // （如 'INVALID_TOKEN'）原樣顯示給使用者。
            _showError(_friendlyError(retryData.error));
            _setLoading(false);
            return;
          } finally {
            clearTimeout(retryTimeoutId);
          }
        }
        // 沒有新 token 可用：顯示通用錯誤，不暴露內部錯誤碼
        _showError(_R().REPORT_ERROR);
        _setLoading(false);
        return;
      }

      if (resData.success) {
        _handleSuccess();
      } else {
        // ⚠️ 修正（v1.3.1 / BUG-04）：僅在 error 不是內部代碼時才直接顯示，
        // 避免把 'INTERNAL_ERROR' 等代碼原樣呈現在使用者介面。
        _showError(_friendlyError(resData.error));
        _setLoading(false);
      }

    } catch (err) {
      console.error('Report submission error:', err);
      _showError(_R().REPORT_ERROR);
      _setLoading(false);
    }
  }

  function _handleSuccess() {
    _setLoading(false);
    
    // 清除表單輸入內容
    _resetForm();

    // 立刻關閉 Modal
    close();

    // 呼叫 chat.js 提供的方法來渲染成功訊息與主按鈕
    if (typeof Chat.onReportSuccess === 'function') {
      Chat.onReportSuccess();
    } else {
      Chat.addBotMessage(_R().REPORT_SUCCESS);
    }
  }

  /* ── 事件綁定 ── */
  function _bindEvents() {
    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);

    /* ── 房號即時轉大寫（保留光標位置） ── */
    const roomInput = document.getElementById('field-room');
    if (roomInput) {
      roomInput.addEventListener('input', () => {
        const pos = roomInput.selectionStart;
        roomInput.value = roomInput.value.toUpperCase();
        roomInput.setSelectionRange(pos, pos);
      });
    }

    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hasAttribute('hidden')) {
        close();
      }
    });

    /* ── 填入現在時間快捷按鈕（開始 / 結束） ── */
    function _applyNowTime(hEl, mEl, btn) {
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      if (hEl) hEl.value = String(h);
      if (mEl) mEl.value = String(m).padStart(2, '0');
      const orig = btn.innerHTML;
      btn.innerHTML = `✅ ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      btn.style.borderColor = 'var(--color-success)';
      btn.style.color = 'var(--color-success)';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.borderColor = '';
        btn.style.color = '';
      }, 2000);
    }

    const fillStartBtn = document.getElementById('btn-fill-now-start');
    if (fillStartBtn) {
      fillStartBtn.addEventListener('click', () => {
        _applyNowTime(
          document.getElementById('field-repair-hour-start'),
          document.getElementById('field-repair-min-start'),
          fillStartBtn
        );
      });
    }

    const fillEndBtn = document.getElementById('btn-fill-now-end');
    if (fillEndBtn) {
      fillEndBtn.addEventListener('click', () => {
        _applyNowTime(
          document.getElementById('field-repair-hour-end'),
          document.getElementById('field-repair-min-end'),
          fillEndBtn
        );
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // 防止雙擊重複送出
      if (submitBtn.disabled) return;

      const err = _validate();
      if (err) {
        _showError(err);
        return;
      }

      const hStart = document.getElementById('field-repair-hour-start').value.trim();
      const mStart = document.getElementById('field-repair-min-start').value.trim();
      const hEnd = document.getElementById('field-repair-hour-end').value.trim();
      const mEnd = document.getElementById('field-repair-min-end').value.trim();

      const timeStr = `${String(hStart).padStart(2, '0')}:${String(mStart).padStart(2, '0')} - ${String(hEnd).padStart(2, '0')}:${String(mEnd).padStart(2, '0')}`;

      const data = {
        name: form.name.value.trim(),
        studentId: form.studentId.value.trim().toUpperCase(),
        roomNumber: form.roomNumber.value.trim().toUpperCase(),
        bedNumber: form.bedNumber.value.trim(),
        phone: form.phone.value.trim(),
        repairTime: timeStr,
        description: form.description.value.trim()
      };

      _submitToGAS(data);
    });
  }

  function init() {
    _bindEvents();
  }

  return { init, open, close };
})();

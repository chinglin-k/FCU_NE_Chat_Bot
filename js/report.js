/* ============================================================
   report.js — 報修表單處理模組
   ============================================================ */
'use strict';

const ReportForm = (() => {
  /* ── DOM 元素 ── */
  const modal = document.getElementById('report-modal');
  const form = document.getElementById('report-form');
  const closeBtn = document.getElementById('modal-close-btn');
  const cancelBtn = document.getElementById('form-cancel-btn');
  const submitBtn = document.getElementById('form-submit-btn');
  const errorMsg = document.getElementById('form-error-msg');
  const successView = document.getElementById('modal-success-view');

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
    form.removeAttribute('hidden');
    successView.classList.add('is-hidden');
    modal.classList.remove('has-success');
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
    if (!bed || !/^[0-9]{1,3}$/.test(bed)) return V.BED_FORMAT;
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

      if (resData.error === 'INVALID_TOKEN') {
        const newToken = await Chat.refreshToken();
        if (newToken) {
          payloadData.token = newToken;
          const retryRes = await fetch(CONFIG.GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payloadData)
          });
          const retryData = await retryRes.json();
          if (retryData.success) {
            _handleSuccess();
            return;
          }
        }
      }

      if (resData.success) {
        _handleSuccess();
      } else {
        _showError(resData.message || _R().REPORT_ERROR);
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
    form.setAttribute('hidden', '');
    successView.classList.remove('is-hidden');
    modal.classList.add('has-success');

    const progressBar = document.getElementById('success-progress-bar');
    if (progressBar) {
      progressBar.style.transition = 'none';
      progressBar.style.width = '0%';
      requestAnimationFrame(() => {
        progressBar.style.transition = 'width 2s linear';
        progressBar.style.width = '100%';
      });
    }

    setTimeout(() => {
      close();
      Chat.addBotMessage(_R().REPORT_SUCCESS);
    }, 2000);
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
        roomNumber: form.roomNumber.value.trim(),
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

document.addEventListener('DOMContentLoaded', () => {
  ReportForm.init();
});

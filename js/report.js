/* ============================================================
   report.js — 報修表單模組
   ── 開關 Modal、表單驗證、送出至 GAS、顯示結果
   ============================================================ */
'use strict';

const ReportForm = (() => {

  /* ── DOM 參照 ── */
  const modal       = () => document.getElementById('report-modal');
  const form        = () => document.getElementById('report-form');
  const submitBtn   = () => document.getElementById('form-submit-btn');
  const btnText     = () => submitBtn()?.querySelector('.btn-text');
  const btnLoading  = () => submitBtn()?.querySelector('.btn-loading');
  const errorMsg    = () => document.getElementById('form-error-msg');
  const successView = () => document.getElementById('modal-success-view');
  const progressBar = () => document.getElementById('success-progress-bar');

  /* ── 送出成功旗標（關閉時通知 Chat 顯示成功訊息）── */
  let _pendingSuccess = false;

  /* ── 必填欄位清單（欄位 name、DOM id、錯誤訊息）── */
  const REQUIRED_FIELDS = [
    { name: 'name',             id: 'field-name',             msg: '請填寫姓名 / Full name is required' },
    { name: 'studentId',        id: 'field-student-id',       msg: '請填寫學號 / Student ID is required' },
    { name: 'roomNumber',       id: 'field-room',             msg: '請填寫房號 / Room number is required' },
    { name: 'bedNumber',        id: 'field-bed',              msg: '請填寫床號 / Bed number is required' },
    { name: 'phone',            id: 'field-phone',            msg: '請填寫手機號碼 / Mobile number is required' },
    { name: 'repairHourStart',  id: 'field-repair-hour-start',msg: '請填寫可維修時間（開始）/ Start time is required' },
    { name: 'repairMinStart',   id: 'field-repair-min-start', msg: '請填寫可維修時間（開始分鐘）/ Start minute is required' },
    { name: 'repairHourEnd',    id: 'field-repair-hour-end',  msg: '請填寫可維修時間（結束）/ End time is required' },
    { name: 'repairMinEnd',     id: 'field-repair-min-end',   msg: '請填寫可維修時間（結束分鐘）/ End minute is required' },
    { name: 'description',      id: 'field-description',      msg: '請填寫問題描述 / Issue description is required' }
  ];

  /** 開啟 Modal */
  function open() {
    const m = modal();
    if (!m) return;
    if (!m.hidden) return; // 已開啟，不重複處理（修復 M-04）
    m.hidden = false;
    // 聚焦到第一個欄位
    setTimeout(() => {
      const first = m.querySelector('input');
      if (first) first.focus();
    }, 350);
    // 防止背景滾動
    document.body.style.overflow = 'hidden';
  }

  /** 關閉 Modal（若有 _pendingSuccess 則關閉後通知 Chat）*/
  function close() {
    const m = modal();
    if (!m) return;
    m.hidden = true;
    document.body.style.overflow = '';
    const shouldNotify = _pendingSuccess;
    _pendingSuccess = false;
    _resetForm();
    if (shouldNotify && window.Chat) Chat.onReportSuccess();
  }

  /** 重置表單狀態（含還原 success view 與 modal-header）*/
  function _resetForm() {
    form()?.reset();
    form()?.classList.remove('is-hidden');   // 還原表單可見
    document.querySelector('.modal-header')?.classList.remove('is-hidden'); // 還原 header 可見
    successView()?.classList.add('is-hidden'); // 確保 success view 隱藏
    _setLoading(false);
    _clearErrors();
  }

  /**
   * 送出成功後：在 Modal 內顯示成功畫面，2 秒後自動關閉
   * 同時播放進度條動畫提示剩餘時間
   */
  function _showModalSuccess() {
    _pendingSuccess = true;
    _setLoading(false);

    // 隱藏表單與標題列、顯示成功畫面
    form()?.classList.add('is-hidden');         // 隱藏表單
    document.querySelector('.modal-header')?.classList.add('is-hidden'); // 隱藏頂部 header 標題列
    successView()?.classList.remove('is-hidden'); // 顯示 success view

    // 播放進度條（CSS transition 從 100% 縮至 0%）
    const bar = progressBar();
    if (bar) {
      bar.style.transition = 'none';
      bar.style.width = '100%';
      // 強制 reflow 後啟動 transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bar.style.transition = 'width 2s linear';
          bar.style.width = '0%';
        });
      });
    }

    // 2 秒後自動關閉
    setTimeout(() => close(), 2000);
  }

  /** 切換送出按鈕 loading 狀態 */
  function _setLoading(isLoading) {
    const btn = submitBtn();
    if (!btn) return;
    btn.disabled = isLoading;
    const text    = btnText();
    const loading = btnLoading();
    if (text)    text.hidden    = isLoading;
    if (loading) loading.hidden = !isLoading;
  }

  /** 顯示錯誤訊息 */
  function _showError(msg) {
    const el = errorMsg();
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
  }

  /** 清除所有錯誤標記 */
  function _clearErrors() {
    const el = errorMsg();
    if (el) { el.hidden = true; el.textContent = ''; }
    document.querySelectorAll('.form-group input.error, .form-group textarea.error')
      .forEach(f => f.classList.remove('error'));
  }

  /**
   * 表單驗證（前端基本驗證：空値檢查 + 數字範圍檢查）
   * 使用 REQUIRED_FIELDS 統一管理欄位清單
   */
  function _validate(data) {
    const errors = REQUIRED_FIELDS
      .filter(({ name }) => !data[name]?.trim())
      .map(({ id, msg }) => ({ field: id, msg }));

    // 學號必須為 1 個英文字母 + 7 位數字（例如 D1234567）
    if (data.studentId && !/^[a-zA-Z][0-9]{7}$/.test(data.studentId.trim())) {
      errors.push({ field: 'field-student-id', msg: '學號格式錯誤（需為 1 位英文字母 + 7 位數字，如 D1234567） / Student ID must be 1 letter + 7 digits (e.g. D1234567)' });
    }

    // 床號必須為 1-3 位數字
    if (data.bedNumber && !/^[0-9]{1,3}$/.test(data.bedNumber.trim())) {
      errors.push({ field: 'field-bed', msg: '床號必須為 1−3 位數字 / Bed number must be 1–3 digits' });
    }

    // 手機號碼必須為 10 位數字
    if (data.phone && !/^[0-9]{10}$/.test(data.phone.trim())) {
      errors.push({ field: 'field-phone', msg: '手機號碼必須為 10 位數字 / Mobile number must be 10 digits' });
    }

    // 小時範圍驗證（0–23）
    const hStart = parseInt(data.repairHourStart, 10);
    const hEnd   = parseInt(data.repairHourEnd, 10);
    if (data.repairHourStart && (isNaN(hStart) || hStart < 0 || hStart > 23)) {
      errors.push({ field: 'field-repair-hour-start', msg: '小時必須在 0–23 之間 / Hour must be between 0 and 23' });
    }
    if (data.repairHourEnd && (isNaN(hEnd) || hEnd < 0 || hEnd > 23)) {
      errors.push({ field: 'field-repair-hour-end', msg: '小時必須在 0–23 之間 / Hour must be between 0 and 23' });
    }

    // 分鐘範圍驗證（0–59）
    const mStart = parseInt(data.repairMinStart, 10);
    const mEnd   = parseInt(data.repairMinEnd, 10);
    if (data.repairMinStart && (isNaN(mStart) || mStart < 0 || mStart > 59)) {
      errors.push({ field: 'field-repair-min-start', msg: '分鐘必須在 0–59 之間 / Minute must be between 0 and 59' });
    }
    if (data.repairMinEnd && (isNaN(mEnd) || mEnd < 0 || mEnd > 59)) {
      errors.push({ field: 'field-repair-min-end', msg: '分鐘必須在 0–59 之間 / Minute must be between 0 and 59' });
    }

    return errors;
  }

  /**
   * 取得 reCAPTCHA v3 一次性 token
   * grecaptcha.execute() 為隱形驗證（無需使用者互動），失敗時回傳空字串，
   * 讓後端明確拒絕該次請求（GAS_URL 外洩後的濫用防線由後端強制把關，
   * 前端這裡失敗不擋住 UI，只是最終一定會被後端拒絕）
   * @param {string} action - 需與後端 _verifyRecaptcha() 的 expectedAction 一致
   * @returns {Promise<string>}
   */
  async function _getRecaptchaToken(action) {
    const siteKey = CONFIG.RECAPTCHA_SITE_KEY;
    if (!siteKey || typeof grecaptcha === 'undefined') {
      console.warn('[ReportForm][reCAPTCHA] 尚未載入 grecaptcha 或未設定 RECAPTCHA_SITE_KEY，後端將拒絕本次送出');
      return '';
    }
    try {
      return await new Promise((resolve) => {
        grecaptcha.ready(() => {
          grecaptcha.execute(siteKey, { action })
            .then(resolve)
            .catch((err) => {
              console.warn('[ReportForm][reCAPTCHA] 取得 token 失敗:', err);
              resolve('');
            });
        });
      });
    } catch (err) {
      console.warn('[ReportForm][reCAPTCHA] 例外:', err);
      return '';
    }
  }

  /**
   * 向 GAS 送出報修資料（POST body，中性 MIME 防止 CORS preflight）
   * Content-Type: text/plain;charset=utf-8 不觸發 OPTIONS preflight
   * GAS 的 302 redirect 後 fetch() 會自動跟隨且保留 POST 方法
   */
  const REPORT_TIMEOUT_MS = 30000; // 30 秒途時保護
  const RECAPTCHA_ACTION  = 'submit_report';

  async function _submitToGAS(reportData) {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), REPORT_TIMEOUT_MS);

    const _doFetch = async (token, recaptchaToken) => fetch(CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'report',
        payload: reportData,
        token,
        clientId: Chat.getClientId(),
        recaptchaToken
      }),
      signal: controller.signal
    });

    try {
      const recaptchaToken = await _getRecaptchaToken(RECAPTCHA_ACTION);
      let res = await _doFetch(Chat.getToken(), recaptchaToken);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      let data = await res.json();

      // Token 失效：自動重取後重試一次（reCAPTCHA token 為一次性，需重新取得）
      if (data.error === 'INVALID_TOKEN') {
        console.warn('[ReportForm][Token] INVALID_TOKEN，重取後重試...');
        const newToken = await Chat.refreshToken();
        const freshRecaptchaToken = await _getRecaptchaToken(RECAPTCHA_ACTION);
        res = await _doFetch(newToken, freshRecaptchaToken);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
      }

      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /** 初始化所有事件監聽 */
  function init() {
    /* 關閉按鈕 */
    document.getElementById('modal-close-btn')?.addEventListener('click', close);
    document.getElementById('form-cancel-btn')?.addEventListener('click', close);

    /* 點擊 overlay 背景關閉 */
    modal()?.addEventListener('click', (e) => {
      if (e.target === modal()) close();
    });

    /* ESC 鍵關閉（使用具名函式，方便日後移除）（改善 L-04） */
    function _onKeyDown(e) {
      if (e.key === 'Escape' && !modal()?.hidden) close();
    }
    document.addEventListener('keydown', _onKeyDown);

    /* 表單送出 */
    form()?.addEventListener('submit', async (e) => {
      e.preventDefault();
      _clearErrors();

      /* 收集表單資料 */
      const fd = new FormData(form());
      // 組合維修時間字串（紓文本格式，避免試算表轉換日期）
      const repairHourStart = (fd.get('repairHourStart') || '').trim().padStart(2, '0');
      const repairMinStart  = (fd.get('repairMinStart')  || '').trim().padStart(2, '0');
      const repairHourEnd   = (fd.get('repairHourEnd')   || '').trim().padStart(2, '0');
      const repairMinEnd    = (fd.get('repairMinEnd')     || '').trim().padStart(2, '0');
      const repairTime = `${repairHourStart}:${repairMinStart}–${repairHourEnd}:${repairMinEnd}`;
      const reportData = {
        name:             fd.get('name')?.trim(),
        studentId:        fd.get('studentId')?.trim(),
        roomNumber:       fd.get('roomNumber')?.trim(),
        bedNumber:        fd.get('bedNumber')?.trim(),
        phone:            fd.get('phone')?.trim(),
        repairHourStart:  (fd.get('repairHourStart') || '').trim(),
        repairMinStart:   (fd.get('repairMinStart')  || '').trim(),
        repairHourEnd:    (fd.get('repairHourEnd')   || '').trim(),
        repairMinEnd:     (fd.get('repairMinEnd')    || '').trim(),
        repairTime,
        description:      fd.get('description')?.trim()
      };

      /* 前端驗證 */
      const errors = _validate(reportData);
      if (errors.length > 0) {
        errors.forEach(({ field }) => {
          document.getElementById(field)?.classList.add('error');
        });
        _showError('⚠️ 請填寫所有必填欄位（標示 * 者）/ Please complete all required fields (marked *)');
        return;
      }

      /* 送出 */
      _setLoading(true);

      try {
        if (CONFIG.GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
          // GAS 未設定時模擬成功（開發測試用）
          await new Promise(r => setTimeout(r, 1500));
          _showModalSuccess();
          return;
        }

        const result = await _submitToGAS(reportData);

        if (result.success) {
          _showModalSuccess();
        } else {
          // 顯示後端回傳的錯誤訊息（Rate Limit、格式錯誤等）
          throw new Error(result.error || '伺服器回傳錯誤');
        }
      } catch (err) {
        console.error('[ReportForm] 送出失敗:', err);
        // 後端回傳的錯誤訊息（如 Rate Limit、格式驗證錯誤）直接顯示給使用者
        const isKnownError = err.message && !err.message.startsWith('HTTP') && err.message !== 'Failed to fetch' && err.name !== 'AbortError';
        const errMsg = isKnownError
          ? `⚠️ ${err.message}`
          : '⚠️ 送出時發生問題，請稍後再試或至宿舍服務台通報。/ An error occurred. Please retry or visit the dormitory service desk.';
        _showError(errMsg);
        _setLoading(false);
      }
    });
  }

  return { open, close, init };
})();

/* ============================================================
   report.js — 報修表單模組
   ── 開關 Modal、表單驗證、送出至 GAS、顯示結果
   ============================================================ */
'use strict';

const ReportForm = (() => {

  /* ── DOM 參照 ── */
  const modal      = () => document.getElementById('report-modal');
  const form       = () => document.getElementById('report-form');
  const submitBtn  = () => document.getElementById('form-submit-btn');
  const btnText    = () => submitBtn()?.querySelector('.btn-text');
  const btnLoading = () => submitBtn()?.querySelector('.btn-loading');
  const errorMsg   = () => document.getElementById('form-error-msg');

  /* ── 必填欄位清單 ── */
  const REQUIRED_FIELDS = ['name', 'studentId', 'roomNumber', 'bedNumber', 'phone', 'repairTime', 'description'];

  /** 開啟 Modal */
  function open() {
    const m = modal();
    if (!m) return;
    m.hidden = false;
    // 聚焦到第一個欄位
    setTimeout(() => {
      const first = m.querySelector('input');
      if (first) first.focus();
    }, 350);
    // 防止背景滾動
    document.body.style.overflow = 'hidden';
  }

  /** 關閉 Modal */
  function close() {
    const m = modal();
    if (!m) return;
    m.hidden = true;
    document.body.style.overflow = '';
    _resetForm();
  }

  /** 重置表單狀態 */
  function _resetForm() {
    form()?.reset();
    _setLoading(false);
    _clearErrors();
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

  /** 表單驗證（前端基本驗證：空值檢查） */
  function _validate(data) {
    const errors = [];

    if (!data.name?.trim())        errors.push({ field: 'field-name',       msg: '請填寫姓名' });
    if (!data.studentId?.trim())   errors.push({ field: 'field-student-id', msg: '請填寫學號' });
    if (!data.roomNumber?.trim())  errors.push({ field: 'field-room',       msg: '請填寫房號' });
    if (!data.bedNumber?.trim())   errors.push({ field: 'field-bed',        msg: '請填寫床號' });
    if (!data.phone?.trim())       errors.push({ field: 'field-phone',      msg: '請填寫手機號碼' });
    if (!data.repairTime?.trim())  errors.push({ field: 'field-repair-time',msg: '請填寫可維修時間' });
    if (!data.description?.trim()) errors.push({ field: 'field-description',msg: '請填寫問題描述' });

    return errors;
  }

  /** 從 GAS 送出報修資料（使用 GET + URL params） */
  async function _submitToGAS(reportData) {
    const params = new URLSearchParams({
      action:  'report',
      payload: JSON.stringify(reportData)
    });
    const res = await fetch(`${CONFIG.GAS_URL}?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
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

    /* ESC 鍵關閉 */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal()?.hidden) close();
    });

    /* 表單送出 */
    form()?.addEventListener('submit', async (e) => {
      e.preventDefault();
      _clearErrors();

      /* 收集表單資料 */
      const fd = new FormData(form());
      const reportData = {
        name:        fd.get('name')?.trim(),
        studentId:   fd.get('studentId')?.trim(),
        roomNumber:  fd.get('roomNumber')?.trim(),
        bedNumber:   fd.get('bedNumber')?.trim(),
        phone:       fd.get('phone')?.trim(),
        repairTime:  fd.get('repairTime')?.trim(),
        description: fd.get('description')?.trim()
      };

      /* 前端驗證 */
      const errors = _validate(reportData);
      if (errors.length > 0) {
        errors.forEach(({ field }) => {
          document.getElementById(field)?.classList.add('error');
        });
        _showError('⚠️ 請填寫所有必填欄位（標示 * 者）');
        return;
      }

      /* 送出 */
      _setLoading(true);

      try {
        if (CONFIG.GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
          // GAS 未設定時模擬成功（開發測試用）
          await new Promise(r => setTimeout(r, 1500));
          close();
          if (window.Chat) Chat.onReportSuccess();
          return;
        }

        const result = await _submitToGAS(reportData);

        if (result.success) {
          close();
          if (window.Chat) Chat.onReportSuccess();
        } else {
          throw new Error(result.error || '伺服器回傳錯誤');
        }
      } catch (err) {
        console.error('[ReportForm] 送出失敗:', err);
        _showError('⚠️ 送出時發生問題，請稍後再試或至宿舍服務台通報。');
        _setLoading(false);
      }
    });
  }

  return { open, close, init };
})();

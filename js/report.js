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
    { name: 'name',        id: 'field-name',        msg: '請填寫姓名' },
    { name: 'studentId',   id: 'field-student-id',  msg: '請填寫學號' },
    { name: 'roomNumber',  id: 'field-room',         msg: '請填寫房號' },
    { name: 'bedNumber',   id: 'field-bed',          msg: '請填寫床號' },
    { name: 'phone',       id: 'field-phone',        msg: '請填寫手機號碼' },
    { name: 'repairTime',  id: 'field-repair-time',  msg: '請填寫可維修時間' },
    { name: 'description', id: 'field-description',  msg: '請填寫問題描述' }
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

  /** 重置表單狀態（含還原 success view）*/
  function _resetForm() {
    form()?.reset();
    form().hidden = false;
    const sv = successView();
    if (sv) sv.hidden = true;
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

    // 隱藏表單、顯示成功畫面
    form().hidden = true;
    const sv = successView();
    if (sv) sv.hidden = false;

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
   * 表單驗證（前端基本驗證：空值檢查）
   * 使用 REQUIRED_FIELDS 統一管理欄位清單（修復 M-05：原先 REQUIRED_FIELDS 定義後從未使用）
   */
  function _validate(data) {
    return REQUIRED_FIELDS
      .filter(({ name }) => !data[name]?.trim())
      .map(({ id, msg }) => ({ field: id, msg }));
  }

  /**
   * 向 GAS 送出報修資料（使用 GET + URLSearchParams）
   *
   * ⚠️ GAS 架構限制說明：
   *   GAS Web App 對所有請求固定回傳 302 redirect（從 script.google.com 轉至
   *   script.googleusercontent.com）。依 HTTP 規範，302 redirect 後 POST 會自動
   *   改為 GET，導致 POST body 遺失，doPost 無法正常接收資料。
   *   因此採用 GET + payload 參數，資料已透過 HTTPS 加密傳輸。
   *   若未來改用中繼 Proxy，可切換回 doPost。
   */
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
          _showModalSuccess();
          return;
        }

        const result = await _submitToGAS(reportData);

        if (result.success) {
          _showModalSuccess();
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

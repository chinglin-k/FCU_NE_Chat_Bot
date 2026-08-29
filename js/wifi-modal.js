/* ============================================================
   wifi-modal.js — Wi-Fi 機設定教學彈窗控制器
   ── 提供 open() / close() 方法，供 chat.js 呼叫
   ── 支援：X 按鈕、關閉按鈕、遮罩點擊三種關閉方式
   ============================================================ */
'use strict';

/* exported WifiModal */
const WifiModal = (() => {

  /* ── DOM 參照 ── */
  function _overlay()    { return document.getElementById('wifi-modal'); }
  function _closeBtn()   { return document.getElementById('wifi-modal-close-btn'); }
  function _cancelBtn()  { return document.getElementById('wifi-modal-cancel-btn'); }

  /* ── 開啟彈窗 ── */
  function open() {
    const overlay = _overlay();
    if (!overlay) return;
    overlay.removeAttribute('hidden');
    // 焦點移至標題（無障礙）
    const title = document.getElementById('wifi-modal-title');
    if (title) title.focus();
  }

  /* ── 關閉彈窗 ── */
  function close() {
    const overlay = _overlay();
    if (!overlay) return;
    overlay.setAttribute('hidden', '');
  }

  /* ── 初始化事件監聽 ── */
  function init() {
    // X 關閉按鈕
    _closeBtn()?.addEventListener('click', close);

    // 「關閉」按鈕
    _cancelBtn()?.addEventListener('click', close);

    // 點擊遮罩背景關閉（點到 modal-container 內不關閉）
    _overlay()?.addEventListener('click', (e) => {
      if (e.target === _overlay()) close();
    });

    // ESC 鍵關閉
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !_overlay()?.hasAttribute('hidden')) {
        close();
      }
    });
  }

  return { init, open, close };
})();

/* ── 啟動 ── */
document.addEventListener('DOMContentLoaded', () => WifiModal.init());

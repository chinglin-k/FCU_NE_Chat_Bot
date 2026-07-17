/* ============================================================
   counter.js — 累積使用人數模組
   ── 向 GAS 讀取 / 累加計數，並更新 Header 數字顯示
   ============================================================ */
'use strict';

const Counter = (() => {
  const DISPLAY_ID = 'counter-display';

  /** 更新畫面上的數字並觸發彈跳動畫 */
  function _updateDisplay(count) {
    const el = document.getElementById(DISPLAY_ID);
    if (!el) return;
    el.textContent = count.toLocaleString('zh-TW');
    el.classList.remove('bump');
    // 強制 reflow 以觸發動畫
    void el.offsetWidth;
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump'), 400);
  }

  /** 向 GAS 取得目前計數（不累加） */
  async function _fetchCount() {
    if (CONFIG.GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') return null;
    try {
      const url = `${CONFIG.GAS_URL}?action=counter_get`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) return data.count;
    } catch (e) {
      console.warn('[Counter] fetchCount 失敗:', e);
    }
    return null;
  }

  /** 向 GAS 累加計數並回傳新數值 */
  async function _increment() {
    if (CONFIG.GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') return null;
    try {
      const url = `${CONFIG.GAS_URL}?action=counter_increment`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) return data.count;
    } catch (e) {
      console.warn('[Counter] increment 失敗:', e);
    }
    return null;
  }

  /**
   * 初始化計數器
   *  1. 先顯示目前數字（讀取但不累加）
   *  2. 判斷本次 session 是否已累加過（localStorage），避免重複計算
   *  3. 若未累加，呼叫 increment 並更新顯示
   */
  async function init() {
    // 先顯示當前數字（快速回應用戶）
    const currentCount = await _fetchCount();
    if (currentCount !== null) {
      _updateDisplay(currentCount);
    } else {
      // GAS 未設定時顯示 ---
      const el = document.getElementById(DISPLAY_ID);
      if (el) el.textContent = '---';
    }

    // 判斷是否為新的 session（每次開啟頁面算一次）
    const sessionKey = 'fcu_chatbot_counted';
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');
      const newCount = await _increment();
      if (newCount !== null) {
        _updateDisplay(newCount);
      }
    }
  }

  return { init };
})();

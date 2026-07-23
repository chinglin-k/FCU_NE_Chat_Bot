/* ============================================================
   intent.js — 意圖分類模組
   ── 透過 GAS 呼叫 Gemini API，回傳意圖代碼
   ============================================================ */
'use strict';

const Intent = (() => {

  /** 意圖代碼常數 */
  const INTENTS = Object.freeze({
    BUTTON_TEACH:   'BUTTON_TEACH',    // 教學相關
    BUTTON_SETTING: 'BUTTON_SETTING',  // 常見問題（轉接器、WiFi 帳號、寢室 WiFi 等）
    BUTTON_REPORT:  'BUTTON_REPORT',   // 明確要報修
    STICKER_PORT:   'STICKER_PORT',    // IP貼紙缺漏 / 網路孔故障
    NON_NETWORK:    'NON_NETWORK',     // 非網管業務（冷氣等）
    UNKNOWN:        'UNKNOWN'          // 無法判斷
  });

  /**
   * 呼叫 GAS 進行意圖分類
   * @param {string} message - 使用者輸入文字
   * @returns {Promise<string>} 意圖代碼
   */
  async function classify(message) {
    if (!message || !message.trim()) return INTENTS.UNKNOWN;

    if (CONFIG.GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
      console.warn('[Intent] GAS URL 尚未設定，回傳 UNKNOWN');
      return INTENTS.UNKNOWN;
    }

    try {
      const params = new URLSearchParams({
        action: 'classify',
        msg: message.trim()
      });
      const res = await fetch(`${CONFIG.GAS_URL}?${params.toString()}`);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data.success && data.intent) {
        // 確保回傳值為有效的意圖代碼
        const validIntents = Object.values(INTENTS);
        return validIntents.includes(data.intent) ? data.intent : INTENTS.UNKNOWN;
      } else {
        console.warn('[Intent] GAS 回傳錯誤:', data.error);
        return INTENTS.UNKNOWN;
      }
    } catch (err) {
      console.error('[Intent] classify 失敗:', err);
      return INTENTS.UNKNOWN;
    }
  }

  return { classify, INTENTS };
})();

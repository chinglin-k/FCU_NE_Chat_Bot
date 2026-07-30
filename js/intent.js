/* ============================================================
   intent.js — 意圖分類模組
   ── 透過 GAS 呼叫 Gemini API，回傳意圖代碼、信心分數與是否需確認
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
   * GAS classify 逾時（毫秒）
   * GAS 後端採多模型備援（最多 9 個模型，每個最多 2 次重試，每次間隔 1.5s）
   * 最壞情況：9×2×1.5s ≈ 27s，設 25s 為實務上限（超過此時間通常為網路問題）
   */
  const CLASSIFY_TIMEOUT_MS = 25000;

  /**
   * 呼叫 GAS 進行意圖分類
   * @param {string} message - 使用者輸入文字
   * @returns {Promise<{intent: string, confidence: number, needsConfirmation: boolean}>}
   *   - intent: 意圖代碼
   *   - confidence: 0.0~1.0 信心分數
   *   - needsConfirmation: confidence < 0.6 時為 true
   */
  async function classify(message) {
    /** 預設 fallback 回傳值 */
    const _fallback = { intent: INTENTS.UNKNOWN, confidence: 0, needsConfirmation: false };

    if (!message || !message.trim()) return _fallback;

    if (CONFIG.GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
      console.warn('[Intent] GAS URL 尚未設定，回傳 UNKNOWN');
      return _fallback;
    }

    // ── AbortController 逾時保護 ──
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => {
      controller.abort();
      console.warn(`[Intent] classify 逾時（>${CLASSIFY_TIMEOUT_MS}ms），fallback 回 UNKNOWN`);
    }, CLASSIFY_TIMEOUT_MS);

    try {
      const params = new URLSearchParams({
        action: 'classify',
        msg: message.trim()
      });
      const res = await fetch(`${CONFIG.GAS_URL}?${params.toString()}`, {
        signal: controller.signal
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (data.success && data.intent) {
        const validIntents = Object.values(INTENTS);
        const intent            = validIntents.includes(data.intent) ? data.intent : INTENTS.UNKNOWN;
        const confidence        = (typeof data.confidence === 'number')
          ? Math.min(1.0, Math.max(0.0, data.confidence))
          : 0.5;
        const needsConfirmation = data.needsConfirmation === true || confidence < 0.6;
        return { intent, confidence, needsConfirmation };
      } else {
        console.warn('[Intent] GAS 回傳錯誤:', data.error);
        return _fallback;
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // 已在 setTimeout 中 console.warn，不重複記錄
      } else {
        console.error('[Intent] classify 失敗:', err);
      }
      return _fallback;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return { classify, INTENTS };
})();

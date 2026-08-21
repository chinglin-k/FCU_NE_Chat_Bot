/* ============================================================
   intent.js — 意圖分類模組
   ── 透過 GAS 呼叫 Gemini API，回傳意圖代碼、信心分數與是否需確認
   ──
   回傳格式：
     { intent, confidence, needsConfirmation, isSystemError, topic }
     isSystemError: true  → 系統/API 問題（逾時、HTTP 錯誤、GAS 失敗等）
     isSystemError: false → 正常分類結果（包含 UNKNOWN 意圖）
     topic: 'ACCOUNT'|'ADAPTER'|'WIFI_SIGNAL'|'AC_BILLING'|'ALL'|'NONE'
            — 僅 BUTTON_SETTING 時有意義；其他意圖為 'NONE'
   ============================================================ */
/* exported Intent */
'use strict';

const Intent = (() => {

  /** 意圖代碼常數 */
  const INTENTS = Object.freeze({
    BUTTON_TEACH:   'BUTTON_TEACH',    // 教學相關
    BUTTON_SETTING: 'BUTTON_SETTING',  // 常見問題（轉接器、WiFi 帳號、寢室 WiFi 等）
    BUTTON_REPORT:  'BUTTON_REPORT',   // 明確要報修
    BUTTON_QUERY:   'BUTTON_QUERY',    // 查詢報修案件狀態
    STICKER_PORT:   'STICKER_PORT',    // IP貼紙缺漏 / 網路孔故障
    NON_NETWORK:    'NON_NETWORK',     // 非網管業務（冷氣等）
    UNKNOWN:        'UNKNOWN'          // 無法判斷
  });

  /**
   * GAS classify 逾時（毫秒）
   * GAS 後端採多模型備援（最多 6 個模型，每個最多 2 次重試，每次間隔 1.5s）
   * 最壞情況：6×2×1.5s ≈ 18s，設 25s 為實務上限（超過此時間通常為網路問題）
   */
  const CLASSIFY_TIMEOUT_MS = 25000;

  /**
   * 呼叫 GAS 進行意圖分類
   * @param {string} message - 使用者輸入文字
   * @returns {Promise<{
   *   intent: string,
   *   confidence: number,
   *   needsConfirmation: boolean,
   *   isSystemError: boolean,
   *   topic: string
   * }>}
   *   - intent:            意圖代碼
   *   - confidence:        0.0~1.0 信心分數
   *   - needsConfirmation: confidence < 0.6 時為 true
   *   - isSystemError:     true = 系統/API 問題；false = 正常分類（含 UNKNOWN）
   *   - topic:             BUTTON_SETTING 的子主題（ACCOUNT/ADAPTER/WIFI_SIGNAL/AC_BILLING/ALL）；其他意圖為 'NONE'
   */
  async function classify(message) {
    /** A. 理解失敗 fallback（NLU 正常運作但無法辨識意圖） */
    const _unknownFallback = {
      intent: INTENTS.UNKNOWN, confidence: 0,
      needsConfirmation: false, isSystemError: false, topic: 'NONE'
    };

    /** B. 系統錯誤 fallback（逾時、HTTP 錯誤、GAS 失敗等） */
    const _systemErrorFallback = {
      intent: INTENTS.UNKNOWN, confidence: 0,
      needsConfirmation: false, isSystemError: true, topic: 'NONE'
    };

    if (!message || !message.trim()) return _unknownFallback;

    if (CONFIG.GAS_URL === 'YOUR_GAS_WEB_APP_URL_HERE') {
      console.warn('[Intent] GAS URL 尚未設定，回傳 UNKNOWN');
      return _unknownFallback;
    }

    // ── AbortController 逾時保護 ──
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => {
      controller.abort();
      console.warn(`[Intent][系統錯誤] classify 逾時（>${CLASSIFY_TIMEOUT_MS}ms），原因：timeout`);
    }, CLASSIFY_TIMEOUT_MS);

    try {
      // ── POST body：使用者輸入文字透過 POST body 傳送，不暴露於 URL ──
      // Content-Type: text/plain;charset=utf-8（防止 CORS preflight OPTIONS，
      // GAS 沒有實作 doOptions → application/json 會導致 405 錯誤）
      const _doFetch = async (token) => {
        return fetch(CONFIG.GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'classify', msg: message.trim(), token, clientId: Chat.getClientId() }),
          signal: controller.signal
        });
      };

      let res = await _doFetch(Chat.getToken());

      // HTTP 層錯誤（GAS 服務異常、網路問題等）
      if (!res.ok) {
        console.warn(`[Intent][系統錯誤] HTTP ${res.status}，原因：${res.status >= 500 ? '伺服器錯誤' : res.status === 429 ? '額度超限' : 'HTTP 錯誤'}`);
        return _systemErrorFallback;
      }

      let data = await res.json();

      // Token 失效：自動重取後重試一次（防止無限迄迴）
      if (data.error === 'INVALID_TOKEN') {
        console.warn('[Intent][Token] INVALID_TOKEN，重取 token 後重試一次...');
        const newToken = await Chat.refreshToken();
        res = await _doFetch(newToken);
        if (!res.ok) return _systemErrorFallback;
        data = await res.json();
        if (data.error === 'INVALID_TOKEN') {
          console.warn('[Intent][Token] 重試後仍 INVALID_TOKEN，放棄');
          return _systemErrorFallback;
        }
      }

      // 頻率限制錯誤
      if (!data.success && data.error === 'RATE_LIMITED') {
        console.warn('[Intent][頻率限制]', data.error);
        return _systemErrorFallback;
      }

      // GAS 回傳 success: false（API Key 未設定、GAS 例外等）
      if (!data.success || !data.intent) {
        console.warn('[Intent][系統錯誤] GAS 回傳失敗，原因：', data.error || '未知');
        return _systemErrorFallback;
      }

      // 正常分類結果
      const validIntents = Object.values(INTENTS);
      const VALID_TOPICS  = ['ACCOUNT', 'ADAPTER', 'WIFI_SIGNAL', 'AC_BILLING', 'ALL', 'NONE'];
      const intent            = validIntents.includes(data.intent) ? data.intent : INTENTS.UNKNOWN;
      const confidence        = (typeof data.confidence === 'number')
        ? Math.min(1.0, Math.max(0.0, data.confidence))
        : 0.5;
      const needsConfirmation = data.needsConfirmation === true || confidence < 0.6;
      // topic: 僅 BUTTON_SETTING 有意義；白名單驗證，無效則 fallback 'ALL'
      const rawTopic = (typeof data.topic === 'string') ? data.topic.trim().toUpperCase() : '';
      const topic    = (intent === INTENTS.BUTTON_SETTING)
        ? (VALID_TOPICS.includes(rawTopic) ? rawTopic : 'ALL')
        : 'NONE';

      if (intent === INTENTS.UNKNOWN) {
        console.log(`[Intent][理解失敗] 意圖 UNKNOWN，信心分數=${confidence.toFixed(2)}，輸入="${message}"`);
      } else {
        console.log(`[Intent] 分類成功：intent=${intent}，confidence=${confidence.toFixed(2)}，topic=${topic}`);
      }

      return { intent, confidence, needsConfirmation, isSystemError: false, topic };

    } catch (err) {
      if (err.name === 'AbortError') {
        // 逾時已在 setTimeout 中 warn，此處補充系統錯誤回傳
        return _systemErrorFallback;
      }
      console.error('[Intent][系統錯誤] classify 未預期例外，原因：', err.message || err);
      return _systemErrorFallback;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return { classify, INTENTS };
})();

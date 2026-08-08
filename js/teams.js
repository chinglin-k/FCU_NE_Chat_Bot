/* ============================================================
   teams.js — Teams 聯絡網管功能模組
   ── 參照 counter.js 的 IIFE 寫法
   ── 開啟 Teams 聊天深連結、偵測 App 是否被喚起、平台備援跳轉
   ============================================================ */
'use strict';

const Teams = (() => {

  /**
   * 偵測裝置平台
   * @returns {'ios' | 'android' | 'desktop'}
   */
  function _getPlatform() {
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
  }

  /**
   * 組出 Teams 聊天深連結
   * 格式：https://teams.microsoft.com/l/chat/0/0?users={email}&message={預填文字}
   * @returns {string}
   */
  function _buildDeepLink() {
    const email   = encodeURIComponent(CONFIG.TEAMS.contactEmail);
    const message = CONFIG.TEAMS.prefilledMessage
      ? `&message=${encodeURIComponent(CONFIG.TEAMS.prefilledMessage)}`
      : '';
    return `https://teams.microsoft.com/l/chat/0/0?users=${email}${message}`;
  }

  /**
   * 取得備援商店 / 網頁版 URL
   * @returns {string}
   */
  function _getFallbackUrl() {
    const platform = _getPlatform();
    if (platform === 'ios')     return CONFIG.TEAMS.APP_STORE_URL;
    if (platform === 'android') return CONFIG.TEAMS.PLAY_STORE_URL;
    return CONFIG.TEAMS.WEB_URL;
  }

  /**
   * 開啟 Teams 聊天深連結
   *  1. 嘗試用 <a> 觸發 Teams 深連結（讓 OS 喚起 App）
   *  2. 2.5 秒後偵測 document.hidden：
   *     - 若頁面被隱藏（代表 App 被喚起）→ 不做任何事
   *     - 若頁面仍顯示（代表 App 未安裝）→ 跳轉備援 URL
   */
  function open() {
    const deepLink    = _buildDeepLink();
    const fallbackUrl = _getFallbackUrl();

    // 建立隱藏的 <a> 觸發深連結
    const anchor = document.createElement('a');
    anchor.href   = deepLink;
    anchor.target = '_blank';
    anchor.rel    = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // 2.5 秒後偵測頁面是否被隱藏（App 被喚起會讓瀏覽器失去焦點）
    setTimeout(() => {
      if (!document.hidden) {
        // 頁面仍在前景 → 代表 App 未被喚起，跳轉備援
        console.warn('[Teams] App 未被喚起，跳轉備援:', fallbackUrl);
        window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
      }
    }, 2500);
  }

  /**
   * 一鍵複製 Teams 帳號名稱
   * 複製 CONFIG.RESPONSES.TEAMS_ACCOUNT_NAME 的文字
   * @param {HTMLButtonElement} [btnEl] - 點擊的按鈕元素（可選，複製後提示文字用）
   */
  async function copyAccountName(btnEl) {
    const text = CONFIG.RESPONSES.TEAMS_ACCOUNT_NAME;
    try {
      await navigator.clipboard.writeText(text);
      if (btnEl) {
        const original = btnEl.textContent;
        btnEl.textContent = CONFIG.RESPONSES.TEAMS_COPY_SUCCESS;
        btnEl.disabled = true;
        setTimeout(() => {
          btnEl.textContent = original;
          btnEl.disabled = false;
        }, 2500);
      }
    } catch (err) {
      console.error('[Teams] copyAccountName 失敗:', err);
      // fallback：在按鈕下方顯示 inline 文字框（避免 popup blocker 攔截 window.prompt）
      if (btnEl && !btnEl.parentElement.querySelector('.teams-copy-fallback')) {
        const fallback = document.createElement('p');
        fallback.className = 'teams-copy-fallback';
        fallback.style.cssText =
          'margin-top:6px;font-size:12px;color:#94a3b8;word-break:break-all;user-select:all;';
        fallback.textContent = '請手動複製 / Please copy manually: ' + text;
        btnEl.parentElement.appendChild(fallback);
      }
    }
  }

  return { open, copyAccountName };
})();

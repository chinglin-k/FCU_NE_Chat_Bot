/* ============================================================
   teams.js — Teams 聯絡網管功能模組
   ── 參照 counter.js 的 IIFE 寫法
   ── 開啟 Teams 聊天深連結、偵測 App 是否被喚起、平台備援跳轉
   ============================================================ */
/* exported Teams */
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
    //
    // ⚠️ 修正（v1.3.1 / BUG-07）：原本在此用 window.open(fallbackUrl, '_blank', ...)，
    // 但這段程式碼是在 setTimeout 回呼中執行，已脫離使用者點擊當下的同步呼叫鏈，
    // 大多數瀏覽器（尤其 Safari／iOS）的彈跳視窗封鎖機制會直接擋掉這類延遲呼叫的
    // window.open()，導致「App 未安裝時跳轉商店/網頁版」的備援機制實際上經常失效。
    // 改用與上方深連結相同的「建立隱藏 <a target="_blank"> 並模擬點擊」手法，
    // 瀏覽器多半仍視其為一般連結導覽而非彈跳視窗，較不易被封鎖。
    setTimeout(() => {
      if (!document.hidden) {
        // 頁面仍在前景 → 代表 App 未被喚起，跳轉備援
        console.warn('[Teams] App 未被喚起，跳轉備援:', fallbackUrl);
        const fallbackAnchor = document.createElement('a');
        fallbackAnchor.href   = fallbackUrl;
        fallbackAnchor.target = '_blank';
        fallbackAnchor.rel    = 'noopener noreferrer';
        document.body.appendChild(fallbackAnchor);
        fallbackAnchor.click();
        document.body.removeChild(fallbackAnchor);
      }
    }, 2500);
  }

  async function copyAccountName(btnEl) {
    const text = CONFIG.RESPONSES[I18N.getLang()].TEAMS_ACCOUNT_NAME;
    try {
      await navigator.clipboard.writeText(text);
      if (btnEl) {
        const original = btnEl.textContent;
        btnEl.textContent = CONFIG.RESPONSES[I18N.getLang()].TEAMS_COPY_SUCCESS;
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

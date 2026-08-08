/* ============================================================
   config.js — 全域設定檔
   ★ 部署 GAS 後，請將 GAS_URL 替換為您的 Web App URL
   ============================================================ */
'use strict';

const CONFIG = Object.freeze({

  /**
   * Google Apps Script Web App URL
   * 部署步驟：
   *   1. 打開 gas/Code.gs，複製全部程式碼至 Google Apps Script 編輯器
   *   2. 在 GAS 中設定 Script Properties：GEMINI_API_KEY = 您的 API Key
   *   3. 部署 → 新的部署 → 類型：網頁應用程式
   *      執行身分：我自己 / 誰可以存取：所有人
   *   4. 將產生的 URL 貼到下方
   */
  GAS_URL: 'https://script.google.com/macros/s/AKfycbx-7SbbfxQtJ9UXAdAMvdbeMjyeKcw64yIYYNg6Td-dp43jDnpA0Iv_CGXjjDqqWC8C4Q/exec',

  /* ── 教學 PDF 文件連結 ── */
  DOCS: {
    WINDOWS: 'https://drive.google.com/file/d/11IYN9LHEiNRf1gf496jfv83ikd_GxIsd/view?usp=sharing',
    MAC:     'https://drive.google.com/file/d/1nrq01pIF-LKZlUVpZPz02g99Yu56KSlT/view?usp=sharing'
  },

  /* ── Chatbot 回覆文字 ── */
  RESPONSES: {
    WELCOME:
      '您好！我是**逢甲福星宿舍網路報修助理** 🔧\n' +
      '您可以直接輸入問題，或點選下方按鈕選擇服務：\n\n' +
      '_💡 您的訊息將用於 AI 意圖辨識，以便提供精準回覆，不會用於其他用途。_\n' +
      '*Hello! I\'m the **FCU Fuxing Dormitory Network Repair Assistant** 🔧\n' +
      'Type your question or tap a button below to get started.\n\n' +
      '💡 Your messages are used only for AI intent recognition and not for any other purpose.*',

    TEACH_CHOOSE:
      '請選擇您的電腦系統：\n*Please select your operating system:*',

    TEACH_WINDOWS:
      '📄 **Windows 網路教學文件**\n\n' +
      '[點此開啟 Windows 教學 PDF（Google Drive）]({WINDOWS_URL})\n\n' +
      'WiFi 分享器設定請依照**該機種的說明書**操作。\n\n' +
      '如果看完文件還是無法解決，請選擇「我需要協助」。\n\n' +
      '*📄 **Windows Network Setup Guide**\n' +
      '[Open Windows PDF (Google Drive)]({WINDOWS_URL})\n\n' +
      'For WiFi router setup, follow the manual of your specific device.\n\n' +
      'If the guide doesn\'t resolve your issue, tap "I Need Help".*',

    TEACH_MAC:
      '📄 **Mac 網路教學文件**\n\n' +
      '[點此開啟 Mac 教學 PDF（Google Drive）]({MAC_URL})\n\n' +
      'WiFi 分享器設定請依照**該機種的說明書**操作。\n\n' +
      '如果看完文件還是無法解決，請選擇「我需要協助」。\n\n' +
      '*📄 **Mac Network Setup Guide**\n' +
      '[Open Mac PDF (Google Drive)]({MAC_URL})\n\n' +
      'For WiFi router setup, follow the manual of your specific device.\n\n' +
      'If the guide doesn\'t resolve your issue, tap "I Need Help".*',

    SETTING_HEADER:
      '📋 **常見問題**\n*📋 **Frequently Asked Questions***',

    // 子主題對應的常見問題卡片（key = topic 代碼）
    // 顯示全部時用 Object.values()；精準顯示時用對應 key 直接取值
    SETTING_ITEMS: Object.freeze({
      ACCOUNT:
        '**fcu、fcu auto 帳號與密碼**\n帳號 = 你的學號　密碼 = 你的 NID 密碼\n*fcu / fcu auto Account: Student ID | Password: NID password*',
      ADAPTER:
        '**使用 USB 轉接器（RJ45 to USB-A 或 RJ45 to USB-C）沒有網路？**\n請上網搜尋您的**轉接器型號**，下載並安裝最新驅動程式或韌體。\n大多數轉接器問題可透過更新驅動程式解決。\n*No internet with USB Adapter (RJ45 to USB-A / USB-C)?\nSearch for your adapter model online and install the latest driver or firmware.\nMost adapter issues can be resolved by updating drivers.*',
      WIFI_SIGNAL:
        '**寢室收不到學校 WiFi 訊號**\n學校 WiFi 只在公共區域提供，故寢室無法接收到訊號。\n*Cannot receive school WiFi in dorm room\nSchool WiFi is only available in public areas; dormitory rooms are not covered.*',
      AC_BILLING:
        '**冷氣電費儲值相關問題**\n冷氣電費儲值相關問題請洽服務台詢問，謝謝。\n*Air Conditioning Billing & Top-up\nFor AC billing and top-up inquiries, please contact the dormitory service desk.*'
    }),

    REPORT_TRIGGER:
      '好的，我來協助您填寫報修單 🔧\n請填寫以下資料，網管人員收到後會與您聯絡。\n*Sure! Let me help you fill out a repair request 🔧\nPlease complete the form below; our network admin will contact you.*',

    NON_NETWORK:
      '⚠️ 您描述的問題不在網管業務範圍內。\n\n' +
      '請至**宿舍服務台**或透過**行動逢甲 App** 進行通報，謝謝！\n\n' +
      '*⚠️ The issue you described is outside the network admin scope.\nPlease report it at the **dormitory service desk** or via the **FCU Mobile App**. Thank you!*',

    /**
     * A. 「理解失敗」：意圖辨識信心値過低 / 沒有比對到任何已知服務
     * 觸發條件：intent === UNKNOWN 且 isSystemError === false
     */
    UNKNOWN:
      '抱歉，我不太確定您想詢問的內容 🙏\n\n' +
      '您可以換個方式描述，或點選下方按鈕選擇服務：\n\n' +
      '*Sorry, I\'m not quite sure what you\'re asking 🙏\nTry rephrasing, or tap a button below to choose a service:*',

    /**
     * B. 「系統/API 問題」：呼叫外部服務時發生例外
     * 觸發條件：isSystemError === true（順時、HTTP 4xx/5xx、GAS 回傳失敗等）
     */
    SYSTEM_ERROR:
      '抱歉，目前服務暫時無法回應（系統忙碌中）🙏\n\n' +
      '請稍後再試，或點選下方按鈕選擇服務：\n\n' +
      '*Sorry, the service is temporarily unavailable (system busy) 🙏\nPlease try again later, or tap a button below:*',

    REPORT_SUCCESS:
      '✅ **報修單已成功送出！**\n\n' +
      '感謝您的回報，網管人員會盡快與您聯絡。\n' +
      '如有緊急需求，也歡迎直接至宿舍服務台反映。\n\n' +
      '*✅ **Repair request submitted successfully!**\n' +
      'Thank you for your report. Our network admin will contact you soon.\n' +
      'For urgent matters, please visit the dormitory service desk directly.*',

    REPORT_ERROR:
      '⚠️ 送出時發生問題，請稍後再試，或至宿舍服務台直接通報。\n*An error occurred during submission. Please try again or visit the dormitory service desk.*',

    GAS_NOT_CONFIGURED:
      '⚠️ 系統尚未完成後端設定。\n請使用下方按鈕或聯繫網管人員。\n*⚠️ Backend not configured yet.\nPlease use the buttons below or contact the network admin.*',

    /**
     * 低信心確認提示（needsConfirmation: true 時使用）
     * 使用方式：將 {INTENT_LABEL} 替換為對應的中文標籤
     */
    CONFIRM_HINT:
      '🤔 我不太確定，你是不是想要「{INTENT_LABEL}」？\n請選擇或重新描述問題：\n*🤔 I\'m not sure — did you mean "{INTENT_LABEL}"?\nPlease choose or rephrase your question:*',

    /* ── Teams 聯絡 ── */

    /** Header 右上角常駐連結文字 */
    TEAMS_HEADER_LINK: '聯絡我們',

    /** 點擊 Teams 連結後，在聊天區顯示的備援步驟說明 */
    TEAMS_FALLBACK:
      '💬 **Teams 備援步驟**\n\n' +
      '如果 Teams App 沒有自動開啟，請手動操作：\n\n' +
      '➡️ 登入學校帳號\n' +
      '➡️ 點擊上方搜尋框\n' +
      '➡️ 搜尋「**福星宿舍網路報修平台**」\n\n' +
      '點擊下方按鈕一鍵複製帳號名稱：\n\n' +
      '*💬 **Teams Fallback Steps**\n\n' +
      'If Teams App did not open automatically, follow these steps:\n\n' +
      '➡️ Sign in with your school account\n' +
      '➡️ Tap the search bar at the top\n' +
      '➡️ Search for **"Fuxing Dorm Network Support"**\n\n' +
      'Tap the button below to copy the account name:*',

    /** 複製成功的提示文字 */
    TEAMS_COPY_SUCCESS: '✅ 已複製！請貼到 Teams 搜尋框 / Copied! Paste into the Teams search bar',

    /** Teams 帳號搜尋名稱（一鍵複製的內容） */
    TEAMS_ACCOUNT_NAME: '福星宿舍網路報修平台'
  },

  /**
   * 意圖代碼 → 中文標籤（供低信心確認提示使用）
   * key 與 Intent.INTENTS 的常數對應
   */
  INTENT_LABELS: Object.freeze({
    BUTTON_TEACH:   '網路教學',
    BUTTON_SETTING: '常見問題',
    BUTTON_REPORT:  '我要協助報修',
    STICKER_PORT:   '貼紙/網路孔報修',
    NON_NETWORK:    '非網管問題',
    UNKNOWN:        '其他'
  }),

  /**
   * Teams 聯絡設定
   *
   * contactEmail：「福星宿舍網路報修平台」Teams 帳號的 Email
   * 深連結格式：https://teams.microsoft.com/l/chat/0/0?users={contactEmail}
   *
   * prefilledMessage：開啟 Teams 聊天時的預填文字（設為空字串則不預填）
   *
   * App Store / Play Store / 網頁版 URL：
   *   當裝置未安裝 Teams App 時（2.5 秒偵測不到 App 被喚起），依平台跳轉的備援連結
   */
  TEAMS: Object.freeze({
    contactEmail:     'desk_dorm@o365.fcu.edu.tw',
    prefilledMessage: '',
    APP_STORE_URL:    'https://apps.apple.com/app/microsoft-teams/id1113153706',
    PLAY_STORE_URL:   'https://play.google.com/store/apps/details?id=com.microsoft.teams',
    WEB_URL:          'https://teams.microsoft.com'
  })
});

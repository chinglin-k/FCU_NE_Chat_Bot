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
  GAS_URL: 'https://script.google.com/macros/s/AKfycbyd286a52padrjQGp1Qm8cb-OPZOuyNQ8ak3-B5cqqHg3HuLXbhd1jPPz2q6QrSl46emw/exec',

  /* ── 教學 PDF 文件連結 ── */
  DOCS: {
    WINDOWS: 'https://drive.google.com/file/d/11IYN9LHEiNRf1gf496jfv83ikd_GxIsd/view?usp=sharing',
    MAC:     'https://drive.google.com/file/d/1nrq01pIF-LKZlUVpZPz02g99Yu56KSlT/view?usp=sharing'
  },

  /* ── Chatbot 回覆文字 ── */
  RESPONSES: {
    WELCOME:
      '您好！我是**逢甲福星宿舍網路報修助理** 🔧\n' +
      '您可以直接輸入問題，或點選下方按鈕選擇服務：',

    TEACH_CHOOSE:
      '請選擇您的電腦系統：',

    TEACH_WINDOWS:
      '📄 **Windows 網路教學文件**\n\n' +
      '[點此開啟 Windows 教學 PDF（Google Drive）]({WINDOWS_URL})\n\n' +
      'WiFi 分享器設定請依照**該機種的說明書**操作。\n\n' +
      '如果看完文件還是無法解決，請選擇「我需要協助」。',

    TEACH_MAC:
      '📄 **Mac 網路教學文件**\n\n' +
      '[點此開啟 Mac 教學 PDF（Google Drive）]({MAC_URL})\n\n' +
      'WiFi 分享器設定請依照**該機種的說明書**操作。\n\n' +
      '如果看完文件還是無法解決，請選擇「我需要協助」。',

    SETTING_HEADER:
      '📋 **常見問題**',

    SETTING_ITEMS: [
      '**fcu、fcu auto 帳號與密碼**\n帳號 = 你的學號　密碼 = 你的 NID 密碼',
      '**使用 USB 轉接器（RJ45 to USB-A 或 RJ45 to USB-C）沒有網路？**\n請上網搜尋您的**轉接器型號**，下載並安裝最新驅動程式或韌體。\n大多數轉接器問題可透過更新驅動程式解決。',
      '**寢室收不到學校 WiFi 訊號**\n學校 WiFi 只在公共區域提供，故寢室無法接收到訊號。',
      '**冷氣電費儲值相關問題**\n冷氣電費儲值相關問題請洽服務台詢問，謝謝。'
    ],

    REPORT_TRIGGER:
      '好的，我來協助您填寫報修單 🔧\n請填寫以下資料，網管人員收到後會與您聯絡。',

    NON_NETWORK:
      '⚠️ 您描述的問題不在網管業務範圍內。\n\n' +
      '請至**宿舍服務台**或透過**行動逢甲 App** 進行通報，謝謝！',

    UNKNOWN:
      '抱歉，我目前無法理解您的問題或提供相關答案 🙏\n\n' +
      '您可以嘗試換個方式描述，或點選下方按鈕選擇服務：',

    REPORT_SUCCESS:
      '✅ **報修單已成功送出！**\n\n' +
      '感謝您的回報，網管人員會盡快與您聯絡。\n' +
      '如有緊急需求，也歡迎直接至宿舍服務台反映。',

    REPORT_ERROR:
      '⚠️ 送出時發生問題，請稍後再試，或至宿舍服務台直接通報。',

    GAS_NOT_CONFIGURED:
      '⚠️ 系統尚未完成後端設定。\n請使用下方按鈕或聯繫網管人員。',

    /**
     * 低信心確認提示（needsConfirmation: true 時使用）
     * 使用方式：將 {INTENT_LABEL} 替換為對應的中文標籤
     */
    CONFIRM_HINT:
      '🤔 我不太確定，你是不是想要「{INTENT_LABEL}」？\n請選擇或重新描述問題：',

    /* ── Teams 聯絡 ── */

    /** Header 右上角常駐連結文字 */
    TEAMS_HEADER_LINK: '聯絡真人',

    /** 點擊 Teams 連結後，在聊天區顯示的備援步驟說明 */
    TEAMS_FALLBACK:
      '💬 **Teams 備援步驟**\n\n' +
      '如果 Teams App 沒有自動開啟，請手動操作：\n\n' +
      '➡️ 登入學校帳號\n' +
      '➡️ 點擊上方搜尋框\n' +
      '➡️ 搜尋「**福星宿舍網路報修平台**」\n\n' +
      '點擊下方按鈕一鍵複製帳號名稱：',

    /** 複製成功的提示文字 */
    TEAMS_COPY_SUCCESS: '✅ 已複製！請貼到 Teams 搜尋框',

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
   * prefilledMessage：開啟 Teams 聊天時的預填文字（可留空字串）
   *
   * App Store / Play Store / 網頁版 URL：
   *   當裝置未安裝 Teams App 時（2.5 秒偵測不到 App 被喚起），依平台跳轉的備援連結
   */
  TEAMS: Object.freeze({
    contactEmail:     'desk_dorm@o365.fcu.edu.tw',
    prefilledMessage: '你好，我需要網路報修協助',
    APP_STORE_URL:    'https://apps.apple.com/app/microsoft-teams/id1113153706',
    PLAY_STORE_URL:   'https://play.google.com/store/apps/details?id=com.microsoft.teams',
    WEB_URL:          'https://teams.microsoft.com'
  })
});

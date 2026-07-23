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

    SETTING:
      '📋 **常見問題**\n\n' +
      '**1️⃣ fcu、fcu auto 帳號與密碼**\n' +
      '帳號 = 你的學號　密碼 = 你的 NID 密碼\n\n' +
      '**2️⃣ 使用 USB 轉接器（RJ45 to USB-A 或 RJ45 to USB-C）沒有網路？**\n' +
      '請上網搜尋您的**轉接器型號**，下載並安裝最新驅動程式或韌體。\n' +
      '大多數轉接器問題可透過更新驅動程式解決。\n\n' +
      '**3️⃣ 寢室收不到學校 WiFi 訊號**\n' +
      '學校 WiFi 只在公共區域提供，故寢室無法接收到訊號。\n\n' +
      '**4️⃣ 冷氣電費儲值相關問題**\n' +
      '冷氣電費儲值相關問題請洽服務台詢問，謝謝。\n\n' +
      '如果問題持續，可以選擇「我需要協助」。',

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
      '⚠️ 系統尚未完成後端設定。\n請使用下方按鈕或聯繫網管人員。'
  }
});

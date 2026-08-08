/* ============================================================
   config.js — 全域設定檔（雙語鏡像結構版）
   - RESPONSES / BUTTON_LABELS / INTENT_LABELS / SETTING_ITEMS
     全部採 { zh: {...}, en: {...} } 鏡像物件，維護獨立純淨的文字。
   ============================================================ */
'use strict';

const CONFIG = Object.freeze({
  GAS_URL: 'https://script.google.com/macros/s/AKfycbw9EUOHrcSvlAA72gAeq7Mz3HsBWqIR0BjeoFeWbIs7FpilYjgb2vCF0iOwA1NL_8sbjw/exec',
  RECAPTCHA_SITE_KEY: '6LehknstAAAAAPmlQlfjbI5nnbLY2fBrnmkXOcqI',

  DOCS: Object.freeze({
    WINDOWS: 'https://drive.google.com/file/d/11IYN9LHEiNRf1gf496jfv83ikd_GxIsd/view?usp=sharing',
    MAC: 'https://drive.google.com/file/d/1nrq01pIF-LKZlUVpZPz02g99Yu56KSlT/view?usp=sharing'
  }),

  /* ── Chatbot 回覆文字（雙語鏡像結構）── */
  RESPONSES: Object.freeze({
    zh: Object.freeze({
      WELCOME:
        '您好！我是逢甲福星宿舍網路報修助理 🔧\n' +
        '您可以直接輸入問題，或點選下方按鈕選擇服務：\n' +
        '_💡 您的訊息將用於 AI 意圖辨識，以便提供精準回覆，不會用於其他用途。_',
      TEACH_CHOOSE: '請選擇您的電腦系統：',
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
      SETTING_HEADER: '📋 **常見問題**',
      SETTING_ITEMS: Object.freeze({
        ACCOUNT: '**fcu、fcu auto 帳號與密碼**\n帳號 = 你的學號 密碼 = 你的 NID 密碼',
        ADAPTER:
          '**使用 USB 轉接器（RJ45 to USB-A 或 RJ45 to USB-C）沒有網路？**\n' +
          '請上網搜尋您的**轉接器型號**，下載並安裝最新驅動程式或韌體。\n' +
          '大多數轉接器問題可透過更新驅動程式解決。',
        WIFI_SIGNAL:
          '**寢室收不到學校 WiFi 訊號**\n學校 WiFi 只在公共區域提供，故寢室無法接收到訊號。',
        AC_BILLING:
          '**冷氣電費儲值相關問題**\n冷氣電費儲值相關問題請洽服務台詢問，謝謝。'
      }),
      REPORT_TRIGGER:
        '好的，我來協助您填寫報修單 🔧\n請填寫以下資料，網管人員收到後會與您聯絡。',
      NON_NETWORK:
        '⚠️ 您描述的問題不在網管業務範圍內。\n\n請至**宿舍服務台**或透過**行動逢甲 App** 進行通報，謝謝！',
      UNKNOWN:
        '抱歉，我不太確定您想詢問的內容 🙏\n\n您可以換個方式描述，或點選下方按鈕選擇服務：',
      SYSTEM_ERROR:
        '抱歉，目前服務暫時無法回應（系統忙碌中）🙏\n\n請稍後再試，或點選下方按鈕選擇服務：',
      REPORT_SUCCESS:
        '✅ **報修單已成功送出！**\n\n感謝您的回報，網管人員會盡快與您聯絡。\n如有緊急需求，也歡迎直接至宿舍服務台反映。',
      REPORT_ERROR:
        '⚠️ 送出時發生問題，請稍後再試，或至宿舍服務台直接通報。',
      GAS_NOT_CONFIGURED:
        '⚠️ 系統尚未完成後端設定。\n請使用下方按鈕或聯繫網管人員。',
      CONFIRM_HINT:
        '🤔 我不太確定，你是不是想要「{INTENT_LABEL}」？\n請選擇或重新描述問題：',
      BACK_TO_MAIN: '還有其他問題嗎？請選擇：',
      TEAMS_HEADER_LINK: '聯絡我們',
      TEAMS_FALLBACK:
        '💬 **Teams 備援步驟**\n\n如果 Teams App 沒有自動開啟，請手動操作：\n\n' +
        '➡️ 登入學校帳號\n➡️ 點擊上方搜尋框\n➡️ 搜尋「**福星宿舍網路報修平台**」\n\n' +
        '點擊下方按鈕一鍵複製帳號名稱：',
      TEAMS_COPY_SUCCESS: '✅ 已複製！請貼到 Teams 搜尋框',
      TEAMS_ACCOUNT_NAME: '福星宿舍網路報修平台',
      VALIDATION: Object.freeze({
        NAME_REQUIRED: '請輸入姓名',
        STUDENT_ID_FORMAT: '學號格式錯誤（需為 1 位英文字母 + 7 位數字，例如：D1234567）',
        ROOM_REQUIRED: '請輸入房號',
        BED_FORMAT: '床號格式錯誤（需為 1–3 位數字）',
        PHONE_FORMAT: '手機號碼格式錯誤（需為 10 位數字）',
        REPAIR_TIME_RANGE: '可維修時間必須在 0–23 時與 0–59 分之間',
        DESCRIPTION_REQUIRED: '請描述您的網路問題'
      })
    }),
    en: Object.freeze({
      WELCOME:
        'Hello! I\'m the FCU Fuxing Dormitory Network Repair Assistant 🔧\n' +
        'Type your question or tap a button below to get started.\n' +
        '_💡 Your messages are used only for AI intent recognition and not for any other purpose._',
      TEACH_CHOOSE: 'Please select your operating system:',
      TEACH_WINDOWS:
        '📄 **Windows Network Setup Guide**\n\n' +
        '[Open Windows PDF (Google Drive)]({WINDOWS_URL})\n\n' +
        'For WiFi router setup, follow the manual of your specific device.\n\n' +
        'If the guide doesn\'t resolve your issue, tap "I Need Help".',
      TEACH_MAC:
        '📄 **Mac Network Setup Guide**\n\n' +
        '[Open Mac PDF (Google Drive)]({MAC_URL})\n\n' +
        'For WiFi router setup, follow the manual of your specific device.\n\n' +
        'If the guide doesn\'t resolve your issue, tap "I Need Help".',
      SETTING_HEADER: '📋 **Frequently Asked Questions**',
      SETTING_ITEMS: Object.freeze({
        ACCOUNT: '**fcu / fcu auto Account**\nAccount: Student ID | Password: NID password',
        ADAPTER:
          '**No internet with USB Adapter (RJ45 to USB-A / USB-C)?**\n' +
          'Search for your adapter model online and install the latest driver or firmware.\n' +
          'Most adapter issues can be resolved by updating drivers.',
        WIFI_SIGNAL:
          '**Cannot receive school WiFi in dorm room**\nSchool WiFi is only available in public areas; dormitory rooms are not covered.',
        AC_BILLING:
          '**Air Conditioning Billing & Top-up**\nFor AC billing and top-up inquiries, please contact the dormitory service desk.'
      }),
      REPORT_TRIGGER:
        'Sure! Let me help you fill out a repair request 🔧\nPlease complete the form below; our network admin will contact you.',
      NON_NETWORK:
        '⚠️ The issue you described is outside the network admin scope.\nPlease report it at the **dormitory service desk** or via the **FCU Mobile App**. Thank you!',
      UNKNOWN:
        'Sorry, I\'m not quite sure what you\'re asking 🙏\nTry rephrasing, or tap a button below to choose a service:',
      SYSTEM_ERROR:
        'Sorry, the service is temporarily unavailable (system busy) 🙏\nPlease try again later, or tap a button below:',
      REPORT_SUCCESS:
        '✅ **Repair request submitted successfully!**\nThank you for your report. Our network admin will contact you soon.\nFor urgent matters, please visit the dormitory service desk directly.',
      REPORT_ERROR:
        'An error occurred during submission. Please try again or visit the dormitory service desk.',
      GAS_NOT_CONFIGURED:
        '⚠️ Backend not configured yet.\nPlease use the buttons below or contact the network admin.',
      CONFIRM_HINT:
        '🤔 I\'m not sure — did you mean "{INTENT_LABEL}"?\nPlease choose or rephrase your question:',
      BACK_TO_MAIN: 'Any other questions? Please choose:',
      TEAMS_HEADER_LINK: 'Contact Us',
      TEAMS_FALLBACK:
        '💬 **Teams Fallback Steps**\n\nIf Teams App did not open automatically, follow these steps:\n\n' +
        '➡️ Sign in with your school account\n➡️ Tap the search bar at the top\n' +
        '➡️ Search for **"Fuxing Dorm Network Support"**\n\nTap the button below to copy the account name:',
      TEAMS_COPY_SUCCESS: '✅ Copied! Paste into the Teams search bar',
      TEAMS_ACCOUNT_NAME: '福星宿舍網路報修平台',
      VALIDATION: Object.freeze({
        NAME_REQUIRED: 'Please enter your name',
        STUDENT_ID_FORMAT: 'Invalid Student ID (Format: 1 letter + 7 digits, e.g. D1234567)',
        ROOM_REQUIRED: 'Please enter your room number',
        BED_FORMAT: 'Invalid Bed Number (1-3 digits required)',
        PHONE_FORMAT: 'Invalid Mobile Number (10 digits required)',
        REPAIR_TIME_RANGE: 'Available time must be between 0-23 hours and 0-59 minutes',
        DESCRIPTION_REQUIRED: 'Please describe your network issue'
      })
    })
  }),

  /* ── 按鈕文字（雙語鏡像結構）── */
  BUTTON_LABELS: Object.freeze({
    zh: Object.freeze({
      TEACH: '教學',
      SETTING: '常見問題',
      REPORT: '我要實體協助、報修',
      TEACH_WIN: 'Windows 系統',
      TEACH_MAC: 'Mac 系統',
      NEED_HELP: '我需要協助',
      BACK_MAIN: '回到主選單',
      OPEN_REPORT: '開啟報修表單',
      VIEW_ALL_FAQ: '查看所有常見問題',
      TEAMS_COPY: '複製「福星宿舍網路報修平台」',
      CONFIRM_YES_PREFIX: '是 —'
    }),
    en: Object.freeze({
      TEACH: 'Tutorials',
      SETTING: 'FAQ',
      REPORT: 'Request On-site Help',
      TEACH_WIN: 'Windows',
      TEACH_MAC: 'Mac',
      NEED_HELP: 'I Need Help',
      BACK_MAIN: 'Back to Main Menu',
      OPEN_REPORT: 'Open Repair Form',
      VIEW_ALL_FAQ: 'View All FAQs',
      TEAMS_COPY: 'Copy Account Name',
      CONFIRM_YES_PREFIX: 'Yes —'
    })
  }),

  INTENT_LABELS: Object.freeze({
    zh: Object.freeze({
      BUTTON_TEACH: '網路教學',
      BUTTON_SETTING: '常見問題',
      BUTTON_REPORT: '我要協助報修',
      STICKER_PORT: '貼紙/網路孔報修',
      NON_NETWORK: '非網管問題',
      UNKNOWN: '其他'
    }),
    en: Object.freeze({
      BUTTON_TEACH: 'Network Tutorial',
      BUTTON_SETTING: 'FAQ',
      BUTTON_REPORT: 'Repair Request',
      STICKER_PORT: 'Port/Sticker Issue',
      NON_NETWORK: 'Non-network Issue',
      UNKNOWN: 'Other'
    })
  }),

  TEAMS: Object.freeze({
    contactEmail: 'desk_dorm@o365.fcu.edu.tw',
    prefilledMessage: '',
    APP_STORE_URL: 'https://apps.apple.com/app/microsoft-teams/id1113153706',
    PLAY_STORE_URL: 'https://play.google.com/store/apps/details?id=com.microsoft.teams',
    WEB_URL: 'https://teams.microsoft.com'
  })
});

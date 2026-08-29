/* ============================================================
   i18n.js — 雙語（中/英）介面切換模組
   - 管理靜態 UI 外殼文字（header / footer / modal / form 標籤與 aria-label）
   - 語言偏好存於 localStorage，key: fcu_ne_lang
   - 動態聊天內容（CONFIG.RESPONSES）由 config.js 自行依 I18N.getLang() 取值，
     不透過本模組的 STRINGS 字典
   ============================================================ */
'use strict';

/* exported I18N */
const I18N = (() => {
  const STORAGE_KEY = 'fcu_ne_lang';
  const DEFAULT_LANG = 'zh';
  const SUPPORTED = ['zh', 'en'];

  let currentLang = DEFAULT_LANG;

  /* ── 靜態 UI 外殼文字字典 ── */
  const STRINGS = {
    zh: {
      'header.title': '逢甲福星宿舍網路報修助理',
      'header.subtitle': 'FCU Fuxing Dormitory Network Support',
      'header.counter.prefix': '已協助',
      'header.counter.suffix': '人',
      'header.counter.aria': '累積服務人數',
      'teams.button': '聯絡我們',
      'teams.aria': '使用 Teams 聯絡網管（福星宿舍網路報修平台）',
      'teams.title': '使用 Microsoft Teams 聯絡福星宿舍網路報修平台',
      'input.placeholder': '輸入訊息，或點擊上方按鈕選擇服務...',
      'input.aria': '輸入訊息',
      'send.aria': '送出訊息',
      'modal.title': '🔧 報修通報',
      'modal.subtitle': '請留下資料，系統將為您送出通報。',
      'modal.close.aria': '關閉報修表單',
      'form.name.label': '姓名',
      'form.name.placeholder': '請輸入您的姓名',
      'form.studentId.label': '學號',
      'form.studentId.placeholder': '例：D1234567',
      'form.room.label': '房號',
      'form.room.placeholder': '例：A123',
      'form.bed.label': '床號',
      'form.bed.placeholder': '例：1',
      'form.phone.label': '手機號碼',
      'form.phone.placeholder': '例：0912345678',
      'form.repairTime.label': '可維修時間',
      'form.repairTime.range': '可維修時間範圍',
      'form.repairTime.startHour.aria': '開始小時（0-23）',
      'form.repairTime.startMin.aria': '開始分鐘（0-59）',
      'form.repairTime.endHour.aria': '結束小時（0-23）',
      'form.repairTime.endMin.aria': '結束分鐘（0-59）',
      'form.repairTime.hour.placeholder': '時',
      'form.repairTime.min.placeholder': '分',
      'form.repairTime.sep': '─',
      'form.repairTime.hint':
        '⏰ 可維修時間請填寫 <strong>18:00–21:00</strong> 之間（本人需在場）。新生入住期間 12:00–17:00 收到後會盡速前往協助。',
      'form.description.label': '問題描述',
      'form.description.placeholder':
        '請詳細描述您遇到的網路問題，例如：網路連不上、IP 貼紙缺漏、網路孔故障等...',
      'form.required.aria': '必填',
      'form.cancel': '取消',
      'form.submit': '送出報修',
      'footer.note':
        '本服務由 <a href="https://github.com/chinglin-k" target="_blank" rel="noopener noreferrer">@chinglin-k</a> 提供 · 僅限逢甲大學福星宿舍網路相關問題',
      'recaptcha.disclosure':
        '本網站受 reCAPTCHA 保護，並適用 Google <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">隱私權政策</a>與<a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">服務條款</a>。',
      'langToggle.aria': '切換語言為 English',
      'langToggle.label': 'EN',
      'typing.aria': '正在輸入',
      'query.modal.title': '🔍 查詢報修案件',
      'query.modal.subtitle': '請輸入學號以查詢您的報修進度。',
      'query.modal.close.aria': '關閉查詢視窗',
      'query.studentId.label': '學號',
      'query.studentId.placeholder': '例：D1234567',
      'query.submit': '查詢',
      'query.cancel': '取消',
      'wifi.modal.title': '📡 Wi-Fi 機設定教學',
      'wifi.modal.subtitle': '請依步驟完成設定，如有疑問請聯絡網管。',
      'wifi.modal.close.aria': '關閉 Wi-Fi 機教學',
      'wifi.step1.title': '連接電源與網路線',
      'wifi.step1.desc': '將 Wi-Fi 機的電源線接上插座，並將網路線插入 Wi-Fi 機的 <strong>WAN 孔</strong>。',
      'wifi.step2.title': '連接裝置',
      'wifi.step2.li1': '<strong>使用電腦：</strong>將另一條網路線一端接到電腦，另一端接到 Wi-Fi 機的 <strong>LAN 孔</strong>。',
      'wifi.step2.li2': '<strong>使用手機：</strong>進入手機「設定」➡️「Wi-Fi」，搜尋並連接該 Wi-Fi 機的無線網路。',
      'wifi.step3.title': '進入後台管理介面',
      'wifi.step3.desc': '開啟瀏覽器，在網址列輸入 Wi-Fi 機背面標示的<strong>後台管理網址</strong>，即可進入設定頁面。',
      'wifi.step4.title': '設定路由器模式與固定 IP',
      'wifi.step4.li1': '在後台介面中選擇「<strong>路由器模式</strong>」',
      'wifi.step4.li2': '找到「<strong>設定 IP 介面</strong>」選項',
      'wifi.step4.li3': '選擇「<strong>固定 IP</strong>」，並依照網路孔旁貼紙上標示的資訊完整填寫',
      'wifi.modal.cancel': '關閉'
    },
    en: {
      'header.title': 'FCU Fuxing Dormitory Network Repair Assistant',
      'header.subtitle': 'FCU Fuxing Dormitory Network Support',
      'header.counter.prefix': 'Served',
      'header.counter.suffix': 'users',
      'header.counter.aria': 'Total Users Served',
      'teams.button': 'Contact Us',
      'teams.aria': 'Contact Network Admin via Teams (FCU Fuxing Dorm Network Support Platform)',
      'teams.title': 'Contact FCU Fuxing Dorm Network Support via Microsoft Teams',
      'input.placeholder': 'Type a message or tap a button above...',
      'input.aria': 'Enter message',
      'send.aria': 'Send message',
      'modal.title': '🔧 Submit Repair Request',
      'modal.subtitle': 'Fill in your details and we will submit your request.',
      'modal.close.aria': 'Close Repair Form',
      'form.name.label': 'Full Name',
      'form.name.placeholder': 'Enter your full name',
      'form.studentId.label': 'Student ID',
      'form.studentId.placeholder': 'e.g. D1234567',
      'form.room.label': 'Room No.',
      'form.room.placeholder': 'e.g. A123',
      'form.bed.label': 'Bed No.',
      'form.bed.placeholder': 'e.g. 1',
      'form.phone.label': 'Mobile Number',
      'form.phone.placeholder': 'e.g. 0912345678',
      'form.repairTime.label': 'Available Repair Time',
      'form.repairTime.range': 'Available repair time range',
      'form.repairTime.startHour.aria': 'Start Hour (0-23)',
      'form.repairTime.startMin.aria': 'Start Minute (0-59)',
      'form.repairTime.endHour.aria': 'End Hour (0-23)',
      'form.repairTime.endMin.aria': 'End Minute (0-59)',
      'form.repairTime.hour.placeholder': 'hh',
      'form.repairTime.min.placeholder': 'mm',
      'form.repairTime.sep': 'to',
      'form.repairTime.hint':
        '⏰ Please indicate availability between <strong>18:00–21:00</strong> (you must be present). During freshman move-in, 12:00–17:00 requests will be attended to ASAP.',
      'form.description.label': 'Issue Description',
      'form.description.placeholder':
        'Describe your network issue, e.g. no internet, missing IP label, broken port...',
      'form.required.aria': 'Required',
      'form.cancel': 'Cancel',
      'form.submit': 'Submit Request',
      'footer.note':
        'Provided by <a href="https://github.com/chinglin-k" target="_blank" rel="noopener noreferrer">@chinglin-k</a> · For FCU Fuxing Dormitory network issues only',
      'recaptcha.disclosure':
        'This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.',
      'langToggle.aria': 'Switch language to Chinese',
      'langToggle.label': '中',
      'typing.aria': 'Typing',
      'query.modal.title': '🔍 Check Repair Cases',
      'query.modal.subtitle': 'Enter your Student ID to check your repair progress.',
      'query.modal.close.aria': 'Close query window',
      'query.studentId.label': 'Student ID',
      'query.studentId.placeholder': 'e.g. D1234567',
      'query.submit': 'Search',
      'query.cancel': 'Cancel',
      'wifi.modal.title': '📡 Wi-Fi Router Setup Guide',
      'wifi.modal.subtitle': 'Follow the steps to complete setup. Contact network admin if needed.',
      'wifi.modal.close.aria': 'Close Wi-Fi Router Guide',
      'wifi.step1.title': 'Connect Power & Network Cable',
      'wifi.step1.desc': 'Plug the Wi-Fi router\'s power cable into a socket, then insert the network cable into the router\'s <strong>WAN port</strong>.',
      'wifi.step2.title': 'Connect Your Device',
      'wifi.step2.li1': '<strong>Computer:</strong> Connect one end of another network cable to your computer, and the other end to the router\'s <strong>LAN port</strong>.',
      'wifi.step2.li2': '<strong>Phone:</strong> Go to Settings ➡️ Wi-Fi, search for and connect to the router\'s wireless network.',
      'wifi.step3.title': 'Open the Admin Interface',
      'wifi.step3.desc': 'Open a browser and enter the <strong>admin URL</strong> printed on the back of the router to access the settings page.',
      'wifi.step4.title': 'Set Router Mode & Static IP',
      'wifi.step4.li1': 'Select <strong>Router Mode</strong> in the admin interface',
      'wifi.step4.li2': 'Find the <strong>IP Settings</strong> option',
      'wifi.step4.li3': 'Choose <strong>Static IP</strong> and fill in the details from the sticker next to the network port',
      'wifi.modal.cancel': 'Close'
    }
  };

  function _detectInitialLang() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch (_e) {
      /* localStorage 被封鎖（無痕模式等）：忽略，改用預設語言 */
    }
    return DEFAULT_LANG;
  }

  /** 取得目前語言的字串（找不到 key 時 fallback 回中文，再 fallback 回 key 本身） */
  function t(key) {
    return (STRINGS[currentLang] && STRINGS[currentLang][key]) || STRINGS[DEFAULT_LANG][key] || key;
  }

  function getLang() { return currentLang; }

  /** 掃描並套用 data-i18n 系列屬性到 DOM */
  function _applyToDom() {
    document.documentElement.setAttribute('lang', currentLang === 'zh' ? 'zh-TW' : 'en');

    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.innerHTML = t(el.getAttribute('data-i18n'));
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria-label')));
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
    });

    const toggleBtn = document.getElementById('lang-toggle-btn');
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-label', t('langToggle.aria'));
      toggleBtn.setAttribute('aria-pressed', currentLang === 'en' ? 'true' : 'false');
      const labelEl = toggleBtn.querySelector('.lang-toggle-label');
      if (labelEl) labelEl.textContent = t('langToggle.label');
    }

    // 讓 chat.js / report.js 等模組知道語言已變更，可重繪「目前這一輪」的動態文字
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: currentLang } }));
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang) || lang === currentLang) return;
    currentLang = lang;
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch (_e) { /* ignore */ }
    _applyToDom();
  }

  function toggle() {
    setLang(currentLang === 'zh' ? 'en' : 'zh');
  }

  function init() {
    currentLang = _detectInitialLang();
    _applyToDom();
    document.getElementById('lang-toggle-btn')?.addEventListener('click', toggle);
  }

  return { init, t, getLang, setLang, toggle };
})();

document.addEventListener('DOMContentLoaded', () => I18N.init());

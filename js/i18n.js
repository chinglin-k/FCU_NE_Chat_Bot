/* ============================================================
   i18n.js — 雙語（中/英）介面切換模組
   - 管理靜態 UI 外殼文字（header / footer / modal / form 標籤與 aria-label）
   - 語言偏好存於 localStorage，key: fcu_ne_lang
   - 動態聊天內容（CONFIG.RESPONSES）由 config.js 自行依 I18N.getLang() 取值
   ============================================================ */
'use strict';

const I18N = (() => {
  const STORAGE_KEY = 'fcu_ne_lang';
  const DEFAULT_LANG = 'zh';
  const SUPPORTED = ['zh', 'en'];

  let currentLang = DEFAULT_LANG;

  /* ── 靜態 UI 外殼與歡迎訊息文字字典 ── */
  const STRINGS = {
    zh: {
      'welcome':
        '您好！我是逢甲福星宿舍網路報修助理 🔧\n' +
        '您可以直接輸入問題，或點選下方按鈕選擇服務：\n' +
        '_💡 您的訊息將用於 AI 意圖辨識，以便提供精準回覆，不會用於其他用途。_',
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
      'form.bed.label': '床號',
      'form.phone.label': '手機號碼',
      'form.repairTime.label': '可維修時間',
      'form.repairTime.startHour.aria': '開始小時（0-23）',
      'form.repairTime.startMin.aria': '開始分鐘（0-59）',
      'form.repairTime.endHour.aria': '結束小時（0-23）',
      'form.repairTime.endMin.aria': '結束分鐘（0-59）',
      'form.repairTime.hint':
        '⏰ 可維修時間請填寫 <strong>18:00–21:00</strong> 之間（本人需在場）。新生入住期間 12:00–17:00 收到後會盡速前往協助。',
      'form.description.label': '問題描述',
      'form.description.placeholder':
        '請詳細描述您遇到的網路問題，例如：網路連不上、IP 貼紙缺漏、網路孔故障等...',
      'form.required.aria': '必填',
      'form.cancel': '取消',
      'form.submit': '送出報修',
      'success.title': '報修成功！',
      'success.desc': '感謝您的回報，<br>網管人員收到後會盡快與您聯絡。',
      'footer.note':
        '本服務由 <a href="https://github.com/chinglin-k" target="_blank" rel="noopener noreferrer">@chinglin-k</a> 提供 · 僅限逢甲大學福星宿舍網路相關問題',
      'recaptcha.disclosure':
        '本網站受 reCAPTCHA 保護，並適用 Google <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">隱私權政策</a>與<a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">服務條款</a>。',
      'langToggle.aria': '切換語言 / Switch Language',
      'langToggle.label': '中 / EN',
      'typing.aria': '正在輸入'
    },
    en: {
      'welcome':
        'Hello! I\'m the FCU Fuxing Dormitory Network Repair Assistant 🔧\n' +
        'Type your question or tap a button below to get started.\n' +
        '_💡 Your messages are used only for AI intent recognition and not for any other purpose._',
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
      'form.bed.label': 'Bed No.',
      'form.phone.label': 'Mobile Number',
      'form.repairTime.label': 'Available Repair Time',
      'form.repairTime.startHour.aria': 'Start Hour (0-23)',
      'form.repairTime.startMin.aria': 'Start Minute (0-59)',
      'form.repairTime.endHour.aria': 'End Hour (0-23)',
      'form.repairTime.endMin.aria': 'End Minute (0-59)',
      'form.repairTime.hint':
        '⏰ Please indicate availability between <strong>18:00–21:00</strong> (you must be present). During freshman move-in, 12:00–17:00 requests will be attended to ASAP.',
      'form.description.label': 'Issue Description',
      'form.description.placeholder':
        'Describe your network issue, e.g. no internet, missing IP label, broken port...',
      'form.required.aria': 'Required',
      'form.cancel': 'Cancel',
      'form.submit': 'Submit Request',
      'success.title': 'Request Submitted!',
      'success.desc': 'Thank you! Our network admin<br>will contact you shortly.',
      'footer.note':
        'Provided by <a href="https://github.com/chinglin-k" target="_blank" rel="noopener noreferrer">@chinglin-k</a> · For FCU Fuxing Dormitory network issues only',
      'recaptcha.disclosure':
        'This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> apply.',
      'langToggle.aria': 'Switch Language / 切換語言',
      'langToggle.label': '中 / EN',
      'typing.aria': 'Typing'
    }
  };

  function _detectInitialLang() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch (e) {
      /* localStorage 被封鎖：忽略 */
    }
    return DEFAULT_LANG;
  }

  function _escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function parseMarkdown(text) {
    if (!text) return '';
    let html = _escapeHTML(text);
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      const escapedUrl = _escapeHTML(url);
      if (escapedUrl.startsWith('http://') || escapedUrl.startsWith('https://')) {
        return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="chat-link">${linkText}</a>`;
      }
      return linkText;
    });
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\_([^_]+)\_/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  /** 取得目前語言的字串 */
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

    document.querySelectorAll('[data-i18n-markdown]').forEach(el => {
      const key = el.getAttribute('data-i18n-markdown');
      el.innerHTML = parseMarkdown(t(key));
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

    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: currentLang } }));
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang) || lang === currentLang) return;
    currentLang = lang;
    try { window.localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
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

  return { init, t, parseMarkdown, getLang, setLang, toggle };
})();

document.addEventListener('DOMContentLoaded', () => I18N.init());

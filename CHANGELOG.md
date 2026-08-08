# 更新日誌 (Changelog)

所有本專案的重要變更皆將記錄於此文件中。

**版本 / Version**：v1.2.0 (Spec v3.2)  
**最後更新 / Last Updated**：2026-08-08

---

## [v1.2.0] - 2026-08-08 (i18n Interface Separation & reCAPTCHA Disclosure)

### 🌐 多語言介面分離與切換 (i18n Interface Separation)
- **獨立 i18n 模組 (`js/i18n.js`)**：建立 DOM 靜態外殼掃描器 (data-i18n 系列屬性)，提供 `I18N` 全域控制，支援 `localStorage` (`fcu_ne_lang`) 偏好持久化與 `<html lang>` 即時切換。
- **圓形懸浮切換按鈕 (`#lang-toggle-btn`)**：新增於聊天介面右上角，採 `rem` 相對單位與 44px 無障礙觸控大小 (WCAG 2.5.5)，支援 640px/360px 響應式佈局。
- **雙語鏡像結構重構 (`js/config.js`)**：`RESPONSES`、`SETTING_ITEMS`、`INTENT_LABELS` 與 `BUTTON_LABELS` 全面轉換為 `{ zh: {...}, en: {...} }` 獨立純淨雙語結構，澈底淘汰 `text-en` 與「中文 / English」寫死雙語標記。
- **動態組件對齊 (`js/chat.js`, `js/report.js`)**：所有訊息與按鈕動態文字均依據 `I18N.getLang()` 即時呈現。

### 🛡️ reCAPTCHA 合規揭露 (reCAPTCHA ToS Compliance)
- **CSS 隱藏浮動徽章**：`.grecaptcha-badge` 設定為 CSS 隱藏，提升行動裝置與畫面視覺體驗。
- **頁尾合規條款揭露**：依據 Google reCAPTCHA 服務條款硬性規定，於頁尾 `.footer-note` 後新增雙語揭露段落 `.recaptcha-disclosure`（內含 Google 隱私權政策與服務條款官方連結）。

---

## [v1.1.0] - 2026-08-08 (Security Hardening & Full Documentation Alignment)

### 🛡️ 資安與反濫用防禦 (Security & Anti-Abuse)
- **POST Body 通訊**：敏感個資與使用者輸入文字全數切換至 `doPost` (text/plain)。
- **reCAPTCHA v3 隱形驗證**：於報修表單整合 Google reCAPTCHA v3 隱形驗證（風險分數門檻 score ≥ 0.5）。
- **一次性 Session Token**：`get_token` 發放 120 秒短效 Token。
- **Client ID 雙層流量限制**：`localStorage` (`fcu_client_id`) 跨頁面識別，CacheService 雙層限流（`classify`: 12/60, `report`: 5/20）。

---

## [v1.0.0] - 2026-07-27 (Initial Release)

- 初次發布逢甲大學福星宿舍網路報修 Chatbot 系統。

# 開發待辦清單（todo.md）

**版本 / Version**：v1.2.0 (Spec v3.2)  
**最後更新 / Last Updated**：2026-08-08

---

## MVP 優先（可送出報修並寫入試算表）

| 優先級 | 功能 | 狀態 | 說明 |
|---|---|---|---|
| P0 | 選項按鈕介面 | ✅ Done | 教學 / 常見設定 / 報修三按鈕 |
| P0 | 報修表單收集與驗證 | ✅ Done | 七欄位 + 時間純文字提示 |
| P0 | GAS 試算表寫入 | ✅ Done | `writeReport()` |
| P0 | Google Apps Script 部署 | ✅ Done | GAS_URL 已填入 |
| P1 | LLM 語意分析（Gemini） | ✅ Done | `classifyIntent()` 九模型自動備援 |
| P1 | 意圖分類串接前端 | ✅ Done | `intent.js` |
| P1 | 教學文件回覆 | ✅ Done | Windows / Mac PDF 連結 |
| P1 | 常見問題回覆 | ✅ Done | 轉接器韌體建議、WiFi 帳號密碼等常見問題 |
| P2 | 非網管問題轉介 | ✅ Done | 宿舍服務台 / 行動逢甲 |
| P2 | 累積使用人數統計 | ✅ Done | `counter.js` + GAS |
| P3 | GitHub Pages 部署 | ✅ Done | PR → main → Pages 已上線 |

---

## F 輪：中英文介面分離與 reCAPTCHA 合規揭露（2026-08-08）

| 功能 | 狀態 | 說明 |
|---|---|---|
| 中/英文介面分離與懸浮切換按鈕 | ✅ Done | 建立 `js/i18n.js`，於 `.chat-main` 右上角新增懸浮按鈕 (`#lang-toggle-btn`) |
| 雙語鏡像結構重構 (`js/config.js`) | ✅ Done | `RESPONSES`、`SETTING_ITEMS`、`INTENT_LABELS`、`BUTTON_LABELS` 重構為 `{ zh, en }` 結構 |
| DOM 靜態外殼掃描器 | ✅ Done | `index.html` 移除 `text-en` 合併寫法，全面套用 `data-i18n*` 屬性 |
| 隱藏 reCAPTCHA 徽章與合規揭露 | ✅ Done | CSS 隱藏 `.grecaptcha-badge`，於頁尾新增雙語揭露段落 `.recaptcha-disclosure` |
| 語言偏好持久化與 CustomEvent | ✅ Done | 語言存於 `localStorage` (`fcu_ne_lang`)，切換時發送 `i18n:changed` 事件 |
| 單元測試擴充與對齊 | ✅ Done | 建立 `test/i18n.test.js`，39/39 單元測試項目 Passing |

---

## E 輪：資安強化、反濫用與單元測試（2026-08-08）

| 功能 | 狀態 | 說明 |
|---|---|---|
| 敏感個資切換為 POST Body | ✅ Done | 學號 / 手機 / 房號 / 床號改經 `doPost`（`text/plain`），不暴露於 URL |
| 短效 Session Token 驗證 | ✅ Done | `get_token` 發放 120 秒 Token，`_consumeToken` 驗證，使用一次即銷毀 |
| Client ID 裝置區分與雙層限流 | ✅ Done | `localStorage` (`fcu_client_id`) + `_checkRateLimit`（`classify`: 12/60, `report`: 5/20） |
| reCAPTCHA v3 隱形驗證 | ✅ Done | 報修表單整合 grecaptcha (score ≥ 0.5)，防止外洩 URL 被濫用 |
| 後端格式強驗證 (RegEx) | ✅ Done | `gas/Code.gs` 加入學號 `/^[a-zA-Z][0-9]{7}$/`、手機 `/^[0-9]{10}$/`、床號 `/^[0-9]{1,3}$/` 後端二次驗證 |
| 明碼 試算表 ID 移除 | ✅ Done | 移除 `doc/data-model.md` 明碼 ID，改存 GAS Script Properties |
| 19 語系 Rule-based 備援分類器 | ✅ Done | `gas/Code.gs` 整合 19 語系關鍵字比對 |
| Node.js 原生單元測試套件 | ✅ Done | 建立 `test/gas-mocks.js` Mock GAS 全域服務，涵蓋 34 個單元測試項 (100% Passing) |
| GitHub Actions CI/CD | ✅ Done | 建立 `.github/workflows/test.yml` 自動跑 `npm test` |
| ESLint 9 Flat Config 規範 | ✅ Done | 建立 `eslint.config.js` 分離 Browser, GAS, Node 測試環境 |

---

## A 輪：Gemini 意圖分類優化（2026-07-27）

| 功能 | 狀態 | 說明 |
|---|---|---|
| 信心分數回傳 | ✅ Done | GAS `classifyIntent()` 改回傳 `{intent, confidence, needsConfirmation}` |
| 前端 25 秒 Timeout Protection | ✅ Done | `intent.js` 加 AbortController 逾時防護 |
| 低信心確認 UI | ✅ Done | `chat.js` needsConfirmation 時顯示確認 + 主選單按鈕 |

---

## B 輪：Teams 聯絡功能（2026-07-27）

| 功能 | 狀態 | 說明 |
|---|---|---|
| CONFIG.TEAMS 設定區塊 | ✅ Done | `config.js`，Email: `desk_dorm@o365.fcu.edu.tw` |
| teams.js 模組 | ✅ Done | IIFE，`open()` + `copyAccountName()` |
| Header 常駐「聯絡我們」按鈕 | ✅ Done | `index.html` + `css/style.css` |
| Teams chat 深連結 | ✅ Done | `https://teams.microsoft.com/l/chat/0/0?users=desk_dorm@o365.fcu.edu.tw` |
| 平台備援跳轉 | ✅ Done | iOS App Store / Android Play Store / 桌面 Teams 網頁版 |
| 備援步驟說明 + 一鍵複製 | ✅ Done | `chat.js` `_handleTeamsClick()` |

---

## D 輪：手機優化（2026-08-07）

| 功能 | 狀態 | 說明 |
|---|---|---|
| viewport maximum-scale=1.0 | ✅ Done | 防止 iOS 打字時自動放大（`index.html` meta 標籤） |
| input/textarea font-size 16px | ✅ Done | iOS 觸發自動縮放實際規則，手機下強制 16px（`css/style.css`） |
| 窄螢幕完全隱藏計數器 | ✅ Done | 寬度 ≤640px 時 `.header-counter { display: none }`，JS 仍照常計數（`css/style.css`） |
| GitHub Pages CDN 快取清除 | ✅ Done | 舊版 CSS（480px 斷點）被 CDN 快取，更新 CSS 頂部時間戳記強制重新部署 |

---

## 未來優化（v2）

| 功能 | 說明 |
|---|---|
| 多輪對話記憶 | 記錄本次 session 對話歷史 |
| 報修案件查詢 | 學生輸入學號可查詢自己的案件狀態 |
| 管理員後台 | 網管人員專用的案件管理頁面 |
| LINE / Email 通知 | 報修成功後自動通知網管人員 |
| 對話紀錄寫入 | 將分類結果寫入第二個試算表 |

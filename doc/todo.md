# 開發待辦清單（todo.md）

**更新日期**：2026-07-27

---

## MVP 優先（可送出報修並寫入試算表）

| 優先級 | 功能 | 狀態 | 說明 |
|---|---|---|---|
| P0 | 選項按鈕介面 | ✅ Done | 教學 / 常見設定 / 報修三按鈕 |
| P0 | 報修表單收集與驗證 | ✅ Done | 七欄位 + 時間純文字提示 |
| P0 | GAS 試算表寫入 | ✅ Done | `writeReport()` |
| P0 | Google Apps Script 部署 | ✅ Done | GAS_URL 已填入 |
| P1 | LLM 語意分析（Gemini） | ✅ Done | `classifyIntent()` |
| P1 | 意圖分類串接前端 | ✅ Done | `intent.js` |
| P1 | 教學文件回覆 | ✅ Done | Windows / Mac PDF 連結 |
| P1 | 常見問題回覆 | ✅ Done | 轉接器韌體建議、WiFi 帳號密碼等常見問題 |
| P2 | 非網管問題轉介 | ✅ Done | 宿舍服務台 / 行動逢甲 |
| P2 | 累積使用人數統計 | ✅ Done | `counter.js` + GAS |
| P3 | GitHub Pages 部署 | ✅ Done | PR → main → Pages 已上線 |

---

## A 輪：Gemini 意圖分類優化（2026-07-27）

| 功能 | 狀態 | 說明 |
|---|---|---|
| 信心分數回傳 | ✅ Done | GAS `classifyIntent()` 改回傳 `{intent, confidence, needsConfirmation}` |
| 前端 8 秒 Timeout | ✅ Done | `intent.js` 加 AbortController，逾時 fallback UNKNOWN |
| 低信心確認 UI | ✅ Done | `chat.js` needsConfirmation 時顯示確認 + 主選單按鈕 |

---

## B 輪：Teams 聯絡功能（2026-07-27）

| 功能 | 狀態 | 說明 |
|---|---|---|
| CONFIG.TEAMS 設定區塊 | ✅ Done | `config.js`，Email: `desk_dorm@o365.fcu.edu.tw` |
| teams.js 模組 | ✅ Done | IIFE，`open()` + `copyAccountName()` |
| Header 常駐「聯絡真人」按鈕 | ✅ Done | `index.html` + `css/style.css` |
| Teams chat 深連結 | ✅ Done | `https://teams.microsoft.com/l/chat/0/0?users=desk_dorm@o365.fcu.edu.tw` |
| 平台備援跳轉 | ✅ Done | iOS App Store / Android Play Store / 桌面 Teams 網頁版 |
| 備援步驟說明 + 一鍵複製 | ✅ Done | `chat.js` `_handleTeamsClick()` |

---

## 部署後續任務

| 功能 | 狀態 | 說明 |
|---|---|---|
| 填入 GAS Web App URL | ✅ Done | 已更新 `js/config.js` |
| 設定 Gemini API Key | ✅ Done | GAS Script Properties → GEMINI_API_KEY |
| 啟用 GitHub Pages | ✅ Done | Settings → Pages → Source: main |
| 驗收測試 | 🔲 Todo | 需實機測試 Teams 深連結跳轉行為 |

---

## C 輪：安全審查（A+B 完成後執行）

| 項目 | 狀態 | 說明 |
|---|---|---|
| 安全審查報告輸出 | 🔲 Todo | 依 整合prompt.md C輪 prompt 執行，先出報告不動程式碼 |
| 高風險項目修補 | 🔲 Todo | 待報告後決定 |

---

## 未來優化（v2）

| 功能 | 說明 |
|---|---|
| 多輪對話記憶 | 記錄本次 session 對話歷史 |
| 報修案件查詢 | 學生輸入學號可查詢自己的案件狀態 |
| 管理員後台 | 網管人員專用的案件管理頁面 |
| LINE / Email 通知 | 報修成功後自動通知網管人員 |
| 對話紀錄寫入 | 將分類結果寫入第二個試算表 |

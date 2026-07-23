# 開發待辦清單（todo.md）

**更新日期**：2026-07-17

---

## MVP 優先（可送出報修並寫入試算表）

| 優先級 | 功能 | 狀態 | 說明 |
|---|---|---|---|
| P0 | 選項按鈕介面 | ✅ Done | 教學 / 常見設定 / 報修三按鈕 |
| P0 | 報修表單收集與驗證 | ✅ Done | 七欄位 + 時間純文字提示 |
| P0 | GAS 試算表寫入 | ✅ Done | `writeReport()` |
| P0 | Google Apps Script 部署 | 🔲 Todo | 需填入 GAS_URL |
| P1 | LLM 語意分析（Gemini） | ✅ Done | `classifyIntent()` |
| P1 | 意圖分類串接前端 | ✅ Done | `intent.js` |
| P1 | 教學文件回覆 | ✅ Done | Windows / Mac PDF 連結 |
| P1 | 常見問題回覆 | ✅ Done | 轉接器韌體建議、WiFi 帳號密碼等常見問題 |
| P2 | 非網管問題轉介 | ✅ Done | 宿舍服務台 / 行動逢甲 |
| P2 | 累積使用人數統計 | ✅ Done | `counter.js` + GAS |
| P3 | GitHub Pages 部署 | 🔲 Todo | PR → main → 啟用 Pages |

---

## 部署後續任務

| 功能 | 狀態 | 說明 |
|---|---|---|
| 填入 GAS Web App URL | 🔲 Todo | 部署 GAS 後更新 `js/config.js` |
| 設定 Gemini API Key | 🔲 Todo | GAS Script Properties → GEMINI_API_KEY |
| 啟用 GitHub Pages | 🔲 Todo | Settings → Pages → Source: main |
| 驗收測試 | 🔲 Todo | 依 test-plan.md 執行 |

---

## 未來優化（v2）

| 功能 | 說明 |
|---|---|
| 多輪對話記憶 | 記錄本次 session 對話歷史 |
| 報修案件查詢 | 學生輸入學號可查詢自己的案件狀態 |
| 管理員後台 | 網管人員專用的案件管理頁面 |
| LINE / Email 通知 | 報修成功後自動通知網管人員 |
| 對話紀錄寫入 | 將分類結果寫入第二個試算表 |

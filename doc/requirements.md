# 逢甲大學福星宿舍網路報修 Chatbot — 需求規格書
# FCU Fuxing Dormitory Network Repair Assistant — Requirements Specification

**版本 / Version**：v1.4.0  
**建立日期 / Created**：2026-07-17  
**最後更新 / Last Updated**：2026-08-21 (v1.4.0: 查詢功能、全面稽核與安全修復)  
**專案倉庫 / Repository**：https://github.com/chinglin-k/FCU_NE_Chat_Bot

---

## 1. 專案背景 (Project Background)

@chinglin-k 需要一套自動化工具，協助學生快速取得網路相關教學資源，並能自助發起報修通報，減少處理重複性問題的時間。

---

## 2. 系統角色 (System Roles)

| 角色 / Role | 說明 / Description |
|---|---|
| **學生（使用者）/ Student User** | 透過 Chatbot 自助查詢教學文件、查詢常見問題，或發起報修通報（介面全面支援中英雙語對照 / Fully bilingual UI）|
| **管理員（網管人員）/ Network Admin** | 接收 Google 試算表中的通報案件，進行派人維修與案件追蹤 / Receive & manage repair requests |

---

## 3. 功能需求 (Functional Requirements)

### 3.1 選項按鈕介面與雙語支援 (UI & Bilingual Support)

Chatbot 啟動後顯示四個主要選項按鈕，Header 右上角另有 Teams 常駐連結。全站控制元件皆提供**繁體中文與英文對照**：

| 按鈕 / Button | 觸發行為 / Action |
|---|---|
| 📚 教學 / Tutorials | 顯示 Windows / Mac 系統選擇，提供 PDF 教學文件連結 |
| ⚙️ 常見問題 / FAQ | 常見問題一覽：WiFi 帳號密碼、轉接器驅動程式、寢室 WiFi 訊號、冷氣電費儲值等 |
| 🔍 查詢案件 / Check My Cases | 開啟查詢 Modal，輸入學號查詢報修案件狀態（v1.4.0 新增） |
| 🔧 我要實體協助、報修 / Request On-site Help | 開啟報修表單 Modal |
| 👤 聯絡我們 / Contact Us（Header 常駐） | 開啟 Teams chat 深連結，聯絡「福星宿舍網路報修平台」帳號 |

### 3.2 LLM 語意分析與 19 語系備援 (LLM & 19-Language Fallback)

使用者輸入文字時，透過 POST Body（攜帶一次性 Token + Client ID）傳送給 Google Apps Script 進行語意分析：
1. **Gemini 六模型三層 RPM 自動切換備援**：依序嘗試 6 個 Gemini 模型（RPM 15/5 分級 + 2 個未標示 RPM 的預覽版模型補齊，遇 429 延遲 1.5s 重試切換）。
2. **19 語系 Rule-based 備援分類器**：若 API 額度用盡或網路異常，自動降級至支援 19 種語言/地區變體的備援分類器（包含繁中[台/港/澳]、簡中、英、日、馬、韓、印、菲、泰、南非荷蘭、法、史瓦帝尼、越、墨西、摩西、蒙、埃及阿拉伯、厄瓜多西班牙）。
3. **低信心確認機制**：當 `confidence < 0.6`，顯示推薦按鈕 + 三顆主選單按鈕。
4. 前端設有 **25 秒逾時保護**（AbortController），超時 fallback 回 SYSTEM_ERROR / UNKNOWN。

### 3.3 教學文件回覆 (Tutorial Guides)

- **Windows 教學**：提供 Google Drive PDF 連結
- **Mac 教學**：提供 Google Drive PDF 連結
- WiFi 分享器設定：建議依照機種說明書操作

### 3.4 報修（通報）模組與反濫用 (Repair Submission & Anti-Abuse)

收集以下資料，送出時經 reCAPTCHA v3 隱形驗證（風險分數 ≥ 0.5），成功後隱藏頂部標題列，僅保留「報修成功！」與進度條：

| 欄位 / Field | 說明 / Description | 驗證規則 / Validation |
|---|---|---|
| 姓名 / Name | 學生姓名 | 必填（最長 50 字）；v1.3.1 起前後端皆強制必填，後端不再僅做長度截斷 |
| 學號 / Student ID | 學生學號 | 必填；前後端雙重強驗證 **1 位英文字母 + 7 位數字**（例：`D1234567`）|
| 房號 / Room No. | 宿舍房號（例：A123） | 必填；前後端雙重強驗證（僅限英數字與連字號，最長 8 字）|
| 床號 / Bed No. | 床位號碼（例：1） | 必填；前後端雙重強驗證 **1–3 位數字** |
| 手機 / Phone | 聯絡電話 | 必填；前後端雙重強驗證 **10 位數字** |
| 可維修時間 / Repair Time | 本人需在場 | 必填；小時 0–23、分鐘 0–59 |
| 問題描述 / Description | 網路或設備問題說明 | 必填（最長 200 字）；v1.3.1 起後端不再僅做長度截斷，未填一律拒絕 |

### 3.5 累積使用人數統計 (Usage Counter)

- 每次新 session 開啟時累加一次（Atomic LockService 防競態，並透過 `sessionStorage` 進行單次 Session 防重）
- 在 Header 顯示「已協助 X 人 ✨ / Served X users ✨」
- v1.3.1 起，`counter_get` / `counter_increment` 皆依前端 `clientId` 個別限流
  （分別為 30 次/分鐘、3 次/分鐘），全域上限分別為 120 次/分鐘、500 次/分鐘

### 3.6 報修案件查詢 (Case Query — v1.4.0)

- 學生輸入學號即可查詢自己的報修案件狀態
- 前後端皆獨立驗證學號格式（1 位英文字母 + 7 位數字），且分拆「空學號」與「格式錯誤」兩種錯誤訊息
- 回傳欄位刻意排除姓名與手機號碼（個資最小化），防止惡意使用者以他人學號試探取得敏感個資
- 所有欄位值在前端渲染前均做 HTML 轉義（`_esc()`），防止試算表資料觸發 XSS
- 已加入頻率限制：依 clientId 每人每分鐘最多 10 次，全體使用者每分鐘總計最多 40 次
- 管理者操作：在試算表的「是否派人」/「是否完成」/「備註」欄位填寫內容，學生即可透過查詢功能看到進度

---

## 4. 非功能需求 (Non-Functional Requirements)

| 項目 / Item | 要求 / Specifications |
|---|---|
| 安全性 / Security | Gemini Key 與 reCAPTCHA Secret 僅存於 GAS Script Properties；通訊全面採用 **POST Body** + **一次性 Token** + **Client ID 五組限流（classify/report/query/counter_get/counter_increment）** + **reCAPTCHA v3** + **Strict CSP**；後端例外一律回傳固定代碼，不外洩原始錯誤訊息（CWE-209 防護） |
| 效能 / Performance | LLM 分類時顯示打字指示器，提升等待體驗 |
| 相容性 / Compatibility | 支援桌機與手機瀏覽器，Viewport 允許無障礙縮放，使用 `100dvh` 行動版高度切齊 |
| 語言 / Language | 介面全面提供繁體中文與英文對照 (Fully bilingual UI support)；v1.3.1 修正可維修時間 4 個欄位的 aria-label 中英文切換失效問題 |
| 測試 / Testing | 原生 Node.js 測試框架與 `gas-mocks.js` 單元測試（53/53 Passing）與 ESLint 規範（0 error / 0 warning）|


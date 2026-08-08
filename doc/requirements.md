# 逢甲大學福星宿舍網路報修 Chatbot — 需求規格書

**版本**：3.0  
**建立日期**：2026-07-17  
**最後更新**：2026-08-08（Security Hardening: POST Body, One-time Token, Rate Limiting, 19 Languages Fallback）  
**專案倉庫**：https://github.com/chinglin-k/FCU_NE_Chat_Bot

---

## 1. 專案背景

@chinglin-k 需要一套自動化工具，協助學生快速取得網路相關教學資源，並能自助發起報修通報，減少處理重複性問題的時間。

---

## 2. 系統角色

| 角色 | 說明 |
|---|---|
| **學生（使用者）** | 透過 Chatbot 自助查詢教學文件、查詢常見問題，或發起報修通報（介面全面支援中英雙語對照）|
| **管理員（網管人員）** | 接收 Google 試算表中的通報案件，進行派人維修與案件追蹤 |

---

## 3. 功能需求

### 3.1 選項按鈕介面與雙語支援

Chatbot 啟動後顯示三個主要選項按鈕，Header 右上角另有 Teams 常駐連結。全站控制元件皆提供**繁體中文與英文對照**：

| 按鈕 | 觸發行為 |
|---|---|
| 📚 教學 / Tutorials | 顯示 Windows / Mac 系統選擇，提供 PDF 教學文件連結 |
| ⚙️ 常見問題 / FAQ | 常見問題一覽：WiFi 帳號密碼、轉接器驅動程式、寢室 WiFi 訊號、冷氣電費儲值等 |
| 🔧 我要實體協助、報修 / Request On-site Help | 開啟報修表單 |
| 👤 聯絡我們 / Contact Us（Header 常駐） | 開啟 Teams chat 深連結，聯絡「福星宿舍網路報修平台」帳號 |

### 3.2 LLM 語意分析與 19 語系備援

使用者輸入文字時，透過 POST Body（攜帶一次性 Token）傳送給 Google Apps Script 進行語意分析：
1. **Gemini 多模型自動切換備援**：依序嘗試多款 Gemini 模型。
2. **19 語系 Rule-based 備援**：若 API 額度用盡或網路異常，自動降級至支援 19 種語言/地區變體的備援分類器。
3. **低信心確認機制**：當 `confidence < 0.6`，顯示推薦按鈕 + 三顆主選單按鈕。
4. 前端設有 **25 秒逾時保護**（AbortController），超時 fallback 回 SYSTEM_ERROR / UNKNOWN。

### 3.3 教學文件回覆

- **Windows 教學**：提供 Google Drive PDF 連結
- **Mac 教學**：提供 Google Drive PDF 連結
- WiFi 分享器設定：建議依照機種說明書操作

### 3.4 報修（通報）模組

收集以下資料，送出時會隱藏頂部標題列，僅保留「報修成功！」與進度條：

| 欄位 | 說明 | 驗證規則 |
|---|---|---|
| 姓名 | 學生姓名 | 必填（最長 50 字） |
| 學號 | 學生學號 | 必填；格式強驗證 **1 位英文字母 + 7 位數字**（例：`D1234567`）|
| 房號 | 宿舍房號（例：A123） | 必填（最長 8 字） |
| 床號 | 床位號碼（例：1） | 必填；1–3 位數字 |
| 手機 | 聯絡電話 | 必填；10 位數字 |
| 可維修時間 | 本人需在場 | 必填；小時 0–23、分鐘 0–59 |
| 問題描述 | 網路或設備問題說明 | 必填（最長 200 字） |

### 3.5 累積使用人數統計

- 每次新 session 開啟時累加一次（Atomic LockService 防競態）
- 在 Header 顯示「已協助 X 人 ✨ / Served X users ✨」

---

## 4. 非功能需求

| 項目 | 要求 |
|---|---|
| 安全性 | Gemini API Key 僅存於 GAS Script Properties；通訊全面採用 **POST Body** + **一次性 Token** + **Strict CSP** + **Rate Limit** |
| 效能 | LLM 分類時顯示打字指示器，提升等待體驗 |
| 相容性 | 支援桌機與手機瀏覽器，Viewport 允許無障礙縮放 |
| 語言 | 繁體中文與英文完整對照 (Bilingual support) |


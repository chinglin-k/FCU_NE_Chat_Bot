# 逢甲大學福星宿舍網路報修 Chatbot

> 🔧 @chinglin-k 專屬逢甲大學福星宿舍網路智慧客服系統

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://chinglin-k.github.io/FCU_NE_Chat_Bot/)
[![Run Validation Unit Tests](https://github.com/chinglin-k/FCU_NE_Chat_Bot/actions/workflows/test.yml/badge.svg)](https://github.com/chinglin-k/FCU_NE_Chat_Bot/actions/workflows/test.yml)

**版本 / Version**：v1.2.0 (Spec v3.2)  
**最後更新 / Last Updated**：2026-08-08

---

## 功能特色

- 🌐 **中/英介面切換**：聊天介面右上角圓形懸浮按鈕，一鍵切換中文／英文介面，偏好記錄於瀏覽器 localStorage，重新整理後仍保留
- 📚 **網路教學**：提供 Windows / Mac 宿舍網路設定 PDF 教學
- ⚙️ **常見問題**：轉接器驅動程式、WiFi 帳號密碼、寢室 WiFi 訊號、冷氣電費儲值等常見問題解答
  * 🎯 支援「子主題精準回覆」：問轉接器只顯示轉接器卡片、問帳密只顯示帳密卡片
- 🔧 **線上報修通報**：填寫報修表單自動寫入 Google 試算表（前後端雙重格式驗證：學號 1 字母+7 數字、手機 10 位數字、床號 1–3 位數字）
- 🤖 **LLM 語意分析**：透過 Gemini API 三層 RPM 分級、共 9 個模型自動備援機制判斷使用者意圖
  * 支援「理解失敗」 vs 「系統錯誤」兩層 fallback 訊息區分
  * Gemini 全部失敗時，降級至內建 **19 語系 Rule-based 關鍵字備援分類器**，確保國際學生在 LLM 服務中斷時仍能取得基本可用的回覆
- 🌐 **中英雙語介面**：前端所有文字均提供中英對照
- 📊 **累積使用人數**：顯示系統累積服務人數
- 📱 **手機友善**：防止 iOS 打字自動放大；動態 Viewport Height (`100dvh`) 相容
- 🛡️ **多層安全防護**：
  * 個資與使用者輸入一律透過 POST Body 傳送，不暴露於瀏覽器網址列或伺服器 Log
  * 一次性 Session Token（120 秒有效、用一次即失效）防止偽造請求
  * 裝置級 Client ID (`localStorage`) + 全域級雙層流量限制（CacheService）
  * reCAPTCHA v3 隱形驗證，防止 GAS Web App URL 外洩後遭腳本大量濫用
  * Prompt Injection 防護（長度截斷 500 字、控制字元 / Zero-Width 字元清除、引號隔離）
  * 學號 / 手機 / 床號前後端雙重格式驗證
  * XSS 防禦（使用者輸入以 `_escapeHTML` 轉義 `& < > " '`，Bot 訊息來自內部常數）

---

## 🌐 多國語言備援分類器支援 (Multilingual Fallback Classifier)

當 Gemini API 達到配額限制或網路異常時，系統會自動切換至 GAS 本地 **Rule-based 關鍵字備援分類器**。該分類器支援多達 **19 種語言與地區語言** 的精準意圖辨識：

| 編號 | 語言 / 地區 | 程式碼標記 / Code | 支援範例關鍵字 (Sample Keywords) |
|---|---|---|---|
| 1 | 台灣繁體中文 (Traditional Chinese - Taiwan) | `zh-TW` | 報修, 網路孔, 轉接器, WiFi密碼, 教學 |
| 2 | 香港繁體中文 / 粵語 (Traditional Chinese - Hong Kong) | `zh-HK` | 報修, 網線插口, 轉接頭, 密碼, 點樣設 |
| 3 | 澳門繁體中文 / 粵語 (Traditional Chinese - Macau) | `zh-MO` | 報修, 網絡插座, 轉接器, 密碼, 教學 |
| 4 | 簡體中文 (Simplified Chinese) | `zh-CN` | 报修, 网络孔, 转换器, 密码, 教程 |
| 5 | 英文 (English) | `en` | repair, broken port, adapter, wifi password, tutorial |
| 6 | 日文 (Japanese) | `ja` | 報修, 壁のポート, 変換アダプタ, パスワード, マニュアル |
| 7 | 馬來文 (Malay) | `ms` | baiki, port dinding, penyesuai, kata laluan, panduan |
| 8 | 韓文 (Korean) | `ko` | 수리, 랜선 포트, 어댑터, 비밀번호, 매뉴얼 |
| 9 | 印尼文 (Indonesian) | `id` | perbaiki, port dinding, adaptor, kata sandi, panduan |
| 10 | 菲律賓文 / 他加祿文 (Filipino / Tagalog) | `tl` | ayusin, port sa pader, converter, password, gabay |
| 11 | 泰文 (Thai) | `th` | ซ่อม, พอร์ตผนัง, อะแดปเตอร์, รหัสผ่าน, คู่มือ |
| 12 | 南非荷蘭文 (Afrikaans) | `af` (南非) | herstel, muurpoort, drywer, wagwoord, gids |
| 13 | 法文 (French) | `fr` (法國 / 布吉納法索) | réparer, prise murale, adaptateur, mot de passe, manuel |
| 14 | 史瓦帝尼文 (siSwati / Swati) | `ss` (史瓦帝尼) | kulungisa, libhothi, adaptha, iphasiwedi, sihlahlo |
| 15 | 越南文 (Vietnamese) | `vi` | sửa, cổng mạng, bộ chuyển đổi, mật khẩu, hướng dẫn |
| 16 | 墨西哥西班牙文 (Spanish - Mexico) | `es-MX` (墨西哥) | reparar, puerto de pared, adaptador, contraseña, manual |
| 17 | 摩西文 / 法文 (Mooré / French) | `mos` (布吉納法索) | maane, prise murale, adaptateur, compte, manuel |
| 18 | 蒙古文 (Mongolian) | `mn` | засвар, ханын порт, адаптер, нууц үг, заавар |
| 19 | 埃及阿拉伯文 (Egyptian Arabic) & 厄瓜多西班牙文 (Spanish - Ecuador) | `ar-EG` / `es-EC` | تصليح, منفذ حائط, محول, كلمة السر, دليل |

---

## 技術架構

| 層次 | 技術 | 說明 |
|---|---|---|
| 前端 | HTML5 + Vanilla CSS + Vanilla JS | 無依賴框架，高效原生效能 |
| 部署 | GitHub Pages | 自動部署至 gh-pages 服務 |
| LLM | Gemini API 九模型三層 RPM 分級自動備援 | 透過 GAS 代理，Key 不外露；429 時自動重試切換下一個模型 |
| 備援 | 19 語系 Rule-based 關鍵字分類器 | Gemini 全部失敗時降級使用 |
| 反濫用 | reCAPTCHA v3 + 一次性 Token + 雙層限流 | 隱形驗證（門檻 0.5），防範 GAS_URL 外洩遭腳本大量發送假報修單 |
| 資料 | Google 試算表 + Script Properties | 案件儲存於試算表，機密與人數儲存於 Script Properties |
| 測試 | Node.js `node --test` + ESLint | 純 Node 原生測試框架，透過 `gas-mocks.js` 單元測試 GAS 邏輯 |

---

## 快速開始

### 1. Clone 並本地預覽

```bash
git clone https://github.com/chinglin-k/FCU_NE_Chat_Bot.git
cd FCU_NE_Chat_Bot
npm install          # 安裝開發依賴（僅供測試 / lint 使用）
npm test             # 執行單元測試套件（含 gas/Code.gs 純函式 Mock 測試）
npm run lint         # 執行 ESLint 檢查（含 gas/**/*.gs）
# 直接用瀏覽器開啟 index.html，或使用 VS Code Live Server 預覽前端
```

### 2. 部署 Google Apps Script

1. 前往 [script.google.com](https://script.google.com)，建立新專案
2. 複製 `gas/Code.gs` 全部內容貼入
3. 「專案設定」→「指令稿屬性」→ 新增以下屬性：
   - `GEMINI_API_KEY`：你的 Gemini API Key
   - `SPREADSHEET_ID`：你的 Google 試算表 ID
   - `RECAPTCHA_SECRET_KEY`：你的 reCAPTCHA v3 Secret Key（對應 `js/config.js` 的 `RECAPTCHA_SITE_KEY`）
4. 部署 → 新的部署 → 類型：**網頁應用程式**
   - 執行身分：**我自己**
   - 誰可以存取：**所有人**
5. 複製 Web App URL

### 3. 設定前端 GAS URL 與 reCAPTCHA

編輯 `js/config.js`：

```javascript
GAS_URL: 'https://script.google.com/macros/s/YOUR_ID/exec',
RECAPTCHA_SITE_KEY: 'YOUR_RECAPTCHA_V3_SITE_KEY',
```

> `RECAPTCHA_SITE_KEY` 是公開金鑰，設計上就是要放在前端程式碼中，可安全提交至 Git。
> 對應的 Secret Key **絕對不可**放在前端，必須只存在 GAS Script Properties。

### 4. 啟用 GitHub Pages

GitHub → Settings → Pages → Source: **main** / **(root)**

---

## 試算表格式

報修案件自動寫入以下欄位：

| 日期 | 時間 | 學號 | 姓名 | 房號 | 床號 | 手機 | 可維修時間 | 問題描述 | 是否派人 | 是否完成 | 備註 |
|---|---|---|---|---|---|---|---|---|---|---|---|

---

## 文件

- [需求規格書](doc/requirements.md)
- [架構設計文件](doc/architecture.md)
- [資料模型](doc/data-model.md)
- [開發待辦](doc/todo.md)
- [專案決策記錄](doc/project-memory.md)

---

## 已知安全性說明

| 項目 | 說明 |
|---|---|
| Gemini API Key | 僅儲存於 GAS Script Properties，不寫入程式碼 |
| reCAPTCHA Secret | 僅儲存於 GAS Script Properties，不寫入程式碼；前端僅持有公開的 Site Key |
| 報修個資傳輸 | 全面採 **POST Body (text/plain)** 傳送，不暴露於瀏覽器網址列或伺服器 Access Log |
| 請求授權 | 一次性 Session Token（120 秒有效、用一次即失效），配合裝置級 Client ID 做流量限制 |
| 流量防護 | 雙層 CacheService 限流：`classify` 使用者 12/分鐘、全域 60/分鐘；`report` 使用者 5/分鐘、全域 20/分鐘 |
| 濫用防護（報修表單） | reCAPTCHA v3 隱形驗證（風險分數門檻 0.5），防止 GAS_URL 外洩後遭腳本大量送出假報修單 |
| 學號 / 手機 / 床號格式 | 前端與 GAS 端雙重驗證（學號：1 字母+7 數字；手機：10 位數字；床號：1–3 位數字） |
| Prompt Injection | 輸入截斷 500 字、移除控制字元、Zero-Width 字元、引號隔離輸入 |
| XSS | 使用者輸入經 `_escapeHTML` 處理（含 `"` `'` 轉義）；Bot 訊息來自內部常數，僅供內部常數使用 Markdown 渲染 |
| 後端欄位長度 | GAS writeReport 已經後端截斷，對齊前端驗證視同一標準 |

---

## 授權

@chinglin-k © 2026 — MIT License

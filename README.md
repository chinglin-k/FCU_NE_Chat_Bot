# 逢甲大學福星宿舍網路報修 Chatbot

> 🔧 @chinglin-k 專屬逢甲大學福星宿舍網路智慧客服系統

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://chinglin-k.github.io/FCU_NE_Chat_Bot/)

---

## 功能特色

- 📚 **網路教學**：提供 Windows / Mac 宿舍網路設定 PDF 教學
- ⚙️ **常見問題**：轉接器驅動程式、WiFi 帳號密碼、寢室 WiFi 訊號等常見問題解答
  - 🎯 支援「子主題精準回覆」：問轉接器只顯示轉接器卡片、問帳密只顯示帳密卡片
- 🔧 **線上報修通報**：填寫報修表單自動寫入 Google 試算表
- 🤖 **LLM 語意分析**：透過 Gemini API 多模型自動備援機制判斷使用者意圖
  - 支援「理解失敗」 vs 「系統錯誤」兩層 fallback 訊息區分
- 📊 **累積使用人數**：顯示系統累積服務人數
- 📱 **手機友善**：防止 iOS 打字自動放大；窄螢幕計數器自動隱藏，計數持續運作

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

| 層次 | 技術 |
|---|---|
| 前端 | HTML5 + Vanilla CSS + Vanilla JS |
| 部署 | GitHub Pages |
| LLM | Gemini API 多模型自動備援（透過 Google Apps Script 代理） |
| 資料 | Google 試算表 |

---

## 快速開始

### 1. Clone 並本地預覽

```bash
git clone https://github.com/chinglin-k/FCU_NE_Chat_Bot.git
cd FCU_NE_Chat_Bot
# 直接用瀏覽器開啟 index.html，或使用 VS Code Live Server
```

### 2. 部署 Google Apps Script

1. 前往 [script.google.com](https://script.google.com)，建立新專案
2. 複製 `gas/Code.gs` 全部內容貼入
3. 「專案設定」→「指令稿屬性」→ 新增 `GEMINI_API_KEY` 與 `SPREADSHEET_ID`
4. 部署 → 新的部署 → 類型：**網頁應用程式**
   - 執行身分：**我自己**
   - 誰可以存取：**所有人**
5. 複製 Web App URL

### 3. 設定前端 GAS URL

編輯 `js/config.js`，將 `GAS_URL` 替換為步驟 2 的 URL：

```javascript
GAS_URL: 'https://script.google.com/macros/s/YOUR_ID/exec',
```

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
| GAS Web App URL | ⚠️ **注意**：`js/config.js` 中的 GAS_URL 已提交至 Git 歷史，任何可存取倉庫者均可呼叫後端（counter increment / 送出報修）。如需撤銷，請至 GAS 重新部署取得新 URL 並更新 `config.js`。 |
| 報修個資傳輸 | 經 HTTPS 加密，但因 GAS 302 redirect 架構限制，目前瀏覽器 URL 會包含表單資料；未來可加設 Proxy 改善 |
| Prompt Injection | 輸入截斷 500 字、移除控制字元、Zero-Width 字元、引號隔離輸入 |
| XSS | 使用者輸入經 `_escapeHTML` 處理（涵蓋 `&` `<` `>` `"` `'`）；Bot 訊息來自內部常數，不包含外部輸入；按鈕 icon 改用 DOM `textContent` 組合 |
| 後端欄位長度 | GAS writeReport 已經後端截斷，對齊前端驗證至同一標準 |

---

## 授權

@chinglin-k © 2026

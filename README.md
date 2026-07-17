# 逢甲大學宿舍網路報修 Chatbot

> 🔧 逢甲大學宿舍網管專屬智慧客服系統

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://chinglin-k.github.io/FCU_NE_Chat_Bot/)

---

## 功能特色

- 📚 **網路教學**：提供 Windows / Mac 宿舍網路設定 PDF 教學
- ⚙️ **常見設定問題**：轉接器（RJ45 to USB）驅動程式問題解答
- 🔧 **線上報修通報**：填寫報修表單自動寫入 Google 試算表
- 🤖 **LLM 語意分析**：透過 Gemini API 智慧判斷使用者意圖
- 📊 **累積使用人數**：顯示系統累積服務人數

---

## 技術架構

| 層次 | 技術 |
|---|---|
| 前端 | HTML5 + Vanilla CSS + Vanilla JS |
| 部署 | GitHub Pages |
| LLM | Gemini 1.5 Flash（Google Apps Script 代理） |
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
3. 「專案設定」→「指令碼屬性」→ 新增 `GEMINI_API_KEY`
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

## 授權

逢甲大學宿舍網路管理組 © 2026

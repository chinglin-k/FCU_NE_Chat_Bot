# AGENTS.md — 逢甲宿舍網路報修 Chatbot AI 開發規範

> 所有 AI 工具與開發者均須遵守此規範

---

## 技術棧

| 層次 | 技術 |
|---|---|
| 前端 | HTML5 + Vanilla CSS + Vanilla JS |
| 部署 | GitHub Pages（靜態，root 目錄） |
| LLM | Gemini 1.5 Flash（透過 GAS 代理） |
| 後端 | Google Apps Script（`gas/Code.gs`） |
| 資料儲存 | Google 試算表 + Script Properties |

---

## 安全規範（強制）

1. **禁止**將 API Key、Token、密碼寫入任何程式碼或 Git commit
2. Gemini API Key 僅存於 **GAS Script Properties**（名稱：`GEMINI_API_KEY`）
3. `.env` 已加入 `.gitignore`，不得移除此規則
4. 試算表 ID 應儲存於 **GAS Script Properties**（名稱：`SPREADSHEET_ID`），不得硬編碼於程式碼中

---

## 檔案結構規範

```
FCU_NE_Chat_Bot/
├── index.html          ← 主頁面，不得新增其他 HTML 頁面（SPA）
├── css/style.css       ← 所有樣式集中於此
├── js/
│   ├── config.js       ← 設定值集中管理（GAS_URL 等）
│   ├── chat.js         ← 主控制器（最後載入）
│   ├── intent.js       ← 意圖分類（不直接呼叫 Gemini）
│   ├── report.js       ← 報修表單
│   └── counter.js      ← 計數器
├── gas/Code.gs         ← GAS 原始碼（不部署至 Pages）
└── doc/                ← 專案文件
```

---

## 程式碼規範

- 使用 `'use strict'` 於每個 JS 模組開頭
- 模組使用 IIFE 模式（`const Module = (() => { ... })()`）
- 函式命名：camelCase，私有函式以 `_` 前綴
- 不使用 `var`，使用 `const` / `let`
- 文字回覆集中於 `CONFIG.RESPONSES`，不散落在 JS 邏輯中
- CSS 使用 `:root` 變數，不 inline 硬編碼顏色

---

## GAS 開發規範

- 報修個資（姓名、學號、手機等）一律透過 **`doPost(e)`** 傳送，不得使用 GET
- 其餘操作（classify、counter）使用 `doGet(e)` 處理
- 錯誤一律用 `Logger.log()` 記錄
- 回傳格式統一：`{ success: boolean, ... }`
- 部署設定：執行身分「我自己」/ 存取「所有人」

---

## Git 流程

```
feature/* → main（透過 Pull Request）
```

- 提交訊息格式：`type: 描述（繁體中文）`
  - `feat:` 新功能
  - `fix:` 修復
  - `docs:` 文件
  - `style:` 樣式調整
  - `refactor:` 重構

---

## 禁止事項

- ❌ 不得在前端 JS 中硬編碼任何 API Key
- ❌ 不得將 SPREADSHEET_ID 硬編碼於程式碼中（請存於 GAS Script Properties）
- ❌ 不得新增外部 CSS 框架（如 Tailwind、Bootstrap）
- ❌ 不得在未確認需求的情況下自行假設業務規則
- ❌ 不得刪除或修改 `.gitignore` 中已有的規則

# AGENTS.md — 逢甲宿舍網路報修 Chatbot AI 開發規範

> 所有 AI 工具與開發者均須遵守此規範

**版本 / Version**：v1.4.6  

**最後更新 / Last Updated**：2026-09-05

---

## 技術棧

| 層次 | 技術 |
| ---- | --------------------------------- |
| 前端 | HTML5 + Vanilla CSS + Vanilla JS |
| 部署 | GitHub Pages（靜態，root 目錄） |
| LLM | Gemini API 六模型三層 RPM 分級自動備援（透過 GAS 代理） |
| 反濫用 | reCAPTCHA v3（僅報修表單） |
| 後端 | Google Apps Script（`gas/Code.gs`） |
| 資料儲存 | Google 試算表 + Script Properties |
| 測試 | Node.js `node --test`（`gas/Code.gs` 純函式以 CommonJS `module.exports` 方式匯出供測試） |
| Lint | ESLint（`npm run lint`，涵蓋 JS 與 `gas/**/*.gs`） |

---

## 安全規範（強制）

1. **禁止**將 API Key、Token、密碼寫入任何程式碼或 Git commit
2. Gemini API Key 僅存於 **GAS Script Properties**（名稱：`GEMINI_API_KEY`）
3. reCAPTCHA v3 **Secret Key**（注意：不是 Site Key）僅存於 **GAS Script Properties**
   （名稱：`RECAPTCHA_SECRET_KEY`）；Site Key 是公開金鑰，可安全寫在 `js/config.js`
4. `.env` 已加入 `.gitignore`，不得移除此規則
5. 試算表 ID 應儲存於 **GAS Script Properties**（名稱：`SPREADSHEET_ID`），
   **不得硬編碼於程式碼或任何文件（含 doc/*.md）中**

---

## 檔案結構規範

```
FCU_NE_Chat_Bot/
├── index.html            ← 主頁面，不得新增其他 HTML 頁面（SPA）
├── css/style.css         ← 所有樣式集中於此
├── js/
│   ├── i18n.js
│   ├── config.js         ← 設定值集中管理（GAS_URL、RECAPTCHA_SITE_KEY、CONFIG.TEAMS 等）
│   ├── chat.js            ← 主控制器（最後載入）；管理 Session Token 與 Client ID
│   ├── intent.js          ← 意圖分類（回傳 {intent, confidence, needsConfirmation, isSystemError, topic})
│   ├── report.js          ← 報修表單（含前端格式驗證、reCAPTCHA token 取得）
│   ├── query.js           ← 報修查詢（Modal 介面與查詢結果渲染）
│   ├── counter.js         ← 計數器
│   ├── teams.js           ← Teams 聯絡功能（chat 深連結 + 平台備援 + 複製）
│   └── wifi-modal.js      ← Wi-Fi 機設定教學 Modal（開/關/ESC，v1.4.4 新增）
├── gas/Code.gs            ← GAS 原始碼（不部署至 Pages），尾端含 module.exports 供 Node 測試
├── test/                  ← Node.js 單元測試（含 gas-mocks.js，模擬 GAS 全域物件）
├── package.json           ← npm test / npm run lint 腳本
├── eslint.config.js       ← ESLint 設定
├── .env.example           ← 環境變數範本（不含真實機密值）
└── doc/                   ← 專案文件
```

---

## 程式碼規範

- 使用 `'use strict'` 於每個 JS 模組開頭
- 模組使用 IIFE 模式（`const Module = (() => { ... })()`）
- 每個模組頂層變數宣告前加上 `/* exported ModuleName */` 指令註解，明確告知
  ESLint 該變數是刻意匯出給其他（非模組化）`<script>` 檔案使用，避免
  `no-unused-vars` false positive（v1.3.1 起的既有慣例，新增模組請比照辦理）
- 函式命名：camelCase，私有函式以 `_` 前綴
- 不使用 `var`，使用 `const` / `let`
- 刻意不使用的 `catch` 綁定變數（如 `catch (_e) { /* ignore */ }`）一律以
  `_` 開頭命名，對應 `eslint.config.js` 中的 `caughtErrorsIgnorePattern: '^_'`
- 文字回覆集中於 `CONFIG.RESPONSES`，不散落在 JS 邏輯中
- CSS 使用 `:root` 變數，不 inline 硬編碼顏色（v1.3.1：已全面清查並修復，
  新增樣式時請延續此慣例，新色彩請先在 `:root` 定義語意化變數）
- 修改 `gas/Code.gs` 的純函式後，務必執行 `npm test` 確認 Mock 測試仍通過
- 提交前執行 `npm run lint` 確認無 ESLint 錯誤（目前基準：0 error / 0 warning）

---

## GAS 開發規範

- **路由原則**：`doGet` 只處理不含個資 / 使用者輸入的操作
  （`get_token`、`counter_get`、`counter_increment`）；`classify`、`report`、`query`
  （含個資與使用者輸入文字）一律經 **`doPost`**，Body 格式為
  `Content-Type: text/plain;charset=utf-8`，內容為 JSON 字串。
  **禁止**把 `classify`／`report`／`query` 改回 `doGet` 查詢字串傳遞，`doGet` 內已明確
  拒絕 `classify` 與 `report` 兩個 action（`query` 不走 doGet）。`counter_get`／`counter_increment` 呼叫時須帶
  `?clientId=...` 查詢參數，供後端套用個別限流（未帶則以 `'anonymous'` 視為
  單一共用識別碼，仍受全域上限保護但無法個別追蹤濫用來源）。

  > ⚠️ **歷史背景**：專案初期因 GAS Web App 固定回傳 302 redirect、`doPost` body
  > 遭遇相容性問題，曾暫時改用 GET + payload。此做法已於 **2026-08-08** 正式棄用，
  > 原因：避免敏感個資（學號 / 電話 / 對話內容）暴露於瀏覽器網址列、伺服器
  > Access Log 與代理伺服器紀錄。

- **一次性 Token**：`doGet(?action=get_token)` 發放（120 秒有效、用一次即失效），
  `classify`／`report` 的 POST body 須帶入有效 token，經 `_consumeToken()` 驗證。
  Token 存於前端記憶體變數（非 localStorage），頁面重整後會重新取得。
- **Client ID**：前端產生的前端亂數字串（Math.random 基底 36 進位），存於 `localStorage`（key: `fcu_chat_client_id`），
  非個資、非身分驗證，僅用於「依使用者區分」的流量限制識別。
- **雙層流量限制**（`_checkRateLimit`，CacheService 實作，每個 action 皆為
  「使用者級」+「全域級」兩層）：
  - `classify`：使用者級 12 次/分鐘、全域級 60 次/分鐘
  - `report`：使用者級 5 次/分鐘、全域級 20 次/分鐘
  - `query`：使用者級 10 次/分鐘、全域級 40 次/分鐘
    （v1.4.0 新增：學號查詢端點，不需 reCAPTCHA，依 clientId 個別限流）
  - `counter_get`：使用者級 30 次/分鐘、全域級 120 次/分鐘
  - `counter_increment`：使用者級 3 次/分鐘、全域級 500 次/分鐘
    （v1.3.1 修復：原本使用者級上限為 999999、識別碼固定為 `'anonymous'`，
    等同不限制且無法個別追蹤；全域上限原訂 30 次/分鐘，因於尖峰時段容易
    誤擋合法計數，已調升為 500 次/分鐘）
- **reCAPTCHA v3**：僅 `report` 需要，`_verifyRecaptcha()` 驗證 token 有效性、
  action 是否相符（`submit_report`）、風險分數是否 ≥ 0.5。
- **後端格式驗證**（防止繞過前端直接打 API）：一律「先必填、後格式、再截斷」
  三階段進行，**不得**使用 `field && !regex.test(field)` 這類寫法（空字串為
  falsy，會整段跳過驗證，等同必填形同虛設，此為 v1.3.1 BUG-01 的根因）。
  正確寫法應先 `trim()` 後檢查是否為空字串，通過才進入格式檢查：
  學號 `/^[a-zA-Z][0-9]{7}$/`、手機 `/^[0-9]{10}$/`、床號 `/^[0-9]$/`（僅 1 位數字）、
  房號 `/^(H|I|G|F[ABCDEF])[0-9]{1,4}(-[0-9]+)?$/i`（須以 H、I、G、FA~FF 開頭，
  後接 1–4 位數字，可選一個連字號再接數字）；姓名與問題描述僅檢查非空與長度上限
  （50 / 200 字），無格式 RegEx。
  > ⚠️ **v1.4.6 修正（BUG-ROOM-01、BUG-BED-01）**：床號／房號後端正則式原本比前端
  > 寬鬆（床號曾允許 1–3 位數字、房號曾僅檢查「英數字與連字號」），可被繞過前端
  > 直接對 GAS Web App 送出格式不符的資料。現已收緊為與 `js/report.js`／
  > `index.html` 的 `pattern` 屬性完全一致，修改任一端的格式規則時務必同步更新
  > 另一端與本檔案，避免再次脫節。
- **重複送出防護**：`writeReport()` 以「學號 + 房號 + 問題描述前 50 字」組字串、
  取 MD5 雜湊後作為 `CacheService` key，120 秒內命中相同指紋直接回傳
  `DUPLICATE_REPORT`（僅於格式驗證通過、寫入成功後才存入快取）。防止使用者
  手滑重複點擊送出或腳本短時間內重複灌入相同案件（v1.4.6 BUG-DUP-01 新增）。
- **Gemini 備援**：`GEMINI_MODELS_FALLBACK` 依 RPM 配額分三層、共 6 個模型，
  遇 429 自動重試切換下一個模型；全部失敗降級至 `_ruleBasedClassify()`
  （19 語系關鍵字比對）。修改此陣列後，務必同步更新
  `doc/architecture.md` §3.3 的模型表格，避免文件與程式碼再次脫節。
- 其餘操作（counter 相關）維持 `doGet(e)` 處理即可（不涉及個資）。
- **錯誤處理慣例**：`catch` 區塊一律用 `Logger.log()` 記錄完整例外內容，
  回傳給前端的 `error` 欄位**禁止**包含 `err.toString()` 等原始例外訊息，
  一律使用固定代碼（如 `'INTERNAL_ERROR'`），避免內部實作細節透過錯誤
  訊息外洩（CWE-209，v1.3.1 BUG-03 修復）。
- 回傳格式統一：`{ success: boolean, ... }`
- 部署設定：執行身分「我自己」/ 存取「所有人」

---

## Git 流程

```
feature/* → main（透過 Pull Request）
```

- 提交訊息格式：`type: 描述（繁體中文）`
  * `feat:` 新功能
  * `fix:` 修復
  * `docs:` 文件
  * `style:` 樣式調整
  * `refactor:` 重構
- 提交前務必執行 `npm test` 與 `npm run lint`

---

## 禁止事項

- ❌ 不得在前端 JS 中硬編碼任何 API Key 或 Secret Key（reCAPTCHA Site Key 例外，設計上即為公開金鑰）
- ❌ 不得將 SPREADSHEET_ID 硬編碼於程式碼**或任何文件**中（請存於 GAS Script Properties）
- ❌ 不得新增外部 CSS 框架（如 Tailwind、Bootstrap）
- ❌ 不得在未確認需求的情況下自行假設業務規則
- ❌ 不得刪除或修改 `.gitignore` 中已有的規則
- ❌ 不得將 `classify`／`report` 改回 `doGet` 查詢字串傳遞個資

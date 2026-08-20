# 更新日誌 (Changelog)

**版本 / Version**：v1.4.0  
**最後更新 / Last Updated**：2026-08-21

---

## [v1.4.0] - 2026-08-21 (Query Feature, Security Fix & Full Audit)

本版本新增報修案件查詢功能，並對全程式碼庫進行 360° 稽核，修復安全漏洞、前後端語意不一致、文件過時等問題。

### ✨ 新功能 (New Feature)
- **報修案件查詢**：學生輸入學號可查詢自己的報修案件狀態。
  - 後端：`gas/Code.gs` 新增 `queryReport()`（學號語法驗證、雙層限流 10/40 次/分鐘、僅回傳安全欄位）
  - 前端：新增 `js/query.js` 查詢模組（Modal + API 呼叫 + 結果渲染）
  - 意圖辨識：`BUTTON_QUERY` 意圖加入 Gemini Prompt 與 Rule-based 備援分類器
  - CSS：新增查詢 Modal 與案件狀態標籤樣式（✅ 已完成 / 🔧 已派人 / ⏳ 待處理）

### 🛡️ 安全性修復 (Security Fixes)
- **[BUG-13/高] 修復 `_renderResults()` XSS 漏洞**：`js/query.js` 將試算表欄位（使用者可控資料）嵌入 template string 前先做 HTML 轉義（`_esc()`）。防止惡意學生在報修表單填入 `<script>` 等內容觸發 XSS。

### 🐛 功能性錯誤修復 (Bug Fixes)
- **[BUG-12/中] 修復前端學號驗證語意不一致**：`query.js` `_validate()` 原本對空學號與格式錯誤顯示相同訊息（「格式錯誤」），現分拆為兩種訊息：空學號→「請輸入學號」、格式錯誤→「學號格式錯誤」，與後端 GAS 回傳語意一致。

### 📄 文件修正 (Documentation Fixes)
- **[BUG-14] 修復 `doc/architecture.md` §4.2 殘留的「9 個模型」**：v1.3.1 已於 §3.3 修正此誤，但 §4.2 資料流段落漏更，現一併修正為「6 個模型」。
- **[BUG-15] 修復 `doc/todo.md` 查詢功能狀態**：查詢功能已完成，從「未來優化（v2）」移至 G 輪已完成清單。
- **[BUG-18] `AGENTS.md` 路由原則補充 `query` action 說明**，並補上流量限制參數。
- **[BUG-19] 全站文件補入 `queryReport()` 該功能說明**：`README.md` 功能特色、安全表格；`AGENTS.md` 流量限制說明；`doc/architecture.md` 後端函式表、資料流 §4.4、Mermaid 架構圖。
- **全站版本號統一升級為 v1.4.0**：`package.json`、`README.md`、`CHANGELOG.md`、`AGENTS.md`、`doc/architecture.md`、`doc/todo.md`、`doc/requirements.md`、`doc/project-memory.md`。

### 🧪 測試
- `npm test` 53 pass / 0 fail；`npm run lint` 0 error / 0 warning

---

## [v1.3.1] - 2026-08-09 (Bug-fix, Rate-limit Tuning, Git History Scrub & Full Documentation Alignment Release)

本版本為全程式碼庫稽核後的修復版本，聚焦於後端驗證繞過、資訊洩漏、多語系對應錯誤、CSS 品質、Gemini 模型清單時效性、Git 歷史機密殘留，以及全專案文件與實際程式碼的一致性校正，不含新功能。

### 🛡️ 安全性修復 (Security Fixes)
- **[BUG-01／高] 修復 `writeReport()` 後端必填驗證可被繞過**：原本 `if (phone && !regex.test(phone))` 這類寫法在欄位為空字串（falsy）時會整段跳過驗證，攻擊者可繞過前端表單、直接對 GAS Web App 送出 studentId / phone / bedNumber / roomNumber 皆為空的請求並成功寫入試算表。現在一律先檢查必填、再檢查格式，並補上 `name`、`description` 的後端必填檢查（`gas/Code.gs`）。已新增 2 組迴歸測試。
- **[BUG-02／高] Git 歷史中殘留真實 Spreadsheet ID**：確認該明碼 ID 透過 `v1.0.0`／`v1.1.0`／`v1.2.0` 三個公開 tag（共 33 個 ref，含分支與 PR ref）皆可取得。已用 `git-filter-repo` 於獨立沙盒環境清除全歷史中的該字串，並程式化驗證清除後 0 筆匹配，產出可還原的 git bundle 檔與完整推送指南（含 GitHub 伺服器端快取殘留風險的誠實揭露）。**實際 force push 覆蓋 GitHub 遠端歷史，以及最關鍵的「輪替 Spreadsheet ID」本身，仍須由專案擁有者手動執行**，本版本僅完成沙盒端的清除與驗證。
- **[BUG-03／中] 修復例外訊息資訊洩漏（CWE-209）**：`doGet` / `doPost` / `classifyIntent` / `writeReport` / `getCounter` / `incrementCounter` 先前皆將 `err.toString()` 原樣回傳給前端，可能洩漏內部函式名稱、變數內容等實作細節。現在統一回傳通用錯誤代碼 `'INTERNAL_ERROR'`，詳細內容僅保留在 `Logger.log`（`gas/Code.gs`）。
- **[BUG-08／低] 修復 `counter_increment` 流量限制形同虛設，並調整全域上限**：原本使用者級上限為 999999（等同不限制）且固定使用 `'anonymous'` 當識別碼，任何人皆可直接呼叫 GAS_URL 大量刷高「累積服務人數」。現在依前端傳入的 `clientId` 個別限流（每人每分鐘 3 次）；`counter_get` 同步改為個別限流（每人每分鐘 30 次）。全域上限經使用情境評估後，由原訂每分鐘 30 次調升為 **每分鐘 500 次**，避免新生入住等大量學生同時開啟頁面的尖峰時段誤擋合法計數（`gas/Code.gs`、`js/counter.js`）。已新增 2 組迴歸測試。

### 🐛 功能性錯誤修復 (Bug Fixes)
- **[BUG-04／中] 修復報修表單顯示未翻譯的內部錯誤代碼**：Token 失效重試後仍失敗時，`report.js` 先前會把 `resData.error`（可能是 `'INVALID_TOKEN'`、`'INTERNAL_ERROR'` 等內部代碼）原樣顯示給使用者。現在會判斷是否為內部代碼格式，內部代碼一律改顯示已翻譯的通用錯誤訊息，其餘（如後端驗證訊息）維持原樣顯示（`js/report.js`）。
- **[BUG-06／低] 修復韓文關鍵字備援分類器亂碼**：`gas/Code.gs` 的 `_ruleBasedClassify()` 中，韓文「常見問題」關鍵字字串誤植為 `자주 묻ns 질문`（混入拉丁字母造成亂碼），導致該關鍵字永遠無法匹配真實使用者輸入。已修正為正確韓文「자주 묻는 질문」。
- **[BUG-07／低] 修復 Teams 聯絡備援連結容易被瀏覽器封鎖**：原本在使用者點擊 2.5 秒後才於 `setTimeout` 回呼中呼叫 `window.open()`，已脫離同步的使用者手勢呼叫鏈，容易被瀏覽器（尤其 Safari／iOS）的彈跳視窗封鎖機制擋下。改用與主要深連結相同的「隱藏 `<a target="_blank">` 模擬點擊」手法（`js/teams.js`）。

### 🌐 多語系對應修復 (i18n Fixes)
- **[BUG-05／中] 修復可維修時間欄位的 4 個 aria-label 中英文切換失效**：`index.html` 中 `form.repairTime.startHour` / `startMin` / `endHour` / `endMin` 這 4 個 `data-i18n-aria-label` 屬性值，與 `js/i18n.js` 實際定義的鍵名（多了 `.aria` 後綴）不一致，導致切換語言時這些 aria-label 會直接顯示原始鍵名字串給螢幕報讀器使用者。已將 HTML 屬性值改為對應正確鍵名。另補上原本完全未定義的 `form.repairTime.range` 鍵（中/英文皆有）。已用程式交叉比對確認目前 HTML 使用到的所有 `data-i18n*` 鍵與 `i18n.js` 定義鍵 100% 對齊。

### 🎨 程式碼品質修復 (Code Quality Fixes)
- **[BUG-09／低] 修復 CSS 中文註解亂碼**：`css/style.css` 的 `.text-en` 區塊有 2 處註解混有拉丁字母與 Unicode 私用區字元（如 `\ued2b`）造成的亂碼，已修正為正確中文註解。已程式化掃描全專案（`js/*.js`、`gas/*.gs`、`*.md`、`index.html`）確認無其他遺漏。
- **[BUG-10／低] CSS 硬編碼色碼清理**：`css/style.css` 有 14 處直接寫死十六進位色碼（未走 `:root` 變數），違反 `AGENTS.md` 自訂規範。已新增 7 個語意化變數（`--color-success`、`--color-danger`、`--color-danger-light`、`--color-white`、`--color-teams-purple-light`、`--avatar-bot-from`、`--avatar-bot-to`）並全數替換，現在整份 CSS 檔案的十六進位色碼僅出現在 `:root` 定義本身。
- **[BUG-11／低] ESLint 14 個既有 warning 全數歸零**：新增官方支援的 `/* exported ModuleName */` 指令解決 `Counter`/`Intent`/`ReportForm`/`Teams`/`CONFIG`/`I18N`/`Chat` 這些 IIFE 模組全域變數的 `no-unused-vars` false positive；`eslint.config.js` 補上 `caughtErrorsIgnorePattern: '^_'`（原本只設了 `argsIgnorePattern`，兩者是獨立選項）解決 `catch (_e)` 誤報；移除 `test/validation.test.js` 中 6 處未使用的測試參數。`npm run lint` 結果由 0 error / 14 warning 降為 **0 error / 0 warning**。
- **[INFO-01] Gemini 模型清單時效性查核**：用網路搜尋查證 Google 官方文件，確認 `gemini-3.6-flash`、`gemini-3.5-flash-lite` 等現行模型皆為 2026-08 當下真實有效的 GA 模型，且程式碼移除 `gemini-2.0-flash` 系列的判斷與官方公告的 2026-06-01 棄用時程一致。**過程中發現全專案文件長期誤植模型數量為「9 個模型」，但 `gas/Code.gs` 的 `GEMINI_MODELS_FALLBACK` 陣列實際僅有 6 個模型**（且從未包含文件中提及的 gemini-2.5-flash-lite / gemini-2.5-flash / gemini-2.0-flash / gemini-2.0-flash-lite），此為文件與程式碼長期脫節的既有問題，非本次改動造成，已於本版本一併修正（見下方「文件修正」）。

### 📄 文件修正 (Documentation Fixes)
- 修正 `CHANGELOG.md` 內文誤植的版本號「v3.1」為正確的「v1.3.0」。
- 修正 `AGENTS.md` 檔案結構區塊中 `js/config.js` 該行樹狀符號縮排錯誤。
- **修正全專案文件長期誤植的 Gemini 模型數量**：`README.md`、`AGENTS.md`、`doc/architecture.md`、`doc/requirements.md`、`doc/project-memory.md`、`doc/todo.md` 共 6 處「9 個模型／九模型」修正為實際的「6 個模型／六模型」；`doc/architecture.md` §3.3 的模型清單表格原本列出 4 個從未存在於程式碼中、且部分已遭 Google 官方棄用的模型（gemini-2.5-flash-lite、gemini-2.5-flash、gemini-2.0-flash、gemini-2.0-flash-lite），已對照原始碼逐一核實重寫。
- **`doc/data-model.md` §3 資料驗證規則矩陣重寫**：原表格將後端驗證描述為「僅長度截斷」，未反映 BUG-01 修復後「先必填、後格式、再截斷」的三階段邏輯，已逐欄核實更新，並補上房號的後端格式 RegEx（原表格遺漏）。
- **`doc/requirements.md` §3.4／§4 更新**：報修欄位驗證說明補上「前後端皆強制必填」字樣；測試通過數由「34/34」更新為「42/42」；非功能需求安全性欄補上四層限流與錯誤訊息不外洩的說明。
- **`doc/todo.md` 新增「F 輪：全專案稽核、Bug 修復與文件對齊」章節**，完整記錄本次 v1.3.1 的 12 項修復；單元測試項目數同步由 34 更新為 42。
- **`doc/project-memory.md` 技術決策表補齊 7 筆遺漏的決策記錄**（BUG-02/04/05/06/09/10/11），並修正 2026-08-08 該筆「九模型」為「六模型」；「重要限制」章節新增 Git 歷史清除殘留風險說明。
- **`README.md` 已知安全性說明表格擴充**：新增 `counter_get`／`counter_increment` 流量防護說明、後端「先必填後格式」驗證說明、錯誤訊息不外洩說明、Git 歷史機密殘留現況說明共 4 個新項目；技術架構表與功能特色項目同步修正模型數量。
- 全專案文件（README / AGENTS / CHANGELOG / package.json / doc/*.md）版本號統一更新為 **v1.3.1**。

### 🧪 測試
- `gas-code.test.js` 新增 4 組迴歸測試（BUG-01 × 2、BUG-08 × 2），總測試數由 38 增至 **42**，全數通過；`npm run lint` 由 0 error / 14 warning 改善為 **0 error / 0 warning**。

---

## [v1.3.0] - 2026-08-08 (Security Hardening & Full Documentation Alignment)

### 🛡️ 資安與反濫用防禦 (Security & Anti-Abuse)
- **POST Body 通訊**：敏感個資（學號、手機、房號、床號）與使用者輸入文字全數切換至 `doPost` (Content-Type: `text/plain;charset=utf-8`)，100% 避免暴露於瀏覽器 URL、歷史紀錄與 Web 伺服器 Log。
- **reCAPTCHA v3 隱形驗證**：於報修表單整合 Google reCAPTCHA v3 隱形驗證（風險分數門檻 score ≥ 0.5），防止 GAS_URL 外洩後遭惡意腳本批次發送假案件。
- **一次性 Session Token**：`get_token` 發放 120 秒短效 Token，後端驗證完立刻銷毀（用過即失效）。
- **Client ID 雙層流量限制**：前端 `localStorage` (`fcu_chat_client_id`) 跨頁面穩定識別，後端實作 CacheService 雙層限流（`classify`: 使用者 12/min·全域 60/min；`report`: 使用者 5/min·全域 20/min）。
- **後端強驗證與防護**：`gas/Code.gs` 加入學號 `/^[a-zA-Z][0-9]{7}$/`、手機 `/^[0-9]{10}$/`、床號 `/^[0-9]{1,3}$/` 後端強驗證與長度截斷。

### 🤖 LLM 與多國語言分類器 (LLM & Fallback Classifier)
- **Gemini 九模型三層 RPM 自動備援**：整合 9 個 Gemini 模型（RPM 15/10/5 分級），遇 429 延遲 1.5 秒自動重試切換下一個模型。（📌 v1.3.1 更正說明：此為歷史記錄原文，保留不變；經 v1.3.1 稽核比對 `gas/Code.gs` 原始碼，確認實際的 `GEMINI_MODELS_FALLBACK` 自本版本發布時起即為 6 個模型，本行敘述當時即有誤，詳見上方 [v1.3.1] 文件修正說明）
- **19 語系 Rule-based 備援分類器**：當 LLM API 配額耗盡或異常時，自動降級至支援 19 種語言/地區語言的關鍵字分類引擎。

### 🧪 單元測試與 CI/CD (Testing & CI)
- **Node.js 原生測試與 GAS Mock**：建立 `test/gas-mocks.js` 模擬 GAS 全域物件 (`CacheService`, `PropertiesService`, `UrlFetchApp` 等)，編寫多項單元測試並達 100% 綠勾通過。
- **ESLint 9 Flat Config**：建立 `eslint.config.js` 隔離 Browser, GAS 與 Node 測試環境。
- **GitHub Actions CI**：建立 `.github/workflows/test.yml` 於 Push/PR 時自動執行單元測試與檢驗。

### 📄 文件與規範統一 (Documentation Standardisation)
- **統一版本管理**：全專案文件統一標記為 **v1.3.0 (2026-08-08)**。（v1.3.1 修正：此處原誤植為「v3.1」，已修正為正確版本號）
- **試算表 ID 清理**：移除 `doc/data-model.md` 中的明碼 ID，全專案 100% 無敏感 ID 殘留。
- **全對齊更新**：更新 `README.md`、`AGENTS.md`、`doc/architecture.md`、`doc/requirements.md`、`doc/data-model.md`、`doc/todo.md` 與 `doc/project-memory.md`。

---

## [v1.2.0] - (版本紀錄)

- (保留供後續補齊)

## [v1.1.0] - (版本紀錄)

- (保留供後續補齊)

## [v1.0.0] - 2026-07-27 (Initial Release)

- 初次發布逢甲大學福星宿舍網路報修 Chatbot 系統。
- 支援 Windows / Mac 網路 PDF 教學指南。
- 常見問題 FAQ 解答與 Teams 聯絡深連結整合。
- 線上報修表單自動寫入 Google 試算表。

# 開發待辦清單（todo.md）

**版本 / Version**：v1.4.5  
**最後更新 / Last Updated**：2026-08-29

---

## MVP 優先（可送出報修並寫入試算表）

| 優先級 | 功能 | 狀態 | 說明 |
|---|---|---|---|
| P0 | 選項按鈕介面 | ✅ Done | 教學 / 常見設定 / 報修三按鈕 |
| P0 | 報修表單收集與驗證 | ✅ Done | 七欄位 + 時間純文字提示 |
| P0 | GAS 試算表寫入 | ✅ Done | `writeReport()` |
| P0 | Google Apps Script 部署 | ✅ Done | GAS_URL 已填入 |
| P1 | LLM 語意分析（Gemini） | ✅ Done | `classifyIntent()` 六模型自動備援 |
| P1 | 意圖分類串接前端 | ✅ Done | `intent.js` |
| P1 | 教學文件回覆 | ✅ Done | Windows / Mac PDF 連結 |
| P1 | 常見問題回覆 | ✅ Done | 轉接器韌體建議、WiFi 帳號密碼等常見問題 |
| P2 | 非網管問題轉介 | ✅ Done | 宿舍服務台 / 行動逢甲 |
| P2 | 累積使用人數統計 | ✅ Done | `counter.js` + GAS |
| P3 | GitHub Pages 部署 | ✅ Done | PR → main → Pages 已上線 |

---

## E 輪：資安強化、反濫用與單元測試（2026-08-08）

| 功能 | 狀態 | 說明 |
|---|---|---|
| 敏感個資切換為 POST Body | ✅ Done | 學號 / 手機 / 房號 / 床號改經 `doPost`（`text/plain`），不暴露於 URL |
| 短效 Session Token 驗證 | ✅ Done | `get_token` 發放 120 秒 Token，`_consumeToken` 驗證，使用一次即銷毀 |
| Client ID 裝置區分與雙層限流 | ✅ Done | `localStorage` (`fcu_chat_client_id`) + `_checkRateLimit`（`classify`: 12/60, `report`: 5/20） |
| reCAPTCHA v3 隱形驗證 | ✅ Done | 報修表單整合 grecaptcha (score ≥ 0.5)，防止外洩 URL 被濫用 |
| 後端格式強驗證 (RegEx) | ✅ Done | `gas/Code.gs` 加入學號 `/^[a-zA-Z][0-9]{7}$/`、手機 `/^[0-9]{10}$/`、床號 `/^[0-9]{1,3}$/` 後端二次驗證 |
| 明碼 試算表 ID 移除 | ✅ Done | 移除 `doc/data-model.md` 明碼 ID，改存 GAS Script Properties |
| 19 語系 Rule-based 備援分類器 | ✅ Done | `gas/Code.gs` 整合 19 語系關鍵字比對 |
| Node.js 原生單元測試套件 | ✅ Done | 建立 `test/gas-mocks.js` Mock GAS 全域服務，涵蓋 34 個單元測試項 (100% Passing)（**v1.3.1 更新**：已增至 42 個，見下方 F 輪）|
| GitHub Actions CI/CD | ✅ Done | 建立 `.github/workflows/test.yml` 自動跑 `npm test` |
| ESLint 9 Flat Config 規範 | ✅ Done | 建立 `eslint.config.js` 分離 Browser, GAS, Node 測試環境 |

---

## F 輪：全專案稽核、Bug 修復與文件對齊（2026-08-09 / v1.3.1）

| 功能 | 狀態 | 說明 |
|---|---|---|
| `writeReport()` 後端必填驗證繞過修復 | ✅ Done | 修正 `field && !regex.test(field)` 空字串繞過驗證的缺陷（BUG-01），改為「先必填、後格式」，新增 2 組迴歸測試 |
| 後端例外資訊洩漏修復 | ✅ Done | `doGet`／`doPost`／`classifyIntent`／`writeReport`／`getCounter`／`incrementCounter` 統一回傳固定代碼 `INTERNAL_ERROR`，不外洩 `err.toString()`（BUG-03 / CWE-209）|
| 報修表單內部錯誤碼外露修復 | ✅ Done | `report.js` 不再把 `INVALID_TOKEN` 等內部代碼原樣顯示給使用者（BUG-04）|
| 可維修時間 aria-label 中英文切換失效修復 | ✅ Done | 修正 `index.html` 與 `js/i18n.js` 之間 4 個鍵名不對齊問題，並補上缺漏的 `form.repairTime.range` 鍵（BUG-05）|
| 韓文備援分類器亂碼修復 | ✅ Done | `_ruleBasedClassify()` 中「자주 묻ns 질문」修正為正確韓文「자주 묻는 질문」（BUG-06）|
| Teams 備援連結易被封鎖修復 | ✅ Done | 改用隱藏 `<a target="_blank">` 模擬點擊取代延遲的 `window.open()`（BUG-07）|
| 計數器端點流量限制形同虛設修復 | ✅ Done | `counter_increment` 改為依 `clientId` 個別限流（3 次/分鐘），全域上限自 30 次/分鐘先調整為 500 次/分鐘（避免尖峰時段誤擋合法計數）；`counter_get` 同步改為個別限流 30 次/分鐘（BUG-08）|
| CSS 中文註解亂碼修復 | ✅ Done | `.text-en` 區塊 2 處混有拉丁字母與私用字元的亂碼註解，修正為正確中文（BUG-09）|
| CSS 硬編碼色碼清理 | ✅ Done | 14 處硬編碼十六進位色碼改為 `:root` 語意化變數，符合 `AGENTS.md` 既有規範（BUG-10）|
| ESLint warning 歸零 | ✅ Done | 新增 `/* exported X */` 指令、`caughtErrorsIgnorePattern` 設定，移除測試檔未用參數，14 個 warning 全數消除（BUG-11）|
| Git 歷史機密清除 | ✅ Done（沙盒端） | 用 `git-filter-repo` 清除全歷史（33 個 ref）中殘留的真實 Spreadsheet ID，產出可還原的 git bundle 與推送指南；實際 force push 到 GitHub 需專案擁有者執行（BUG-02）|
| Gemini 模型清單時效性查核 | ✅ Done | 查證 Google 官方文件，確認 `GEMINI_MODELS_FALLBACK` 實際為 6 個模型（非文件原先誤植的 9 個），且 gemini-2.0 系列已於官方棄用時程內移除，屬正確判斷（INFO-01）|
| 全專案文件版本號與內容對齊 | ✅ Done | README / AGENTS / CHANGELOG / doc/*.md 版本號統一為 v1.3.1，修正「9 個模型」「34 個測試」等多處與程式碼不符的敘述 |

---

## A 輪：Gemini 意圖分類優化（2026-07-27）

| 功能 | 狀態 | 說明 |
|---|---|---|
| 信心分數回傳 | ✅ Done | GAS `classifyIntent()` 改回傳 `{intent, confidence, needsConfirmation}` |
| 前端 25 秒 Timeout Protection | ✅ Done | `intent.js` 加 AbortController 逾時防護 |
| 低信心確認 UI | ✅ Done | `chat.js` needsConfirmation 時顯示確認 + 主選單按鈕 |

---

## B 輪：Teams 聯絡功能（2026-07-27）

| 功能 | 狀態 | 說明 |
|---|---|---|
| CONFIG.TEAMS 設定區塊 | ✅ Done | `config.js`，Email: `desk_dorm@o365.fcu.edu.tw` |
| teams.js 模組 | ✅ Done | IIFE，`open()` + `copyAccountName()` |
| Header 常駐「聯絡我們」按鈕 | ✅ Done | `index.html` + `css/style.css` |
| Teams chat 深連結 | ✅ Done | `https://teams.microsoft.com/l/chat/0/0?users=desk_dorm@o365.fcu.edu.tw` |
| 平台備援跳轉 | ✅ Done | iOS App Store / Android Play Store / 桌面 Teams 網頁版 |
| 備援步驟說明 + 一鍵複製 | ✅ Done | `chat.js` `_handleTeamsClick()` |

---

## D 輪：手機優化（2026-08-07）

| 功能 | 狀態 | 說明 |
|---|---|---|
| viewport maximum-scale=1.0 | ⚠️ 已移除 | 原用於防止 iOS 打字時自動放大，但因違反 WCAG 1.4.4 無障礙縮放需求，已於 2026-08-08 從 `index.html` meta 標籤移除，改由下一項 font-size 技巧達成同等效果 |
| input/textarea font-size 16px | ✅ Done | 取代 `maximum-scale=1.0` 的無障礙友善做法：手機下強制 16px 避免 iOS 觸發自動縮放，同時保留使用者手動縮放能力（`css/style.css`） |
| 窄螢幕完全隱藏計數器 | ✅ Done | 寬度 ≤640px 時 `.header-counter { display: none }`，JS 仍照常計數（`css/style.css`） |
| GitHub Pages CDN 快取清除 | ✅ Done | 舊版 CSS（480px 斷點）被 CDN 快取，更新 CSS 頂部時間戳記強制重新部署 |

---

## G 輪：報修案件查詢功能、全面稽核與安全修復（2026-08-21 / v1.4.0）

| 功能 | 狀態 | 說明 |
|---|---|---|
| 報修案件查詢 | ✅ Done | 學生輸入學號可查詢自己的報修案件狀態；`queryReport()` 後端、`query.js` 前端、`BUTTON_QUERY` 意圖辨識 |
| XSS 修復（BUG-13） | ✅ Done | `query.js` `_renderResults()` 對試算表欄位做 HTML 轉義，防止使用者可控資料觸發 XSS |
| 前端驗證語意修復（BUG-12） | ✅ Done | `query.js` `_validate()` 分拆學號空白 vs 格式錯誤兩種訊息，與後端一致 |
| 文件對齊（BUG-14, 18, 19） | ✅ Done | `doc/architecture.md` 補 `queryReport()` 函式、資料流、Mermaid 圖；修正 §4.2 遺留的「9 個模型」錯誤；`AGENTS.md` / `README.md` 補查詢功能說明 |
| 全站版本號對齊 v1.4.0 | ✅ Done | 所有 `.md`、`package.json` 版本號統一為 v1.4.0 |
| 單元測試增至 53 項 | ✅ Done | `npm test` 53 pass / 0 fail；`npm run lint` 0 error / 0 warning |

---

## H 輪：UI/UX 微調與文件/安全性收尾 (2026-08-21 / v1.4.1)

| 功能 | 狀態 | 說明 |
|---|---|---|
| 主選單 UI 順序調整 | ✅ Done | 查詢案件移至報修之前，以符合多數使用者的操作邏輯 (UI-01) |
| Teams 複製按鈕圖示保留 | ✅ Done | `teams.js` 改用 `innerHTML` 替換 `textContent`，防止原 SVG 圖示在複製後遺失 (BUG-30) |
| 後端錯誤訊息中文化修正 | ✅ Done | `gas/Code.gs` 將所有的驗證與限流錯誤改為英文大寫代碼 (如 `RATE_LIMITED`)，交由前端 `report.js` 與 `query.js` 翻譯，解決英文版畫面跳出中文錯誤的漏洞 (BUG-29) |
| 工作表錯誤訊息資訊洩漏修復 | ✅ Done | 找不到工作表時改回傳 `SHEET_NOT_FOUND`，防止洩漏 `SHEET_NAME` 設定值 (BUG-28) |
| 全專案文件漏列修復 | ✅ Done | 補上遺漏的 `js/query.js` 模組說明、五組限流數、測試數、載入順序等，並對齊所有檔案版本至 v1.4.1 (BUG-20~27, 31~33) |

---

## I 輪：Wi-Fi 機設定教學、查詢後續按鈕、全面稽核（2026-08-29 / v1.4.5）

| 功能 | 狀態 | 說明 |
|---|---|---|
| Wi-Fi 機設定教學 Modal | ✅ Done | 教學選單新增第三選項，純前端 4 步驟圖文教學，不呼叫 GAS（`js/wifi-modal.js`） |
| 查詢完成後顯示後續按鈕 | ✅ Done | `Chat.onQuerySuccess()` 補上「回主選單／報修」按鈕，與報修成功體驗一致 |
| ESLint 全域缺漏修復（BUG-44） | ✅ Done | `eslint.config.js` 補上 `WifiModal` 全域宣告，修復 CI `npm run lint` 失敗（`no-undef`） |
| 房號／床號／手機號碼欄位 i18n 修復（BUG-45） | ✅ Done | 三欄位 placeholder 原為寫死英文，改用 `data-i18n-placeholder` 並補上 `i18n.js` 對應中英文字串 |
| 打字指示器 aria-label 修復（BUG-46） | ✅ Done | 原本建立當下寫死中文，英文介面下仍朗讀中文；改為建立當下即以 `I18N.t()` 取值 |
| Wi-Fi Modal 無障礙焦點修復（BUG-47） | ✅ Done | `<h2>` 標題補上 `tabindex="-1"`，讓 `.focus()` 實際生效；並補上背景捲動鎖定（與另兩個 Modal 一致） |
| 註解錯字修正（BUG-48） | ✅ Done | `intent.js`「無限迄迴」→「無限循環」；`query.js`「查詢完是」→「查詢完成後」 |
| 後端錯誤代碼一致性修正（BUG-49） | ✅ Done | `classifyIntent()` 的 `GEMINI_API_KEY` 未設定訊息改為固定代碼 `GEMINI_API_KEY_NOT_CONFIGURED`，比照其餘錯誤路徑慣例 |
| 死碼清理：報修表單 Modal 內成功畫面（BUG-50） | ✅ Done | 移除自 v1.1.0 行為回復後即無程式路徑觸發的 `#modal-success-view`／`.is-hidden`／`.has-success`／`.text-en` |
| README 多語系備援表格式修復（BUG-51） | ✅ Done | 第 19 項合併埃及阿拉伯文與厄瓜多西班牙文，原表格缺西班牙語範例關鍵字；補上並加註說明合併計數原因 |
| 全站文件補上 Wi-Fi Modal 說明 | ✅ Done | `AGENTS.md` 檔案樹、`doc/architecture.md` 模組表、`doc/requirements.md` §3.1/§3.7 補齊 |
| 全站版本號對齊 v1.4.5 | ✅ Done | 所有 `.md`、`package.json` 版本號統一為 v1.4.5 |
| 單元測試維持 53 項全數通過 | ✅ Done | `npm test` 53 pass / 0 fail；`npm run lint` 0 error / 0 warning（修復 BUG-44 後恢復綠燈） |

> ⚠️ **待人工確認（未動作）**：`doc/project-memory.md` 內記載一組已輪替失效的
> Spreadsheet ID 明碼，與 `AGENTS.md` 規範 5「不得硬編碼於任何文件」字面上牴觸；
> 是否要改為遮蔽格式（如 `1BUnG_...79uI`），待專案擁有者確認後再處理。

---

## 未來優化（v2）

| 功能 | 說明 |
|---|---|
| 多輪對話記憶 | 記錄本次 session 對話歷史 |
| 管理員後台 | 網管人員專用的案件管理頁面 |
| LINE / Email 通知 | 報修成功後自動通知網管人員 |
| 對話紀錄寫入 | 將分類結果寫入第二個試算表 |

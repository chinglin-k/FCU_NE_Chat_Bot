# 專案決策記錄（project-memory.md）

> 僅在確認新決策、修改既有決策或發現重要限制時更新。
> 每次更新須記錄日期、原因與影響範圍。

**版本 / Version**：v1.4.5  
**最後更新 / Last Updated**：2026-08-29

---

## 技術決策

| 日期 | 決策 | 原因 | 影響範圍 |
|---|---|---|---|
| 2026-07-17 | 前端使用純 HTML+CSS+JS，不用框架 | GitHub Pages 免費托管無需 build 流程，維護門檻低 | 全站 |
| 2026-07-17 | LLM API 呼叫透過 GAS 代理 | API Key 不得出現在前端或 Git | `gas/Code.gs`、`js/intent.js` |
| 2026-08-08 | 全面切換為 POST Body (text/plain) 通訊 | 避免敏感個資（學號/電話/對話）暴露於 GET URL Log 或瀏覽器紀錄 | `gas/Code.gs`、`js/intent.js`、`js/report.js` |
| 2026-08-08 | 實作記憶體層級一次性 Session Token (`get_token`) | 防止未授權請求或跨站偽造呼叫，用一次即失效，頁面重整後自動重新發放 | `gas/Code.gs`、`js/chat.js` |
| 2026-08-08 | 導入 Client ID 與雙層流量限制 (User & Global) | Client ID 存於 localStorage (`fcu_chat_client_id`) 跨頁面穩定，防刷流量（`classify`: 12/60, `report`: 5/20） | `gas/Code.gs`、`js/chat.js` |
| 2026-08-08 | 整合 Google reCAPTCHA v3 隱形驗證 | 僅報修表單使用（門檻 score ≥ 0.5），防止 GAS_URL 外洩遭大量腳本濫用 | `index.html`、`js/config.js`、`js/report.js`、`gas/Code.gs` |
| 2026-08-09 | `writeReport()` 後端驗證改為「先必填、後格式」 | 原本 `field && !regex.test(field)` 寫法在欄位為空字串時會整段跳過驗證，等同必填形同虛設（BUG-01） | `gas/Code.gs`、`test/gas-code.test.js` |
| 2026-08-09 | 後端例外一律回傳通用錯誤代碼，不回傳 `err.toString()` | 避免內部實作細節（函式名稱、變數內容）透過錯誤訊息外洩給前端（BUG-03 / CWE-209） | `gas/Code.gs` |
| 2026-08-09 | `counter_increment` 改為依 `clientId` 個別限流（3 次/分鐘），全域上限由 30 次/分鐘調整為 500 次/分鐘 | 原本使用者級上限 999999 形同不限制，任何人可直接刷高累積人數（BUG-08）；後續依使用情境回饋，30/分鐘的全域上限在新生入住等大量學生同時開啟頁面的尖峰時段容易誤擋合法計數，調升為 500/分鐘 | `gas/Code.gs`、`js/counter.js` |
| 2026-08-09 | Teams 備援跳轉改用隱藏 `<a>` 模擬點擊，不再用延遲的 `window.open()` | 延遲呼叫的 `window.open()` 容易被瀏覽器彈跳視窗封鎖機制擋下（BUG-07） | `js/teams.js` |
| 2026-08-09 | 報修表單不再顯示未翻譯的內部錯誤代碼 | `report.js` 原本會把 `INVALID_TOKEN` 等內部代碼原樣顯示給使用者，改為僅顯示已翻譯的通用錯誤訊息（BUG-04） | `js/report.js` |
| 2026-08-09 | 修正可維修時間 4 個欄位的 aria-label 鍵名不對齊 | `index.html` 使用的 `data-i18n-aria-label` 鍵名與 `js/i18n.js` 實際定義（多了 `.aria` 後綴）不一致，導致切換英文時顯示原始鍵名字串；同時補上缺漏的 `form.repairTime.range` 鍵（BUG-05） | `index.html`、`js/i18n.js` |
| 2026-08-09 | 修正韓文備援分類器關鍵字亂碼 | `_ruleBasedClassify()` 中「자주 묻ns 질문」混入拉丁字母造成永遠無法匹配，修正為正確韓文「자주 묻는 질문」（BUG-06） | `gas/Code.gs` |
| 2026-08-09 | CSS 中文註解亂碼與硬編碼色碼清理 | `.text-en` 區塊 2 處註解混有亂碼字元；另有 14 處色碼未走 `:root` 變數，違反既有 CSS 規範（BUG-09、BUG-10） | `css/style.css` |
| 2026-08-09 | ESLint 14 個 warning 全數歸零 | 新增 `/* exported X */` 官方指令解決模組全域變數 false positive，補上 `caughtErrorsIgnorePattern` 設定，移除測試檔未用參數（BUG-11） | `js/*.js`、`eslint.config.js`、`test/validation.test.js` |
| 2026-08-09 | 清除 Git 歷史中殘留的真實 Spreadsheet ID | 確認 `v1.0.0`／`v1.1.0`／`v1.2.0` 三個 tag 對應歷史（共 33 個 ref）中仍可取得明碼 ID，用 `git-filter-repo` 於沙盒端清除並驗證全歷史 0 匹配，產出可還原的 git bundle；實際 force push 覆蓋 GitHub 遠端歷史需專案擁有者執行（BUG-02） | `.git` 歷史（不影響工作目錄任何檔案）|
| 2026-08-08 | 六模型 Gemini 三層 RPM 自動切換與 429 重試 | 充份利用 15/5 RPM 額度，遇 429 延遲 1.5s 重試切換下一個模型（**v1.3.1 文件更正**：原記錄誤植為「九模型」，經比對 `gas/Code.gs` 原始碼後確認實際為 6 個模型） | `gas/Code.gs`、`doc/architecture.md` |
| 2026-08-08 | 學號格式強驗證：1 位英文字母 + 7 位數字 | 對齊校方學號標準格式（如 `D1234567`），前後端雙重 RegEx 驗證 | `index.html`、`js/report.js`、`gas/Code.gs` |
| 2026-08-08 | 19 語系 Rule-based 備援分類器 | 確保 Gemini 失敗時仍可精準回應各國籍學生 | `gas/Code.gs`、`README.md` |
| 2026-08-08 | 建置 Node.js 原生單元測試與 ESLint 9 Flat Config | 建立 `gas-mocks.js` 模擬 GAS 全域環境，確保 CI/CD 自動化測試通過 | `package.json`、`eslint.config.js`、`test/` |
| 2026-08-21 | 新增報修案件查詢功能 (`queryReport`) | 學生輸入學號即可查詢自己的報修進度；回傳欄位刻意排除姓名與手機號碼（個資最小化），所有欄位值前端渲染前做 HTML 轉義（`_esc()`，BUG-13 XSS 防護）；頻率限制 10/分鐘·40/分鐘 | `gas/Code.gs`、`js/query.js`、`js/chat.js`、`js/config.js`、`index.html` |
| 2026-08-21 | Gemini 意圖分類新增 `BUTTON_QUERY` 代碼 | Prompt 與 `_ruleBasedClassify()` 同步新增，涵蓋 19 語系備援關鍵字 | `gas/Code.gs`、`js/intent.js`、`js/config.js` |
| 2026-08-21 | 主選單按鈕順序調整：查詢在報修前 | 查詢是唯讀操作、使用門檻較低，放在報修前可提高可見度 | `js/chat.js` |

---

## 已確認業務規則

- 可維修時間建議範圍：**18:00–21:00**（本人需在場）
- 新生入住期間 **12:00–17:00** 網管看到後會盡速前往
- 報修欄位必填：姓名、學號（1字母+7數字）、房號、床號（1–3數字）、手機（10數字）、可維修時間、問題描述
- 報修成功介面僅保留「報修成功！」與進度條，隱藏標題列 Header
- 試算表中「是否派人」「是否完成」「備註」由網管手動填寫，系統不填
- 非網管業務（冷氣、洗手台等）轉介至宿舍服務台或行動逢甲 App

---

## 重要限制

- GitHub Pages 為靜態托管，**無法在前端執行伺服器端邏輯**
- GAS 免費版每日執行次數限制：6 分鐘執行時間，每日可處理約 500+ 次分類
- **Git 歷史清除的殘留風險（v1.3.1 新增；v1.4.2 實測確認並由專案擁有者澄清）**：
  即使用 `git-filter-repo` 清除機密後 force push 到 GitHub，已關閉／已合併 PR 的
  `refs/pull/*/head` 參照、第三方封存服務（如 Software Heritage）、其他人的
  fork，仍可能保留舊版明碼內容，Git 層級操作無法強制觸及這些位置。
  **v1.4.2 稽核時已用 `git ls-remote` + `git fetch refs/pull/*/head` 實際驗證**：
  真實 Spreadsheet ID（`1BUnG_...79uI`，已遮蔽，v1.4.5 依 AGENTS.md 規範修訂）確實仍可
  透過 PR ref 取得。**專案擁有者已確認該 ID 已完成輪替，舊 ID 已失效**，故此
  殘留參照目前僅為歷史資訊、無實質風險；`README.md`／`doc/architecture.md`
  已於 v1.4.2 更新為反映此現況。若未來有其他機密（API Key 等）誤入歷史，
  仍建議洽 GitHub Support 清除 PR ref 層級快取，而非僅依賴歷史清除 + 輪替。

---

## v1.4.4／v1.4.5 決策記錄（2026-08-29）

| 日期 | 決策 | 理由 | 影響檔案 |
|---|---|---|---|
| 2026-08-29 | 新增 Wi-Fi 機設定教學 Modal（`js/wifi-modal.js`） | 教學選單原僅有 Windows / Mac 兩個系統別 PDF 連結，Wi-Fi 分享器設定缺乏站內圖文教學；改為純前端靜態 4 步驟 Modal，不呼叫 GAS，不消耗任何頻率限制配額 | `js/wifi-modal.js`（新增）、`js/chat.js`、`js/config.js`、`js/i18n.js`、`index.html`、`css/style.css` |
| 2026-08-29 | 查詢案件完成後補上「回主選單／報修」按鈕 | 原本查詢完成後對話即中斷，使用者需自行輸入文字才能繼續操作；`Chat.onQuerySuccess()` 補上按鈕群組，與報修成功後的體驗一致 | `js/chat.js`、`js/query.js` |
| 2026-08-29 | 全面稽核修復（BUG-44~51，詳見 `CHANGELOG.md`） | 例行程式碼 vs. 文件一致性稽核，本次聚焦新功能（Wi-Fi Modal）上線後遺漏的 `eslint.config.js` 全域宣告、i18n 涵蓋率、無障礙焦點管理、死碼清理 | 詳見 `CHANGELOG.md` v1.4.5 |
| 2026-08-29 | 移除報修表單「Modal 內成功畫面」死碼 | `_handleSuccess()` 自 v1.1.0 行為回復後即直接關閉 Modal、於聊天區顯示成功訊息，`#modal-success-view`／`.is-hidden`／`.has-success`／`.text-en` 等標記與樣式已無任何程式路徑會觸發，經逐一 `grep` 確認零引用後移除 | `index.html`、`js/report.js`、`js/i18n.js`、`css/style.css` |


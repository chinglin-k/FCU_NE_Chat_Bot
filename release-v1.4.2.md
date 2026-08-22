# v1.4.2 - Documentation Audit & Bug Fixes

本版本為全專案「程式碼 vs. 文件」逐行一致性稽核的修補更新，範圍涵蓋全部原始碼、各項說明文件（`doc/*.md`）、專案設定檔（`package.json` 等）。本次稽核過程執行了完整單元測試（53/53 通過）、ESLint（0 error/0 warning）、`git blame`/`git log` 歷史追蹤，並對 GitHub 遠端 PR 參照的歷史機密殘留進行了實測驗證，以確保全站程式、文件與版本號的精確對齊。

This release is a comprehensive "Code vs. Documentation" line-by-line consistency audit and patch update. The audit covers the entire codebase, all documentation (`doc/*.md`), and project configuration files (e.g., `package.json`). During this process, full unit tests (53/53 passed), ESLint (0 errors/0 warnings), `git blame`/`git log` historical tracking, and empirical verification of historical secret residuals in GitHub remote PR references were executed to ensure precise alignment across the codebase, documentation, and version numbers.

---

### 🛡️ 安全性修復與釐清 (Security Fixes & Clarifications)

*   **[BUG-34] Git 歷史機密殘留範圍釐清 (Clarification on Git History Secret Residuals)**
    *   **ZH**: 實測以 `git ls-remote` + `git fetch refs/pull/*/head` 驗證，確認舊版 Spreadsheet ID 目前仍可透過 GitHub 已關閉／已合併 PR 的參照取得（這是 `git-filter-repo` + force push 無法觸及 PR ref 的已知限制）。經專案擁有者確認，**該 Spreadsheet ID 已完成輪替、舊 ID 已失效**，故目前殘留的參照已無實質風險。相關說明文件（`README.md`、`doc/architecture.md`、`doc/project-memory.md`）已更新為如實反映此現況。
    *   **EN**: Empirically verified via `git ls-remote` + `git fetch refs/pull/*/head` that the old Spreadsheet ID is still accessible through references of closed/merged PRs on GitHub (a known limitation of `git-filter-repo` + force push, which cannot reach PR refs). As confirmed by the project owner, **the Spreadsheet ID has been successfully rotated and the old ID is invalidated**, neutralizing any substantive risk. Relevant documentation (`README.md`, `doc/architecture.md`, `doc/project-memory.md`) has been updated to accurately reflect this current status.

*   **[BUG-35] CSP `connect-src` 移除不必要的網域 (Removal of Unnecessary Domains in CSP `connect-src`)**
    *   **ZH**: `index.html` 的 Content-Security-Policy 原本將 `generativelanguage.googleapis.com` 列入白名單，但前端 JavaScript 從未直接呼叫 Gemini API（僅由後端 `gas/Code.gs` 呼叫）。依循最小權限原則，已將此不必要的權限放寬移除。
    *   **EN**: The Content-Security-Policy in `index.html` originally whitelisted `generativelanguage.googleapis.com`. Since the frontend JavaScript never directly calls the Gemini API (only the backend `gas/Code.gs` does), this unnecessary permission relaxation has been removed in accordance with the principle of least privilege.

*   **[BUG-36] `.env.example` 補上遺漏的 `RECAPTCHA_SECRET_KEY` (Added Missing `RECAPTCHA_SECRET_KEY` to `.env.example`)**
    *   **ZH**: `AGENTS.md` 與 `gas/Code.gs` 皆將 `RECAPTCHA_SECRET_KEY` 列為必要的 Script Property，但 `.env.example` 範本先前漏列。現已補上並特別註明其為不可公開的 Secret Key。
    *   **EN**: Both `AGENTS.md` and `gas/Code.gs` list `RECAPTCHA_SECRET_KEY` as a required Script Property, but it was previously missing from the `.env.example` template. It has now been added with a specific note distinguishing it as a non-public Secret Key.

### 🐛 文件與介面正確性修復 (Documentation & UI Correctness Fixes)

*   **[BUG-37] CSS 亂碼註解全面修復 (Comprehensive Fix for Garbled CSS Comments)**
    *   **ZH**: 稽核發現 `css/style.css` 仍有 14 處編碼損毀的中文註解殘留（源自較早的 commit）。現已依上下文語意，重新建立為可讀的繁體中文註解（如 `/* ── Reset 基礎設定 ── */`、`/* ── 表單錯誤訊息 ── */` 等），不影響任何 CSS 選擇器或樣式規則。
    *   **EN**: An audit revealed 14 residual instances of corrupted encoding in Chinese comments within `css/style.css` (stemming from an earlier commit). These have now been reconstructed into readable Traditional Chinese comments based on context (e.g., `/* ── Reset 基礎設定 ── */`, `/* ── 表單錯誤訊息 ── */`), without affecting any CSS selectors or styling rules.

*   **[BUG-38] 前端模組表補上 `js/query.js` (Added `js/query.js` to Frontend Modules Table)**
    *   **ZH**: `doc/architecture.md` 的前端模組總覽表（§3.1）先前遺漏了 `js/query.js`，現已補齊，確保與檔案結構圖完全一致。
    *   **EN**: The frontend modules overview table (§3.1) in `doc/architecture.md` previously omitted `js/query.js`. It has now been added to ensure complete consistency with the file structure diagram.

*   **[BUG-39] `maximum-scale=1.0` 過時敘述修正 (Correction of Outdated `maximum-scale=1.0` Statements)**
    *   **ZH**: `doc/architecture.md` 與 `doc/todo.md` 原先仍記載使用 `maximum-scale=1.0` 防止 iOS 自動縮放，但該設定早因無障礙需求（WCAG 1.4.4）被移除。現已更新文件，正確描述為「改由 `css/style.css` 於窄螢幕下強制 `input`/`textarea` 使用 16px 字體」的無障礙友善做法。
    *   **EN**: `doc/architecture.md` and `doc/todo.md` originally still documented the use of `maximum-scale=1.0` to prevent iOS auto-zooming, although this setting was previously removed to comply with accessibility requirements (WCAG 1.4.4). The documentation has now been updated to accurately describe the accessibility-friendly approach of "forcing `input`/`textarea` to use a 16px font size on narrow screens via `css/style.css`."

*   **[BUG-40] 全站版本號統一升級 (Unified Version Upgrade Across the Entire Project)**
    *   **ZH**: 全專案所有包含版本號的檔案（如 `package.json`、`README.md`、`CHANGELOG.md` 及所有 `doc/*.md`）已全數一致對齊至 **v1.4.2**，消除原先文件中版本號互相矛盾的問題。
    *   **EN**: All files containing version numbers across the project (such as `package.json`, `README.md`, `CHANGELOG.md`, and all `doc/*.md`) have been consistently aligned to **v1.4.2**, eliminating previously contradictory version numbers in the documentation.

### ✅ 本次稽核確認無問題的項目 (Verified Clean — No Action Needed)

*   `chat.js` 與 `query.js` 的 XSS 防護模式（轉義與 Markdown 渲染順序）邏輯正確，無注入風險。
*   目前工作目錄與 `main` / tag 分支歷史中無其他明碼機密。
*   雙層速率限制、reCAPTCHA v3 驗證、一次性 Token 機制、後端三段式驗證均正確實作且與文件描述一致。
*   測試套件（53/53）與 ESLint 均運作正常。

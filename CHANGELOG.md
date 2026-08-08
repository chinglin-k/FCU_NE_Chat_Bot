# 更新日誌 (Changelog)

所有本專案的重要變更皆將記錄於此文件中。

**版本 / Version**：v1.1.0 (Spec v3.1)  
**最後更新 / Last Updated**：2026-08-08

---

## [v1.1.0] - 2026-08-08 (Security Hardening & Full Documentation Alignment)

### 🛡️ 資安與反濫用防禦 (Security & Anti-Abuse)
- **POST Body 通訊**：敏感個資（學號、手機、房號、床號）與使用者輸入文字全數切換至 `doPost` (Content-Type: `text/plain;charset=utf-8`)，100% 避免暴露於瀏覽器 URL、歷史紀錄與 Web 伺服器 Log。
- **reCAPTCHA v3 隱形驗證**：於報修表單整合 Google reCAPTCHA v3 隱形驗證（風險分數門檻 score ≥ 0.5），防止 GAS_URL 外洩後遭惡意腳本批次發送假案件。
- **一次性 Session Token**：`get_token` 發放 120 秒短效 Token，後端驗證完立刻銷毀（用過即失效）。
- **Client ID 雙層流量限制**：前端 `localStorage` (`fcu_client_id`) 跨頁面穩定識別，後端實作 CacheService 雙層限流（`classify`: 使用者 12/min·全域 60/min；`report`: 使用者 5/min·全域 20/min）。
- **後端強驗證與防護**：`gas/Code.gs` 加入學號 `/^[a-zA-Z][0-9]{7}$/`、手機 `/^[0-9]{10}$/`、床號 `/^[0-9]{1,3}$/` 後端強驗證與長度截斷。

### 🤖 LLM 與多國語言分類器 (LLM & Fallback Classifier)
- **Gemini 九模型三層 RPM 自動備援**：整合 9 個 Gemini 模型（RPM 15/10/5 分級），遇 429 延遲 1.5 秒自動重試切換下一個模型。
- **19 語系 Rule-based 備援分類器**：當 LLM API 配額耗盡或異常時，自動降級至支援 19 種語言/地區語言的關鍵字分類引擎。

### 🧪 單元測試與 CI/CD (Testing & CI)
- **Node.js 原生測試與 GAS Mock**：建立 `test/gas-mocks.js` 模擬 GAS 全域物件 (`CacheService`, `PropertiesService`, `UrlFetchApp` 等)，編寫 34 項單元測試並達 100% 綠勾通過。
- **ESLint 9 Flat Config**：建立 `eslint.config.js` 隔離 Browser, GAS 與 Node 測試環境。
- **GitHub Actions CI**：建立 `.github/workflows/test.yml` 於 Push/PR 時自動執行單元測試與檢驗。

### 📄 文件與規範統一 (Documentation Standardisation)
- **統一版本管理**：全專案文件統一標記為 **v3.1 (2026-08-08)**。
- **試算表 ID 清理**：移除 `doc/data-model.md` 中的明碼 ID，全專案 100% 無敏感 ID 殘留。
- **全對齊更新**：更新 `README.md`、`AGENTS.md`、`doc/architecture.md`、`doc/requirements.md`、`doc/data-model.md`、`doc/todo.md` 與 `doc/project-memory.md`。

---

## [v1.0.0] - 2026-07-27 (Initial Release)

- 初次發布逢甲大學福星宿舍網路報修 Chatbot 系統。
- 支援 Windows / Mac 網路 PDF 教學指南。
- 常見問題 FAQ 解答與 Teams 聯絡深連結整合。
- 線上報修表單自動寫入 Google 試算表。

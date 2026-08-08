# 專案決策記錄（project-memory.md）

> 僅在確認新決策、修改既有決策或發現重要限制時更新。
> 每次更新須記錄日期、原因與影響範圍。

**版本 / Version**：v1.1.0 (Spec v3.1)  
**最後更新 / Last Updated**：2026-08-08

---

## 技術決策

| 日期 | 決策 | 原因 | 影響範圍 |
|---|---|---|---|
| 2026-07-17 | 前端使用純 HTML+CSS+JS，不用框架 | GitHub Pages 免費托管無需 build 流程，維護門檻低 | 全站 |
| 2026-07-17 | LLM API 呼叫透過 GAS 代理 | API Key 不得出現在前端或 Git | `gas/Code.gs`、`js/intent.js` |
| 2026-08-08 | 全面切換為 POST Body (text/plain) 通訊 | 避免敏感個資（學號/電話/對話）暴露於 GET URL Log 或瀏覽器紀錄 | `gas/Code.gs`、`js/intent.js`、`js/report.js` |
| 2026-08-08 | 實作記憶體層級一次性 Session Token (`get_token`) | 防止未授權請求或跨站偽造呼叫，用一次即失效，頁面重整後自動重新發放 | `gas/Code.gs`、`js/chat.js` |
| 2026-08-08 | 導入 Client ID 與雙層流量限制 (User & Global) | Client ID 存於 localStorage (`fcu_client_id`) 跨頁面穩定，防刷流量（`classify`: 12/60, `report`: 5/20） | `gas/Code.gs`、`js/chat.js` |
| 2026-08-08 | 整合 Google reCAPTCHA v3 隱形驗證 | 僅報修表單使用（門檻 score ≥ 0.5），防止 GAS_URL 外洩遭大量腳本濫用 | `index.html`、`js/config.js`、`js/report.js`、`gas/Code.gs` |
| 2026-08-08 | 九模型 Gemini 三層 RPM 自動切換與 429 重試 | 充份利用 15/10/5 RPM 額度，遇 429 延遲 1.5s 重試切換下一個模型 | `gas/Code.gs`、`doc/architecture.md` |
| 2026-08-08 | 學號格式強驗證：1 位英文字母 + 7 位數字 | 對齊校方學號標準格式（如 `D1234567`），前後端雙重 RegEx 驗證 | `index.html`、`js/report.js`、`gas/Code.gs` |
| 2026-08-08 | 19 語系 Rule-based 備援分類器 | 確保 Gemini 失敗時仍可精準回應各國籍學生 | `gas/Code.gs`、`README.md` |
| 2026-08-08 | 建置 Node.js 原生單元測試與 ESLint 9 Flat Config | 建立 `gas-mocks.js` 模擬 GAS 全域環境，確保 CI/CD 自動化測試通過 | `package.json`、`eslint.config.js`、`test/` |

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

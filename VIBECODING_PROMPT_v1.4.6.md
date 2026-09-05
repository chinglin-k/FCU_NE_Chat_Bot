# 給 LLM 的執行提示（Vibecoding Prompt）— FCU_NE_Chat_Bot → v1.4.6

> **使用方式**：把這份檔案的全部內容，連同下方列出的 10 個「已修正完成檔案」一併
> 貼給你的 LLM 編碼工具（Claude Code、Cursor、Copilot Workspace 等具備檔案讀寫權限
> 的 Agent），並指示它「依照這份文件，把附上的檔案內容套用到 repo 對應路徑」。
> 所有內容已在乾淨環境中實際執行 `npm test` / `npm run lint` 驗證通過，
> 可直接覆蓋對應檔案，不需要人工再逐行核對 diff。

---

## 0. 給 LLM 的角色說明（請直接貼給你的編碼工具）

你正在維護 `chinglin-k/FCU_NE_Chat_Bot`（逢甲大學福星宿舍網路報修 Chatbot）。
這是一次「版本發布 + 文件稽核」的變更：**沒有新的產品功能要開發**，所有程式邏輯
早已存在且已通過測試；你的任務純粹是把 **12 個既有檔案的內容替換成下方提供的
最終版本**、**新增 2 個檔案**，然後提交。請完整遵守以下規則：

1. **只動下方列出的 14 個檔案**。特別是：**不要**修改 `css/style.css`、
   `gas/Code.gs`、任何 `js/*.js`（`test/validation.test.js` 除外）——這些檔案
   已經過逐行核對，內容正確，不需要也不應該再變動。
2. 每個列出的檔案都是**完整檔案內容**，用「整檔覆蓋」的方式套用，不是 diff/patch。
3. 套用完所有檔案後，依照「§3 驗證步驟」實際執行測試與 lint，**確認結果與本文件
   記載的一致**（55 項測試全過、0 error / 0 warning）才算完成；如果結果不一致，
   停下來回報差異，不要自行「修正」到符合預期。
4. **不要**修改 `CHANGELOG.md` 中 `## [v1.4.5]` 以下的任何既有段落，也不要修改
   `doc/todo.md` 中 A 輪～I 輪的既有段落——這些是歷史紀錄，本專案的既有慣例是
   「發現舊紀錄有誤就用註解／附註標明，絕不悄悄竄改」，已修正版檔案中的這些段落
   維持原文字，請勿再改動。
5. `gas/Code.gs` 內的 `GEMINI_MODELS_FALLBACK` 陣列**不要修改**（見 §4 資訊性附註，
   這是留給專案擁有者自行決定的產品決策，不在本次變更範圍）。
6. 提交前務必依 `AGENTS.md` 既有慣例：分支命名 `feature/*`、`fix/*` 或 `docs/*`，
   commit message 格式 `type: 描述（繁體中文）`（如 `docs: v1.4.6 全站文件稽核與版本號統一`），
   透過 Pull Request 合併至 `main`，不要直接 push 到 `main`。

---

## 1. 背景：這次變更在修什麼

於 2026-09-04，兩個安全性修復已合併上線但未同步文件（commit `741a0f3`
「BUG-DUP-01 重複送出防護」、commit `642758e`「BUG-ROOM-01／BUG-BED-01 房號床號
驗證對齊」）。本次（2026-09-05）對全 repo 進行逐行「程式碼 vs. 文件」稽核，
確認程式碼本身**沒有任何缺陷**，但發現 **7 處文件內容與現況不符**（詳見 §4），
其中一處（BUG-54）甚至造成單一文件內部前後矛盾。本次變更即修正這 7 處文件問題、
補齊上述兩項未文件化的安全修復、將全站版本號統一升級為 **v1.4.6**，並新增本
Release 所需的說明文件。

完整背景與逐項理由請見附上的 `CHANGELOG.md`（已內含新的 `[v1.4.6]` 條目，
中英雙語，逐條列出 BUG-52 ～ BUG-58）。

---

## 2. 要套用的檔案清單（14 個）

### 2.1 覆蓋既有檔案（12 個）— 已提供完整最終內容

| # | 檔案路徑 | 這次改了什麼（一句話） |
|---|---|---|
| 1 | `package.json` | `version` 欄位 `1.4.5` → `1.4.6` |
| 2 | `package-lock.json` | 兩處 `version` 欄位同步改為 `1.4.6` |
| 3 | `README.md` | 版本號／日期；床號改「1 位數字」；房號補上正確格式；新增重複送出防護說明（功能特色 + 安全表格新增一列） |
| 4 | `AGENTS.md` | 版本號／日期；GAS 開發規範內床號／房號正則式修正；新增「重複送出防護」規則段落 |
| 5 | `CHANGELOG.md` | 版本號／日期；**於檔案最上方新增完整的 `[v1.4.6]` 條目**（中英雙語），`[v1.4.5]` 以下完全不變 |
| 6 | `doc/architecture.md` | 版本號／日期；§1 圖表小幅補充；§4.3 移除已不存在的「2 秒進度條」描述並補上去重步驟；新增 §5.4.3；§5.5.2／§5.5.3 修正；§5.9 測試數 53→55；§5.10 補充 |
| 7 | `doc/data-model.md` | 版本號／日期；ER 圖床號註解；§2.1 房號範例與床號描述；§3 驗證矩陣表；§4 補上去重防護說明 |
| 8 | `doc/requirements.md` | 版本號／日期；§3.4 移除過時成功畫面描述、修正房號床號規則與範例、補上去重防護；§4 測試數 53→55 |
| 9 | `doc/project-memory.md` | 版本號／日期；「已確認業務規則」修正床號位數與成功畫面描述（修復自相矛盾）；新增「v1.4.6 決策記錄」章節 |
| 10 | `doc/todo.md` | 版本號／日期；新增「J 輪」章節，A～I 輪維持原樣 |
| 11 | `test/validation.test.js` | `VALID_INTENTS` 補上 `BUTTON_QUERY`（BUG-57），新增 1 組迴歸斷言 |
| 12 | `index.html` | 第 326 行載入順序註解補上 `wifi-modal`（BUG-56） |

> 這 12 個檔案的完整最終內容，就是你在本次對話中另外收到的、與上述路徑同名的
> 已修正檔案——請逐一開啟，用其**完整內容**覆蓋 repo 內對應路徑的檔案。

### 2.2 新增檔案（2 個）

| # | 建議路徑 | 用途 |
|---|---|---|
| 13 | `RELEASE_NOTES_v1.4.6.md`（repo 根目錄，或直接貼入 GitHub Release 頁面說明欄，二擇一） | v1.4.6 的 GitHub Release 文字稿，可直接複製貼上到「Releases → Draft a new release → v1.4.6」的說明欄位 |
| 14 | 本檔案（`VIBECODING_PROMPT_v1.4.6.md`） | 純粹是這次任務的執行說明，**不需要**加進 repo，套用完其他 13 個檔案後可捨棄 |

---

## 3. 驗證步驟（套用完檔案後執行）

```bash
npm ci
npm test
npm run lint
```

**預期結果**（與本次實際執行結果一致）：

```
# tests 55
# pass 55
# fail 0
```

```
> fcu-ne-chat-bot@1.4.6 lint
> eslint . "gas/**/*.gs"

（無任何輸出 = 0 error / 0 warning）
```

再額外確認：

```bash
node -e "console.log(require('./package.json').version)"   # 應輸出 1.4.6
grep -c "BUTTON_QUERY" test/validation.test.js               # 應 ≥ 2（陣列 + 斷言各一次以上）
grep "載入順序" index.html                                    # 應包含 wifi-modal
```

若任何一項與預期不符，代表覆蓋檔案時有遺漏或版本不對，請重新核對 §2.1 清單，
不要手動「補洞」——所有正確內容都已在附上的檔案裡。

---

## 4. 完整問題清單（供 commit / PR 說明引用）

以下與 `CHANGELOG.md` `[v1.4.6]` 條目內容一致，供你在 PR 描述中引用：

1. **BUG-DUP-01**（回補文件）：`writeReport()` 新增 120 秒重複送出防護（學號+房號+
   描述前 50 字 MD5 雜湊，命中回傳 `DUPLICATE_REPORT`），2026-09-04 已上線。
2. **BUG-ROOM-01 / BUG-BED-01**（回補文件）：後端房號／床號正則式收緊為與前端
   一致（房號 `/^(H|I|G|F[ABCDEF])[0-9]{1,4}(-[0-9]+)?$/i`、床號 `/^[0-9]$/`），
   2026-09-04 已上線。
3. **BUG-52（中）**：6 份文件仍寫床號「1–3 位數字」，已修正為「1 位數字」。
4. **BUG-53（中）**：6 份文件仍寫房號「僅限英數字與連字號」，且範例 `A123` 在新
   規則下不合法，已修正為正確格式與合法範例 `H0111`。
5. **BUG-54（高，文件自相矛盾）**：`doc/project-memory.md`／`doc/requirements.md`／
   `doc/architecture.md` 三處仍描述 v1.4.5（BUG-50）已確認移除的「Modal 內成功
   畫面＋隱藏 Header＋2 秒進度條」死碼行為，其中 `project-memory.md` 甚至與**同一
   檔案下方的決策記錄自相矛盾**。已修正為實際行為：Modal 立即關閉、聊天泡泡顯示
   成功訊息、Header 不隱藏。
6. **BUG-55（低）**：`doc/architecture.md`／`doc/requirements.md` 測試數仍寫 53，
   實際（因新增去重迴歸測試）已是 55，已修正。
7. **BUG-56（低）**：`index.html` 腳本載入順序註解自 v1.4.4 起漏列 `wifi-modal`，
   已補上。
8. **BUG-57（低）**：`test/validation.test.js` 獨立維護的 `VALID_INTENTS` 白名單
   自 v1.4.0 起漏了 `BUTTON_QUERY`（該檔案未直接 `require` 正式模組，是重新實作
   的副本），已補上並新增迴歸斷言。
9. **BUG-58（低）**：`doc/architecture.md` §5.5.3 查詢驗證程式碼片段與 `queryReport()`
   實際的雙錯誤代碼邏輯不符，且與緊接其後的文字說明矛盾，已重寫。

### ℹ️ 資訊性附註（不在本次變更範圍內，僅供專案擁有者參考）

已用網路搜尋核實：`gas/Code.gs` 的 `GEMINI_MODELS_FALLBACK` 現有 6 個模型
（`gemini-3.5-flash-lite`、`gemini-3.1-flash-lite`、`gemini-3.6-flash`、
`gemini-3.5-flash`、`gemini-3.1-pro-preview`、`gemini-3-flash-preview`）截至
2026-09 皆仍是有效、正常運作的模型，**不需要修改**。僅供參考：Google 已於
2026-08-13 發布 `gemini-3.7-flash`（官方稱為目前程式碼／Agent 任務表現最佳的
Flash 模型）；`gemini-3.1-flash-lite` 有預告下架日期 2027-05-07（尚有餘裕，
非急迫）。**是否要把 `gemini-3.7-flash` 加入備援清單或調整優先序，請專案擁有者
自行評估後另開任務處理，這次請勿主動修改 `GEMINI_MODELS_FALLBACK` 陣列。**

---

## 5. 建議的 commit / PR 訊息

```
docs: v1.4.6 全站文件稽核與版本號統一

- 回補 BUG-DUP-01（120 秒重複送出防護）與 BUG-ROOM-01/BUG-BED-01
  （房號床號驗證對齊前端）兩項 2026-09-04 已上線但未文件化的修復
- 修復 BUG-52～BUG-58 共 7 處文件與程式碼不一致（含 1 處文件內部
  自相矛盾：project-memory.md 的成功畫面描述與同檔案決策記錄矛盾）
- test/validation.test.js 補上 BUTTON_QUERY 白名單與迴歸斷言（BUG-57）
- index.html 修正腳本載入順序註解（BUG-56）
- 全站版本號統一升級為 v1.4.6，新增 CHANGELOG 條目與 Release Notes

npm test: 55 pass / 0 fail（原 53）
npm run lint: 0 error / 0 warning
```

---

## 6. 若你的 LLM 編碼工具支援「先看 diff 再套用」

如果你想先檢視差異而非整檔覆蓋，可以請它針對每個檔案跑
`diff <(git show HEAD:路徑) 附上的新檔案`，逐一確認後再寫入——效果相同，
只是多一道人工確認的手續，適合你想更謹慎審閱的情況。

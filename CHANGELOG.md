# 更新日誌 (Changelog)

**版本 / Version**：v1.4.6  
**最後更新 / Last Updated**：2026-09-05

---

## [v1.4.6] - 2026-09-05 (Duplicate-Report Guard, Room/Bed Validation Alignment & Post-Release Documentation Audit / 重複送出防護、房號床號驗證對齊與上線後文件稽核)

### 繁體中文

本版本包含兩部分：(1) 追溯補齊 v1.4.5 發布後、本次正式發版前已合併上線但未同步文件化的兩項後端修復——**120 秒重複送出防護**與**房號／床號後端格式驗證對齊**；(2) 針對全專案原始碼與文件進行的逐行一致性稽核（涵蓋全部 `js/*.js`、`gas/Code.gs`、`css/style.css`、`index.html`、`test/*.js`、`AGENTS.md`、`README.md`、`CHANGELOG.md`、`doc/*.md`，並實際執行 `npm test`、`npm run lint`、`git log`/`git blame` 歷史比對），修復 7 處文件與程式碼不一致之處。本次稽核**未發現任何生產程式碼缺陷**；`css/style.css` 經比對後無需任何修改。

#### ✨ 新功能（回補文件 / Newly Documented Features）

- **報修表單 120 秒重複送出防護**：`gas/Code.gs` 的 `writeReport()` 新增去重機制——以「學號 + 房號 + 問題描述前 50 字」組成字串，取 MD5 雜湊後作為 `CacheService` key，120 秒內偵測到相同指紋即直接拒絕並回傳 `DUPLICATE_REPORT`，防止使用者手滑重複點擊送出或腳本短時間內重複寫入相同案件。僅於格式驗證通過、實際寫入試算表成功後才存入快取，避免驗證失敗的請求誤佔用去重配額。前端 `report.js` 已有對應的友善錯誤訊息（`CONFIG.RESPONSES.*.VALIDATION.DUPLICATE_REPORT`）。新增 2 組迴歸測試（`test/gas-code.test.js`）。
- **房號／床號後端格式驗證對齊前端**：`gas/Code.gs` 的 `writeReport()` 後端正則式原本比前端寬鬆——房號僅檢查「英數字與連字號」（`/^[A-Za-z0-9-]{1,8}$/`）、床號允許 1–3 位數字（`/^[0-9]{1,3}$/`）——可被繞過前端直接對 GAS Web App 送出格式不符的資料並成功寫入試算表。現已收緊為與 `js/report.js`、`index.html` 的 `pattern` 屬性完全一致：房號 `/^(H|I|G|F[ABCDEF])[0-9]{1,4}(-[0-9]+)?$/i`（須以 H、I、G、FA~FF 開頭，後接 1–4 位數字，可選一個連字號再接數字）、床號 `/^[0-9]$/`（僅 1 位數字）。

#### 🛠️ 本次稽核修復（Audit Fixes）

- **[BUG-52／中] 床號格式描述全站過時**：`README.md`、`AGENTS.md`、`doc/architecture.md`（§5.5.2 驗證矩陣）、`doc/data-model.md`（ER 圖、§2.1、§3 驗證矩陣）、`doc/requirements.md`（§3.4）、`doc/project-memory.md`（已確認業務規則）共 6 份文件仍描述床號為「1–3 位數字」／`/^[0-9]{1,3}$/`，與上述 BUG-BED-01 修復後的實際規則（僅 1 位數字）不符。已全數更新為「1 位數字」／`/^[0-9]$/`。
- **[BUG-53／中] 房號格式描述全站過時**：同一批文件仍描述房號格式為「僅限英數字與連字號」／`/^[A-Za-z0-9-]{1,8}$/`，與 BUG-ROOM-01 修復後的實際規則不符；`doc/data-model.md`、`doc/requirements.md` 內原有的房號範例「A123」在新規則下更是**不合法**範例（`A` 不在允許前綴 H/I/G/FA~FF 之列）。已全數更新為正確格式說明，範例改為合法的 `H0111`。
- **[BUG-54／高] 報修成功畫面描述與 v1.4.5（BUG-50）已移除的實作直接矛盾**：`doc/project-memory.md`「已確認業務規則」章節、`doc/requirements.md` §3.4、`doc/architecture.md` §4.3 三處仍描述「送出成功後隱藏頂部標題列，僅保留『報修成功！』與進度條（2 秒後自動關閉）」——這正是 `CHANGELOG.md` v1.4.5（BUG-50）記載「經逐一 `grep` 確認零引用後移除」的死碼（`#modal-success-view`／`.has-success`／`.is-hidden`），且與 `project-memory.md` 自身下方 v1.4.4/v1.4.5 決策記錄章節的敘述自相矛盾。已更正為實際行為：送出成功後 Modal **立即關閉**，成功訊息以**聊天泡泡**（bot 訊息）呈現並顯示「回主選單／報修」按鈕，Header 標題列全程不受影響。
- **[BUG-55／低] 單元測試數量全站過時**：`doc/architecture.md` §5.9、`doc/requirements.md` §4 仍寫「53 項／53/53」；因本版本新增的重複送出防護迴歸測試（見上方新功能），`npm test` 實測現為 **55 項全數通過**，`npm run lint` 維持 0 error / 0 warning。已更新兩份文件（`doc/todo.md` 既有的 G 輪／I 輪為歷史紀錄，維持原樣不予更動，另於下方新增的 J 輪記錄本次變動）。
- **[BUG-56／低] `index.html` 腳本載入順序註解遺漏 `wifi-modal.js`**：第 326 行註解「載入順序：i18n → config → counter → intent → report → query → teams → chat」自 v1.4.4 新增 `js/wifi-modal.js` 以來就一直沒有把它加進這行列表（實際載入順序在 `teams` 與 `chat` 之間），與 v1.4.1（BUG-27）修復的是同一類別的遺漏，只是這次遺漏的是後來才加入的模組。已補上。
- **[BUG-57／低] `test/validation.test.js` 的 `VALID_INTENTS` 白名單與正式程式碼不同步**：該測試檔並未 `require` `js/intent.js` 或 `gas/Code.gs`，而是自行重新實作一份驗證邏輯；其 `VALID_INTENTS` 陣列自建立以來僅有 6 項（缺少 `BUTTON_QUERY`），自 v1.4.0（commit `9be9b3a`）新增 `BUTTON_QUERY` 意圖後即與正式程式碼的 7 項不同步，歷經 v1.4.1／v1.4.2／v1.4.3／v1.4.5 多次稽核皆未發現。此缺口不影響 `npm test` 是否通過（無斷言檢查 `BUTTON_QUERY` 是否被此陣列接受），但代表「白名單過濾機制測試」實際涵蓋不完整。已補上 `BUTTON_QUERY` 並新增對應迴歸斷言。
- **[BUG-58／低] `doc/architecture.md` §5.5.3 查詢學號驗證程式碼片段與實際邏輯不符**：文件內範例程式碼為單一 `if` 判斷合併「空值」與「格式錯誤」，且回傳寫死的中文句子 `'學號格式錯誤'`；但 `gas/Code.gs` 的 `queryReport()` 實際上是兩個獨立判斷、回傳兩種不同的全大寫錯誤代碼（`VALIDATION_QUERY_STUDENT_ID_REQUIRED`／`VALIDATION_QUERY_STUDENT_ID_FORMAT`），此即 v1.4.0（BUG-12）修復的核心，緊接在程式碼片段下方的文字說明其實已正確描述此點，僅程式碼片段本身未同步更新，兩者自相矛盾。已重寫程式碼片段以符合實際邏輯與錯誤代碼慣例。

#### 📄 文件同步（Documentation Sync）

- `README.md`：功能特色、已知安全性說明表格補上重複送出防護與正確的床號／房號格式
- `AGENTS.md`：GAS 開發規範補上重複送出防護規則、修正床號／房號正則式
- `doc/architecture.md`：新增 §5.4.3 重複送出防護小節；修正 §4.3 資料流（移除已不存在的「2 秒進度條」描述，改為聊天泡泡呈現；補上去重檢查步驟）；修正 §5.5.2 驗證矩陣、§5.5.3 程式碼片段；§5.9 測試數更新為 55；§5.10 OWASP 對照補上去重防護對應 A04
- `doc/data-model.md`：修正 ER 圖床號註解、§2.1 房號範例與床號描述、§3 驗證矩陣；§4 資料生命週期補上去重防護說明
- `doc/requirements.md`：§3.4 移除過時的成功畫面描述、修正房號／床號驗證規則與範例、補上重複送出防護說明；§4 測試數更新為 55
- `doc/project-memory.md`：修正「已確認業務規則」章節的床號位數與報修成功畫面描述；新增「v1.4.6 決策記錄」章節記錄本次退補文件與稽核修復
- `doc/todo.md`：新增「J 輪：重複送出防護、房號床號驗證對齊、文件稽核」章節（既有 A～I 輪維持原樣不予更動）
- `test/validation.test.js`：`VALID_INTENTS` 補上 `BUTTON_QUERY`，新增對應迴歸斷言
- `index.html`：腳本載入順序註解補上 `wifi-modal`
- 全站（`package.json`、`package-lock.json`、`README.md`、`CHANGELOG.md`、`AGENTS.md`、`doc/*.md`）版本號統一升級為 **v1.4.6**

#### ℹ️ 資訊性附註（供專案擁有者參考，本次稽核未逕行變更程式碼）

- **Gemini 模型清單時效性查核**：以網路搜尋查證 Google 官方文件（2026-09），確認 `GEMINI_MODELS_FALLBACK` 現有 6 個模型（`gemini-3.5-flash-lite`、`gemini-3.1-flash-lite`、`gemini-3.6-flash`、`gemini-3.5-flash`、`gemini-3.1-pro-preview`、`gemini-3-flash-preview`）**目前皆仍為有效、正常運作的模型**，無任何一個已被官方宣告下架日期，本節無需修改程式碼。僅供參考：Google 已於 2026-08-13 發布 `gemini-3.7-flash`（官方描述為目前程式碼與 Agent 任務表現最佳的 Flash 模型），且 `gemini-3.1-flash-lite` 已有預告下架日期 2027-05-07（尚有 8 個月餘裕，非急迫）。是否要將 `gemini-3.7-flash` 納入備援清單或調整優先順序，屬於成本／配額層面的產品決策，建議由專案擁有者評估後另行處理，本次稽核不代為決定。

#### 🧪 測試

- `test/gas-code.test.js` 新增 2 組迴歸測試（BUG-DUP-01 去重機制），`test/validation.test.js` 新增 1 組迴歸斷言（BUG-57），總測試數由 53 增至 **55**，全數通過；`npm run lint` 維持 **0 error / 0 warning**。

### English

This release has two parts: (1) retroactively documenting two backend fixes that were merged after v1.4.5 but before this formal release — a **120-second duplicate-report guard** and **room/bed backend validation alignment**; and (2) a full line-by-line source-vs-documentation audit (covering every `js/*.js` file, `gas/Code.gs`, `css/style.css`, `index.html`, `test/*.js`, `AGENTS.md`, `README.md`, `CHANGELOG.md`, and `doc/*.md`, including actually running `npm test`, `npm run lint`, and cross-checking `git log`/`git blame` history) that fixed 7 documentation-vs-code inconsistencies. This audit **found no production code defects**; `css/style.css` required no changes after review.

#### ✨ New Features (Retroactively Documented)

- **120-second duplicate-report guard on the repair form**: `writeReport()` in `gas/Code.gs` now builds a fingerprint from "student ID + room number + first 50 characters of the description," MD5-hashes it, and uses it as a `CacheService` key. A repeat hit within 120 seconds is rejected outright with `DUPLICATE_REPORT`, preventing accidental double-submits or short-burst scripted resubmission of the same case. The fingerprint is only cached after validation passes and the row is actually written, so failed requests don't consume dedup quota. The frontend (`report.js`) already has a matching friendly error message (`CONFIG.RESPONSES.*.VALIDATION.DUPLICATE_REPORT`). Two new regression tests were added (`test/gas-code.test.js`).
- **Room/bed backend validation aligned with the frontend**: `writeReport()`'s backend regexes were previously looser than the frontend's — room number only checked "alphanumeric plus hyphen" (`/^[A-Za-z0-9-]{1,8}$/`) and bed number allowed 1–3 digits (`/^[0-9]{1,3}$/`) — meaning a request that bypassed the frontend could hit the GAS Web App directly with out-of-spec data and still get written to the spreadsheet. Both are now tightened to exactly match the `pattern` attributes in `js/report.js`/`index.html`: room `/^(H|I|G|F[ABCDEF])[0-9]{1,4}(-[0-9]+)?$/i` (must start with H, I, G, or FA–FF, followed by 1–4 digits, with an optional dash and more digits) and bed `/^[0-9]$/` (a single digit only).

#### 🛠️ Audit Fixes

- **[BUG-52/Medium] Bed-number format stale across the docs**: `README.md`, `AGENTS.md`, `doc/architecture.md` (§5.5.2 validation matrix), `doc/data-model.md` (ER diagram, §2.1, §3 validation matrix), `doc/requirements.md` (§3.4), and `doc/project-memory.md` (confirmed business rules) — six files — still described bed number as "1–3 digits" / `/^[0-9]{1,3}$/`, which no longer matches the actual rule after the BUG-BED-01 fix above (single digit only). All updated to "1 digit" / `/^[0-9]$/`.
- **[BUG-53/Medium] Room-number format stale across the docs**: the same set of files still described room format as "alphanumeric and hyphen only" / `/^[A-Za-z0-9-]{1,8}$/`, which no longer matches the BUG-ROOM-01 fix; the room example "A123" used in `doc/data-model.md` and `doc/requirements.md` is now actually **invalid** under the new rule (`A` isn't an allowed prefix). All updated with the correct format description and a valid example (`H0111`).
- **[BUG-54/High] Success-screen description directly contradicts what v1.4.5 (BUG-50) already removed**: `doc/project-memory.md`'s "confirmed business rules" section, `doc/requirements.md` §3.4, and `doc/architecture.md` §4.3 all still described "the header is hidden after a successful submission, leaving only a 'Success!' message and a 2-second auto-closing progress bar" — but this is exactly the dead code that `CHANGELOG.md`'s v1.4.5 entry (BUG-50) documents as removed after an exhaustive grep confirmed zero references, and it directly contradicts `project-memory.md`'s own v1.4.4/v1.4.5 decision-log section further down the same file. Corrected to describe actual behavior: the modal closes **immediately** on success, the success message appears as a **chat bubble** (bot message) with "Back to Main Menu"/"Request Repair" buttons, and the header is never hidden.
- **[BUG-55/Low] Unit test count stale across the docs**: `doc/architecture.md` §5.9 and `doc/requirements.md` §4 still said "53 / 53/53"; with the two new dedup regression tests above, `npm test` now shows **55 passing**, and `npm run lint` remains 0 errors/0 warnings. Both docs updated (`doc/todo.md`'s existing Round G/Round I entries are historical records and were left untouched; a new Round J entry below records this change).
- **[BUG-56/Low] `index.html` script-load-order comment missing `wifi-modal.js`**: line 326's comment ("load order: i18n → config → counter → intent → report → query → teams → chat") was never updated when `js/wifi-modal.js` was added in v1.4.4 (it actually loads between `teams` and `chat`) — the same category of oversight as v1.4.1's BUG-27, just recurring for a module added later. Fixed.
- **[BUG-57/Low] `test/validation.test.js`'s `VALID_INTENTS` whitelist out of sync with the real code**: this test file doesn't `require` `js/intent.js` or `gas/Code.gs` — it re-implements its own copy of the validation logic. Its `VALID_INTENTS` array has had only 6 entries (missing `BUTTON_QUERY`) since the file was created, and has been out of sync with the real 7-entry list since `BUTTON_QUERY` was added in v1.4.0 (commit `9be9b3a`) — a gap that survived the v1.4.1/v1.4.2/v1.4.3/v1.4.5 audits. It doesn't affect whether `npm test` passes (no assertion exercises `BUTTON_QUERY` against this array), but it meant the "intent whitelist filter" test wasn't actually covering all real intents. Added `BUTTON_QUERY` to the array plus a matching regression assertion.
- **[BUG-58/Low] `doc/architecture.md` §5.5.3 code snippet doesn't match the real query-validation logic**: the documented snippet combines "empty" and "malformed" into a single `if` check and returns a hardcoded Chinese sentence, `'學號格式錯誤'`; the real `queryReport()` in `gas/Code.gs` actually uses two separate checks returning two distinct all-caps error codes (`VALIDATION_QUERY_STUDENT_ID_REQUIRED` / `VALIDATION_QUERY_STUDENT_ID_FORMAT`) — which is precisely what v1.4.0's BUG-12 fixed, and which the prose immediately below the snippet correctly describes, so the snippet contradicted the very next line. Rewritten to match the real logic and error-code convention.

#### 📄 Documentation Sync

- `README.md`: added the duplicate-report guard to the feature list and security table; corrected bed/room format
- `AGENTS.md`: added the duplicate-report-guard rule to the GAS backend rules; corrected the bed/room regexes
- `doc/architecture.md`: added new §5.4.3 on the duplicate-report guard; fixed §4.3 data flow (removed the no-longer-true "2-second progress bar," replaced with the chat-bubble behavior; added the dedup-check step); fixed the §5.5.2 validation matrix and §5.5.3 code snippet; §5.9 test count updated to 55; §5.10 OWASP mapping now references the dedup guard under A04
- `doc/data-model.md`: fixed the ER diagram's bed-number annotation, §2.1's room example and bed description, and the §3 validation matrix; §4 lifecycle table now notes the dedup guard
- `doc/requirements.md`: §3.4 no longer describes the removed success screen; room/bed rules and examples corrected; duplicate-report guard documented; §4 test count updated to 55
- `doc/project-memory.md`: corrected the bed-digit-count and success-screen lines under "confirmed business rules"; added a new "v1.4.6 decision log" section documenting this release's retroactive documentation and audit fixes
- `doc/todo.md`: added a new "Round J" section (Rounds A–I are historical and were left untouched)
- `test/validation.test.js`: added `BUTTON_QUERY` to `VALID_INTENTS` plus a matching regression assertion
- `index.html`: script-load-order comment now includes `wifi-modal`
- Bumped every version string across `package.json`, `package-lock.json`, `README.md`, `CHANGELOG.md`, `AGENTS.md`, and `doc/*.md` to **v1.4.6**

#### ℹ️ Informational Notes (For Owner Awareness — Not Acted On)

- **Gemini model-list currency check**: web research against Google's official documentation (as of September 2026) confirms all 6 models in `GEMINI_MODELS_FALLBACK` (`gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, `gemini-3.6-flash`, `gemini-3.5-flash`, `gemini-3.1-pro-preview`, `gemini-3-flash-preview`) are **currently valid and functioning**, with no announced shutdown date for any of them — no code change is needed here. For awareness only: Google released `gemini-3.7-flash` on 2026-08-13 (officially described as its strongest current Flash model for coding/agentic work), and `gemini-3.1-flash-lite` has an announced (non-urgent — over 8 months out) shutdown date of 2027-05-07. Whether to add `gemini-3.7-flash` to the fallback list or reorder priority is a cost/quota product decision left to the project owner; this audit did not act on it.

#### 🧪 Testing

- `test/gas-code.test.js` gained 2 new regression tests (BUG-DUP-01 dedup behavior); `test/validation.test.js` gained 1 new regression assertion (BUG-57). Total test count rose from 53 to **55**, all passing; `npm run lint` remains **0 errors / 0 warnings**.

---

## [v1.4.5] - 2026-08-29 (Wi-Fi Setup Guide, Post-Release Audit & CI Fix / Wi-Fi 設定教學、上線後全面稽核與 CI 修復)

### 繁體中文

本版本包含兩部分：(1) 追溯補齊上一版本上線後未同步文件化的「Wi-Fi 機設定教學」功能與「查詢完成後續按鈕」修復；(2) 針對上線後程式碼庫進行的全面稽核，修復 CI 失敗、i18n 涵蓋率缺口、無障礙焦點管理缺陷、註解錯字與死碼殘留。

#### ✨ 新功能（回補文件 / Newly Documented Features）

- **Wi-Fi 機設定教學 Modal**：教學選單新增第三個選項「Wi-Fi 機」，與既有 Windows / Mac 系統選項並列。純前端靜態 4 步驟圖文教學（① 連接電源與網路線 ② 連接裝置 ③ 進入後台管理介面 ④ 設定路由器模式與固定 IP），不呼叫 GAS 後端、不消耗任何頻率限制配額，Modal 支援 X 按鈕／關閉按鈕／遮罩點擊／ESC 四種關閉方式，並提供完整繁中英文對照（`js/wifi-modal.js`、`js/chat.js`、`js/config.js`、`js/i18n.js`、`index.html`、`css/style.css`）。
- **查詢案件完成後顯示後續按鈕**：查詢報修案件狀態完成後，補上「回主選單／報修」按鈕，避免對話流程中斷，與報修成功後的體驗一致（`js/chat.js`、`js/query.js`）。

#### 🛠️ 本次稽核修復（Audit Fixes）

- **[BUG-44／高] CI Lint 失敗修復**：`eslint.config.js` 的瀏覽器端全域清單漏列新增的 `WifiModal` 模組，導致 `npx eslint .` 對 `js/chat.js` 回報 `no-undef` 錯誤，`.github/workflows/test.yml` 的 `npm run lint` 步驟因而失敗。已補上宣告，`npm test`（53/53）與 `npm run lint`（0 error）皆恢復綠燈。
- **[BUG-45／中] 房號／床號／手機號碼欄位 i18n 缺口**：報修表單中 `field-room`、`field-bed`、`field-phone` 三個欄位的 placeholder 原為寫死英文（如 `"e.g. A123"`），缺少 `data-i18n-placeholder` 屬性與對應字典項目，導致繁體中文介面下仍顯示英文提示文字，與其餘欄位（姓名、學號）行為不一致。已補上 `form.room.placeholder`／`form.bed.placeholder`／`form.phone.placeholder` 中英字典項目與對應屬性。
- **[BUG-46／中] 打字指示器 aria-label 語言切換失效**：`_showTyping()` 每次建立新的打字指示器 DOM 節點時，`aria-label` 屬性寫死中文「正在輸入」，僅在「語言切換當下」該節點恰好存在時才會被 `_applyToDom()` 重新掃描修正——但該節點屬短暫顯示元素，實務上幾乎不會遇到這個時機，導致英文介面下螢幕閱讀器仍朗讀中文。已改為建立當下即以 `I18N.t('typing.aria')` 依目前語言取值。
- **[BUG-47／中] Wi-Fi 教學 Modal 無障礙焦點失效**：`WifiModal.open()` 呼叫 `document.getElementById('wifi-modal-title').focus()`，但該 `<h2>` 元素未加上 `tabindex="-1"`，屬不可程式化聚焦元素，`.focus()` 呼叫實際上靜默無效，鍵盤／螢幕閱讀器使用者開啟 Modal 時焦點不會被帶入。已於 `index.html` 補上 `tabindex="-1"`。同時補上開關時的 `document.body.style.overflow` 背景捲動鎖定／解除，與報修表單、查詢案件兩個既有 Modal 行為一致。
- **[BUG-48／低] 註解錯字修正**：`js/intent.js` 「防止無限**迄迴**」修正為「防止無限**循環**」；`js/query.js` 「查詢**完是**：顯示返回主選單和報修按鈕」修正為「查詢**完成後**：顯示返回主選單和報修按鈕」。
- **[BUG-49／低] 後端錯誤代碼一致性修正**：`gas/Code.gs` 的 `classifyIntent()` 在 `GEMINI_API_KEY` 未設定時，原本直接回傳完整中文句子作為 `error` 欄位（`'GEMINI_API_KEY 未在 Script Properties 中設定'`），與專案自 BUG-28／BUG-29 起確立的「一律回傳固定大寫代碼、詳細訊息僅記錄於 Logger」慣例不一致（雖然此路徑目前前端未直接顯示該文字，僅記錄於瀏覽器 console，非使用者可見的資訊揭露，但仍應統一慣例避免未來被誤用）。已改為固定代碼 `GEMINI_API_KEY_NOT_CONFIGURED`。
- **[BUG-50／低] 死碼清理：報修表單 Modal 內成功畫面**：`index.html` 的 `#modal-success-view`、`js/report.js` 的 `successView` 變數與 `.has-success`／`.is-hidden` 樣式切換、`css/style.css` 對應的整段樣式與動畫（`.modal-success-view`、`.success-icon-wrap`、`.success-title` 等），以及僅供其使用的 `js/i18n.js` 字典項目 `success.title`／`success.desc`，經逐一 `grep` 確認自 v1.1.0 行為回復後已無任何程式路徑會觸發，予以移除。另移除同一區塊內完全未被任何 HTML 元素使用的 `.text-en` 樣式類別。
- **[BUG-51／低] README 多語系備援分類器表格修復**：「🌐 多國語言備援分類器支援」表格第 19 項合併列出「埃及阿拉伯文」與「厄瓜多西班牙文」，但範例關鍵字欄位僅提供阿拉伯文範例、缺漏西班牙文範例，格式不完整。已補上西班牙文範例關鍵字，並加註說明：厄瓜多西班牙文與第 16 項墨西哥西班牙文共用同一組通用西班牙語關鍵字（未另外建置地區專屬詞彙），故兩者合併計為第 19 項、不獨立計數。

#### 📄 文件同步（Documentation Sync）

- `AGENTS.md` 檔案結構樹補上 `js/wifi-modal.js`
- `doc/architecture.md` §3.1 前端模組表補上 `wifi-modal.js` 一列
- `doc/requirements.md` §3.1 教學按鈕說明補上 Wi-Fi 機選項；新增 §3.7 Wi-Fi 機設定教學 Modal 需求說明
- `doc/project-memory.md` 補上本次 Wi-Fi Modal 功能與稽核修復的決策記錄
- `doc/todo.md` 新增「I 輪：Wi-Fi 機設定教學、查詢後續按鈕、全面稽核」章節
- 全站（`package.json`、`README.md`、`CHANGELOG.md`、`AGENTS.md`、`doc/*.md`）版本號統一升級為 **v1.4.5**

#### ⚠️ 待專案擁有者確認（本次稽核未逕行處理）

- `doc/project-memory.md` 內記載一組專案擁有者已確認完成輪替、目前已失效的 Google Spreadsheet ID 明碼，用於說明 GitHub PR ref 歷史殘留議題。此做法與 `AGENTS.md` 規範 5「試算表 ID… 不得硬編碼於程式碼或任何文件（含 `doc/*.md`）中」字面上牴觸——即使該 ID 已失效，仍建議改為遮蔽格式（如 `1BUnG_...79uI`）以符合文件自身規範。本次稽核未逕行修改此段落，待專案擁有者確認後再處理。

### English

This release has two parts: (1) retroactively documenting the previously undocumented **Wi-Fi router setup guide** feature and the **post-query follow-up buttons** fix that shipped after v1.4.3; and (2) a full post-release audit that fixes a broken CI pipeline, i18n coverage gaps, an accessibility focus-management defect, stale comments, and orphaned dead code.

#### ✨ New Features (Retroactively Documented)

- **Wi-Fi router setup guide modal**: a third option, "Wi-Fi Router," was added to the Tutorials menu alongside the existing Windows/Mac options. It is a purely front-end, static 4-step walkthrough (power & cable, device connection, admin interface, router mode & static IP) that never calls the GAS backend and consumes no rate-limit quota. The modal supports four ways to close (✕ button, Close button, backdrop click, Escape key) and is fully bilingual (`js/wifi-modal.js`, `js/chat.js`, `js/config.js`, `js/i18n.js`, `index.html`, `css/style.css`).
- **Follow-up buttons after a case query**: after a repair-case query completes, "Back to Main Menu" and "Request Repair" buttons are now shown, matching the experience after a successful repair submission and preventing the conversation from dead-ending (`js/chat.js`, `js/query.js`).

#### 🛠️ Audit Fixes

- **[BUG-44/High] Broken CI lint step**: `eslint.config.js`'s browser-global list never added the newly introduced `WifiModal` module, so `npx eslint .` reported a `no-undef` error in `js/chat.js`, failing the `npm run lint` step in `.github/workflows/test.yml`. Fixed by declaring the global; `npm test` (53/53) and `npm run lint` (0 errors) are green again.
- **[BUG-45/Medium] Missing i18n on Room/Bed/Phone fields**: the `field-room`, `field-bed`, and `field-phone` inputs had hardcoded English placeholders (e.g. `"e.g. A123"`) with no `data-i18n-placeholder` attribute or dictionary entry, unlike the Name/Student-ID fields — so the Traditional Chinese UI still showed English placeholder text. Added `form.room.placeholder`/`form.bed.placeholder`/`form.phone.placeholder` entries in both languages and wired up the attributes.
- **[BUG-46/Medium] Typing indicator aria-label ignored current language**: `_showTyping()` hardcoded `aria-label="正在輸入"` (Chinese) at element-creation time; it would only be corrected via `data-i18n-aria-label` if a language toggle happened to fire while the transient element existed, which in practice almost never happens — so screen-reader users on the English UI still heard Chinese. Fixed by reading `I18N.t('typing.aria')` at creation time.
- **[BUG-47/Medium] Wi-Fi modal focus management broken**: `WifiModal.open()` called `.focus()` on `<h2 id="wifi-modal-title">`, but that element lacked `tabindex="-1"` and is therefore not programmatically focusable, so the call silently did nothing — keyboard/screen-reader users got no focus movement when the modal opened. Added `tabindex="-1"`. Also added the same background-scroll lock/unlock (`document.body.style.overflow`) used by the other two modals, which this one was missing.
- **[BUG-48/Low] Comment typos**: fixed a garbled/nonsensical phrase in `js/intent.js` ("無限迄迴" → "無限循環", i.e. "infinite loop") and in `js/query.js` ("查詢完是" → "查詢完成後", i.e. "after the query completes").
- **[BUG-49/Low] Backend error-code consistency**: `classifyIntent()` in `gas/Code.gs` returned a full Chinese sentence as the `error` field when `GEMINI_API_KEY` was unset, instead of the all-caps code convention established since BUG-28/29. Changed to `GEMINI_API_KEY_NOT_CONFIGURED` (this path isn't shown to end users today, only logged to the browser console, but the inconsistency was a latent risk).
- **[BUG-50/Low] Dead code removal — in-modal success screen**: `#modal-success-view` in `index.html`, the `successView` variable and `.has-success`/`.is-hidden` toggles in `js/report.js`, the corresponding ~70-line CSS block and animations in `css/style.css`, and the `success.title`/`success.desc` i18n dictionary entries that existed only to feed it, were all verified (via exhaustive grep) to be unreachable since the success flow reverted to v1.1.0 behavior (chat-bubble success message instead of an in-modal screen). Removed. Also removed the entirely unused `.text-en` CSS class from the same region.
- **[BUG-51/Low] README multilingual fallback table formatting**: row 19 of the "Multilingual Fallback Classifier" table combines "Egyptian Arabic" and "Ecuadorian Spanish" but only listed Arabic sample keywords, omitting Spanish examples. Added the missing Spanish examples and a footnote clarifying that Ecuadorian Spanish shares the same generic Spanish keyword set as row 16 (Mexican Spanish) rather than having its own region-specific vocabulary, which is why the two are counted as a single numbered entry.

#### 📄 Documentation Sync

- Added `js/wifi-modal.js` to the file tree in `AGENTS.md`
- Added a `wifi-modal.js` row to the frontend module table in `doc/architecture.md` §3.1
- Updated the Tutorials button description in `doc/requirements.md` §3.1 and added new §3.7 covering the Wi-Fi setup guide requirements
- Added decision-log entries in `doc/project-memory.md` for both the Wi-Fi modal feature and this audit's fixes
- Added a new "Round I" section to `doc/todo.md`
- Bumped every version string across `package.json`, `README.md`, `CHANGELOG.md`, `AGENTS.md`, and `doc/*.md` to **v1.4.5**

#### ⚠️ Flagged for Owner Confirmation (Not Acted On)

- `doc/project-memory.md` documents a literal Google Spreadsheet ID that the project owner has confirmed is already rotated and no longer live, used as evidence for the GitHub PR-ref history-leak discussion. This literally contradicts `AGENTS.md` Rule 5 ("Spreadsheet ID... must not be hardcoded in code or any documentation, including `doc/*.md`"). Even though the ID is inactive, we recommend redacting it (e.g. `1BUnG_...79uI`) to comply with the project's own stated policy. This audit did not modify that passage; awaiting owner confirmation.

---

## [v1.4.3] - 2026-08-23 (Query Feature Documentation Consistency Sweep)

本版本針對「查詢案件」功能（v1.4.0 新增）在各文件**頂層總覽/摘要章節**是否同步更新，進行全庫掃描；重點檢查模式為「細節章節已正確描述查詢功能，但頂層總覽/摘要未同步」是否重複發生於其他文件。

### 📄 文件正確性修復 (Documentation Correctness Fixes)
- **[BUG-41/低] `doc/architecture.md` §1 系統架構概覽圖修正**：頂層 mermaid 圖中 `GAS -> Sheet` 的邊僅標示「格式雙重強驗證 & 寫入」，未反映 `queryReport()` 實際會讀取試算表全部資料列並篩選比對學號的行為（§4.4 文字資料流原本就正確描述此讀取行為，僅頂層圖未同步）。已修正邊標籤為「報修：格式雙重強驗證 & 寫入 / 查詢：學號比對後讀取」。
- **[BUG-42/低] `README.md` 端點計數自相矛盾修正**：「功能特色」章節（第 32 行）宣稱雙層流量限制「涵蓋 classify / report / counter_get / counter_increment **四個端點**」，漏列 `query`；此描述與同份文件「已知安全性說明」章節（第 154 行）正確寫的「**五組**雙層限流…`query` 使用者 10/分鐘、全域 40/分鐘」自相矛盾。已修正為「五個端點」並補上 `query`。
- **[BUG-43/低] `doc/requirements.md` §1／§2 補上查詢功能**：§1 專案背景與 §2 系統角色（學生角色說明）僅提及「教學文件查詢、常見問題、發起報修通報」，未提及「查詢自己的報修案件進度」——這是 v1.4.0 就存在、且 §3.6 已有完整規格的核心功能，僅頂層背景/角色總覽未同步。已補上。

### ✅ 本次掃描確認無問題的文件 (Verified Clean — No Action Needed)
- `doc/data-model.md`、`doc/project-memory.md`、`doc/todo.md`、`AGENTS.md`：查詢功能相關內容（實體、決策記錄、開發輪次、檔案結構、限流表）均已正確涵蓋，未發現同類疏漏。
- `doc/architecture.md` §3.1（前端模組表）、§4.4（查詢資料流）、§5.4.1（限流表）、§5.5.3（查詢學號驗證）、§5.6（查詢結果個資最小化）、§5.9（安全測試覆蓋）、§5.10（OWASP 對照）：皆已正確涵蓋查詢功能，無需修改。

## [v1.4.2] - 2026-08-22 (Full Codebase-vs-Documentation Audit)


本版本為全專案「程式碼 vs. 文件」逐行一致性稽核，範圍涵蓋全部原始碼、`doc/*.md`、`AGENTS.md`、`CHANGELOG.md`、`README.md`。稽核過程執行了完整測試（53/53 通過）、ESLint（0 error/0 warning）、`git blame`/`git log` 歷史考古，以及對 GitHub 遠端 PR ref 的實際機密殘留驗證。

### 🛡️ 安全性修復與釐清 (Security Fixes & Clarifications)
- **[BUG-34/資訊] Git 歷史機密殘留範圍釐清**：實測以 `git ls-remote` + `git fetch refs/pull/*/head` 驗證，確認舊版 Spreadsheet ID 目前仍可透過 GitHub 已關閉／已合併 PR 的 `refs/pull/*/head` 參照取得——這是 `git-filter-repo` + force push 的已知限制（無法觸及 PR ref），過去 `README.md`／`doc/architecture.md` 「已無洩漏風險」「已完成輪替」等描述未精確反映此限制。經與專案擁有者確認，**該 Spreadsheet ID 已完成輪替、舊 ID 已失效**，故已將三份文件（`README.md`、`doc/architecture.md`、`doc/project-memory.md`）更新為如實反映「PR ref 殘留但因輪替已無實質風險」的現況，而非模糊帶過。
- **[BUG-35/低] CSP `connect-src` 移除不必要的網域**：`index.html` 的 Content-Security-Policy 原本白名單 `https://generativelanguage.googleapis.com`，但前端 JS 從未直接呼叫 Gemini API（僅 `gas/Code.gs` 後端呼叫），此為不必要的權限放寬，已移除，符合最小權限原則。
- **[BUG-36/低] `.env.example` 補上遺漏的 `RECAPTCHA_SECRET_KEY`**：`AGENTS.md`／`gas/Code.gs` 皆將其列為必要的 Script Property（與 `GEMINI_API_KEY`、`SPREADSHEET_ID` 並列），但 `.env.example` 範本先前漏列，已補上並註明其為 Secret Key（非公開的 Site Key）。

### 🐛 文件正確性修復 (Documentation Correctness Fixes)
- **[BUG-37/中] CSS 亂碼註解全面修復**：`CHANGELOG.md` v1.3.1（BUG-09）曾宣稱已完成全站亂碼掃描修復，但本次稽核發現 `css/style.css` 仍有 14 處編碼損毀的中文註解殘留（第 84、633–635、820、835、915、921–923、932、949、960、962、964、966、995、1033 行），經 `git blame` 追蹤至 commit `ae2a0f3`（2026-08-09）引入且未被後續稽核抓出。原始正確文字已無法完整復原（損毀早於該 commit），已依上下文語意重建為可讀的繁體中文註解，不影響任何 CSS 選擇器或樣式規則。
- **[BUG-38/低] `doc/architecture.md` §3.1 前端模組表補上 `js/query.js`**：該模組已在文件其他章節（§3.2、§4.4、§5.5.3、§5.10）與 `AGENTS.md` 檔案樹中提及，但主要模組總覽表遺漏此列，`CHANGELOG.md` BUG-32 僅修補了 `AGENTS.md`，未同步此表。
- **[BUG-39/低] `maximum-scale=1.0` 過時敘述修正**：`doc/architecture.md` §5.8 與 `doc/todo.md` G 輪皆仍描述「viewport `maximum-scale=1.0`」為目前防止 iOS 自動縮放的機制，但經 `git log` 追蹤，此設定已於 2026-08-08 因違反 WCAG 1.4.4（使用者縮放）無障礙需求而移除，改由 `css/style.css` 於 ≤640px 寬度強制 `input`/`textarea` 使用 16px 字體達成同等效果。`doc/requirements.md` 已正確反映此變更，另兩份文件已同步修正。
- **[BUG-40/低] 全站版本號統一升級為 v1.4.2**：`package.json`、`README.md`、`CHANGELOG.md`、`AGENTS.md`、`doc/architecture.md`、`doc/data-model.md`、`doc/project-memory.md`、`doc/requirements.md`、`doc/todo.md`。（升版前 `doc/architecture.md`／`doc/data-model.md` 仍停留在 v1.4.0，與其餘文件的 v1.4.1 不一致，一併修正。）

### ✅ 本次稽核確認無問題的項目 (Verified Clean — No Action Needed)
- `chat.js`／`query.js` 的 XSS 防護模式（`_esc()` 轉義 → `_renderMarkdown()` 渲染的順序）邏輯正確，未發現注入風險。
- 目前工作目錄與 `main`／tag 分支歷史中無其他明碼機密（已用正則掃描 API Key、Spreadsheet ID 樣式）。
- 速率限制（雙層 `_checkRateLimit`）、reCAPTCHA v3 驗證、一次性 token 機制、後端三段式驗證（必填→格式→截斷）均與文件描述一致。
- `.github/workflows/test.yml` 已正確設定 `permissions: contents: read`（對應既有 BUG-17 修復）。
- 測試套件（53 項）與 ESLint 3-environment flat config 均正常運作，符合文件宣稱。

## [v1.4.1] - 2026-08-21 (Post-release patch)


本版本為 v1.4.0 發布後的修補更新，主要修正文件漏列、UI 順序與部分安全/一致性問題。

### 🛡️ 安全性與一致性修復 (Security & Consistency Fixes)
- **[BUG-28/中] 後端錯誤訊息資訊洩漏修復**：`gas/Code.gs` 的 `writeReport()` 與 `queryReport()` 中「找不到工作表」的錯誤訊息原本會將內部設定值（`SHEET_NAME`）原樣回傳給前端，現已改為回傳固定代碼 `SHEET_NOT_FOUND`，詳細內容僅留於 `Logger.log`（修復弱化版 CWE-209 缺陷）。
- **[BUG-29/低] 修正英文介面下部分後端錯誤訊息顯示中文的問題**：後端的必填/格式驗證錯誤與頻率限制訊息（「請求過於頻繁...」）原本為寫死的繁體中文字串，現已改為固定大寫代碼（如 `RATE_LIMITED`、`VALIDATION_NAME_REQUIRED` 等），並在前端 `report.js` 與 `query.js` 中對應雙語文字。

### 🐛 功能性錯誤修復 (Bug Fixes)
- **[BUG-30/低] Teams 複製按鈕圖示還原修復**：`js/teams.js` 的 `copyAccountName()` 原本使用 `textContent` 還原內容，導致按鈕內的 SVG 圖示結構被攤平。現改用 `innerHTML` 儲存並還原，確保 DOM 結構完整。
- **[UI-01] 主選單按鈕順序調整**：`js/chat.js` 主選單按鈕順序改為「教學 → 常見問題 → **查詢案件** → **報修**」（原為報修在查詢前）。

### 📄 文件修正 (Documentation Fixes)
- **[BUG-20] `intent.js` 備援模型數註解修正**：修正註解中殘留的「9 個模型」為「6 個模型」。
- **[BUG-21~26] `doc/requirements.md` 與 `doc/project-memory.md` 更新**：補上 v1.4.0 遺漏的查詢功能按鈕與需求說明、限流數（4→5）、測試數（42→53），並於 `project-memory.md` 補齊 v1.4.0 的技術決策。
- **[BUG-27] `index.html` 腳本載入順序註解修正**：補上漏列的 `i18n` 與 `query`。
- **[BUG-31] `README.md` 限流分組數修正**：第 153 行的限流組數由「四組」修正為「五組」，與實際程式碼及其他文件一致。
- **[BUG-32] `AGENTS.md` 檔案結構圖修正**：補上漏列的 `js/query.js` 模組。
- **[BUG-33] `README.md` 斷鏈引用修正**：移除「Git 歷史機密殘留」表格中失效的「見上方 WARNING 區塊」引用。

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

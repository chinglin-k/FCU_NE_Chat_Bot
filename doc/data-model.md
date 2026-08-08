# 資料模型文件 (Data Model Specification)

**版本 / Version**：v1.2.0 (Spec v3.2)  
**建立日期 / Created**：2026-07-17  
**最後更新 / Last Updated**：2026-08-08

---

## 1. 實體關聯圖（ER Diagram）

```mermaid
erDiagram
    REPORT_CASE {
        string date          "日期 yyyy/MM/dd"
        string time          "時間 HH:mm:ss"
        string student_id    "學號 (1字母+7數字)"
        string name          "姓名"
        string room_number   "房號"
        string bed_number    "床號 (1-3數字)"
        string phone         "手機號碼 (10數字)"
        string repair_time   "可維修時間（純文字）"
        string description   "問題描述"
        string is_dispatched "是否派人（網管填）"
        string is_completed  "是否完成（網管填）"
        string note          "備註（網管填）"
    }

    USAGE_COUNTER {
        string key   "USER_COUNT (Script Properties)"
        int    count "累積使用人數"
    }

    INTENT_LOG {
        string input_text "使用者輸入文字"
        string intent     "分類意圖代碼"
        string topic      "子主題代碼"
        string timestamp  "時間戳（前端，不寫入）"
    }
```

---

## 2. 核心實體說明

### 2.1 報修案件（REPORT_CASE）

儲存於 Google 試算表（試算表 ID 存於 **GAS Script Properties**，鍵名 `SPREADSHEET_ID`；
**不於文件或程式碼中公開實際 ID**——這點在 `.env.example` 中也有明文規定）。

| 欄位             | 資料型別   | 來源   | 格式與驗證規則                                        |
| -------------- | ------ | ---- | ------------------------------------------------ |
| date           | String | 系統自動 | 通報日期 yyyy/MM/dd                                  |
| time           | String | 系統自動 | 通報時間 HH:mm:ss                                    |
| student_id    | String | 學生填寫 | 必填；1 位英文字母 + 7 位數字（如 D1234567），前後端雙重 RegEx 驗證 |
| name           | String | 學生填寫 | 必填；最長 50 字                                       |
| room_number   | String | 學生填寫 | 必填，例：A123                                       |
| bed_number    | String | 學生填寫 | 必填；1–3 位數字，前後端雙重 RegEx 驗證                      |
| phone          | String | 學生填寫 | 必填；10 位數字，前後端雙重 RegEx 驗證                       |
| repair_time   | String | 學生填寫 | 必填，純文字（如 18:00–21:00）                          |
| description    | String | 學生填寫 | 必填；最長 200 字                                      |
| is_dispatched | String | 網管填寫 | 空白預設，由網管手動更新                                     |
| is_completed  | String | 網管填寫 | 空白預設，由網管手動更新                                     |
| note           | String | 網管填寫 | 空白預設                                             |

> 🔒 送出前另需通過 **reCAPTCHA v3 隱形驗證**（風險分數 ≥ 0.5），詳見 `doc/architecture.md` §5。

### 2.2 累積使用人數（USAGE_COUNTER）

儲存於 GAS Script Properties

| 鍵 | 類型 | 說明 |
|---|---|---|
| USER_COUNT | String（parseInt 使用） | 累積服務人數，每次新 session +1 |

### 2.3 意圖分類（INTENT_LOG）

僅存於前端記憶體，不寫入持久化儲存

| 意圖代碼 | 說明 | 子主題 (Topic) |
|---|---|---|
| BUTTON_TEACH | 教學相關 | NONE |
| BUTTON_SETTING | 常見問題（轉接器、WiFi 帳號密碼、寢室 WiFi 等） | ACCOUNT / ADAPTER / WIFI_SIGNAL / AC_BILLING / ALL |
| BUTTON_REPORT | 主動要求報修 | NONE |
| STICKER_PORT | IP 貼紙缺漏 / 網路孔故障 | NONE |
| NON_NETWORK | 非網管業務 | NONE |
| UNKNOWN | 無法判斷 | ALL |

---

## 3. 資料驗證規則矩陣 (Validation Matrix)

| 欄位 | 前端驗證 (RegEx / MaxLen) | GAS 後端強驗證 (Double Verification) |
|---|---|---|
| 姓名 | 不得為空（最長 50 字） | 長度截斷 `slice(0, 50)` |
| 學號 | 必填；`/^[a-zA-Z][0-9]{7}$/` (如 D1234567) | 格式強驗證 `!/^[a-zA-Z][0-9]{7}$/` + 截斷 8 字 |
| 房號 | 必填（最長 8 字） | 長度截斷 `slice(0, 8)` |
| 床號 | 必填；`/^[0-9]{1,3}$/` | 格式強驗證 `!/^[0-9]{1,3}$/` + 截斷 3 字 |
| 手機 | 必填；`/^[0-9]{10}$/` | 格式強驗證 `!/^[0-9]{10}$/` + 截斷 10 字 |
| 可維修時間 | 小時 0–23、分鐘 0–59 範圍驗證 | 長度截斷 `slice(0, 20)` |
| 問題描述 | 必填（最長 200 字） | 長度截斷 `slice(0, 200)` |

---

## 4. 資料生命週期

| 資料 | 建立 | 更新 | 刪除 |
|---|---|---|---|
| 報修案件 | 使用者送出表單時（經 reCAPTCHA v3 + Token 驗證） | 網管人員手動更新試算表 | 不刪除（永久保存） |
| 累積計數器 | 首次呼叫 increment 時 | 每次新 session (Atomic LockService) | 不刪除 |

// ============================================================
// FCU 宿舍網路報修 Chatbot — Google Apps Script 後端
// 試算表 ID: 1BUnG_NNaxU-oBFPKY-rZ0xWyxAzG-A_AVOsw07X79uI
//
// 部署步驟：
//   1. 至 https://script.google.com 建立新專案，貼入此程式碼
//   2. 點「專案設定」→「指令碼屬性」，新增屬性：
//      名稱：GEMINI_API_KEY　值：你的 Gemini API Key
//   3. 部署 → 新的部署 → 類型：「網頁應用程式」
//      執行身分：「我自己」/ 誰可以存取：「所有人」
//   4. 複製產生的 Web App URL，貼到 js/config.js 的 GAS_URL
// ============================================================

const SPREADSHEET_ID = '1BUnG_NNaxU-oBFPKY-rZ0xWyxAzG-A_AVOsw07X79uI';
const SHEET_NAME     = '工作表1'; // 若試算表分頁名稱不同，請修改

// Gemini API 設定
const GEMINI_MODEL   = 'gemini-1.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/**
 * 主要入口點：處理所有 GET 請求
 * 以 action 參數區分操作類型
 *
 * @param {GoogleAppsScript.Events.DoGet} e
 * @returns {GoogleAppsScript.Content.TextOutput}
 */
function doGet(e) {
  let result;

  try {
    const action = e.parameter.action || '';

    switch (action) {
      case 'classify':
        result = classifyIntent(e.parameter.msg || '');
        break;

      case 'report':
        if (!e.parameter.payload) {
          result = { success: false, error: '缺少 payload 參數' };
        } else {
          const payload = JSON.parse(decodeURIComponent(e.parameter.payload));
          result = writeReport(payload);
        }
        break;

      case 'counter_get':
        result = getCounter();
        break;

      case 'counter_increment':
        result = incrementCounter();
        break;

      default:
        result = { success: false, error: `未知的 action: ${action}` };
    }

  } catch (err) {
    Logger.log('[doGet] 錯誤: ' + err.toString());
    result = { success: false, error: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 意圖分類：呼叫 Gemini API 判斷使用者意圖
 *
 * @param {string} message - 使用者輸入文字
 * @returns {{ success: boolean, intent?: string, error?: string }}
 */
function classifyIntent(message) {
  if (!message || !message.trim()) {
    return { success: false, error: '訊息不得為空' };
  }

  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) {
    return { success: false, error: 'GEMINI_API_KEY 未在 Script Properties 中設定' };
  }

  const prompt = `你是逢甲大學宿舍網路管理系統的意圖分類器。

請根據使用者的輸入，將其分類為以下意圖之一。
請只回覆意圖代碼，不要有任何其他文字、標點或說明。

意圖代碼定義（嚴格遵守）：
- BUTTON_TEACH：詢問如何設定網路、網路連線教學、如何使用網路
- BUTTON_SETTING：詢問轉接器沒有網路、USB 轉接器問題、RJ45 轉換器、驅動程式問題
- BUTTON_REPORT：明確說要報修、需要實體協助、要有人來看、我要報修、幫我修
- STICKER_PORT：缺少 IP 貼紙、沒有貼紙、網路孔壞了、插孔故障、網路插口故障、沒有 IP
- NON_NETWORK：詢問冷氣、洗手台、熱水、電燈、宿舍設施、寢室電器等非網路問題
- UNKNOWN：無法判斷意圖或不屬於以上任何類別

使用者輸入：${message.trim()}

請只回覆以下其中一個代碼（完整代碼，無其他文字）：
BUTTON_TEACH, BUTTON_SETTING, BUTTON_REPORT, STICKER_PORT, NON_NETWORK, UNKNOWN`;

  try {
    const response = UrlFetchApp.fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method:      'POST',
      contentType: 'application/json',
      payload: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature:     0.1,
          maxOutputTokens: 30,
          topP:            0.8
        }
      }),
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    if (code !== 200) {
      Logger.log('[classifyIntent] Gemini API HTTP ' + code + ': ' + response.getContentText());
      return { success: false, error: `Gemini API 回傳 HTTP ${code}` };
    }

    const responseData = JSON.parse(response.getContentText());
    const rawText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const rawIntent = rawText.trim().toUpperCase();

    const VALID_INTENTS = ['BUTTON_TEACH', 'BUTTON_SETTING', 'BUTTON_REPORT', 'STICKER_PORT', 'NON_NETWORK', 'UNKNOWN'];
    const intent = VALID_INTENTS.includes(rawIntent) ? rawIntent : 'UNKNOWN';

    Logger.log(`[classifyIntent] 輸入="${message}" → 原始="${rawIntent}" → 最終="${intent}"`);
    return { success: true, intent };

  } catch (err) {
    Logger.log('[classifyIntent] 例外: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * 寫入報修資料至 Google 試算表
 *
 * @param {object} reportData - 報修資料物件
 * @returns {{ success: boolean, message?: string, error?: string }}
 */
function writeReport(reportData) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    // 若工作表不存在則使用第一個
    if (!sheet) {
      sheet = spreadsheet.getSheets()[0];
    }

    // 若試算表是空的，自動加上標題列
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        '日期', '時間', '學號', '姓名', '房號', '床號',
        '手機', '可維修時間', '問題描述', '是否派人', '是否完成', '備註'
      ]);

      // 設定標題列格式
      const headerRange = sheet.getRange(1, 1, 1, 12);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#1a365d');
      headerRange.setFontColor('#ffffff');
    }

    const now  = new Date();
    const date = Utilities.formatDate(now, 'Asia/Taipei', 'yyyy/MM/dd');
    const time = Utilities.formatDate(now, 'Asia/Taipei', 'HH:mm:ss');

    sheet.appendRow([
      date,
      time,
      reportData.studentId   || '',
      reportData.name        || '',
      reportData.roomNumber  || '',
      reportData.bedNumber   || '',
      reportData.phone       || '',
      reportData.repairTime  || '',
      reportData.description || '',
      '',   // 是否派人（網管填寫）
      '',   // 是否完成（網管填寫）
      ''    // 備註（網管填寫）
    ]);

    Logger.log(`[writeReport] 新增報修：${reportData.name} ${reportData.roomNumber}-${reportData.bedNumber}`);
    return { success: true, message: '報修資料已成功寫入試算表' };

  } catch (err) {
    Logger.log('[writeReport] 錯誤: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * 取得累積使用人數
 *
 * @returns {{ success: boolean, count: number, error?: string }}
 */
function getCounter() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const count = parseInt(properties.getProperty('USER_COUNT') || '0', 10);
    return { success: true, count };
  } catch (err) {
    Logger.log('[getCounter] 錯誤: ' + err.toString());
    return { success: false, count: 0, error: err.toString() };
  }
}

/**
 * 累加使用人數（每次新 session 呼叫一次）
 *
 * @returns {{ success: boolean, count: number, error?: string }}
 */
function incrementCounter() {
  try {
    const properties  = PropertiesService.getScriptProperties();
    const currentCount = parseInt(properties.getProperty('USER_COUNT') || '0', 10);
    const newCount     = currentCount + 1;
    properties.setProperty('USER_COUNT', newCount.toString());
    Logger.log(`[incrementCounter] 累積使用人數：${newCount}`);
    return { success: true, count: newCount };
  } catch (err) {
    Logger.log('[incrementCounter] 錯誤: ' + err.toString());
    return { success: false, error: err.toString() };
  }
}

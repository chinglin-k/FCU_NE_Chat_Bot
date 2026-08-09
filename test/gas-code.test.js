'use strict';

const test   = require('node:test');
const assert = require('node:assert/strict');
const { loadGasCode } = require('./gas-mocks');

// ══════════════════════════════════════════════
// 1. 頻率限制（Rate Limit）— 依使用者區分 + 全域上限
// ══════════════════════════════════════════════
test('rate limit: 同一 clientId 超過個人上限後被拒絕', () => {
  const { exported, restore } = loadGasCode();
  try {
    const { _checkRateLimit } = exported;
    // limitPerMinute=3，globalLimitPerMinute=100（夠大，不會先觸發全域上限）
    assert.equal(_checkRateLimit('test_action', 3, 'user-a', 100), true);
    assert.equal(_checkRateLimit('test_action', 3, 'user-a', 100), true);
    assert.equal(_checkRateLimit('test_action', 3, 'user-a', 100), true);
    assert.equal(_checkRateLimit('test_action', 3, 'user-a', 100), false, '第 4 次應被個人上限擋下');
  } finally {
    restore();
  }
});

test('rate limit: 不同 clientId 互不影響彼此的個人配額', () => {
  const { exported, restore } = loadGasCode();
  try {
    const { _checkRateLimit } = exported;
    assert.equal(_checkRateLimit('test_action', 1, 'user-a', 100), true);
    assert.equal(_checkRateLimit('test_action', 1, 'user-a', 100), false, 'user-a 已用完個人配額');
    // user-b 是不同使用者，理應仍可通過（若舊版全域共享限流則這裡會失敗）
    assert.equal(_checkRateLimit('test_action', 1, 'user-b', 100), true);
  } finally {
    restore();
  }
});

test('rate limit: 全域上限會擋下大量不同 clientId 的請求（防止清空 localStorage 繞過）', () => {
  const { exported, restore } = loadGasCode();
  try {
    const { _checkRateLimit } = exported;
    // 個人上限很寬鬆（每人 10 次），但全域上限只有 2 次
    assert.equal(_checkRateLimit('test_action', 10, 'user-1', 2), true);
    assert.equal(_checkRateLimit('test_action', 10, 'user-2', 2), true);
    assert.equal(_checkRateLimit('test_action', 10, 'user-3', 2), false, '第 3 個不同使用者應被全域上限擋下');
  } finally {
    restore();
  }
});

test('rate limit: 缺少 clientId 時退回共用的 anonymous 配額', () => {
  const { exported, restore } = loadGasCode();
  try {
    const { _checkRateLimit } = exported;
    assert.equal(_checkRateLimit('test_action', 1, undefined, 100), true);
    assert.equal(_checkRateLimit('test_action', 1, '', 100), false, '空字串與 undefined 應歸為同一 anonymous 桶');
  } finally {
    restore();
  }
});

test('_sanitizeIdentifier：清洗非法字元並限制長度，避免 cache key 注入', () => {
  const { exported, restore } = loadGasCode();
  try {
    const { _sanitizeIdentifier } = exported;
    assert.equal(_sanitizeIdentifier('abc-123'), 'abc-123');
    assert.equal(_sanitizeIdentifier('abc_123 xyz!@#'), 'abc123xyz', '底線、空白、符號應被移除');
    assert.equal(_sanitizeIdentifier(''), 'anonymous');
    assert.equal(_sanitizeIdentifier(null), 'anonymous');
    assert.equal(_sanitizeIdentifier('a'.repeat(200)).length, 64, '超長識別碼應截斷至 64 字元');
  } finally {
    restore();
  }
});

// ══════════════════════════════════════════════
// 2. reCAPTCHA v3 驗證
// ══════════════════════════════════════════════
test('_verifyRecaptcha：未設定 RECAPTCHA_SECRET_KEY 時直接拒絕', () => {
  const { exported, restore } = loadGasCode({ scriptProperties: {} });
  try {
    const result = exported._verifyRecaptcha('some-token', 'submit_report');
    assert.equal(result.success, false);
    assert.equal(result.error, 'RECAPTCHA_NOT_CONFIGURED');
  } finally {
    restore();
  }
});

test('_verifyRecaptcha：缺少 token 時拒絕', () => {
  const { exported, restore } = loadGasCode({
    scriptProperties: { RECAPTCHA_SECRET_KEY: 'secret' }
  });
  try {
    const result = exported._verifyRecaptcha('', 'submit_report');
    assert.equal(result.success, false);
    assert.equal(result.error, 'RECAPTCHA_TOKEN_MISSING');
  } finally {
    restore();
  }
});

test('_verifyRecaptcha：Google 回傳 success=false 時拒絕', () => {
  const { exported, mocks, restore } = loadGasCode({
    scriptProperties: { RECAPTCHA_SECRET_KEY: 'secret' }
  });
  try {
    mocks.__setFetchImpl(() => ({
      getResponseCode: () => 200,
      getContentText: () => JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] })
    }));
    const result = exported._verifyRecaptcha('bad-token', 'submit_report');
    assert.equal(result.success, false);
    assert.equal(result.error, 'RECAPTCHA_FAILED');
  } finally {
    restore();
  }
});

test('_verifyRecaptcha：action 不符時拒絕', () => {
  const { exported, mocks, restore } = loadGasCode({
    scriptProperties: { RECAPTCHA_SECRET_KEY: 'secret' }
  });
  try {
    mocks.__setFetchImpl(() => ({
      getResponseCode: () => 200,
      getContentText: () => JSON.stringify({ success: true, action: 'some_other_action', score: 0.9 })
    }));
    const result = exported._verifyRecaptcha('token', 'submit_report');
    assert.equal(result.success, false);
    assert.equal(result.error, 'RECAPTCHA_ACTION_MISMATCH');
  } finally {
    restore();
  }
});

test('_verifyRecaptcha：分數低於門檻時拒絕', () => {
  const { exported, mocks, restore } = loadGasCode({
    scriptProperties: { RECAPTCHA_SECRET_KEY: 'secret' }
  });
  try {
    mocks.__setFetchImpl(() => ({
      getResponseCode: () => 200,
      getContentText: () => JSON.stringify({ success: true, action: 'submit_report', score: 0.1 })
    }));
    const result = exported._verifyRecaptcha('token', 'submit_report');
    assert.equal(result.success, false);
    assert.equal(result.error, 'RECAPTCHA_LOW_SCORE');
  } finally {
    restore();
  }
});

test('_verifyRecaptcha：全部條件通過時成功', () => {
  const { exported, mocks, restore } = loadGasCode({
    scriptProperties: { RECAPTCHA_SECRET_KEY: 'secret' }
  });
  try {
    mocks.__setFetchImpl(() => ({
      getResponseCode: () => 200,
      getContentText: () => JSON.stringify({ success: true, action: 'submit_report', score: 0.9 })
    }));
    const result = exported._verifyRecaptcha('token', 'submit_report');
    assert.equal(result.success, true);
    assert.equal(result.score, 0.9);
  } finally {
    restore();
  }
});

// ══════════════════════════════════════════════
// 3. writeReport：整合頻率限制、reCAPTCHA、格式驗證、截斷
// ══════════════════════════════════════════════
function validReportPayload() {
  return {
    studentId:  'D1234567',
    name:       '王小明',
    roomNumber: 'A101',
    bedNumber:  '2',
    phone:      '0912345678',
    repairTime: '18:00–21:00',
    description: '寢室網路無法連線'
  };
}

function mockPassingRecaptcha(mocks) {
  mocks.__setFetchImpl(() => ({
    getResponseCode: () => 200,
    getContentText: () => JSON.stringify({ success: true, action: 'submit_report', score: 0.9 })
  }));
}

test('writeReport：reCAPTCHA 未通過時拒絕寫入（即使表單格式正確）', () => {
  const { exported, restore } = loadGasCode({
    scriptProperties: { SPREADSHEET_ID: 'sheet-id', RECAPTCHA_SECRET_KEY: 'secret' }
  });
  try {
    // 預設 fetchImpl 回傳 HTTP 500 → siteverify 視為失敗
    const result = exported.writeReport(validReportPayload(), 'user-a', 'some-token');
    assert.equal(result.success, false);
  } finally {
    restore();
  }
});

test('writeReport：格式正確 + reCAPTCHA 通過時成功寫入', () => {
  const { exported, mocks, restore } = loadGasCode({
    scriptProperties: { SPREADSHEET_ID: 'sheet-id', RECAPTCHA_SECRET_KEY: 'secret' }
  });
  try {
    mockPassingRecaptcha(mocks);
    const result = exported.writeReport(validReportPayload(), 'user-a', 'good-token');
    assert.equal(result.success, true);
  } finally {
    restore();
  }
});

test('writeReport：手機號碼格式錯誤時拒絕', () => {
  const { exported, mocks, restore } = loadGasCode({
    scriptProperties: { SPREADSHEET_ID: 'sheet-id', RECAPTCHA_SECRET_KEY: 'secret' }
  });
  try {
    mockPassingRecaptcha(mocks);
    const payload = { ...validReportPayload(), phone: '12345' };
    const result = exported.writeReport(payload, 'user-b', 'good-token');
    assert.equal(result.success, false);
    assert.match(result.error, /手機號碼格式錯誤/);
  } finally {
    restore();
  }
});

test('writeReport：學號格式錯誤時拒絕', () => {
  const { exported, mocks, restore } = loadGasCode({
    scriptProperties: { SPREADSHEET_ID: 'sheet-id', RECAPTCHA_SECRET_KEY: 'secret' }
  });
  try {
    mockPassingRecaptcha(mocks);
    const payload = { ...validReportPayload(), studentId: '12345678' };
    const result = exported.writeReport(payload, 'user-c', 'good-token');
    assert.equal(result.success, false);
    assert.match(result.error, /學號格式錯誤/);
  } finally {
    restore();
  }
});

// ── v1.3.1 / BUG-01 迴歸測試 ──────────────────────────────
// 修正前：`if (phone && !regex.test(phone))` 在欄位為空字串（falsy）時
// 會整段跳過驗證，等同繞過前端即可送出必填欄位皆為空的報修單。
test('writeReport：studentId 為空字串時應拒絕（BUG-01 迴歸測試）', () => {
  const { exported, mocks, restore } = loadGasCode({
    scriptProperties: { SPREADSHEET_ID: 'sheet-id', RECAPTCHA_SECRET_KEY: 'secret' }
  });
  try {
    mockPassingRecaptcha(mocks);
    const payload = { ...validReportPayload(), studentId: '' };
    const result = exported.writeReport(payload, 'user-f', 'good-token');
    assert.equal(result.success, false);
    assert.match(result.error, /學號格式錯誤/);
  } finally {
    restore();
  }
});

test('writeReport：phone / bedNumber / roomNumber 為空字串時應拒絕（BUG-01 迴歸測試）', () => {
  const { exported, mocks, restore } = loadGasCode({
    scriptProperties: { SPREADSHEET_ID: 'sheet-id', RECAPTCHA_SECRET_KEY: 'secret' }
  });
  try {
    mockPassingRecaptcha(mocks);
    const cases = [
      { field: 'phone', overrides: { phone: '' }, expected: /手機號碼格式錯誤/ },
      { field: 'bedNumber', overrides: { bedNumber: '' }, expected: /床號格式錯誤/ },
      { field: 'roomNumber', overrides: { roomNumber: '' }, expected: /房號格式錯誤/ },
      { field: 'name', overrides: { name: '' }, expected: /請輸入姓名/ },
      { field: 'description', overrides: { description: '' }, expected: /請描述您的網路問題/ }
    ];
    for (const { field, overrides, expected } of cases) {
      const payload = { ...validReportPayload(), ...overrides };
      const result = exported.writeReport(payload, `user-empty-${field}`, 'good-token');
      assert.equal(result.success, false, `欄位 ${field} 為空字串時應被拒絕`);
      assert.match(result.error, expected);
    }
  } finally {
    restore();
  }
});

test('writeReport：超長欄位會被後端截斷後寫入，而非直接拒絕', () => {
  const { exported, mocks, restore } = loadGasCode({
    scriptProperties: { SPREADSHEET_ID: 'sheet-id', RECAPTCHA_SECRET_KEY: 'secret' }
  });
  try {
    mockPassingRecaptcha(mocks);
    const longDescription = 'x'.repeat(500);
    const payload = { ...validReportPayload(), description: longDescription };
    const result = exported.writeReport(payload, 'user-d', 'good-token');
    assert.equal(result.success, true);
    const lastRow = mocks._internal.mockSheet._rows.at(-1);
    // 欄位順序：日期,時間,學號,姓名,房號,床號,手機,可維修時間,問題描述,...
    assert.equal(lastRow[8].length, 200, '問題描述應被截斷為 200 字元');
  } finally {
    restore();
  }
});

test('writeReport：超過個人頻率限制時直接拒絕（不觸發 reCAPTCHA 或寫入）', () => {
  const { exported, mocks, restore } = loadGasCode({
    scriptProperties: { SPREADSHEET_ID: 'sheet-id', RECAPTCHA_SECRET_KEY: 'secret' }
  });
  try {
    mockPassingRecaptcha(mocks);
    for (let i = 0; i < 5; i++) {
      exported.writeReport(validReportPayload(), 'user-e', 'good-token');
    }
    const result = exported.writeReport(validReportPayload(), 'user-e', 'good-token');
    assert.equal(result.success, false);
    assert.match(result.error, /請求過於頻繁/);
  } finally {
    restore();
  }
});

// ══════════════════════════════════════════════
// 4. classifyIntent：頻率限制 + 未設定 API Key 時的行為
// ══════════════════════════════════════════════
test('classifyIntent：未設定 GEMINI_API_KEY 時回傳明確錯誤', () => {
  const { exported, restore } = loadGasCode({ scriptProperties: {} });
  try {
    const result = exported.classifyIntent('網路壞了', 'user-a');
    assert.equal(result.success, false);
    assert.match(result.error, /GEMINI_API_KEY/);
  } finally {
    restore();
  }
});

test('classifyIntent：超過個人頻率限制（12 次/分鐘）時拒絕', () => {
  const { exported, restore } = loadGasCode({ scriptProperties: {} });
  try {
    for (let i = 0; i < 12; i++) {
      exported.classifyIntent('網路壞了', 'user-f');
    }
    const result = exported.classifyIntent('網路壞了', 'user-f');
    assert.equal(result.success, false);
    assert.match(result.error, /請求過於頻繁/);
  } finally {
    restore();
  }
});

test('classifyIntent：空白訊息回傳錯誤', () => {
  const { exported, restore } = loadGasCode({ scriptProperties: { GEMINI_API_KEY: 'key' } });
  try {
    const result = exported.classifyIntent('   ', 'user-g');
    assert.equal(result.success, false);
    assert.match(result.error, /訊息不得為空/);
  } finally {
    restore();
  }
});

// ══════════════════════════════════════════════
// 5. _ruleBasedClassify：多語言關鍵字備援分類器
// ══════════════════════════════════════════════
test('_ruleBasedClassify：多語言關鍵字皆能正確分類', () => {
  const { exported, restore } = loadGasCode();
  try {
    const { _ruleBasedClassify } = exported;

    const cases = [
      // [輸入, 預期 intent, 預期 topic, 語言說明]
      ['網路壞了幫我報修', 'BUTTON_REPORT', 'NONE', '繁中'],
      ['网络坏了需要维修', 'BUTTON_REPORT', 'NONE', '簡中'],
      ['my internet is broken, please fix it', 'BUTTON_REPORT', 'NONE', '英文'],
      ['インターネットが繋がらない、修理お願いします', 'BUTTON_REPORT', 'NONE', '日文'],
      ['請問轉接器驅動程式怎麼裝', 'BUTTON_SETTING', 'ADAPTER', '繁中-轉接器'],
      ['fcu帳號密碼是什麼', 'BUTTON_SETTING', 'ACCOUNT', '繁中-帳密'],
      ['寢室收不到wifi訊號', 'BUTTON_SETTING', 'WIFI_SIGNAL', '繁中-WiFi訊號'],
      ['冷氣儲值要怎麼繳費', 'BUTTON_SETTING', 'AC_BILLING', '繁中-冷氣電費'],
      ['網路孔壞了找不到IP貼紙', 'STICKER_PORT', 'NONE', '繁中-貼紙'],
      ['怎麼設定網路連線教學', 'BUTTON_TEACH', 'NONE', '繁中-教學'],
      ['熱水器沒有熱水', 'NON_NETWORK', 'NONE', '繁中-非網管'],
      ['今天天氣真好', 'UNKNOWN', 'NONE', '無法匹配']
    ];

    for (const [input, expectedIntent, expectedTopic, label] of cases) {
      const result = _ruleBasedClassify(input);
      assert.equal(result.intent, expectedIntent, `[${label}] 輸入「${input}」意圖應為 ${expectedIntent}，實際為 ${result.intent}`);
      assert.equal(result.topic, expectedTopic, `[${label}] 輸入「${input}」子主題應為 ${expectedTopic}`);
    }
  } finally {
    restore();
  }
});

// ══════════════════════════════════════════════
// 6. doGet / doPost 路由
// ══════════════════════════════════════════════
function callDoGet(exported, params) {
  const result = exported.doGet({ parameter: params });
  return JSON.parse(result._text);
}

function callDoPost(exported, body) {
  const result = exported.doPost({ postData: { contents: JSON.stringify(body) } });
  return JSON.parse(result._text);
}

test('doGet：get_token 回傳一次性 token', () => {
  const { exported, restore } = loadGasCode();
  try {
    const data = callDoGet(exported, { action: 'get_token' });
    assert.equal(data.success, true);
    assert.equal(typeof data.token, 'string');
    assert.ok(data.token.length > 0);
  } finally {
    restore();
  }
});

test('doGet：classify / report 已改至 doPost，doGet 明確拒絕', () => {
  const { exported, restore } = loadGasCode();
  try {
    for (const action of ['classify', 'report']) {
      const data = callDoGet(exported, { action });
      assert.equal(data.success, false);
      assert.match(data.error, /已改為 POST/);
    }
  } finally {
    restore();
  }
});

test('doGet：counter_get 與 counter_increment 正常運作', () => {
  const { exported, restore } = loadGasCode();
  try {
    const before = callDoGet(exported, { action: 'counter_get' });
    assert.equal(before.success, true);
    assert.equal(before.count, 0);

    const after = callDoGet(exported, { action: 'counter_increment' });
    assert.equal(after.success, true);
    assert.equal(after.count, 1);
  } finally {
    restore();
  }
});

// ── v1.3.1 / BUG-08 迴歸測試 ──────────────────────────────
// 修正前：counter_increment 使用固定 identifier 'anonymous' 且使用者級上限為
// 999999（形同不限制），任何人皆可直接對 GAS_URL 灌爆此 action 刷高計數。
test('doGet：counter_increment 依 clientId 個別限流，超過上限即拒絕（BUG-08 迴歸測試）', () => {
  const { exported, restore } = loadGasCode();
  try {
    const clientId = 'client-x';
    // 依目前設定，同一 clientId 每分鐘最多 3 次
    for (let i = 0; i < 3; i++) {
      const r = callDoGet(exported, { action: 'counter_increment', clientId });
      assert.equal(r.success, true, `第 ${i + 1} 次應成功`);
    }
    const fourth = callDoGet(exported, { action: 'counter_increment', clientId });
    assert.equal(fourth.success, false, '第 4 次應被限流拒絕');
    assert.match(fourth.error, /請求過於頻繁/);
  } finally {
    restore();
  }
});

test('doGet：counter_increment 不同 clientId 各自獨立計算配額', () => {
  const { exported, restore } = loadGasCode();
  try {
    for (let i = 0; i < 3; i++) {
      assert.equal(callDoGet(exported, { action: 'counter_increment', clientId: 'client-a' }).success, true);
    }
    // client-a 額度用盡，但 client-b 應仍可正常累加
    const bResult = callDoGet(exported, { action: 'counter_increment', clientId: 'client-b' });
    assert.equal(bResult.success, true);
  } finally {
    restore();
  }
});

test('doPost：缺少或錯誤的 token 一律回傳 INVALID_TOKEN', () => {
  const { exported, restore } = loadGasCode();
  try {
    const data = callDoPost(exported, { action: 'classify', msg: 'test', token: 'not-a-real-token' });
    assert.equal(data.success, false);
    assert.equal(data.error, 'INVALID_TOKEN');
  } finally {
    restore();
  }
});

test('doPost：token 為一次性，用過即失效（同一 token 不能重複使用）', () => {
  const { exported, restore } = loadGasCode({ scriptProperties: { GEMINI_API_KEY: 'key' } });
  try {
    const token = callDoGet(exported, { action: 'get_token' }).token;

    const first = callDoPost(exported, { action: 'classify', msg: 'test', token });
    assert.notEqual(first.error, 'INVALID_TOKEN', '第一次使用應該有效');

    const second = callDoPost(exported, { action: 'classify', msg: 'test', token });
    assert.equal(second.error, 'INVALID_TOKEN', '同一 token 第二次使用應失效');
  } finally {
    restore();
  }
});

test('doPost：合法 token 搭配未知 action 時回傳明確錯誤', () => {
  const { exported, restore } = loadGasCode();
  try {
    const token = callDoGet(exported, { action: 'get_token' }).token;
    const data  = callDoPost(exported, { action: 'not_a_real_action', token });
    assert.equal(data.success, false);
    assert.match(data.error, /doPost 不支援 action/);
  } finally {
    restore();
  }
});

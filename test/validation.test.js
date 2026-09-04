'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

// ── 1. 表單強驗證與學號格式測試 (Task 1 & Task 4 & RegEx Validation) ──
function validateStudentId(studentId) {
  if (!studentId || typeof studentId !== 'string') return false;
  return /^[a-zA-Z][0-9]{7}$/.test(studentId.trim());
}

function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return /^[0-9]{10}$/.test(phone.trim());
}

function validateBedNumber(bed) {
  if (!bed || typeof bed !== 'string') return false;
  // 修正（BUG-BED-01）：對齊後端 Code.gs 與前端 report.js，僅允許單一位數字
  return /^[0-9]$/.test(bed.trim());
}

test('Student ID validation (1 letter + 7 digits)', () => {
  assert.equal(validateStudentId('D1234567'), true, 'Valid student ID (upper)');
  assert.equal(validateStudentId('d9876543'), true, 'Valid student ID (lower)');
  assert.equal(validateStudentId('12345678'), false, 'All digits without letter should fail');
  assert.equal(validateStudentId('DD123456'), false, 'Two letters should fail');
  assert.equal(validateStudentId('D123456'), false, '6 digits should fail');
  assert.equal(validateStudentId(''), false, 'Empty string should fail');
});

test('Phone validation (10 digits)', () => {
  assert.equal(validatePhone('0912345678'), true, 'Valid 10 digits mobile number');
  assert.equal(validatePhone('091234567'), false, '9 digits should fail');
  assert.equal(validatePhone('09123456789'), false, '11 digits should fail');
  assert.equal(validatePhone('abc0912345'), false, 'Letters in phone should fail');
});

test('Bed number validation (1 digit only)', () => {
  assert.equal(validateBedNumber('1'), true, '1 digit');
  assert.equal(validateBedNumber('9'), true, 'single digit 9');
  assert.equal(validateBedNumber('0'), true, 'single digit 0');
  assert.equal(validateBedNumber('12'),  false, '2 digits should fail (front+backend now consistent)');
  assert.equal(validateBedNumber('123'), false, '3 digits should fail (front+backend now consistent)');
  assert.equal(validateBedNumber('1234'), false, '4 digits should fail');
  assert.equal(validateBedNumber('A'), false, 'Non-digits should fail');
});

// ── 2. 白名單過濾機制測試 (Task 4: Defense in Depth) ──
const VALID_INTENTS = ['BUTTON_TEACH', 'BUTTON_SETTING', 'BUTTON_REPORT', 'STICKER_PORT', 'NON_NETWORK', 'UNKNOWN'];
const VALID_TOPICS  = ['ACCOUNT', 'ADAPTER', 'WIFI_SIGNAL', 'AC_BILLING', 'ALL', 'NONE'];

function filterIntent(rawIntent) {
  const normalized = (typeof rawIntent === 'string') ? rawIntent.trim().toUpperCase() : '';
  return VALID_INTENTS.includes(normalized) ? normalized : 'UNKNOWN';
}

function filterTopic(intent, rawTopic) {
  if (intent !== 'BUTTON_SETTING') return 'NONE';
  const normalized = (typeof rawTopic === 'string') ? rawTopic.trim().toUpperCase() : '';
  return VALID_TOPICS.includes(normalized) ? normalized : 'ALL';
}

test('Intent whitelist filter', () => {
  assert.equal(filterIntent('BUTTON_REPORT'), 'BUTTON_REPORT');
  assert.equal(filterIntent('button_teach'), 'BUTTON_TEACH');
  assert.equal(filterIntent('HACKED_INTENT'), 'UNKNOWN', 'Invalid intent fallback to UNKNOWN');
  assert.equal(filterIntent('<script>alert(1)</script>'), 'UNKNOWN', 'Malicious script payload fallback to UNKNOWN');
  assert.equal(filterIntent(null), 'UNKNOWN');
});

test('Topic whitelist filter', () => {
  assert.equal(filterTopic('BUTTON_SETTING', 'ADAPTER'), 'ADAPTER');
  assert.equal(filterTopic('BUTTON_SETTING', 'INVALID_TOPIC'), 'ALL', 'Invalid topic fallback to ALL');
  assert.equal(filterTopic('BUTTON_REPORT', 'ADAPTER'), 'NONE', 'Non-setting intent topic set to NONE');
});

// ── 3. 信心分數與確認機制測試 (Confidence threshold < 0.6) ──
function needsConfirmation(confidence) {
  const conf = (typeof confidence === 'number') ? Math.min(1.0, Math.max(0.0, confidence)) : 0.5;
  return conf < 0.6;
}

test('Confidence score confirmation threshold', () => {
  assert.equal(needsConfirmation(0.95), false, 'High confidence does not need confirmation');
  assert.equal(needsConfirmation(0.60), false, '0.60 confidence does not need confirmation');
  assert.equal(needsConfirmation(0.59), true, '< 0.60 confidence needs confirmation');
  assert.equal(needsConfirmation(0.10), true, 'Low confidence needs confirmation');
  assert.equal(needsConfirmation(null), true, 'Invalid confidence defaults to low confidence');
});

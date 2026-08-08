'use strict';

/**
 * gas-mocks.js
 * ── 為 gas/Code.gs 提供最小可用的 GAS 全域服務假物件（CacheService、
 *    PropertiesService、UrlFetchApp…），讓純 Node 環境也能 require Code.gs
 *    並測試心中的邏輯（頻率限制、reCAPTCHA 驗證、表單驗證、路由等）。
 *
 * 使用方式：
 *   const { loadGasCode } = require('./gas-mocks');
 *   const { exported, mocks, restore } = loadGasCode({ scriptProperties: {...} });
 *   // exported.classifyIntent(...) / exported._checkRateLimit(...) ...
 *   restore(); // 測試結束後還原 global，避免污染其他測試檔
 */

const nodePath = require('node:path');
const crypto   = require('node:crypto');

function createGasMocks(overrides = {}) {
  const cacheStore = new Map();
  const propStore  = new Map(Object.entries(overrides.scriptProperties || {}));

  const CacheService = {
    getScriptCache() {
      return {
        get:    (k) => (cacheStore.has(k) ? cacheStore.get(k) : null),
        put:    (k, v) => { cacheStore.set(k, String(v)); },
        remove: (k) => { cacheStore.delete(k); }
      };
    }
  };

  const PropertiesService = {
    getScriptProperties() {
      return {
        getProperty: (k) => (propStore.has(k) ? propStore.get(k) : null),
        setProperty: (k, v) => { propStore.set(k, v); }
      };
    }
  };

  const LockService = {
    getScriptLock() {
      return { waitLock: () => {}, releaseLock: () => {} };
    }
  };

  const Logger = { log: () => {} };

  const Utilities = {
    getUuid:    () => crypto.randomUUID(),
    sleep:      () => {}, // 測試中不需要真的等待
    formatDate: (date) => date.toISOString()
  };

  const ContentService = {
    MimeType: { JSON: 'JSON' },
    createTextOutput(text) {
      return {
        _text: text,
        setMimeType(type) { this._mimeType = type; return this; }
      };
    }
  };

  // 預設：模擬 Gemini API 呼叫失敗（HTTP 500），逼 classifyIntent 走本地備援。
  // 測試可用 mocks.__setFetchImpl() 覆寫，模擬 Gemini 成功或 reCAPTCHA siteverify 回應。
  let fetchImpl = overrides.fetchImpl || (() => ({
    getResponseCode: () => 500,
    getContentText:  () => '{}'
  }));

  const UrlFetchApp = {
    fetch: (...args) => fetchImpl(...args)
  };

  function createMockSheet() {
    const rows = [];
    return {
      getLastRow: () => rows.length,
      appendRow:  (row) => { rows.push(row); },
      getRange:   (row) => ({
        setFontWeight:   () => {},
        setBackground:   () => {},
        setFontColor:    () => {},
        setNumberFormat: () => {},
        setValues:       (values) => { rows[row - 1] = values[0]; }
      }),
      _rows: rows
    };
  }

  const mockSheet = createMockSheet();
  const SpreadsheetApp = {
    openById: () => ({
      getSheetByName: () => (overrides.noSheet ? null : mockSheet)
    })
  };

  return {
    CacheService, PropertiesService, LockService, Logger, Utilities,
    ContentService, UrlFetchApp, SpreadsheetApp,
    __setFetchImpl(fn) { fetchImpl = fn; },
    _internal: { cacheStore, propStore, mockSheet }
  };
}

const GAS_GLOBAL_KEYS = [
  'CacheService', 'PropertiesService', 'LockService', 'Logger',
  'Utilities', 'ContentService', 'UrlFetchApp', 'SpreadsheetApp'
];

/**
 * 注入假的 GAS 全域服務，重新載入 gas/Code.gs 並回傳其匯出的函式。
 * @param {object} [overrides] - { scriptProperties: {SPREADSHEET_ID, GEMINI_API_KEY, RECAPTCHA_SECRET_KEY}, fetchImpl, noSheet }
 * @returns {{ exported: object, mocks: object, restore: () => void }}
 */
function loadGasCode(overrides = {}) {
  const mocks = createGasMocks(overrides);

  const previous = {};
  GAS_GLOBAL_KEYS.forEach((k) => {
    previous[k] = global[k];
    global[k] = mocks[k];
  });

  const modulePath = nodePath.join(__dirname, '..', 'gas', 'Code.gs');
  const resolved   = require.resolve(modulePath);
  delete require.cache[resolved];
  const exported = require(resolved);

  const restore = () => {
    GAS_GLOBAL_KEYS.forEach((k) => { global[k] = previous[k]; });
  };

  return { exported, mocks, restore };
}

module.exports = { createGasMocks, loadGasCode };

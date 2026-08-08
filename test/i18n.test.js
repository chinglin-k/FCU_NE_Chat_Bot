'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// ── 模擬 window / localStorage / document 環境 ──
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  clear() {
    this.store = {};
  }
}

global.window = global;
global.localStorage = new MockLocalStorage();
global.document = {
  documentElement: {
    setAttribute: () => {}
  },
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener: () => {},
  dispatchEvent: () => {}
};

// 使用 vm.runInThisContext 載入前端腳本
const i18nCode = fs.readFileSync(path.join(__dirname, '../js/i18n.js'), 'utf8');
const configCode = fs.readFileSync(path.join(__dirname, '../js/config.js'), 'utf8');

vm.runInThisContext(i18nCode);
vm.runInThisContext(configCode);

test('I18N: 預設語言為 zh，且 localStorage 無資料時 fallback 為 zh', () => {
  global.localStorage.clear();
  I18N.init();
  assert.equal(I18N.getLang(), 'zh');
  assert.equal(I18N.t('teams.button'), '聯絡我們');
});

test('I18N: setLang("en") 後 getLang() 回傳 "en"，且寫入 localStorage', () => {
  I18N.setLang('en');
  assert.equal(I18N.getLang(), 'en');
  assert.equal(global.localStorage.getItem('fcu_ne_lang'), 'en');
  assert.equal(I18N.t('teams.button'), 'Contact Us');
});

test('I18N: setLang(非支援語言) 不改變當前語言', () => {
  I18N.setLang('en');
  I18N.setLang('fr'); // Unsupported
  assert.equal(I18N.getLang(), 'en');
});

test('I18N: toggle() 在 zh/en 之間正確切換', () => {
  I18N.setLang('zh');
  I18N.toggle();
  assert.equal(I18N.getLang(), 'en');
  I18N.toggle();
  assert.equal(I18N.getLang(), 'zh');
});

test('CONFIG: RESPONSES 與 BUTTON_LABELS 具備完整 { zh, en } 鏡像結構', () => {
  assert.ok(CONFIG.RESPONSES.zh, 'RESPONSES.zh exists');
  assert.ok(CONFIG.RESPONSES.en, 'RESPONSES.en exists');
  assert.ok(CONFIG.BUTTON_LABELS.zh, 'BUTTON_LABELS.zh exists');
  assert.ok(CONFIG.BUTTON_LABELS.en, 'BUTTON_LABELS.en exists');
  assert.equal(CONFIG.BUTTON_LABELS.zh.TEACH, '教學');
  assert.equal(CONFIG.BUTTON_LABELS.en.TEACH, 'Tutorials');
});

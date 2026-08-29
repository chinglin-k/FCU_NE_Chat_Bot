'use strict';

/**
 * eslint.config.js — ESLint 9 Flat Config
 * 專案橫跨三種執行環境，各自需要不同的全域變數清單，故分開設定：
 *   - js/         瀏覽器端程式碼（CONFIG、Chat、Intent…為專案自訂全域）
 *   - gas/         Google Apps Script 後端（SpreadsheetApp、CacheService…為 GAS 內建全域）
 *   - test/        Node.js 測試（node:test、CommonJS）
 */

const globals = require('globals');

module.exports = [
  {
    ignores: ['node_modules/**', 'doc/**']
  },

  // ── 瀏覽器端 (js/) ──
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        // 專案內跨檔案共用的自訂全域（各自在對應檔案中用 const 宣告於頂層）
        CONFIG: 'readonly',
        I18N: 'readonly',
        Chat: 'writable',
        Intent: 'readonly',
        ReportForm: 'writable',
        QueryCase: 'writable',
        Counter: 'writable',
        Teams: 'writable',
        WifiModal: 'writable',
        grecaptcha: 'readonly'
      }
    },
    rules: {
      // v1.3.1：新增 caughtErrorsIgnorePattern，讓 catch (_e) / catch (_) 這類
      // 刻意保留但不使用的錯誤變數，也套用與一般參數相同的 `^_` 忽略慣例
      // （no-unused-vars 的 args 與 caughtErrors 是各自獨立的選項）。
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error',
      eqeqeq: ['warn', 'smart'],
      'no-console': 'off'
    }
  },

  // ── Google Apps Script 後端 (gas/) ──
  {
    files: ['gas/**/*.gs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        // GAS 內建服務（Google 官方全域物件）
        SpreadsheetApp: 'readonly',
        PropertiesService: 'readonly',
        CacheService: 'readonly',
        LockService: 'readonly',
        UrlFetchApp: 'readonly',
        Utilities: 'readonly',
        ContentService: 'readonly',
        Logger: 'readonly',
        // Node.js 測試支援（檔案結尾的 module.exports 守衛式判斷）
        module: 'readonly'
      }
    },
    rules: {
      // v1.3.1：同上，補上 caughtErrorsIgnorePattern（例如 gas/Code.gs 中
      // `catch (_) { lock.releaseLock(); }` 這類刻意不使用的錯誤變數）。
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-undef': 'error',
      eqeqeq: ['warn', 'smart']
    }
  },

  // ── Node.js 測試 (test/) ──
  {
    files: ['test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  }
];

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
        Chat: 'writable',
        Intent: 'readonly',
        ReportForm: 'writable',
        Counter: 'writable',
        Teams: 'writable',
        grecaptcha: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
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
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
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

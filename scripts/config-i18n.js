const path = require('path');

// i18n 基礎配置
const config = {
  basePath: path.join(__dirname, '../src/assets/i18n'),
  modules: {
    core: {
      path: 'core',
      languages: ['en', 'zh', 'zh-tw']
    },
    common: {
      path: 'common',
      languages: ['en', 'zh', 'zh-tw']
    }
  }
};

// 取得完整檔案路徑的輔助函數
function getI18nFilePath(module, language) {
  return path.join(
    config.basePath,
    config.modules[module].path,
    `${language}.json`
  );
}

// 檢查模組是否有效的輔助函數
function validateModule(moduleName) {
  if (!config.modules[moduleName]) {
    throw new Error(`無效的模組名稱。可用模組：${Object.keys(config.modules).join(', ')}`);
  }
}

module.exports = {
  config,
  getI18nFilePath,
  validateModule
};
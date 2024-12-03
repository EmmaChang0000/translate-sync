const { translateText } = require('./google-connect');
const { config, getI18nFilePath, validateModule } = require('./config-i18n');
const fs = require('fs');

// 讀取文件內容（原始字串）
function readFileContent(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`文件不存在: ${filePath}`);
        process.exit(1);
    }
    return fs.readFileSync(filePath, 'utf8');
}

// 讀取 JSON 文件
function readJsonFile(filePath, asString = false) {
    const content = readFileContent(filePath);
    return asString ? content : JSON.parse(content);
}

// 寫入 JSON 文件
function writeJsonFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// 同步鍵值
async function syncKeys(moduleName) {
  try {
    validateModule(moduleName);
    const moduleConfig = config.modules[moduleName];
    const baseLanguage = 'en';  // 以英文為基準語系
    
    // 讀取基準語系(英文)檔案
    const baseFilePath = getI18nFilePath(moduleName, baseLanguage);
    const baseJson = readJsonFile(baseFilePath);
    
    // 同步每個目標語系
    for (const targetLang of moduleConfig.languages) {
      if (targetLang === baseLanguage) continue;
      console.log(`\n開始同步 ${moduleName}/${targetLang} ...`);
      
      const targetFilePath = getI18nFilePath(moduleName, targetLang);
      let targetJson = {};
      
      // 如果目標語系檔案存在就讀取
      if (fs.existsSync(targetFilePath)) {
        targetJson = readJsonFile(targetFilePath);
      }
      
      const syncedJson = {};
      let updated = false;
      
      // 同步所有鍵值
      for (const key of Object.keys(baseJson)) {
        if (targetJson.hasOwnProperty(key)) {
          // 如果目標語系已有此鍵值，保留原有翻譯
          syncedJson[key] = targetJson[key];
        } else {
          // 如果目標語系缺少此鍵值，使用 Google 翻譯
          try {
            const translatedText = await translateText(baseJson[key], targetLang);
            syncedJson[key] = translatedText;
            updated = true;
            console.log(`新增鍵值：${key}`);
            console.log(`英文：${baseJson[key]}=>翻譯：${translatedText}`);
          } catch (error) {
            console.error(`翻譯 "${key}" 失敗：${error.message}`);
            syncedJson[key] = baseJson[key];
          }
        }
      }
      
      // 檢查目標語系是否有多餘的鍵值
      const extraKeys = Object.keys(targetJson).filter(
        key => !baseJson.hasOwnProperty(key)
      );
      
      if (extraKeys.length > 0) {
        updated = true;
        console.log('\n發現多餘的鍵值，將移至檔案末尾：', extraKeys);
        
        // 加入分隔標記
        syncedJson['****'] = '****';
        
        // 保留多餘的鍵值在檔案末尾
        for (const key of extraKeys) {
          syncedJson[key] = targetJson[key];
        }
      }

      // 檢查順序是否有變更
      const currentContent = JSON.stringify(targetJson, null, 2);
      const newContent = JSON.stringify(syncedJson, null, 2);
      if (currentContent !== newContent) {
        updated = true;
      }

      // 如果有更新，寫入檔案
      if (updated) {
        writeJsonFile(targetFilePath, syncedJson);
        console.log(`\n${targetLang}.json 已更新完成`);
      } else {
        console.log(`\n${targetLang}.json 已是最新狀態`);
      }
    }
    
  } catch (error) {
    console.error('\n同步過程發生錯誤：', error.message);
    process.exit(1);
  }
}

// 新增鍵值
async function addKeyValue(moduleName, key, value) {
    try {
      // 驗證輸入參數
      if (!key || !value) {
        throw new Error('請提供有效的 key 和 value！');
      }
  
      // 驗證模組是否存在
      validateModule(moduleName);
      const moduleConfig = config.modules[moduleName];
      const baseLanguage = 'en';
  
      // 檢查是否所有語系檔案都不存在這個 key
      for (const lang of moduleConfig.languages) {
        const filePath = getI18nFilePath(moduleName, lang);
        
        // 如果檔案存在，檢查 key 是否已存在
        if (fs.existsSync(filePath)) {
          const json = readJsonFile(filePath);
          if (json.hasOwnProperty(key)) {
            throw new Error(`鍵值 "${key}" 已存在於 ${moduleName}/${lang}.json 中`);
          }
        }
      }
  
      console.log(`\n開始新增鍵值 "${key}" 到 ${moduleName} 模組...`);
  
      // 為每個語系新增翻譯
      for (const lang of moduleConfig.languages) {
        const filePath = getI18nFilePath(moduleName, lang);
        let json = {};
  
        // 如果檔案存在就讀取
        if (fs.existsSync(filePath)) {
          json = readJsonFile(filePath);
        } else {
          console.log(`建立新的語系檔案：${moduleName}/${lang}.json`);
        }
  
        // 英文直接使用原始值
        if (lang === baseLanguage) {
          json[key] = value;
          console.log(`\n${lang}.json:`);
          console.log(`${key} = ${value}`);
        } else {
          // 其他語系使用 Google 翻譯
          try {
            const translatedText = await translateText(value, lang);
            json[key] = translatedText;

            console.log(`\n${lang}.json:`);
            console.log(`${key} = ${translatedText} ｜ 原文：${value}`);
          } catch (error) {
            console.error(`\n翻譯 ${lang} 失敗：${error.message}`);
            console.warn(`暫時使用英文值`);
            json[key] = value;
          }
        }
  
        // 寫入檔案
        try {
          writeJsonFile(filePath, json);
          console.log(`✓ ${moduleName}/${lang}.json 已更新`);
        } catch (error) {
          throw new Error(`寫入 ${moduleName}/${lang}.json 失敗：${error.message}`);
        }
      }
  
      console.log(`\n✓ 已成功新增鍵值 "${key}" 到所有 ${moduleName} 語系檔案`);
  
    } catch (error) {
      console.error('\n新增鍵值失敗：', error.message);
      process.exit(1);
    }
}

// 移除重複鍵值
function removeDuplicateKeysFromModule(moduleName) {
    try {
      validateModule(moduleName);
      const moduleConfig = config.modules[moduleName];
      console.log(`\n開始清理 ${moduleName} 模組的重複鍵值...`);
      // 處理該模組的所有語系檔案
      for (const lang of moduleConfig.languages) {
        const filePath = getI18nFilePath(moduleName, lang);
        
        // 檢查檔案是否存在
        if (!fs.existsSync(filePath)) {
          console.log(`跳過不存在的檔案：${moduleName}/${lang}.json`);
          continue;
        }
  
        const fileContent = readFileContent(filePath);
        const lines = fileContent.split('\n');
        const keyTracker = new Map(); // 記錄每個鍵最後一次出現的位置
        const resultLines = []; // 存放處理後的結果
      
        // 提取鍵名並記錄位置
        lines.forEach((line, index) => {
          const match = line.match(/^\s*"([^"]+)"\s*:/); // 匹配鍵名部分
          if (match) {
            const key = match[1];
            keyTracker.set(key, index);
          }
        });
        // 保留最後一次出現的鍵值
        const keysToKeep = new Set(keyTracker.values());
        lines.forEach((line, index) => {
          if (keysToKeep.has(index) || !line.trim().startsWith('"')) {
            resultLines.push(line);
          }
        });
        // 如果文件內容有改動，則寫回文件
        const newContent = resultLines.join('\n');
        if (newContent !== fileContent) {
          fs.writeFileSync(filePath, newContent, 'utf8');
          console.log(`✓ ${moduleName}/${lang}.json 已清理重複鍵值`);
        } else {
          console.log(`✓ ${moduleName}/${lang}.json 沒有重複鍵值`);
        }
      }
      console.log(`\n✓ ${moduleName} 模組的所有語系檔案已處理完成`);
    } catch (error) {
      console.error('\n清理重複鍵值失敗：', error.message);
      process.exit(1);
    }
}

// 主邏輯
async function main() {
    const [command, ...params] = process.argv.slice(2);
  
    switch (command) {
      case 'sync':
        if (!params[0]) {
          throw new Error('請指定要同步的模組名稱');
        }
        await syncKeys(params[0]);
        break;
  
      case 'add':
        if (params.length < 3) {
          throw new Error('請提供模組名稱、鍵值和內容\n範例: add core WELCOME "Welcome to Angular"');
        }
        const [module, key, value] = params;
        await addKeyValue(module, key, value);
        break;
  
      case 'remove-duplicates':
        if (!params[0]) {
          throw new Error('請指定要清理重複鍵值的模組名稱');
        }
        removeDuplicateKeysFromModule(params[0]);
        break;
  
      default:
        console.log(`
          用法：
          同步鍵值：node scripts/sync-i18n.js sync <module>
          新增鍵值：node scripts/sync-i18n.js add <module> <key> <value>
          清理重複鍵值：node scripts/sync-i18n.js remove-duplicates <module>
  
          可用模組：${Object.keys(config.modules).join(', ')}
  
          範例：
          同步 core 模組：node sync-i18n.js sync core
          新增鍵值到 core：node scripts/sync-i18n.js add core WELCOME 'Welcome to Angular'
          清理 core 重複鍵值：node scripts/sync-i18n.js remove-duplicates core
        `);
        break;
    }
  }
  
  // 使用 try-catch 包裝 main 函數的執行
  (async () => {
    try {
      await main();
    } catch (error) {
      console.error('\n執行錯誤：', error.message);
      process.exit(1);
    }
  })();

const fetch = require('node-fetch');
const apiKey = '*******'; 

// 定義翻譯函式
async function translateText(text, targetLanguage, sourceLanguage = 'en') {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const requestBody = {
        q: text, // 翻譯內容
        source: sourceLanguage, // 原始語言代碼
        target: targetLanguage, // 目標語言代碼
        format: 'text', // 支援 text 或 html
    };

  try {
    // 發送 POST 請求
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    return result.data.translations[0].translatedText;
  } catch (error) {
    console.error(`翻譯失敗：${error.message}`);
  }
}

module.exports = { translateText }; 
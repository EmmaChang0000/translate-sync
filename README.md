# Angular Project

## 專案安裝與啟動

1. 安裝專案依賴：
   ```
   npm install
   ```

2. 啟動專案：
   ```
   npm start
   ```

--------------------------------

## i18n 指令說明

專案的多語系 (i18n) 功能可透過以下指令進行同步、增加以及清除重複鍵值。

### 資料夾結構
- `assets/core`：包含核心區域的語系檔案，僅支援兩種語系。
- `assets/common`：包含通用區域的語系檔案，支援三種語系。

--------------------------------

### 1. **i18n 同步指令**

用於同步指定區域的語系檔案。

#### 指令格式：
```
node scripts/sync-i18n.js sync <區域>
```

#### 範例：
- 同步 `core` 區域：
  ```
  node scripts/sync-i18n.js sync core
  ```
- 同步 `common` 區域：
  ```
  node scripts/sync-i18n.js sync common
  ```

#### 功能：
- 根據 `config-i18n.js` 中的設定檔檢查語系檔案：
  - 如果指定的語系檔不存在，將會新增。
  - 語系鍵值的順序會依據英文檔的順序排列。
  - 若其他語系缺少英文檔的鍵值，會自動補齊。
  - 若其他語系有英文檔沒有的鍵值，將移至最後並以 `***` 標記區分。

--------------------------------

### 2. **i18n 新增指令**

用於新增新的語系鍵值。

#### 指令格式：
```
node scripts/sync-i18n.js add <區域> <key> <value>
```

#### 範例：
- 為 `core` 區域新增鍵值：
  ```
  node scripts/sync-i18n.js add core "WELCOME_MESSAGE" "Welcome to our site"
  ```
- 為 `common` 區域新增鍵值：
  ```
  node scripts/sync-i18n.js add common "WELCOME_MESSAGE" "Welcome to our site"
  ```

#### 功能：
- 在指定區域的語系檔中新增鍵值，初始值以英文為主。
- 根據新增的英文值，自動翻譯其他語系。

--------------------------------

### 3. **i18n 清除重複指令**

用於清除指定區域內的重複鍵值。

#### 指令格式：
```
node scripts/sync-i18n.js remove-duplicates <區域>
```

#### 範例：
- 清除 `core` 區域的重複鍵值：
  ```
  node scripts/sync-i18n.js remove-duplicates core
  ```
- 清除 `common` 區域的重複鍵值：
  ```
  node scripts/sync-i18n.js remove-duplicates common
  ```

#### 功能：
- 根據指定區域的語系檔，清除重複的鍵值以保持檔案整潔。

--------------------------------

## 注意事項

- 確保在操作指令前，已正確配置 `config-i18n.js` 並確認語系檔案的路徑。
- 建議定期同步語系檔案以保持一致性。


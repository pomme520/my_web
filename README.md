# 修電網測試版

## 本機啟動（Windows PowerShell）

1. 安裝相依套件
   ```powershell
   npm install
   ```
2. 建立環境變數檔（需由範例檔複製）
   ```powershell
   Copy-Item .env.example .env
   ```
3. 依序初始化 Prisma 與 SQLite
   ```powershell
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```
4. 啟動開發伺服器
   ```powershell
   npm run dev
   ```

開啟 http://localhost:3000。

## 後台測試帳號

- `admin / 123456`
- `technician / 123456`
- `viewer / 123456`

## 說明

- 專案使用 SQLite，`DATABASE_URL` 預設為 `file:./dev.db`。
- `prisma db seed` 會建立三個後台使用者與預設權限資料。
- 請勿提交 `.env` 與 SQLite 資料庫檔案。

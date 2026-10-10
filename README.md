# 修電網｜台東區營業處電腦報修系統

提供電腦設備線上報修、案件編號進度查詢，以及維修人員後台（案件處理、指派、使用者與權限管理）。

## 功能

- 線上報修：前後端皆驗證必填、電話/信箱格式、欄位長度與選項白名單；防重複送出；每個 IP 於 10 分鐘內最多送出 10 張。
- 案件編號：使用密碼學亂數產生，並於重複時自動重試。
- 進度查詢：公開查詢僅回傳遮罩姓名、部門、問題描述、狀態與時間，不含電話與信箱。
- 後台登入：帳密以 bcrypt 驗證，Session 存於資料庫（8 小時）並使用 httpOnly cookie；連續失敗 5 次會暫時鎖定 15 分鐘；未登入會導向登入頁並於登入後返回。
- 後台：案件列表與狀態篩選、更新狀態（取消需確認）、指派維修人員、匯出 CSV、使用者新增/刪除。
- 權限：admin / technician / viewer 三種角色，權限儲存在資料庫並由 API 逐一檢查；管理員固定保有「管理權限」。

## 安裝與啟動

```bash
npm install
cp .env.example .env   # 或自行建立 .env，內容：DATABASE_URL="file:./dev.db"
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

開啟 http://localhost:3000。

正式環境：`npm run build && npm start`，並使用 `SEED_PASSWORD` 環境變數設定初始帳號密碼：

```bash
SEED_PASSWORD='請改成強密碼' npm run prisma:seed
```

種子帳號為 `admin`、`technician`、`viewer`（`NODE_ENV=production` 時必須設定 `SEED_PASSWORD`；開發環境未設定時密碼為 `123456`）。

## 已知限制

- 資料庫為 SQLite（檔案型），適合小型單機部署；多實例或高流量請改用 PostgreSQL / MySQL 並調整 `prisma/schema.prisma`。
- 限流依 `x-forwarded-for` 判斷來源，請部署於會覆寫該標頭的可信任反向代理之後。
- 送出次數與登入失敗的限流存於程序記憶體，重啟會重置、多實例間不共用。
- 尚未支援圖片/附件上傳與 Email 通知。

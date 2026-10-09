# 修電網

電腦報修系統：線上報修 (`/booking`)、進度查詢 (`/tracking`)、員工後台 (`/staff`，需登入)。
資料以 Prisma + SQLite 持久化，重啟伺服器後資料仍保留。

## 本機開發

```bash
npm install
cp .env.example .env        # 設定 DATABASE_URL
npx prisma migrate deploy   # 套用 migration
npm run prisma:generate
npm run prisma:seed         # 開發環境建立 admin / technician / viewer（密碼 123456，僅限開發）
npm run dev
```

## 正式部署

1. 設定環境變數：`NODE_ENV=production`、`DATABASE_URL`（指向**持久化磁碟**上的 SQLite，例如 `file:/data/prod.db`）、`SEED_ADMIN_PASSWORD`（至少 12 字元）。
2. `npm ci && npm run prisma:generate && npm run build`
3. `npx prisma migrate deploy`（不會清除資料）
4. 首次部署執行 `npm run prisma:seed`：正式環境只建立 `admin` 帳號與預設權限，不會覆蓋既有密碼。登入後請立即在後台建立個人帳號並更換密碼。
5. `npm start`，並置於 HTTPS 反向代理之後（session cookie 在 production 為 `Secure`）。

備份：定期備份 SQLite 資料庫檔案。若需多台執行個體，請改用 PostgreSQL 並更新 `provider` 與 migration。

## 安全性

- 後台頁面與 API 需登入，並於伺服器端檢查角色權限。
- 公開查詢只回傳案件狀態等必要資訊，不含電話與 Email；案件編號為隨機值。
- 報修表單伺服器端驗證格式與長度；已加入基本安全標頭。
- 建議在反向代理（Nginx/Cloudflare 等）對 `/api/login` 與 `/api/repair-orders` 設定速率限制。

## 測試

```bash
npm test
```

## 尚未完成

圖片上傳、應用層速率限制。

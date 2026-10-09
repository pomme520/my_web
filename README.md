# 修電網 台東區營業處電腦報修系統

提供線上報修、案件進度查詢、維修後台與權限管理。

## 功能

- 首頁與服務介紹
- 線上報修（產生案件編號）
- 依案件編號查詢進度
- 登入與維修後台（案件管理、使用者與權限管理）
- Prisma + SQLite 資料儲存

## 本機啟動

```bash
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

開啟 http://localhost:3000。

`db:setup` 會建立 SQLite 資料庫並寫入初始帳號（admin、technician、viewer）。
初始密碼由 `prisma/seed.ts` 設定，部署前請更換預設密碼。

## 建置

```bash
npm run build
npm start
```

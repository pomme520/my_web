# 台東區營業處電腦報修網

電腦設備線上報修與進度查詢系統（Next.js + TypeScript + Prisma/SQLite）。

## 功能

- 首頁與服務介紹
- 線上報修表單，自動產生案件編號
- 依案件編號查詢維修進度
- 後台登入、案件管理、指派維修人員
- 角色權限管理（admin / technician / viewer）與人員管理

## 安裝與啟動

```bash
npm install
cp .env.example .env
npm run db:setup   # 產生 Prisma Client、建立 SQLite 資料庫並寫入初始帳號
npm run dev
```

開啟 http://localhost:3000。

正式環境：

```bash
npm run build
npm start
```

## 初始帳號

`db:setup` 會建立 `admin`、`technician`、`viewer` 三個帳號，密碼由 `.env` 的 `SEED_PASSWORD` 指定（未設定時使用預設密碼）。首次登入後請立即更換，並於上線前設定自訂密碼。

## 環境變數

| 名稱 | 說明 |
| --- | --- |
| `DATABASE_URL` | SQLite 路徑，例如 `file:./dev.db` |
| `SEED_PASSWORD` | 初始帳號密碼（選填） |

# 台東區營業處電腦報修系統

提供電腦設備線上報修、案件進度查詢，以及維修人員後台管理（登入、權限、使用者管理）。

## 功能

- 首頁與服務介紹
- 線上維修報修，產生案件編號
- 依案件編號查詢維修進度
- 後台登入與角色權限（admin / technician / viewer）
- 案件管理：狀態更新、指派維修人員
- 使用者管理：新增、檢視、刪除使用者（不可刪除目前登入帳號，刪除時同步清除其 session）
- Prisma + SQLite 資料儲存

## 啟動

```bash
npm install
cp .env.example .env
npm run db:setup   # 建立資料庫並寫入預設帳號與權限
npm run dev
```

開啟 http://localhost:3000。正式環境請使用 `npm run build && npm start`。

## 初始帳號

`db:setup` 會建立 `admin`、`technician`、`viewer` 三個初始帳號，初始密碼皆為 `123456`。
**正式上線前請立即登入後台建立新帳號並刪除或更換初始帳號。**

## 備註

目前尚不支援圖片上傳。

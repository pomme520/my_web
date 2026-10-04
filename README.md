# 修電網測試版

## 啟動

```bash
npm install
cp .env.example .env   # DATABASE_URL="file:./dev.db"
npm run db:setup       # 建立 SQLite 資料表並寫入範例資料
npm run dev
```

開啟 http://localhost:3000。

## 已完成

- 首頁與服務介紹
- 線上維修預約表單（寫入 SQLite 資料庫）
- 依案件編號查詢維修進度
- 登入／登出與角色權限（admin、technician、viewer）
- 後台案件列表、狀態更新、指派維修人員

## 測試帳號（密碼皆為 123456）

- admin / technician / viewer，登入頁：`/login`，後台：`/staff`
- 範例案件編號：`R-DEMO0001`、`R-DEMO0002`、`R-DEMO0003`

## 尚未完成

圖片上傳與正式部署（正式環境請更換資料庫與預設密碼）。

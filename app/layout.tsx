import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '台電台東區營業處電腦報修網（測試版）',
  description: '台電台東區營業處電腦設備報修與進度查詢測試系統'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        <div className="min-h-screen">
          <div className="bg-slate-800 text-sm text-white">
            <div className="mx-auto flex max-w-7xl justify-between px-6 py-2 lg:px-12">
              <span>台灣電力公司｜台東區營業處</span>
              <span>電腦設備報修服務</span>
            </div>
          </div>

          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-5 lg:px-12">
              <Link href="/" className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-700 text-xl font-black text-white">台電</span>
                <span>
                  <span className="block text-lg font-black tracking-wide text-slate-900">台電台東區營業處</span>
                  <span className="block text-xs text-slate-500">電腦報修網｜測試版</span>
                </span>
              </Link>

              <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-700 md:flex">
                <Link href="/" className="transition hover:text-blue-700">首頁</Link>
                <Link href="/services" className="transition hover:text-blue-700">服務說明</Link>
                <Link href="/booking" className="transition hover:text-blue-700">線上報修</Link>
                <Link href="/tracking" className="transition hover:text-blue-700">進度查詢</Link>
              </nav>

              <Link href="/booking" className="rounded-md bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-800">
                立即報修
              </Link>
            </div>
          </header>

          <div className="border-b border-amber-200 bg-amber-50">
            <div className="mx-auto max-w-7xl px-6 py-2 text-center text-xs text-amber-900 lg:px-12">
              本網站目前為功能測試版，非台灣電力公司正式對外服務系統。
            </div>
          </div>

          <main>{children}</main>

          <footer className="mt-16 bg-slate-800 text-slate-200">
            <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 text-sm md:grid-cols-3 lg:px-12">
              <div>
                <h2 className="font-bold text-white">台電台東區營業處</h2>
                <p className="mt-3 leading-6 text-slate-300">電腦設備報修與進度查詢測試平台</p>
              </div>
              <div>
                <h2 className="font-bold text-white">服務時間</h2>
                <p className="mt-3 leading-6 text-slate-300">週一至週五 08:00–17:00<br />例假日依公告辦理</p>
              </div>
              <div>
                <h2 className="font-bold text-white">聯絡資訊（測試資料）</h2>
                <p className="mt-3 leading-6 text-slate-300">電話：089-000-000<br />電子信箱：it@example.local</p>
              </div>
            </div>
            <div className="border-t border-slate-700 py-4 text-center text-xs text-slate-400">
              © 2026 台電台東區營業處電腦報修網（測試版）
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

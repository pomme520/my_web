import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '台東區營業處電腦報修網（測試版）',
  description: '台灣電力公司台東區營業處電腦設備報修與進度查詢測試系統'
};

const navigation = [
  ['/', '首頁'],
  ['/services', '服務說明'],
  ['/booking', '線上報修'],
  ['/tracking', '進度查詢'],
  ['/staff', '維修後台']
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>
        <div className="min-h-screen bg-slate-100 text-slate-800">
          <div className="bg-slate-800 text-sm text-white"><div className="mx-auto flex max-w-7xl justify-between px-6 py-2 lg:px-12"><span>台灣電力公司｜台東區營業處</span><span>電腦設備報修系統</span></div></div>
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-12">
              <Link href="/" className="flex items-center gap-3 md:gap-4" aria-label="台灣電力公司台東區營業處首頁">
                <img src="/tpclogo.svg" alt="台灣電力公司 Taiwan Power Company" className="h-[70px] w-auto shrink-0 object-contain md:h-[86px]" />
                <div className="flex flex-col justify-center leading-none text-[#111111]">
                  <span className="brand-chinese text-[clamp(1.8rem,2vw,2.9rem)] font-black tracking-[-0.08em]">
                    台東區營業處
                  </span>
                </div>
              </Link>
              <Link href="/booking" className="rounded-md bg-blue-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-800">線上報修</Link>
            </div>
          </header>
          <div className="border-b border-amber-200 bg-amber-50"><div className="mx-auto max-w-7xl px-6 py-2 text-center text-xs text-amber-900 lg:px-12">本網站目前為功能測試版，非台灣電力公司正式網站，資料僅供測試使用。</div></div>
          <div className="mx-auto flex max-w-7xl items-start gap-8 px-6 py-8 lg:px-12"><aside className="sticky top-6 hidden w-56 shrink-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:block"><h2 className="mb-3 border-b border-slate-100 pb-3 font-bold text-slate-900">功能選單</h2><nav aria-label="主要導覽" className="space-y-1">{navigation.map(([href, label]) => <Link key={href} href={href} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700">{label}</Link>)}</nav></aside><main className="min-w-0 flex-1">{children}</main></div>
          <footer className="mt-8 bg-slate-800 text-slate-200"><div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 text-sm md:grid-cols-3 lg:px-12"><div><h2 className="font-bold text-white">台灣電力公司</h2><p className="mt-3 text-slate-300">台東區營業處電腦設備報修與進度查詢測試系統</p></div><div><h2 className="font-bold text-white">服務時間</h2><p className="mt-3 text-slate-300">週一至週五 08:00–17:00<br />國定假日除外</p></div><div><h2 className="font-bold text-white">聯絡資訊</h2><p className="mt-3 text-slate-300">客服專線：089-000-000<br />Email：it@example.local</p></div></div><div className="border-t border-slate-700 py-4 text-center text-xs text-slate-400">© 2026 台灣電力公司｜台東區營業處</div></footer>
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata={title:'修電網｜電腦維修測試版',description:'線上電腦維修預約測試版'};

export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="zh-Hant"><body><header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><Link href="/" className="text-xl font-black text-brand">修電網</Link><nav className="flex gap-4 text-sm"><Link href="/services">服務</Link><Link href="/booking">預約</Link><Link href="/tracking">查詢進度</Link></nav></div></header><main>{children}</main><footer className="mt-16 border-t bg-white py-8 text-center text-sm text-slate-500">© 2026 修電網｜測試版本</footer></body></html>;
}

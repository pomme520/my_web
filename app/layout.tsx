import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '台電台東區營業處電腦報修網（測試版）',
  description: '台電台東區營業處電腦設備報修與進度查詢測試系統'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}

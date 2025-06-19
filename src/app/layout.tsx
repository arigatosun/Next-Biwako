// layout.tsx
import type { Metadata, Viewport } from "next";
import { Zen_Kaku_Gothic_New } from 'next/font/google';
import "./globals.css";
import { ReservationProvider } from './contexts/ReservationContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';

const zenKakuGothic = Zen_Kaku_Gothic_New({
  preload: true,
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-zen-kaku',
  display: 'swap',
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "NEST BIWAKO - 予約システム",
  description: "NEST BIWAKOの予約システムです。快適な滞在をお約束します。",
  icons: {
    icon: [
      { url: '/images/favicon.ico' },  // ICOファイルを最初に指定
      { url: '/images/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    shortcut: ['/images/favicon.ico']  // ショートカットアイコンとしても設定
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${zenKakuGothic.variable} font-zen-kaku min-h-screen bg-[#f2f2ed]`}> {/* 背景色を変更 */}
        <AuthProvider>
          <AdminAuthProvider>
            <ReservationProvider>
              <Header />
              <div className="min-h-screen flex flex-col overflow-x-hidden">
                <main className="flex-grow container mx-auto px-3 py-4 sm:px-4 sm:py-8 max-w-7xl">
                  {children}
                </main>
              </div>
              <Footer />
            </ReservationProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

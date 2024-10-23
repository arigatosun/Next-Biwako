import type { Metadata } from "next";
import { Zen_Kaku_Gothic_New } from 'next/font/google';
import "./globals.css";
import { ReservationProvider } from './contexts/ReservationContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';

const zenKakuGothic = Zen_Kaku_Gothic_New({
  preload: true,
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-zen-kaku',
  display: 'swap',
  adjustFontFallback: false,  // この設定を追加
});

export const metadata: Metadata = {
  title: "NEST BIWAKO - 予約システム",
  description: "NEST BIWAKOの予約システムです。快適な滞在をお約束します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${zenKakuGothic.variable} font-zen-kaku`}>
        <AuthProvider>
          <AdminAuthProvider>
            <ReservationProvider>
              {children}
            </ReservationProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
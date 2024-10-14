import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ReservationProvider } from './contexts/ReservationContext';

const shinGo = localFont({
  src: [
    {
      path: '../../public/fonts/A-OTF-UDShinGoCOnizPr6N-Reg.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/A-OTF-UDShinGoCOnizPr6N-Lig.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/A-OTF-UDShinGoCOnizPr6N-Med.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/A-OTF-UDShinGoCOnizPr6N-DeB.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-shin-go',
  display: 'swap',
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
      <body className={`${shinGo.variable} font-shin-go`}>
        <ReservationProvider>
          {children}
        </ReservationProvider>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Crimson_Pro, Noto_Serif_SC, DM_Sans } from "next/font/google";
import "./globals.css";

const crimsonPro = Crimson_Pro({
  variable: "--font-crimson",
  subsets: ["latin"],
  display: "swap",
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Onepod — 每日一期，看比听快",
  description: "每日精选一期播客，用阅读的速度获取播客精华",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${crimsonPro.variable} ${notoSerifSC.variable} ${dmSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

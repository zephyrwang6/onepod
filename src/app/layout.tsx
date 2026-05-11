import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Onepod — 每日精选海外科技播客",
  description: "每日精选海外科技播客",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}

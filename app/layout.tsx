"use client";

import Header from "@/components/layout/Header";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Low Cost Drone Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen text-white bg-[#111625]">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}

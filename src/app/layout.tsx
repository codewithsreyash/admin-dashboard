import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";
import Starfield from "@/components/effects/Starfield";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "SafeGuard.io | Tourist Safety MVP",
  description: "Tourist Safety and Anomaly Detection System MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("dark", inter.variable)}>
      <body className={`${inter.className} antialiased flex h-screen overflow-hidden relative`}>
        <Starfield />
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background/40 backdrop-blur-[2px]">
          {children}
        </main>
      </body>
    </html>
  );
}

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
        {/* Background Effects */}
        <Starfield />
        <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none z-0" />
        <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none z-0" />
        <div className="fixed bottom-0 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px] pointer-events-none z-0" />
        
        {/* App Shell */}
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-background/60 backdrop-blur-sm relative z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none z-0" />
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GOVMIND — Sentimen Warga",
  description: "City Intelligence Command Center — Monitoring sentimen publik real-time untuk pemerintah kota.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster position="top-right" toastOptions={{ className: 'dark:bg-card-bg dark:text-foreground dark:border dark:border-card-border' }} />
      </body>
    </html>
  );
}

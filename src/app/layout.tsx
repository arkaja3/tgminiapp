import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from '@/lib/user-context';
import TelegramInitializer from "@/components/telegram/TelegramInitializer";

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Claude AI - Telegram Mini App',
  description: 'Общайтесь с Claude AI прямо в Telegram',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="MobileOptimized" content="176" />
        <meta name="HandheldFriendly" content="True" />
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className={inter.className}>
        <UserProvider>
          <TelegramInitializer />
          {children}
          <Toaster position="top-center" />
        </UserProvider>
      </body>
    </html>
  );
}

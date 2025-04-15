'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useTelegramApi } from '@/hooks/use-telegram-api';
import TelegramInitializer from '@/components/telegram/TelegramInitializer';

export default function Home() {
  const router = useRouter();
  const { loading, user, loginUser } = useTelegramApi();
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    // Проверяем наличие Telegram WebApp
    if (typeof window !== 'undefined') {
      const checkTelegramWebApp = async () => {
        if (window.Telegram?.WebApp) {
          setAuthLoading(true);
          await loginUser();
          setAuthLoading(false);
        }
      };

      // Пытаемся получить данные сразу и через небольшую задержку
      checkTelegramWebApp();
      const timeoutId = setTimeout(checkTelegramWebApp, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [loginUser]);

  const handleAuth = async () => {
    setAuthLoading(true);

    try {
      const userData = await loginUser();

      if (userData) {
        // Перенаправляем на страницу чатов
        router.push('/chats');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Если пользователь уже авторизован, перенаправляем на страницу чатов
  useEffect(() => {
    if (user) {
      router.push('/chats');
    }
  }, [user, router]);

  const isLoading = loading || authLoading;

  return (
    <>
      <TelegramInitializer />
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-32 h-32 relative mb-4">
              {isLoading ? (
                <Skeleton className="w-32 h-32 rounded-full" />
              ) : user?.photo_url ? (
                <Image
                  src={user.photo_url}
                  alt="Аватар пользователя"
                  className="rounded-full"
                  fill
                  sizes="128px"
                  priority
                />
              ) : (
                <div className="w-32 h-32 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <span className="text-4xl font-bold text-purple-600 dark:text-purple-300">
                    {user?.first_name?.charAt(0) || 'C'}
                  </span>
                </div>
              )}
            </div>

            {isLoading ? (
              <Skeleton className="h-8 w-48 mb-2" />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.first_name || 'Добро пожаловать'}
              </h1>
            )}

            {isLoading ? (
              <Skeleton className="h-6 w-64 mb-6" />
            ) : (
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {user?.username
                  ? `@${user.username}`
                  : 'Войдите для начала общения с Claude 3.7'}
              </p>
            )}

            <Button
              onClick={handleAuth}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? 'Загрузка...' : 'Авторизоваться'}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Claude 3.7 Sonnet — Telegram Mini App</p>
            <p className="mt-1">
              Общайтесь с самым интеллектуальным ИИ прямо в Telegram
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

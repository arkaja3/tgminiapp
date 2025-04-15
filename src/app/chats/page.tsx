'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusIcon, MessageCircleIcon, ChevronRightIcon, SettingsIcon } from 'lucide-react';
import Link from 'next/link';
import { useTelegramApi } from '@/hooks/use-telegram-api';
import TelegramInitializer from '@/components/telegram/TelegramInitializer';
import { Chat } from '@/lib/types';

export default function ChatsPage() {
  const router = useRouter();
  const { user, chats, loading, getChats, createChat, loginUser } = useTelegramApi();
  const [isInitialized, setIsInitialized] = useState(false);

  // Авторизуем пользователя и получаем список чатов при монтировании компонента
  useEffect(() => {
    const init = async () => {
      // Если пользователь не авторизован, пытаемся авторизовать
      if (!user) {
        const userData = await loginUser();
        if (!userData) {
          // Если авторизация не удалась, перенаправляем на главную страницу
          router.push('/');
          return;
        }
      }

      // Получаем список чатов
      await getChats();
      setIsInitialized(true);
    };

    init();
  }, [user, getChats, loginUser, router]);

  const handleNewChat = async () => {
    // Создаем новый чат
    const chat = await createChat('Новый чат');
    if (chat) {
      // Перенаправляем на страницу чата
      router.push(`/chat/${chat.id}`);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Вчера';
    } else if (diffDays < 7) {
      const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
      return days[date.getDay()];
    } else {
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    }
  };

  // Функция для получения последнего сообщения чата (заглушка, в реальности будет запрос к API)
  const getLastMessage = (chat: Chat) => {
    return 'Последнее сообщение...';
  };

  return (
    <>
      <TelegramInitializer />
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Чаты</h1>
            <div className="flex space-x-2">
              <Link href="/settings">
                <Button variant="ghost" size="icon" className="text-gray-600 dark:text-gray-300">
                  <SettingsIcon className="h-5 w-5" />
                </Button>
              </Link>
              <Button
                onClick={handleNewChat}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Новый чат
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-6">
          {loading || !isInitialized ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4"></div>
                  </CardHeader>
                  <CardFooter>
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-1/4"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : chats.length > 0 ? (
            <div className="space-y-4">
              {chats.map((chat) => (
                <Link key={chat.id} href={`/chat/${chat.id}`}>
                  <Card className="hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between items-center">
                        <span>{chat.title}</span>
                        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                      </CardTitle>
                      <CardDescription className="line-clamp-1">{getLastMessage(chat)}</CardDescription>
                    </CardHeader>
                    <CardFooter className="text-xs text-gray-500 pt-0">
                      {formatDate(chat.updated_at)}
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <MessageCircleIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">У вас пока нет чатов</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xs">
                Создайте новый чат и начните общение с Claude 3.7 Sonnet
              </p>
              <Button
                onClick={handleNewChat}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Создать чат
              </Button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

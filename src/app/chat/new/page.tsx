'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeftIcon, MessagesSquareIcon } from 'lucide-react';
import { useTelegramApi } from '@/hooks/use-telegram-api';
import TelegramInitializer from '@/components/telegram/TelegramInitializer';

export default function NewChatPage() {
  const router = useRouter();
  const { user, createChat, loginUser } = useTelegramApi();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  // Авторизуем пользователя при монтировании компонента
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
    };

    init();
  }, [user, loginUser, router]);

  const handleGoBack = () => {
    router.push('/chats');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const chatTitle = title.trim() || 'Новый чат';
      const chat = await createChat(chatTitle);

      if (chat) {
        router.push(`/chat/${chat.id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TelegramInitializer />
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center">
            <Button variant="ghost" size="icon" onClick={handleGoBack} className="mr-2">
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Новый чат
            </h1>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="max-w-lg mx-auto">
            <form onSubmit={handleSubmit}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessagesSquareIcon className="h-5 w-5 mr-2 text-violet-600" />
                    Создание нового чата
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Название чата
                      </label>
                      <Input
                        id="title"
                        placeholder="Например: Помощь с программированием"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Если не указано, будет использовано название "Новый чат"
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={handleGoBack}>
                    Отмена
                  </Button>
                  <Button
                    type="submit"
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                    disabled={loading}
                  >
                    {loading ? 'Создание...' : 'Создать чат'}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}

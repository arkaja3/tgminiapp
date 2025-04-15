'use client';

import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, SendIcon, ImageIcon, FileTextIcon, PaperclipIcon, MoreVerticalIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ReactMarkdown from 'react-markdown';
import { useTelegramApi } from '@/hooks/use-telegram-api';
import TelegramInitializer from '@/components/telegram/TelegramInitializer';
import { Message } from '@/lib/types';

export default function ChatPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user, currentChat, messages, loading, getMessages, sendMessage, deleteChat, loginUser } = useTelegramApi();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Авторизуем пользователя и получаем сообщения чата при монтировании компонента
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

      // Получаем сообщения чата
      await getMessages(Number(params.id));
      setIsInitialized(true);
    };

    init();
  }, [user, getMessages, loginUser, router, params.id]);

  useEffect(() => {
    // Прокрутка вниз при добавлении новых сообщений
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleGoBack = () => {
    router.push('/chats');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!message.trim() && attachments.length === 0) return;

    try {
      setSending(true);

      // Отправляем сообщение через API
      await sendMessage(Number(params.id), message, attachments);

      // Очищаем поле ввода и список вложений
      setMessage('');
      setAttachments([]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = async () => {
    if (confirm('Вы уверены, что хотите удалить этот чат?')) {
      const success = await deleteChat(Number(params.id));
      if (success) {
        router.push('/chats');
      }
    }
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...files]);

      // Очищаем input для возможности повторного выбора того же файла
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <TelegramInitializer />
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={handleGoBack}>
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white ml-2">
                {loading || !isInitialized ? <Skeleton className="h-6 w-32" /> : currentChat?.title}
              </h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVerticalIcon className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/chat/${params.id}/settings`)}>
                  Настройки чата
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/chat/${params.id}/export`)}>
                  Экспорт чата
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 dark:text-red-400"
                  onClick={handleDeleteChat}
                >
                  Удалить чат
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 py-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">
            {loading || !isInitialized ? (
              // Скелетон загрузки
              [...Array(3)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`flex ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} max-w-[80%]`}>
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className={`mx-2 space-y-2 ${i % 2 === 0 ? 'items-start' : 'items-end'}`}>
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-24 w-64 rounded-lg" />
                    </div>
                  </div>
                </div>
              ))
            ) : messages.length > 0 ? (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.is_user ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex ${msg.is_user ? 'flex-row-reverse' : 'flex-row'} max-w-[80%]`}>
                    <div className="shrink-0">
                      {msg.is_user ? (
                        <div className="h-10 w-10 bg-violet-100 dark:bg-violet-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-violet-600 dark:text-violet-300">
                            Вы
                          </span>
                        </div>
                      ) : (
                        <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-purple-600 dark:text-purple-300">
                            C
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={`mx-2 space-y-1 ${msg.is_user ? 'items-end' : 'items-start'}`}>
                      <div className={`text-xs text-gray-500 ${msg.is_user ? 'text-right' : 'text-left'}`}>
                        {msg.is_user ? 'Вы' : 'Claude 3.7'} • {formatTimestamp(msg.created_at)}
                      </div>
                      <div className={`p-3 rounded-lg ${
                        msg.is_user
                          ? 'bg-violet-100 dark:bg-violet-900/50 text-gray-900 dark:text-white'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>
                            {msg.content}
                          </ReactMarkdown>
                        </div>

                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center p-2 bg-gray-100 dark:bg-gray-700 rounded">
                                {attachment.type.startsWith('image/') ? (
                                  <ImageIcon className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-300" />
                                ) : (
                                  <FileTextIcon className="h-4 w-4 mr-2 text-gray-600 dark:text-gray-300" />
                                )}
                                <span className="text-sm truncate">{attachment.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                <div className="h-16 w-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl font-semibold text-purple-600 dark:text-purple-300">C</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Начните общение с Claude 3.7
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-xs">
                  Напишите ваш вопрос или запрос в поле ниже и получите быстрый и точный ответ
                </p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </main>

        <footer className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-gray-100 dark:bg-gray-700 rounded px-2 py-1"
                  >
                    <span className="text-xs truncate max-w-[150px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleAttachment}
              >
                <PaperclipIcon className="h-5 w-5" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Сообщение Claude..."
                className="min-h-10 resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                className="h-8 w-8 bg-violet-600 hover:bg-violet-700 text-white shrink-0"
                disabled={sending || (!message.trim() && attachments.length === 0)}
              >
                <SendIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 text-xs text-center text-gray-500">
              Claude 3.7 может допускать ошибки. Проверяйте важную информацию.
            </div>
          </form>
        </footer>
      </div>
    </>
  );
}

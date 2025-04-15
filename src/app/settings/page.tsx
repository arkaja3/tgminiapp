'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeftIcon, CreditCardIcon, UserIcon, BrainIcon, PaletteIcon, BellIcon } from 'lucide-react';
import { toast } from 'sonner';

interface UserSettings {
  themeDark: boolean;
  notifications: boolean;
  defaultSystemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    themeDark: false,
    notifications: true,
    defaultSystemPrompt: 'Ты — Claude, полезный, безопасный и честный ИИ-ассистент, созданный Anthropic. Всегда вежливо отвечай на запросы на том же языке, на котором задан вопрос.',
    temperature: 0.7,
    maxTokens: 1000
  });

  useEffect(() => {
    // Здесь в реальном приложении был бы запрос к API для получения настроек пользователя

    // Имитация загрузки настроек
    setTimeout(() => {
      // Устанавливаем тему по умолчанию в соответствии с текущими настройками Telegram
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        setSettings(prev => ({
          ...prev,
          themeDark: window.Telegram.WebApp.colorScheme === 'dark'
        }));
      }

      setLoading(false);
    }, 1000);
  }, []);

  const handleGoBack = () => {
    router.push('/chats');
  };

  const handleToggleTheme = (checked: boolean) => {
    setSettings(prev => ({ ...prev, themeDark: checked }));

    // В реальном приложении здесь был бы запрос к API для сохранения настроек

    // Имитация применения темы
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', checked);
    }
  };

  const handleToggleNotifications = (checked: boolean) => {
    setSettings(prev => ({ ...prev, notifications: checked }));
    // В реальном приложении здесь был бы запрос к API для сохранения настроек
  };

  const handleSystemPromptChange = (value: string) => {
    setSettings(prev => ({ ...prev, defaultSystemPrompt: value }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      // В реальном приложении здесь был бы запрос к API для сохранения настроек
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Настройки успешно сохранены');
      setSaving(false);
    } catch (error) {
      toast.error('Ошибка при сохранении настроек');
      console.error(error);
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={handleGoBack}>
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white ml-2">
              Настройки
            </h1>
          </div>
          <Button
            variant="default"
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={handleSaveSettings}
            disabled={saving || loading}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        {loading ? (
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse" />
            <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse mt-8" />
            <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        ) : (
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="mb-6 grid grid-cols-4 h-auto">
              <TabsTrigger value="general" className="py-2">
                <UserIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Общие</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="py-2">
                <PaletteIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Вид</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="py-2">
                <BrainIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="py-2">
                <CreditCardIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Подписка</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Уведомления</CardTitle>
                  <CardDescription>Настройки уведомлений для чат-бота</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications" className="flex items-center">
                      <BellIcon className="h-4 w-4 mr-2" />
                      Включить уведомления
                    </Label>
                    <Switch
                      id="notifications"
                      checked={settings.notifications}
                      onCheckedChange={handleToggleNotifications}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Данные пользователя</CardTitle>
                  <CardDescription>Управление вашими данными</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full">
                    Экспорт истории чатов
                  </Button>
                  <Button variant="outline" className="w-full text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20">
                    Удалить все данные
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Тема</CardTitle>
                  <CardDescription>Настройте внешний вид приложения</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="theme-toggle" className="flex items-center">
                      <PaletteIcon className="h-4 w-4 mr-2" />
                      Темная тема
                    </Label>
                    <Switch
                      id="theme-toggle"
                      checked={settings.themeDark}
                      onCheckedChange={handleToggleTheme}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Настройки AI</CardTitle>
                  <CardDescription>Настройте поведение Claude 3.7 Sonnet</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="system-prompt">Системный промпт по умолчанию</Label>
                    <Textarea
                      id="system-prompt"
                      value={settings.defaultSystemPrompt}
                      onChange={(e) => handleSystemPromptChange(e.target.value)}
                      className="min-h-[120px]"
                    />
                    <p className="text-xs text-gray-500">
                      Системный промпт определяет базовое поведение AI. Будет применяться ко всем новым чатам.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="temperature">Температура: {settings.temperature}</Label>
                    <div className="flex items-center">
                      <span className="text-xs mr-2">0.1</span>
                      <input
                        id="temperature"
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={settings.temperature}
                        onChange={(e) => setSettings(prev => ({ ...prev, temperature: Number.parseFloat(e.target.value) }))}
                        className="flex-1"
                      />
                      <span className="text-xs ml-2">1.0</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Определяет креативность ответов. Более низкие значения дают более детерминированные ответы, более высокие — более креативные.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscription" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Моя подписка</CardTitle>
                  <CardDescription>Управление подпиской</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border border-violet-200 dark:border-violet-900 rounded-lg p-4 bg-violet-50 dark:bg-violet-900/20">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-violet-800 dark:text-violet-300">Бесплатный план</h3>
                      <span className="text-xs bg-violet-200 dark:bg-violet-800 text-violet-800 dark:text-violet-300 px-2 py-1 rounded-full">Активна</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Ограниченное количество сообщений в день.
                    </p>
                    <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white">
                      Обновить до Премиум
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Доступные планы</h3>

                    <div className="space-y-2">
                      {[
                        { name: 'Месячная подписка', price: '499 ₽/мес', features: ['Неограниченные сообщения', 'Приоритетная поддержка'] },
                        { name: 'Квартальная подписка', price: '1299 ₽/3 мес', features: ['Экономия 13%', 'Все функции месячной подписки'] },
                        { name: 'Годовая подписка', price: '4999 ₽/год', features: ['Экономия 16%', 'Эксклюзивные возможности'] },
                      ].map((plan, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-violet-300 dark:hover:border-violet-700 transition-colors">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{plan.name}</h4>
                            <span className="font-semibold">{plan.price}</span>
                          </div>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-3">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-center">
                                <span className="mr-1">•</span> {feature}
                              </li>
                            ))}
                          </ul>
                          <Button variant="outline" className="w-full mt-2">Выбрать</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

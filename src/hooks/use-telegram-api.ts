import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  User,
  Chat,
  Message,
  UserSettings,
  AISettings,
  Subscription,
  SubscriptionPlan
} from '@/lib/types';

interface ApiHookResult {
  loading: boolean;
  user: User | null;
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  userSettings: UserSettings | null;
  aiSettings: AISettings | null;
  subscription: Subscription | null;
  availablePlans: SubscriptionPlan[];
  error: string | null;
  loginUser: () => Promise<User | null>;
  getChats: () => Promise<Chat[]>;
  createChat: (title?: string) => Promise<Chat | null>;
  updateChatTitle: (chatId: number, title: string) => Promise<boolean>;
  deleteChat: (chatId: number) => Promise<boolean>;
  getMessages: (chatId: number) => Promise<Message[]>;
  sendMessage: (chatId: number, content: string, files?: File[]) => Promise<Message[] | null>;
  getSettings: () => Promise<{ userSettings: UserSettings; aiSettings: AISettings } | null>;
  updateSettings: (userSettings?: UserSettings, aiSettings?: Partial<AISettings>) => Promise<boolean>;
  getSubscription: () => Promise<{ subscription: Subscription | null; plans: SubscriptionPlan[] }>;
  createPayment: (planId: number) => Promise<{ paymentUrl: string; paymentId: string; transactionId: number } | null>;
}

export function useTelegramApi(): ApiHookResult {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Получаем initData при монтировании компонента
  const [initData, setInitData] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const getInitData = () => {
        if (window.Telegram?.WebApp) {
          setInitData(window.Telegram.WebApp.initData);
        }
      };

      // Пытаемся получить данные сразу и через небольшую задержку
      getInitData();
      const timeoutId = setTimeout(getInitData, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, []);

  // Авторизация пользователя
  const loginUser = useCallback(async (): Promise<User | null> => {
    if (!initData) {
      setError('Отсутствуют данные инициализации Telegram');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/auth', { initData });
      const userData = response.data.user;
      setUser(userData);

      return userData;
    } catch (error) {
      console.error('Auth error:', error);
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || 'Ошибка авторизации');
        toast.error(error.response.data.error || 'Ошибка авторизации');
      } else {
        setError('Ошибка авторизации');
        toast.error('Ошибка авторизации');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [initData]);

  // Получение списка чатов
  const getChats = useCallback(async (): Promise<Chat[]> => {
    if (!initData) {
      setError('Отсутствуют данные инициализации Telegram');
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/chat?initData=${encodeURIComponent(initData)}`);
      const chatsData = response.data.chats;
      setChats(chatsData);

      return chatsData;
    } catch (error) {
      console.error('Error getting chats:', error);
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || 'Ошибка получения чатов');
        toast.error(error.response.data.error || 'Ошибка получения чатов');
      } else {
        setError('Ошибка получения чатов');
        toast.error('Ошибка получения чатов');
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [initData]);

  // Создание нового чата
  const createChat = useCallback(async (title?: string): Promise<Chat | null> => {
    if (!initData) {
      setError('Отсутствуют данные инициализации Telegram');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/chat', { initData, title });
      const chatData = response.data.chat;

      // Обновляем список чатов
      setChats(prev => [chatData, ...prev]);
      setCurrentChat(chatData);

      return chatData;
    } catch (error) {
      console.error('Error creating chat:', error);
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || 'Ошибка создания чата');
        toast.error(error.response.data.error || 'Ошибка создания чата');
      } else {
        setError('Ошибка создания чата');
        toast.error('Ошибка создания чата');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [initData]);

  // Обновление названия чата
  const updateChatTitle = useCallback(async (chatId: number, title: string): Promise<boolean> => {
    if (!initData) {
      setError('Отсутствуют данные инициализации Telegram');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.put('/api/chat', { initData, chatId, title });
      const success = response.data.success;

      if (success) {
        // Обновляем список чатов
        setChats(prev => prev.map(chat =>
          chat.id === chatId ? { ...chat, title } : chat
        ));

        // Обновляем текущий чат, если он редактируется
        if (currentChat && currentChat.id === chatId) {
          setCurrentChat(prev => prev ? { ...prev, title } : null);
        }
      }

      return success;
    } catch (error) {
      console.error('Error updating chat title:', error);
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || 'Ошибка обновления названия чата');
        toast.error(error.response.data.error || 'Ошибка обновления названия чата');
      } else {
        setError('Ошибка обновления названия чата');
        toast.error('Ошибка обновления названия чата');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [initData, currentChat]);

  // Удаление чата
  const deleteChat = useCallback(async (chatId: number): Promise<boolean> => {
    if (!initData) {
      setError('Отсутствуют данные инициализации Telegram');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.delete(`/api/chat?initData=${encodeURIComponent(initData)}&chatId=${chatId}`);
      const success = response.data.success;

      if (success) {
        // Обновляем список чатов
        setChats(prev => prev.filter(chat => chat.id !== chatId));

        // Сбрасываем текущий чат, если он удаляется
        if (currentChat && currentChat.id === chatId) {
          setCurrentChat(null);
        }
      }

      return success;
    } catch (error) {
      console.error('Error deleting chat:', error);
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || 'Ошибка удаления чата');
        toast.error(error.response.data.error || 'Ошибка удаления чата');
      } else {
        setError('Ошибка удаления чата');
        toast.error('Ошибка удаления чата');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [initData, currentChat]);

  // Получение сообщений чата
  const getMessages = useCallback(async (chatId: number): Promise<Message[]> => {
    if (!initData) {
      setError('Отсутствуют данные инициализации Telegram');
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/chat/${chatId}/messages?initData=${encodeURIComponent(initData)}`);
      const messagesData = response.data.messages;

      // Обновляем текущие сообщения
      setMessages(messagesData);

      // Обновляем текущий чат
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setCurrentChat(chat);
      }

      return messagesData;
    } catch (error) {
      console.error('Error getting messages:', error);
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || 'Ошибка получения сообщений');
        toast.error(error.response.data.error || 'Ошибка получения сообщений');
      } else {
        setError('Ошибка получения сообщений');
        toast.error('Ошибка получения сообщений');
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [initData, chats]);

  // Отправка сообщения
  const sendMessage = useCallback(async (chatId: number, content: string, files?: File[]): Promise<Message[] | null> => {
    if (!initData) {
      setError('Отсутствуют данные инициализации Telegram');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('initData', initData);
      formData.append('content', content);

      if (files && files.length > 0) {
        files.forEach(file => {
          formData.append('files', file);
        });
      }

      const response = await axios.post(`/api/chat/${chatId}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const messagesData = response.data.messages;

      // Обновляем сообщения
      setMessages(messagesData);

      // Обновляем чаты (порядок и возможное изменение заголовка)
      getChats();

      return messagesData;
    } catch (error) {
      console.error('Error sending message:', error);
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || 'Ошибка отправки сообщения');
        toast.error(error.response.data.error || 'Ошибка отправки сообщения');
      } else {
        setError('Ошибка отправки сообщения');
        toast.error('Ошибка отправки сообщения');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [initData, getChats]);

  // Получение настроек пользователя
  const getSettings = useCallback(async (): Promise<{ userSettings: UserSettings; aiSettings: AISettings } | null> => {
    if (!initData) {
      setError('Отсутствуют данные инициализации Telegram');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/settings?initData=${encodeURIComponent(initData)}`);
      const { userSettings: settings, aiSettings: aiConfig } = response.data;

      // Обновляем настройки
      setUserSettings(settings);
      setAiSettings(aiConfig);

      return { userSettings: settings, aiSettings: aiConfig };
    } catch (error) {
      console.error('Error getting settings:', error);
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || 'Ошибка получения настроек');
        toast.error(error.response.data.error || 'Ошибка получения настроек');
      } else {
        setError('Ошибка получения настроек');
        toast.error('Ошибка получения настроек');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [initData]);

  // Обновление настроек пользователя
  const updateSettings = useCallback(async (
    userSettings?: UserSettings,
    aiSettings?: Partial<AISettings>
  ): Promise<boolean> => {
    if (!initData) {
      setError('Отсутствуют данные инициализации Telegram');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.put('/api/settings', {
        initData,
        userSettings,
        aiSettings
      });

      const success = response.data.success;

      if (success) {
        // Обновляем локальные настройки, если они предоставлены
        if (userSettings) {
          setUserSettings(prev => ({ ...prev, ...userSettings }));
        }

        if (aiSettings) {
          setAiSettings(prev => prev ? { ...prev, ...aiSettings } : null);
        }

        toast.success('Настройки успешно сохранены');
      }

      return success;
    } catch (error) {
      console.error('Error updating settings:', error);
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || 'Ошибка обновления настроек');
        toast.error(error.response.data.error || 'Ошибка обновления настроек');
      } else {
        setError('Ошибка обновления настроек');
        toast.error('Ошибка обновления настроек');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [initData]);

  // Получение информации о подписке
  const getSubscription = useCallback(async (): Promise<{ subscription: Subscription | null; plans: SubscriptionPlan[] }> => {
    if (!initData) {
      setError('Отсутствуют данные инициализации Telegram');
      return { subscription: null, plans: [] };
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/subscription?initData=${encodeURIComponent(initData)}`);
      const { subscription: sub, plans } = response.data;

      // Обновляем данные о подписке
      setSubscription(sub);
      setAvailablePlans(plans);

      return { subscription: sub, plans };
    } catch (error) {
      console.error('Error getting subscription:', error);
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || 'Ошибка получения информации о подписке');
        toast.error(error.response.data.error || 'Ошибка получения информации о подписке');
      } else {
        setError('Ошибка получения информации о подписке');
        toast.error('Ошибка получения информации о подписке');
      }
      return { subscription: null, plans: [] };
    } finally {
      setLoading(false);
    }
  }, [initData]);

  // Создание платежа для подписки
  const createPayment = useCallback(async (planId: number): Promise<{ paymentUrl: string; paymentId: string; transactionId: number } | null> => {
    if (!initData) {
      setError('Отсутствуют данные инициализации Telegram');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post('/api/subscription', {
        initData,
        planId
      });

      const { paymentUrl, paymentId, transactionId } = response.data;

      return { paymentUrl, paymentId, transactionId };
    } catch (error) {
      console.error('Error creating payment:', error);
      if (axios.isAxiosError(error) && error.response) {
        setError(error.response.data.error || 'Ошибка создания платежа');
        toast.error(error.response.data.error || 'Ошибка создания платежа');
      } else {
        setError('Ошибка создания платежа');
        toast.error('Ошибка создания платежа');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [initData]);

  return {
    loading,
    user,
    chats,
    currentChat,
    messages,
    userSettings,
    aiSettings,
    subscription,
    availablePlans,
    error,
    loginUser,
    getChats,
    createChat,
    updateChatTitle,
    deleteChat,
    getMessages,
    sendMessage,
    getSettings,
    updateSettings,
    getSubscription,
    createPayment
  };
}

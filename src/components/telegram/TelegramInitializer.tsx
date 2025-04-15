'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        initData: string;
        initDataUnsafe: {
          query_id: string;
          user: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code: string;
            photo_url?: string;
          };
          auth_date: string;
          hash: string;
        };
        MainButton: {
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          isVisible: boolean;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          isVisible: boolean;
        };
        onEvent: (eventType: string, callback: () => void) => void;
        offEvent: (eventType: string, callback: () => void) => void;
        colorScheme: 'light' | 'dark';
        themeParams: {
          bg_color: string;
          text_color: string;
          hint_color: string;
          link_color: string;
          button_color: string;
          button_text_color: string;
        };
      };
    };
  }
}

const TelegramInitializer = () => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initTelegram = () => {
      if (typeof window !== 'undefined' && window.Telegram) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();

        // Применим цветовую схему Telegram к приложению
        document.documentElement.classList.toggle(
          'dark',
          window.Telegram.WebApp.colorScheme === 'dark'
        );

        // Настройка обработчиков событий
        window.Telegram.WebApp.onEvent('themeChanged', () => {
          document.documentElement.classList.toggle(
            'dark',
            window.Telegram.WebApp.colorScheme === 'dark'
          );
        });

        setInitialized(true);
      } else {
        console.warn('Telegram WebApp is not available. Running in development mode.');
        setInitialized(true);
      }
    };

    // Попытка инициализации сразу и через небольшую задержку
    initTelegram();
    const timeoutId = setTimeout(initTelegram, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    // Добавляем скрипт Telegram WebApp, если он еще не загружен
    if (typeof window !== 'undefined' && !window.Telegram) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.async = true;
      script.onload = () => {
        if (window.Telegram) {
          window.Telegram.WebApp.ready();
          window.Telegram.WebApp.expand();
          setInitialized(true);
        }
      };
      script.onerror = () => {
        toast.error('Не удалось загрузить Telegram WebApp');
        console.error('Failed to load Telegram WebApp script');
        setInitialized(true); // Allow the app to run anyway
      };
      document.head.appendChild(script);
    }
  }, []);

  return null;
};

export default TelegramInitializer;

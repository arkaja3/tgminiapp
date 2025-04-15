'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AISettings, UserSettings } from './types';
import { useTelegramApi } from '@/hooks/use-telegram-api';

interface UserContextType {
  user: User | null;
  loading: boolean;
  aiSettings: AISettings | null;
  userSettings: UserSettings | null;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  updateSettings: (userSettings?: UserSettings, aiSettings?: Partial<AISettings>) => Promise<boolean>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const {
    user,
    loading,
    aiSettings,
    userSettings,
    loginUser,
    getSettings,
    updateSettings: apiUpdateSettings
  } = useTelegramApi();

  const [isDarkMode, setIsDarkMode] = useState(false);

  // При инициализации пытаемся авторизовать пользователя
  useEffect(() => {
    const init = async () => {
      // Пытаемся авторизовать пользователя
      const userData = await loginUser();
      if (userData) {
        // Получаем настройки пользователя
        await getSettings();
      }
    };

    init();
  }, [loginUser, getSettings]);

  // Обновляем режим темы при изменении настроек пользователя
  useEffect(() => {
    if (userSettings) {
      setIsDarkMode(userSettings.themeDark);
    } else if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      // Если настройки не получены, используем тему Telegram
      setIsDarkMode(window.Telegram.WebApp.colorScheme === 'dark');
    }
  }, [userSettings]);

  // Применяем темную тему к документу
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
  }, [isDarkMode]);

  const updateUserSettings = async (
    newUserSettings?: UserSettings,
    newAiSettings?: Partial<AISettings>
  ) => {
    const success = await apiUpdateSettings(newUserSettings, newAiSettings);

    if (success && newUserSettings) {
      // Обновляем тему, если она изменилась
      if (typeof newUserSettings.themeDark === 'boolean') {
        setIsDarkMode(newUserSettings.themeDark);
      }
    }

    return success;
  };

  const logout = () => {
    // В реальном приложении здесь был бы вызов API для выхода
    // и очистка локального состояния
    window.location.href = '/';
  };

  const value = {
    user,
    loading,
    aiSettings,
    userSettings,
    isDarkMode,
    setIsDarkMode,
    updateSettings: updateUserSettings,
    logout
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

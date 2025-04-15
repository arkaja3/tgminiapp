import crypto from 'crypto';
import { TelegramUser } from './types';
import telegramConfig from '@/config/telegram';

export function verifyTelegramWebAppData(initData: string): boolean {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) return false;

    // Удаляем параметр hash из данных
    urlParams.delete('hash');

    // Сортируем параметры в алфавитном порядке
    const params: Array<[string, string]> = [];
    urlParams.forEach((value, key) => {
      params.push([key, value]);
    });
    params.sort(([a], [b]) => a.localeCompare(b));

    // Формируем строку проверки
    const dataCheckString = params
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаем секретный ключ из токена бота
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(telegramConfig.botToken)
      .digest();

    // Вычисляем хеш
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Сравниваем хеши
    return calculatedHash === hash;
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    return false;
  }
}

export function parseTelegramInitData(initData: string): TelegramUser | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const userStr = urlParams.get('user');
    if (!userStr) return null;

    const user: TelegramUser = JSON.parse(userStr);
    const authDate = urlParams.get('auth_date') || '';
    const hash = urlParams.get('hash') || '';

    return {
      ...user,
      auth_date: authDate,
      hash: hash
    };
  } catch (error) {
    console.error('Error parsing Telegram init data:', error);
    return null;
  }
}

export function isExpired(authDate: string): boolean {
  // Проверяем срок годности авторизации (обычно 24 часа)
  const authTimestamp = parseInt(authDate, 10);
  const now = Math.floor(Date.now() / 1000);
  const MAX_AGE = 86400; // 24 часа в секундах

  return now - authTimestamp > MAX_AGE;
}

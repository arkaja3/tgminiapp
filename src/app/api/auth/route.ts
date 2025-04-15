import { NextRequest, NextResponse } from 'next/server';
import { parseTelegramInitData, verifyTelegramWebAppData, isExpired } from '@/lib/telegram-auth';
import {
  getUserByTelegramId,
  createUser,
  updateUser,
  getUserAISettings,
  createDefaultAISettings
} from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json(
        { error: 'Отсутствуют данные инициализации Telegram' },
        { status: 400 }
      );
    }

    // Проверяем валидность данных Telegram
    const isValid = verifyTelegramWebAppData(initData);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Невалидные данные инициализации Telegram' },
        { status: 401 }
      );
    }

    // Парсим данные пользователя из initData
    const telegramUser = parseTelegramInitData(initData);
    if (!telegramUser) {
      return NextResponse.json(
        { error: 'Не удалось получить данные пользователя из initData' },
        { status: 400 }
      );
    }

    // Проверяем срок действия авторизации
    if (isExpired(telegramUser.auth_date)) {
      return NextResponse.json(
        { error: 'Истекший срок авторизации, пожалуйста, авторизуйтесь заново' },
        { status: 401 }
      );
    }

    // Проверяем, существует ли пользователь в базе данных
    let user = await getUserByTelegramId(telegramUser.id);

    if (!user) {
      // Создаем нового пользователя
      const userId = await createUser({
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        photo_url: telegramUser.photo_url,
        auth_date: parseInt(telegramUser.auth_date, 10),
        is_premium: false // Это можно получить из Telegram API отдельно
      });

      // Создаем настройки AI по умолчанию для нового пользователя
      await createDefaultAISettings(userId);

      // Получаем только что созданного пользователя
      user = await getUserByTelegramId(telegramUser.id);
    } else {
      // Обновляем информацию о существующем пользователе
      await updateUser(user.id, {
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        photo_url: telegramUser.photo_url,
        auth_date: parseInt(telegramUser.auth_date, 10)
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Не удалось создать или получить пользователя' },
        { status: 500 }
      );
    }

    // Получаем настройки AI для пользователя
    const aiSettings = await getUserAISettings(user.id);

    // Формируем данные для ответа
    const userData = {
      id: user.id,
      telegram_id: user.telegram_id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      photo_url: user.photo_url,
      is_premium: user.is_premium,
      settings: user.settings || {
        themeDark: false,
        notifications: true
      },
      aiSettings
    };

    return NextResponse.json({ user: userData, success: true });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  getUserByTelegramId,
  updateUserSettings,
  getUserAISettings,
  updateAISettings
} from '@/lib/db';
import { verifyTelegramWebAppData, parseTelegramInitData } from '@/lib/telegram-auth';
import { UserSettings } from '@/lib/types';

// GET /api/settings - получение настроек пользователя
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const initData = searchParams.get('initData');

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

    // Получаем пользователя из базы данных
    const user = await getUserByTelegramId(telegramUser.id);
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Получаем настройки AI
    const aiSettings = await getUserAISettings(user.id);

    // Формируем объект с настройками
    const userSettings = user.settings
      ? typeof user.settings === 'string'
        ? JSON.parse(user.settings)
        : user.settings
      : {
          themeDark: false,
          notifications: true,
          defaultSystemPrompt: 'Ты — Claude, полезный, безопасный и честный ИИ-ассистент, созданный Anthropic. Всегда вежливо отвечай на запросы на том же языке, на котором задан вопрос.'
        };

    return NextResponse.json({
      userSettings,
      aiSettings,
      success: true
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - обновление настроек пользователя
export async function PUT(request: NextRequest) {
  try {
    const { initData, userSettings, aiSettings } = await request.json();

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

    // Получаем пользователя из базы данных
    const user = await getUserByTelegramId(telegramUser.id);
    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Обновляем пользовательские настройки, если они предоставлены
    let userSettingsUpdated = false;
    if (userSettings) {
      // Проверяем корректность настроек
      const settings: UserSettings = {
        themeDark: typeof userSettings.themeDark === 'boolean' ? userSettings.themeDark : false,
        notifications: typeof userSettings.notifications === 'boolean' ? userSettings.notifications : true,
        defaultSystemPrompt: typeof userSettings.defaultSystemPrompt === 'string' ? userSettings.defaultSystemPrompt : 'Ты — Claude, полезный, безопасный и честный ИИ-ассистент, созданный Anthropic. Всегда вежливо отвечай на запросы на том же языке, на котором задан вопрос.',
        temperature: typeof userSettings.temperature === 'number' ? userSettings.temperature : 0.7,
        maxTokens: typeof userSettings.maxTokens === 'number' ? userSettings.maxTokens : 1000
      };

      userSettingsUpdated = await updateUserSettings(user.id, JSON.stringify(settings));
    }

    // Обновляем настройки AI, если они предоставлены
    let aiSettingsUpdated = false;
    if (aiSettings) {
      aiSettingsUpdated = await updateAISettings(user.id, {
        temperature: aiSettings.temperature,
        max_tokens: aiSettings.max_tokens,
        model: aiSettings.model,
        system_prompt: aiSettings.system_prompt
      });
    }

    return NextResponse.json({
      userSettingsUpdated,
      aiSettingsUpdated,
      success: userSettingsUpdated || aiSettingsUpdated
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

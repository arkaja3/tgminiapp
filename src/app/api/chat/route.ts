import { NextRequest, NextResponse } from 'next/server';
import {
  getUserByTelegramId,
  getUserChats,
  createChat,
  updateChatTitle,
  deleteChat,
  getChatById
} from '@/lib/db';
import { verifyTelegramWebAppData, parseTelegramInitData } from '@/lib/telegram-auth';

// GET /api/chat - получение списка чатов пользователя
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

    // Получаем все чаты пользователя
    const chats = await getUserChats(user.id);

    return NextResponse.json({ chats, success: true });
  } catch (error) {
    console.error('Error getting chats:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/chat - создание нового чата
export async function POST(request: NextRequest) {
  try {
    const { initData, title } = await request.json();

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

    // Создаем новый чат
    const chatId = await createChat(user.id, title || 'Новый чат');

    // Получаем созданный чат
    const chat = await getChatById(chatId, user.id);

    return NextResponse.json({ chat, success: true });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// PUT /api/chat - обновление чата
export async function PUT(request: NextRequest) {
  try {
    const { initData, chatId, title } = await request.json();

    if (!initData || !chatId) {
      return NextResponse.json(
        { error: 'Отсутствуют необходимые параметры' },
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

    // Проверяем существование чата
    const chat = await getChatById(Number(chatId), user.id);
    if (!chat) {
      return NextResponse.json(
        { error: 'Чат не найден' },
        { status: 404 }
      );
    }

    // Обновляем название чата
    const success = await updateChatTitle(Number(chatId), user.id, title);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// DELETE /api/chat - удаление чата
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const initData = searchParams.get('initData');
    const chatId = searchParams.get('chatId');

    if (!initData || !chatId) {
      return NextResponse.json(
        { error: 'Отсутствуют необходимые параметры' },
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

    // Удаляем чат
    const success = await deleteChat(Number(chatId), user.id);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

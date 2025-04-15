import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import {
  getUserByTelegramId,
  getChatById,
  getChatMessages,
  createMessage,
  saveAttachment,
  getUserAISettings,
  getUserSubscription,
  updateUsageStats
} from '@/lib/db';
import { verifyTelegramWebAppData, parseTelegramInitData } from '@/lib/telegram-auth';
import { getChatCompletion, estimateTokens } from '@/lib/ai-service';

// GET /api/chat/[id]/messages - получение сообщений чата
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Проверяем существование чата
    const chatId = Number(params.id);
    const chat = await getChatById(chatId, user.id);
    if (!chat) {
      return NextResponse.json(
        { error: 'Чат не найден' },
        { status: 404 }
      );
    }

    // Получаем сообщения чата
    const messages = await getChatMessages(chatId, user.id);

    return NextResponse.json({ messages, success: true });
  } catch (error) {
    console.error('Error getting messages:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/chat/[id]/messages - отправка сообщения
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const initData = formData.get('initData') as string;
    const content = formData.get('content') as string;
    const files = formData.getAll('files') as File[];

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

    // Проверяем существование чата
    const chatId = Number(params.id);
    const chat = await getChatById(chatId, user.id);
    if (!chat) {
      return NextResponse.json(
        { error: 'Чат не найден' },
        { status: 404 }
      );
    }

    // Проверяем подписку пользователя
    const subscription = await getUserSubscription(user.id);
    const isPremium = subscription !== null && subscription.status === 'active';

    // Проверяем, разрешено ли пользователю отправлять файлы
    if (files.length > 0 && !isPremium) {
      return NextResponse.json(
        { error: 'Для отправки файлов требуется активная подписка' },
        { status: 403 }
      );
    }

    // Создаем сообщение пользователя
    const userMessageId = await createMessage({
      chat_id: chatId,
      user_id: user.id,
      content: content || '',
      is_user: true
    });

    // Сохраняем вложения, если они есть
    const savedAttachments = [];
    if (files.length > 0) {
      // Создаем директорию для файлов, если она не существует
      const uploadsDir = join(process.cwd(), 'public', 'uploads', user.id.toString(), chatId.toString());
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      for (const file of files) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = join(uploadsDir, fileName);

        // Записываем файл
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        // Сохраняем информацию о файле в базе данных
        const attachmentId = await saveAttachment({
          message_id: userMessageId,
          name: file.name,
          type: file.type,
          file_path: `/uploads/${user.id}/${chatId}/${fileName}`,
          file_size: file.size
        });

        savedAttachments.push({
          id: attachmentId,
          name: file.name,
          type: file.type,
          url: `/uploads/${user.id}/${chatId}/${fileName}`
        });
      }
    }

    // Получаем настройки AI пользователя
    const aiSettings = await getUserAISettings(user.id);
    if (!aiSettings) {
      return NextResponse.json(
        { error: 'Не удалось получить настройки AI' },
        { status: 500 }
      );
    }

    // Получаем предыдущие сообщения для контекста
    const messages = await getChatMessages(chatId, user.id);

    // Форматируем сообщения для отправки в API
    const formattedMessages = messages.map(msg => ({
      role: msg.is_user ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));

    // Добавляем текущее сообщение, если оно не пустое
    if (content && content.trim()) {
      formattedMessages.push({
        role: 'user' as const,
        content: content
      });
    }

    // Оцениваем токены пользователя
    const userTokens = estimateTokens(content || '');

    try {
      // Получаем ответ от AI
      const aiResponse = await getChatCompletion(formattedMessages, aiSettings);

      // Создаем сообщение AI
      const aiMessageId = await createMessage({
        chat_id: chatId,
        user_id: user.id,
        content: aiResponse.text,
        is_user: false
      });

      // Обновляем статистику использования
      await updateUsageStats(user.id, 2, userTokens + aiResponse.total_tokens, files.length);

      // Получаем обновленные сообщения
      const updatedMessages = await getChatMessages(chatId, user.id);

      return NextResponse.json({
        messages: updatedMessages,
        userMessageId,
        aiMessageId,
        success: true
      });
    } catch (error) {
      console.error('AI API error:', error);

      // Создаем сообщение об ошибке
      const errorMessageId = await createMessage({
        chat_id: chatId,
        user_id: user.id,
        content: 'Извините, я сейчас не могу ответить. Пожалуйста, попробуйте позже.',
        is_user: false
      });

      // Обновляем статистику использования (только для пользовательского сообщения)
      await updateUsageStats(user.id, 2, userTokens, files.length);

      return NextResponse.json({
        error: 'Ошибка при получении ответа от AI API',
        userMessageId,
        errorMessageId,
        success: false
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

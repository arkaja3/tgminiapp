import { NextRequest, NextResponse } from 'next/server';
import { verifyTelegramWebAppData, isExpired } from './lib/telegram-auth';

// Пути, которые не требуют аутентификации
const publicPaths = ['/api/auth', '/api/webhook'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Пропускаем API webhook и публичные маршруты
  for (const path of publicPaths) {
    if (pathname.startsWith(path)) {
      return NextResponse.next();
    }
  }

  // Если это API запрос, проверяем Telegram аутентификацию
  if (pathname.startsWith('/api')) {
    // Получаем initData из query параметров или из тела запроса
    let initData: string | null = null;

    if (request.method === 'GET') {
      initData = request.nextUrl.searchParams.get('initData');
    } else if (request.headers.get('content-type')?.includes('application/json')) {
      // Для POST запросов мы не можем прочитать тело здесь,
      // поэтому проверка будет выполнена внутри обработчика
      return NextResponse.next();
    } else if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      // Для multipart/form-data (загрузка файлов) мы также не можем прочитать тело
      return NextResponse.next();
    }

    // Проверяем наличие данных инициализации
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

    // Проверяем срок действия авторизации
    const urlParams = new URLSearchParams(initData);
    const authDate = urlParams.get('auth_date');
    if (authDate && isExpired(authDate)) {
      return NextResponse.json(
        { error: 'Срок действия авторизации истек' },
        { status: 401 }
      );
    }
  }

  // Продолжаем обработку запроса
  return NextResponse.next();
}

// Только для API маршрутов
export const config = {
  matcher: '/api/:path*',
};

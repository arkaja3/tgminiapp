import { NextRequest, NextResponse } from 'next/server';
import { YooCheckout } from '@a2seven/yoo-checkout';
import { v4 as uuidv4 } from 'uuid';
import {
  getUserByTelegramId,
  getUserSubscription
} from '@/lib/db';
import { verifyTelegramWebAppData, parseTelegramInitData } from '@/lib/telegram-auth';
import config from '@/config/telegram';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getConnection } from '@/config/database';

// Инициализация YooKassa
const checkout = new YooCheckout({
  shopId: config.yookassaShopId,
  secretKey: config.yookassaSecretKey
});

// GET /api/subscription - получение информации о подписке пользователя
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

    // Получаем активную подписку пользователя
    const subscription = await getUserSubscription(user.id);

    // Получаем все доступные планы подписок
    const conn = await getConnection();
    const [plans] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price ASC'
    );

    return NextResponse.json({
      subscription,
      plans,
      success: true
    });
  } catch (error) {
    console.error('Error getting subscription info:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// POST /api/subscription - создание нового платежа для подписки
export async function POST(request: NextRequest) {
  try {
    const { initData, planId } = await request.json();

    if (!initData || !planId) {
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

    // Получаем информацию о плане подписки
    const conn = await getConnection();
    const [plans] = await conn.execute<RowDataPacket[]>(
      'SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1',
      [planId]
    );

    if (plans.length === 0) {
      return NextResponse.json(
        { error: 'План подписки не найден или не активен' },
        { status: 404 }
      );
    }

    const plan = plans[0];

    // Создаем уникальный идентификатор для платежа
    const paymentId = uuidv4();

    // Создаем запись о транзакции в базе данных
    const [result] = await conn.execute<ResultSetHeader>(
      'INSERT INTO transactions (user_id, amount, currency, payment_id, status) VALUES (?, ?, ?, ?, ?)',
      [user.id, plan.price, plan.currency, paymentId, 'pending']
    );

    const transactionId = result.insertId;

    // Создаем платеж в YooKassa
    const payment = await checkout.createPayment({
      amount: {
        value: plan.price.toString(),
        currency: plan.currency
      },
      confirmation: {
        type: 'redirect',
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?transaction_id=${transactionId}`
      },
      capture: true,
      description: `Подписка на "${plan.name}" для пользователя ${user.telegram_id}`,
      metadata: {
        transaction_id: transactionId,
        user_id: user.id,
        plan_id: planId
      }
    });

    // Обновляем запись о транзакции с ID платежа из YooKassa
    await conn.execute(
      'UPDATE transactions SET payment_id = ? WHERE id = ?',
      [payment.id, transactionId]
    );

    return NextResponse.json({
      paymentUrl: payment.confirmation.confirmation_url,
      paymentId: payment.id,
      transactionId,
      success: true
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { YooCheckout } from '@a2seven/yoo-checkout';
import crypto from 'crypto';
import { getConnection } from '@/config/database';
import telegramConfig from '@/config/telegram';
import { ResultSetHeader } from 'mysql2/promise';

// Инициализация YooKassa
const checkout = new YooCheckout({
  shopId: telegramConfig.yookassaShopId,
  secretKey: telegramConfig.yookassaSecretKey
});

// Проверка подписи webhook от ЮKassa
function verifyYooKassaSignature(payload: string, signature: string): boolean {
  try {
    if (!telegramConfig.yookassaSecretKey) {
      console.error('YooKassa secret key is not configured');
      return false;
    }

    const calculated = crypto
      .createHmac('sha1', telegramConfig.yookassaSecretKey)
      .update(payload)
      .digest('hex');

    return calculated === signature;
  } catch (error) {
    console.error('Error verifying YooKassa signature:', error);
    return false;
  }
}

// Создание подписки для пользователя
async function createSubscription(userId: number, planId: number): Promise<number> {
  try {
    const conn = await getConnection();

    // Получаем информацию о плане подписки
    const [plans] = await conn.execute(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [planId]
    );

    if (!plans || !plans[0]) {
      throw new Error('Plan not found');
    }

    const plan = plans[0];

    // Вычисляем дату окончания подписки
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.duration_days);

    // Создаем запись о подписке
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO subscriptions
       (user_id, plan_id, status, start_date, end_date, auto_renew)
       VALUES (?, ?, 'active', ?, ?, FALSE)`,
      [userId, planId, startDate, endDate]
    );

    return result.insertId;
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

// POST /api/webhook/payment - обработчик уведомлений от ЮKassa
export async function POST(request: NextRequest) {
  try {
    // Получаем данные запроса
    const payload = await request.text();
    const signature = request.headers.get('Idempotence-Key') || '';

    // Проверяем подпись
    if (!verifyYooKassaSignature(payload, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Парсим данные уведомления
    const event = JSON.parse(payload);

    // Проверяем событие
    if (event.event !== 'payment.succeeded') {
      // Обрабатываем только успешные платежи
      return NextResponse.json({ success: true });
    }

    // Получаем данные платежа
    const paymentId = event.object.id;
    const paymentData = await checkout.getPayment(paymentId);

    if (!paymentData || !paymentData.metadata) {
      return NextResponse.json(
        { error: 'Payment data not found' },
        { status: 404 }
      );
    }

    // Получаем информацию о транзакции из метаданных
    const { transaction_id, user_id, plan_id } = paymentData.metadata;

    if (!transaction_id || !user_id || !plan_id) {
      return NextResponse.json(
        { error: 'Invalid metadata' },
        { status: 400 }
      );
    }

    const conn = await getConnection();

    // Обновляем статус транзакции
    await conn.execute(
      'UPDATE transactions SET status = ?, payment_method = ? WHERE id = ?',
      ['completed', paymentData.payment_method?.type || 'unknown', transaction_id]
    );

    // Создаем подписку для пользователя
    const subscriptionId = await createSubscription(Number(user_id), Number(plan_id));

    // Связываем транзакцию с подпиской
    await conn.execute(
      'UPDATE transactions SET subscription_id = ? WHERE id = ?',
      [subscriptionId, transaction_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

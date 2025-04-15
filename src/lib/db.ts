import { getConnection } from '@/config/database';
import { TelegramUser, User, Chat, Message, Attachment, Subscription, AISettings, UsageStats } from './types';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// Пользователи
export async function getUserByTelegramId(telegramId: number): Promise<User | null> {
  const conn = await getConnection();
  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT * FROM users WHERE telegram_id = ?',
    [telegramId]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0] as User;
}

export async function createUser(userData: Partial<User>): Promise<number> {
  const conn = await getConnection();
  const [result] = await conn.execute<ResultSetHeader>(
    `INSERT INTO users
     (telegram_id, username, first_name, last_name, photo_url, auth_date, is_premium)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userData.telegram_id,
      userData.username || null,
      userData.first_name,
      userData.last_name || null,
      userData.photo_url || null,
      userData.auth_date,
      userData.is_premium || false
    ]
  );

  return result.insertId;
}

export async function updateUser(userId: number, userData: Partial<User>): Promise<boolean> {
  const conn = await getConnection();
  const [result] = await conn.execute<ResultSetHeader>(
    `UPDATE users SET
     username = IFNULL(?, username),
     first_name = IFNULL(?, first_name),
     last_name = IFNULL(?, last_name),
     photo_url = IFNULL(?, photo_url),
     auth_date = IFNULL(?, auth_date),
     is_premium = IFNULL(?, is_premium),
     last_active = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      userData.username,
      userData.first_name,
      userData.last_name,
      userData.photo_url,
      userData.auth_date,
      userData.is_premium,
      userId
    ]
  );

  return result.affectedRows > 0;
}

export async function updateUserSettings(userId: number, settings: string): Promise<boolean> {
  const conn = await getConnection();
  const [result] = await conn.execute<ResultSetHeader>(
    'UPDATE users SET settings = ? WHERE id = ?',
    [settings, userId]
  );

  return result.affectedRows > 0;
}

// Чаты
export async function getUserChats(userId: number): Promise<Chat[]> {
  const conn = await getConnection();
  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT * FROM chats WHERE user_id = ? ORDER BY updated_at DESC',
    [userId]
  );

  return rows as Chat[];
}

export async function getChatById(chatId: number, userId: number): Promise<Chat | null> {
  const conn = await getConnection();
  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT * FROM chats WHERE id = ? AND user_id = ?',
    [chatId, userId]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0] as Chat;
}

export async function createChat(userId: number, title: string): Promise<number> {
  const conn = await getConnection();
  const [result] = await conn.execute<ResultSetHeader>(
    'INSERT INTO chats (user_id, title) VALUES (?, ?)',
    [userId, title]
  );

  return result.insertId;
}

export async function updateChatTitle(chatId: number, userId: number, title: string): Promise<boolean> {
  const conn = await getConnection();
  const [result] = await conn.execute<ResultSetHeader>(
    'UPDATE chats SET title = ? WHERE id = ? AND user_id = ?',
    [title, chatId, userId]
  );

  return result.affectedRows > 0;
}

export async function deleteChat(chatId: number, userId: number): Promise<boolean> {
  const conn = await getConnection();
  const [result] = await conn.execute<ResultSetHeader>(
    'DELETE FROM chats WHERE id = ? AND user_id = ?',
    [chatId, userId]
  );

  return result.affectedRows > 0;
}

// Сообщения
export async function getChatMessages(chatId: number, userId: number): Promise<Message[]> {
  const conn = await getConnection();
  const [rows] = await conn.execute<RowDataPacket[]>(
    `SELECT m.*,
     GROUP_CONCAT(JSON_OBJECT(
       'id', mf.id,
       'message_id', mf.message_id,
       'file_name', mf.file_name,
       'file_path', mf.file_path,
       'file_type', mf.file_type,
       'file_size', mf.file_size,
       'created_at', mf.created_at
     )) as attachments_json
     FROM messages m
     LEFT JOIN message_files mf ON m.id = mf.message_id
     WHERE m.chat_id = ? AND m.user_id = ?
     GROUP BY m.id
     ORDER BY m.created_at ASC`,
    [chatId, userId]
  );

  return (rows as any[]).map(row => {
    const message: Message = {
      id: row.id,
      chat_id: row.chat_id,
      user_id: row.user_id,
      content: row.content,
      is_user: row.is_user === 1,
      created_at: row.created_at,
      attachments: []
    };

    if (row.attachments_json) {
      try {
        const attachmentsArray = row.attachments_json.split(',');
        message.attachments = attachmentsArray.map((json: string) => JSON.parse(json));
      } catch (error) {
        console.error('Error parsing attachments JSON:', error);
      }
    }

    return message;
  });
}

export async function createMessage(messageData: Partial<Message>): Promise<number> {
  const conn = await getConnection();
  const [result] = await conn.execute<ResultSetHeader>(
    'INSERT INTO messages (chat_id, user_id, content, is_user) VALUES (?, ?, ?, ?)',
    [
      messageData.chat_id,
      messageData.user_id,
      messageData.content,
      messageData.is_user
    ]
  );

  // Обновляем время последнего обновления чата
  await conn.execute(
    'UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [messageData.chat_id]
  );

  return result.insertId;
}

export async function saveAttachment(attachmentData: Partial<Attachment>): Promise<number> {
  const conn = await getConnection();
  const [result] = await conn.execute<ResultSetHeader>(
    `INSERT INTO message_files
     (message_id, file_name, file_path, file_type, file_size)
     VALUES (?, ?, ?, ?, ?)`,
    [
      attachmentData.message_id,
      attachmentData.name,
      attachmentData.file_path,
      attachmentData.type,
      attachmentData.file_size || 0
    ]
  );

  return result.insertId;
}

// Подписки
export async function getUserSubscription(userId: number): Promise<Subscription | null> {
  const conn = await getConnection();
  const [rows] = await conn.execute<RowDataPacket[]>(
    `SELECT s.*,
     JSON_OBJECT(
       'id', p.id,
       'name', p.name,
       'description', p.description,
       'duration_days', p.duration_days,
       'price', p.price,
       'currency', p.currency,
       'features', p.features,
       'is_active', p.is_active,
       'created_at', p.created_at,
       'updated_at', p.updated_at
     ) as plan_json
     FROM subscriptions s
     JOIN subscription_plans p ON s.plan_id = p.id
     WHERE s.user_id = ? AND s.status = 'active' AND s.end_date > NOW()
     ORDER BY s.end_date DESC
     LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  const subscription: Subscription = {
    id: row.id,
    user_id: row.user_id,
    plan_id: row.plan_id,
    status: row.status,
    start_date: row.start_date,
    end_date: row.end_date,
    auto_renew: row.auto_renew === 1,
    created_at: row.created_at,
    updated_at: row.updated_at
  };

  if (row.plan_json) {
    try {
      subscription.plan = JSON.parse(row.plan_json);
    } catch (error) {
      console.error('Error parsing plan JSON:', error);
    }
  }

  return subscription;
}

// AI настройки
export async function getUserAISettings(userId: number): Promise<AISettings | null> {
  const conn = await getConnection();
  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT * FROM ai_settings WHERE user_id = ?',
    [userId]
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0] as AISettings;
}

export async function createDefaultAISettings(userId: number): Promise<number> {
  const conn = await getConnection();
  const [result] = await conn.execute<ResultSetHeader>(
    `INSERT INTO ai_settings
     (user_id, temperature, max_tokens, model, system_prompt)
     VALUES (?, ?, ?, ?, ?)`,
    [
      userId,
      0.7,
      1000,
      'sonnet-3.7',
      'Ты — Claude, полезный, безопасный и честный ИИ-ассистент, созданный Anthropic. Всегда вежливо отвечай на запросы на том же языке, на котором задан вопрос.'
    ]
  );

  return result.insertId;
}

export async function updateAISettings(userId: number, settings: Partial<AISettings>): Promise<boolean> {
  const conn = await getConnection();
  const [result] = await conn.execute<ResultSetHeader>(
    `UPDATE ai_settings SET
     temperature = IFNULL(?, temperature),
     max_tokens = IFNULL(?, max_tokens),
     model = IFNULL(?, model),
     system_prompt = IFNULL(?, system_prompt)
     WHERE user_id = ?`,
    [
      settings.temperature,
      settings.max_tokens,
      settings.model,
      settings.system_prompt,
      userId
    ]
  );

  return result.affectedRows > 0;
}

// Статистика использования
export async function updateUsageStats(userId: number, messagesCount: number, tokensCount: number, filesCount: number = 0): Promise<void> {
  const conn = await getConnection();

  // Проверяем, существует ли уже запись для пользователя
  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT id FROM usage_stats WHERE user_id = ?',
    [userId]
  );

  if (rows.length === 0) {
    // Создаем новую запись
    await conn.execute(
      `INSERT INTO usage_stats
       (user_id, total_messages, total_tokens, total_files, total_sessions, last_session_date)
       VALUES (?, ?, ?, ?, 1, NOW())`,
      [userId, messagesCount, tokensCount, filesCount]
    );
  } else {
    // Обновляем существующую запись
    await conn.execute(
      `UPDATE usage_stats SET
       total_messages = total_messages + ?,
       total_tokens = total_tokens + ?,
       total_files = total_files + ?,
       total_sessions = total_sessions + 1,
       last_session_date = NOW()
       WHERE user_id = ?`,
      [messagesCount, tokensCount, filesCount, userId]
    );
  }
}

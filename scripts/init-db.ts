import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Конфигурация базы данных
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'telegram_claude_chat',
  port: Number.parseInt(process.env.DB_PORT || '3306', 10),
};

async function main() {
  console.log('Инициализация базы данных...');

  try {
    // Создаем подключение к MySQL без указания базы данных
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port,
    });

    // Создаем базу данных, если она не существует
    console.log(`Создание базы данных ${dbConfig.database}...`);
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);

    // Переключаемся на созданную базу данных
    await connection.execute(`USE ${dbConfig.database}`);

    // Читаем SQL файл с структурой базы данных
    const sqlFilePath = path.join(process.cwd(), 'database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Разделяем содержимое на отдельные SQL-запросы
    const queries = sqlContent
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0);

    // Выполняем каждый запрос
    console.log('Применение структуры базы данных...');
    for (const query of queries) {
      await connection.execute(`${query}`);
    }

    console.log('База данных успешно инициализирована!');

    // Закрываем соединение
    await connection.end();

    process.exit(0);
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    process.exit(1);
  }
}

main();

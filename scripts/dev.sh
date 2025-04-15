#!/bin/bash

# Проверка наличия .env файла
if [ ! -f .env ]; then
  echo "Файл .env не найден. Создаем из примера .env.example..."
  cp .env.example .env
  echo "Создан файл .env. Пожалуйста, отредактируйте его перед запуском приложения."
  exit 1
fi

# Проверка необходимых переменных окружения
source .env
REQUIRED_VARS=("TELEGRAM_BOT_TOKEN" "AI_API_KEY" "DB_HOST" "DB_USER")
MISSING_VARS=0

for VAR in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!VAR}" ]; then
    echo "Отсутствует обязательная переменная окружения: $VAR"
    MISSING_VARS=1
  fi
done

if [ $MISSING_VARS -eq 1 ]; then
  echo "Пожалуйста, заполните все обязательные переменные в файле .env"
  exit 1
fi

# Создание директорий для загрузки файлов
mkdir -p public/uploads

# Проверка базы данных и запуск скрипта инициализации
echo "Проверка базы данных..."
node -e "
const mysql = require('mysql2/promise');
const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: Number.parseInt(process.env.DB_PORT || '3306', 10)
};

async function checkDb() {
  try {
    const conn = await mysql.createConnection(config);
    await conn.execute(\`SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '${process.env.DB_NAME || 'telegram_claude_chat'}'\`);
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('Ошибка подключения к базе данных или база данных не существует.');
    process.exit(1);
  }
}

checkDb();
" > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "База данных не найдена. Запуск инициализации..."
  bun run init-db
fi

# Запуск приложения в режиме разработки
echo "Запуск приложения..."
bun run dev

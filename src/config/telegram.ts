interface TelegramConfig {
  botToken: string;
  botUsername: string;
  webhookUrl: string;
  apiUrl: string;
  yookassaShopId: string;
  yookassaSecretKey: string;
}

const config: TelegramConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  botUsername: process.env.TELEGRAM_BOT_USERNAME || 'your_bot_username',
  webhookUrl: process.env.WEBHOOK_URL || 'https://your-app-domain.com/api/webhook',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://your-app-domain.com/api',
  yookassaShopId: process.env.YOOKASSA_SHOP_ID || '',
  yookassaSecretKey: process.env.YOOKASSA_SECRET_KEY || '',
};

export default config;

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code: string;
  photo_url?: string;
  auth_date: string;
  hash: string;
}

export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  auth_date: number;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
  last_active?: string;
  settings?: UserSettings;
}

export interface UserSettings {
  themeDark: boolean;
  notifications: boolean;
  defaultSystemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export interface Chat {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  chat_id: number;
  user_id: number;
  content: string;
  is_user: boolean;
  created_at: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id?: number;
  message_id?: number;
  name: string;
  type: string;
  url?: string;
  file_path?: string;
  file_size?: number;
  created_at?: string;
}

export interface Subscription {
  id: number;
  user_id: number;
  plan_id: number;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  duration_days: number;
  price: number;
  currency: string;
  features: SubscriptionFeatures;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionFeatures {
  message_limit: number;
  file_upload: boolean;
  priority_support: boolean;
  advanced_features?: boolean;
  exclusive_content?: boolean;
}

export interface Transaction {
  id: number;
  user_id: number;
  subscription_id?: number;
  amount: number;
  currency: string;
  payment_id?: string;
  payment_method?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
}

export interface AISettings {
  id: number;
  user_id: number;
  temperature: number;
  max_tokens: number;
  model: string;
  system_prompt: string;
  created_at: string;
  updated_at: string;
}

export interface UsageStats {
  id: number;
  user_id: number;
  total_messages: number;
  total_tokens: number;
  total_files: number;
  total_sessions: number;
  last_session_date?: string;
  created_at: string;
  updated_at: string;
}

import axios from 'axios';
import { AISettings } from './types';

interface MessageContent {
  type: 'text';
  text: string;
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: MessageContent[];
}

interface ChatCompletionRequest {
  model: string;
  messages: AnthropicMessage[];
  system?: string;
  max_tokens: number;
  temperature: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  id: string;
  type: string;
  role: string;
  content: MessageContent[];
  model: string;
  stop_reason: string;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export async function getChatCompletion(
  messages: { role: 'user' | 'assistant'; content: string }[],
  settings: AISettings
): Promise<{ text: string; total_tokens: number }> {
  const apiKey = process.env.AI_API_KEY;

  if (!apiKey) {
    throw new Error('AI API key is not configured');
  }

  // Преобразуем сообщения в формат Anthropic
  const anthropicMessages: AnthropicMessage[] = messages.map(msg => ({
    role: msg.role,
    content: [{ type: 'text', text: msg.content }]
  }));

  try {
    const response = await axios.post<ChatCompletionResponse>(
      'https://api.anthropic.com/v1/messages',
      {
        model: settings.model,
        messages: anthropicMessages,
        system: settings.system_prompt,
        max_tokens: settings.max_tokens,
        temperature: settings.temperature
      } as ChatCompletionRequest,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    const result = response.data;

    // Извлекаем текст из содержимого ответа
    const responseText = result.content
      .filter(content => content.type === 'text')
      .map(content => content.text)
      .join('');

    // Подсчитываем общее количество токенов
    const totalTokens = result.usage.input_tokens + result.usage.output_tokens;

    return {
      text: responseText,
      total_tokens: totalTokens
    };
  } catch (error) {
    console.error('Error calling Anthropic API:', error);

    if (axios.isAxiosError(error) && error.response) {
      console.error('API Error Details:', error.response.data);
      throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }

    throw error;
  }
}

// Функция для оценки токенов (приблизительно)
export function estimateTokens(text: string): number {
  // Приблизительная оценка: примерно 3 токена на слово
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.floor(words * 1.5));
}

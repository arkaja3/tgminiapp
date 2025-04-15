import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('audio/')) return 'audio';
  if (fileType.startsWith('video/')) return 'video';

  // Документы
  if (fileType === 'application/pdf') return 'pdf';
  if (fileType === 'application/msword' ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'word';
  if (fileType === 'application/vnd.ms-excel' ||
      fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') return 'excel';
  if (fileType === 'application/vnd.ms-powerpoint' ||
      fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') return 'powerpoint';

  // Код
  if (fileType === 'text/javascript' || fileType === 'application/javascript') return 'javascript';
  if (fileType === 'text/html') return 'html';
  if (fileType === 'text/css') return 'css';
  if (fileType === 'application/json') return 'json';
  if (fileType.includes('python')) return 'python';

  // Текст
  if (fileType.startsWith('text/')) return 'text';

  // Архивы
  if (fileType.includes('zip') || fileType.includes('rar') ||
      fileType.includes('tar') || fileType.includes('gzip')) return 'archive';

  return 'file';
}

export function generateUserId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

export function formatDateTime(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

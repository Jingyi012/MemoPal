import { isAxiosError } from 'axios';

export function getNumberPegErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const body = error.response?.data;
    if (body && typeof body === 'object') {
      const message = (body as Record<string, unknown>).message;
      if (typeof message === 'string' && message.trim()) return message.trim();
    }
  }

  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

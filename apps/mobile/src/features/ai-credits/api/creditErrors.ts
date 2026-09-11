import { isAxiosError } from 'axios';

export function isTerminalCreditError(error: unknown) {
  if (!isAxiosError(error) || !error.response) return false;
  const status = error.response.status;
  const message = error.response.data?.message;
  return [400, 402, 403, 404, 429, 503].includes(status) ||
    (status === 409 && typeof message === 'string' &&
      (message.startsWith('Generation failed;') || message.startsWith('AI credit pricing changed.')));
}

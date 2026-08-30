import axios from 'axios';

type ValidationErrors = Record<string, string[] | string | null | undefined>;

function firstValidationMessage(errors: ValidationErrors): string | null {
  for (const value of Object.values(errors)) {
    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === 'string' && item.trim().length > 0);
      if (typeof first === 'string') {
        return first.trim();
      }
      continue;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function firstObjectMessage(data: Record<string, unknown>): string | null {
  const stringKeys = ['message', 'error', 'detail', 'title'] as const;
  for (const key of stringKeys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  const errors = data.errors;
  if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
    return firstValidationMessage(errors as ValidationErrors);
  }

  return null;
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    if (typeof responseData === 'string' && responseData.trim().length > 0) {
      return responseData.trim();
    }

    if (responseData && typeof responseData === 'object') {
      const fromTopLevel = firstObjectMessage(responseData as Record<string, unknown>);
      if (fromTopLevel) {
        return fromTopLevel;
      }

      const nestedData = (responseData as Record<string, unknown>).data;
      if (nestedData && typeof nestedData === 'object') {
        const fromNested = firstObjectMessage(nestedData as Record<string, unknown>);
        if (fromNested) {
          return fromNested;
        }
      }
    }

    if (typeof error.message === 'string' && error.message.trim().length > 0) {
      return error.message.trim();
    }

    return fallback;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error.trim();
  }

  return fallback;
}

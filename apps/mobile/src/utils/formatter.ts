export const dateFormatter = (date?: string | Date | null): string => {
  if (!date) {
    return 'N/A';
  }

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return 'N/A';
  }

  return d.toLocaleDateString();
};

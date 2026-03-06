export const YEAR_PATTERN = /^\d{4}$/;
export const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export function normalizeYearQuery(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

export function validateYearQuery(value: unknown): string | null {
  const normalized = normalizeYearQuery(value);
  if (!normalized) {
    return null;
  }
  return YEAR_PATTERN.test(normalized) ? null : 'Year must match YYYY.';
}

export function normalizeMonthQuery(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

export function validateMonthQuery(value: unknown): string | null {
  const normalized = normalizeMonthQuery(value);
  if (!normalized) {
    return 'Month query parameter is required.';
  }
  return MONTH_PATTERN.test(normalized) ? null : 'Month must match YYYY-MM.';
}

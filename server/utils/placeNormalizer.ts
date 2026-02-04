export function normalizePlace(rawPlace: unknown): string {
  if (typeof rawPlace !== 'string') {
    return '';
  }

  const trimmed = rawPlace.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.replace(/\s+/g, ' ');
}

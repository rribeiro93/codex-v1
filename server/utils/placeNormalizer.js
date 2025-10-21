function normalizePlace(rawPlace) {
  if (typeof rawPlace !== 'string') {
    return '';
  }

  const trimmed = rawPlace.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.replace(/\s+/g, ' ');
}

module.exports = {
  normalizePlace
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

function getMonthNameFromIsoMonth(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return '';
  }

  const monthIndex = Number.parseInt(match[2], 10) - 1;
  if (Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return '';
  }

  return MONTH_NAMES[monthIndex] ?? '';
}

function extractIsoMonthFromFileName(fileName) {
  if (typeof fileName !== 'string') {
    return '';
  }

  const formatted = fileName.trim();
  if (!formatted) {
    return '';
  }

  const match = formatted.match(/Fatura(\d{4}-\d{2})-\d{2}\.csv$/i);
  return match ? match[1] : '';
}

function extractIsoMonthFromTransactions(transactions = []) {
  if (!Array.isArray(transactions)) {
    return '';
  }

  for (const transaction of transactions) {
    if (!transaction || typeof transaction.date !== 'string') {
      continue;
    }

    const match = transaction.date.match(/^(\d{4})-(\d{2})/);
    if (match) {
      return `${match[1]}-${match[2]}`;
    }
  }

  return '';
}

function resolveStatementMonthName(month, fileName, transactions, providedMonthName) {
  if (typeof providedMonthName === 'string') {
    const trimmed = providedMonthName.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  const candidates = [
    typeof month === 'string' ? month : '',
    extractIsoMonthFromFileName(fileName),
    extractIsoMonthFromTransactions(transactions)
  ].filter(Boolean);

  for (const isoMonth of candidates) {
    const monthName = getMonthNameFromIsoMonth(isoMonth);
    if (monthName) {
      return monthName;
    }
  }

  return '';
}

function sanitizeTransaction(transaction = {}) {
  if (!transaction || typeof transaction !== 'object') {
    return null;
  }

  const sanitized = {
    date: typeof transaction.date === 'string' ? transaction.date : '',
    place: typeof transaction.place === 'string' ? transaction.place : '',
    category: typeof transaction.category === 'string' ? transaction.category : '',
    owner: typeof transaction.owner === 'string' ? transaction.owner : '',
    amount: Number.isFinite(transaction.amount) ? transaction.amount : 0
  };

  if (transaction.installments && typeof transaction.installments === 'object') {
    const current = Number.parseInt(transaction.installments.current, 10);
    const total = Number.parseInt(transaction.installments.total, 10);

    if (Number.isFinite(current) && Number.isFinite(total)) {
      sanitized.installments = { current, total };
    }
  }

  return sanitized;
}

module.exports = {
  getMonthNameFromIsoMonth,
  extractIsoMonthFromFileName,
  extractIsoMonthFromTransactions,
  resolveStatementMonthName,
  sanitizeTransaction
};

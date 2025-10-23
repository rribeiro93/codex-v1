export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

export const formatCurrency = (value) => currencyFormatter.format(Number(value || 0));

export const formatTransactionDate = (value) => {
  if (typeof value !== 'string' || !value) {
    return 'N/A';
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  try {
    return dateFormatter.format(new Date(parsed));
  } catch (err) {
    console.error('Failed to format transaction date', err);
  }
  return value;
};

export const formatInstallments = (installments) => {
  if (!installments || typeof installments !== 'object') {
    return '-';
  }

  const current = Number.parseInt(installments.current, 10);
  const total = Number.parseInt(installments.total, 10);

  if (Number.isNaN(current) || Number.isNaN(total) || total <= 1) {
    return 'N/A';
  }

  return `${current}/${total}`;
};

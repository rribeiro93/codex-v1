import { InstallmentDetails } from '../../models/installment-details';

export const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short'
});

export const formatCurrency = (value: number | string) =>
  currencyFormatter.format(Number(value || 0));

export const formatTransactionDate = (value: string): string => {
  if (typeof value !== 'string' || !value) {
    return 'Não disponível';
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return value;
  }

  try {
    return dateFormatter.format(new Date(parsed));
  } catch (err) {
    console.error('Não foi possível formatar a data da transação', err);
  }
  return value;
};

export const formatInstallments = (
  installments: InstallmentDetails | null | undefined
): string => {
  if (!installments || typeof installments !== 'object') {
    return '-';
  }

  const current = Number(installments.current);
  const total = Number(installments.total);

  if (Number.isNaN(current) || Number.isNaN(total) || total <= 1) {
    return 'Não disponível';
  }

  return `${current}/${total}`;
};

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

  const isoDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
  const parsedDate = isoDateMatch
    ? new Date(
        Number.parseInt(isoDateMatch[1], 10),
        Number.parseInt(isoDateMatch[2], 10) - 1,
        Number.parseInt(isoDateMatch[3], 10)
      )
    : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  try {
    return dateFormatter.format(parsedDate);
  } catch (err) {
    console.error('Não foi possível formatar a data da transação', err);
  }
  return value;
};

export const formatInstallments = (
  installments: InstallmentDetails | null | undefined
): string => {
  if (!installments || typeof installments !== 'object') {
    return 'à vista';
  }

  const current = Number(installments.current);
  const total = Number(installments.total);

  if (Number.isNaN(current) || Number.isNaN(total) || total <= 1) {
    return 'Não disponível';
  }

  return `${current}/${total}`;
};

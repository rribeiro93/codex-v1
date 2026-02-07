"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatInstallments = exports.formatTransactionDate = exports.formatCurrency = exports.currencyFormatter = void 0;
exports.currencyFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
});
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short'
});
const formatCurrency = (value) => exports.currencyFormatter.format(Number(value || 0));
exports.formatCurrency = formatCurrency;
const formatTransactionDate = (value) => {
    if (typeof value !== 'string' || !value) {
        return 'Não disponível';
    }
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
        return value;
    }
    try {
        return dateFormatter.format(new Date(parsed));
    }
    catch (err) {
        console.error('Não foi possível formatar a data da transação', err);
    }
    return value;
};
exports.formatTransactionDate = formatTransactionDate;
const formatInstallments = (installments) => {
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
exports.formatInstallments = formatInstallments;

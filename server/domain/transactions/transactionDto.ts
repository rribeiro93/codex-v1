import type { TransactionInstallments } from './transactionTypes';

export interface TransactionSummaryMonthDto {
  month: string;
  monthName: string;
  totalAmount: number;
  installmentAmount: number;
  nonInstallmentAmount: number;
}

export interface TransactionsSummaryResponseDto {
  summary: TransactionSummaryMonthDto[];
  years: string[];
  selectedYear: string;
}

export interface CategorySummaryMonthDto {
  month: string;
  monthName: string;
  totalsByCategory: Record<string, number>;
}

export interface TransactionsCategorySummaryResponseDto {
  summary: CategorySummaryMonthDto[];
  years: string[];
  selectedYear: string;
  categories: Array<{ category: string; name: string }>;
}

export interface TransactionListItemDto {
  date: string;
  name: string;
  owner: string;
  amount: number;
  installments: TransactionInstallments | null;
  category: string;
  cleanName: string;
  mappingId: string;
  mappingTransaction: string;
}

export interface TransactionsListResponseDto {
  month: string;
  monthName: string;
  transactions: TransactionListItemDto[];
}

export interface TransactionMappingDto {
  id: string;
  cleanName: string;
  transaction: string;
  category: string;
  updatedAt: string;
}

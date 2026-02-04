export interface InstallmentDetails {
  current: number;
  total: number;
}

export interface CsvTransaction {
  date: string;
  place: string;
  category: string;
  owner: string;
  amount: number;
  installments: InstallmentDetails | null;
}

export interface StatementPayload {
  month: string;
  monthName: string;
  totalAmount: number;
  totalTransactions: number;
  transactions: CsvTransaction[];
}

export interface MonthlySummaryEntry {
  month: string;
  monthName: string;
  displayMonth?: string;
  totalAmount: number;
  installmentAmount: number;
  nonInstallmentAmount: number;
}

export interface MonthlyTransaction extends CsvTransaction {
  id: string;
  cleanName: string;
  fileName: string;
  mappingId: string;
  mappingTransaction: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  createdAtLabel: string;
  updatedAtLabel: string;
}

export interface PlaceMapping {
  id: string;
  cleanName: string;
  transaction: string;
  category: string;
  status: string;
  updatedAt: string;
}

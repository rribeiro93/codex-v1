export interface MonthlySummaryEntry {
  month: string;
  monthName: string;
  displayMonth?: string;
  totalAmount: number;
  installmentAmount: number;
  nonInstallmentAmount: number;
}
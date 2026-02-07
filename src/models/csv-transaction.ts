import { InstallmentDetails } from "./installment-details";

export interface CsvTransaction {
  date: string;
  place: string;
  category: string;
  owner: string;
  amount: number;
  installments: InstallmentDetails | null;
}
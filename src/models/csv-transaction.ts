import { InstallmentDetails } from "./installment-details";

export interface CsvTransaction {
  date: string;
  name: string;
  owner: string;
  amount: number;
  installments: InstallmentDetails | null;
}
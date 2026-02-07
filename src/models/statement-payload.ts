import { CsvTransaction } from "./csv-transaction";

export interface StatementPayload {
  month: string;
  monthName: string;
  totalAmount: number;
  totalTransactions: number;
  transactions: CsvTransaction[];
}
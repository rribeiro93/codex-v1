import { CsvTransaction } from "./csv-transaction";

export interface MonthlyTransaction extends CsvTransaction {
  id: string;
  cleanName: string;
  fileName: string;
  mappingId: string;
  mappingTransaction: string;
}
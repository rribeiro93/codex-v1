import { ObjectId } from "mongodb";
import { CsvTransaction } from "../../../src/models/csv-transaction";

export interface StatementDocument {
  _id?: ObjectId;
  month?: string;
  fileName?: string;
  monthName?: string;
  totalAmount?: number;
  totalTransactions?: number;
  transactions?: CsvTransaction[];
  createdAt?: Date;
  updatedAt?: Date;
}
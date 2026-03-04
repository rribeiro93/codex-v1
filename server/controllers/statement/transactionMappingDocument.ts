import { ObjectId } from "mongodb";

export interface TransactionMappingDocument {
  _id?: ObjectId;
  transaction?: string;
  cleanName?: string;
  category?: string;
}
import { ObjectId } from "mongodb";

export interface TransactionDocument {
  _id?: ObjectId | string;
  cleanName?: string;
  text?: string;
  transaction?: string;
  sourcePlace?: string;
  category?: string;
  updatedAt?: Date | string;
}
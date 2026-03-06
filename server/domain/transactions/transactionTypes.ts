import { ObjectId } from 'mongodb';

export interface TransactionInstallments {
  current: number;
  total: number;
}

export interface TransactionRecord {
  _id?: ObjectId | string;
  competenceYear?: string;
  competenceMonth?: string;
  competenceRef?: string;
  sourceFileName?: string;
  importBatchId?: string;
  date?: string;
  paymentMethod?: string;
  name?: string;
  amount?: number;
  owner?: string;
  category?: string;
  installments?: TransactionInstallments | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface TransactionMappingRecord {
  _id?: ObjectId | string;
  cleanName?: string;
  text?: string;
  transaction?: string;
  sourcePlace?: string;
  category?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

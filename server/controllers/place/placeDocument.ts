import { ObjectId } from "mongodb";

export interface PlaceDocument {
  _id?: ObjectId | string;
  cleanName?: string;
  text?: string;
  transaction?: string;
  sourcePlace?: string;
  category?: string;
  status?: string;
  updatedAt?: Date | string;
}
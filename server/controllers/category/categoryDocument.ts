import { ObjectId } from "mongodb";

export interface CategoryDocument {
  _id?: ObjectId | string;
  name?: string;
  category?: string;
  createdAt?: Date | string | number;
  updatedAt?: Date | string | number;
}
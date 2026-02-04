import { Request, Response } from 'express';
import { Db, ObjectId } from 'mongodb';

interface CategoryDocument {
  _id?: ObjectId | string;
  name?: string;
  category?: string;
  createdAt?: Date | string | number;
  updatedAt?: Date | string | number;
}

interface CategoryResponse {
  id: string;
  name: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

function sanitizeName(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  return trimmed;
}

function deriveCategoryEnum(name: string): string {
  const sanitized = sanitizeName(name);
  if (!sanitized) {
    return '';
  }

  const withoutDiacritics = sanitized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return withoutDiacritics.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function formatCategoryDocument(doc: CategoryDocument | null | undefined): CategoryResponse | null {
  if (!doc || typeof doc !== 'object') {
    return null;
  }

  const id = doc._id ? String(doc._id) : '';
  if (!id) {
    return null;
  }

  const name = sanitizeName(typeof doc.name === 'string' ? doc.name : '');
  const categoryValue =
    typeof doc.category === 'string' && doc.category.trim()
      ? doc.category.trim()
      : deriveCategoryEnum(name);

  const createdAtValue = doc.createdAt ? new Date(doc.createdAt) : null;
  const updatedAtValue = doc.updatedAt ? new Date(doc.updatedAt) : null;

  return {
    id,
    name,
    category: categoryValue,
    createdAt: createdAtValue ? createdAtValue.toISOString() : '',
    updatedAt: updatedAtValue ? updatedAtValue.toISOString() : ''
  };
}

function resolveDb(req: Request): Db {
  const db = req.app.locals.db as Db | undefined;
  if (!db) {
    throw new Error('Database connection is not available in app locals.');
  }
  return db;
}

export async function handleGetCategories(req: Request, res: Response) {
  const db = resolveDb(req);
  try {
    const rawCategories = await db
      .collection<CategoryDocument>('categories')
      .find(
        {},
        {
          projection: {
            name: 1,
            category: 1,
            createdAt: 1,
            updatedAt: 1
          }
        }
      )
      .sort({ name: 1 })
      .toArray();

    const categories = rawCategories.map(formatCategoryDocument).filter(Boolean);
    return res.status(200).json({ categories });
  } catch (error) {
    console.error('Failed to load categories list', error);
    return res.status(500).json({ error: 'Failed to load categories.' });
  }
}

export async function handleCreateCategory(req: Request, res: Response) {
  const db = resolveDb(req);
  const name = sanitizeName(req.body?.name);
  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  const category = deriveCategoryEnum(name);
  if (!category) {
    return res.status(400).json({ error: 'Category identifier is invalid.' });
  }

  try {
    const existingCategory = await db.collection<CategoryDocument>('categories').findOne({ category });
    if (existingCategory) {
      return res.status(409).json({ error: 'Category already exists.' });
    }

    const now = new Date();
    const document = {
      name,
      category,
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection('categories').insertOne(document);
    const responseDocument = { ...document, _id: result.insertedId };
    const formatted = formatCategoryDocument(responseDocument);

    return res.status(201).json({ category: formatted });
  } catch (error) {
    console.error('Failed to create category', error);
    return res.status(500).json({ error: 'Failed to create category.' });
  }
}

export async function handleUpdateCategory(req: Request, res: Response) {
  const db = resolveDb(req);
  const id = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  const name = sanitizeName(req.body?.name);

  if (!id) {
    return res.status(400).json({ error: 'Category identifier is required.' });
  }
  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid category identifier.' });
  }

  const category = deriveCategoryEnum(name);
  if (!category) {
    return res.status(400).json({ error: 'Category identifier is invalid.' });
  }

  try {
    const existingCategory = await db
      .collection('categories')
      .findOne({ category, _id: { $ne: objectId } });

    if (existingCategory) {
      return res.status(409).json({ error: 'Another category already uses this identifier.' });
    }

    const now = new Date();
    const result = await db.collection('categories').findOneAndUpdate(
      { _id: objectId },
      {
        $set: {
          name,
          category,
          updatedAt: now
        }
      },
      {
        returnDocument: 'after'
      }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const formatted = formatCategoryDocument(result.value);
    return res.status(200).json({ category: formatted });
  } catch (error) {
    console.error('Failed to update category', error);
    return res.status(500).json({ error: 'Failed to update category.' });
  }
}

export async function handleDeleteCategory(req: Request, res: Response) {
  const db = resolveDb(req);
  const id = typeof req.params?.id === 'string' ? req.params.id.trim() : '';

  if (!id) {
    return res.status(400).json({ error: 'Category identifier is required.' });
  }

  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid category identifier.' });
  }

  try {
    const result = await db.collection('categories').findOneAndDelete({ _id: objectId });
    if (!result.value) {
      return res.status(404).json({ error: 'Category not found.' });
    }

    const formatted = formatCategoryDocument(result.value);
    return res.status(200).json({ category: formatted });
  } catch (error) {
    console.error('Failed to delete category', error);
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
}

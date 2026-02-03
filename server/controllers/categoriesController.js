const { ObjectId } = require('mongodb');

function sanitizeName(value) {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  return trimmed;
}

function deriveCategoryEnum(name) {
  const sanitized = sanitizeName(name);
  if (!sanitized) {
    return '';
  }

  const withoutDiacritics = sanitized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return withoutDiacritics.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function formatCategoryDocument(doc) {
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

async function handleGetCategories(req, res) {
  const db = req.app.locals.db;
  try {
    const rawCategories = await db
      .collection('categories')
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

async function handleCreateCategory(req, res) {
  const db = req.app.locals.db;
  const name = sanitizeName(req.body?.name);
  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  const category = deriveCategoryEnum(name);
  if (!category) {
    return res.status(400).json({ error: 'Category identifier is invalid.' });
  }

  try {
    const existingCategory = await db.collection('categories').findOne({ category });
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

async function handleUpdateCategory(req, res) {
  const db = req.app.locals.db;
  const id = typeof req.params?.id === 'string' ? req.params.id.trim() : '';
  const name = sanitizeName(req.body?.name);

  if (!id) {
    return res.status(400).json({ error: 'Category identifier is required.' });
  }
  if (!name) {
    return res.status(400).json({ error: 'Category name is required.' });
  }

  let objectId;
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

async function handleDeleteCategory(req, res) {
  const db = req.app.locals.db;
  const id = typeof req.params?.id === 'string' ? req.params.id.trim() : '';

  if (!id) {
    return res.status(400).json({ error: 'Category identifier is required.' });
  }

  let objectId;
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

module.exports = {
  handleGetCategories,
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory
};

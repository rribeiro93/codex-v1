const { ObjectId } = require('mongodb');

function formatPlaceDocument(doc) {
  if (!doc || typeof doc !== 'object') {
    return null;
  }

  const id = doc._id ? String(doc._id) : '';
  if (!id) {
    return null;
  }

  const cleanNameValue = typeof doc.cleanName === 'string' ? doc.cleanName.trim() : '';
  const textValue = typeof doc.text === 'string' ? doc.text.trim() : '';
  const transactionValue = typeof doc.transaction === 'string' ? doc.transaction.trim() : '';
  const sourcePlaceValue = typeof doc.sourcePlace === 'string' ? doc.sourcePlace.trim() : '';
  const cleanNameSource = cleanNameValue || textValue;
  const transactionSource = transactionValue || sourcePlaceValue;

  const updatedAtValue = doc.updatedAt ? new Date(doc.updatedAt) : null;

  return {
    id,
    cleanName: cleanNameSource,
    transaction: transactionSource,
    category: typeof doc.category === 'string' ? doc.category : '',
    status: typeof doc.status === 'string' ? doc.status.trim() : '',
    updatedAt: updatedAtValue ? updatedAtValue.toISOString() : ''
  };
}

async function handleGetPlaces(req, res) {
  const db = req.app.locals.db;

  try {
    const rawPlaces = await db
      .collection('transaction_mappings')
      .find(
        {},
        {
          projection: {
            cleanName: 1,
            transaction: 1,
            text: 1,
            sourcePlace: 1,
            category: 1,
            status: 1,
            updatedAt: 1
          }
        }
      )
      .sort({ transaction: 1 })
      .toArray();

    const places = rawPlaces.map(formatPlaceDocument).filter(Boolean);

    return res.status(200).json({ places });
  } catch (error) {
    console.error('Failed to load places', error);
    return res.status(500).json({ error: 'Failed to load places.' });
  }
}

async function handleUpdatePlaceCategories(req, res) {
  const db = req.app.locals.db;
  const updatesPayload = Array.isArray(req.body?.updates) ? req.body.updates : [];

  if (!updatesPayload.length) {
    return res.status(400).json({ error: 'Updates payload must contain at least one item.' });
  }

  const operations = [];
  const now = new Date();

  for (const item of updatesPayload) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const id = typeof item.id === 'string' ? item.id.trim() : '';
    const category = typeof item.category === 'string' ? item.category.trim() : '';

    if (!id) {
      continue;
    }

    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      continue;
    }

    operations.push({
      updateOne: {
        filter: { _id: objectId },
        update: {
          $set: {
            category,
            status: category ? 'labeled' : 'pending',
            updatedAt: now
          }
        }
      }
    });
  }

  if (!operations.length) {
    return res.status(400).json({ error: 'No valid updates were provided.' });
  }

  try {
    const result = await db.collection('places').bulkWrite(operations, { ordered: false });
    const modified = result?.modifiedCount ?? 0;
    const matched = result?.matchedCount ?? 0;

    return res.status(200).json({
      updatedCount: modified,
      matchedCount: matched
    });
  } catch (error) {
    console.error('Failed to update place categories', error);
    return res.status(500).json({ error: 'Failed to update place categories.' });
  }
}

module.exports = {
  handleGetPlaces,
  handleUpdatePlaceCategories
};

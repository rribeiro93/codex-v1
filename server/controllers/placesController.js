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

async function handleUpdateSinglePlaceCategory(req, res) {
  const db = req.app.locals.db;
  const idValue = typeof req.body?.id === 'string' ? req.body.id.trim() : '';
  const transactionValue =
    typeof req.body?.transaction === 'string' ? req.body.transaction.trim() : '';
  const rawCategoryValue = typeof req.body?.category === 'string' ? req.body.category : undefined;
  const rawCleanNameValue = typeof req.body?.cleanName === 'string' ? req.body.cleanName : undefined;
  const categoryValue =
    typeof rawCategoryValue === 'string' ? rawCategoryValue.trim() : undefined;
  const cleanNameValue =
    typeof rawCleanNameValue === 'string' ? rawCleanNameValue.trim() : undefined;
  const updateCategory = categoryValue;

  if (!idValue && !transactionValue) {
    return res
      .status(400)
      .json({ error: 'Either a place identifier or transaction text must be provided.' });
  }

  if (typeof rawCategoryValue === 'undefined' && typeof rawCleanNameValue === 'undefined') {
    return res
      .status(400)
      .json({ error: 'At least one of cleanName or category must be provided.' });
  }

  let filter;
  let upsert = false;
  if (idValue) {
    try {
      filter = { _id: new ObjectId(idValue) };
    } catch (error) {
      return res.status(400).json({ error: 'Invalid place identifier provided.' });
    }
  } else {
    if (!transactionValue) {
      return res.status(400).json({ error: 'Transaction text is required to create a mapping.' });
    }
    filter = { transaction: transactionValue };
    upsert = true;
  }

  const now = new Date();
  const updatePayload = {
    $set: {
      updatedAt: now
    }
  };

  if (typeof rawCategoryValue !== 'undefined') {
    updatePayload.$set.category = updateCategory || '';
    updatePayload.$set.status = updateCategory ? 'labeled' : 'pending';
  }

  if (typeof rawCleanNameValue !== 'undefined') {
    updatePayload.$set.cleanName = cleanNameValue || '';
  }

  if (upsert) {
    const setOnInsertPayload = {
      transaction: transactionValue,
      text: '',
      sourcePlace: transactionValue,
      createdAt: now
    };

    if (typeof rawCleanNameValue === 'undefined') {
      setOnInsertPayload.cleanName = '';
    }

    updatePayload.$setOnInsert = setOnInsertPayload;
  }

  try {
    const result = await db.collection('transaction_mappings').findOneAndUpdate(
      filter,
      updatePayload,
      {
        returnDocument: 'after',
        upsert
      }
    );

    let resolvedDocument = result.value;
    if (!resolvedDocument) {
      const lookupQuery = idValue ? { _id: filter._id } : { transaction: transactionValue };
      const upsertedId =
        result?.lastErrorObject?.upserted ?? result?.lastErrorObject?.upsertedId ?? null;

      if (upsertedId) {
        const resolvedId =
          typeof upsertedId === 'object' && upsertedId !== null ? upsertedId : new ObjectId(upsertedId);
        resolvedDocument = await db.collection('transaction_mappings').findOne({ _id: resolvedId });
      }

      if (!resolvedDocument) {
        resolvedDocument = await db.collection('transaction_mappings').findOne(lookupQuery);
      }
    }

    if (!resolvedDocument) {
      return res.status(404).json({ error: 'Place not found.' });
    }

    const formatted = formatPlaceDocument(resolvedDocument);
    if (!formatted) {
      return res.status(200).json({ place: null });
    }

    return res.status(200).json({ place: formatted });
  } catch (error) {
    console.error('Failed to update single place category', error);
    return res.status(500).json({ error: 'Failed to update place category.' });
  }
}

module.exports = {
  handleUpdateSinglePlaceCategory
};

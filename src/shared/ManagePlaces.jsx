import React, { useEffect, useMemo, useState } from 'react';

function formatUpdatedAt(value) {
  if (!value || typeof value !== 'string') {
    return 'Not updated yet';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Not updated yet';
  }

  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function createPlaceViewModel(place) {
  if (!place || typeof place !== 'object') {
    return null;
  }

  const id = typeof place.id === 'string' ? place.id : '';
  if (!id) {
    return null;
  }

  const cleanName = typeof place.cleanName === 'string' ? place.cleanName.trim() : '';
  const transaction = typeof place.transaction === 'string' ? place.transaction.trim() : '';
  const category = typeof place.category === 'string' ? place.category : '';

  const updatedAt =
    typeof place.updatedAt === 'string' && place.updatedAt
      ? place.updatedAt
      : typeof place.updatedAt === 'number'
        ? new Date(place.updatedAt).toISOString()
        : '';

  return {
    id,
    cleanName,
    transaction,
    displayName: cleanName || transaction || 'Unknown place',
    category,
    originalCategory: category,
    status: typeof place.status === 'string' ? place.status.trim() : '',
    updatedAt,
    updatedAtLabel: formatUpdatedAt(updatedAt)
  };
}

export default function ManagePlaces() {
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadPlaces = async () => {
      if (typeof fetch !== 'function') {
        setError('Fetch API is not available in this environment.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await fetch('/api/places');
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const body = await response.json();
        const receivedPlaces = Array.isArray(body?.places) ? body.places : [];
        const mapped = receivedPlaces
          .map(createPlaceViewModel)
          .filter(Boolean);

        if (isMounted) {
          setPlaces(mapped);
        }
      } catch (fetchError) {
        console.error('Failed to load places list', fetchError);
        if (isMounted) {
          setError('Failed to load places from the database. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPlaces();

    return () => {
      isMounted = false;
    };
  }, []);

  const pendingUpdates = useMemo(
    () =>
      places
        .map((place) => {
          const current = typeof place.category === 'string' ? place.category.trim() : '';
          const original =
            typeof place.originalCategory === 'string' ? place.originalCategory.trim() : '';

          if (current === original) {
            return null;
          }

          return {
            id: place.id,
            category: typeof place.category === 'string' ? place.category.trim() : ''
          };
        })
        .filter(Boolean),
    [places]
  );

  const hasChanges = pendingUpdates.length > 0;

  const categorizedCount = useMemo(() => {
    if (!places.length) {
      return 0;
    }

    return places.reduce((acc, place) => {
      const status = typeof place.status === 'string' ? place.status.toLowerCase() : '';
      if (status === 'labeled') {
        return acc + 1;
      }
      return acc;
    }, 0);
  }, [places]);

  const pendingCount = useMemo(() => {
    if (!places.length) {
      return 0;
    }

    return places.reduce((acc, place) => {
      const status = typeof place.status === 'string' ? place.status.toLowerCase() : '';
      if (status === 'pending' || (!status && !place.category)) {
        return acc + 1;
      }
      return acc;
    }, 0);
  }, [places]);

  const handleCategoryChange = (placeId, value) => {
    setSaveMessage('');
    setPlaces((previousPlaces) =>
      previousPlaces.map((place) => {
        if (place.id !== placeId) {
          return place;
        }

        return {
          ...place,
          category: value
        };
      })
    );
  };

  const handleSave = async () => {
    if (!hasChanges || typeof fetch !== 'function') {
      return;
    }

    const updates = pendingUpdates;

    setIsSaving(true);
    setError('');
    setSaveMessage('');

    try {
      const response = await fetch('/api/places/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const body = await response.json();
      const updatedCount = Number.isFinite(body?.updatedCount) ? body.updatedCount : 0;
      const matchedCount = Number.isFinite(body?.matchedCount) ? body.matchedCount : 0;

      const updatedAtIso = new Date().toISOString();

      setPlaces((previousPlaces) =>
        previousPlaces.map((place) => {
          const update = updates.find((item) => item.id === place.id);
          if (!update) {
            return place;
          }
          const trimmedCategory =
            typeof update.category === 'string' ? update.category.trim() : '';
          const nextStatus = trimmedCategory ? 'labeled' : 'pending';
          return {
            ...place,
            category: trimmedCategory,
            originalCategory: trimmedCategory,
            status: nextStatus,
            updatedAt: updatedAtIso,
            updatedAtLabel: formatUpdatedAt(updatedAtIso)
          };
        })
      );

      setSaveMessage(
        `Saved changes for ${updatedCount} place${updatedCount === 1 ? '' : 's'} (matched ${matchedCount}).`
      );
    } catch (saveError) {
      console.error('Failed to update place categories', saveError);
      setError('Failed to save the updated categories. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section style={styles.wrapper}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.title}>Manage Places</h2>
          <div style={styles.subtitleWrapper}>
            <p style={styles.subtitleLine}>Categorized: {categorizedCount}</p>
            <p style={styles.subtitleLine}>Pending: {pendingCount}</p>
          </div>
        </div>
        <button
          type="button"
          style={{
            ...styles.saveButton,
            ...(hasChanges && !isSaving ? styles.saveButtonActive : {}),
            ...(isSaving ? styles.saveButtonDisabled : {})
          }}
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save changes'}
        </button>
      </header>

      {isLoading && <p style={styles.message}>Loading places...</p>}
      {!isLoading && error && <p style={styles.error}>{error}</p>}
      {!isLoading && !error && !places.length && (
        <p style={styles.message}>No places found yet. Upload statements to extract places.</p>
      )}
      {!isLoading && saveMessage && <p style={styles.success}>{saveMessage}</p>}

      {!isLoading && !error && places.length > 0 && (
        <div style={styles.list} role="grid" aria-label="Places categories">
          {places.map((place) => (
            <div key={place.id} style={styles.row} role="row">
              <div style={styles.placeInfo} role="gridcell">
                <p style={styles.placeName}>{place.displayName}</p>
                {place.transaction && place.transaction !== place.displayName && (
                  <p style={styles.placeSource}>Transaction: {place.transaction}</p>
                )}
                <p style={styles.placeMeta}>Updated: {place.updatedAtLabel}</p>
              </div>
              <div style={styles.inputWrapper} role="gridcell">
                <input
                  type="text"
                  value={place.category}
                  onChange={(event) => handleCategoryChange(place.id, event.target.value)}
                  placeholder="Enter a category"
                  style={styles.input}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const styles = {
  wrapper: {
    width: 'min(960px, 100%)',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1.5rem',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: '1.5rem 2rem',
    borderRadius: '1rem',
    border: '1px solid rgba(148, 163, 184, 0.25)'
  },
  title: {
    margin: 0,
    fontSize: '1.75rem'
  },
  subtitleWrapper: {
    margin: '0.5rem 0 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem'
  },
  saveButton: {
    padding: '0.75rem 1.75rem',
    borderRadius: '9999px',
    border: '1px solid rgba(148, 163, 184, 0.4)',
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    color: '#e2e8f0',
    fontWeight: 600,
    cursor: 'not-allowed',
    transition: 'background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease'
  },
  saveButtonActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
    color: '#0f172a',
    cursor: 'pointer',
    boxShadow: '0 12px 24px rgba(56, 189, 248, 0.25)',
    transform: 'translateY(-1px)'
  },
  saveButtonDisabled: {
    opacity: 0.7,
    cursor: 'wait'
  },
  message: {
    margin: '0 0 0 0.5rem',
    color: '#cbd5f5'
  },
  error: {
    margin: '0 0 0 0.5rem',
    color: '#f87171'
  },
  success: {
    margin: '0 0 0 0.5rem',
    color: '#4ade80'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '.2rem',
    maxHeight: '80vh',
    overflowY: 'auto',
    paddingRight: '0.5rem'
  },
  row: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    padding: '1rem 1.5rem',
    justifyContent: 'center'
  },
  placeInfo: {
    flex: '1 1 360px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem'
  },
  placeName: {
    margin: 0,
    fontWeight: 600,
    fontSize: '1rem',
    color: '#f8fafc'
  },
  placeSource: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '0.85rem'
  },
  placeMeta: {
    margin: 0,
    color: '#cbd5f5',
    fontSize: '0.8rem'
  },
  inputWrapper: {
    flex: '1 1 220px',
    display: 'flex',
    alignItems: 'center'
  },
  input: {
    width: '100%',
    padding: '0.65rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    color: '#f1f5f9',
    fontSize: '0.95rem'
  }
};

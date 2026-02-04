import React, { useEffect, useRef, useState } from 'react';

function formatTimestamp(value) {
  if (!value || typeof value !== 'string') {
    return 'Não disponível';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Não disponível';
  }

  return parsed.toLocaleString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function createCategoryViewModel(category) {
  if (!category || typeof category !== 'object') {
    return null;
  }

  const id =
    typeof category.id === 'string'
      ? category.id
      : typeof category._id === 'string'
        ? category._id
        : '';

  if (!id) {
    return null;
  }

  const name = typeof category.name === 'string' ? category.name.trim() : '';
  const code = typeof category.category === 'string' ? category.category.trim() : '';
  const createdAt =
    typeof category.createdAt === 'string' && category.createdAt
      ? category.createdAt
      : typeof category.createdAt === 'number'
        ? new Date(category.createdAt).toISOString()
        : '';
  const updatedAt =
    typeof category.updatedAt === 'string' && category.updatedAt
      ? category.updatedAt
      : typeof category.updatedAt === 'number'
        ? new Date(category.updatedAt).toISOString()
        : '';

  return {
    id,
    name: name || 'Categoria sem nome',
    category: code || 'UNDEFINED',
    createdAt,
    updatedAt,
    createdAtLabel: formatTimestamp(createdAt),
    updatedAtLabel: formatTimestamp(updatedAt)
  };
}

function sortCategories(list) {
  return [...list].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      sensitivity: 'base'
    })
  );
}

export default function ManagePlaces() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [editingName, setEditingName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState('');
  const deletingIdsRef = useRef(new Set());

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      if (typeof fetch !== 'function') {
        setError('A Fetch API não está disponível neste ambiente.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');
      setMessage('');

      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const body = await response.json();
        const receivedCategories = Array.isArray(body?.categories) ? body.categories : [];
        const mapped = sortCategories(
          receivedCategories.map(createCategoryViewModel).filter(Boolean)
        );

        if (isMounted) {
          setCategories(mapped);
        }
      } catch (fetchError) {
        console.error('Não foi possível carregar as categorias', fetchError);
        if (isMounted) {
          setError('Não foi possível carregar as categorias do banco de dados. Tente novamente.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateCategory = async () => {
    if (isCreating || typeof fetch !== 'function') {
      return;
    }

    const trimmedName = typeof newCategoryName === 'string' ? newCategoryName.trim() : '';
    if (!trimmedName) {
      setError('Informe um nome de categoria antes de adicionar.');
      return;
    }

    setIsCreating(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: trimmedName })
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const body = await response.json();
      const created = createCategoryViewModel(body?.category);
      if (!created) {
        throw new Error('Resposta inválida de categoria retornada pelo servidor.');
      }

      setCategories((previous) => sortCategories([...(previous || []), created]));
      setNewCategoryName('');
      setMessage(`Categoria "${created.name}" (${created.category}) adicionada.`);
    } catch (createError) {
      console.error('Não foi possível criar a categoria', createError);
      setError('Não foi possível adicionar a categoria. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (category) => {
    setEditingCategoryId(category.id);
    setEditingName(category.name);
    setMessage('');
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingCategoryId('');
    setEditingName('');
  };

  const handleUpdateCategory = async () => {
    if (!editingCategoryId || isUpdating || typeof fetch !== 'function') {
      return;
    }

    const trimmedName = typeof editingName === 'string' ? editingName.trim() : '';
    if (!trimmedName) {
      setError('Informe um nome de categoria antes de salvar.');
      return;
    }

    setIsUpdating(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/categories/${editingCategoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: trimmedName })
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const body = await response.json();
      const updated = createCategoryViewModel(body?.category);
      if (!updated) {
        throw new Error('Resposta inválida de categoria retornada pelo servidor.');
      }

      setCategories((previous) =>
        sortCategories(previous.map((item) => (item.id === updated.id ? updated : item)))
      );
      setEditingCategoryId('');
      setEditingName('');
      setMessage(`Categoria atualizada para "${updated.name}" (${updated.category}).`);
    } catch (updateError) {
      console.error('Não foi possível atualizar a categoria', updateError);
      setError('Não foi possível atualizar a categoria. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!categoryId || typeof fetch !== 'function') {
      return;
    }

    if (deletingIdsRef.current.has(categoryId)) {
      return;
    }

    const targetCategory = categories.find((category) => category.id === categoryId);
    if (!targetCategory) {
      return;
    }

    const confirmMessage = `Excluir a categoria "${targetCategory.name}" (${targetCategory.category})? Essa ação não pode ser desfeita.`;
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const shouldProceed = window.confirm(confirmMessage);
      if (!shouldProceed) {
        return;
      }
    }

    deletingIdsRef.current.add(categoryId);
    setDeletingCategoryId(categoryId);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      });

      if (response.status === 404) {
        setCategories((previous) => previous.filter((category) => category.id !== categoryId));
        if (editingCategoryId === categoryId) {
          setEditingCategoryId('');
          setEditingName('');
        }
        setMessage(
          `A categoria "${targetCategory.name}" (${targetCategory.category}) já havia sido removida.`
        );
        return;
      }

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      setCategories((previous) => previous.filter((category) => category.id !== categoryId));
      if (editingCategoryId === categoryId) {
        setEditingCategoryId('');
        setEditingName('');
      }
      setMessage(`Categoria "${targetCategory.name}" (${targetCategory.category}) removida.`);
    } catch (deleteError) {
      console.error('Não foi possível excluir a categoria', deleteError);
      setError('Não foi possível excluir a categoria. Tente novamente.');
    } finally {
      deletingIdsRef.current.delete(categoryId);
      setDeletingCategoryId('');
    }
  };

  return (
    <section style={styles.wrapper}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.title}>Gerenciar Categorias</h2>
          <p style={styles.subtitle}>Crie, liste e edite as categorias disponíveis.</p>
        </div>
      </header>

      <div style={styles.card} aria-label="Criar categoria">
        <h3 style={styles.cardTitle}>Adicionar categoria</h3>
        <p style={styles.cardHint}>
          Os nomes são convertidos em identificadores em maiúsculas, sem espaços ou caracteres especiais.
        </p>
        <div style={styles.formRow}>
          <input
            type="text"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder="Digite o nome da categoria"
            style={styles.input}
            disabled={isCreating}
          />
          <button
            type="button"
            onClick={handleCreateCategory}
            style={{
              ...styles.primaryButton,
              ...(isCreating ? styles.buttonDisabled : {})
            }}
            disabled={!newCategoryName.trim() || isCreating}
          >
            {isCreating ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </div>

      {isLoading && <p style={styles.message}>Carregando categorias...</p>}
      {!isLoading && error && <p style={styles.error}>{error}</p>}
      {!isLoading && message && <p style={styles.success}>{message}</p>}
      {!isLoading && !error && !categories.length && (
        <p style={styles.message}>Ainda não há categorias. Use o formulário acima para criar uma.</p>
      )}

      {!isLoading && !error && categories.length > 0 && (
        <div style={styles.list} role="grid" aria-label="Lista de categorias">
          {categories.map((category) => {
            const isEditing = category.id === editingCategoryId;
            return (
              <div key={category.id} style={styles.row} role="row">
                <div style={styles.categoryInfo} role="gridcell">
                  <p style={styles.categoryName}>{category.name}</p>
                  <p style={styles.categoryCode}>Enum: {category.category}</p>
                  <p style={styles.categoryMeta}>
                    Atualizado: {category.updatedAtLabel} • Criado: {category.createdAtLabel}
                  </p>
                </div>
                <div style={styles.actionCell} role="gridcell">
                  {isEditing ? (
                    <div style={styles.editRow}>
                      <input
                        type="text"
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        style={styles.input}
                        placeholder="Digite o nome da categoria"
                        disabled={isUpdating}
                      />
                      <button
                        type="button"
                        onClick={handleUpdateCategory}
                        style={{
                          ...styles.primaryButton,
                          ...(isUpdating ? styles.buttonDisabled : {})
                        }}
                        disabled={!editingName.trim() || isUpdating}
                      >
                        {isUpdating ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        style={styles.secondaryButton}
                        disabled={isUpdating}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div style={styles.buttonGroup}>
                      <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={() => handleStartEdit(category)}
                        disabled={deletingCategoryId === category.id}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        style={{
                          ...styles.dangerButton,
                          ...(deletingCategoryId === category.id ? styles.buttonDisabled : {})
                        }}
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={deletingCategoryId === category.id}
                      >
                        {deletingCategoryId === category.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
    gap: '1.25rem'
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
  subtitle: {
    margin: '0.5rem 0 0',
    color: '#cbd5f5'
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: '1rem',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    padding: '1.5rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  cardTitle: {
    margin: 0,
    fontSize: '1.25rem'
  },
  cardHint: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '0.9rem'
  },
  formRow: {
    display: 'flex',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  input: {
    flex: '1 1 260px',
    minWidth: '220px',
    padding: '0.65rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    color: '#f1f5f9',
    fontSize: '0.95rem'
  },
  primaryButton: {
    padding: '0.75rem 1.75rem',
    borderRadius: '9999px',
    border: '1px solid rgba(56, 189, 248, 0.8)',
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease'
  },
  secondaryButton: {
    padding: '0.65rem 1.25rem',
    borderRadius: '9999px',
    border: '1px solid rgba(148, 163, 184, 0.4)',
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    color: '#e2e8f0',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease'
  },
  dangerButton: {
    padding: '0.65rem 1.25rem',
    borderRadius: '9999px',
    border: '1px solid rgba(248, 113, 113, 0.5)',
    backgroundColor: 'rgba(248, 113, 113, 0.2)',
    color: '#fecaca',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease'
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
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
    gap: '.4rem',
    maxHeight: '70vh',
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
    justifyContent: 'space-between',
    flexWrap: 'wrap'
  },
  categoryInfo: {
    flex: '2 1 360px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem'
  },
  categoryName: {
    margin: 0,
    fontWeight: 600,
    fontSize: '1rem',
    color: '#f8fafc'
  },
  categoryCode: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '0.85rem'
  },
  categoryMeta: {
    margin: 0,
    color: '#cbd5f5',
    fontSize: '0.8rem'
  },
  actionCell: {
    flex: '1 1 240px',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  editRow: {
    display: 'flex',
    flex: '1 1 auto',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  buttonGroup: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    justifyContent: 'flex-end'
  }
};

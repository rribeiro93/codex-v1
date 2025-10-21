import React from 'react';

const styles = {
  pagination: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  },
  yearButton: {
    padding: '0.5rem 1.1rem',
    borderRadius: '9999px',
    border: '1px solid rgba(148, 163, 184, 0.35)',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'background-color 0.2s ease, transform 0.2s ease'
  },
  yearButtonActive: {
    backgroundColor: '#38bdf8',
    color: '#0f172a',
    transform: 'translateY(-2px)'
  }
};

export default function YearPagination({ years, selectedYear, isLoading, onSelect }) {
  if (!years.length) {
    return null;
  }

  return (
    <nav style={styles.pagination} aria-label="Years">
      {years.map((yearOption) => {
        const isActive = yearOption === selectedYear;
        return (
          <button
            key={yearOption}
            type="button"
            onClick={() => onSelect(yearOption)}
            style={{
              ...styles.yearButton,
              ...(isActive ? styles.yearButtonActive : null)
            }}
            disabled={isLoading}
          >
            {yearOption}
          </button>
        );
      })}
    </nav>
  );
}

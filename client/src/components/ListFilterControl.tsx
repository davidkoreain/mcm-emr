import React from 'react';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export interface FilterField {
  key: string;
  label: string;
  options: { label: string; value: string }[];
}

export interface SortOption {
  label: string;
  value: string;
}

interface ListFilterControlProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterField[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  sortValue: string;
  sortOptions: SortOption[];
  onSortChange: (value: string) => void;
  totalCount?: number;
  filteredCount?: number;
}

const chipStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.45rem',
  background: '#f1f5f9',
  padding: '0.4rem 0.75rem',
  borderRadius: '0.5rem',
  border: '1px solid #e2e8f0',
};

const selectStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '0.82rem',
  color: '#1e293b',
  outline: 'none',
  cursor: 'pointer',
};

const ListFilterControl: React.FC<ListFilterControlProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  filterValues = {},
  onFilterChange,
  sortValue,
  sortOptions,
  onSortChange,
  totalCount,
  filteredCount,
}) => {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>

        {filters.map((field) => (
          <div key={field.key} style={chipStyle}>
            <SlidersHorizontal size={13} color="#64748b" />
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600', whiteSpace: 'nowrap' }}>
              {field.label}
            </span>
            <select
              value={filterValues[field.key] ?? ''}
              onChange={(e) => onFilterChange?.(field.key, e.target.value)}
              style={selectStyle}
            >
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ))}

        <div style={chipStyle}>
          <ArrowUpDown size={13} color="#64748b" />
          <select
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value)}
            style={selectStyle}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {totalCount !== undefined && filteredCount !== undefined && (
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.45rem' }}>
          {filteredCount === totalCount
            ? `${totalCount} items`
            : `Showing ${filteredCount} of ${totalCount}`}
        </div>
      )}
    </div>
  );
};

export default ListFilterControl;

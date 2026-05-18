import { useState, useEffect } from 'react';

export type ViewMode = 'grid' | 'list';

const STORAGE_PREFIX = 'emr_view_mode_';

export const useViewMode = (key: string, initialMode: ViewMode = 'grid') => {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_PREFIX + key);
    return (saved === 'grid' || saved === 'list') ? saved : initialMode;
  });

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_PREFIX + key, mode);
  };

  return [viewMode, setViewMode] as const;
};

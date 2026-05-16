import { useState, useEffect } from 'react';

export interface PageAdjustment {
  columns: number;
  itemsPerPage: number;
  mobileColumns: number;
  mobileItemsPerPage: number;
}

const ADJUSTMENT_STORAGE_KEY = 'emr_page_adjustments';

const DEFAULT_ADJUSTMENTS: Record<string, PageAdjustment> = {
  patients: { columns: 3, itemsPerPage: 12, mobileColumns: 1, mobileItemsPerPage: 6 },
  staff: { columns: 3, itemsPerPage: 12, mobileColumns: 1, mobileItemsPerPage: 6 },
  assets: { columns: 4, itemsPerPage: 16, mobileColumns: 1, mobileItemsPerPage: 8 },
  pharmacy: { columns: 3, itemsPerPage: 12, mobileColumns: 1, mobileItemsPerPage: 6 },
};

export const usePageAdjustments = (pageKey: string) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [adjustments, setAdjustments] = useState<PageAdjustment>(() => {
    const saved = localStorage.getItem(ADJUSTMENT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed[pageKey] || DEFAULT_ADJUSTMENTS[pageKey] || DEFAULT_ADJUSTMENTS.patients;
      } catch {
        return DEFAULT_ADJUSTMENTS[pageKey] || DEFAULT_ADJUSTMENTS.patients;
      }
    }
    return DEFAULT_ADJUSTMENTS[pageKey] || DEFAULT_ADJUSTMENTS.patients;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    
    // Also listen for storage changes in case settings are updated in another tab
    const handleStorage = (e: StorageEvent) => {
      if (e.key === ADJUSTMENT_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed[pageKey]) setAdjustments(parsed[pageKey]);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('storage', handleStorage);
    };
  }, [pageKey]);

  // Re-read from localStorage when the component using this hook might need fresh data
  // (e.g. after the user saves settings in AdjustmentSettings.tsx)
  useEffect(() => {
    const saved = localStorage.getItem(ADJUSTMENT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed[pageKey]) setAdjustments(parsed[pageKey]);
      } catch {}
    }
  }, [pageKey]);

  return {
    columns: isMobile ? adjustments.mobileColumns : adjustments.columns,
    itemsPerPage: isMobile ? adjustments.mobileItemsPerPage : adjustments.itemsPerPage,
    isMobile
  };
};

import { useState, useEffect, useMemo, useCallback } from 'react';
import { debounce } from 'lodash';

export const useSearch = (initialSearchTerm = '', delay = 300) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialSearchTerm);

  // Debounced search update
  const debouncedUpdate = useMemo(
    () => debounce((term) => {
      setDebouncedSearchTerm(term);
    }, delay),
    [delay]
  );

  useEffect(() => {
    debouncedUpdate(searchTerm);
    return () => {
      debouncedUpdate.cancel();
    };
  }, [searchTerm, debouncedUpdate]);

  const updateSearchTerm = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  }, []);

  // Search filter function
  const filterItems = useCallback((items, searchFields = ['name']) => {
    if (!debouncedSearchTerm.trim()) {
      return items;
    }

    const searchLower = debouncedSearchTerm.toLowerCase().trim();
    
    return items.filter(item => {
      return searchFields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value && String(value).toLowerCase().includes(searchLower);
      });
    });
  }, [debouncedSearchTerm]);

  return {
    searchTerm,
    debouncedSearchTerm,
    updateSearchTerm,
    clearSearch,
    filterItems,
    isSearching: searchTerm !== debouncedSearchTerm,
    hasSearchTerm: debouncedSearchTerm.trim().length > 0,
  };
};
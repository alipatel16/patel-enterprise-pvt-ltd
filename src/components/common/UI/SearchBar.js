import React, { useState, useCallback, useRef } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Chip,
  Menu,
  MenuItem,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Sort as SortIcon
} from '@mui/icons-material';

// Debounce utility function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * SearchBar component with search, filter and sort capabilities
 * @param {Object} props
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Callback when search value changes
 * @param {Function} props.onSearch - Callback when search is triggered
 * @param {Function} props.onClear - Callback when search is cleared
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether search is disabled
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Callback when filters change
 * @param {Array} props.filterOptions - Available filter options
 * @param {Object} props.sortOptions - Available sort options
 * @param {Function} props.onSortChange - Callback when sort changes
 * @param {boolean} props.showFilters - Whether to show filter options
 * @param {boolean} props.showSort - Whether to show sort options
 * @param {number} props.debounceMs - Debounce delay for search
 * @returns {React.ReactElement}
 */
const SearchBar = ({
  value = '',
  onChange,
  onSearch,
  onClear,
  placeholder = 'Search...',
  disabled = false,
  filters = {},
  onFilterChange,
  filterOptions = [],
  sortOptions = {},
  onSortChange,
  showFilters = false,
  showSort = false,
  debounceMs = 500
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const inputRef = useRef(null);

  // Create debounced search function
  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      if (onSearch) {
        onSearch(searchTerm);
      }
    }, debounceMs),
    [onSearch, debounceMs]
  );

  // Handle search input change
  const handleSearchChange = (event) => {
    const newValue = event.target.value;
    
    // Update parent state immediately for controlled input
    if (onChange) {
      onChange(newValue);
    }
    
    // Debounced search call
    debouncedSearch(newValue);
  };

  // Handle search clear
  const handleClear = () => {
    if (onChange) {
      onChange('');
    }
    if (onClear) {
      onClear();
    }
    // Focus back to input after clearing
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // Handle enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && onSearch) {
      event.preventDefault();
      onSearch(value);
    }
  };

  // Filter menu handlers
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (filterKey, filterValue) => {
    if (onFilterChange) {
      onFilterChange({
        ...filters,
        [filterKey]: filterValue
      });
    }
    handleFilterClose();
  };

  // Sort menu handlers
  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortSelect = (sortKey) => {
    if (onSortChange) {
      onSortChange(sortKey);
    }
    handleSortClose();
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value && value !== '').length;
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    if (onFilterChange) {
      const clearedFilters = Object.keys(filters).reduce((acc, key) => {
        acc[key] = '';
        return acc;
      }, {});
      onFilterChange(clearedFilters);
    }
  };

  // Render active filters
  const renderActiveFilters = () => {
    const activeFilters = Object.entries(filters)
      .filter(([key, value]) => value && value !== '' && key !== 'search')
      .map(([key, value]) => {
        const option = filterOptions.find(opt => opt.key === key);
        const optionItem = option?.options.find(opt => opt.value === value);
        const label = option ? option.label : key;
        const displayValue = optionItem ? optionItem.label : value;
        return { key, value, label, displayValue };
      });

    if (activeFilters.length === 0) {
      return null;
    }

    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
        {activeFilters.map(({ key, value, label, displayValue }) => (
          <Chip
            key={key}
            label={`${label}: ${displayValue}`}
            size="small"
            onDelete={() => handleFilterSelect(key, '')}
            sx={{ fontSize: '0.75rem' }}
          />
        ))}
        {activeFilters.length > 1 && (
          <Chip
            label="Clear All"
            size="small"
            variant="outlined"
            onClick={handleClearAllFilters}
            sx={{ fontSize: '0.75rem' }}
          />
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Search Bar */}
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          flexDirection: { xs: 'column', sm: 'row' }
        }}
      >
        {/* Search Input */}
        <TextField
          ref={inputRef}
          fullWidth
          value={value}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: value && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClear}
                  disabled={disabled}
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2
            }
          }}
        />

        {/* Filter and Sort Buttons */}
        <Box sx={{ display: 'flex', gap: 1, minWidth: 'fit-content' }}>
          {/* Filter Button */}
          {showFilters && filterOptions.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
              disabled={disabled}
              sx={{
                minWidth: 'fit-content',
                px: 2,
                py: 1,
                borderRadius: 2
              }}
            >
              Filter
              {getActiveFilterCount() > 0 && (
                <Chip
                  label={getActiveFilterCount()}
                  size="small"
                  sx={{ ml: 1, height: 18, fontSize: '0.7rem' }}
                />
              )}
            </Button>
          )}

          {/* Sort Button */}
          {showSort && Object.keys(sortOptions).length > 0 && (
            <Button
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={handleSortClick}
              disabled={disabled}
              sx={{
                minWidth: 'fit-content',
                px: 2,
                py: 1,
                borderRadius: 2
              }}
            >
              Sort
            </Button>
          )}
        </Box>
      </Box>

      {/* Active Filters */}
      {renderActiveFilters()}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={handleFilterClose}
        PaperProps={{
          sx: { minWidth: 200, maxHeight: 300 }
        }}
      >
        {filterOptions.map((filterOption) => (
          <Box key={filterOption.key}>
            <MenuItem disabled sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {filterOption.label}
            </MenuItem>
            {filterOption.options.map((option) => (
              <MenuItem
                key={option.value}
                onClick={() => handleFilterSelect(filterOption.key, option.value)}
                selected={filters[filterOption.key] === option.value}
                sx={{ pl: 3 }}
              >
                {option.label}
              </MenuItem>
            ))}
            <MenuItem
              onClick={() => handleFilterSelect(filterOption.key, '')}
              sx={{ pl: 3, fontStyle: 'italic', color: 'text.secondary' }}
            >
              Clear {filterOption.label}
            </MenuItem>
          </Box>
        ))}
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
        PaperProps={{
          sx: { minWidth: 160 }
        }}
      >
        {Object.entries(sortOptions).map(([key, label]) => (
          <MenuItem
            key={key}
            onClick={() => handleSortSelect(key)}
            selected={filters.sortBy === key}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default SearchBar;
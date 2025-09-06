import React, { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  Box,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
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
  debounceMs = 300
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [searchValue, setSearchValue] = useState(value);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchTerm) => {
      if (onSearch) {
        onSearch(searchTerm);
      }
    }, debounceMs),
    [onSearch, debounceMs]
  );

  // Handle search value change
  useEffect(() => {
    setSearchValue(value);
  }, [value]);

  // Handle search input change
  const handleSearchChange = (event) => {
    const newValue = event.target.value;
    setSearchValue(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
    
    debouncedSearch(newValue);
  };

  // Handle search clear
  const handleClear = () => {
    setSearchValue('');
    if (onChange) {
      onChange('');
    }
    if (onClear) {
      onClear();
    }
  };

  // Handle enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && onSearch) {
      onSearch(searchValue);
    }
  };

  // Filter menu handlers
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // Sort menu handlers
  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value && value !== '').length;
  };

  // Render active filters
  const renderActiveFilters = () => {
    const activeFilters = Object.entries(filters)
      .filter(([key, value]) => value && value !== '')
      .map(([key, value]) => {
        const option = filterOptions.find(opt => opt.key === key);
        const label = option ? option.label : key;
        return { key, value, label };
      });

    if (activeFilters.length === 0) {
      return null;
    }

    return (
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
        {activeFilters.map(({ key, value, label }) => (
          <Chip
            key={key}
            label={`${label}: ${value}`}
            size="small"
            onDelete={() => onFilterChange && onFilterChange({ [key]: '' })}
            sx={{ fontSize: '0.75rem' }}
          />
        ))}
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
          fullWidth
          value={searchValue}
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
            endAdornment: searchValue && (
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
              borderRadius: 2,
            }
          }}
        />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          {/* Filter Button */}
          {showFilters && filterOptions.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={handleFilterClick}
              disabled={disabled}
              sx={{
                minWidth: { xs: 'auto', sm: 'auto' },
                px: { xs: 2, sm: 3 }
              }}
            >
              {!isMobile && 'Filter'}
              {getActiveFilterCount() > 0 && (
                <Chip
                  label={getActiveFilterCount()}
                  size="small"
                  color="primary"
                  sx={{ ml: 1, height: 20, fontSize: '0.75rem' }}
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
                minWidth: { xs: 'auto', sm: 'auto' },
                px: { xs: 2, sm: 3 }
              }}
            >
              {!isMobile && 'Sort'}
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
          sx: { minWidth: 200, p: 2 }
        }}
      >
        {filterOptions.map((option) => (
          <FormControl
            key={option.key}
            fullWidth
            size="small"
            sx={{ mb: 2 }}
          >
            <InputLabel>{option.label}</InputLabel>
            <Select
              value={filters[option.key] || ''}
              label={option.label}
              onChange={(e) =>
                onFilterChange &&
                onFilterChange({ [option.key]: e.target.value })
              }
            >
              <MenuItem value="">All</MenuItem>
              {option.options.map((optionValue) => (
                <MenuItem key={optionValue.value} value={optionValue.value}>
                  {optionValue.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortAnchorEl}
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
      >
        {Object.entries(sortOptions).map(([key, label]) => (
          <MenuItem
            key={key}
            onClick={() => {
              onSortChange && onSortChange(key);
              handleSortClose();
            }}
          >
            {label}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default SearchBar;
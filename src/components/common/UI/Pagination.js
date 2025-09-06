import React from 'react';
import {
  Box,
  Pagination as MuiPagination,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  useMediaQuery
} from '@mui/material';

/**
 * Pagination component with page size selector and info display
 * @param {Object} props
 * @param {number} props.currentPage - Current page number
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.total - Total number of items
 * @param {number} props.pageSize - Current page size
 * @param {Array} props.pageSizeOptions - Available page size options
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {Function} props.onPageSizeChange - Callback when page size changes
 * @param {boolean} props.disabled - Whether pagination is disabled
 * @param {string} props.itemName - Name of items being paginated (e.g., "customers")
 * @returns {React.ReactElement}
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  total = 0,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  onPageChange,
  onPageSizeChange,
  disabled = false,
  itemName = 'items'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Calculate display range
  const startItem = total > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = Math.min(currentPage * pageSize, total);

  // Handle page change
  const handlePageChange = (event, page) => {
    if (onPageChange && !disabled) {
      onPageChange(page);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (event) => {
    if (onPageSizeChange && !disabled) {
      onPageSizeChange(event.target.value);
    }
  };

  // Don't render if no items
  if (total === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        py: 2,
        px: 1
      }}
    >
      {/* Info and Page Size Selector */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          flex: 1
        }}
      >
        {/* Items Info */}
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            whiteSpace: 'nowrap'
          }}
        >
          Showing {startItem}-{endItem} of {total.toLocaleString()} {itemName}
        </Typography>

        {/* Page Size Selector */}
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel id="page-size-label" sx={{ fontSize: '0.875rem' }}>
            Per page
          </InputLabel>
          <Select
            labelId="page-size-label"
            value={pageSize}
            label="Per page"
            onChange={handlePageSizeChange}
            disabled={disabled}
            sx={{
              fontSize: '0.875rem',
              '& .MuiSelect-select': {
                py: 1
              }
            }}
          >
            {pageSizeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Pagination Controls */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: { xs: 'center', sm: 'flex-end' },
          alignItems: 'center'
        }}
      >
        <MuiPagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          disabled={disabled}
          color="primary"
          shape="rounded"
          size={isMobile ? 'small' : 'medium'}
          showFirstButton={!isMobile && totalPages > 5}
          showLastButton={!isMobile && totalPages > 5}
          siblingCount={isMobile ? 0 : 1}
          boundaryCount={isMobile ? 1 : 2}
          sx={{
            '& .MuiPaginationItem-root': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default Pagination;
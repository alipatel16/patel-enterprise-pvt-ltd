import React, { forwardRef, useState } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Avatar,
  Typography,
  Chip,
  CircularProgress,
  Paper,
  useTheme
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

/**
 * Enhanced AutoComplete field component
 * @param {Object} props
 * @param {array} props.options - Array of options
 * @param {string|array} props.value - Selected value(s)
 * @param {function} props.onChange - Change handler
 * @param {string} props.label - Field label
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {boolean} props.multiple - Allow multiple selection
 * @param {boolean} props.freeSolo - Allow custom input
 * @param {function} props.onInputChange - Input change handler
 * @param {boolean} props.loading - Show loading indicator
 * @param {string} props.placeholder - Placeholder text
 * @param {function} props.getOptionLabel - Function to get option label
 * @param {function} props.getOptionValue - Function to get option value
 * @param {function} props.renderOption - Custom option renderer
 * @param {boolean} props.clearOnEscape - Clear on escape key
 * @param {number} props.limitTags - Limit number of tags shown
 * @param {object} props.sx - MUI sx prop for styling
 */
const AutoCompleteField = forwardRef(({
  options = [],
  value,
  onChange,
  label,
  error,
  required = false,
  disabled = false,
  multiple = false,
  freeSolo = false,
  onInputChange,
  loading = false,
  placeholder,
  getOptionLabel,
  getOptionValue,
  renderOption,
  clearOnEscape = true,
  limitTags = 3,
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
  helperText,
  noOptionsText = 'No options available',
  loadingText = 'Loading...',
  sx = {},
  ...props
}, ref) => {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);

  // Default option label function
  const defaultGetOptionLabel = (option) => {
    if (!option) return '';
    if (typeof option === 'string') return option;
    return option.label || option.name || option.title || String(option);
  };

  // Default option value function
  const defaultGetOptionValue = (option) => {
    if (!option) return '';
    if (typeof option === 'string') return option;
    return option.value || option.id || option;
  };

  // Handle value change
  const handleChange = (event, newValue) => {
    if (onChange) {
      if (multiple) {
        const values = newValue.map(option => 
          getOptionValue ? getOptionValue(option) : defaultGetOptionValue(option)
        );
        onChange(values);
      } else {
        const singleValue = getOptionValue 
          ? getOptionValue(newValue) 
          : defaultGetOptionValue(newValue);
        onChange(singleValue);
      }
    }
  };

  // Handle input change
  const handleInputChange = (event, newInputValue, reason) => {
    setInputValue(newInputValue);
    
    if (onInputChange) {
      onInputChange(newInputValue, reason);
    }
  };

  // Get current value for display
  const getCurrentValue = () => {
    if (!value) return multiple ? [] : null;
    
    if (multiple) {
      return Array.isArray(value) 
        ? value.map(val => 
            options.find(opt => 
              (getOptionValue ? getOptionValue(opt) : defaultGetOptionValue(opt)) === val
            ) || val
          )
        : [];
    } else {
      return options.find(opt => 
        (getOptionValue ? getOptionValue(opt) : defaultGetOptionValue(opt)) === value
      ) || value;
    }
  };

  // Default render option function
  const defaultRenderOption = (props, option) => {
    const optionLabel = getOptionLabel 
      ? getOptionLabel(option) 
      : defaultGetOptionLabel(option);
    
    // Check if option has additional properties for rich display
    if (typeof option === 'object' && option !== null) {
      const { avatar, subtitle, description, icon } = option;
      
      return (
        <li {...props}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {/* Avatar or Icon */}
            {avatar && (
              <Avatar 
                src={avatar} 
                sx={{ width: 32, height: 32, mr: 1 }}
                alt={optionLabel}
              />
            )}
            {icon && !avatar && (
              <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                {icon}
              </Box>
            )}
            
            {/* Text Content */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1">
                {optionLabel}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
              {description && (
                <Typography variant="caption" color="text.secondary">
                  {description}
                </Typography>
              )}
            </Box>
          </Box>
        </li>
      );
    }
    
    return (
      <li {...props}>
        <Typography variant="body1">
          {optionLabel}
        </Typography>
      </li>
    );
  };

  // Custom paper component for dropdown
  const CustomPaper = (props) => (
    <Paper 
      {...props} 
      sx={{ 
        '& .MuiAutocomplete-listbox': {
          '& .MuiAutocomplete-option': {
            minHeight: 48
          }
        }
      }} 
    />
  );

  return (
    <Autocomplete
      ref={ref}
      options={options}
      value={getCurrentValue()}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      multiple={multiple}
      freeSolo={freeSolo}
      disabled={disabled}
      loading={loading}
      fullWidth={fullWidth}
      size={size}
      clearOnEscape={clearOnEscape}
      limitTags={limitTags}
      getOptionLabel={getOptionLabel || defaultGetOptionLabel}
      isOptionEqualToValue={(option, value) => {
        const optionVal = getOptionValue 
          ? getOptionValue(option) 
          : defaultGetOptionValue(option);
        const compareVal = getOptionValue 
          ? getOptionValue(value) 
          : defaultGetOptionValue(value);
        return optionVal === compareVal;
      }}
      renderOption={renderOption || defaultRenderOption}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => {
          const label = getOptionLabel 
            ? getOptionLabel(option) 
            : defaultGetOptionLabel(option);
          
          return (
            <Chip
              variant="outlined"
              label={label}
              {...getTagProps({ index })}
              key={index}
              size="small"
            />
          );
        })
      }
      noOptionsText={noOptionsText}
      loadingText={loadingText}
      PaperComponent={CustomPaper}
      sx={{
        '& .MuiAutocomplete-inputRoot': {
          '& .MuiAutocomplete-input': {
            minWidth: '120px'
          }
        },
        ...sx
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={!!error}
          helperText={error || helperText}
          placeholder={placeholder}
          variant={variant}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SearchIcon color="action" sx={{ mr: 1 }} />
                {params.InputProps.startAdornment}
              </Box>
            ),
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          sx={{
            '& .MuiFormHelperText-root.Mui-error': {
              color: theme.palette.error.main
            }
          }}
        />
      )}
      {...props}
    />
  );
});

AutoCompleteField.displayName = 'AutoCompleteField';

export default AutoCompleteField;
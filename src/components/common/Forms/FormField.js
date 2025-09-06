import React, { forwardRef } from 'react';
import {
  TextField,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Checkbox,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  RadioGroup,
  Radio,
  FormLabel,
  Box,
  Chip,
  useTheme
} from '@mui/material';

/**
 * Generic form field component with validation support
 * @param {Object} props
 * @param {string} props.type - Field type (text, email, password, number, select, checkbox, radio, switch)
 * @param {string} props.label - Field label
 * @param {any} props.value - Field value
 * @param {function} props.onChange - Change handler
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Whether field is required
 * @param {boolean} props.disabled - Whether field is disabled
 * @param {array} props.options - Options for select/radio fields
 * @param {boolean} props.multiline - Whether text field should be multiline
 * @param {number} props.rows - Number of rows for multiline fields
 * @param {string} props.placeholder - Placeholder text
 * @param {object} props.inputProps - Additional input props
 * @param {object} props.sx - MUI sx prop for styling
 */
const FormField = forwardRef(({
  type = 'text',
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  options = [],
  multiline = false,
  rows = 4,
  placeholder,
  inputProps = {},
  sx = {},
  fullWidth = true,
  size = 'medium',
  variant = 'outlined',
  helperText,
  startAdornment,
  endAdornment,
  autoComplete,
  autoFocus = false,
  ...props
}, ref) => {
  const theme = useTheme();

  // Common props for all field types
  const commonProps = {
    disabled,
    error: !!error,
    helperText: error || helperText,
    fullWidth,
    sx: {
      '& .MuiFormHelperText-root.Mui-error': {
        color: theme.palette.error.main
      },
      ...sx
    },
    ...props
  };

  // Handle change for different field types
  const handleChange = (event) => {
    if (!onChange) return;

    switch (type) {
      case 'checkbox':
      case 'switch':
        onChange(event.target.checked);
        break;
      case 'number':
        const numValue = parseFloat(event.target.value);
        onChange(isNaN(numValue) ? '' : numValue);
        break;
      default:
        onChange(event.target.value);
        break;
    }
  };

  // Render different field types
  switch (type) {
    case 'select':
      return (
        <FormControl {...commonProps} size={size} variant={variant}>
          <InputLabel required={required}>
            {label}
          </InputLabel>
          <Select
            ref={ref}
            value={value || ''}
            onChange={handleChange}
            label={label}
            autoFocus={autoFocus}
          >
            {options.map((option) => (
              <MenuItem 
                key={typeof option === 'object' ? option.value : option} 
                value={typeof option === 'object' ? option.value : option}
              >
                {typeof option === 'object' ? option.label : option}
              </MenuItem>
            ))}
          </Select>
          {(error || helperText) && (
            <FormHelperText>{error || helperText}</FormHelperText>
          )}
        </FormControl>
      );

    case 'checkbox':
      return (
        <Box>
          <FormControlLabel
            control={
              <Checkbox
                ref={ref}
                checked={!!value}
                onChange={handleChange}
                disabled={disabled}
                color="primary"
                autoFocus={autoFocus}
              />
            }
            label={label}
            sx={sx}
          />
          {(error || helperText) && (
            <FormHelperText error={!!error} sx={{ ml: 0 }}>
              {error || helperText}
            </FormHelperText>
          )}
        </Box>
      );

    case 'switch':
      return (
        <Box>
          <FormControlLabel
            control={
              <Switch
                ref={ref}
                checked={!!value}
                onChange={handleChange}
                disabled={disabled}
                color="primary"
                autoFocus={autoFocus}
              />
            }
            label={label}
            sx={sx}
          />
          {(error || helperText) && (
            <FormHelperText error={!!error} sx={{ ml: 0 }}>
              {error || helperText}
            </FormHelperText>
          )}
        </Box>
      );

    case 'radio':
      return (
        <FormControl component="fieldset" {...commonProps}>
          <FormLabel component="legend" required={required}>
            {label}
          </FormLabel>
          <RadioGroup
            ref={ref}
            value={value || ''}
            onChange={handleChange}
            autoFocus={autoFocus}
          >
            {options.map((option) => (
              <FormControlLabel
                key={typeof option === 'object' ? option.value : option}
                value={typeof option === 'object' ? option.value : option}
                control={<Radio disabled={disabled} />}
                label={typeof option === 'object' ? option.label : option}
              />
            ))}
          </RadioGroup>
        </FormControl>
      );

    case 'multiselect':
      return (
        <FormControl {...commonProps} size={size} variant={variant}>
          <InputLabel required={required}>
            {label}
          </InputLabel>
          <Select
            ref={ref}
            multiple
            value={value || []}
            onChange={handleChange}
            label={label}
            autoFocus={autoFocus}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((val) => {
                  const option = options.find(opt => 
                    (typeof opt === 'object' ? opt.value : opt) === val
                  );
                  return (
                    <Chip 
                      key={val} 
                      label={typeof option === 'object' ? option.label : option || val}
                      size="small"
                    />
                  );
                })}
              </Box>
            )}
          >
            {options.map((option) => (
              <MenuItem 
                key={typeof option === 'object' ? option.value : option} 
                value={typeof option === 'object' ? option.value : option}
              >
                {typeof option === 'object' ? option.label : option}
              </MenuItem>
            ))}
          </Select>
          {(error || helperText) && (
            <FormHelperText>{error || helperText}</FormHelperText>
          )}
        </FormControl>
      );

    default:
      return (
        <TextField
          ref={ref}
          {...commonProps}
          type={type}
          label={label}
          value={value || ''}
          onChange={handleChange}
          required={required}
          multiline={multiline}
          rows={multiline ? rows : undefined}
          placeholder={placeholder}
          size={size}
          variant={variant}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          InputProps={{
            startAdornment,
            endAdornment,
            ...inputProps
          }}
        />
      );
  }
});

FormField.displayName = 'FormField';

export default FormField;
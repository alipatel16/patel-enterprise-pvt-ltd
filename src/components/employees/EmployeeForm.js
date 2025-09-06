import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  Divider,
  Alert,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

import FormField from '../common/Forms/FormField';
import DatePicker from '../common/Forms/DatePicker';
import { USER_ROLES, VALIDATION_MESSAGES } from '../../utils/constants/appConstants';
import { validateEmployeeData } from '../../utils/validation/employeeValidation';

/**
 * Employee form component for creating/editing employees
 * @param {Object} props
 * @param {Object} props.employee - Employee data (for edit mode)
 * @param {function} props.onSubmit - Form submission handler
 * @param {function} props.onCancel - Form cancellation handler
 * @param {boolean} props.isEdit - Whether in edit mode
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 */
const EmployeeForm = ({
  employee = {},
  onSubmit,
  onCancel,
  isEdit = false,
  loading = false,
  error = ''
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: USER_ROLES.EMPLOYEE,
    designation: '',
    department: '',
    salary: '',
    joinedDate: null,
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    isActive: true,
    canCreateInvoices: true,
    canManageCustomers: true,
    canViewReports: false,
    ...employee
  });

  const [formErrors, setFormErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initialize form with employee data
  useEffect(() => {
    if (employee && Object.keys(employee).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...employee,
        joinedDate: employee.joinedDate ? new Date(employee.joinedDate) : null
      }));
      
      // Show advanced section if employee has advanced settings
      if (employee.designation || employee.department || employee.salary) {
        setShowAdvanced(true);
      }
    }
  }, [employee]);

  // Handle input change
  const handleChange = (field) => (value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    
    // Validate form data
    const validation = validateEmployeeData(formData);
    
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }
    
    // Prepare submission data
    const submissionData = {
      ...formData,
      joinedDate: formData.joinedDate ? formData.joinedDate.toISOString() : null,
      salary: formData.salary ? parseFloat(formData.salary) : null
    };
    
    if (onSubmit) {
      onSubmit(submissionData);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Department options
  const departmentOptions = [
    { value: 'sales', label: 'Sales' },
    { value: 'accounts', label: 'Accounts' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'administration', label: 'Administration' },
    { value: 'technical', label: 'Technical Support' }
  ];

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* Loading Bar */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Basic Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <PersonIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Basic Information
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Name */}
            <Grid item xs={12} sm={6}>
              <FormField
                label="Full Name"
                value={formData.name}
                onChange={handleChange('name')}
                error={formErrors.name}
                required
                disabled={loading}
                startAdornment={<PersonIcon color="action" />}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} sm={6}>
              <FormField
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={handleChange('email')}
                error={formErrors.email}
                required
                disabled={loading}
                startAdornment={<EmailIcon color="action" />}
              />
            </Grid>

            {/* Phone */}
            <Grid item xs={12} sm={6}>
              <FormField
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange('phone')}
                error={formErrors.phone}
                required
                disabled={loading}
                startAdornment={<PhoneIcon color="action" />}
              />
            </Grid>

            {/* Role */}
            <Grid item xs={12} sm={6}>
              <FormField
                type="select"
                label="Role"
                value={formData.role}
                onChange={handleChange('role')}
                error={formErrors.role}
                required
                disabled={loading}
                options={[
                  { value: USER_ROLES.EMPLOYEE, label: 'Employee' },
                  { value: USER_ROLES.ADMIN, label: 'Administrator' }
                ]}
                startAdornment={<WorkIcon color="action" />}
              />
            </Grid>

            {/* Joined Date */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Joined Date"
                value={formData.joinedDate}
                onChange={handleChange('joinedDate')}
                error={formErrors.joinedDate}
                disabled={loading}
                maxDate={new Date()}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive')(e.target.checked)}
                    disabled={loading}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon fontSize="small" />
                    <Typography variant="body2">
                      Active Employee
                    </Typography>
                  </Box>
                }
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Advanced Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: showAdvanced ? 3 : 1 
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WorkIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Work Details
              </Typography>
            </Box>
            
            <Button
              variant="text"
              onClick={() => setShowAdvanced(!showAdvanced)}
              size="small"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
          </Box>

          {showAdvanced && (
            <Grid container spacing={3}>
              {/* Designation */}
              <Grid item xs={12} sm={6}>
                <FormField
                  label="Designation"
                  value={formData.designation}
                  onChange={handleChange('designation')}
                  error={formErrors.designation}
                  disabled={loading}
                  placeholder="e.g. Sales Executive, Accountant"
                />
              </Grid>

              {/* Department */}
              <Grid item xs={12} sm={6}>
                <FormField
                  type="select"
                  label="Department"
                  value={formData.department}
                  onChange={handleChange('department')}
                  error={formErrors.department}
                  disabled={loading}
                  options={departmentOptions}
                />
              </Grid>

              {/* Salary */}
              <Grid item xs={12} sm={6}>
                <FormField
                  type="number"
                  label="Monthly Salary"
                  value={formData.salary}
                  onChange={handleChange('salary')}
                  error={formErrors.salary}
                  disabled={loading}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <FormField
                  label="Address"
                  value={formData.address}
                  onChange={handleChange('address')}
                  error={formErrors.address}
                  disabled={loading}
                  multiline
                  rows={2}
                />
              </Grid>

              {/* Emergency Contact */}
              <Grid item xs={12} sm={6}>
                <FormField
                  label="Emergency Contact Name"
                  value={formData.emergencyContact}
                  onChange={handleChange('emergencyContact')}
                  error={formErrors.emergencyContact}
                  disabled={loading}
                />
              </Grid>

              {/* Emergency Phone */}
              <Grid item xs={12} sm={6}>
                <FormField
                  label="Emergency Contact Phone"
                  value={formData.emergencyPhone}
                  onChange={handleChange('emergencyPhone')}
                  error={formErrors.emergencyPhone}
                  disabled={loading}
                />
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <SecurityIcon color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Permissions
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.canCreateInvoices}
                    onChange={(e) => handleChange('canCreateInvoices')(e.target.checked)}
                    disabled={loading}
                    color="primary"
                  />
                }
                label="Can Create Invoices"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.canManageCustomers}
                    onChange={(e) => handleChange('canManageCustomers')(e.target.checked)}
                    disabled={loading}
                    color="primary"
                  />
                }
                label="Can Manage Customers"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.canViewReports}
                    onChange={(e) => handleChange('canViewReports')(e.target.checked)}
                    disabled={loading}
                    color="primary"
                  />
                }
                label="Can View Reports"
              />
            </Grid>
          </Grid>

          {formData.role === USER_ROLES.ADMIN && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Administrators have full access to all features regardless of permission settings.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <Box 
        sx={{ 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'flex-end',
          flexDirection: { xs: 'column', sm: 'row' }
        }}
      >
        <Button
          variant="outlined"
          onClick={handleCancel}
          disabled={loading}
          startIcon={<CancelIcon />}
          sx={{ order: { xs: 2, sm: 1 } }}
        >
          Cancel
        </Button>
        
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={<SaveIcon />}
          sx={{ order: { xs: 1, sm: 2 } }}
        >
          {loading 
            ? (isEdit ? 'Updating...' : 'Creating...') 
            : (isEdit ? 'Update Employee' : 'Create Employee')
          }
        </Button>
      </Box>
    </Box>
  );
};

export default EmployeeForm;
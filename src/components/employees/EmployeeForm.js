import React, { useState, useEffect } from "react";
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
  useMediaQuery,
  IconButton,
  InputAdornment,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Lock as LockIcon,
} from "@mui/icons-material";

import FormField from "../common/Forms/FormField";
import { DatePicker } from "@mui/x-date-pickers";
import {
  USER_ROLES,
  VALIDATION_MESSAGES,
} from "../../utils/constants/appConstants";
import { validateEmployeeData } from "../../utils/validation/employeeValidation";

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
  error = "",
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: USER_ROLES.EMPLOYEE,
    designation: "",
    department: "",
    salary: "",
    joinedDate: null,
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    isActive: true,
    canCreateInvoices: true,
    canManageCustomers: true,
    canViewReports: false,
    // New password fields
    password: "",
    confirmPassword: "",
    ...employee,
  });

  const [formErrors, setFormErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /**
   * Safely parse and validate date values
   * @param {any} dateValue - Date value to validate
   * @returns {Date|null} Valid date object or null
   */
  const parseAndValidateDate = (dateValue) => {
    if (!dateValue) return null;

    try {
      // Handle different date formats
      let date;

      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === "string") {
        // Try to parse the string as a date
        date = new Date(dateValue);
      } else {
        return null;
      }

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date value:", dateValue);
        return null;
      }

      // Check if date is reasonable (between 1900 and current date + 1 year)
      const minDate = new Date("1900-01-01");
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);

      if (date < minDate || date > maxDate) {
        console.warn("Date out of reasonable range:", dateValue);
        return null;
      }

      return date;
    } catch (error) {
      console.error("Error parsing date:", error);
      return null;
    }
  };

  // Initialize form with employee data
  useEffect(() => {
    console.log("EmployeeForm received employee prop:", employee);

    if (employee && Object.keys(employee).length > 0) {
      // Handle date parsing safely
      const parseDate = (dateValue) => {
        if (!dateValue) return null;
        try {
          const date = new Date(dateValue);
          return isNaN(date.getTime()) ? null : date;
        } catch (error) {
          console.error("Error parsing date:", error);
          return null;
        }
      };

      // Map all employee fields explicitly
      const mappedData = {
        // Basic fields
        name: employee.name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        role: employee.role || "",
        department: employee.department || "",
        designation: employee.designation || "",

        // Employee ID field
        employeeId: employee.employeeId || "",

        // Date fields - handle both possible field names
        joinedDate: parseDate(employee.joinedDate || employee.dateOfJoining),

        // Address and contact
        address: employee.address || "",
        emergencyContact: employee.emergencyContact || "",
        emergencyPhone: employee.emergencyPhone || "",

        // Financial
        salary: employee.salary || "",

        // Boolean fields with explicit defaults
        isActive: employee.isActive !== undefined ? employee.isActive : true,
        canCreateInvoices:
          employee.canCreateInvoices !== undefined
            ? employee.canCreateInvoices
            : false,
        canManageCustomers:
          employee.canManageCustomers !== undefined
            ? employee.canManageCustomers
            : false,
        canViewReports:
          employee.canViewReports !== undefined
            ? employee.canViewReports
            : false,

        // Password fields - only for new employees
        password: "",
        confirmPassword: "",
      };

      console.log("Mapped form data:", mappedData);

      setFormData(mappedData);

      // Show advanced section if employee has advanced settings
      if (employee.designation || employee.department || employee.salary) {
        setShowAdvanced(true);
      }
    } else {
      console.log("No employee data or empty employee object");
    }
  }, [employee]);

  // Handle input change
  const handleChange = (field) => (value) => {
    if (field === "joinedDate") {
      // Validate date before setting
      const validDate = parseAndValidateDate(value);
      setFormData((prev) => ({
        ...prev,
        [field]: validDate,
      }));

      // Clear any existing error if date is now valid
      if (validDate && formErrors.joinedDate) {
        setFormErrors((prev) => ({
          ...prev,
          joinedDate: "",
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear field error when user starts typing
      if (formErrors[field]) {
        setFormErrors((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    }
  };

  // Validate password fields
  const validatePasswordFields = () => {
    const errors = {};

    // Only validate passwords for new employees
    if (!isEdit) {
      if (!formData.password) {
        errors.password = "Password is required for new employees";
      } else if (formData.password.length < 6) {
        errors.password = "Password must be at least 6 characters";
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = "Please confirm the password";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    return errors;
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();

    // Validate form data
    const validation = validateEmployeeData(formData);
    const passwordErrors = validatePasswordFields();

    const allErrors = { ...validation.errors, ...passwordErrors };

    if (!validation.isValid || Object.keys(passwordErrors).length > 0) {
      setFormErrors(allErrors);
      return;
    }

    // Prepare submission data
    const submissionData = {
      ...formData,
      joinedDate: formData.joinedDate ? formData.joinedDate.toISOString() : null,
      salary: formData.salary ? parseFloat(formData.salary) : null,
    };

    // For edit mode, remove password fields
    if (isEdit) {
      delete submissionData.password;
      delete submissionData.confirmPassword;
    }

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

  // Toggle password visibility
  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(prev => !prev);
  };

  // Department options
  const departmentOptions = [
    { value: "sales", label: "Sales" },
    { value: "accounts", label: "Accounts" },
    { value: "inventory", label: "Inventory" },
    { value: "administration", label: "Administration" },
    { value: "technical", label: "Technical Support" },
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
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
                onChange={handleChange("name")}
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
                onChange={handleChange("email")}
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
                onChange={handleChange("phone")}
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
                onChange={handleChange("role")}
                error={formErrors.role}
                required
                disabled={loading}
                options={[
                  { value: USER_ROLES.EMPLOYEE, label: "Employee" },
                  { value: USER_ROLES.ADMIN, label: "Administrator" },
                ]}
                startAdornment={<WorkIcon color="action" />}
              />
            </Grid>

            {/* Joined Date */}
            <Grid item xs={12} sm={6}>
              <DatePicker
                label="Joined Date"
                value={formData.joinedDate || null}
                onChange={handleChange("joinedDate")}
                disabled={loading}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!formErrors.joinedDate,
                    helperText: formErrors.joinedDate,
                  },
                }}
              />
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleChange("isActive")(e.target.checked)}
                    disabled={loading}
                    color="primary"
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <SecurityIcon fontSize="small" />
                    <Typography variant="body2">Active Employee</Typography>
                  </Box>
                }
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Account Security - Only for new employees */}
      {!isEdit && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
              <LockIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Account Security
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                A user account will be created automatically for this employee using the provided email and password.
              </Typography>
            </Alert>

            <Grid container spacing={3}>
              {/* Password */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password")(e.target.value)}
                  error={!!formErrors.password}
                  helperText={formErrors.password || "Minimum 6 characters"}
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePassword}
                          onMouseDown={(e) => e.preventDefault()}
                          disabled={loading}
                          size="small"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Confirm Password */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword")(e.target.value)}
                  error={!!formErrors.confirmPassword}
                  helperText={formErrors.confirmPassword}
                  required
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleToggleConfirmPassword}
                          onMouseDown={(e) => e.preventDefault()}
                          disabled={loading}
                          size="small"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Advanced Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: showAdvanced ? 3 : 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
              {showAdvanced ? "Hide" : "Show"} Advanced
            </Button>
          </Box>

          {showAdvanced && (
            <Grid container spacing={3}>
              {/* Designation */}
              <Grid item xs={12} sm={6}>
                <FormField
                  label="Designation"
                  value={formData.designation}
                  onChange={handleChange("designation")}
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
                  onChange={handleChange("department")}
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
                  onChange={handleChange("salary")}
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
                  onChange={handleChange("address")}
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
                  onChange={handleChange("emergencyContact")}
                  error={formErrors.emergencyContact}
                  disabled={loading}
                />
              </Grid>

              {/* Emergency Phone */}
              <Grid item xs={12} sm={6}>
                <FormField
                  label="Emergency Contact Phone"
                  value={formData.emergencyPhone}
                  onChange={handleChange("emergencyPhone")}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
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
                    onChange={(e) =>
                      handleChange("canCreateInvoices")(e.target.checked)
                    }
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
                    onChange={(e) =>
                      handleChange("canManageCustomers")(e.target.checked)
                    }
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
                    onChange={(e) =>
                      handleChange("canViewReports")(e.target.checked)
                    }
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
                Administrators have full access to all features regardless of
                permission settings.
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          justifyContent: "flex-end",
          flexDirection: { xs: "column", sm: "row" },
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
            ? isEdit
              ? "Updating..."
              : "Creating Employee & Account..."
            : isEdit
            ? "Update Employee"
            : "Create Employee & Account"}
        </Button>
      </Box>
    </Box>
  );
};

export default EmployeeForm;
// src/pages/checklists/CreateChecklistPage.js - COMPLETE REWRITE
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Alert,
  Grid,
  Divider,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText as MuiListItemText,
  Switch,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ChecklistRtl as ChecklistIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  PersonAdd as BackupIcon,
  Info as InfoIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Layout from '../../components/common/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import checklistService from '../../services/checklistService';
import { 
  RECURRENCE_TYPES,
  DAYS_OF_WEEK_NAMES,
  DAYS_OF_WEEK
} from '../../utils/constants/appConstants';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 300,
    },
  },
};

const CreateChecklistPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userType } = useUserType();
  
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedEmployees: [],
    assignedEmployeeNames: [],
    backupEmployees: [],
    backupEmployeeNames: [],
    recurrence: {
      type: RECURRENCE_TYPES.DAILY,
      dayOfWeek: DAYS_OF_WEEK.MONDAY,
      dayOfMonth: 1,
      specificDate: null
    },
    isActive: true
  });

  // Load employees on mount
  useEffect(() => {
    loadEmployees();
  }, [userType]);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      setError('');
      
      const employeesData = await checklistService.getAllEmployees(userType);
      setEmployees(employeesData);
      
    } catch (error) {
      console.error('Error loading employees:', error);
      setError('Failed to load employees. Please try again.');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleRecurrenceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        [field]: value
      }
    }));
  };

  const handlePrimaryEmployeeChange = (event) => {
    const selectedIds = typeof event.target.value === 'string' 
      ? event.target.value.split(',') 
      : event.target.value;
    
    const selectedEmployeeNames = employees
      .filter(emp => selectedIds.includes(emp.id))
      .map(emp => emp.name);
    
    // Remove selected employees from backup employees
    const updatedBackupEmployees = formData.backupEmployees.filter(
      backupId => !selectedIds.includes(backupId)
    );
    const updatedBackupEmployeeNames = employees
      .filter(emp => updatedBackupEmployees.includes(emp.id))
      .map(emp => emp.name);
    
    setFormData(prev => ({
      ...prev,
      assignedEmployees: selectedIds,
      assignedEmployeeNames: selectedEmployeeNames,
      backupEmployees: updatedBackupEmployees,
      backupEmployeeNames: updatedBackupEmployeeNames
    }));
    setError('');
  };

  const handleBackupEmployeeChange = (event) => {
    const selectedIds = typeof event.target.value === 'string' 
      ? event.target.value.split(',') 
      : event.target.value;
    
    const selectedEmployeeNames = employees
      .filter(emp => selectedIds.includes(emp.id))
      .map(emp => emp.name);
    
    setFormData(prev => ({
      ...prev,
      backupEmployees: selectedIds,
      backupEmployeeNames: selectedEmployeeNames
    }));
  };

  const validateForm = () => {
    const { title, assignedEmployees, recurrence } = formData;
    
    if (!title.trim()) {
      return 'Checklist title is required';
    }
    if (title.length < 3) {
      return 'Title must be at least 3 characters long';
    }
    if (title.length > 100) {
      return 'Title must be less than 100 characters';
    }

    if (assignedEmployees.length === 0) {
      return 'At least one primary employee must be assigned';
    }

    if (recurrence.type === RECURRENCE_TYPES.ONCE && !recurrence.specificDate) {
      return 'Please select a specific date for one-time checklists';
    }

    if (recurrence.type === RECURRENCE_TYPES.ONCE) {
      const selectedDate = new Date(recurrence.specificDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        return 'Specific date cannot be in the past';
      }
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const checklistData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        recurrence: {
          ...formData.recurrence,
          specificDate: formData.recurrence.specificDate 
            ? new Date(formData.recurrence.specificDate).toISOString()
            : null
        }
      };

      await checklistService.createChecklist(userType, checklistData, user);
      
      setSuccess('Checklist created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/checklists');
      }, 2000);

    } catch (error) {
      console.error('Error creating checklist:', error);
      setError(error.message || 'Failed to create checklist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDayOfMonthOptions = () => {
    const options = [];
    for (let i = 1; i <= 31; i++) {
      const suffix = i === 1 ? 'st' : i === 2 ? 'nd' : i === 3 ? 'rd' : 'th';
      options.push(
        <MenuItem key={i} value={i}>
          {i}{suffix}
        </MenuItem>
      );
    }
    return options;
  };

  const getAvailableBackupEmployees = () => {
    return employees.filter(emp => !formData.assignedEmployees.includes(emp.id));
  };

  const breadcrumbs = [
    {
      label: 'Checklists',
      path: '/checklists',
      icon: <ChecklistIcon sx={{ fontSize: 16 }} />
    },
    {
      label: 'Create New Checklist',
      icon: <ChecklistIcon sx={{ fontSize: 16 }} />
    }
  ];

  if (loadingEmployees) {
    return (
      <Layout title="Create New Checklist" breadcrumbs={breadcrumbs}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading employees...
          </Typography>
        </Box>
      </Layout>
    );
  }

  if (employees.length === 0) {
    return (
      <Layout title="Create New Checklist" breadcrumbs={breadcrumbs}>
        <Alert severity="warning" sx={{ mt: 2 }}>
          No active employees found. Please add employees before creating checklists.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/employees')}
          >
            Manage Employees
          </Button>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Create New Checklist" breadcrumbs={breadcrumbs}>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <ChecklistIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Basic Information
                  </Typography>
                </Box>
                
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {success}
                  </Alert>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Checklist Title *"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="e.g., Daily Safety Check, Weekly Inventory Review"
                      helperText={`${formData.title.length}/100 characters`}
                      disabled={loading}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Description (Optional)"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe what this checklist involves and any special instructions..."
                      helperText={`${formData.description.length}/500 characters`}
                      disabled={loading}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isActive}
                          onChange={(e) => handleInputChange('isActive', e.target.checked)}
                          disabled={loading}
                        />
                      }
                      label="Active (employees will see this checklist)"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Primary Employee Assignment */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <PeopleIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Primary Employee Assignment
                  </Typography>
                  <Tooltip title="Primary employees will receive checklist assignments when they log in">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Select Primary Employees *</InputLabel>
                      <Select
                        multiple
                        value={formData.assignedEmployees}
                        onChange={handlePrimaryEmployeeChange}
                        input={<OutlinedInput label="Select Primary Employees *" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((empId) => {
                              const employee = employees.find(emp => emp.id === empId);
                              return (
                                <Chip 
                                  key={empId} 
                                  label={employee?.name || empId} 
                                  size="small"
                                  color="primary"
                                />
                              );
                            })}
                          </Box>
                        )}
                        MenuProps={MenuProps}
                        disabled={loading}
                      >
                        {employees.map((employee) => (
                          <MenuItem key={employee.id} value={employee.id}>
                            <Checkbox checked={formData.assignedEmployees.includes(employee.id)} />
                            <ListItemText 
                              primary={employee.name}
                              secondary={`${employee.department || 'No Department'} • ID: ${employee.employeeId}`}
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Backup Employee Assignment */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <BackupIcon sx={{ mr: 2, color: 'warning.main' }} />
                  <Typography variant="h6">
                    Backup Employee Assignment (Optional)
                  </Typography>
                  <Tooltip title="Backup employees will receive assignments when primary employees are on leave or haven't logged in">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Alert severity="info" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      How Backup Assignments Work:
                    </Typography>
                    <List dense>
                      <ListItem sx={{ pl: 0 }}>
                        <ListItemIcon sx={{ minWidth: 20 }}>•</ListItemIcon>
                        <MuiListItemText primary="If primary employees log in → they receive the checklist assignments" />
                      </ListItem>
                      <ListItem sx={{ pl: 0 }}>
                        <ListItemIcon sx={{ minWidth: 20 }}>•</ListItemIcon>
                        <MuiListItemText primary="If primary employees don't log in → backup employees receive assignments when they log in" />
                      </ListItem>
                      <ListItem sx={{ pl: 0 }}>
                        <ListItemIcon sx={{ minWidth: 20 }}>•</ListItemIcon>
                        <MuiListItemText primary="This ensures important tasks are never missed due to absences" />
                      </ListItem>
                    </List>
                  </Box>
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Select Backup Employees</InputLabel>
                      <Select
                        multiple
                        value={formData.backupEmployees}
                        onChange={handleBackupEmployeeChange}
                        input={<OutlinedInput label="Select Backup Employees" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((empId) => {
                              const employee = employees.find(emp => emp.id === empId);
                              return (
                                <Chip 
                                  key={empId} 
                                  label={employee?.name || empId} 
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                />
                              );
                            })}
                          </Box>
                        )}
                        MenuProps={MenuProps}
                        disabled={loading}
                      >
                        {getAvailableBackupEmployees().map((employee) => (
                          <MenuItem key={employee.id} value={employee.id}>
                            <Checkbox checked={formData.backupEmployees.includes(employee.id)} />
                            <ListItemText 
                              primary={employee.name}
                              secondary={`${employee.department || 'No Department'} • Available as backup`}
                            />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Assignment Preview */}
                {formData.assignedEmployees.length > 0 && (
                  <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Assignment Preview:
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">
                          <strong>Primary ({formData.assignedEmployees.length}):</strong>
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {formData.assignedEmployeeNames.map((name, index) => (
                            <Chip 
                              key={index} 
                              label={name} 
                              size="small" 
                              color="primary" 
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      </Grid>
                      
                      {formData.backupEmployees.length > 0 && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="textSecondary">
                            <strong>Backup ({formData.backupEmployees.length}):</strong>
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            {formData.backupEmployeeNames.map((name, index) => (
                              <Chip 
                                key={index} 
                                label={name} 
                                size="small" 
                                color="warning" 
                                variant="outlined"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Schedule Settings */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <ScheduleIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6">
                    Schedule Settings
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <FormLabel component="legend">
                        When should this checklist appear for employees?
                      </FormLabel>
                      <RadioGroup
                        value={formData.recurrence.type}
                        onChange={(e) => handleRecurrenceChange('type', e.target.value)}
                      >
                        <FormControlLabel 
                          value={RECURRENCE_TYPES.DAILY} 
                          control={<Radio />} 
                          label="Daily - Appears every day"
                          disabled={loading}
                        />
                        <FormControlLabel 
                          value={RECURRENCE_TYPES.WEEKLY} 
                          control={<Radio />} 
                          label="Weekly - Appears once per week on a specific day"
                          disabled={loading}
                        />
                        <FormControlLabel 
                          value={RECURRENCE_TYPES.MONTHLY} 
                          control={<Radio />} 
                          label="Monthly - Appears once per month on a specific date"
                          disabled={loading}
                        />
                        <FormControlLabel 
                          value={RECURRENCE_TYPES.ONCE} 
                          control={<Radio />} 
                          label="One time only - Appears on a specific date"
                          disabled={loading}
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>

                  {/* Weekly Day Selection */}
                  {formData.recurrence.type === RECURRENCE_TYPES.WEEKLY && (
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Day of Week</InputLabel>
                        <Select
                          value={formData.recurrence.dayOfWeek}
                          onChange={(e) => handleRecurrenceChange('dayOfWeek', e.target.value)}
                          label="Day of Week"
                          disabled={loading}
                        >
                          {Object.entries(DAYS_OF_WEEK_NAMES).map(([value, label]) => (
                            <MenuItem key={value} value={parseInt(value)}>
                              {label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  {/* Monthly Day Selection */}
                  {formData.recurrence.type === RECURRENCE_TYPES.MONTHLY && (
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Day of Month</InputLabel>
                        <Select
                          value={formData.recurrence.dayOfMonth}
                          onChange={(e) => handleRecurrenceChange('dayOfMonth', e.target.value)}
                          label="Day of Month"
                          disabled={loading}
                        >
                          {getDayOfMonthOptions()}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  {/* One-time Date Selection */}
                  {formData.recurrence.type === RECURRENCE_TYPES.ONCE && (
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Select Date *"
                        value={formData.recurrence.specificDate}
                        onChange={(newValue) => handleRecurrenceChange('specificDate', newValue)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                        minDate={new Date()}
                        disabled={loading}
                      />
                    </Grid>
                  )}
                </Grid>

                {/* Schedule Preview */}
                {formData.recurrence.type !== RECURRENCE_TYPES.DAILY && (
                  <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'info.50' }}>
                    <Typography variant="subtitle2" color="info.main" gutterBottom>
                      Schedule Preview:
                    </Typography>
                    <Typography variant="body2">
                      {formData.recurrence.type === RECURRENCE_TYPES.WEEKLY && (
                        `This checklist will appear every ${DAYS_OF_WEEK_NAMES[formData.recurrence.dayOfWeek]}`
                      )}
                      {formData.recurrence.type === RECURRENCE_TYPES.MONTHLY && (
                        `This checklist will appear on the ${formData.recurrence.dayOfMonth}${
                          formData.recurrence.dayOfMonth === 1 ? 'st' : 
                          formData.recurrence.dayOfMonth === 2 ? 'nd' : 
                          formData.recurrence.dayOfMonth === 3 ? 'rd' : 'th'
                        } of every month`
                      )}
                      {formData.recurrence.type === RECURRENCE_TYPES.ONCE && formData.recurrence.specificDate && (
                        `This checklist will appear only on ${new Date(formData.recurrence.specificDate).toLocaleDateString()}`
                      )}
                    </Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                onClick={() => navigate('/checklists')}
                startIcon={<CancelIcon />}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Checklist'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Layout>
  );
};

export default CreateChecklistPage;
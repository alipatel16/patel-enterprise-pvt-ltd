import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  FormControlLabel,
  RadioGroup,
  Radio,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  COMPLAINT_STATUS_DISPLAY,
  COMPLAINT_SEVERITY_DISPLAY,
  COMPLAINT_CATEGORY_DISPLAY,
  ASSIGNEE_TYPE_DISPLAY
} from '../../utils/constants/appConstants';
import { useAuth } from '../../contexts/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext';
import customerService from '../../services/api/customerService';
import employeeService from '../../services/api/employeeService';
import complaintService from '../../services/api/complaintService';
import brandHierarchyService from '../../services/api/BrandHierarchyService';
import { formatDate } from '../../utils/helpers/formatHelpers';

const EditComplaintDialog = ({ open, onClose, complaint, onComplaintUpdated }) => {
  const { user } = useAuth();
  const { userType } = useUserType();

  // Helper function to parse structured description
  const parseDescription = (description) => {
    if (!description) return { model: '', serialNumber: '', reason: '' };

    const lines = description.split('\n');
    let model = '';
    let serialNumber = '';
    let reason = '';

    lines.forEach(line => {
      if (line.startsWith('Model:')) {
        model = line.replace('Model:', '').trim();
      } else if (line.startsWith('Serial Number:')) {
        serialNumber = line.replace('Serial Number:', '').trim();
      } else if (line.startsWith('Reason/Problem:')) {
        reason = line.replace('Reason/Problem:', '').trim();
      } else if (!line.startsWith('Model:') && !line.startsWith('Serial Number:')) {
        // If no structured format, treat entire content as reason
        reason = description;
      }
    });

    return { model, serialNumber, reason };
  };

  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    title: '',
    model: '',
    serialNumber: '',
    description: '',
    category: '',
    severity: 'medium',
    status: 'open',
    assigneeType: 'employee',
    assignedEmployeeId: '',
    assignedEmployeeName: '',
    servicePersonName: '',
    servicePersonContact: '',
    companyComplaintNumber: '',
    companyRecordedDate: null,
    expectedResolutionDate: null,
    statusRemarks: ''
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [nextHierarchyLevel, setNextHierarchyLevel] = useState(null);
  const [defaultHierarchyLevel, setDefaultHierarchyLevel] = useState(null);
  const [isAtLastLevel, setIsAtLastLevel] = useState(false);
  const [checkingHierarchy, setCheckingHierarchy] = useState(false);
  const [brandOptions, setBrandOptions] = useState([]);
  const [brandLoading, setBrandLoading] = useState(false);

  // Initialize form data when complaint changes
  useEffect(() => {
    if (complaint && open) {
      const parsed = parseDescription(complaint.description);
      
      setFormData({
        customerId: complaint.customerId || '',
        customerName: complaint.customerName || '',
        customerPhone: complaint.customerPhone || '',
        customerAddress: complaint.customerAddress || '',
        title: complaint.title || '',
        model: parsed.model,
        serialNumber: parsed.serialNumber,
        description: parsed.reason,
        category: complaint.category || '',
        severity: complaint.severity || 'medium',
        status: complaint.status || 'open',
        assigneeType: complaint.assigneeType || 'employee',
        assignedEmployeeId: complaint.assignedEmployeeId || '',
        assignedEmployeeName: complaint.assignedEmployeeName || '',
        servicePersonName: complaint.servicePersonName || '',
        servicePersonContact: complaint.servicePersonContact || '',
        companyComplaintNumber: complaint.companyComplaintNumber || '',
        companyRecordedDate: complaint.companyRecordedDate ? new Date(complaint.companyRecordedDate) : null,
        expectedResolutionDate: complaint.expectedResolutionDate ? new Date(complaint.expectedResolutionDate) : null,
        statusRemarks: ''
      });
      loadEmployees();
      
      if (userType === 'electronics') {
        loadBrands();
      }
      
      if (userType === 'electronics' && complaint.assigneeType === 'service_person') {
        checkHierarchyLevels(complaint);
      }
    }
  }, [complaint, open, userType]);

  const loadBrands = async () => {
    if (userType !== 'electronics') return;
    
    try {
      setBrandLoading(true);
      const brands = await brandHierarchyService.getAllBrands(userType);
      const brandSuggestions = brands.map(brand => ({
        id: brand.id,
        brandName: brand.brandName,
        hierarchy: brand.hierarchy || []
      }));
      setBrandOptions(brandSuggestions);
    } catch (error) {
      console.error('Error loading brands:', error);
    } finally {
      setBrandLoading(false);
    }
  };

  const checkHierarchyLevels = async (currentComplaint) => {
    if (userType !== 'electronics' || !currentComplaint.title || !currentComplaint.servicePersonContact) {
      setNextHierarchyLevel(null);
      setDefaultHierarchyLevel(null);
      setIsAtLastLevel(false);
      return;
    }

    try {
      setCheckingHierarchy(true);
      const detectedBrand = await brandHierarchyService.detectBrandFromTitle(userType, currentComplaint.title);
      
      if (detectedBrand) {
        const atLastLevel = await brandHierarchyService.isAtLastHierarchyLevel(
          userType,
          detectedBrand.brandName,
          currentComplaint.servicePersonContact
        );
        setIsAtLastLevel(atLastLevel);

        const nextLevel = await brandHierarchyService.getNextHierarchyLevel(
          userType,
          detectedBrand.brandName,
          currentComplaint.servicePersonContact
        );
        setNextHierarchyLevel(nextLevel);

        if (atLastLevel) {
          const defaultLevel = await brandHierarchyService.getDefaultHierarchy(userType);
          if (defaultLevel) {
            const isAlreadyAtDefault = currentComplaint.servicePersonContact === defaultLevel.contact;
            setDefaultHierarchyLevel(isAlreadyAtDefault ? null : defaultLevel);
          } else {
            setDefaultHierarchyLevel(null);
          }
        } else {
          setDefaultHierarchyLevel(null);
        }
      } else {
        setNextHierarchyLevel(null);
        setDefaultHierarchyLevel(null);
        setIsAtLastLevel(false);
      }
    } catch (error) {
      console.error('Error checking hierarchy:', error);
      setNextHierarchyLevel(null);
      setDefaultHierarchyLevel(null);
      setIsAtLastLevel(false);
    } finally {
      setCheckingHierarchy(false);
    }
  };

  const handleAssignToNextLevel = () => {
    if (nextHierarchyLevel) {
      setFormData(prev => ({
        ...prev,
        servicePersonName: nextHierarchyLevel.name,
        servicePersonContact: nextHierarchyLevel.contact,
        assigneeType: 'service_person'
      }));
      
      const updatedComplaint = {
        ...complaint,
        servicePersonContact: nextHierarchyLevel.contact
      };
      checkHierarchyLevels(updatedComplaint);
    }
  };

  const handleAssignToDefaultLevel = () => {
    if (defaultHierarchyLevel) {
      setFormData(prev => ({
        ...prev,
        servicePersonName: defaultHierarchyLevel.name,
        servicePersonContact: defaultHierarchyLevel.contact,
        assigneeType: 'service_person'
      }));
      
      setNextHierarchyLevel(null);
      setDefaultHierarchyLevel(null);
    }
  };

  const loadEmployees = async () => {
    try {
      setEmployeeLoading(true);
      const response = await employeeService.getEmployees(userType);
      const employees = response.employees.map(emp => ({
        id: emp.id,
        label: `${emp.name} - ${emp.role}`,
        name: emp.name,
        role: emp.role,
        department: emp.department
      }));
      setEmployeeOptions(employees);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setEmployeeLoading(false);
    }
  };

  const handleCustomerSearch = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCustomerOptions([]);
      return;
    }

    try {
      setCustomerLoading(true);
      const customers = await customerService.searchCustomers(userType, searchTerm, 10);
      const customerSuggestions = customers.map(customer => ({
        id: customer.id,
        label: `${customer.name} (${customer.phone})`,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        customerType: customer.customerType,
        category: customer.category
      }));
      setCustomerOptions(customerSuggestions);
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleCustomerSelect = (event, customer) => {
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerAddress: ''
      }));
    }
  };

  const handleEmployeeSelect = (event, employee) => {
    if (employee) {
      setFormData(prev => ({
        ...prev,
        assignedEmployeeId: employee.id,
        assignedEmployeeName: employee.name
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        assignedEmployeeId: '',
        assignedEmployeeName: ''
      }));
    }
  };

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'assigneeType') {
      if (value === 'employee') {
        setFormData(prev => ({
          ...prev,
          servicePersonName: '',
          servicePersonContact: '',
          companyComplaintNumber: '',
          companyRecordedDate: null
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          assignedEmployeeId: '',
          assignedEmployeeName: ''
        }));
      }
    }
  };

  const handleBrandSelect = (event, brand) => {
    if (!brand) {
      setFormData(prev => ({
        ...prev,
        title: ''
      }));
      return;
    }

    if (typeof brand === 'string') {
      setFormData(prev => ({
        ...prev,
        title: brand
      }));
      return;
    }

    const titleWithBrand = brand.brandName;
    setFormData(prev => ({
      ...prev,
      title: titleWithBrand
    }));

    if (brand.hierarchy && brand.hierarchy.length > 0) {
      const firstLevel = brand.hierarchy[0];
      setFormData(prev => ({
        ...prev,
        assigneeType: 'service_person',
        servicePersonName: firstLevel.name,
        servicePersonContact: firstLevel.contact
      }));
      
      const updatedComplaint = {
        ...complaint,
        title: titleWithBrand,
        servicePersonContact: firstLevel.contact
      };
      checkHierarchyLevels(updatedComplaint);
    }
  };

  const handleTitleInputChange = (event, value, reason) => {
    if (reason === 'input') {
      setFormData(prev => ({
        ...prev,
        title: value
      }));
    }
  };

  const handleDateChange = (field) => (date) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const validateForm = () => {
    if (!formData.customerId) {
      return 'Please select a customer';
    }
    if (!formData.title.trim()) {
      return 'Complaint title is required';
    }
    if (!formData.description.trim()) {
      return 'Reason/Problem is required';
    }
    if (formData.description.length < 10) {
      return 'Reason/Problem must be at least 10 characters';
    }
    if (!formData.category) {
      return 'Please select a complaint category';
    }
    if (!formData.expectedResolutionDate) {
      return 'Expected resolution date is required';
    }
    if (formData.assigneeType === 'employee' && !formData.assignedEmployeeId) {
      return 'Please assign an employee';
    }
    if (formData.assigneeType === 'service_person') {
      if (!formData.servicePersonName.trim()) {
        return 'Service person name is required';
      }
      if (!formData.servicePersonContact.trim()) {
        return 'Service person contact is required';
      }
      if (!/^[6-9]\d{9}$/.test(formData.servicePersonContact)) {
        return 'Please enter a valid contact number';
      }
    }

    if (formData.status !== complaint.status && !formData.statusRemarks.trim()) {
      return 'Please provide remarks for status change';
    }

    if (formData.companyRecordedDate) {
      const companyDate = new Date(formData.companyRecordedDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (companyDate > today) {
        return 'Company recorded date cannot be in the future';
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      setLoading(true);

      // Build structured description
      const structuredDescription = [
        formData.model ? `Model: ${formData.model.trim()}` : null,
        formData.serialNumber ? `Serial Number: ${formData.serialNumber.trim()}` : null,
        formData.description ? `Reason/Problem: ${formData.description.trim()}` : null
      ].filter(Boolean).join('\n');

      const updateData = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        title: formData.title.trim(),
        description: structuredDescription,
        category: formData.category,
        severity: formData.severity,
        status: formData.status,
        assigneeType: formData.assigneeType,
        expectedResolutionDate: formData.expectedResolutionDate.toISOString(),
        updatedBy: user.uid,
        updatedByName: user.name
      };

      if (formData.assigneeType === 'employee') {
        updateData.assignedEmployeeId = formData.assignedEmployeeId;
        updateData.assignedEmployeeName = formData.assignedEmployeeName;
        updateData.servicePersonName = '';
        updateData.servicePersonContact = '';
        updateData.companyComplaintNumber = '';
        updateData.companyRecordedDate = '';
      } else {
        updateData.servicePersonName = formData.servicePersonName.trim();
        updateData.servicePersonContact = formData.servicePersonContact.trim();
        
        updateData.companyComplaintNumber = formData.companyComplaintNumber.trim();
        updateData.companyRecordedDate = formData.companyRecordedDate ? 
          formData.companyRecordedDate.toISOString() : '';
        
        updateData.assignedEmployeeId = '';
        updateData.assignedEmployeeName = '';
      }

      if (formData.status !== complaint.status) {
        updateData.statusRemarks = formData.statusRemarks.trim();
      }

      await complaintService.updateComplaint(userType, complaint.id, updateData);
      
      if (onComplaintUpdated) {
        onComplaintUpdated();
      }

    } catch (error) {
      console.error('Error updating complaint:', error);
      setError(error.message || 'Failed to update complaint');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '700px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={600}>
            Edit Complaint
          </Typography>
          {complaint && (
            <Chip 
              label={complaint.complaintNumber} 
              color="primary" 
              variant="outlined"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ py: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Original Complaint Info */}
          {complaint && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Original Complaint Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Created:</strong> {formatDate(complaint.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Created By:</strong> {complaint.createdByName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Current Status:</strong> {COMPLAINT_STATUS_DISPLAY[complaint.status]}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Current Severity:</strong> {COMPLAINT_SEVERITY_DISPLAY[complaint.severity]}
                  </Typography>
                </Grid>
                {complaint.assigneeType === 'service_person' && complaint.companyComplaintNumber && (
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Company Complaint #:</strong> {complaint.companyComplaintNumber}
                      {complaint.companyRecordedDate && (
                        <> (Recorded: {formatDate(complaint.companyRecordedDate)})</>
                      )}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Customer Selection */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Customer Information
              </Typography>
              <Autocomplete
                options={customerOptions}
                loading={customerLoading}
                value={formData.customerName ? {
                  id: formData.customerId,
                  label: `${formData.customerName} (${formData.customerPhone})`,
                  name: formData.customerName,
                  phone: formData.customerPhone,
                  address: formData.customerAddress
                } : null}
                onInputChange={(event, value) => handleCustomerSearch(value)}
                onChange={handleCustomerSelect}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Customer"
                    placeholder="Type customer name or phone number"
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {customerLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {option.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.phone} • {option.address}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>

            {/* Complaint Details */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Complaint Details
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              {userType === 'electronics' ? (
                <Autocomplete
                  freeSolo
                  options={brandOptions}
                  loading={brandLoading}
                  value={formData.title}
                  onChange={handleBrandSelect}
                  onInputChange={handleTitleInputChange}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option.brandName}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Complaint Title"
                      placeholder="Start typing brand name or select from dropdown..."
                      fullWidth
                      required
                      helperText={`${formData.title.length}/100 characters - Select brand or type freely`}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {brandLoading ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {option.brandName}
                        </Typography>
                        {option.hierarchy && option.hierarchy.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {option.hierarchy.length} service level{option.hierarchy.length > 1 ? 's' : ''} • 
                            Level 1: {option.hierarchy[0].name}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                />
              ) : (
                <TextField
                  label="Complaint Title"
                  value={formData.title}
                  onChange={handleChange('title')}
                  fullWidth
                  required
                  helperText={`${formData.title.length}/100 characters`}
                  inputProps={{ maxLength: 100 }}
                />
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={handleChange('category')}
                  label="Category"
                >
                  {Object.entries(COMPLAINT_CATEGORY_DISPLAY).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* NEW: Structured Description Fields */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom fontWeight={600} color="text.secondary">
                Product Details & Issue
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Model"
                value={formData.model}
                onChange={handleChange('model')}
                fullWidth
                placeholder="Enter product model number"
                helperText="Optional - Product model number or name"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Serial Number"
                value={formData.serialNumber}
                onChange={handleChange('serialNumber')}
                fullWidth
                placeholder="Enter serial number"
                helperText="Optional - Product serial number"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Reason/Problem"
                value={formData.description}
                onChange={handleChange('description')}
                fullWidth
                multiline
                rows={4}
                required
                placeholder="Describe the issue in detail..."
                helperText={`${formData.description.length}/1000 characters - Describe the problem or reason for complaint`}
                inputProps={{ maxLength: 1000 }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={handleChange('status')}
                  label="Status"
                >
                  {Object.entries(COMPLAINT_STATUS_DISPLAY).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={formData.severity}
                  onChange={handleChange('severity')}
                  label="Severity"
                >
                  {Object.entries(COMPLAINT_SEVERITY_DISPLAY).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          size="small"
                          label={label}
                          color={
                            key === 'critical' ? 'error' :
                            key === 'high' ? 'warning' :
                            key === 'medium' ? 'info' : 'default'
                          }
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <DatePicker
                label="Expected Resolution Date"
                value={formData.expectedResolutionDate}
                onChange={handleDateChange('expectedResolutionDate')}
                format='dd/MM/yyyy'
                renderInput={(params) => <TextField {...params} fullWidth required />}
                minDate={new Date()}
              />
            </Grid>

            {/* Status Change Remarks */}
            {formData.status !== complaint?.status && (
              <Grid item xs={12}>
                <TextField
                  label="Status Change Remarks"
                  value={formData.statusRemarks}
                  onChange={handleChange('statusRemarks')}
                  fullWidth
                  multiline
                  rows={2}
                  required
                  placeholder="Please provide reason for status change..."
                  helperText="Required when changing status"
                />
              </Grid>
            )}

            {/* Assignment */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Assignment
              </Typography>
              
              <FormControl component="fieldset">
                <RadioGroup
                  value={formData.assigneeType}
                  onChange={handleChange('assigneeType')}
                  row
                >
                  {Object.entries(ASSIGNEE_TYPE_DISPLAY).map(([key, label]) => (
                    <FormControlLabel
                      key={key}
                      value={key}
                      control={<Radio />}
                      label={label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Employee Assignment */}
            {formData.assigneeType === 'employee' && (
              <Grid item xs={12}>
                <Autocomplete
                  options={employeeOptions}
                  loading={employeeLoading}
                  value={formData.assignedEmployeeName ? {
                    id: formData.assignedEmployeeId,
                    label: formData.assignedEmployeeName,
                    name: formData.assignedEmployeeName
                  } : null}
                  onChange={handleEmployeeSelect}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Assign to Employee"
                      placeholder="Select an employee"
                      fullWidth
                      required
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.role} - {option.department}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                />
              </Grid>
            )}

            {/* Service Person Assignment */}
            {formData.assigneeType === 'service_person' && (
              <>
                {/* Electronics: Show escalation buttons */}
                {userType === 'electronics' && (nextHierarchyLevel || defaultHierarchyLevel) && (
                  <Grid item xs={12}>
                    {nextHierarchyLevel && (
                      <Alert 
                        severity="info" 
                        action={
                          <Button 
                            color="inherit" 
                            size="small"
                            onClick={handleAssignToNextLevel}
                          >
                            Assign to Level {nextHierarchyLevel.level}
                          </Button>
                        }
                        sx={{ mb: defaultHierarchyLevel ? 1 : 0 }}
                      >
                        Next hierarchy level available: {nextHierarchyLevel.name} ({nextHierarchyLevel.contact})
                      </Alert>
                    )}
                    
                    {defaultHierarchyLevel && isAtLastLevel && (
                      <Alert 
                        severity="warning" 
                        action={
                          <Button 
                            color="inherit" 
                            size="small"
                            onClick={handleAssignToDefaultLevel}
                            variant="outlined"
                          >
                            Assign to Default Level
                          </Button>
                        }
                      >
                        At last brand hierarchy level. Escalate to default level: {defaultHierarchyLevel.name} ({defaultHierarchyLevel.contact})
                      </Alert>
                    )}
                  </Grid>
                )}
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Service Person Name"
                    value={formData.servicePersonName}
                    onChange={handleChange('servicePersonName')}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Service Person Contact"
                    value={formData.servicePersonContact}
                    onChange={handleChange('servicePersonContact')}
                    fullWidth
                    required
                    inputProps={{ maxLength: 10 }}
                    helperText="Enter 10-digit mobile number"
                  />
                </Grid>
                
                {/* Company Complaint Details */}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom fontWeight={600} sx={{ mt: 2 }}>
                    Company Complaint Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    These details are provided by the brand/company and can be updated anytime
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Company Complaint Number"
                    value={formData.companyComplaintNumber}
                    onChange={handleChange('companyComplaintNumber')}
                    fullWidth
                    placeholder="Enter complaint number provided by company/brand"
                    helperText="Complaint number issued by the brand/company"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Company Recorded Date"
                    value={formData.companyRecordedDate}
                    onChange={handleDateChange('companyRecordedDate')}
                    format='dd/MM/yyyy'
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    maxDate={new Date()}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Updating...' : 'Update Complaint'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditComplaintDialog;
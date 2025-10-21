// src/components/complaints/RecordComplaintDialog.js
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
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
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

const RecordComplaintDialog = ({ open, onClose, onComplaintCreated }) => {
  const { user } = useAuth();
  const { userType } = useUserType();

  // Form state
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    customerPincode: '',
    title: '',
    model: '',
    serialNumber: '',
    purchaseDate: null,
    description: '',
    category: '',
    severity: 'medium',
    assigneeType: userType === 'electronics' ? 'service_person' : 'employee',
    assignedEmployeeId: '',
    assignedEmployeeName: '',
    servicePersonName: '',
    servicePersonContact: '',
    companyComplaintNumber: '',
    companyRecordedDate: null,
    expectedResolutionDate: null,
    detectedBrand: null
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerOptions, setCustomerOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [brandOptions, setBrandOptions] = useState([]);
  const [brandLoading, setBrandLoading] = useState(false);

  // Load employees on component mount
  useEffect(() => {
    if (open) {
      loadEmployees();
      if (userType === 'electronics') {
        loadBrands();
      }
    }
  }, [open, userType]);

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

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      assigneeType: userType === 'electronics' ? 'service_person' : 'employee'
    }));
  }, [userType]);

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
        pincode: customer.pincode || '',
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
        customerAddress: customer.address,
        customerPincode: customer.pincode || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        customerPincode: ''
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
        title: '',
        detectedBrand: null,
        servicePersonName: '',
        servicePersonContact: ''
      }));
      return;
    }

    const titleWithBrand = brand.brandName;
    setFormData(prev => ({
      ...prev,
      title: titleWithBrand,
      detectedBrand: brand
    }));

    if (brand.hierarchy && brand.hierarchy.length > 0) {
      const firstLevel = brand.hierarchy[0];
      setFormData(prev => ({
        ...prev,
        assigneeType: 'service_person',
        servicePersonName: firstLevel.name,
        servicePersonContact: firstLevel.contact
      }));
    }
  };

  const handleTitleInputChange = (event, value, reason) => {
    if (reason === 'input') {
      setFormData(prev => ({
        ...prev,
        title: value
      }));

      if (value && value.length >= 2) {
        detectBrandFromTitle(value);
      }
    }
  };

  const detectBrandFromTitle = async (title) => {
    if (!title || title.trim().length < 2) {
      return;
    }

    try {
      const detectedBrand = await brandHierarchyService.detectBrandFromTitle(userType, title);
      
      if (detectedBrand && detectedBrand.hierarchy && detectedBrand.hierarchy.length > 0) {
        const firstLevel = detectedBrand.hierarchy[0];
        setFormData(prev => ({
          ...prev,
          detectedBrand: detectedBrand,
          assigneeType: 'service_person',
          servicePersonName: firstLevel.name,
          servicePersonContact: firstLevel.contact
        }));
      } else if (!detectedBrand) {
        setFormData(prev => ({
          ...prev,
          detectedBrand: null
        }));
      }
    } catch (error) {
      console.error('Error detecting brand:', error);
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

    // Validate pincode if provided
    if (formData.customerPincode && !/^\d{6}$/.test(formData.customerPincode)) {
      return 'Pincode must be 6 digits';
    }

    const expectedDate = new Date(formData.expectedResolutionDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expectedDate < today) {
      return 'Expected resolution date cannot be in the past';
    }

    // Validate purchase date if provided
    if (formData.purchaseDate) {
      const purchaseDate = new Date(formData.purchaseDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (purchaseDate > today) {
        return 'Purchase date cannot be in the future';
      }
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

      if (userType === 'electronics' && formData.title && !formData.detectedBrand) {
        try {
          const potentialBrandName = brandHierarchyService.extractPotentialBrandName(formData.title);
          if (potentialBrandName) {
            const existingBrand = await brandHierarchyService.findBrandByName(userType, potentialBrandName);
            if (!existingBrand) {
              await brandHierarchyService.saveBrand(userType, {
                brandName: potentialBrandName,
                hierarchy: []
              });
              console.log('Auto-created brand:', potentialBrandName);
            }
          }
        } catch (brandError) {
          console.warn('Could not auto-create brand:', brandError);
        }
      }

      // Build structured description
      const structuredDescription = [
        formData.model ? `Model: ${formData.model.trim()}` : null,
        formData.serialNumber ? `Serial Number: ${formData.serialNumber.trim()}` : null,
        formData.description ? `Reason/Problem: ${formData.description.trim()}` : null
      ].filter(Boolean).join('\n');

      const complaintData = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerAddress: formData.customerAddress,
        customerPincode: formData.customerPincode.trim(),
        title: formData.title.trim(),
        description: structuredDescription,
        purchaseDate: formData.purchaseDate ? formData.purchaseDate.toISOString() : '',
        category: formData.category,
        severity: formData.severity,
        assigneeType: formData.assigneeType,
        expectedResolutionDate: formData.expectedResolutionDate.toISOString(),
        createdBy: user.uid,
        createdByName: user.name
      };

      if (formData.assigneeType === 'employee') {
        complaintData.assignedEmployeeId = formData.assignedEmployeeId;
        complaintData.assignedEmployeeName = formData.assignedEmployeeName;
      } else {
        complaintData.servicePersonName = formData.servicePersonName.trim();
        complaintData.servicePersonContact = formData.servicePersonContact.trim();
        
        if (formData.companyComplaintNumber.trim()) {
          complaintData.companyComplaintNumber = formData.companyComplaintNumber.trim();
        }
        if (formData.companyRecordedDate) {
          complaintData.companyRecordedDate = formData.companyRecordedDate.toISOString();
        }
      }

      const newComplaint = await complaintService.createComplaint(userType, complaintData);
      
      if (onComplaintCreated) {
        onComplaintCreated(newComplaint);
      }

      resetForm();
      onClose();

    } catch (error) {
      console.error('Error creating complaint:', error);
      setError(error.message || 'Failed to create complaint');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      customerPincode: '',
      title: '',
      model: '',
      serialNumber: '',
      purchaseDate: null,
      description: '',
      category: '',
      severity: 'medium',
      assigneeType: userType === 'electronics' ? 'service_person' : 'employee',
      assignedEmployeeId: '',
      assignedEmployeeName: '',
      servicePersonName: '',
      servicePersonContact: '',
      companyComplaintNumber: '',
      companyRecordedDate: null,
      expectedResolutionDate: null,
      detectedBrand: null
    });
    setError('');
    setCustomerOptions([]);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" fontWeight={600}>
          Record New Complaint
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ py: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
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
                        {option.pincode && ` • PIN: ${option.pincode}`}
                      </Typography>
                    </Box>
                  </Box>
                )}
              />
            </Grid>

            {/* Selected Customer Display */}
            {formData.customerName && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" fontWeight={500}>
                        {formData.customerName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Phone: {formData.customerPhone}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Address: {formData.customerAddress}
                      </Typography>
                      {formData.customerPincode && (
                        <Typography variant="body2" color="text.secondary">
                          Pincode: {formData.customerPincode}
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            )}

            {/* Pincode Entry - Always visible when customer is selected */}
            {formData.customerId && (
              <Grid item xs={12} md={6}>
                <TextField
                  label="Customer Pincode"
                  value={formData.customerPincode}
                  onChange={handleChange('customerPincode')}
                  fullWidth
                  placeholder="Enter 6-digit pincode"
                  helperText={formData.customerPincode ? "Pincode entered" : "Optional - Enter customer pincode"}
                  inputProps={{ maxLength: 6 }}
                />
              </Grid>
            )}

            {/* Complaint Details */}
            <Grid item xs={12}>
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
                      placeholder="Start typing brand name (e.g., LG, Samsung)..."
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
              {userType === 'electronics' && formData.detectedBrand && (
                <Alert severity="success" sx={{ mt: 1 }}>
                  Brand "{formData.detectedBrand.brandName}" detected! Auto-assigned to {formData.servicePersonName}
                </Alert>
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

            <Grid item xs={12} md={4}>
              <TextField
                label="Model"
                value={formData.model}
                onChange={handleChange('model')}
                fullWidth
                placeholder="Enter product model number"
                helperText="Optional - Product model"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Serial Number"
                value={formData.serialNumber}
                onChange={handleChange('serialNumber')}
                fullWidth
                placeholder="Enter serial number"
                helperText="Optional - Serial number"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <DatePicker
                label="Purchase Date"
                value={formData.purchaseDate}
                onChange={handleDateChange('purchaseDate')}
                renderInput={(params) => <TextField {...params} fullWidth />}
                maxDate={new Date()}
                format='dd/MM/yyyy'
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

            <Grid item xs={12} md={6}>
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

            <Grid item xs={12} md={6}>
              <DatePicker
                label="Expected Resolution Date"
                value={formData.expectedResolutionDate}
                onChange={handleDateChange('expectedResolutionDate')}
                renderInput={(params) => <TextField {...params} fullWidth required />}
                minDate={new Date()}
                format='dd/MM/yyyy'
              />
            </Grid>

            {/* Assignment */}
            <Grid item xs={12}>
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
                    Company Complaint Details (Optional)
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    These details can be provided by the brand/company later and can be updated anytime
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
                    renderInput={(params) => <TextField {...params} fullWidth />}
                    maxDate={new Date()}
                    format='dd/MM/yyyy'
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
          {loading ? 'Creating...' : 'Record Complaint'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecordComplaintDialog;
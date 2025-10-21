// src/components/admin/UpaadManagementTab.js - Employee Advance/Loan Management Component
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  useTheme,
  Tooltip,
  Pagination,
  Collapse,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Payment as PaymentIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  MonetizationOn as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Receipt as ReceiptIcon,
  Notifications as NotificationsIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import employeeService from '../../services/api/employeeService';
import upaadService from '../../services/upaad/upaadService';

const UpaadManagementTab = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { userType } = useUserType();

  // Main state
  const [employees, setEmployees] = useState([]);
  const [upaadRecords, setUpaadRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Statistics
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalPaid: 0,
    totalPending: 0,
    activeRecords: 0,
    completedRecords: 0
  });

  // Reminders
  const [reminders, setReminders] = useState([]);
  const [showReminders, setShowReminders] = useState(false);

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedUpaad, setSelectedUpaad] = useState(null);
  const [employeeSummaryDialogOpen, setEmployeeSummaryDialogOpen] = useState(false);
  const [selectedEmployeeSummary, setSelectedEmployeeSummary] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  // Form states for creating upaad
  const [formData, setFormData] = useState({
    employeeId: '',
    amount: '',
    borrowDate: new Date().toISOString().split('T')[0],
    repaymentType: 'full',
    dueDate: '',
    emiAmount: '',
    emiFrequency: 'monthly',
    notes: ''
  });

  // Payment form state
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    notes: ''
  });

  useEffect(() => {
    loadData();
    loadReminders();
  }, [userType, currentPage, selectedEmployee, selectedMonth, selectedStatus]);

  const loadData = async () => {
    if (!userType) return;

    try {
      setLoading(true);
      setError('');

      // Load employees
      const employeeList = await employeeService.getEmployees(userType);
      setEmployees(employeeList?.employees || []);

      // Load upaad records with filters
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;

      const options = {
        page: currentPage,
        limit: 10,
        employeeId: selectedEmployee !== 'all' ? selectedEmployee : null,
        month: month,
        year: year,
        status: selectedStatus !== 'all' ? selectedStatus : null
      };

      const result = await upaadService.getAllUpaads(userType, options);
      setUpaadRecords(result.records);
      setTotalPages(result.totalPages);
      setTotalRecords(result.total);

      // Load statistics
      await loadStatistics();
    } catch (error) {
      console.error('Failed to load upaad data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const statistics = await upaadService.getOverallStatistics(userType);
      setStats(statistics);
    } catch (error) {
      console.warn('Failed to load statistics:', error);
    }
  };

  const loadReminders = async () => {
    try {
      const upcomingReminders = await upaadService.getUpcomingPaymentReminders(userType, 7);
      setReminders(upcomingReminders);
    } catch (error) {
      console.warn('Failed to load reminders:', error);
    }
  };

  const handleCreateUpaad = async () => {
    try {
      if (!formData.employeeId || !formData.amount || !formData.borrowDate) {
        setError('Please fill in all required fields');
        return;
      }

      const employee = employees.find(e => e.id === formData.employeeId);
      if (!employee) {
        setError('Employee not found');
        return;
      }

      setLoading(true);
      setError('');

      const upaadData = {
        ...formData,
        employeeName: employee.name,
        createdBy: user.name || user.email
      };

      await upaadService.createUpaad(userType, upaadData);
      setSuccess('Upaad record created successfully');
      setCreateDialogOpen(false);
      resetForm();
      await loadData();
      await loadReminders();
    } catch (error) {
      console.error('Failed to create upaad:', error);
      setError('Failed to create upaad record: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    try {
      if (!paymentFormData.amount || !paymentFormData.paymentDate) {
        setError('Please fill in all required fields');
        return;
      }

      const paymentAmount = parseFloat(paymentFormData.amount);
      if (paymentAmount <= 0 || paymentAmount > selectedUpaad.remainingAmount) {
        setError(`Payment amount must be between ₹1 and ₹${selectedUpaad.remainingAmount}`);
        return;
      }

      setLoading(true);
      setError('');

      const paymentData = {
        ...paymentFormData,
        amount: paymentAmount,
        recordedBy: user.name || user.email
      };

      await upaadService.recordPayment(userType, selectedUpaad.id, paymentData);
      setSuccess('Payment recorded successfully');
      setPaymentDialogOpen(false);
      resetPaymentForm();
      await loadData();
      await loadReminders();
    } catch (error) {
      console.error('Failed to record payment:', error);
      setError('Failed to record payment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (upaad) => {
    setSelectedUpaad(upaad);
    setDetailsDialogOpen(true);
  };

  const handleOpenPaymentDialog = (upaad) => {
    setSelectedUpaad(upaad);
    setPaymentFormData({
      amount: upaad.emiAmount || '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      notes: ''
    });
    setPaymentDialogOpen(true);
  };

  const handleViewEmployeeSummary = async (employeeId) => {
    try {
      setLoading(true);
      const summary = await upaadService.getEmployeeUpaadSummary(userType, employeeId);
      const employee = employees.find(e => e.id === employeeId);
      setSelectedEmployeeSummary({
        ...summary,
        employeeName: employee?.name || 'Unknown'
      });
      setEmployeeSummaryDialogOpen(true);
    } catch (error) {
      console.error('Failed to load employee summary:', error);
      setError('Failed to load employee summary');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = (upaad) => {
    setSelectedUpaad(upaad);
    setEditFormData({
      repaymentType: upaad.repaymentType,
      dueDate: upaad.dueDate || '',
      nextPaymentDate: upaad.nextPaymentDate || '',
      emiAmount: upaad.emiAmount || '',
      emiFrequency: upaad.emiFrequency || 'monthly',
      notes: upaad.notes || ''
    });
    setEditDialogOpen(true);
  };

  const handleEditUpaad = async () => {
    try {
      if (!editFormData) return;

      setLoading(true);
      setError('');

      const updates = {
        repaymentType: editFormData.repaymentType,
        notes: editFormData.notes
      };

      // Add type-specific fields
      if (editFormData.repaymentType === 'emi') {
        updates.emiAmount = parseFloat(editFormData.emiAmount);
        updates.emiFrequency = editFormData.emiFrequency;
        updates.nextPaymentDate = editFormData.nextPaymentDate;
        updates.dueDate = null; // Clear due date for EMI
      } else {
        // For full or partial payment
        updates.dueDate = editFormData.dueDate;
        updates.nextPaymentDate = editFormData.dueDate; // Set next payment to due date
        updates.emiAmount = null;
        updates.emiFrequency = null;
      }

      await upaadService.updateUpaad(userType, selectedUpaad.id, updates);
      
      setSuccess('Upaad record updated successfully');
      setEditDialogOpen(false);
      setEditFormData(null);
      setSelectedUpaad(null);
      await loadData();
    } catch (error) {
      console.error('Failed to update upaad:', error);
      setError('Failed to update upaad record: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      amount: '',
      borrowDate: new Date().toISOString().split('T')[0],
      repaymentType: 'full',
      dueDate: '',
      emiAmount: '',
      emiFrequency: 'monthly',
      notes: ''
    });
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      notes: ''
    });
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'partial': return 'warning';
      case 'pending': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Paid';
      case 'partial': return 'Partial';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  if (loading && upaadRecords.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Reminders Banner */}
      {reminders.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => setShowReminders(!showReminders)}
            >
              {showReminders ? 'Hide' : 'View'}
            </Button>
          }
          icon={<NotificationsIcon />}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {reminders.length} payment reminder{reminders.length > 1 ? 's' : ''}
          </Typography>
          <Collapse in={showReminders}>
            <Box sx={{ mt: 1 }}>
              {reminders.map((reminder) => (
                <Typography key={reminder.id} variant="body2" sx={{ mt: 0.5 }}>
                  • {reminder.employeeName}: {formatCurrency(reminder.remainingAmount)} due in {reminder.daysUntilPayment} day{reminder.daysUntilPayment > 1 ? 's' : ''}
                </Typography>
              ))}
            </Box>
          </Collapse>
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
              <Typography variant="h6">{formatCurrency(stats.totalAmount)}</Typography>
              <Typography variant="body2" color="text.secondary">Total Advanced</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
              <Typography variant="h6">{formatCurrency(stats.totalPaid)}</Typography>
              <Typography variant="body2" color="text.secondary">Total Paid</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, color: theme.palette.error.main, mb: 1 }} />
              <Typography variant="h6">{formatCurrency(stats.totalPending)}</Typography>
              <Typography variant="body2" color="text.secondary">Total Pending</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
              <Typography variant="h6">{stats.activeRecords}</Typography>
              <Typography variant="body2" color="text.secondary">Active Records</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <ReceiptIcon sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
              <Typography variant="h6">{stats.completedRecords}</Typography>
              <Typography variant="body2" color="text.secondary">Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  label="Employee"
                  onChange={(e) => {
                    setSelectedEmployee(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <MenuItem value="all">All Employees</MenuItem>
                  {employees?.map(emp => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <DatePicker
                label="Month"
                views={['year', 'month']}
                value={selectedMonth}
                onChange={(date) => {
                  setSelectedMonth(date);
                  setCurrentPage(1);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small"
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="partial">Partial</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                  size="small"
                  fullWidth
                >
                  New Upaad
                </Button>
                <Button
                  variant="outlined"
                  onClick={loadData}
                  disabled={loading}
                  size="small"
                >
                  <RefreshIcon />
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Upaad Records Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upaad Records ({totalRecords})
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Borrow Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Paid</TableCell>
                  <TableCell align="right">Remaining</TableCell>
                  <TableCell>Repayment</TableCell>
                  <TableCell>Next Due</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {upaadRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No upaad records found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  upaadRecords
                    .filter(record => 
                      !searchTerm || 
                      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((record) => (
                      <TableRow key={record.id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {record.employeeName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {record.employeeId}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{formatDate(record.borrowDate)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(record.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="success.main">
                            {formatCurrency(record.totalPaid)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="error.main" fontWeight="medium">
                            {formatCurrency(record.remainingAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={record.repaymentType.toUpperCase()} 
                            size="small"
                            variant="outlined"
                          />
                          {record.repaymentType === 'emi' && record.emiAmount && (
                            <Typography variant="caption" display="block" color="text.secondary">
                              {formatCurrency(record.emiAmount)}/{record.emiFrequency}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.nextPaymentDate ? (
                            <Typography 
                              variant="body2"
                              color={new Date(record.nextPaymentDate) < new Date() ? 'error' : 'text.primary'}
                            >
                              {formatDate(record.nextPaymentDate)}
                            </Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={getStatusLabel(record.status)}
                            color={getStatusColor(record.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={0.5} justifyContent={'center'}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(record)}
                              >
                                <ViewIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {record.status !== 'completed' && (
                              <>
                                <Tooltip title="Edit Upaad">
                                  <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => handleOpenEditDialog(record)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Record Payment">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleOpenPaymentDialog(record)}
                                  >
                                    <PaymentIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                            <Tooltip title="Employee Summary">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleViewEmployeeSummary(record.employeeId)}
                              >
                                <ReceiptIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create Upaad Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Upaad Record</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Employee</InputLabel>
                <Select
                  value={formData.employeeId}
                  label="Employee"
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                >
                  {employees?.map(emp => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Borrow Date"
                type="date"
                value={formData.borrowDate}
                onChange={(e) => setFormData({ ...formData, borrowDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Repayment Type</InputLabel>
                <Select
                  value={formData.repaymentType}
                  label="Repayment Type"
                  onChange={(e) => setFormData({ ...formData, repaymentType: e.target.value })}
                >
                  <MenuItem value="full">Full Payment</MenuItem>
                  <MenuItem value="partial">Partial Payment</MenuItem>
                  <MenuItem value="emi">EMI</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {(formData.repaymentType === 'full' || formData.repaymentType === 'partial') && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Due Date"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}

            {formData.repaymentType === 'emi' && (
              <>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="EMI Amount"
                    type="number"
                    value={formData.emiAmount}
                    onChange={(e) => setFormData({ ...formData, emiAmount: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Frequency</InputLabel>
                    <Select
                      value={formData.emiFrequency}
                      label="Frequency"
                      onChange={(e) => setFormData({ ...formData, emiFrequency: e.target.value })}
                    >
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="First EMI Date"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateUpaad}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          {selectedUpaad && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>{selectedUpaad.employeeName}</strong>
                </Typography>
                <Typography variant="body2">
                  Remaining: {formatCurrency(selectedUpaad.remainingAmount)}
                </Typography>
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Payment Amount"
                    type="number"
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                    }}
                    helperText={`Max: ${formatCurrency(selectedUpaad.remainingAmount)}`}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Payment Date"
                    type="date"
                    value={paymentFormData.paymentDate}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={paymentFormData.paymentMethod}
                      label="Payment Method"
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                      <MenuItem value="cheque">Cheque</MenuItem>
                      <MenuItem value="salary_deduction">Salary Deduction</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Notes"
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRecordPayment}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Record Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upaad Details</DialogTitle>
        <DialogContent>
          {selectedUpaad && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Employee</Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedUpaad.employeeName}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Borrow Date</Typography>
                  <Typography variant="body1">{formatDate(selectedUpaad.borrowDate)}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Total Amount</Typography>
                  <Typography variant="h6" color="primary.main">{formatCurrency(selectedUpaad.amount)}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Total Paid</Typography>
                  <Typography variant="h6" color="success.main">{formatCurrency(selectedUpaad.totalPaid)}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" color="text.secondary">Remaining</Typography>
                  <Typography variant="h6" color="error.main">{formatCurrency(selectedUpaad.remainingAmount)}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Repayment Type</Typography>
                  <Chip label={selectedUpaad.repaymentType.toUpperCase()} size="small" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                  <Chip label={getStatusLabel(selectedUpaad.status)} color={getStatusColor(selectedUpaad.status)} size="small" />
                </Grid>
                {selectedUpaad.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                    <Typography variant="body2">{selectedUpaad.notes}</Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Payment History</Typography>
              {selectedUpaad.payments && selectedUpaad.payments.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell>Recorded By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedUpaad.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                          <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{payment.paymentMethod}</TableCell>
                          <TableCell>{payment.recordedBy}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">No payments recorded yet</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Employee Summary Dialog */}
      <Dialog
        open={employeeSummaryDialogOpen}
        onClose={() => setEmployeeSummaryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Employee Upaad Summary</DialogTitle>
        <DialogContent>
          {selectedEmployeeSummary && (
            <Box>
              <Typography variant="h6" gutterBottom>{selectedEmployeeSummary.employeeName}</Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6">{selectedEmployeeSummary.totalRecords}</Typography>
                      <Typography variant="caption" color="text.secondary">Total Records</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6" color="primary.main">
                        {formatCurrency(selectedEmployeeSummary.totalBorrowed)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Total Borrowed</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(selectedEmployeeSummary.totalPaid)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Total Paid</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h6" color="error.main">
                        {formatCurrency(selectedEmployeeSummary.totalPending)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Total Pending</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="subtitle1" gutterBottom>Recent Records</Typography>
              {selectedEmployeeSummary.records && selectedEmployeeSummary.records.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Paid</TableCell>
                        <TableCell align="right">Remaining</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedEmployeeSummary.records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{formatDate(record.borrowDate)}</TableCell>
                          <TableCell align="right">{formatCurrency(record.amount)}</TableCell>
                          <TableCell align="right">{formatCurrency(record.totalPaid)}</TableCell>
                          <TableCell align="right">{formatCurrency(record.remainingAmount)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={getStatusLabel(record.status)} 
                              color={getStatusColor(record.status)} 
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">No records found</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmployeeSummaryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Upaad Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Upaad Record</DialogTitle>
        <DialogContent>
          {selectedUpaad && editFormData && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>{selectedUpaad.employeeName}</strong>
                </Typography>
                <Typography variant="body2">
                  Total Amount: {formatCurrency(selectedUpaad.amount)} | 
                  Remaining: {formatCurrency(selectedUpaad.remainingAmount)}
                </Typography>
              </Alert>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Repayment Type</InputLabel>
                    <Select
                      value={editFormData.repaymentType}
                      label="Repayment Type"
                      onChange={(e) => setEditFormData({ 
                        ...editFormData, 
                        repaymentType: e.target.value 
                      })}
                    >
                      <MenuItem value="full">Full Payment</MenuItem>
                      <MenuItem value="partial">Partial Payment</MenuItem>
                      <MenuItem value="emi">EMI</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {(editFormData.repaymentType === 'full' || editFormData.repaymentType === 'partial') && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Due Date"
                      type="date"
                      value={editFormData.dueDate}
                      onChange={(e) => setEditFormData({ 
                        ...editFormData, 
                        dueDate: e.target.value 
                      })}
                      InputLabelProps={{ shrink: true }}
                      helperText="Set or change the payment due date"
                    />
                  </Grid>
                )}

                {editFormData.repaymentType === 'emi' && (
                  <>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="EMI Amount"
                        type="number"
                        value={editFormData.emiAmount}
                        onChange={(e) => setEditFormData({ 
                          ...editFormData, 
                          emiAmount: e.target.value 
                        })}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Frequency</InputLabel>
                        <Select
                          value={editFormData.emiFrequency}
                          label="Frequency"
                          onChange={(e) => setEditFormData({ 
                            ...editFormData, 
                            emiFrequency: e.target.value 
                          })}
                        >
                          <MenuItem value="weekly">Weekly</MenuItem>
                          <MenuItem value="monthly">Monthly</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Next Payment Date"
                        type="date"
                        value={editFormData.nextPaymentDate}
                        onChange={(e) => setEditFormData({ 
                          ...editFormData, 
                          nextPaymentDate: e.target.value 
                        })}
                        InputLabelProps={{ shrink: true }}
                        helperText="Change next EMI date"
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes"
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ 
                      ...editFormData, 
                      notes: e.target.value 
                    })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>Note:</strong> Changing repayment type or dates will affect payment reminders and calculations.
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEditUpaad}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UpaadManagementTab;
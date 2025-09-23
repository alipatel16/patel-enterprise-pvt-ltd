// src/components/admin/ManualPenaltyApplication.js
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
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import employeeService from '../../services/api/employeeService';
import penaltyService from '../../services/penalty/penaltyService';
import { PENALTY_TYPES, PENALTY_TYPE_DISPLAY } from '../../utils/constants/attendanceConstants';

const ManualPenaltyApplication = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { userType } = useUserType();

  const [employees, setEmployees] = useState([]);
  const [recentPenalties, setRecentPenalties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [penaltyDate, setPenaltyDate] = useState(new Date());
  const [penaltyType, setPenaltyType] = useState(PENALTY_TYPES.MANUAL);
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [penaltyReason, setPenaltyReason] = useState('');

  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [penaltyToApply, setPenaltyToApply] = useState(null);

  useEffect(() => {
    loadEmployees();
    loadRecentPenalties();
  }, [userType]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const employeeList = await employeeService.getEmployees(userType);
      setEmployees(employeeList?.employees?.filter(emp => emp.isActive !== false));
    } catch (error) {
      console.error('Failed to load employees:', error);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentPenalties = async () => {
    try {
      // Load recent manual penalties (last 30 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const allPenalties = [];
      for (const employee of employees) {
        const penalties = await penaltyService.getEmployeePenalties(
          userType, 
          employee.id, 
          startDate, 
          endDate
        );
        allPenalties.push(...penalties.filter(p => p.type === PENALTY_TYPES.MANUAL));
      }
      
      setRecentPenalties(allPenalties.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)));
    } catch (error) {
      console.error('Failed to load recent penalties:', error);
    }
  };

  const handleApplyPenalty = () => {
    // Validate form
    if (!selectedEmployee) {
      setError('Please select an employee');
      return;
    }

    if (!penaltyAmount || penaltyAmount <= 0) {
      setError('Please enter a valid penalty amount');
      return;
    }

    if (!penaltyReason.trim()) {
      setError('Please provide a reason for the penalty');
      return;
    }

    // Prepare penalty data
    const penalty = {
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.name,
      date: penaltyDate.toISOString().split('T')[0],
      type: penaltyType,
      amount: parseFloat(penaltyAmount),
      reason: penaltyReason.trim(),
      appliedBy: user.name || user.email
    };

    setPenaltyToApply(penalty);
    setConfirmDialogOpen(true);
  };

  const confirmApplyPenalty = async () => {
    try {
      setSaving(true);
      setError('');
      setConfirmDialogOpen(false);

      await penaltyService.applyPenalty(userType, penaltyToApply);
      
      setSuccess(`Manual penalty of ₹${penaltyToApply.amount} applied to ${penaltyToApply.employeeName} successfully!`);
      
      // Reset form
      setSelectedEmployee(null);
      setPenaltyDate(new Date());
      setPenaltyType(PENALTY_TYPES.MANUAL);
      setPenaltyAmount('');
      setPenaltyReason('');
      setPenaltyToApply(null);
      
      // Reload recent penalties
      await loadRecentPenalties();
    } catch (error) {
      console.error('Failed to apply penalty:', error);
      setError('Failed to apply penalty: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePenalty = async (penalty) => {
    try {
      setSaving(true);
      setError('');

      await penaltyService.removePenalty(
        userType,
        penalty.id,
        user.name || user.email,
        'Manual removal by admin'
      );

      setSuccess(`Penalty removed successfully!`);
      await loadRecentPenalties();
    } catch (error) {
      console.error('Failed to remove penalty:', error);
      setError('Failed to remove penalty: ' + error.message);
    } finally {
      setSaving(false);
    }
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

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPenaltyTypeColor = (type) => {
    switch (type) {
      case PENALTY_TYPES.HOURLY: return 'warning';
      case PENALTY_TYPES.LEAVE: return 'error';
      case PENALTY_TYPES.MANUAL: return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <MoneyIcon color="primary" />
        <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
          Manual Penalty Application
        </Typography>
      </Box>

      {/* Error and Success Messages */}
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

      <Grid container spacing={3}>
        {/* Penalty Application Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Apply Manual Penalty
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Autocomplete
                    value={selectedEmployee}
                    onChange={(event, newValue) => setSelectedEmployee(newValue)}
                    options={employees}
                    getOptionLabel={(option) => `${option.name} (${option.employeeId || option.id})`}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Employee"
                        required
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <PersonIcon color="action" sx={{ mr: 1 }} />
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    disabled={loading}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Penalty Date"
                    value={penaltyDate}
                    onChange={setPenaltyDate}
                    maxDate={new Date()}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Penalty Type</InputLabel>
                    <Select
                      value={penaltyType}
                      label="Penalty Type"
                      onChange={(e) => setPenaltyType(e.target.value)}
                    >
                      <MenuItem value={PENALTY_TYPES.MANUAL}>
                        {PENALTY_TYPE_DISPLAY[PENALTY_TYPES.MANUAL]}
                      </MenuItem>
                      <MenuItem value={PENALTY_TYPES.LATE_ARRIVAL}>
                        {PENALTY_TYPE_DISPLAY[PENALTY_TYPES.LATE_ARRIVAL]}
                      </MenuItem>
                      <MenuItem value={PENALTY_TYPES.EARLY_DEPARTURE}>
                        {PENALTY_TYPE_DISPLAY[PENALTY_TYPES.EARLY_DEPARTURE]}
                      </MenuItem>
                      <MenuItem value={PENALTY_TYPES.INCOMPLETE_HOURS}>
                        {PENALTY_TYPE_DISPLAY[PENALTY_TYPES.INCOMPLETE_HOURS]}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Penalty Amount"
                    type="number"
                    value={penaltyAmount}
                    onChange={(e) => setPenaltyAmount(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0, step: 10 }
                    }}
                    helperText="Enter the penalty amount in rupees"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reason for Penalty"
                    multiline
                    rows={3}
                    value={penaltyReason}
                    onChange={(e) => setPenaltyReason(e.target.value)}
                    required
                    placeholder="Please provide a detailed reason for applying this penalty..."
                    helperText="This reason will be visible to the employee and in reports"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={() => {
                        setSelectedEmployee(null);
                        setPenaltyDate(new Date());
                        setPenaltyType(PENALTY_TYPES.MANUAL);
                        setPenaltyAmount('');
                        setPenaltyReason('');
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={saving ? <CircularProgress size={20} /> : <AddIcon />}
                      onClick={handleApplyPenalty}
                      disabled={loading || saving}
                    >
                      Apply Penalty
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Penalties */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Manual Penalties
              </Typography>
              
              {recentPenalties.length === 0 ? (
                <Alert severity="info">
                  No manual penalties applied in the last 30 days.
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentPenalties.slice(0, 10).map((penalty) => (
                        <TableRow key={penalty.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {penalty.employeeName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDateTime(penalty.appliedAt)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(penalty.date)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={formatCurrency(penalty.amount)}
                              color={getPenaltyTypeColor(penalty.type)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemovePenalty(penalty)}
                              disabled={saving}
                              title="Remove penalty"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Penalty Application</DialogTitle>
        <DialogContent>
          {penaltyToApply && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                You are about to apply a manual penalty. This action will affect the employee's salary calculation.
              </Alert>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Employee:</Typography>
                  <Typography variant="body1" fontWeight="medium">{penaltyToApply.employeeName}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Date:</Typography>
                  <Typography variant="body1">{formatDate(penaltyToApply.date)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Type:</Typography>
                  <Typography variant="body1">{PENALTY_TYPE_DISPLAY[penaltyToApply.type]}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Amount:</Typography>
                  <Typography variant="body1" fontWeight="bold" color="error">
                    {formatCurrency(penaltyToApply.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Reason:</Typography>
                  <Typography variant="body1">{penaltyToApply.reason}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmApplyPenalty}
            variant="contained"
            color="error"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            Apply Penalty
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManualPenaltyApplication;
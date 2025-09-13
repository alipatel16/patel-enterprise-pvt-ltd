// src/components/admin/PenaltySettings.js - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  AttachMoney as MoneyIcon,
  EventBusy as LeaveIcon,
  AccessTime as TimeIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Visibility as ViewIcon,
  Weekend as WeekendIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import penaltyService from '../../services/penalty/penaltyService';

const PenaltySettings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { userType } = useUserType();

  const [settings, setSettings] = useState({
    hourlyPenaltyRate: 50,
    leavePenaltyRate: 500,
    lateArrivalThreshold: 15,
    earlyDepartureThreshold: 15,
    autoApplyPenalties: true,
    workingHoursPerDay: 8,
    expectedCheckInTime: '09:00',
    expectedCheckOutTime: '18:00',
    weekendPenaltyEnabled: false,
    holidayPenaltyEnabled: false,
    paidLeavesPerMonth: 2
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [penaltyPreview, setPenaltyPreview] = useState(null);

  useEffect(() => {
    loadSettings();
  }, [userType]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const currentSettings = await penaltyService.getPenaltySettings(userType);
      console.log('Loaded settings:', currentSettings);
      setSettings(currentSettings);
    } catch (error) {
      console.error('Failed to load penalty settings:', error);
      setError('Failed to load penalty settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updatedSettings = {
        ...settings,
        updatedBy: user.name || user.email
      };

      await penaltyService.updatePenaltySettings(userType, updatedSettings);
      setSuccess('Penalty settings updated successfully!');
    } catch (error) {
      console.error('Failed to save penalty settings:', error);
      setError('Failed to save penalty settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // FIXED: Proper Date object handling for TimePicker
  const handleTimeChange = (field, time) => {
    console.log('Time change:', field, time);
    if (time && time instanceof Date && !isNaN(time.getTime())) {
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      console.log('Setting time string:', timeString);
      setSettings(prev => ({
        ...prev,
        [field]: timeString
      }));
    }
  };

  // FIXED: Safe conversion from time string to Date object
  const createTimeFromString = (timeString) => {
    if (!timeString || typeof timeString !== 'string') {
      console.warn('Invalid time string:', timeString);
      return null;
    }
    
    try {
      // Parse HH:MM format
      const timeParts = timeString.split(':');
      if (timeParts.length !== 2) {
        console.warn('Invalid time format:', timeString);
        return null;
      }
      
      const hours = parseInt(timeParts[0], 10);
      const minutes = parseInt(timeParts[1], 10);
      
      // Validate time values
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn('Invalid time values:', timeString);
        return null;
      }
      
      // Create a date with today's date but specified time
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      date.setSeconds(0);
      date.setMilliseconds(0);
      
      // Verify the created date is valid
      if (isNaN(date.getTime())) {
        console.warn('Created invalid date from:', timeString);
        return null;
      }
      
      return date;
    } catch (error) {
      console.error('Error creating time from string:', error, timeString);
      return null;
    }
  };

  const calculatePenaltyPreview = () => {
    // Updated scenarios to reflect new paid leave and Sunday-only logic
    const scenarios = [
      {
        description: 'Employee works 6 hours (2 hours short)',
        workHours: 6,
        lateMinutes: 0,
        earlyMinutes: 0,
        isLeave: false,
        isSunday: false,
        leavesThisMonth: 0
      },
      {
        description: 'Employee arrives 30 minutes late',
        workHours: 8,
        lateMinutes: 30,
        earlyMinutes: 0,
        isLeave: false,
        isSunday: false,
        leavesThisMonth: 0
      },
      {
        description: 'Employee takes 1st leave this month (paid)',
        workHours: 0,
        lateMinutes: 0,
        earlyMinutes: 0,
        isLeave: true,
        isSunday: false,
        leavesThisMonth: 0
      },
      {
        description: 'Employee takes 3rd leave this month (penalty applies)',
        workHours: 0,
        lateMinutes: 0,
        earlyMinutes: 0,
        isLeave: true,
        isSunday: false,
        leavesThisMonth: 2
      },
      {
        description: 'Employee works on Sunday (incomplete hours)',
        workHours: 6,
        lateMinutes: 0,
        earlyMinutes: 0,
        isLeave: false,
        isSunday: true,
        leavesThisMonth: 0
      }
    ];

    const previews = scenarios.map(scenario => {
      let penalty = 0;

      if (scenario.isLeave) {
        // Only apply leave penalty if employee has exceeded paid leave quota
        if (scenario.leavesThisMonth >= settings.paidLeavesPerMonth) {
          penalty = settings.leavePenaltyRate;
        }
      } else {
        // Calculate hourly penalty
        const shortHours = Math.max(0, settings.workingHoursPerDay - scenario.workHours);
        penalty += shortHours * settings.hourlyPenaltyRate;

        // Late arrival penalty
        if (scenario.lateMinutes > settings.lateArrivalThreshold) {
          const excessMinutes = scenario.lateMinutes - settings.lateArrivalThreshold;
          penalty += (excessMinutes / 60) * settings.hourlyPenaltyRate;
        }

        // Early departure penalty
        if (scenario.earlyMinutes > settings.earlyDepartureThreshold) {
          const excessMinutes = scenario.earlyMinutes - settings.earlyDepartureThreshold;
          penalty += (excessMinutes / 60) * settings.hourlyPenaltyRate;
        }

        // Sunday penalty logic (only if weekend penalties are enabled)
        if (scenario.isSunday && !settings.weekendPenaltyEnabled) {
          penalty = 0; // No penalty for Sunday work if weekend penalties are disabled
        }
      }

      return {
        ...scenario,
        penalty: Math.round(penalty * 100) / 100
      };
    });

    setPenaltyPreview(previews);
    setPreviewDialogOpen(true);
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
          Penalty Settings
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ViewIcon />}
            onClick={calculatePenaltyPreview}
            size={isMobile ? "small" : "medium"}
          >
            Preview
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadSettings}
            disabled={loading}
            size={isMobile ? "small" : "medium"}
          >
            Refresh
          </Button>
        </Box>
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
        {/* Basic Penalty Rates */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <MoneyIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Penalty Rates
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Hourly Penalty Rate"
                    type="number"
                    value={settings.hourlyPenaltyRate}
                    onChange={(e) => handleInputChange('hourlyPenaltyRate', Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0, step: 10 }
                    }}
                    helperText="Penalty amount per hour for incomplete work"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Leave Penalty Rate"
                    type="number"
                    value={settings.leavePenaltyRate}
                    onChange={(e) => handleInputChange('leavePenaltyRate', Number(e.target.value))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                      inputProps: { min: 0, step: 50 }
                    }}
                    helperText="Penalty amount per unpaid leave day"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Working Hours Per Day"
                    type="number"
                    value={settings.workingHoursPerDay}
                    onChange={(e) => handleInputChange('workingHoursPerDay', Number(e.target.value))}
                    InputProps={{
                      inputProps: { min: 1, max: 12, step: 0.5 }
                    }}
                    helperText="Standard working hours expected per day"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Time Thresholds */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <TimeIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Time Thresholds
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Late Arrival Threshold"
                    type="number"
                    value={settings.lateArrivalThreshold}
                    onChange={(e) => handleInputChange('lateArrivalThreshold', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
                      inputProps: { min: 0, max: 60, step: 5 }
                    }}
                    helperText="Grace period before late penalty applies"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Early Departure Threshold"
                    type="number"
                    value={settings.earlyDepartureThreshold}
                    onChange={(e) => handleInputChange('earlyDepartureThreshold', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
                      inputProps: { min: 0, max: 60, step: 5 }
                    }}
                    helperText="Grace period before early departure penalty applies"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Work Schedule - COMPLETELY FIXED */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <ScheduleIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Work Schedule
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TimePicker
                    label="Expected Check-in Time"
                    value={createTimeFromString(settings.expectedCheckInTime)}
                    onChange={(time) => handleTimeChange('expectedCheckInTime', time)}
                    ampm={false} // 24-hour format
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText: "Standard check-in time for penalty calculations",
                        error: false
                      }
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TimePicker
                    label="Expected Check-out Time"
                    value={createTimeFromString(settings.expectedCheckOutTime)}
                    onChange={(time) => handleTimeChange('expectedCheckOutTime', time)}
                    ampm={false} // 24-hour format
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        helperText: "Standard check-out time for penalty calculations",
                        error: false
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Leave & Weekend Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <CalendarIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Leave & Weekend Settings
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Paid Leaves Per Month"
                    type="number"
                    value={settings.paidLeavesPerMonth}
                    onChange={(e) => handleInputChange('paidLeavesPerMonth', Number(e.target.value))}
                    InputProps={{
                      inputProps: { min: 0, max: 10, step: 1 }
                    }}
                    helperText="Number of paid leaves allowed per month before penalties apply"
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.weekendPenaltyEnabled}
                        onChange={(e) => handleInputChange('weekendPenaltyEnabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Sunday penalty enabled"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Apply penalties for Sunday attendance issues (Saturday is considered a working day)
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.holidayPenaltyEnabled}
                        onChange={(e) => handleInputChange('holidayPenaltyEnabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Holiday penalty enabled"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Apply penalties for holiday attendance issues
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Advanced Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <SettingsIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Advanced Settings
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoApplyPenalties}
                        onChange={(e) => handleInputChange('autoApplyPenalties', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Auto-apply penalties"
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Automatically apply penalties based on attendance records
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Box 
                    mt={2} 
                    p={2} 
                    bgcolor="info.light" 
                    borderRadius={1} 
                    border={1} 
                    borderColor="info.main"
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      💡 Updated Penalty Rules:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                      • <strong>Weekends:</strong> Only Sunday is considered weekend (Saturday is a working day)
                      <br />
                      • <strong>Paid Leaves:</strong> First {settings.paidLeavesPerMonth} leaves per month are free, penalties apply thereafter
                      <br />
                      • <strong>Auto-penalties:</strong> Applied automatically when employees check out or take leaves
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box mt={4} display="flex" justifyContent="center">
        <Button
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSaveSettings}
          disabled={saving}
          sx={{ minWidth: 200 }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {/* Penalty Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <ViewIcon />
            <Typography variant="h6">Penalty Calculation Preview</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Based on current settings, here's how penalties would be calculated:
          </Typography>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Scenario</TableCell>
                  <TableCell align="right">Penalty Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {penaltyPreview && penaltyPreview.map((scenario, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {scenario.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {scenario.isLeave 
                          ? `Leave (${scenario.leavesThisMonth} already taken this month)` 
                          : `${scenario.workHours}h work, ${scenario.lateMinutes}min late, ${scenario.earlyMinutes}min early`
                        }
                        {scenario.isSunday && ' - Sunday work'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={formatCurrency(scenario.penalty)}
                        color={scenario.penalty > 0 ? "error" : "success"}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box mt={3} p={2} bgcolor="background.paper" borderRadius={1} border={1} borderColor="divider">
            <Typography variant="subtitle2" gutterBottom>
              Current Settings Summary:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Hourly Rate:</Typography>
                <Typography variant="body2">{formatCurrency(settings.hourlyPenaltyRate)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Leave Rate:</Typography>
                <Typography variant="body2">{formatCurrency(settings.leavePenaltyRate)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Paid Leaves/Month:</Typography>
                <Typography variant="body2">{settings.paidLeavesPerMonth}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Sunday Penalties:</Typography>
                <Typography variant="body2">{settings.weekendPenaltyEnabled ? 'Enabled' : 'Disabled'}</Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PenaltySettings;
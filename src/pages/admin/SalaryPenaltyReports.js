// src/components/admin/SalaryPenaltyTab.js - FIXED VERSION WITH ATTENDANCE DETAILS AND BREAK DETAILS
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
  Collapse,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AttachMoney as MoneyIcon,
  EventBusy as LeaveIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import employeeService from '../../services/api/employeeService';
import attendanceService from '../../services/attendance/attendanceService';
import penaltyService from '../../services/penalty/penaltyService';

const SalaryPenaltyTab = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { userType } = useUserType();

  // Main state
  const [employees, setEmployees] = useState([]);
  const [salaryReports, setSalaryReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Penalty dialog states
  const [penaltyDetailsOpen, setPenaltyDetailsOpen] = useState(false);
  const [selectedPenalties, setSelectedPenalties] = useState([]);
  const [removePenaltyDialogOpen, setRemovePenaltyDialogOpen] = useState(false);
  const [penaltyToRemove, setPenaltyToRemove] = useState(null);
  const [removeReason, setRemoveReason] = useState('');
  const [removeType, setRemoveType] = useState('single'); // 'single', 'daily', 'monthly'
  
  // Attendance details dialog states
  const [attendanceDetailsOpen, setAttendanceDetailsOpen] = useState(false);
  const [selectedEmployeeAttendance, setSelectedEmployeeAttendance] = useState(null);
  const [attendanceDetailsLoading, setAttendanceDetailsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [userType, selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [employeeList] = await Promise.all([
        employeeService.getEmployees(userType)
      ]);

      setEmployees(employeeList?.employees);
      await loadSalaryReports(employeeList?.employees);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSalaryReports = async (employeeList) => {
    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const reports = [];

      for (const employee of employeeList) {
        if (selectedEmployee !== 'all' && employee.id !== selectedEmployee) continue;

        const [salaryCalc, penalties, attendanceRecords] = await Promise.all([
          penaltyService.calculateFinalSalary(
            userType,
            employee.id,
            employee.salary || 0,
            startDate,
            endDate
          ),
          penaltyService.getEmployeePenalties(userType, employee.id, startDate, endDate),
          attendanceService.getEmployeeAttendance(userType, employee.id, 50)
        ]);

        const monthlyAttendance = attendanceRecords.filter(record =>
          record.date >= startDate && record.date <= endDate
        );

        // FIX 1: Only include employees who have attendance data for the selected month
        // OR if we're showing all employees and it's the current month
        const isCurrentMonth = year === new Date().getFullYear() && 
                              month === new Date().getMonth() + 1;
        
        // Include employee if:
        // 1. They have attendance records for this month, OR
        // 2. It's the current month and they have active employment, OR  
        // 3. They have penalties for this month (even without attendance)
        const hasMonthlyData = monthlyAttendance.length > 0 || 
                              penalties.filter(p => p.status === 'active').length > 0 ||
                              (isCurrentMonth && employee.isActive !== false);

        // Skip employees with no data for non-current months
        if (!hasMonthlyData && !isCurrentMonth) {
          continue;
        }

        const workingDays = monthlyAttendance.filter(r => r.status !== 'on_leave').length;
        const leaveDays = monthlyAttendance.filter(r => r.status === 'on_leave').length;
        const totalWorkHours = monthlyAttendance.reduce((sum, r) => sum + (r.totalWorkTime || 0), 0) / 60;

        reports.push({
          employee,
          salaryCalculation: salaryCalc,
          penalties: penalties.filter(p => p.status === 'active'),
          attendance: {
            workingDays,
            leaveDays,
            totalWorkHours: Math.round(totalWorkHours * 100) / 100,
            records: monthlyAttendance
          }
        });
      }

      setSalaryReports(reports);
    } catch (error) {
      console.error('Failed to load salary reports:', error);
      setError('Failed to load salary reports');
    }
  };

  // FIX 2: Add function to refresh penalty details
  const refreshPenaltyDetails = async (employeeId) => {
    try {
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const updatedPenalties = await penaltyService.getEmployeePenalties(
        userType, 
        employeeId, 
        startDate, 
        endDate
      );

      const activePenalties = updatedPenalties.filter(p => p.status === 'active');
      setSelectedPenalties(activePenalties);

      return activePenalties;
    } catch (error) {
      console.error('Failed to refresh penalty details:', error);
      return [];
    }
  };

  // NEW: Function to view detailed attendance for an employee with break details
  const viewAttendanceDetails = async (employee) => {
    try {
      setAttendanceDetailsLoading(true);
      setAttendanceDetailsOpen(true);

      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      // Get all attendance records for the employee
      const attendanceRecords = await attendanceService.getEmployeeAttendance(userType, employee.id, 100);
      
      // Filter for the selected month
      const monthlyAttendance = attendanceRecords.filter(record =>
        record.date >= startDate && record.date <= endDate
      );

      // Generate complete month calendar with attendance data
      const daysInMonth = new Date(year, month, 0).getDate();
      const attendanceCalendar = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayRecord = monthlyAttendance.find(record => record.date === dateStr);
        const dayOfWeek = new Date(dateStr).getDay(); // 0 = Sunday, 6 = Saturday
        
        const dayData = {
          date: dateStr,
          day: day,
          dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
          isWeekend: null,
          record: dayRecord || null,
          status: dayRecord ? dayRecord.status : 'absent',
          checkInTime: dayRecord?.checkInTime || null,
          checkOutTime: dayRecord?.checkOutTime || null,
          totalWorkTime: dayRecord?.totalWorkTime || 0,
          leaveType: dayRecord?.leaveType || null,
          leaveReason: dayRecord?.leaveReason || null
        };

        // NEW: Add break analysis to each day
        if (dayRecord && dayRecord.breaks && dayRecord.breaks.length > 0) {
          const dayBreakCount = dayRecord.breaks.length;
          const dayBreakTime = dayRecord.breaks.reduce((sum, br) => sum + (br.duration || 0), 0);
          
          dayData.breakCount = dayBreakCount;
          dayData.breakTime = dayBreakTime;
          dayData.breakDetails = dayRecord.breaks.map((br, index) => ({
            id: index + 1,
            startTime: br.startTime,
            endTime: br.endTime,
            duration: br.duration || 0
          }));
        } else {
          dayData.breakCount = 0;
          dayData.breakTime = 0;
          dayData.breakDetails = [];
        }

        attendanceCalendar.push(dayData);
      }

      setSelectedEmployeeAttendance({
        employee,
        attendanceCalendar,
        summary: {
          totalDays: daysInMonth,
          workingDays: attendanceCalendar.filter(d => d.status === 'checked_out').length,
          leaveDays: attendanceCalendar.filter(d => d.status === 'on_leave').length,
          absentDays: attendanceCalendar.filter(d => d.status === 'absent').length,
          weekendDays: attendanceCalendar.filter(d => d.isWeekend).length,
          totalWorkHours: Math.round(attendanceCalendar.reduce((sum, d) => sum + (d.totalWorkTime || 0), 0) / 60 * 100) / 100
        }
      });

    } catch (error) {
      console.error('Failed to load attendance details:', error);
      setError('Failed to load attendance details: ' + error.message);
    } finally {
      setAttendanceDetailsLoading(false);
    }
  };

  const handleRemovePenalty = async () => {
    try {
      setLoading(true);
      setError('');

      let removedPenalties = [];
      let employeeId = null;

      if (removeType === 'single' && penaltyToRemove) {
        const removed = await penaltyService.removePenalty(
          userType,
          penaltyToRemove.id,
          user.name || user.email,
          removeReason
        );
        removedPenalties = [removed];
        employeeId = penaltyToRemove.employeeId;
      } else if (removeType === 'daily' && penaltyToRemove) {
        removedPenalties = await penaltyService.removeDailyPenalties(
          userType,
          penaltyToRemove.employeeId,
          penaltyToRemove.date,
          user.name || user.email,
          removeReason
        );
        employeeId = penaltyToRemove.employeeId;
      } else if (removeType === 'monthly' && penaltyToRemove) {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth() + 1;
        removedPenalties = await penaltyService.removeMonthlyPenalties(
          userType,
          penaltyToRemove.employeeId,
          year,
          month,
          user.name || user.email,
          removeReason
        );
        employeeId = penaltyToRemove.employeeId;
      }

      setSuccess(`Successfully removed ${removedPenalties.length} penalties and recalculated salary.`);
      setRemovePenaltyDialogOpen(false);
      setPenaltyToRemove(null);
      setRemoveReason('');
      setRemoveType('single');

      // FIX 2: Refresh penalty details in the dialog if it's open
      if (penaltyDetailsOpen && employeeId) {
        await refreshPenaltyDetails(employeeId);
      }

      // Reload main data to show updated calculations
      await loadData();
    } catch (error) {
      console.error('Failed to remove penalty:', error);
      setError('Failed to remove penalty: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openRemovePenaltyDialog = (penalty, type = 'single') => {
    setPenaltyToRemove(penalty);
    setRemoveType(type);
    setRemovePenaltyDialogOpen(true);
  };

  const viewPenaltyDetails = (penalties) => {
    setSelectedPenalties(penalties);
    setPenaltyDetailsOpen(true);
  };

  const toggleRowExpansion = (employeeId) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(employeeId)) {
      newExpandedRows.delete(employeeId);
    } else {
      newExpandedRows.add(employeeId);
    }
    setExpandedRows(newExpandedRows);
  };

  const exportSalaryReport = () => {
    const headers = [
      'Employee Name',
      'Employee ID',
      'Base Salary',
      'Working Days',
      'Leave Days',
      'Total Work Hours',
      'Total Penalties',
      'Final Salary',
      'Penalty Breakdown'
    ];

    const csvData = salaryReports.map(report => [
      report.employee.name,
      report.employee.employeeId || report.employee.id,
      report.salaryCalculation.baseSalary,
      report.attendance.workingDays,
      report.attendance.leaveDays,
      report.attendance.totalWorkHours,
      report.salaryCalculation.totalPenalties,
      report.salaryCalculation.finalSalary,
      `Hourly: ₹${report.salaryCalculation.penaltyBreakdown.hourly}, Leave: ₹${report.salaryCalculation.penaltyBreakdown.leave}, Manual: ₹${report.salaryCalculation.penaltyBreakdown.manual}`
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `salary_report_${selectedMonth.getFullYear()}_${(selectedMonth.getMonth() + 1).toString().padStart(2, '0')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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

  const getPenaltyTypeColor = (type) => {
    switch (type) {
      case 'hourly': return 'warning';
      case 'leave': return 'error';
      case 'manual': return 'info';
      default: return 'default';
    }
  };

  const filteredReports = salaryReports.filter(report =>
    !searchTerm || 
    report.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
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

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search employees..."
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

            <Grid item xs={12} md={3}>
              <DatePicker
                label="Select Month"
                views={['year', 'month']}
                value={selectedMonth}
                onChange={setSelectedMonth}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: "small"
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  label="Employee"
                  onChange={(e) => setSelectedEmployee(e.target.value)}
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

            <Grid item xs={12} md={3}>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={exportSalaryReport}
                  disabled={filteredReports.length === 0}
                  size="small"
                  fullWidth
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
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

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
              <Typography variant="h6">
                {formatCurrency(
                  filteredReports.reduce((sum, r) => sum + r.salaryCalculation.baseSalary, 0)
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Base Salary
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon sx={{ fontSize: 40, color: theme.palette.error.main, mb: 1 }} />
              <Typography variant="h6">
                {formatCurrency(
                  filteredReports.reduce((sum, r) => sum + r.salaryCalculation.totalPenalties, 0)
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Penalties
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
              <Typography variant="h6">
                {formatCurrency(
                  filteredReports.reduce((sum, r) => sum + r.salaryCalculation.finalSalary, 0)
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Final Salary
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <LeaveIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
              <Typography variant="h6">
                {filteredReports.reduce((sum, r) => sum + r.attendance.leaveDays, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Leave Days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Employee Salary Reports - {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell align="right">Base Salary</TableCell>
                  <TableCell align="center">Working Days</TableCell>
                  <TableCell align="center">Leave Days</TableCell>
                  <TableCell align="right">Penalties</TableCell>
                  <TableCell align="right">Final Salary</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No salary reports found for the selected period
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <React.Fragment key={report.employee.id}>
                      <TableRow hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {report.employee.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {report.employee.employeeId || report.employee.id}
                              </Typography>
                            </Box>
                            <Tooltip title="View Attendance & Break Details">
                              <IconButton
                                size="small"
                                onClick={() => viewAttendanceDetails(report.employee)}
                                sx={{ ml: 1 }}
                              >
                                <DateRangeIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {formatCurrency(report.salaryCalculation.baseSalary)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={report.attendance.workingDays}
                            color="success"
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={report.attendance.leaveDays}
                            color={report.attendance.leaveDays > 0 ? "error" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={1}>
                            <Typography
                              variant="body2"
                              color={report.salaryCalculation.totalPenalties > 0 ? "error" : "text.secondary"}
                              fontWeight="medium"
                            >
                              {formatCurrency(report.salaryCalculation.totalPenalties)}
                            </Typography>
                            {report.penalties.length > 0 && (
                              <Badge badgeContent={report.penalties.length} color="error">
                                <IconButton
                                  size="small"
                                  onClick={() => viewPenaltyDetails(report.penalties)}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </Badge>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={
                              report.salaryCalculation.finalSalary < report.salaryCalculation.baseSalary
                                ? "error"
                                : "success"
                            }
                          >
                            {formatCurrency(report.salaryCalculation.finalSalary)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => toggleRowExpansion(report.employee.id)}
                          >
                            {expandedRows.has(report.employee.id) ? 
                              <ExpandLessIcon /> : <ExpandMoreIcon />
                            }
                          </IconButton>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row Details */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                          <Collapse in={expandedRows.has(report.employee.id)} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2 }}>
                              <Grid container spacing={3}>
                                {/* Penalty Breakdown */}
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Penalty Breakdown
                                  </Typography>
                                  <Table size="small">
                                    <TableBody>
                                      <TableRow>
                                        <TableCell>Hourly Penalties</TableCell>
                                        <TableCell align="right">
                                          {formatCurrency(report.salaryCalculation.penaltyBreakdown.hourly)}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>Leave Penalties</TableCell>
                                        <TableCell align="right">
                                          {formatCurrency(report.salaryCalculation.penaltyBreakdown.leave)}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>Manual Penalties</TableCell>
                                        <TableCell align="right">
                                          {formatCurrency(report.salaryCalculation.penaltyBreakdown.manual)}
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </Grid>

                                {/* Attendance Summary */}
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Attendance Summary
                                  </Typography>
                                  <Table size="small">
                                    <TableBody>
                                      <TableRow>
                                        <TableCell>Total Work Hours</TableCell>
                                        <TableCell align="right">
                                          {report.attendance.totalWorkHours}h
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell>Average Daily Hours</TableCell>
                                        <TableCell align="right">
                                          {report.attendance.workingDays > 0 
                                            ? Math.round((report.attendance.totalWorkHours / report.attendance.workingDays) * 100) / 100
                                            : 0
                                          }h
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </Grid>

                                {/* Quick Actions */}
                                <Grid item xs={12}>
                                  <Box display="flex" gap={1} flexWrap="wrap">
                                    {report.penalties.length > 0 && (
                                      <>
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          color="error"
                                          startIcon={<DeleteIcon />}
                                          onClick={() => openRemovePenaltyDialog(
                                            { ...report.penalties[0], employeeId: report.employee.id },
                                            'monthly'
                                          )}
                                        >
                                          Remove All Monthly Penalties
                                        </Button>
                                      </>
                                    )}
                                  </Box>
                                </Grid>
                              </Grid>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Penalty Details Dialog */}
      <Dialog
        open={penaltyDetailsOpen}
        onClose={() => setPenaltyDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Penalty Details</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedPenalties.map((penalty) => (
                  <TableRow key={penalty.id}>
                    <TableCell>{formatDate(penalty.date)}</TableCell>
                    <TableCell>
                      <Chip
                        label={penalty.type}
                        color={getPenaltyTypeColor(penalty.type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(penalty.amount)}
                    </TableCell>
                    <TableCell>{penalty.reason}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Remove this penalty">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => openRemovePenaltyDialog(penalty, 'single')}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {selectedPenalties.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No active penalties found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPenaltyDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Remove Penalty Dialog */}
      <Dialog
        open={removePenaltyDialogOpen}
        onClose={() => setRemovePenaltyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {removeType === 'single' && 'Remove Penalty'}
          {removeType === 'daily' && 'Remove Daily Penalties'}
          {removeType === 'monthly' && 'Remove Monthly Penalties'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              {removeType === 'single' && 'This will remove the selected penalty and recalculate the salary.'}
              {removeType === 'daily' && 'This will remove all penalties for the selected date and recalculate the salary.'}
              {removeType === 'monthly' && 'This will remove all penalties for the selected month and recalculate the salary.'}
            </Alert>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for Removal"
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              required
              helperText="Please provide a reason for removing the penalties"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemovePenaltyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRemovePenalty}
            variant="contained"
            color="error"
            disabled={!removeReason.trim() || loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Attendance Details Dialog with Break Details */}
      <Dialog
        open={attendanceDetailsOpen}
        onClose={() => setAttendanceDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <DateRangeIcon />
            <Box>
              <Typography variant="h6">
                Attendance Details - {selectedEmployeeAttendance?.employee?.name}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {attendanceDetailsLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : selectedEmployeeAttendance ? (
            <Box>
              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h6" color="success.main">
                        {selectedEmployeeAttendance.summary.workingDays}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Working Days
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h6" color="error.main">
                        {selectedEmployeeAttendance.summary.leaveDays}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Leave Days
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h6" color="warning.main">
                        {selectedEmployeeAttendance.summary.absentDays}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Absent Days
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h6" color="primary.main">
                        {selectedEmployeeAttendance.summary.totalWorkHours}h
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Hours
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Attendance Calendar with Break Details */}
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 2 }}>
                Daily Attendance & Break Details
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Day</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell align="center">Check In</TableCell>
                      <TableCell align="center">Check Out</TableCell>
                      <TableCell align="right">Work Hours</TableCell>
                      <TableCell align="center">Breaks</TableCell>
                      <TableCell align="right">Break Time</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedEmployeeAttendance.attendanceCalendar.map((day) => {
                      const getStatusColor = (status) => {
                        switch (status) {
                          case 'checked_out': return 'success';
                          case 'checked_in': return 'info';
                          case 'on_leave': return 'error';
                          case 'weekend': return 'default';
                          default: return 'warning';
                        }
                      };

                      const getStatusLabel = (status, isWeekend) => {
                        if (isWeekend) return 'Weekend';
                        switch (status) {
                          case 'checked_out': return 'Present';
                          case 'checked_in': return 'Checked In';
                          case 'on_leave': return 'Leave';
                          default: return 'Absent';
                        }
                      };

                      const formatTime = (timeStr) => {
                        if (!timeStr) return '-';
                        return new Date(`2000-01-01T${timeStr}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        });
                      };

                      const formatWorkHours = (minutes) => {
                        if (!minutes || minutes === 0) return '-';
                        const hours = Math.floor(minutes / 60);
                        const mins = minutes % 60;
                        return `${hours}h ${mins}m`;
                      };

                      return (
                        <TableRow 
                          key={day.date}
                          sx={{
                            backgroundColor: day.isWeekend 
                              ? theme.palette.action.hover 
                              : 'inherit',
                            '&:hover': {
                              backgroundColor: theme.palette.action.focus,
                            }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={day.isWeekend ? 'normal' : 'medium'}>
                              {new Date(day.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              color={day.isWeekend ? 'text.secondary' : 'text.primary'}
                            >
                              {day.dayName}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={getStatusLabel(day.status, day.isWeekend)}
                              color={getStatusColor(day.status)}
                              size="small"
                              variant={day.isWeekend ? 'outlined' : 'filled'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {formatTime(day.checkInTime)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {formatTime(day.checkOutTime)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatWorkHours(day.totalWorkTime)}
                            </Typography>
                          </TableCell>
                          {/* NEW: Break Details Column */}
                          <TableCell align="center">
                            {(day.breakCount || 0) > 0 ? (
                              <Tooltip 
                                title={
                                  <Box>
                                    <Typography variant="subtitle2" gutterBottom>Break Details:</Typography>
                                    {(day.breakDetails || []).map((br) => (
                                      <Box key={br.id} component="span" sx={{ display: 'block', fontSize: '0.75rem' }}>
                                        Break {br.id}: {formatTime(br.startTime)} - {br.endTime ? formatTime(br.endTime) : 'Ongoing'} 
                                        {br.duration > 0 && ` (${formatWorkHours(br.duration)})`}
                                      </Box>
                                    ))}
                                  </Box>
                                }
                                arrow
                              >
                                <Chip
                                  label={`${day.breakCount || 0} break${(day.breakCount || 0) > 1 ? 's' : ''}`}
                                  color={(day.breakCount || 0) > 3 ? 'error' : (day.breakCount || 0) > 1 ? 'warning' : 'info'}
                                  size="small"
                                  sx={{ cursor: 'help' }}
                                />
                              </Tooltip>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>

                          {/* NEW: Total Break Time Column */}
                          <TableCell align="right">
                            <Typography 
                              variant="body2"
                              color={(day.breakTime || 0) > 60 ? 'warning.main' : 'text.primary'}
                              fontWeight={(day.breakTime || 0) > 60 ? 'medium' : 'normal'}
                            >
                              {(day.breakTime || 0) > 0 ? formatWorkHours(day.breakTime) : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {day.leaveType && day.status === 'on_leave' ? 
                                `${day.leaveType}${day.leaveReason ? `: ${day.leaveReason}` : ''}` : 
                                ''
                              }
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttendanceDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalaryPenaltyTab;
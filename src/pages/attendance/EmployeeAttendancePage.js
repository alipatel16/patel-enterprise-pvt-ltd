// src/pages/attendance/EmployeeAttendancePage.js (Fixed with Employee ID and Pagination)
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
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
  Collapse,
  Button,
  TextField,
  InputAdornment,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Stack
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Today as TodayIcon,
  Schedule as ScheduleIcon,
  Coffee as BreakIcon,
  TrendingUp as TrendingUpIcon,
  EventBusy as LeaveIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Layout from '../../components/common/Layout/Layout';
import AttendanceChecker from '../../components/attendance/AttendanceChecker';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import attendanceService from '../../services/attendance/attendanceService';
import employeeService from '../../services/api/employeeService';

const EmployeeAttendancePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const { userType } = useUserType();

  // Core data states
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState([]); // For pagination
  const [employeeData, setEmployeeData] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10); // Records per page
  const [totalRecords, setTotalRecords] = useState(0);

  // Leave dialog states
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveType, setLeaveType] = useState('sick');

  // Wait for userType to be available before loading data
  useEffect(() => {
    if (userType && user?.uid) {
      loadEmployeeAndAttendanceData();
    } else if (userType === null || user === null) {
      setLoading(false);
      setError('Unable to load user information. Please refresh the page.');
    }
  }, [userType, user?.uid]);

  // Handle pagination when filtered records change
  useEffect(() => {
    applyFiltersAndPagination();
  }, [allAttendanceRecords, searchTerm, dateFilter, statusFilter, currentPage]);

  const loadEmployeeAndAttendanceData = async () => {
    if (!userType || !user?.uid) {
      console.warn('Cannot load data: missing userType or user');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // First, get the employee data using the user's Firebase Auth UID
      console.log('Loading employee data for userId:', user.uid);
      
      // Strategy 1: Try using employeeFirebaseId from user object if available
      let employeeRecord = null;
      
      if (user.employeeFirebaseId) {
        console.log('Using employeeFirebaseId from user:', user.employeeFirebaseId);
        try {
          employeeRecord = await employeeService.getEmployeeById(userType, user.employeeFirebaseId);
        } catch (error) {
          console.warn('Failed to get employee by employeeFirebaseId:', error);
        }
      }

      // Strategy 2: Search for employee by userId if Strategy 1 failed
      if (!employeeRecord) {
        console.log('Searching for employee by userId...');
        try {
          const allEmployees = await employeeService.getEmployees(userType);
          employeeRecord = allEmployees.employees.find(emp => emp.userId === user.uid);
          
          if (employeeRecord) {
            console.log('Found employee by userId:', employeeRecord.id);
          } else {
            console.log('No employee record found for userId:', user.uid);
          }
        } catch (error) {
          console.error('Failed to search employees:', error);
        }
      }

      if (!employeeRecord) {
        throw new Error('Employee record not found. Please contact your administrator.');
      }

      setEmployeeData(employeeRecord);
      console.log('Employee data loaded:', employeeRecord);

      // Use the correct employee Firebase key for all attendance operations
      const employeeFirebaseId = employeeRecord.id; // This is the Firebase key (e.g., "-OZtoBcZfbj41DZ6dQeV")
      console.log('Loading attendance for employee Firebase ID:', employeeFirebaseId);

      // Load attendance records and statistics
      const [records, statistics] = await Promise.all([
        attendanceService.getEmployeeAttendance(userType, employeeFirebaseId, 100), // Get more records for pagination
        attendanceService.getAttendanceStats(userType, employeeFirebaseId)
      ]);

      setAllAttendanceRecords(records);
      setStats(statistics);
      setTotalRecords(records.length);

      console.log('Attendance data loaded:', records.length, 'records');

    } catch (error) {
      console.error('Failed to load employee and attendance data:', error);
      setError(error.message || 'Failed to load attendance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndPagination = () => {
    // Apply filters
    const filteredRecords = allAttendanceRecords.filter(record => {
      const matchesSearch = !searchTerm || 
        record.date.includes(searchTerm) ||
        getStatusText(record.status).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = !dateFilter || 
        record.date === dateFilter.toISOString().split('T')[0];

      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    });

    // Apply pagination
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

    setAttendanceRecords(paginatedRecords);
    setTotalRecords(filteredRecords.length);
  };

  const handleMarkLeave = async () => {
    if (!userType || !employeeData) {
      setError('Unable to mark leave: employee information not available');
      return;
    }

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Check if already has attendance for today
      const todayAttendance = allAttendanceRecords.find(record => record.date === today);
      if (todayAttendance) {
        setError('You already have attendance record for today. Cannot mark leave.');
        return;
      }

      // Use the correct employee Firebase key
      await attendanceService.markLeave(userType, {
        employeeId: employeeData.id, // Use Firebase key, not user.uid
        employeeName: employeeData.name,
        date: today,
        leaveType,
        reason: leaveReason,
        status: 'on_leave'
      });

      setLeaveDialogOpen(false);
      setLeaveReason('');
      setLeaveType('sick');
      
      // Reload data
      await loadEmployeeAndAttendanceData();
    } catch (error) {
      setError('Failed to mark leave: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (newFilter) => {
    setCurrentPage(1); // Reset to first page when filter changes
    if (typeof newFilter === 'function') {
      newFilter();
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateFilter(null);
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'checked_in': return 'success';
      case 'on_break': return 'warning';
      case 'checked_out': return 'default';
      case 'on_leave': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'checked_in': return 'Working';
      case 'on_break': return 'On Break';
      case 'checked_out': return 'Completed';
      case 'on_leave': return 'On Leave';
      default: return 'Unknown';
    }
  };

  const toggleRowExpansion = (recordId) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(recordId)) {
      newExpandedRows.delete(recordId);
    } else {
      newExpandedRows.add(recordId);
    }
    setExpandedRows(newExpandedRows);
  };

  const breadcrumbs = [
    { label: 'Attendance', path: '/attendance' }
  ];

  // Check if can mark leave today
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = allAttendanceRecords.find(record => record.date === today);
  const canMarkLeave = !todayAttendance;

  // Calculate pagination info
  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  // Show loading spinner if userType, user, or employee data are not yet available
  if (!userType || !user || loading) {
    return (
      <Layout title="My Attendance" breadcrumbs={breadcrumbs}>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading attendance data...
            </Typography>
          </Box>
        </Container>
      </Layout>
    );
  }

  // Show error if employee data couldn't be loaded
  if (!employeeData) {
    return (
      <Layout title="My Attendance" breadcrumbs={breadcrumbs}>
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 3 }}>
            Employee record not found. Please contact your administrator.
            <Button onClick={loadEmployeeAndAttendanceData} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout title="My Attendance" breadcrumbs={breadcrumbs}>
      <Container maxWidth="lg">

        {/* Today's Attendance Checker */}
        <Box mb={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
              Today's Attendance
            </Typography>
            {canMarkLeave && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<LeaveIcon />}
                onClick={() => setLeaveDialogOpen(true)}
                size={isMobile ? "small" : "medium"}
              >
                Mark Leave
              </Button>
            )}
          </Box>
          <AttendanceChecker />
        </Box>

        {/* Statistics Cards - Enhanced for Mobile */}
        <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                textAlign: 'center',
                p: isMobile ? 2 : 3,
                '&:last-child': { pb: isMobile ? 2 : 3 }
              }}>
                <TodayIcon sx={{ 
                  fontSize: isMobile ? 32 : 40, 
                  color: theme.palette.primary.main, 
                  mb: 1 
                }} />
                <Typography variant={isMobile ? "h6" : "h5"} component="div" fontWeight="bold">
                  {stats.monthlyPresent || 0}
                </Typography>
                <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                  Days This Month
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                textAlign: 'center',
                p: isMobile ? 2 : 3,
                '&:last-child': { pb: isMobile ? 2 : 3 }
              }}>
                <ScheduleIcon sx={{ 
                  fontSize: isMobile ? 32 : 40, 
                  color: theme.palette.success.main, 
                  mb: 1 
                }} />
                <Typography variant={isMobile ? "h6" : "h5"} component="div" fontWeight="bold">
                  {Math.round((stats.totalWorkHours || 0) * 10) / 10}h
                </Typography>
                <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                  Total Hours
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                textAlign: 'center',
                p: isMobile ? 2 : 3,
                '&:last-child': { pb: isMobile ? 2 : 3 }
              }}>
                <TrendingUpIcon sx={{ 
                  fontSize: isMobile ? 32 : 40, 
                  color: theme.palette.warning.main, 
                  mb: 1 
                }} />
                <Typography variant={isMobile ? "h6" : "h5"} component="div" fontWeight="bold">
                  {Math.round((stats.averageWorkHours || 0) * 10) / 10}h
                </Typography>
                <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                  Average Daily
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ 
                textAlign: 'center',
                p: isMobile ? 2 : 3,
                '&:last-child': { pb: isMobile ? 2 : 3 }
              }}>
                <BreakIcon sx={{ 
                  fontSize: isMobile ? 32 : 40, 
                  color: theme.palette.info.main, 
                  mb: 1 
                }} />
                <Typography variant={isMobile ? "h6" : "h5"} component="div" fontWeight="bold">
                  {stats.monthlyLeaves || 0}
                </Typography>
                <Typography variant={isMobile ? "caption" : "body2"} color="text.secondary">
                  Leaves This Month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Attendance History */}
        <Card>
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant={isMobile ? "h6" : "h5"}>
                Attendance History ({totalRecords} records)
              </Typography>
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={clearFilters}
                  disabled={!searchTerm && !dateFilter && statusFilter === 'all'}
                >
                  Clear Filters
                </Button>
              </Box>
            </Box>

            {/* Mobile-Optimized Filters */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  size={isMobile ? "small" : "medium"}
                  placeholder="Search by date or status..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleFilterChange();
                  }}
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
                  label="Filter by Date"
                  value={dateFilter}
                  onChange={(newDate) => {
                    setDateFilter(newDate);
                    handleFilterChange();
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: isMobile ? "small" : "medium"
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      handleFilterChange();
                    }}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="checked_in">Working</MenuItem>
                    <MenuItem value="on_break">On Break</MenuItem>
                    <MenuItem value="checked_out">Completed</MenuItem>
                    <MenuItem value="on_leave">On Leave</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Mobile-Optimized Records Table */}
            {isMobile ? (
              // Mobile Card View
              <Box>
                {attendanceRecords.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                    No attendance records found
                  </Typography>
                ) : (
                  attendanceRecords.map((record) => (
                    <Card key={record.id} sx={{ mb: 2, border: 1, borderColor: 'divider' }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                          <Box>
                            <Typography variant="body1" fontWeight="bold">
                              {formatDate(record.date)}
                            </Typography>
                            <Chip
                              label={getStatusText(record.status)}
                              color={getStatusColor(record.status)}
                              size="small"
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                          <IconButton
                            size="small"
                            onClick={() => toggleRowExpansion(record.id)}
                          >
                            {expandedRows.has(record.id) ? 
                              <ExpandLessIcon /> : <ExpandMoreIcon />
                            }
                          </IconButton>
                        </Box>

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Check In</Typography>
                            <Typography variant="body2">{formatTime(record.checkInTime)}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Check Out</Typography>
                            <Typography variant="body2">{formatTime(record.checkOutTime)}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Work Time</Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {formatDuration(record.totalWorkTime)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary">Break Time</Typography>
                            <Typography variant="body2">
                              {formatDuration(record.totalBreakTime)}
                            </Typography>
                          </Grid>
                        </Grid>

                        {/* Expanded Details */}
                        <Collapse in={expandedRows.has(record.id)} timeout="auto" unmountOnExit>
                          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Break Details
                            </Typography>
                            {record.breaks && record.breaks.length > 0 ? (
                              record.breaks.map((breakItem, index) => (
                                <Box key={index} sx={{ mb: 1 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Break {index + 1}: {formatTime(breakItem.startTime)} - {
                                      breakItem.endTime ? formatTime(breakItem.endTime) : 'Ongoing'
                                    } ({formatDuration(breakItem.duration)})
                                  </Typography>
                                </Box>
                              ))
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No breaks taken
                              </Typography>
                            )}
                            
                            {record.status === 'on_leave' && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Leave Details
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Type: {record.leaveType || 'Not specified'}
                                </Typography>
                                {record.leaveReason && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Reason: {record.leaveReason}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </CardContent>
                    </Card>
                  ))
                )}
              </Box>
            ) : (
              // Desktop Table View
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Check In</TableCell>
                      <TableCell>Check Out</TableCell>
                      <TableCell>Work Time</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No attendance records found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendanceRecords.map((record) => (
                        <React.Fragment key={record.id}>
                          <TableRow hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {formatDate(record.date)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {formatTime(record.checkInTime)}
                            </TableCell>
                            <TableCell>
                              {formatTime(record.checkOutTime)}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {formatDuration(record.totalWorkTime)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusText(record.status)}
                                color={getStatusColor(record.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => toggleRowExpansion(record.id)}
                              >
                                {expandedRows.has(record.id) ? 
                                  <ExpandLessIcon /> : <ExpandMoreIcon />
                                }
                              </IconButton>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Row Details */}
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                              <Collapse in={expandedRows.has(record.id)} timeout="auto" unmountOnExit>
                                <Box sx={{ margin: 2 }}>
                                  <Typography variant="h6" gutterBottom component="div">
                                    {record.status === 'on_leave' ? 'Leave Details' : 'Break Details'}
                                  </Typography>
                                  
                                  {record.status === 'on_leave' ? (
                                    <Box>
                                      <Typography variant="body2" gutterBottom>
                                        <strong>Leave Type:</strong> {record.leaveType || 'Not specified'}
                                      </Typography>
                                      {record.leaveReason && (
                                        <Typography variant="body2" gutterBottom>
                                          <strong>Reason:</strong> {record.leaveReason}
                                        </Typography>
                                      )}
                                    </Box>
                                  ) : (
                                    <>
                                      {record.breaks && record.breaks.length > 0 ? (
                                        <Table size="small">
                                          <TableHead>
                                            <TableRow>
                                              <TableCell>Break #</TableCell>
                                              <TableCell>Start Time</TableCell>
                                              <TableCell>End Time</TableCell>
                                              <TableCell>Duration</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {record.breaks.map((breakItem, index) => (
                                              <TableRow key={index}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{formatTime(breakItem.startTime)}</TableCell>
                                                <TableCell>
                                                  {breakItem.endTime ? formatTime(breakItem.endTime) : 'Ongoing'}
                                                </TableCell>
                                                <TableCell>{formatDuration(breakItem.duration)}</TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      ) : (
                                        <Typography variant="body2" color="text.secondary">
                                          No breaks taken
                                        </Typography>
                                      )}
                                      <Typography variant="body2" sx={{ mt: 1 }}>
                                        <strong>Total Break Time:</strong> {formatDuration(record.totalBreakTime)}
                                      </Typography>
                                    </>
                                  )}
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
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={3}>
                <Stack spacing={2}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                    showFirstButton
                    showLastButton
                  />
                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Showing {Math.min((currentPage - 1) * recordsPerPage + 1, totalRecords)} to{' '}
                    {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} records
                  </Typography>
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Leave Marking Dialog */}
        <Dialog 
          open={leaveDialogOpen} 
          onClose={() => setLeaveDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={isSmallMobile}
        >
          <DialogTitle>Mark Leave for Today</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Leave Type</InputLabel>
                <Select
                  value={leaveType}
                  label="Leave Type"
                  onChange={(e) => setLeaveType(e.target.value)}
                >
                  <MenuItem value="sick">Sick Leave</MenuItem>
                  <MenuItem value="personal">Personal Leave</MenuItem>
                  <MenuItem value="emergency">Emergency Leave</MenuItem>
                  <MenuItem value="vacation">Vacation</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason (Optional)"
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="Please provide a reason for your leave..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleMarkLeave} 
              variant="contained" 
              color="error"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Mark Leave'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default EmployeeAttendancePage;
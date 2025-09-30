// src/pages/reports/EmployeeReportsPage.js - Updated with Upaad Management Tab
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
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Photo as PhotoIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  AttachMoney as MoneyIcon,
  Assessment as ReportIcon,
  AccountBalance as UpaadIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import Layout from '../../components/common/Layout/Layout';
import LoadingSpinner from '../../components/common/UI/LoadingSpinner';
import PenaltySettings from '../../components/admin/PenaltySettings';
import ManualPenaltyApplication from '../../components/admin/ManualPenaltyApplication';
import SalaryPenaltyTab from '../admin/SalaryPenaltyReports';
import UpaadManagementTab from '../admin/UpaadManagementTab';
import { EmployeeProvider, useEmployee } from '../../contexts/EmployeeContext/EmployeeContext';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import attendanceService from '../../services/attendance/attendanceService';
import penaltyService from '../../services/penalty/penaltyService';
import { base64ToImageUrl } from '../../utils/helpers/photoUtils';

// Main content component that has access to EmployeeProvider
const EmployeeReportsContent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { userType } = useUserType();
  const { loadEmployeeStats, stats: employeeStats } = useEmployee();

  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    totalWorkHours: 0,
    avgWorkHours: 0,
    totalPenalties: 0,
    activePenalties: 0
  });

  useEffect(() => {
    if (userType && user?.uid) {
      loadAttendanceData();
      loadPenaltyStats();
      loadEmployeeStats();
    } else if (userType === null || user === null) {
      setLoading(false);
      setError('Unable to load user information. Please refresh the page.');
    }
  }, [userType, user?.uid, dateFilter, loadEmployeeStats]);

  useEffect(() => {
    applyFilters();
  }, [attendanceRecords, searchTerm, statusFilter]);

  const loadAttendanceData = async () => {
    if (!userType || !user?.uid) {
      console.warn('Cannot load attendance data: missing userType or user');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const dateParam = dateFilter ? 
        `${dateFilter.getFullYear()}-${(dateFilter.getMonth() + 1).toString().padStart(2, '0')}-${dateFilter.getDate().toString().padStart(2, '0')}` 
        : null;
      const records = await attendanceService.getAllEmployeesAttendance(userType, dateParam);
      
      setAttendanceRecords(records);
      calculateAttendanceStats(records);
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      setError('Failed to load attendance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPenaltyStats = async () => {
    if (!userType) return;

    try {
      const currentDate = new Date();
      const startDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-01`;
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

      const settings = await penaltyService.getPenaltySettings(userType);
      
      setStats(prev => ({
        ...prev,
        penaltySettings: settings
      }));
    } catch (error) {
      console.warn('Failed to load penalty stats:', error);
    }
  };

  const calculateAttendanceStats = (records) => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = records.filter(r => r.date === today);
    
    const presentTodayRecords = todayRecords.filter(r => r.status !== 'on_leave');
    
    const totalWorkMinutes = records.reduce((sum, r) => sum + (r.totalWorkTime || 0), 0);
    
    setStats(prev => ({
      ...prev,
      presentToday: presentTodayRecords.length,
      totalWorkHours: Math.round(totalWorkMinutes / 60 * 100) / 100,
      avgWorkHours: records.length > 0 ? Math.round((totalWorkMinutes / records.length / 60) * 100) / 100 : 0
    }));
  };

  useEffect(() => {
    if (employeeStats) {
      setStats(prev => ({
        ...prev,
        totalEmployees: employeeStats.total || 0,
        activeEmployees: employeeStats.active || 0
      }));
    }
  }, [employeeStats]);

  const applyFilters = () => {
    let filtered = [...attendanceRecords];

    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.date.includes(searchTerm) ||
        getStatusText(record.status).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    setFilteredRecords(filtered);
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

  const openPhotoDialog = (photo, employeeName, date) => {
    setSelectedPhoto({ photo, employeeName, date });
    setPhotoDialogOpen(true);
  };

  const closePhotoDialog = () => {
    setSelectedPhoto(null);
    setPhotoDialogOpen(false);
  };

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Date', 'Check In', 'Check Out', 'Work Time', 'Break Time', 'Status'];
    const csvData = filteredRecords.map(record => [
      record.employeeName,
      record.date,
      record.checkInTime || 'N/A',
      record.checkOutTime || 'N/A',
      formatDuration(record.totalWorkTime),
      formatDuration(record.totalBreakTime),
      getStatusText(record.status)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee_attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const canViewPenaltySettings = user?.role === 'admin';
  const canApplyPenalties = user?.role === 'admin';
  const canViewSalaryReports = user?.role === 'admin' || user?.role === 'manager';
  const canManageUpaad = user?.role === 'admin' || user?.role === 'manager';

  const getAvailableTabs = () => {
    const tabs = [
      { label: 'Attendance Records', icon: <CalendarIcon />, id: 'attendance' }
    ];

    if (canViewPenaltySettings) {
      tabs.push({ label: 'Penalty Settings', icon: <SettingsIcon />, id: 'penalty-settings' });
    }

    if (canApplyPenalties) {
      tabs.push({ label: 'Apply Penalties', icon: <MoneyIcon />, id: 'apply-penalties' });
    }

    if (canViewSalaryReports) {
      tabs.push({ label: 'Salary Reports', icon: <ReportIcon />, id: 'salary-reports' });
    }

    if (canManageUpaad) {
      tabs.push({ label: 'Employee Upaad', icon: <UpaadIcon />, id: 'upaad-management' });
    }

    return tabs;
  };

  const availableTabs = getAvailableTabs();

  const breadcrumbs = [
    { label: 'Employee Reports', path: '/employees' }
  ];

  if (!userType || !user) {
    return (
      <Layout title="Employee Reports" breadcrumbs={breadcrumbs}>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (loading && attendanceRecords.length === 0) {
    return (
      <Layout title="Employee Reports" breadcrumbs={breadcrumbs}>
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout title="Employee Reports" breadcrumbs={breadcrumbs}>
      <Container maxWidth="xl">
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <GroupIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
                <Typography variant="h6" component="div">
                  {stats.totalEmployees}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Employees
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CalendarIcon sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
                <Typography variant="h6" component="div">
                  {stats.presentToday}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Present Today
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ScheduleIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
                <Typography variant="h6" component="div">
                  {stats.totalWorkHours}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Work Hours
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
                <Typography variant="h6" component="div">
                  {stats.avgWorkHours}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Hours
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content with Tabs */}
        <Card>
          <CardContent>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={tabValue} 
                onChange={(e, newValue) => setTabValue(newValue)}
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons={isMobile ? "auto" : false}
                allowScrollButtonsMobile
              >
                {availableTabs.map((tab, index) => (
                  <Tab
                    key={tab.id}
                    label={tab.label}
                    icon={tab.icon}
                    iconPosition="start"
                    sx={{
                      minHeight: 20,
                      textTransform: 'none',
                      fontSize: '0.95rem',
                      '& .MuiTab-iconWrapper': {
                        marginBottom: 0,
                        marginRight: 1
                      }
                    }}
                  />
                ))}
              </Tabs>
            </Box>

            {/* Tab Content */}
            {availableTabs[tabValue]?.id === 'attendance' && (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6">
                    Attendance Records
                  </Typography>
                  <Box display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<DownloadIcon />}
                      onClick={exportToCSV}
                      disabled={filteredRecords.length === 0}
                      size={isMobile ? "small" : "medium"}
                    >
                      Export CSV
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={loadAttendanceData}
                      disabled={loading}
                      size={isMobile ? "small" : "medium"}
                    >
                      Refresh
                    </Button>
                  </Box>
                </Box>

                {/* Filters */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size={isMobile ? "small" : "medium"}
                      placeholder="Search by employee name, date, or status..."
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
                  <Grid item xs={12} md={4}>
                    <DatePicker
                      label="Filter by Date"
                      format='dd/MM/yyyy'
                      value={dateFilter}
                      onChange={setDateFilter}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: isMobile ? "small" : "medium"
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                      <InputLabel>Status Filter</InputLabel>
                      <Select
                        value={statusFilter}
                        label="Status Filter"
                        onChange={(e) => setStatusFilter(e.target.value)}
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

                {/* Records Table */}
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Employee</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Check In</TableCell>
                        <TableCell>Check Out</TableCell>
                        <TableCell>Work Time</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Photo</TableCell>
                        <TableCell align="center">Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            <Typography variant="body2" color="text.secondary">
                              No attendance records found
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRecords.map((record) => (
                          <React.Fragment key={record.id}>
                            <TableRow hover>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Avatar sx={{ width: 32, height: 32 }}>
                                    {record.employeeName.charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Typography variant="body2" fontWeight="medium">
                                    {record.employeeName}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
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
                                {record.checkInPhoto && (
                                  <Tooltip title="View check-in photo">
                                    <IconButton
                                      size="small"
                                      onClick={() => openPhotoDialog(
                                        record.checkInPhoto,
                                        record.employeeName,
                                        record.date
                                      )}
                                    >
                                      <PhotoIcon />
                                    </IconButton>
                                  </Tooltip>
                                )}
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
                              <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                                <Collapse in={expandedRows.has(record.id)} timeout="auto" unmountOnExit>
                                  <Box sx={{ margin: 2 }}>
                                    <Typography variant="h6" gutterBottom component="div">
                                      Break Details
                                    </Typography>
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
              </>
            )}

            {/* Penalty Settings Tab */}
            {availableTabs[tabValue]?.id === 'penalty-settings' && (
              <PenaltySettings />
            )}

            {/* Manual Penalty Application Tab */}
            {availableTabs[tabValue]?.id === 'apply-penalties' && (
              <ManualPenaltyApplication />
            )}

            {/* Salary Reports Tab */}
            {availableTabs[tabValue]?.id === 'salary-reports' && (
              <SalaryPenaltyTab />
            )}

            {/* Upaad Management Tab */}
            {availableTabs[tabValue]?.id === 'upaad-management' && (
              <UpaadManagementTab />
            )}
          </CardContent>
        </Card>

        {/* Photo Dialog */}
        <Dialog
          open={photoDialogOpen}
          onClose={closePhotoDialog}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Check-in Photo - {selectedPhoto?.employeeName}
              </Typography>
              <IconButton onClick={closePhotoDialog}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedPhoto && (
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Date: {formatDate(selectedPhoto.date)}
                </Typography>
                <img
                  src={base64ToImageUrl(selectedPhoto.photo)}
                  alt="Employee check-in"
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    borderRadius: theme.shape.borderRadius
                  }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closePhotoDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

// Main component wrapper with EmployeeProvider
const EmployeeReportsPage = () => {
  return (
    <EmployeeProvider>
      <EmployeeReportsContent />
    </EmployeeProvider>
  );
};

export default EmployeeReportsPage;
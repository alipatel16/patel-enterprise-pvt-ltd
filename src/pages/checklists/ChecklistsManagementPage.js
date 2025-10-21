// src/pages/checklists/ChecklistsManagementPage.js - Admin Calendar View with Search
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Badge,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ChecklistRtl as ChecklistIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CompletedIcon,
  Cancel as NotCompletedIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import SearchBar from '../../components/common/UI/SearchBar';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import checklistService from '../../services/checklistService';

const ChecklistsManagementPage = () => {
  const navigate = useNavigate();
  const { userType } = useUserType();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [checklists, setChecklists] = useState([]);
  const [calendarData, setCalendarData] = useState({});
  const [employees, setEmployees] = useState([]);
  const [monthStats, setMonthStats] = useState({});
  const [error, setError] = useState('');

  // NEW: Search state
  const [searchValue, setSearchValue] = useState('');

  // Load data on component mount and when month/year changes
  useEffect(() => {
    loadData();
  }, [userType, selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      if (currentTab === 0) {
        // Load checklists list
        const checklistsData = await checklistService.getChecklists(userType);
        setChecklists(checklistsData);
      } else {
        // Load calendar data
        const calendarResponse = await checklistService.getCalendarData(userType, selectedMonth, selectedYear);
        setCalendarData(calendarResponse.calendarData);
        setEmployees(calendarResponse.employees);
        setMonthStats(calendarResponse.monthStats);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    // Clear search when changing tabs
    setSearchValue('');
    // Reload data for the new tab
    setTimeout(() => loadData(), 100);
  };

  const handleDeleteChecklist = async (checklistId) => {
    if (!window.confirm('Are you sure you want to delete this checklist? This will also remove all completion records.')) {
      return;
    }

    try {
      await checklistService.deleteChecklist(userType, checklistId);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error deleting checklist:', error);
      setError('Failed to delete checklist. Please try again.');
    }
  };

  // NEW: Filter checklists based on search
  const filteredChecklists = useMemo(() => {
    if (!searchValue.trim()) {
      return checklists;
    }

    const searchTerm = searchValue.toLowerCase().trim();
    return checklists.filter((checklist) => {
      return (
        checklist.title?.toLowerCase().includes(searchTerm) ||
        checklist.description?.toLowerCase().includes(searchTerm) ||
        checklist.assignedEmployeeNames?.some(name => 
          name.toLowerCase().includes(searchTerm)
        ) ||
        checklist.backupEmployeeNames?.some(name => 
          name.toLowerCase().includes(searchTerm)
        ) ||
        checklist.recurrence?.type?.toLowerCase().includes(searchTerm)
      );
    });
  }, [checklists, searchValue]);

  // NEW: Search handlers
  const handleSearchChange = (value) => {
    setSearchValue(value);
  };

  const handleSearchClear = () => {
    setSearchValue('');
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
  };

  const renderCalendarCell = (employeeId, checklistId, date) => {
    const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;
    
    const employeeData = calendarData[employeeId];
    if (!employeeData || !employeeData.checklists[checklistId]) {
      return (
        <TableCell key={date} align="center" sx={{ width: 30, height: 40, p: 0.5 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: 'grey.200', borderRadius: '50%' }} />
        </TableCell>
      );
    }

    const completion = employeeData.checklists[checklistId].completions[dateStr];
    
    if (!completion) {
      return (
        <TableCell key={date} align="center" sx={{ width: 30, height: 40, p: 0.5 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: 'grey.200', borderRadius: '50%' }} />
        </TableCell>
      );
    }

    const getCompletionIcon = () => {
      if (completion.completed) {
        return (
          <Tooltip title={`Completed at ${new Date(completion.completedAt).toLocaleTimeString()}`}>
            <CompletedIcon 
              sx={{ 
                color: 'success.main', 
                fontSize: 20,
                cursor: 'pointer'
              }} 
            />
          </Tooltip>
        );
      } else {
        return (
          <Tooltip title={`Not completed. Reason: ${completion.reason || 'No reason provided'}`}>
            <NotCompletedIcon 
              sx={{ 
                color: 'error.main', 
                fontSize: 20,
                cursor: 'pointer'
              }} 
            />
          </Tooltip>
        );
      }
    };

    return (
      <TableCell key={date} align="center" sx={{ width: 30, height: 40, p: 0.5 }}>
        {completion.isBackup && (
          <Badge
            badgeContent="B"
            color="warning"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: 8,
                minWidth: 12,
                height: 12
              }
            }}
          >
            {getCompletionIcon()}
          </Badge>
        )}
        {!completion.isBackup && getCompletionIcon()}
      </TableCell>
    );
  };

  const getMonthOptions = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    return months.map((month, index) => (
      <MenuItem key={index} value={index + 1}>
        {month}
      </MenuItem>
    ));
  };

  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      years.push(
        <MenuItem key={year} value={year}>
          {year}
        </MenuItem>
      );
    }
    return years;
  };

  const breadcrumbs = [
    {
      label: 'Checklists',
      icon: <ChecklistIcon sx={{ fontSize: 16 }} />
    }
  ];

  if (loading) {
    return (
      <Layout title="Checklists Management" breadcrumbs={breadcrumbs}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading checklists...
          </Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Checklists Management" breadcrumbs={breadcrumbs}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Header with Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1" fontWeight={600}>
          Checklists Management
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/checklists/create')}
          >
            Create Checklist
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
        >
          <Tab 
            label="Checklists List" 
            icon={<ChecklistIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Calendar View" 
            icon={<CalendarIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {currentTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              All Checklists
            </Typography>

            {/* NEW: Search Bar */}
            <Box mb={3}>
              <SearchBar
                value={searchValue}
                onChange={handleSearchChange}
                onClear={handleSearchClear}
                placeholder="Search by title, description, assigned employees, or schedule..."
                disabled={loading}
              />
            </Box>
            
            {filteredChecklists.length === 0 ? (
              <Alert severity="info">
                {searchValue 
                  ? 'No checklists found matching your search criteria.'
                  : 'No checklists found. Create your first checklist to get started.'
                }
              </Alert>
            ) : (
              <>
                {searchValue && (
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Showing {filteredChecklists.length} of {checklists.length} checklist{checklists.length !== 1 ? 's' : ''}
                  </Typography>
                )}
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Title</strong></TableCell>
                        <TableCell><strong>Description</strong></TableCell>
                        <TableCell><strong>Assigned Employees</strong></TableCell>
                        <TableCell><strong>Backup Employees</strong></TableCell>
                        <TableCell><strong>Schedule</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell align="center"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredChecklists.map((checklist) => (
                        <TableRow key={checklist.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {checklist.title}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="textSecondary">
                              {checklist.description?.substring(0, 50)}
                              {checklist.description?.length > 50 ? '...' : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {checklist.assignedEmployeeNames?.map((name, index) => (
                                <Chip 
                                  key={index}
                                  label={name} 
                                  size="small" 
                                  color="primary"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" flexWrap="wrap" gap={0.5}>
                              {checklist.backupEmployeeNames?.map((name, index) => (
                                <Chip 
                                  key={index}
                                  label={name} 
                                  size="small" 
                                  color="warning"
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {checklist.recurrence?.type === 'daily' && 'Daily'}
                              {checklist.recurrence?.type === 'weekly' && `Weekly (${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][checklist.recurrence.dayOfWeek]})`}
                              {checklist.recurrence?.type === 'monthly' && `Monthly (${checklist.recurrence.dayOfMonth}${checklist.recurrence.dayOfMonth === 1 ? 'st' : checklist.recurrence.dayOfMonth === 2 ? 'nd' : checklist.recurrence.dayOfMonth === 3 ? 'rd' : 'th'})`}
                              {checklist.recurrence?.type === 'once' && 'One Time'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={checklist.isActive ? 'Active' : 'Inactive'}
                              color={checklist.isActive ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" justifyContent="center" gap={1}>
                              <Tooltip title="Edit">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => navigate(`/checklists/edit/${checklist.id}`)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleDeleteChecklist(checklist.id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {currentTab === 1 && (
        <Box>
          {/* Month/Year Selector */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">
                  Calendar View - Employee Checklist Completion Tracking
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      label="Month"
                    >
                      {getMonthOptions()}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      label="Year"
                    >
                      {getYearOptions()}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Legend */}
              <Box display="flex" alignItems="center" gap={3} mt={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <CompletedIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="body2">Completed</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <NotCompletedIcon sx={{ color: 'error.main', fontSize: 20 }} />
                  <Typography variant="body2">Not Completed</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Badge badgeContent="B" color="warning">
                    <CompletedIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  </Badge>
                  <Typography variant="body2">Backup Assignment</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 20, height: 20, bgcolor: 'grey.200', borderRadius: '50%' }} />
                  <Typography variant="body2">No Assignment</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Calendar Grid */}
          {employees.length === 0 ? (
            <Alert severity="info">
              No employee data available for the selected month.
            </Alert>
          ) : (
            <Box>
              {employees.map((employee) => {
                const employeeData = calendarData[employee.id];
                if (!employeeData || Object.keys(employeeData.checklists).length === 0) {
                  return null;
                }

                return (
                  <Accordion key={employee.id} sx={{ mb: 2 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" width="100%">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {employee.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6">
                            {employee.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {employee.department} • ID: {employee.employeeId}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          {/* Employee stats for the month */}
                          {monthStats.byEmployee && monthStats.byEmployee[employee.id] && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip 
                                label={`${monthStats.byEmployee[employee.id].completed}/${monthStats.byEmployee[employee.id].total}`}
                                color={monthStats.byEmployee[employee.id].completed === monthStats.byEmployee[employee.id].total ? 'success' : 'warning'}
                                size="small"
                              />
                              <Typography variant="caption" color="textSecondary">
                                {monthStats.byEmployee[employee.id].total > 0 
                                  ? Math.round((monthStats.byEmployee[employee.id].completed / monthStats.byEmployee[employee.id].total) * 100)
                                  : 0
                                }%
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box>
                        {Object.entries(employeeData.checklists).map(([checklistId, checklistData]) => (
                          <Box key={checklistId} mb={3}>
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                              {checklistData.checklistTitle}
                            </Typography>
                            
                            {/* Calendar table for this checklist */}
                            <TableContainer component={Paper} variant="outlined" sx={{ mt: 1 }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
                                      Checklist
                                    </TableCell>
                                    {Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1).map(date => (
                                      <TableCell key={date} align="center" sx={{ width: 30, p: 0.5 }}>
                                        <Typography variant="caption">
                                          {date}
                                        </Typography>
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>
                                      {checklistData.checklistTitle}
                                    </TableCell>
                                    {Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }, (_, i) => i + 1).map(date => 
                                      renderCalendarCell(employee.id, checklistId, date)
                                    )}
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        ))}
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
        </Box>
      )}
    </Layout>
  );
};

export default ChecklistsManagementPage;
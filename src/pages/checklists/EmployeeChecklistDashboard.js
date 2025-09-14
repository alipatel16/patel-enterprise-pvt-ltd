// src/pages/checklists/EmployeeChecklistDashboard.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  IconButton,
  Tabs,
  Tab,
  Badge,
  Paper,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  AssignmentTurnedIn as TaskIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  AssignmentLate as OverdueIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import checklistService from '../../services/checklistService';

const EmployeeChecklistDashboard = () => {
  const { user } = useAuth();
  const { userType } = useUserType();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [todayChecklists, setTodayChecklists] = useState([]);
  const [historyChecklists, setHistoryChecklists] = useState([]);
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayCompleted: 0,
    todayPending: 0
  });
  
  const [completionDialog, setCompletionDialog] = useState({
    open: false,
    checklist: null
  });
  
  const [completionForm, setCompletionForm] = useState({
    completed: true,
    reason: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [userType, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user) {
        setError('User not found. Please log in again.');
        return;
      }

      // Load today's checklists and stats with auto-generation
      const [todayData, historyData, statsData] = await Promise.all([
        checklistService.getTodayChecklistsForEmployee(userType, user),
        loadHistoryData(),
        checklistService.getDashboardStatsWithGeneration(userType, user)
      ]);
      
      setTodayChecklists(todayData);
      setHistoryChecklists(historyData);
      setStats({
        todayTotal: statsData.todayTotal,
        todayCompleted: statsData.todayCompleted,
        todayPending: statsData.todayPending
      });
      
    } catch (error) {
      console.error('Error loading checklist data:', error);
      setError('Failed to load checklist data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistoryData = async () => {
    try {
      // Get last 30 days of completions
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      const startDateStr = startDate.toISOString().split('T')[0];

      // Get user's employee ID
      const employeeId = await checklistService.resolveEmployeeId(user, userType);
      
      const historyCompletions = await checklistService.getCompletions(userType, {
        employeeId: employeeId,
        dateRange: {
          start: startDateStr,
          end: endDate
        }
      });

      // Filter out today's data
      const today = new Date().toISOString().split('T')[0];
      return historyCompletions.filter(completion => completion.date !== today);

    } catch (error) {
      console.error('Error loading history data:', error);
      return [];
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    setSuccess('Checklists refreshed successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleOpenCompletionDialog = (checklist) => {
    setCompletionDialog({
      open: true,
      checklist
    });
    
    setCompletionForm({
      completed: checklist.completed || false,
      reason: checklist.reason || ''
    });
    setError('');
  };

  const handleCloseCompletionDialog = () => {
    setCompletionDialog({ open: false, checklist: null });
    setCompletionForm({ completed: true, reason: '' });
    setError('');
  };

  const validateCompletion = () => {
    if (!completionForm.completed && !completionForm.reason.trim()) {
      return 'Please provide a reason for not completing this checklist';
    }
    if (!completionForm.completed && completionForm.reason.length < 10) {
      return 'Reason must be at least 10 characters long';
    }
    if (completionForm.reason.length > 200) {
      return 'Reason must be less than 200 characters';
    }
    return null;
  };

  const handleSubmitCompletion = async () => {
    const validationError = validateCompletion();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError('');
      
      // Get employee ID
      const employeeId = await checklistService.resolveEmployeeId(user, userType);
      
      const completionRecord = {
        checklistId: completionDialog.checklist.checklistId,
        checklistTitle: completionDialog.checklist.checklistTitle,
        employeeId: employeeId,
        employeeName: user.name,
        date: new Date().toISOString().split('T')[0],
        completed: completionForm.completed,
        reason: completionForm.completed ? null : completionForm.reason.trim()
      };

      await checklistService.saveCompletion(userType, completionRecord);

      // Refresh data
      await loadData();
      
      handleCloseCompletionDialog();
      setSuccess(
        completionForm.completed 
          ? 'Checklist marked as completed!'
          : 'Checklist status updated with reason.'
      );
      setTimeout(() => setSuccess(''), 3000);

    } catch (error) {
      console.error('Error saving completion:', error);
      setError('Failed to save completion. Please try again.');
    }
  };

  const getStatusChip = (checklist) => {
    if (checklist.completed) {
      return (
        <Chip
          icon={<CheckCircleIcon />}
          label="Completed"
          color="success"
          size="small"
        />
      );
    }
    
    return (
      <Chip
        icon={<ScheduleIcon />}
        label="Pending"
        color="warning"
        size="small"
      />
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getCompletionRate = () => {
    return stats.todayTotal > 0 ? (stats.todayCompleted / stats.todayTotal) * 100 : 0;
  };

  const breadcrumbs = [
    {
      label: 'My Checklists',
      icon: <TaskIcon sx={{ fontSize: 16 }} />
    }
  ];

  if (loading) {
    return (
      <Layout title="My Checklists" breadcrumbs={breadcrumbs}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading your checklists...
          </Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="My Checklists" breadcrumbs={breadcrumbs}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Header with Refresh */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1" fontWeight={600}>
          Welcome, {user?.name}!
        </Typography>
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Today's Tasks
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.todayTotal}
                  </Typography>
                </Box>
                <TaskIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Completed
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {stats.todayCompleted}
                  </Typography>
                </Box>
                <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Pending
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats.todayPending}
                  </Typography>
                </Box>
                <ScheduleIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Completion Rate
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {getCompletionRate().toFixed(0)}%
                  </Typography>
                </Box>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={getCompletionRate()}
                    size={40}
                    thickness={4}
                  />
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={getCompletionRate()} 
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Badge badgeContent={stats.todayPending} color="warning">
                Today's Checklists
              </Badge>
            } 
          />
          <Tab label="History" />
        </Tabs>

        <CardContent>
          {/* Today's Checklists Tab */}
          {currentTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Today's Checklist Assignments
              </Typography>
              
              {todayChecklists.length === 0 ? (
                <Paper 
                  sx={{ 
                    p: 4, 
                    textAlign: 'center', 
                    bgcolor: 'background.default' 
                  }}
                >
                  <TaskIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No checklists assigned for today
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    You don't have any checklist assignments for today. 
                    Check back tomorrow or contact your supervisor if you think this is an error.
                  </Typography>
                </Paper>
              ) : (
                <List>
                  {todayChecklists.map((checklist, index) => (
                    <React.Fragment key={checklist.id || index}>
                      <ListItem
                        sx={{
                          border: 1,
                          borderColor: checklist.completed ? 'success.main' : 'warning.main',
                          borderRadius: 2,
                          mb: 2,
                          bgcolor: checklist.completed ? 'success.50' : 'background.paper',
                          '&:hover': {
                            bgcolor: checklist.completed ? 'success.100' : 'warning.50'
                          }
                        }}
                      >
                        <ListItemIcon>
                          {checklist.completed ? (
                            <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
                          ) : (
                            <ScheduleIcon color="warning" sx={{ fontSize: 32 }} />
                          )}
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <Typography variant="h6" component="span">
                                {checklist.checklistTitle}
                              </Typography>
                              {getStatusChip(checklist)}
                              {checklist.isBackupAssignment && (
                                <Tooltip title={`Backup assignment for ${checklist.originalEmployeeName}`}>
                                  <Chip 
                                    label="Backup" 
                                    color="warning" 
                                    size="small" 
                                    variant="outlined"
                                    icon={<WarningIcon />}
                                  />
                                </Tooltip>
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary" gutterBottom>
                                Date: {formatDate(checklist.date)}
                              </Typography>
                              
                              {checklist.completed && checklist.completedAt && (
                                <Typography variant="body2" color="success.main">
                                  ✅ Completed at {formatTime(checklist.completedAt)}
                                </Typography>
                              )}
                              
                              {!checklist.completed && checklist.reason && (
                                <Typography variant="body2" color="error.main">
                                  ❌ Reason: {checklist.reason}
                                </Typography>
                              )}

                              {checklist.isBackupAssignment && (
                                <Typography variant="caption" color="warning.main">
                                  📋 This is a backup assignment
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        
                        <Box>
                          <Button
                            variant={checklist.completed ? "outlined" : "contained"}
                            size="large"
                            onClick={() => handleOpenCompletionDialog(checklist)}
                            color={checklist.completed ? "success" : "primary"}
                            sx={{ minWidth: 120 }}
                          >
                            {checklist.completed ? "Update Status" : "Mark Complete"}
                          </Button>
                        </Box>
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* History Tab */}
          {currentTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Checklist History (Last 30 Days)
              </Typography>
              
              {historyChecklists.length === 0 ? (
                <Paper 
                  sx={{ 
                    p: 4, 
                    textAlign: 'center', 
                    bgcolor: 'background.default' 
                  }}
                >
                  <HistoryIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary" gutterBottom>
                    No history available
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Your checklist completion history will appear here.
                  </Typography>
                </Paper>
              ) : (
                <List>
                  {historyChecklists.map((checklist, index) => (
                    <ListItem
                      key={`${checklist.checklistId}-${checklist.date}-${index}`}
                      sx={{
                        border: 1,
                        borderColor: checklist.completed ? 'success.main' : 'error.main',
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: checklist.completed ? 'success.50' : 'error.50'
                      }}
                    >
                      <ListItemIcon>
                        {checklist.completed ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <CancelIcon color="error" />
                        )}
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {checklist.checklistTitle}
                            </Typography>
                            <Chip
                              label={checklist.completed ? "Completed" : "Not Completed"}
                              color={checklist.completed ? "success" : "error"}
                              size="small"
                            />
                            {checklist.isBackupAssignment && (
                              <Chip 
                                label="Backup" 
                                color="warning" 
                                size="small" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="textSecondary">
                              Date: {formatDate(checklist.date)}
                            </Typography>
                            {checklist.completed && checklist.completedAt && (
                              <Typography variant="body2" color="success.main">
                                Completed at: {formatTime(checklist.completedAt)}
                              </Typography>
                            )}
                            {!checklist.completed && checklist.reason && (
                              <Typography variant="body2" color="error.main">
                                Reason: {checklist.reason}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Completion Dialog */}
      <Dialog
        open={completionDialog.open}
        onClose={handleCloseCompletionDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Checklist Status
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            {completionDialog.checklist?.checklistTitle}
          </Typography>
          
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Date: {formatDate(completionDialog.checklist?.date || new Date().toISOString())}
          </Typography>
          
          {completionDialog.checklist?.isBackupAssignment && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                This is a backup assignment for <strong>{completionDialog.checklist.originalEmployeeName}</strong>.
                You're completing this because they were unable to do it.
              </Typography>
            </Alert>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <RadioGroup
            value={completionForm.completed}
            onChange={(e) => {
              const completed = e.target.value === 'true';
              setCompletionForm(prev => ({ 
                ...prev, 
                completed,
                reason: completed ? '' : prev.reason
              }));
              setError('');
            }}
          >
            <FormControlLabel
              value={true}
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1" color="success.main">
                    ✅ Completed Successfully
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    The checklist task has been completed as required
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              value={false}
              control={<Radio />}
              label={
                <Box>
                  <Typography variant="body1" color="error.main">
                    ❌ Unable to Complete
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    The checklist task could not be completed (reason required)
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>

          {!completionForm.completed && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason for not completing *"
              value={completionForm.reason}
              onChange={(e) => {
                setCompletionForm(prev => ({ ...prev, reason: e.target.value }));
                setError('');
              }}
              placeholder="Please explain why this checklist could not be completed..."
              sx={{ mt: 2 }}
              helperText={`${completionForm.reason.length}/200 characters`}
            />
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompletionDialog}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitCompletion}
            variant="contained"
            disabled={!completionForm.completed && !completionForm.reason.trim()}
          >
            Save Status
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default EmployeeChecklistDashboard;
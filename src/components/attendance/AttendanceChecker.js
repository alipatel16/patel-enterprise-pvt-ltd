// src/components/attendance/AttendanceChecker.js (Updated with Smart Auto-Checkout)
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Avatar,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  LinearProgress,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckInIcon,
  ExitToApp as CheckOutIcon,
  Coffee as BreakIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  MyLocation as MyLocationIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  EventBusy as LeaveIcon,
  Edit as EditIcon,
  Schedule as AutoIcon,
  Info as InfoIcon
} from '@mui/icons-material';

import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import attendanceService from '../../services/attendance/attendanceService';
import smartAutoCheckoutService from '../../services/attendance/smartAutoCheckoutService';
import employeeService from '../../services/api/employeeService';
import { 
  captureAndCompressPhoto, 
  isCameraSupported, 
  base64ToImageUrl 
} from '../../utils/helpers/photoUtils';
import {
  getCurrentPosition,
  validateLocationProximity,
  formatCoordinates,
  generateMapsLink,
  getDistanceStatus,
  getAccuracyStatus,
  isGeolocationSupported,
  STORE_COORDINATES
} from '../../utils/helpers/locationUtils';

const LEAVE_TYPES = {
  SICK: 'sick',
  PERSONAL: 'personal',
  EMERGENCY: 'emergency',
  VACATION: 'vacation'
};

const LEAVE_TYPE_DISPLAY = {
  [LEAVE_TYPES.SICK]: 'Sick Leave',
  [LEAVE_TYPES.PERSONAL]: 'Personal Leave',
  [LEAVE_TYPES.EMERGENCY]: 'Emergency Leave',
  [LEAVE_TYPES.VACATION]: 'Vacation'
};

const AttendanceChecker = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { userType } = useUserType();
  
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  
  // Photo states
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState('');
  const [photoOptional, setPhotoOptional] = useState(true);
  const [includePhoto, setIncludePhoto] = useState(false);
  
  // Location states
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationValid, setLocationValid] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [distanceInfo, setDistanceInfo] = useState(null);
  
  // Leave states
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveType, setLeaveType] = useState(LEAVE_TYPES.SICK);
  const [leaveReason, setLeaveReason] = useState('');
  const [editLeaveDialogOpen, setEditLeaveDialogOpen] = useState(false);
  
  // Smart Auto-checkout states
  const [autoCheckoutInfo, setAutoCheckoutInfo] = useState(null);
  const [autoCheckoutDialogOpen, setAutoCheckoutDialogOpen] = useState(false);
  
  // General states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Load employee data and check for incomplete attendance when component mounts
  useEffect(() => {
    if (userType && user?.uid) {
      initializeAttendanceChecker();
    } else if (userType === null || user === null) {
      setLoading(false);
      setError('Unable to load user information. Please refresh the page.');
    }
  }, [userType, user?.uid]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeAttendanceChecker = async () => {
    if (!userType || !user?.uid) {
      console.warn('Cannot initialize: missing userType or user');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // First, get the employee data
      const employeeRecord = await getEmployeeData();
      if (!employeeRecord) {
        throw new Error('Employee record not found. Please contact your administrator.');
      }

      setEmployeeData(employeeRecord);
      const employeeFirebaseId = employeeRecord.id;

      // Check for incomplete attendance from previous day and fix it
      console.log('Checking for incomplete attendance from previous day...');
      const autoCheckoutResult = await smartAutoCheckoutService.checkAndFixIncompleteAttendance(
        userType, 
        employeeFirebaseId
      );

      if (autoCheckoutResult.hadIncompleteAttendance) {
        console.log('Fixed incomplete attendance:', autoCheckoutResult);
        setAutoCheckoutInfo(autoCheckoutResult);
        setAutoCheckoutDialogOpen(true);
      }

      // Load today's attendance and location
      await Promise.all([
        loadTodayAttendance(employeeFirebaseId),
        getCurrentLocationWithValidation()
      ]);

    } catch (error) {
      console.error('Failed to initialize attendance checker:', error);
      setError(error.message || 'Failed to load employee information');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeData = async () => {
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

    return employeeRecord;
  };

  const loadTodayAttendance = async (employeeFirebaseId) => {
    console.log('Loading today attendance for employee Firebase ID:', employeeFirebaseId);
    
    const attendance = await attendanceService.getTodayAttendance(userType, employeeFirebaseId);
    setTodayAttendance(attendance);
    console.log('Today attendance loaded:', attendance);
  };

  const getCurrentLocationWithValidation = async () => {
    try {
      setLocationLoading(true);
      setLocationError('');
      
      if (!isGeolocationSupported()) {
        throw new Error('Geolocation is not supported by this device');
      }

      const position = await getCurrentPosition();
      setCurrentLocation(position);
      
      // Validate proximity to store
      if (userType) {
        const validation = validateLocationProximity(position, userType);
        setLocationValid(validation.isValid);
        setDistanceInfo(validation);
        
        if (!validation.isValid) {
          setLocationError(validation.error);
        }
      }
    } catch (error) {
      console.error('Location error:', error);
      setLocationError(error.message);
      setLocationValid(false);
    } finally {
      setLocationLoading(false);
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatWorkTime = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const openCamera = async () => {
    if (!isCameraSupported()) {
      setError('Camera is not supported on this device');
      return;
    }

    try {
      setCameraOpen(true);
      setError('');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setError('Failed to access camera. Please ensure camera permissions are granted.');
      setCameraOpen(false);
    }
  };

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      const base64String = canvas.toDataURL('image/jpeg', 0.7);
      const base64Data = base64String.split(',')[1];
      
      setCapturedPhoto(base64Data);
      setPhotoTaken(true);
      
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } catch (error) {
      console.error('Photo capture error:', error);
      setError('Failed to capture photo');
    }
  };

  const retakePhoto = () => {
    setPhotoTaken(false);
    setCapturedPhoto('');
    openCamera();
  };

  const handleCheckIn = async () => {
    if (!userType || !employeeData) {
      setError('Unable to check in: employee information not available');
      return;
    }

    // Validate location first
    if (locationValid) {
      setError('You must be within 100 meters of the store to check in. Please refresh your location.');
      return;
    }

    // Check if photo is required
    if (includePhoto && !capturedPhoto) {
      setError('Please take a photo first');
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      // Use the correct employee Firebase key
      const checkInData = {
        employeeId: employeeData.id, // This is the Firebase key like "-OZtoBcZfbj41DZ6dQeV"
        employeeName: employeeData.name,
        date: getCurrentDate(),
        checkInTime: getCurrentTime(),
        checkInPhoto: includePhoto ? capturedPhoto : null,
        checkInLocation: currentLocation
      };

      console.log('Check-in data:', checkInData);

      await attendanceService.checkIn(userType, checkInData);
      
      setSuccess('Checked in successfully!');
      setCameraOpen(false);
      setPhotoTaken(false);
      setCapturedPhoto('');
      setIncludePhoto(false);
      
      // Reload attendance
      await loadTodayAttendance(employeeData.id);
    } catch (error) {
      console.error('Check-in error:', error);
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!todayAttendance || !userType || !employeeData) return;

    // Validate location for checkout
    if (locationValid) {
      setError('You must be within 100 meters of the store to check out. Please refresh your location.');
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      const checkOutData = {
        date: getCurrentDate(),
        checkOutTime: getCurrentTime(),
        checkOutLocation: currentLocation
      };

      console.log('Check-out data:', checkOutData);

      await attendanceService.checkOut(userType, todayAttendance.id, checkOutData);
      
      setSuccess('Checked out successfully!');
      await loadTodayAttendance(employeeData.id);
    } catch (error) {
      console.error('Check-out error:', error);
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartBreak = async () => {
    if (!todayAttendance || !userType) return;

    try {
      setActionLoading(true);
      setError('');

      const breakData = {
        startTime: getCurrentTime()
      };

      await attendanceService.startBreak(userType, todayAttendance.id, breakData);
      
      setSuccess('Break started!');
      await loadTodayAttendance(employeeData.id);
    } catch (error) {
      console.error('Start break error:', error);
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!todayAttendance || !userType) return;

    try {
      setActionLoading(true);
      setError('');

      const breakEndData = {
        endTime: getCurrentTime()
      };

      await attendanceService.endBreak(userType, todayAttendance.id, breakEndData);
      
      setSuccess('Break ended!');
      await loadTodayAttendance(employeeData.id);
    } catch (error) {
      console.error('End break error:', error);
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkLeave = async () => {
    if (!userType || !employeeData) {
      setError('Unable to mark leave: employee information not available');
      return;
    }

    try {
      setActionLoading(true);
      setError('');

      // Use the correct employee Firebase key
      const leaveData = {
        employeeId: employeeData.id, // Firebase key
        employeeName: employeeData.name,
        date: getCurrentDate(),
        leaveType,
        reason: leaveReason
      };

      console.log('Leave data:', leaveData);

      await attendanceService.markLeave(userType, leaveData);
      
      setSuccess('Leave marked successfully!');
      setLeaveDialogOpen(false);
      setLeaveType(LEAVE_TYPES.SICK);
      setLeaveReason('');
      
      // Reload attendance
      await loadTodayAttendance(employeeData.id);
    } catch (error) {
      console.error('Mark leave error:', error);
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditLeave = async () => {
    if (!todayAttendance || !userType) return;

    try {
      setActionLoading(true);
      setError('');

      const updateData = {
        leaveType,
        leaveReason: leaveReason
      };

      await attendanceService.updateLeave(userType, todayAttendance.id, updateData);
      
      setSuccess('Leave updated successfully!');
      setEditLeaveDialogOpen(false);
      
      // Reload attendance
      await loadTodayAttendance(employeeData.id);
    } catch (error) {
      console.error('Edit leave error:', error);
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditLeaveDialog = () => {
    if (todayAttendance && todayAttendance.status === 'on_leave') {
      setLeaveType(todayAttendance.leaveType || LEAVE_TYPES.SICK);
      setLeaveReason(todayAttendance.leaveReason || '');
      setEditLeaveDialogOpen(true);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
    setPhotoTaken(false);
    setCapturedPhoto('');
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
      case 'checked_out': return 'Checked Out';
      case 'on_leave': return 'On Leave';
      default: return 'Not Checked In';
    }
  };

  const isOnBreak = todayAttendance?.status === 'on_break';
  const isCheckedIn = todayAttendance?.status === 'checked_in' || isOnBreak;
  const isCheckedOut = todayAttendance?.status === 'checked_out';
  const isOnLeave = todayAttendance?.status === 'on_leave';
  const canMarkLeave = !todayAttendance; // Can only mark leave if no attendance record exists

  // Show loading while userType, user data, or employee data is loading
  if (!userType || !user || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading employee information...
        </Typography>
      </Box>
    );
  }

  // Show error if employee data couldn't be loaded
  if (!employeeData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error">
          Employee record not found. Please contact your administrator.
          <Button onClick={initializeAttendanceChecker} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Auto-Checkout Notification Dialog */}
      <Dialog
        open={autoCheckoutDialogOpen}
        onClose={() => setAutoCheckoutDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <AutoIcon color="warning" />
            <Typography variant="h6">Previous Day Auto-Checkout</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {autoCheckoutInfo && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                We found that you were still checked in from <strong>{autoCheckoutInfo.previousDate}</strong>. 
                We've automatically checked you out at <strong>{autoCheckoutInfo.autoCheckoutTime}</strong> 
                so you can start fresh today.
              </Alert>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Previous Status:</strong> {autoCheckoutInfo.originalStatus === 'checked_in' ? 'Working' : 'On Break'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Auto-Checkout Time:</strong> {autoCheckoutInfo.autoCheckoutTime}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Total Work Time:</strong> {autoCheckoutInfo.workTime}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAutoCheckoutDialogOpen(false)} variant="contained">
            Got It
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error and Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Employee Info Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {employeeData.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6">{employeeData.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {employeeData.employeeId} • {employeeData.role}
              </Typography>
              {employeeData.department && (
                <Typography variant="caption" color="text.secondary">
                  {employeeData.department}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Location Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Location Status</Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Tooltip title="Refresh location">
                <IconButton onClick={getCurrentLocationWithValidation} disabled={locationLoading}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              {locationLoading && <CircularProgress size={20} />}
            </Box>
          </Box>

          {locationLoading ? (
            <LinearProgress sx={{ mb: 2 }} />
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <LocationIcon 
                    sx={{ 
                      fontSize: 40, 
                      color: locationValid ? theme.palette.success.main : theme.palette.error.main,
                      mb: 1 
                    }} 
                  />
                  <Typography variant="body2" fontWeight="bold">
                    {locationValid ? 'Within Range' : 'Out of Range'}
                  </Typography>
                  {distanceInfo && (
                    <Typography variant="body2" color="text.secondary">
                      {distanceInfo.distance}m from store
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <MyLocationIcon sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
                  <Typography variant="body2" fontWeight="bold">
                    Your Location
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentLocation 
                      ? formatCoordinates(currentLocation.latitude, currentLocation.longitude)
                      : 'Not available'
                    }
                  </Typography>
                  {currentLocation && (
                    <Button
                      size="small"
                      onClick={() => window.open(generateMapsLink(currentLocation.latitude, currentLocation.longitude))}
                      sx={{ mt: 1 }}
                    >
                      View on Map
                    </Button>
                  )}
                </Paper>
              </Grid>

              {locationError && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    {locationError}
                  </Alert>
                </Grid>
              )}

              {currentLocation && userType && STORE_COORDINATES[userType] && (
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Accuracy: {getAccuracyStatus(currentLocation.accuracy).text} ({currentLocation.accuracy}m)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Store: {STORE_COORDINATES[userType]?.name}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Current Status Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6">Today's Status</Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Chip
                  label={getStatusText(todayAttendance?.status)}
                  color={getStatusColor(todayAttendance?.status)}
                  sx={{ mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Current Status
                </Typography>
                {isOnLeave && (
                  <Box mt={1}>
                    <Typography variant="caption" color="text.secondary">
                      {LEAVE_TYPE_DISPLAY[todayAttendance.leaveType]} 
                      {todayAttendance.leaveReason && ` - ${todayAttendance.leaveReason}`}
                    </Typography>
                    <Box mt={1}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={openEditLeaveDialog}
                      >
                        Edit Leave
                      </Button>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h6">
                  {formatWorkTime(todayAttendance?.totalWorkTime || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Work Time Today
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {todayAttendance && !isOnLeave && (
            <Box mt={2}>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckInIcon color="success" fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Check In
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(todayAttendance.checkInTime)}
                      </Typography>
                      {todayAttendance.checkInLocation && (
                        <Typography variant="caption" color="text.secondary">
                          📍 {formatCoordinates(
                            todayAttendance.checkInLocation.latitude,
                            todayAttendance.checkInLocation.longitude
                          )}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CheckOutIcon color={isCheckedOut ? 'error' : 'disabled'} fontSize="small" />
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        Check Out
                        {todayAttendance.autoCheckout && (
                          <Tooltip title="This was an automatic checkout">
                            <AutoIcon 
                              fontSize="small" 
                              color="warning" 
                              sx={{ ml: 0.5 }} 
                            />
                          </Tooltip>
                        )}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {todayAttendance.checkOutTime ? formatTime(todayAttendance.checkOutTime) : 'Not yet'}
                      </Typography>
                      {todayAttendance.checkOutLocation && (
                        <Typography variant="caption" color="text.secondary">
                          📍 {formatCoordinates(
                            todayAttendance.checkOutLocation.latitude,
                            todayAttendance.checkOutLocation.longitude
                          )}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {todayAttendance.breaks && todayAttendance.breaks.length > 0 && (
                <Box mt={2}>
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    Breaks ({formatWorkTime(todayAttendance.totalBreakTime || 0)})
                  </Typography>
                  {todayAttendance.breaks.map((breakItem, index) => (
                    <Typography key={index} variant="body2" color="text.secondary">
                      Break {index + 1}: {formatTime(breakItem.startTime)} - {
                        breakItem.endTime ? formatTime(breakItem.endTime) : 'Ongoing'
                      }
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Actions
          </Typography>

          {/* Leave Actions for on-leave status */}
          {isOnLeave && (
            <Box mb={2}>
              <Alert severity="info">
                You are currently on leave. You can edit your leave details if needed.
              </Alert>
            </Box>
          )}

          {/* Photo Option for Check-in */}
          {!todayAttendance && (
            <Box mb={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={includePhoto}
                    onChange={(e) => setIncludePhoto(e.target.checked)}
                  />
                }
                label="Include Photo with Check-in (Optional)"
              />
            </Box>
          )}

          <Grid container spacing={2}>
            {/* Check-in or Mark Leave options when no attendance */}
            {!todayAttendance && (
              <>
                <Grid item xs={12} sm={6}>
                  {includePhoto ? (
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<CameraIcon />}
                      onClick={openCamera}
                      disabled={actionLoading || !locationValid}
                      sx={{ py: 2 }}
                    >
                      Take Photo & Check In
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<CheckInIcon />}
                      onClick={handleCheckIn}
                      disabled={actionLoading || locationValid}
                      sx={{ py: 2 }}
                    >
                      Check In
                    </Button>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    color="error"
                    startIcon={<LeaveIcon />}
                    onClick={() => setLeaveDialogOpen(true)}
                    disabled={actionLoading}
                    sx={{ py: 2 }}
                  >
                    Mark Leave
                  </Button>
                </Grid>
              </>
            )}

            {/* Normal work day actions */}
            {isCheckedIn && !isCheckedOut && !isOnLeave && (
              <>
                <Grid item xs={12} sm={6}>
                  {!isOnBreak ? (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<BreakIcon />}
                      onClick={handleStartBreak}
                      disabled={actionLoading}
                    >
                      Start Break
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      color="warning"
                      startIcon={<WorkIcon />}
                      onClick={handleEndBreak}
                      disabled={actionLoading}
                    >
                      End Break
                    </Button>
                  )}
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    startIcon={<CheckOutIcon />}
                    onClick={handleCheckOut}
                    disabled={actionLoading || isOnBreak || locationValid}
                  >
                    Check Out
                  </Button>
                </Grid>
              </>
            )}

            {/* Checked out status */}
            {isCheckedOut && (
              <Grid item xs={12}>
                <Alert severity="success">
                  You have successfully checked out for today. Have a great day!
                  {todayAttendance?.autoCheckout && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Note: This checkout was processed automatically.
                      </Typography>
                    </Box>
                  )}
                </Alert>
              </Grid>
            )}

            {/* Location warning */}
            {!locationValid && !isOnLeave && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  You must be within 100 meters of the store to perform attendance actions.
                  <Button
                    size="small"
                    onClick={getCurrentLocationWithValidation}
                    sx={{ ml: 1 }}
                    disabled={locationLoading}
                  >
                    Refresh Location
                  </Button>
                </Alert>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Camera Dialog */}
      <Dialog
        open={cameraOpen}
        onClose={closeCamera}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Take Check-in Photo</Typography>
            <IconButton onClick={closeCamera}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {!photoTaken ? (
            <Box textAlign="center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: '100%',
                  maxWidth: '400px',
                  borderRadius: theme.shape.borderRadius
                }}
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </Box>
          ) : (
            <Box textAlign="center">
              <Typography variant="body2" gutterBottom>
                Photo captured! Please review:
              </Typography>
              <img
                src={base64ToImageUrl(capturedPhoto)}
                alt="Captured"
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
          <Button onClick={closeCamera}>Cancel</Button>
          {!photoTaken ? (
            <Button
              variant="contained"
              onClick={takePhoto}
              startIcon={<PhotoCameraIcon />}
            >
              Capture
            </Button>
          ) : (
            <>
              <Button onClick={retakePhoto}>Retake</Button>
              <Button
                variant="contained"
                onClick={handleCheckIn}
                disabled={actionLoading}
                startIcon={actionLoading ? <CircularProgress size={20} /> : <CheckInIcon />}
              >
                Check In
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Mark Leave Dialog */}
      <Dialog 
        open={leaveDialogOpen} 
        onClose={() => setLeaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
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
                {Object.entries(LEAVE_TYPE_DISPLAY).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
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
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Mark Leave'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Leave Dialog */}
      <Dialog 
        open={editLeaveDialogOpen} 
        onClose={() => setEditLeaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Leave Details</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Leave Type</InputLabel>
              <Select
                value={leaveType}
                label="Leave Type"
                onChange={(e) => setLeaveType(e.target.value)}
              >
                {Object.entries(LEAVE_TYPE_DISPLAY).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="Please provide a reason for your leave..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditLeaveDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleEditLeave} 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'Update Leave'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceChecker;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  LinearProgress,
  Alert,
  Paper,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Badge
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  MoreVert as MoreVertIcon,
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Flag as FlagIcon
} from '@mui/icons-material';

import { useSales } from '../../../contexts/SalesContext/SalesContext';
import { formatCurrency, formatDate } from '../../../utils/helpers/formatHelpers';
import InstallmentPaymentDialog from './InstallmentPaymentDialog';
import DueDateChangeDialog from './DueDateChangeDialog'; // New import

/**
 * EMI Management Component for viewing and managing installment payments
 * Now includes due date change tracking and highlights
 */
const EMIManagement = ({ invoice }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const { 
    recordInstallmentPayment,
    getInstallmentPaymentHistory,
    getPendingInstallments,
    getEMISummary,
    updateInstallmentDueDate, // Add this method
    loading 
  } = useSales();

  const [emiSummary, setEmiSummary] = useState(null);
  const [pendingInstallments, setPendingInstallments] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [dueDateDialogOpen, setDueDateDialogOpen] = useState(false); // New state
  const [selectedInstallment, setSelectedInstallment] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  // Load EMI data
  useEffect(() => {
    if (invoice && invoice.id) {
      loadEMIData();
    }
  }, [invoice]);

  const loadEMIData = async () => {
    try {
      setLoadingData(true);
      setError('');

      const [summary, pending, history] = await Promise.all([
        getEMISummary(invoice.id),
        getPendingInstallments(invoice.id),
        getInstallmentPaymentHistory(invoice.id)
      ]);

      setEmiSummary(summary);
      setPendingInstallments(pending);
      setPaymentHistory(history);
    } catch (err) {
      setError(err.message || 'Failed to load EMI data');
    } finally {
      setLoadingData(false);
    }
  };

  const handlePaymentRecord = async (installmentNumber, paymentAmount, paymentDetails) => {
    try {
      await recordInstallmentPayment(invoice.id, installmentNumber, paymentAmount, paymentDetails);
      
      // Reload data to reflect changes
      await loadEMIData();
      
      setPaymentDialogOpen(false);
      setSelectedInstallment(null);
    } catch (err) {
      throw err; // Let dialog handle error display
    }
  };

  // New: Handle due date change
  const handleDueDateChange = async (installmentNumber, newDueDate, changeDetails) => {
    try {
      await updateInstallmentDueDate(invoice.id, installmentNumber, newDueDate, changeDetails);
      
      // Reload data to reflect changes
      await loadEMIData();
      
      setDueDateDialogOpen(false);
      setSelectedInstallment(null);
    } catch (err) {
      throw err; // Let dialog handle error display
    }
  };

  const handlePaymentClick = (installment) => {
    setSelectedInstallment(installment);
    setPaymentDialogOpen(true);
    setMenuAnchor(null);
  };

  // New: Handle due date change click
  const handleDueDateChangeClick = (installment) => {
    setSelectedInstallment(installment);
    setDueDateDialogOpen(true);
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event, installment) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setSelectedInstallment(installment);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedInstallment(null);
  };

  const getInstallmentStatusConfig = (installment) => {
    if (installment.isOverdue) {
      return {
        color: 'error',
        label: `${Math.abs(installment.daysDiff)} days overdue`,
        icon: <ErrorIcon fontSize="small" />
      };
    } else if (installment.isDueToday) {
      return {
        color: 'warning',
        label: 'Due today',
        icon: <WarningIcon fontSize="small" />
      };
    } else if (installment.isDueSoon) {
      return {
        color: 'info',
        label: `Due in ${installment.daysDiff} days`,
        icon: <ScheduleIcon fontSize="small" />
      };
    } else {
      return {
        color: 'success',
        label: `Due in ${installment.daysDiff} days`,
        icon: <ScheduleIcon fontSize="small" />
      };
    }
  };

  // New: Get due date change indicator
  const getDueDateChangeIndicator = (installment) => {
    const changeCount = installment.dueDateChangeCount || 0;
    
    if (changeCount === 0) return null;
    
    return (
      <Tooltip title={`Due date changed ${changeCount} time${changeCount > 1 ? 's' : ''}`}>
        <Badge
          badgeContent={changeCount}
          color={changeCount >= 3 ? 'error' : changeCount >= 2 ? 'warning' : 'info'}
          sx={{ ml: 1 }}
        >
          <HistoryIcon 
            fontSize="small" 
            color={changeCount >= 3 ? 'error' : changeCount >= 2 ? 'warning' : 'action'}
          />
        </Badge>
      </Tooltip>
    );
  };

  // Mobile-friendly pending installments list with due date change indicators
  const renderPendingInstallmentsMobile = () => (
    <List>
      {pendingInstallments.map((installment) => {
        const statusConfig = getInstallmentStatusConfig(installment);
        const changeCount = installment.dueDateChangeCount || 0;
        const hasFrequentChanges = installment.hasFrequentDueDateChanges;
        
        return (
          <ListItem 
            key={installment.installmentNumber}
            sx={{
              backgroundColor: installment.isOverdue 
                ? theme.palette.error.light + '10' 
                : installment.isDueToday 
                ? theme.palette.warning.light + '10'
                : hasFrequentChanges
                ? theme.palette.warning.light + '05' // Subtle highlight for frequent changes
                : 'transparent',
              borderRadius: 1,
              mb: 1,
              border: '1px solid',
              borderColor: hasFrequentChanges 
                ? theme.palette.warning.main
                : theme.palette.divider,
              borderLeftWidth: hasFrequentChanges ? '4px' : '1px'
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Installment #{installment.installmentNumber}
                  </Typography>
                  
                  <Chip
                    label={statusConfig.label}
                    color={statusConfig.color}
                    size="small"
                    icon={statusConfig.icon}
                  />
                  
                  {/* Due date change indicator */}
                  {getDueDateChangeIndicator(installment)}
                  
                  {/* Frequent changes flag */}
                  {hasFrequentChanges && (
                    <Chip
                      label={`${changeCount} Changes`}
                      size="small"
                      color="warning"
                      icon={<FlagIcon />}
                      sx={{ fontSize: '0.625rem' }}
                    />
                  )}
                </Box>
              }
              secondary={
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Amount:</strong> {formatCurrency(installment.amount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Due Date:</strong> {formatDate(installment.dueDate)}
                    {installment.dueDateUpdated && (
                      <Chip 
                        label="Modified" 
                        size="small" 
                        color="info" 
                        sx={{ ml: 1, fontSize: '0.625rem' }} 
                      />
                    )}
                  </Typography>
                  
                  {/* Show last change info for frequent changers */}
                  {hasFrequentChanges && installment.lastDueDateChange && (
                    <Typography variant="caption" color="warning.main">
                      Last changed: {formatDate(installment.lastDueDateChange.changedAt)} 
                      ({installment.lastDueDateChange.reason})
                    </Typography>
                  )}
                </Stack>
              }
            />
            <ListItemSecondaryAction>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PaymentIcon />}
                  onClick={() => handlePaymentClick(installment)}
                >
                  Pay
                </Button>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, installment)}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Stack>
            </ListItemSecondaryAction>
          </ListItem>
        );
      })}
    </List>
  );

  // Enhanced desktop table with due date change indicators
  const renderPendingInstallmentsDesktop = () => (
    <TableContainer component={Paper} variant="outlined">
      <Table size={isTablet ? "small" : "medium"}>
        <TableHead>
          <TableRow>
            <TableCell>Installment #</TableCell>
            <TableCell>Due Date</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center">Changes</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pendingInstallments.map((installment) => {
            const statusConfig = getInstallmentStatusConfig(installment);
            const changeCount = installment.dueDateChangeCount || 0;
            const hasFrequentChanges = installment.hasFrequentDueDateChanges;
            
            return (
              <TableRow 
                key={installment.installmentNumber}
                sx={{
                  backgroundColor: installment.isOverdue 
                    ? theme.palette.error.light + '10' 
                    : installment.isDueToday 
                    ? theme.palette.warning.light + '10'
                    : hasFrequentChanges
                    ? theme.palette.warning.light + '05'
                    : 'transparent',
                  borderLeft: hasFrequentChanges 
                    ? `3px solid ${theme.palette.warning.main}`
                    : 'none'
                }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      #{installment.installmentNumber}
                    </Typography>
                    {hasFrequentChanges && (
                      <FlagIcon fontSize="small" color="warning" />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {formatDate(installment.dueDate)}
                    </Typography>
                    {installment.dueDateUpdated && (
                      <Chip 
                        label="Modified" 
                        size="small" 
                        color="info" 
                        sx={{ fontSize: '0.625rem', mt: 0.5 }} 
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight={500}>
                    {formatCurrency(installment.amount)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusConfig.label}
                    color={statusConfig.color}
                    size="small"
                    icon={statusConfig.icon}
                  />
                </TableCell>
                <TableCell align="center">
                  {changeCount > 0 ? (
                    <Tooltip title={`Due date changed ${changeCount} times`}>
                      <Chip
                        label={changeCount}
                        size="small"
                        color={changeCount >= 3 ? 'error' : changeCount >= 2 ? 'warning' : 'info'}
                        icon={<HistoryIcon />}
                      />
                    </Tooltip>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<PaymentIcon />}
                    onClick={() => handlePaymentClick(installment)}
                    sx={{ mr: 1 }}
                  >
                    Pay
                  </Button>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, installment)}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Enhanced payment history with original/paid amount tracking
  const renderPaymentHistoryMobile = () => (
    <List>
      {paymentHistory.map((payment, index) => (
        <ListItem 
          key={index}
          sx={{
            borderRadius: 1,
            mb: 1,
            border: '1px solid',
            borderColor: theme.palette.divider
          }}
        >
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Installment #{payment.installmentNumber}
                </Typography>
                <Chip
                  label={payment.fullyPaid ? 'Fully Paid' : 'Partial Payment'}
                  color={payment.fullyPaid ? 'success' : 'warning'}
                  size="small"
                  icon={<CheckCircleIcon />}
                />
              </Box>
            }
            secondary={
              <Stack spacing={0.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Amount Paid:
                  </Typography>
                  <Typography variant="body2" fontWeight={500} color="success.main">
                    {formatCurrency(payment.paidAmount)}
                  </Typography>
                </Box>
                
                {payment.originalAmount && payment.paidAmount !== payment.originalAmount && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Original Amount:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(payment.originalAmount)}
                    </Typography>
                  </Box>
                )}
                
                {payment.paidAmount > payment.originalAmount && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="success.main">
                      Overpayment:
                    </Typography>
                    <Typography variant="body2" fontWeight={500} color="success.main">
                      +{formatCurrency(payment.paidAmount - payment.originalAmount)}
                    </Typography>
                  </Box>
                )}
                
                {payment.shortfallAmount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="warning.main">
                      Shortfall:
                    </Typography>
                    <Typography variant="body2" fontWeight={500} color="warning.main">
                      -{formatCurrency(payment.shortfallAmount)}
                    </Typography>
                  </Box>
                )}
                
                <Typography variant="body2" color="text.secondary">
                  <strong>Date:</strong> {formatDate(payment.paymentDate)}
                </Typography>
                
                <Typography variant="body2" color="text.secondary">
                  <strong>Method:</strong> {payment.paymentRecord?.paymentMethod?.replace('_', ' ') || 'Cash'}
                </Typography>
                
                {payment.paymentRecord?.transactionId && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Transaction ID:</strong> {payment.paymentRecord.transactionId}
                  </Typography>
                )}
              </Stack>
            }
          />
        </ListItem>
      ))}
    </List>
  );

  if (!invoice || invoice.paymentStatus !== 'emi') {
    return (
      <Alert severity="info">
        This invoice is not on an EMI payment plan.
      </Alert>
    );
  }

  if (loadingData) {
    return (
      <Box>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary" align="center">
          Loading EMI details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" action={
        <Button color="inherit" size="small" onClick={loadEMIData}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Customer Due Date Change Warning */}
      {invoice.customerDueDateChangeFlags?.hasFrequentChanges && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          icon={<FlagIcon />}
        >
          <Typography variant="subtitle2" gutterBottom>
            Frequent Due Date Changes Detected
          </Typography>
          <Typography variant="body2">
            This customer has requested {invoice.customerDueDateChangeFlags.totalChanges} due date changes. 
            {invoice.customerDueDateChangeFlags.flaggedForReview && ' Account flagged for management review.'}
          </Typography>
        </Alert>
      )}

      {/* EMI Summary Card */}
      {emiSummary && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              EMI Payment Summary
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant={isMobile ? "h5" : "h4"} color="primary" fontWeight="bold">
                    {emiSummary.paidInstallments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Paid Installments
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    of {emiSummary.totalInstallments}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant={isMobile ? "h5" : "h4"} color="success.main" fontWeight="bold">
                    {formatCurrency(emiSummary.paidAmount).replace('₹', '')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Amount Paid
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {emiSummary.paymentPercentage}% completed
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography 
                    variant={isMobile ? "h5" : "h4"}
                    color={emiSummary.overdueInstallments > 0 ? "error.main" : "warning.main"} 
                    fontWeight="bold"
                  >
                    {emiSummary.pendingInstallments}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {emiSummary.overdueInstallments} overdue
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Box textAlign="center">
                  <Typography variant={isMobile ? "h5" : "h4"} color="error.main" fontWeight="bold">
                    {formatCurrency(emiSummary.remainingAmount).replace('₹', '')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Balance Due
                  </Typography>
                  {emiSummary.nextDueInstallment && (
                    <Typography variant="caption" color="text.secondary">
                      Next: {formatDate(emiSummary.nextDueInstallment.dueDate)}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>

            <Box mt={3}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="text.secondary">
                  Payment Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {emiSummary.paymentPercentage}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={emiSummary.paymentPercentage} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Pending Installments */}
      {pendingInstallments.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
              <Typography variant="h6" fontWeight={600}>
                Pending Installments ({pendingInstallments.length})
              </Typography>
              {pendingInstallments.some(inst => inst.isOverdue) && (
                <Chip
                  label={`${pendingInstallments.filter(inst => inst.isOverdue).length} Overdue`}
                  color="error"
                  size="small"
                  icon={<ErrorIcon />}
                />
              )}
            </Box>

            {isMobile ? renderPendingInstallmentsMobile() : renderPendingInstallmentsDesktop()}
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Payment History ({paymentHistory.length})
            </Typography>

            {isMobile ? renderPaymentHistoryMobile() : (
              <TableContainer component={Paper} variant="outlined">
                <Table size={isTablet ? "small" : "medium"}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Installment #</TableCell>
                      <TableCell align="right">Amount Paid</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paymentHistory.map((payment, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(payment.paymentDate)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            #{payment.installmentNumber}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Stack alignItems="flex-end" spacing={0.5}>
                            <Typography variant="body2" fontWeight={500} color="success.main">
                              {formatCurrency(payment.paidAmount)}
                            </Typography>
                            
                            {payment.originalAmount && payment.paidAmount !== payment.originalAmount && (
                              <Typography variant="caption" color="text.secondary">
                                Original: {formatCurrency(payment.originalAmount)}
                              </Typography>
                            )}
                            
                            {payment.paidAmount > payment.originalAmount && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TrendingUpIcon fontSize="small" color="success" />
                                <Typography variant="caption" color="success.main" fontWeight={500}>
                                  +{formatCurrency(payment.paidAmount - payment.originalAmount)}
                                </Typography>
                              </Box>
                            )}
                            
                            {payment.shortfallAmount > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <TrendingDownIcon fontSize="small" color="warning" />
                                <Typography variant="caption" color="warning.main" fontWeight={500}>
                                  -{formatCurrency(payment.shortfallAmount)}
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {payment.paymentRecord?.paymentMethod?.replace('_', ' ') || 'Cash'}
                          </Typography>
                          {payment.paymentRecord?.transactionId && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {payment.paymentRecord.transactionId}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payment.fullyPaid ? 'Fully Paid' : 'Partial Payment'}
                            color={payment.fullyPaid ? 'success' : 'warning'}
                            size="small"
                            icon={<CheckCircleIcon />}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {pendingInstallments.length === 0 && (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          All installments have been paid! This EMI plan is complete.
        </Alert>
      )}

      {/* Payment Dialog */}
      <InstallmentPaymentDialog
        open={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setSelectedInstallment(null);
        }}
        installment={selectedInstallment}
        invoice={invoice}
        onPaymentRecorded={handlePaymentRecord}
      />

      {/* Due Date Change Dialog */}
      <DueDateChangeDialog
        open={dueDateDialogOpen}
        onClose={() => {
          setDueDateDialogOpen(false);
          setSelectedInstallment(null);
        }}
        installment={selectedInstallment}
        invoice={invoice}
        onDueDateChanged={handleDueDateChange}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        {selectedInstallment && (
          <>
            <MenuItem onClick={() => handlePaymentClick(selectedInstallment)}>
              <ListItemIcon>
                <PaymentIcon fontSize="small" />
              </ListItemIcon>
              Record Payment
            </MenuItem>
            <MenuItem onClick={() => handleDueDateChangeClick(selectedInstallment)}>
              <ListItemIcon>
                <CalendarIcon fontSize="small" />
              </ListItemIcon>
              Change Due Date
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default EMIManagement;
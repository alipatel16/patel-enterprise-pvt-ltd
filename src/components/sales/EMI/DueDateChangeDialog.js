import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { formatDate } from '../../../utils/helpers/formatHelpers';

/**
 * Due Date Change Dialog Component
 * Allows changing installment due dates with tracking and warnings
 */
const DueDateChangeDialog = ({
  open,
  onClose,
  installment,
  invoice,
  onDueDateChanged
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [newDueDate, setNewDueDate] = useState(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Predefined reasons for due date changes
  const changeReasons = [
    'Customer Request',
    'Payment Delay',
    'Financial Hardship',
    'Business Closure',
    'Festival/Holiday',
    'Medical Emergency',
    'Administrative Error',
    'Other'
  ];

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open && installment) {
      setNewDueDate(new Date(installment.dueDate));
      setReason('');
      setNotes('');
      setError('');
    }
  }, [open, installment]);

  const handleSave = useCallback(async () => {
    if (!newDueDate) {
      setError('Please select a new due date');
      return;
    }

    if (!reason) {
      setError('Please select a reason for the change');
      return;
    }

    // Validate new date is different from current
    const currentDate = new Date(installment.dueDate);
    if (newDueDate.getTime() === currentDate.getTime()) {
      setError('New due date must be different from current due date');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const changeDetails = {
        reason,
        notes: notes.trim(),
        changedBy: 'current_user', // You can get this from context
        changedByName: 'Current User' // You can get this from context
      };

      await onDueDateChanged(
        installment.installmentNumber,
        newDueDate.toISOString(),
        changeDetails
      );

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update due date');
    } finally {
      setLoading(false);
    }
  }, [newDueDate, reason, notes, installment, onDueDateChanged, onClose]);

  if (!installment) return null;

  const changeCount = installment.dueDateChangeCount || 0;
  const hasFrequentChanges = changeCount >= 2; // Show warning at 2+ for upcoming 3rd change
  const changeHistory = installment.dueDateChangeHistory || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon color="primary" />
            <Typography variant="h6">
              Change Due Date
            </Typography>
          </Box>
          
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Warning for frequent changes */}
        {hasFrequentChanges && (
          <Alert 
            severity="warning" 
            sx={{ mb: 2 }}
            icon={<WarningIcon />}
          >
            <Typography variant="subtitle2" gutterBottom>
              Frequent Due Date Changes Detected
            </Typography>
            <Typography variant="body2">
              This installment's due date has been changed {changeCount} time{changeCount > 1 ? 's' : ''} already. 
              {changeCount >= 2 && ' Multiple changes may indicate payment difficulties.'}
            </Typography>
          </Alert>
        )}

        {/* Current installment info */}
        <Box sx={{ mb: 3, p: 2, backgroundColor: theme.palette.grey[50], borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Installment #{installment.installmentNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Customer: {invoice.customerName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Invoice: {invoice.invoiceNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Current Due Date: {formatDate(installment.dueDate)}
          </Typography>
          
          {changeCount > 0 && (
            <Box sx={{ mt: 1 }}>
              <Chip
                label={`Changed ${changeCount} time${changeCount > 1 ? 's' : ''}`}
                size="small"
                color={changeCount >= 3 ? 'error' : changeCount >= 2 ? 'warning' : 'info'}
                icon={<HistoryIcon />}
              />
            </Box>
          )}
        </Box>

        {/* New due date selection */}
        <Box sx={{ mb: 3 }}>
          <DatePicker
            label="New Due Date"
            value={newDueDate}
            onChange={setNewDueDate}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                helperText: 'Select the new due date for this installment'
              }
            }}
            disablePast
            format='dd/MM/yyyy'
          />
        </Box>

        {/* Reason selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel required>Reason for Change</InputLabel>
          <Select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            label="Reason for Change"
            required
          >
            {changeReasons.map((reasonOption) => (
              <MenuItem key={reasonOption} value={reasonOption}>
                {reasonOption}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Additional notes */}
        <TextField
          label="Additional Notes"
          multiline
          rows={3}
          fullWidth
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional: Add any additional context or notes about this change..."
          sx={{ mb: 3 }}
        />

        {/* Change history */}
        {changeHistory.length > 0 && (
          <Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Change History ({changeHistory.length})
            </Typography>
            
            <Stack spacing={1} sx={{ maxHeight: 200, overflowY: 'auto' }}>
              {changeHistory.slice(-3).reverse().map((change, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    borderRadius: 1,
                    backgroundColor: theme.palette.background.paper
                  }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    {formatDate(change.previousDueDate)} → {formatDate(change.newDueDate)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {change.reason} • {formatDate(change.changedAt)}
                  </Typography>
                  {change.notes && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      "{change.notes}"
                    </Typography>
                  )}
                </Box>
              ))}
              
              {changeHistory.length > 3 && (
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  ... and {changeHistory.length - 3} more changes
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
        >
          Cancel
        </Button>
        
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !newDueDate || !reason}
        >
          {loading ? 'Updating...' : 'Update Due Date'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DueDateChangeDialog;
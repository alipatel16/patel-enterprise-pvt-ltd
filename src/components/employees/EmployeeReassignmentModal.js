// src/components/employees/EmployeeReassignmentModal.js
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  ChecklistRtl as ChecklistIcon,
  People as PeopleIcon,
  PersonAdd as BackupIcon,
} from '@mui/icons-material';

/**
 * Reusable Employee Reassignment Modal
 * Shows all checklists where an employee is assigned (primary or backup)
 * Allows admin to reassign those checklists to other employees before deletion
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether modal is open
 * @param {function} props.onClose - Close handler
 * @param {function} props.onConfirm - Confirm handler with reassignment data
 * @param {Object} props.employee - Employee being deleted
 * @param {Array} props.checklists - All checklists where employee is assigned
 * @param {Array} props.availableEmployees - List of employees who can be assigned as replacements
 * @param {boolean} props.loading - Loading state
 */
const EmployeeReassignmentModal = ({
  open,
  onClose,
  onConfirm,
  employee,
  checklists,
  availableEmployees,
  loading = false,
}) => {
  // Separate checklists by assignment type
  const [primaryChecklists, setPrimaryChecklists] = useState([]);
  const [backupChecklists, setBackupChecklists] = useState([]);
  
  // Store replacement selections
  const [replacements, setReplacements] = useState({
    primary: {}, // checklistId -> replacementEmployeeId
    backup: {}, // checklistId -> replacementEmployeeId
  });

  const [validationError, setValidationError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Initialize checklists and replacements when modal opens
  useEffect(() => {
    if (open && employee && checklists) {
      // Separate checklists
      const primary = checklists.filter(checklist => 
        checklist.assignedEmployees?.includes(employee.id)
      );
      const backup = checklists.filter(checklist => 
        checklist.backupEmployees?.includes(employee.id)
      );

      setPrimaryChecklists(primary);
      setBackupChecklists(backup);

      // Initialize replacements state
      const initialReplacements = {
        primary: {},
        backup: {},
      };

      primary.forEach(checklist => {
        initialReplacements.primary[checklist.id] = '';
      });

      backup.forEach(checklist => {
        initialReplacements.backup[checklist.id] = '';
      });

      setReplacements(initialReplacements);
      setValidationError('');
    }
  }, [open, employee, checklists]);

  // Handle replacement selection
  const handleReplacementChange = (checklistId, type, employeeId) => {
    setReplacements(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [checklistId]: employeeId,
      },
    }));
    setValidationError('');
  };

  // Get available employees for a specific checklist
  // Excludes employees already assigned to that checklist
  const getAvailableEmployeesForChecklist = (checklist, type) => {
    const currentlyAssigned = type === 'primary' 
      ? checklist.assignedEmployees || []
      : checklist.backupEmployees || [];

    return availableEmployees.filter(emp => {
      // Exclude the employee being deleted
      if (emp.id === employee?.id) return false;
      
      // Include if not currently assigned to this checklist in the same role
      return !currentlyAssigned.includes(emp.id);
    });
  };

  // Check if checklist has other employees assigned
  const hasOtherEmployees = (checklist, type) => {
    const assignedEmployees = type === 'primary' 
      ? checklist.assignedEmployees || []
      : checklist.backupEmployees || [];
    
    // Has other employees if array length > 1 (excluding current employee)
    return assignedEmployees.length > 1;
  };

  // Validate all replacements are selected
  const validate = () => {
    // Check primary checklists
    for (const checklist of primaryChecklists) {
      // Only require replacement if this is the only primary employee
      if (!hasOtherEmployees(checklist, 'primary')) {
        if (!replacements.primary[checklist.id]) {
          return `Please select a replacement for primary assignment: ${checklist.title}`;
        }
      }
    }

    // Backup replacements are optional (can be left empty)
    
    return null;
  };

  // Handle confirm
  const handleConfirm = async () => {
    const error = validate();
    if (error) {
      setValidationError(error);
      return;
    }

    setSubmitting(true);
    try {
      // Prepare reassignment data
      const reassignmentData = {
        employeeId: employee.id,
        primaryReplacements: replacements.primary,
        backupReplacements: replacements.backup,
        primaryChecklists: primaryChecklists.map(c => ({
          id: c.id,
          title: c.title,
          hasOtherEmployees: hasOtherEmployees(c, 'primary'),
          currentEmployees: c.assignedEmployees || [],
        })),
        backupChecklists: backupChecklists.map(c => ({
          id: c.id,
          title: c.title,
          hasOtherEmployees: hasOtherEmployees(c, 'backup'),
          currentEmployees: c.backupEmployees || [],
        })),
      };

      await onConfirm(reassignmentData);
    } catch (error) {
      console.error('Error in reassignment:', error);
      setValidationError(error.message || 'Failed to process reassignment');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setReplacements({ primary: {}, backup: {} });
    setValidationError('');
    onClose();
  };

  const totalChecklists = primaryChecklists.length + backupChecklists.length;

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : handleCancel}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={submitting}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6">
            Reassign Checklists Before Deleting Employee
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Loading checklists...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Info Alert */}
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                <strong>{employee?.name}</strong> is assigned to <strong>{totalChecklists}</strong> checklist(s).
                You need to reassign these checklists before deletion.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Note:</strong> For checklists with multiple employees, only this employee will be replaced. 
                Other assigned employees will remain unchanged.
              </Typography>
            </Alert>

            {validationError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {validationError}
              </Alert>
            )}

            {totalChecklists === 0 && (
              <Alert severity="info">
                This employee is not assigned to any checklists. You can proceed with deletion.
              </Alert>
            )}

            {/* Primary Assignments */}
            {primaryChecklists.length > 0 && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PeopleIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Primary Assignments ({primaryChecklists.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Checklist</strong></TableCell>
                          <TableCell><strong>Other Assigned</strong></TableCell>
                          <TableCell width="250"><strong>Replace With</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {primaryChecklists.map((checklist) => {
                          const otherEmployees = (checklist.assignedEmployees || [])
                            .filter(id => id !== employee?.id)
                            .map(id => availableEmployees.find(emp => emp.id === id))
                            .filter(Boolean);
                          
                          const hasOthers = otherEmployees.length > 0;
                          const availableForThis = getAvailableEmployeesForChecklist(checklist, 'primary');

                          return (
                            <TableRow key={checklist.id}>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" fontWeight={500}>
                                    {checklist.title}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {checklist.recurrence?.type}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                {hasOthers ? (
                                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                                    {otherEmployees.map(emp => (
                                      <Chip
                                        key={emp.id}
                                        label={emp.name}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                    ))}
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="textSecondary">
                                    None
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <FormControl fullWidth size="small" required={!hasOthers}>
                                  <InputLabel>
                                    {hasOthers ? 'Optional' : 'Required *'}
                                  </InputLabel>
                                  <Select
                                    value={replacements.primary[checklist.id] || ''}
                                    onChange={(e) => handleReplacementChange(
                                      checklist.id,
                                      'primary',
                                      e.target.value
                                    )}
                                    label={hasOthers ? 'Optional' : 'Required *'}
                                    disabled={submitting}
                                  >
                                    <MenuItem value="">
                                      <em>{hasOthers ? 'No replacement (remove only)' : 'Select employee'}</em>
                                    </MenuItem>
                                    {availableForThis.map((emp) => (
                                      <MenuItem key={emp.id} value={emp.id}>
                                        {emp.name} ({emp.employeeId})
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Backup Assignments */}
            {backupChecklists.length > 0 && (
              <Accordion defaultExpanded={primaryChecklists.length === 0} sx={{ mt: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <BackupIcon color="warning" />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Backup Assignments ({backupChecklists.length})
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Checklist</strong></TableCell>
                          <TableCell><strong>Other Backups</strong></TableCell>
                          <TableCell width="250"><strong>Replace With</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {backupChecklists.map((checklist) => {
                          const otherBackups = (checklist.backupEmployees || [])
                            .filter(id => id !== employee?.id)
                            .map(id => availableEmployees.find(emp => emp.id === id))
                            .filter(Boolean);
                          
                          const hasOthers = otherBackups.length > 0;
                          const availableForThis = getAvailableEmployeesForChecklist(checklist, 'backup');

                          return (
                            <TableRow key={checklist.id}>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" fontWeight={500}>
                                    {checklist.title}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {checklist.recurrence?.type}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                {hasOthers ? (
                                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                                    {otherBackups.map(emp => (
                                      <Chip
                                        key={emp.id}
                                        label={emp.name}
                                        size="small"
                                        color="warning"
                                        variant="outlined"
                                      />
                                    ))}
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="textSecondary">
                                    None
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Optional</InputLabel>
                                  <Select
                                    value={replacements.backup[checklist.id] || ''}
                                    onChange={(e) => handleReplacementChange(
                                      checklist.id,
                                      'backup',
                                      e.target.value
                                    )}
                                    label="Optional"
                                    disabled={submitting}
                                  >
                                    <MenuItem value="">
                                      <em>No replacement (remove only)</em>
                                    </MenuItem>
                                    {availableForThis.map((emp) => (
                                      <MenuItem key={emp.id} value={emp.id}>
                                        {emp.name} ({emp.employeeId})
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Summary */}
            {totalChecklists > 0 && (
              <Box mt={3} p={2} sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  <strong>Summary:</strong>
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • {primaryChecklists.length} primary assignment(s) will be updated
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  • {backupChecklists.length} backup assignment(s) will be updated
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  • Other employees already assigned to these checklists will remain unchanged
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleCancel} 
          disabled={submitting || loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          disabled={submitting || loading}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
        >
          {submitting ? 'Processing...' : 'Confirm & Delete Employee'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmployeeReassignmentModal;
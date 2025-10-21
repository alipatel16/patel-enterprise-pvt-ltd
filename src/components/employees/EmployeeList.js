// src/components/employees/EmployeeList.js - UPDATED with Reassignment Modal
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  IconButton,
  Button,
  Avatar,
  Skeleton,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import {
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';

import { useEmployee } from '../../contexts/EmployeeContext/EmployeeContext';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';
import SearchBar from '../common/UI/SearchBar';
import Pagination from '../common/UI/Pagination';
import EmployeeReassignmentModal from './EmployeeReassignmentModal';
import checklistService from '../../services/checklistService';
import { 
  formatEmployeeForDisplay,
  EMPLOYEE_ROLES,
  EMPLOYEE_DEPARTMENTS 
} from '../../utils/validation/employeeValidation';

const EmployeeList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { userType } = useUserType();

  const {
    employees,
    loading,
    error,
    loadEmployees,
    deleteEmployee,
    clearError
  } = useEmployee();

  const { canDelete } = useAuth();

  // Local state for search and filters
  const [searchValue, setSearchValue] = useState('');
  const [localFilters, setLocalFilters] = useState({
    role: '',
    department: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Action menu state
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Simple delete dialog (for employees with no checklist assignments)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // NEW: Reassignment modal state
  const [reassignmentModalOpen, setReassignmentModalOpen] = useState(false);
  const [checklistsForEmployee, setChecklistsForEmployee] = useState([]);
  const [loadingChecklists, setLoadingChecklists] = useState(false);

  // Load employees on component mount
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchValue,
    localFilters.role,
    localFilters.department,
    localFilters.sortBy,
    localFilters.sortOrder,
    pageSize
  ]);

  // Apply client-side filtering and sorting
  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = [...employees];

    // Apply search filter
    if (searchValue.trim()) {
      const searchTerm = searchValue.toLowerCase().trim();
      filtered = filtered.filter((employee) => {
        return (
          employee.name?.toLowerCase().includes(searchTerm) ||
          employee.employeeId?.toLowerCase().includes(searchTerm) ||
          employee.phone?.includes(searchTerm) ||
          employee.email?.toLowerCase().includes(searchTerm) ||
          employee.role?.toLowerCase().includes(searchTerm) ||
          employee.department?.toLowerCase().includes(searchTerm)
        );
      });
    }

    // Apply role filter
    if (localFilters.role) {
      filtered = filtered.filter(
        (employee) => employee.role === localFilters.role
      );
    }

    // Apply department filter
    if (localFilters.department) {
      filtered = filtered.filter(
        (employee) => employee.department === localFilters.department
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[localFilters.sortBy] || '';
      let bValue = b[localFilters.sortBy] || '';

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (localFilters.sortBy === 'joinedDate' || localFilters.sortBy === 'createdAt') {
        aValue = new Date(aValue).getTime() || 0;
        bValue = new Date(bValue).getTime() || 0;
      }

      if (aValue < bValue) {
        return localFilters.sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return localFilters.sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [employees, searchValue, localFilters]);

  // Calculate client-side pagination
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedEmployees.slice(startIndex, endIndex);
  }, [filteredAndSortedEmployees, currentPage, pageSize]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const total = filteredAndSortedEmployees.length;
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = currentPage < totalPages;

    return {
      currentPage,
      totalPages,
      total,
      hasMore
    };
  }, [filteredAndSortedEmployees.length, currentPage, pageSize]);

  // Handle search input change
  const handleSearchChange = (value) => {
    setSearchValue(value);
  };

  // Handle search clear
  const handleSearchClear = () => {
    setSearchValue('');
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setLocalFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Handle sort change
  const handleSortChange = (sortBy) => {
    const newSortOrder =
      localFilters.sortBy === sortBy && localFilters.sortOrder === 'asc'
        ? 'desc'
        : 'asc';
    setLocalFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: newSortOrder
    }));
  };

  // Handle action menu
  const handleActionMenuOpen = (event, employee) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedEmployee(employee);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  // NEW: Handle delete with checklist check
  const handleDeleteClick = async () => {
    handleActionMenuClose();
    
    if (!selectedEmployee) return;

    try {
      setLoadingChecklists(true);

      // Check if employee has any checklist assignments
      const allChecklists = await checklistService.getChecklists(userType);
      const employeeChecklists = allChecklists.filter(checklist => 
        checklist.assignedEmployees?.includes(selectedEmployee.id) ||
        checklist.backupEmployees?.includes(selectedEmployee.id)
      );

      if (employeeChecklists.length > 0) {
        // Employee has checklists - show reassignment modal
        setChecklistsForEmployee(employeeChecklists);
        setReassignmentModalOpen(true);
      } else {
        // No checklists - show simple delete confirmation
        setDeleteDialogOpen(true);
      }
    } catch (error) {
      console.error('Error checking checklists:', error);
      // If error, still allow simple delete
      setDeleteDialogOpen(true);
    } finally {
      setLoadingChecklists(false);
    }
  };

  // Handle simple delete (no checklists)
  const handleSimpleDeleteConfirm = async () => {
    if (!selectedEmployee) return;

    setDeleting(true);
    try {
      const success = await deleteEmployee(selectedEmployee.id);
      if (success) {
        setDeleteDialogOpen(false);
        setSelectedEmployee(null);
        loadEmployees();
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleSimpleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedEmployee(null);
  };

  // NEW: Handle reassignment confirmation
  const handleReassignmentConfirm = async (reassignmentData) => {
    try {
      console.log('Processing reassignment:', reassignmentData);

      // Process all checklist updates
      await checklistService.reassignEmployeeChecklists(
        userType,
        reassignmentData
      );

      // After successful reassignment, delete the employee
      const success = await deleteEmployee(selectedEmployee.id);
      
      if (success) {
        setReassignmentModalOpen(false);
        setSelectedEmployee(null);
        setChecklistsForEmployee([]);
        loadEmployees();
      }
    } catch (error) {
      console.error('Reassignment error:', error);
      throw error; // Re-throw to show error in modal
    }
  };

  // Handle reassignment cancel
  const handleReassignmentCancel = () => {
    setReassignmentModalOpen(false);
    setSelectedEmployee(null);
    setChecklistsForEmployee([]);
  };

  // Handle pagination change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Get role color
  const getRoleColor = (role) => {
    const roleColors = {
      [EMPLOYEE_ROLES.ADMIN]: theme.palette.error.main,
      [EMPLOYEE_ROLES.SALES_MANAGER]: theme.palette.primary.main,
      [EMPLOYEE_ROLES.STORE_MANAGER]: theme.palette.secondary.main,
      [EMPLOYEE_ROLES.SALES_EXECUTIVE]: theme.palette.info.main,
      [EMPLOYEE_ROLES.CASHIER]: theme.palette.success.main,
      [EMPLOYEE_ROLES.TECHNICIAN]: theme.palette.warning.main,
      [EMPLOYEE_ROLES.ACCOUNTANT]: theme.palette.info.main
    };
    return roleColors[role] || theme.palette.grey[600];
  };

  // Format years of service
  const formatYearsOfService = (dateOfJoining) => {
    if (!dateOfJoining) return 'N/A';
    
    const joiningDate = new Date(dateOfJoining);
    const now = new Date();
    const years = Math.floor((now - joiningDate) / (365.25 * 24 * 60 * 60 * 1000));
    const months = Math.floor(((now - joiningDate) % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));
    
    if (years > 0) {
      return `${years}y ${months}m`;
    }
    return `${months} months`;
  };

  // Filter options for search bar
  const filterOptions = [
    {
      key: 'role',
      label: 'Role',
      options: [
        { value: '', label: 'All Roles' },
        ...Object.entries(EMPLOYEE_ROLES).map(([key, value]) => ({
          value,
          label: value.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')
        }))
      ]
    },
    {
      key: 'department',
      label: 'Department',
      options: [
        { value: '', label: 'All Departments' },
        ...Object.entries(EMPLOYEE_DEPARTMENTS).map(([key, value]) => ({
          value,
          label: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
        }))
      ]
    }
  ];

  // Sort options
  const sortOptions = {
    name: 'Name',
    joinedDate: 'Recently Joined',
    role: 'Role'
  };

  // Get available employees for reassignment (excluding the one being deleted)
  const getAvailableEmployeesForReassignment = () => {
    return employees.filter(emp => emp.id !== selectedEmployee?.id && emp.isActive);
  };

  // Render loading skeletons
  if (loading && employees.length === 0) {
    return (
      <Box>
        <SearchBar disabled />
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: 280 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box flex={1}>
                      <Skeleton variant="text" width="60%" />
                      <Skeleton variant="text" width="40%" />
                    </Box>
                  </Box>
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="60%" />
                  <Box display="flex" gap={1} mt={2}>
                    <Skeleton variant="rectangular" width={60} height={24} />
                    <Skeleton variant="rectangular" width={80} height={24} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Search and Filters */}
      <Box mb={3}>
        <SearchBar
          value={searchValue}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          placeholder="Search employees by name, ID, phone, or email..."
          disabled={loading}
          filters={localFilters}
          onFilterChange={handleFilterChange}
          filterOptions={filterOptions}
          sortOptions={sortOptions}
          onSortChange={handleSortChange}
          showFilters
          showSort
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {!loading && filteredAndSortedEmployees.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <BadgeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No employees found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {searchValue || localFilters.role || localFilters.department
                ? 'Try adjusting your search criteria or filters.'
                : 'Start by adding your first employee to manage your team.'
              }
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/employees/add')}
            >
              Add Employee
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Employee Grid */}
      {filteredAndSortedEmployees.length > 0 && (
        <>
          <Grid container spacing={3}>
            {paginatedEmployees.map((employee) => {
              const formattedEmployee = formatEmployeeForDisplay(employee);
              
              return (
                <Grid item xs={12} sm={6} lg={4} key={employee.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      height: 280,
                      display: 'flex',
                      flexDirection: 'column',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => navigate(`/employees/view/${employee.id}`)}
                  >
                    <CardContent
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        p: 2.5
                      }}
                    >
                      {/* Header */}
                      <Box
                        display="flex"
                        alignItems="flex-start"
                        justifyContent="space-between"
                        mb={2}
                      >
                        <Box
                          display="flex"
                          alignItems="center"
                          gap={2}
                          flex={1}
                          minWidth={0}
                        >
                          <Avatar
                            sx={{
                              bgcolor: getRoleColor(employee.role),
                              color: 'white',
                              width: 40,
                              height: 40
                            }}
                          >
                            {employee.name?.charAt(0)?.toUpperCase() || 'E'}
                          </Avatar>
                          <Box minWidth={0} flex={1}>
                            <Typography
                              variant="h6"
                              component="h3"
                              noWrap
                              sx={{ fontSize: '1rem', fontWeight: 600 }}
                            >
                              {employee.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                              sx={{ fontSize: '0.75rem' }}
                            >
                              ID: {employee.employeeId}
                            </Typography>
                          </Box>
                        </Box>

                        <IconButton
                          size="small"
                          onClick={(e) => handleActionMenuOpen(e, employee)}
                          sx={{ mt: -0.5 }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      {/* Contact and Role Info */}
                      <Box mb={2} sx={{ flex: 1, minHeight: 120 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <WorkIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            {formattedEmployee.roleDisplay}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <BadgeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                            {formattedEmployee.departmentDisplay}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap sx={{ fontSize: '0.875rem' }}>
                            {employee.phone}
                          </Typography>
                        </Box>
                        {employee.email && (
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" noWrap sx={{ fontSize: '0.875rem' }}>
                              {employee.email}
                            </Typography>
                          </Box>
                        )}
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                            {formatYearsOfService(employee.joinedDate)} of service
                          </Typography>
                        </Box>
                      </Box>

                      {/* Tags */}
                      <Box display="flex" gap={1} flexWrap="wrap" mt="auto">
                        <Chip
                          label={formattedEmployee.roleDisplay}
                          size="small"
                          sx={{
                            backgroundColor: `${getRoleColor(employee.role)}15`,
                            color: getRoleColor(employee.role),
                            fontWeight: 500,
                            fontSize: '0.75rem',
                            height: 24
                          }}
                        />
                        <Chip
                          label={formattedEmployee.departmentDisplay}
                          size="small"
                          variant="outlined"
                          sx={{
                            textTransform: 'capitalize',
                            fontSize: '0.75rem',
                            height: 24
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Pagination */}
          <Box mt={4}>
            <Pagination
              currentPage={paginationInfo.currentPage}
              totalPages={paginationInfo.totalPages}
              total={paginationInfo.total}
              pageSize={pageSize}
              pageSizeOptions={[5, 10, 25, 50]}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              itemName="employees"
              disabled={loading}
            />
          </Box>
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem
          onClick={() => {
            navigate(`/employees/view/${selectedEmployee?.id}`);
            handleActionMenuClose();
          }}
        >
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>

        <MenuItem
          onClick={() => {
            navigate(`/employees/edit/${selectedEmployee?.id}`);
            handleActionMenuClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

        {canDelete() && (
          <MenuItem onClick={handleDeleteClick} disabled={loadingChecklists}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Simple Delete Confirmation Dialog (No Checklists) */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleSimpleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete employee "{selectedEmployee?.name}" (ID: {selectedEmployee?.employeeId})?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSimpleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleSimpleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* NEW: Employee Reassignment Modal (With Checklists) */}
      <EmployeeReassignmentModal
        open={reassignmentModalOpen}
        onClose={handleReassignmentCancel}
        onConfirm={handleReassignmentConfirm}
        employee={selectedEmployee}
        checklists={checklistsForEmployee}
        availableEmployees={getAvailableEmployeesForReassignment()}
        loading={loadingChecklists}
      />
    </Box>
  );
};

export default EmployeeList;
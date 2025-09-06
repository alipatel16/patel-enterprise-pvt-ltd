import React, { useState, useEffect } from 'react';
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
  useMediaQuery
} from '@mui/material';
import {
  Person as PersonIcon,
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
import SearchBar from '../common/UI/SearchBar';
import Pagination from '../common/UI/Pagination';
import { 
  formatEmployeeForDisplay,
  EMPLOYEE_ROLES,
  EMPLOYEE_DEPARTMENTS 
} from '../../utils/validation/employeeValidation';

const EmployeeList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    employees,
    loading,
    error,
    pagination,
    filters,
    loadEmployees,
    searchEmployees,
    deleteEmployee,
    setFilters,
    clearError
  } = useEmployee();

  const { canDelete } = useAuth();

  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load employees on component mount
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Handle search
  const handleSearch = (searchTerm) => {
    if (searchTerm.trim()) {
      searchEmployees(searchTerm);
    } else {
      loadEmployees();
    }
  };

  // Handle search clear
  const handleSearchClear = () => {
    setFilters({ search: '' });
    loadEmployees();
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadEmployees();
  };

  // Handle action menu
  const handleActionMenuOpen = (event, employee) => {
    setActionMenuAnchor(event.currentTarget);
    setSelectedEmployee(employee);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedEmployee(null);
  };

  // Handle delete
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return;

    setDeleting(true);
    try {
      const success = await deleteEmployee(selectedEmployee.id);
      if (success) {
        setDeleteDialogOpen(false);
        setSelectedEmployee(null);
        // Reload employees if we're on the last page and it becomes empty
        if (employees.length === 1 && pagination.currentPage > 1) {
          loadEmployees({ offset: (pagination.currentPage - 2) * 10 });
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedEmployee(null);
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
      options: Object.entries(EMPLOYEE_ROLES).map(([key, value]) => ({
        value,
        label: value.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')
      }))
    },
    {
      key: 'department',
      label: 'Department',
      options: Object.entries(EMPLOYEE_DEPARTMENTS).map(([key, value]) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
      }))
    }
  ];

  // Sort options
  const sortOptions = {
    name: 'Name A-Z',
    dateOfJoining: 'Recently Joined',
    role: 'Role'
  };

  // Render loading skeletons
  if (loading && employees.length === 0) {
    return (
      <Box>
        <SearchBar disabled />
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
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
          value={filters.search}
          onChange={(value) => setFilters({ search: value })}
          onSearch={handleSearch}
          onClear={handleSearchClear}
          placeholder="Search employees by name, ID, phone, or email..."
          disabled={loading}
          filters={filters}
          onFilterChange={handleFilterChange}
          filterOptions={filterOptions}
          sortOptions={sortOptions}
          onSortChange={(sortBy) => setFilters({ sortBy })}
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
      {!loading && employees.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <BadgeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No employees found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {filters.search ? 
                'Try adjusting your search criteria or filters.' :
                'Start by adding your first employee to manage your team.'
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
      {employees.length > 0 && (
        <>
          <Grid container spacing={3}>
            {employees.map((employee) => {
              const formattedEmployee = formatEmployeeForDisplay(employee);
              
              return (
                <Grid item xs={12} sm={6} lg={4} key={employee.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => navigate(`/employees/view/${employee.id}`)}
                  >
                    <CardContent>
                      {/* Header */}
                      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center" gap={2} flex={1} minWidth={0}>
                          <Avatar
                            sx={{
                              bgcolor: getRoleColor(employee.role),
                              color: 'white'
                            }}
                          >
                            {employee.name?.charAt(0)?.toUpperCase() || 'E'}
                          </Avatar>
                          <Box minWidth={0} flex={1}>
                            <Typography variant="h6" component="h3" noWrap>
                              {employee.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              ID: {employee.employeeId}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionMenuOpen(e, employee);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      {/* Role and Department */}
                      <Box mb={2}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <WorkIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {formattedEmployee.roleDisplay}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <BadgeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {formattedEmployee.departmentDisplay}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Contact Info */}
                      <Box mb={2}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap>
                            {employee.phone}
                          </Typography>
                        </Box>
                        {employee.email && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" noWrap>
                              {employee.email}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Service Duration */}
                      <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatYearsOfService(employee.dateOfJoining)} of service
                        </Typography>
                      </Box>

                      {/* Tags */}
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip
                          label={formattedEmployee.roleDisplay}
                          size="small"
                          sx={{ 
                            backgroundColor: `${getRoleColor(employee.role)}15`,
                            color: getRoleColor(employee.role),
                            fontWeight: 500
                          }}
                        />
                        <Chip
                          label={formattedEmployee.departmentDisplay}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
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
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={10}
              onPageChange={(page) => loadEmployees({ offset: (page - 1) * 10 })}
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
        <MenuItem onClick={() => {
          navigate(`/employees/view/${selectedEmployee?.id}`);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => {
          navigate(`/employees/edit/${selectedEmployee?.id}`);
          handleActionMenuClose();
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

        {canDelete() && (
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete employee "{selectedEmployee?.name}" (ID: {selectedEmployee?.employeeId})? 
            This action cannot be undone and will also affect any sales records associated with this employee.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeList;
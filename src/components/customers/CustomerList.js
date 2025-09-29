import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  useMediaQuery,
} from "@mui/material";
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from "@mui/icons-material";

import { useCustomer } from "../../contexts/CustomerContext/CustomerContext";
import { useAuth } from "../../contexts/AuthContext/AuthContext";
import SearchBar from "../common/UI/SearchBar";
import Pagination from "../common/UI/Pagination";
import {
  CUSTOMER_TYPES,
  CUSTOMER_CATEGORIES,
} from "../../utils/constants/appConstants";

const CustomerList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const {
    customers,
    loading,
    error,
    pagination,
    loadCustomers,
    deleteCustomer,
    clearError,
  } = useCustomer();

  const { canDelete } = useAuth();

  // Local state for search and filters (no debouncing to avoid focus loss)
  const [searchValue, setSearchValue] = useState("");
  const [localFilters, setLocalFilters] = useState({
    customerType: "",
    category: "",
    sortBy: "name",
    sortOrder: "asc",
  });

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Action menu state
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchValue,
    localFilters.customerType,
    localFilters.category,
    localFilters.sortBy,
    localFilters.sortOrder,
    pageSize,
  ]);

  // Apply client-side filtering and sorting
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = [...customers];

    // Apply search filter
    if (searchValue.trim()) {
      const searchTerm = searchValue.toLowerCase().trim();
      filtered = filtered.filter((customer) => {
        return (
          customer.name?.toLowerCase().includes(searchTerm) ||
          customer.phone?.includes(searchTerm) ||
          customer.email?.toLowerCase().includes(searchTerm) ||
          customer.address?.toLowerCase().includes(searchTerm) ||
          customer.gstNumber?.toLowerCase().includes(searchTerm) ||
          customer.purpose?.toLowerCase().includes(searchTerm) // ADDED: Search in purpose
        );
      });
    }

    // Apply customer type filter
    if (localFilters.customerType) {
      filtered = filtered.filter(
        (customer) => customer.customerType === localFilters.customerType
      );
    }

    // Apply category filter
    if (localFilters.category) {
      filtered = filtered.filter(
        (customer) => customer.category === localFilters.category
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[localFilters.sortBy] || "";
      let bValue = b[localFilters.sortBy] || "";

      // Handle different data types
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (
        localFilters.sortBy === "createdAt" ||
        localFilters.sortBy === "updatedAt"
      ) {
        aValue = new Date(aValue).getTime() || 0;
        bValue = new Date(bValue).getTime() || 0;
      }

      if (aValue < bValue) {
        return localFilters.sortOrder === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return localFilters.sortOrder === "asc" ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [customers, searchValue, localFilters]);

  // Calculate client-side pagination
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedCustomers.slice(startIndex, endIndex);
  }, [filteredAndSortedCustomers, currentPage, pageSize]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const total = filteredAndSortedCustomers.length;
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = currentPage < totalPages;

    return {
      currentPage,
      totalPages,
      total,
      hasMore,
    };
  }, [filteredAndSortedCustomers.length, currentPage, pageSize]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchValue,
    localFilters.customerType,
    localFilters.category,
    localFilters.sortBy,
    localFilters.sortOrder,
  ]);

  // Handle search input change (no debouncing)
  const handleSearchChange = (value) => {
    setSearchValue(value);
  };

  // Handle search clear
  const handleSearchClear = () => {
    setSearchValue("");
  };

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setLocalFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Handle sort change
  const handleSortChange = (sortBy) => {
    const newSortOrder =
      localFilters.sortBy === sortBy && localFilters.sortOrder === "asc"
        ? "desc"
        : "asc";
    setLocalFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder: newSortOrder,
    }));
  };

  // Handle action menu
  const handleActionMenuOpen = (event, customer) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedCustomer(customer);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  // Handle delete
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleActionMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCustomer) return;

    setDeleting(true);
    try {
      const success = await deleteCustomer(selectedCustomer.id);
      if (success) {
        setDeleteDialogOpen(false);
        setSelectedCustomer(null);
        // Reload customers
        loadCustomers();
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedCustomer(null);
  };

  // Handle pagination change - now works with client-side data
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case CUSTOMER_CATEGORIES.INDIVIDUAL:
        return <PersonIcon />;
      case CUSTOMER_CATEGORIES.FIRM:
        return <BusinessIcon />;
      case CUSTOMER_CATEGORIES.SCHOOL:
        return <SchoolIcon />;
      default:
        return <PersonIcon />;
    }
  };

  // Get customer type color
  const getCustomerTypeColor = (type) => {
    return type === CUSTOMER_TYPES.WHOLESALER ? "primary" : "secondary";
  };

  // Filter options for search bar
  const filterOptions = [
    {
      key: "customerType",
      label: "Customer Type",
      options: [
        { value: "", label: "All Types" },
        { value: CUSTOMER_TYPES.WHOLESALER, label: "Wholesaler" },
        { value: CUSTOMER_TYPES.RETAILER, label: "Retailer" },
      ],
    },
    {
      key: "category",
      label: "Category",
      options: [
        { value: "", label: "All Categories" },
        { value: CUSTOMER_CATEGORIES.INDIVIDUAL, label: "Individual" },
        { value: CUSTOMER_CATEGORIES.FIRM, label: "Firm" },
        { value: CUSTOMER_CATEGORIES.SCHOOL, label: "School" },
      ],
    },
  ];

  // Sort options
  const sortOptions = {
    name: "Name",
    createdAt: "Recently Added",
    phone: "Phone Number",
  };

  // Render loading skeletons
  if (loading && customers.length === 0) {
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
          placeholder="Search customers by name, phone, email, or purpose..."
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
      {!loading && filteredAndSortedCustomers.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <PersonIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No customers found
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {searchValue || localFilters.customerType || localFilters.category
                ? "Try adjusting your search criteria or filters."
                : "Start by adding your first customer to manage your business relationships."}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/customers/add")}
            >
              Add Customer
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Customer Grid */}
      {filteredAndSortedCustomers.length > 0 && (
        <>
          <Grid container spacing={3}>
            {paginatedCustomers.map((customer) => (
              <Grid item xs={12} sm={6} lg={4} key={customer.id}>
                <Card
                  sx={{
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                    height: customer.purpose ? 320 : 280, // MODIFIED: Dynamic height based on purpose
                    display: "flex",
                    flexDirection: "column",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate(`/customers/view/${customer.id}`)}
                >
                  <CardContent
                    sx={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      p: 2.5,
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
                            bgcolor: theme.palette.primary.main,
                            color: "white",
                            width: 40,
                            height: 40,
                          }}
                        >
                          {getCategoryIcon(customer.category)}
                        </Avatar>
                        <Box minWidth={0} flex={1}>
                          <Typography
                            variant="h6"
                            component="h3"
                            noWrap
                            sx={{ fontSize: "1rem", fontWeight: 600 }}
                          >
                            {customer.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{ fontSize: "0.75rem" }}
                          >
                            ID: {customer.id.slice(-8).toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>

                      <IconButton
                        size="small"
                        onClick={(e) => handleActionMenuOpen(e, customer)}
                        sx={{ mt: -0.5 }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </Box>

                    {/* Contact Info - Modified height section */}
                    <Box mb={2} sx={{ flex: 1, minHeight: customer.purpose ? 160 : 120 }}>
                      {customer.phone && (
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <PhoneIcon
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ fontSize: "0.875rem" }}
                          >
                            {customer.phone}
                          </Typography>
                        </Box>
                      )}
                      {customer.email && (
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <EmailIcon
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ fontSize: "0.875rem" }}
                          >
                            {customer.email}
                          </Typography>
                        </Box>
                      )}
                      {customer.address && (
                        <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
                          <LocationIcon
                            sx={{
                              fontSize: 16,
                              color: "text.secondary",
                              mt: 0.25,
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 2,
                              overflow: "hidden",
                              fontSize: "0.875rem",
                              lineHeight: 1.4,
                            }}
                          >
                            {customer.address}
                          </Typography>
                        </Box>
                      )}
                      {/* ADDED: Purpose Display */}
                      {customer.purpose && (
                        <Box 
                          display="flex" 
                          alignItems="flex-start" 
                          gap={1}
                          sx={{
                            mt: 1.5,
                            p: 1,
                            bgcolor: 'action.hover',
                            borderRadius: 1
                          }}
                        >
                          <DescriptionIcon
                            sx={{
                              fontSize: 16,
                              color: "primary.main",
                              mt: 0.25,
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 2,
                              overflow: "hidden",
                              fontSize: "0.875rem",
                              lineHeight: 1.4,
                              fontStyle: 'italic',
                              color: 'text.secondary'
                            }}
                          >
                            {customer.purpose}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Tags - Fixed bottom section */}
                    <Box display="flex" gap={1} flexWrap="wrap" mt="auto">
                      <Chip
                        label={customer.customerType}
                        size="small"
                        color={getCustomerTypeColor(customer.customerType)}
                        sx={{
                          textTransform: "capitalize",
                          fontSize: "0.75rem",
                          height: 24,
                        }}
                      />
                      <Chip
                        label={customer.category}
                        size="small"
                        variant="outlined"
                        sx={{
                          textTransform: "capitalize",
                          fontSize: "0.75rem",
                          height: 24,
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination - Now using client-side pagination info */}
          <Box mt={4}>
            <Pagination
              currentPage={paginationInfo.currentPage}
              totalPages={paginationInfo.totalPages}
              total={paginationInfo.total}
              pageSize={pageSize}
              pageSizeOptions={[5, 10, 25, 50]}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              itemName="customers"
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
            navigate(`/customers/view/${selectedCustomer?.id}`);
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
            navigate(`/customers/edit/${selectedCustomer?.id}`);
            handleActionMenuClose();
          }}
        >
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
            Are you sure you want to delete customer "{selectedCustomer?.name}"?
            This action cannot be undone.
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
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerList;
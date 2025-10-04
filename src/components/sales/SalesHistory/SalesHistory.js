import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  IconButton,
  Button,
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
  Avatar,
  Tooltip,
  Paper,
} from "@mui/material";
import {
  Receipt as ReceiptIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as DeliveryIcon,
  Payment as PaymentIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PaymentOutlined as RecordPaymentIcon,
  DateRange as DateRangeIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import { useSales } from "../../../contexts/SalesContext/SalesContext";
import { useAuth } from "../../../contexts/AuthContext/AuthContext";
import SearchBar from "../../common/UI/SearchBar";
import Pagination from "../../common/UI/Pagination";
import {
  PAYMENT_STATUS,
  PAYMENT_STATUS_DISPLAY,
  DELIVERY_STATUS,
  PAYMENT_CATEGORY_DISPLAY,
} from "../../../utils/constants/appConstants";
import RecordPaymentDialog from "../Payment/RecordPaymentDialog";

const SalesHistory = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const { sales, loading, error, loadSales, deleteInvoice, clearError } =
    useSales();

  const { canDelete } = useAuth();

  // Get customer ID from URL query parameter
  const customerIdFromUrl = searchParams.get("customer");

  // Local state for search and filters (no debouncing to avoid focus loss)
  const [searchValue, setSearchValue] = useState("");
  const [localFilters, setLocalFilters] = useState({
    paymentStatus: "",
    deliveryStatus: "",
    originalPaymentCategory: "", // NEW - Filter by original payment category
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // NEW - Date range filter state
  const [dateFilters, setDateFilters] = useState({
    fromDate: null,
    toDate: null,
  });

  // Client-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Action menu state
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState(null);

  // Load sales on component mount
  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchValue,
    localFilters.paymentStatus,
    localFilters.deliveryStatus,
    localFilters.originalPaymentCategory, // NEW
    localFilters.sortBy,
    localFilters.sortOrder,
    pageSize,
    customerIdFromUrl,
    dateFilters.fromDate, // NEW
    dateFilters.toDate, // NEW
  ]);

  // Find customer name for filtered customer
  const filteredCustomerName = useMemo(() => {
    if (!customerIdFromUrl || !sales.length) return null;

    const customerSale = sales.find(
      (sale) => sale.customerId === customerIdFromUrl
    );
    return customerSale?.customerName || null;
  }, [customerIdFromUrl, sales]);

  // Apply client-side filtering and sorting
  const filteredAndSortedSales = useMemo(() => {
    let filtered = [...sales];

    // FIRST: Apply customer filter if customer ID is provided in URL
    if (customerIdFromUrl) {
      filtered = filtered.filter(
        (sale) => sale.customerId === customerIdFromUrl
      );
    }

    // Apply search filter
    if (searchValue.trim()) {
      const searchTerm = searchValue.toLowerCase().trim();
      filtered = filtered.filter((sale) => {
        return (
          sale.invoiceNumber?.toLowerCase().includes(searchTerm) ||
          sale.customerName?.toLowerCase().includes(searchTerm) ||
          sale.customerPhone?.includes(searchTerm) ||
          sale.items?.some((item) =>
            item.name?.toLowerCase().includes(searchTerm)
          )
        );
      });
    }

    // Apply payment status filter
    if (localFilters.paymentStatus) {
      filtered = filtered.filter(
        (sale) => sale.paymentStatus === localFilters.paymentStatus
      );
    }

    // Apply delivery status filter
    if (localFilters.deliveryStatus) {
      filtered = filtered.filter(
        (sale) => sale.deliveryStatus === localFilters.deliveryStatus
      );
    }

    // NEW - Apply original payment category filter
    if (localFilters.originalPaymentCategory) {
      filtered = filtered.filter(
        (sale) =>
          sale.originalPaymentCategory === localFilters.originalPaymentCategory
      );
    }

    // NEW - Apply date range filter
    if (dateFilters.fromDate || dateFilters.toDate) {
      filtered = filtered.filter((sale) => {
        const saleDate = new Date(sale.saleDate || sale.createdAt);

        // Check from date
        if (dateFilters.fromDate) {
          const fromDate = new Date(dateFilters.fromDate);
          fromDate.setHours(0, 0, 0, 0); // Start of day
          if (saleDate < fromDate) {
            return false;
          }
        }

        // Check to date
        if (dateFilters.toDate) {
          const toDate = new Date(dateFilters.toDate);
          toDate.setHours(23, 59, 59, 999); // End of day
          if (saleDate > toDate) {
            return false;
          }
        }

        return true;
      });
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
        localFilters.sortBy === "saleDate" ||
        localFilters.sortBy === "updatedAt"
      ) {
        aValue = new Date(aValue).getTime() || 0;
        bValue = new Date(bValue).getTime() || 0;
      }

      if (
        localFilters.sortBy === "grandTotal" ||
        localFilters.sortBy === "totalAmount"
      ) {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
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
  }, [sales, searchValue, localFilters, customerIdFromUrl, dateFilters]);

  // Calculate client-side pagination
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedSales.slice(startIndex, endIndex);
  }, [filteredAndSortedSales, currentPage, pageSize]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const total = filteredAndSortedSales.length;
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = currentPage < totalPages;

    return {
      currentPage,
      totalPages,
      total,
      hasMore,
    };
  }, [filteredAndSortedSales.length, currentPage, pageSize]);

  // Handle clearing customer filter
  const handleClearCustomerFilter = () => {
    // Remove customer parameter from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("customer");
    setSearchParams(newSearchParams);
  };

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

  // NEW - Handle date filter changes
  const handleDateFilterChange = (field) => (date) => {
    setDateFilters((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  // NEW - Clear date filters
  const handleClearDateFilters = () => {
    setDateFilters({
      fromDate: null,
      toDate: null,
    });
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
  const handleActionMenuOpen = (event, invoice) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedInvoice(invoice);
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
    if (!selectedInvoice) return;

    setDeleting(true);
    try {
      const success = await deleteInvoice(selectedInvoice.id);
      if (success) {
        setDeleteDialogOpen(false);
        setSelectedInvoice(null);
        // Reload sales
        loadSales();
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedInvoice(null);
  };

  // Handle pagination change - now works with client-side data
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  // Payment recording functions
  const canRecordPayment = (invoice) => {
    if (!invoice) return false;

    const isPartialPayment =
      invoice.paymentStatus === PAYMENT_STATUS.PENDING ||
      invoice.paymentStatus === PAYMENT_STATUS.FINANCE ||
      invoice.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER;

    if (!isPartialPayment) return false;

    const remainingBalance = getRemainingBalance(invoice);
    return remainingBalance > 0;
  };

  const handleRecordPayment = () => {
    setSelectedInvoiceForPayment(selectedInvoice);
    handleActionMenuClose();
  };

  // Get payment status color with new statuses
  const getPaymentStatusColor = (status) => {
    const statusColors = {
      [PAYMENT_STATUS.PAID]: "success",
      [PAYMENT_STATUS.PENDING]: "error",
      [PAYMENT_STATUS.EMI]: "warning",
      [PAYMENT_STATUS.FINANCE]: "info",
      [PAYMENT_STATUS.BANK_TRANSFER]: "primary",
    };
    return statusColors[status] || "default";
  };

  // Get delivery status color
  const getDeliveryStatusColor = (status) => {
    const statusColors = {
      [DELIVERY_STATUS.DELIVERED]: "success",
      [DELIVERY_STATUS.PENDING]: "error",
      [DELIVERY_STATUS.SCHEDULED]: "info",
    };
    return statusColors[status] || "default";
  };

  // Get payment status icon
  const getPaymentStatusIcon = (status) => {
    const iconMap = {
      [PAYMENT_STATUS.PAID]: <MoneyIcon />,
      [PAYMENT_STATUS.PENDING]: <PaymentIcon />,
      [PAYMENT_STATUS.EMI]: <ScheduleIcon />,
      [PAYMENT_STATUS.FINANCE]: <BankIcon />,
      [PAYMENT_STATUS.BANK_TRANSFER]: <CardIcon />,
    };
    return iconMap[status] || <PaymentIcon />;
  };

  // Calculate actual amount paid for partial payments
  const getActualAmountPaid = (sale) => {
    if (sale.paymentStatus === PAYMENT_STATUS.PENDING) {
      // For pending payments, check if there's any payment history
      return sale.paymentDetails?.downPayment || 0;
    }
    if (
      sale.paymentStatus === PAYMENT_STATUS.FINANCE ||
      sale.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER
    ) {
      return sale.paymentDetails?.downPayment || 0;
    }
    if (sale.paymentStatus === PAYMENT_STATUS.PAID || sale.fullyPaid) {
      return sale.grandTotal || sale.totalAmount || 0;
    }
    if (
      sale.paymentStatus === PAYMENT_STATUS.EMI &&
      sale.emiDetails?.schedule
    ) {
      return sale.emiDetails.schedule
        .filter((emi) => emi.paid)
        .reduce((sum, emi) => sum + (emi.paidAmount || emi.amount || 0), 0);
    }
    return 0;
  };

  // Get remaining balance
  const getRemainingBalance = (sale) => {
    const totalAmount = sale.netPayable || sale.grandTotal || sale.totalAmount || 0;
    const paidAmount = getActualAmountPaid(sale);
    return Math.max(0, totalAmount - paidAmount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Filter options for search bar - UPDATED with new payment categories
  const filterOptions = [
    {
      key: "paymentStatus",
      label: "Payment Status",
      options: [
        { value: "", label: "All Payment Status" },
        {
          value: PAYMENT_STATUS.PAID,
          label: PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.PAID],
        },
        {
          value: PAYMENT_STATUS.PENDING,
          label: PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.PENDING],
        },
        {
          value: PAYMENT_STATUS.EMI,
          label: PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.EMI],
        },
        {
          value: PAYMENT_STATUS.FINANCE,
          label: PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.FINANCE],
        },
        {
          value: PAYMENT_STATUS.BANK_TRANSFER,
          label: PAYMENT_STATUS_DISPLAY[PAYMENT_STATUS.BANK_TRANSFER],
        },
      ],
    },
    {
      key: "deliveryStatus",
      label: "Delivery Status",
      options: [
        { value: "", label: "All Delivery Status" },
        { value: DELIVERY_STATUS.DELIVERED, label: "Delivered" },
        { value: DELIVERY_STATUS.PENDING, label: "Pending" },
        { value: DELIVERY_STATUS.SCHEDULED, label: "Scheduled" },
      ],
    },
    // NEW - Filter by original payment category
    {
      key: "originalPaymentCategory",
      label: "Payment Category",
      options: [
        { value: "", label: "All Payment Categories" },
        ...Object.entries(PAYMENT_CATEGORY_DISPLAY).map(([key, label]) => ({
          value: key,
          label,
        })),
      ],
    },
  ];

  // Sort options
  const sortOptions = {
    createdAt: "Recent First",
    invoiceNumber: "Invoice Number",
    customerName: "Customer Name",
    grandTotal: "Amount",
  };

  // Render loading skeletons
  if (loading && sales.length === 0) {
    return (
      <Box>
        <SearchBar disabled />
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} lg={4} key={index}>
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
      {/* Customer Filter Indicator */}
      {customerIdFromUrl && filteredCustomerName && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleClearCustomerFilter}
              startIcon={<ClearIcon />}
            >
              Show All
            </Button>
          }
          icon={<FilterIcon />}
        >
          <Typography variant="body2">
            <strong>Filtered by Customer:</strong> {filteredCustomerName}
          </Typography>
        </Alert>
      )}

      {/* Search and Filters */}
      <Box mb={3}>
        <SearchBar
          value={searchValue}
          onChange={handleSearchChange}
          onClear={handleSearchClear}
          placeholder={
            customerIdFromUrl
              ? `Search in ${filteredCustomerName}'s invoices...`
              : "Search by invoice number, customer name, or phone..."
          }
          disabled={loading}
          filters={localFilters}
          onFilterChange={handleFilterChange}
          filterOptions={filterOptions}
          sortOptions={sortOptions}
          onSortChange={handleSortChange}
          showFilters
          showSort
        />

        {/* NEW - Date Range Filters */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mt: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
            backgroundColor: "background.paper",
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <DateRangeIcon sx={{ color: "text.secondary" }} />
            <Typography variant="body2" fontWeight={500} color="text.secondary">
              Date Range:
            </Typography>
          </Box>

          <DatePicker
            label="From Date"
            value={dateFilters.fromDate}
            onChange={handleDateFilterChange("fromDate")}
            disabled={loading}
            format="dd/MM/yyyy"
            maxDate={dateFilters.toDate || new Date()}
            slotProps={{
              textField: {
                size: "small",
                sx: { minWidth: { xs: "140px", sm: "160px" } },
              },
            }}
          />

          <DatePicker
            label="To Date"
            value={dateFilters.toDate}
            onChange={handleDateFilterChange("toDate")}
            disabled={loading}
            format="dd/MM/yyyy"
            minDate={dateFilters.fromDate}
            maxDate={new Date()}
            slotProps={{
              textField: {
                size: "small",
                sx: { minWidth: { xs: "140px", sm: "160px" } },
              },
            }}
          />

          {(dateFilters.fromDate || dateFilters.toDate) && (
            <Button
              size="small"
              onClick={handleClearDateFilters}
              startIcon={<ClearIcon />}
              sx={{ ml: 1 }}
            >
              Clear Dates
            </Button>
          )}

          {/* Date Range Summary */}
          {(dateFilters.fromDate || dateFilters.toDate) && (
            <Box sx={{ ml: "auto" }}>
              <Chip
                label={
                  dateFilters.fromDate && dateFilters.toDate
                    ? `${formatDate(dateFilters.fromDate)} - ${formatDate(
                        dateFilters.toDate
                      )}`
                    : dateFilters.fromDate
                    ? `From ${formatDate(dateFilters.fromDate)}`
                    : `Until ${formatDate(dateFilters.toDate)}`
                }
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          )}
        </Paper>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
          {error}
        </Alert>
      )}

      {/* Empty State */}
      {!loading && filteredAndSortedSales.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <ReceiptIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {customerIdFromUrl
                ? `No sales found for ${filteredCustomerName}`
                : "No sales found"}
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              {searchValue ||
              localFilters.paymentStatus ||
              localFilters.deliveryStatus ||
              localFilters.originalPaymentCategory ||
              dateFilters.fromDate ||
              dateFilters.toDate
                ? "Try adjusting your search criteria or filters."
                : customerIdFromUrl
                ? `${filteredCustomerName} doesn't have any sales yet. Create their first invoice to get started.`
                : "Start by creating your first invoice to track sales."}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() =>
                navigate(
                  customerIdFromUrl
                    ? `/sales/create?customer=${customerIdFromUrl}`
                    : "/sales/create"
                )
              }
            >
              Create Invoice
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sales Grid */}
      {filteredAndSortedSales.length > 0 && (
        <>
          {/* Summary for filtered customer */}
          {customerIdFromUrl && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sales Summary for {filteredCustomerName}
                  {(dateFilters.fromDate || dateFilters.toDate) && (
                    <Chip
                      label={
                        dateFilters.fromDate && dateFilters.toDate
                          ? `${formatDate(dateFilters.fromDate)} - ${formatDate(
                              dateFilters.toDate
                            )}`
                          : dateFilters.fromDate
                          ? `From ${formatDate(dateFilters.fromDate)}`
                          : `Until ${formatDate(dateFilters.toDate)}`
                      }
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ ml: 2 }}
                    />
                  )}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total Invoices
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {filteredAndSortedSales.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(
                        filteredAndSortedSales.reduce(
                          (sum, sale) =>
                            sum + (sale.grandTotal || sale.totalAmount || 0),
                          0
                        )
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Amount Paid
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatCurrency(
                        filteredAndSortedSales.reduce(
                          (sum, sale) => sum + getActualAmountPaid(sale),
                          0
                        )
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Outstanding
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {formatCurrency(
                        filteredAndSortedSales.reduce(
                          (sum, sale) => sum + getRemainingBalance(sale),
                          0
                        )
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          <Grid container spacing={3}>
            {paginatedSales.map((sale) => {
              const actualPaid = getActualAmountPaid(sale);
              const remainingBalance = getRemainingBalance(sale);
              const isPartialPayment =
                sale.paymentStatus === PAYMENT_STATUS.PENDING ||
                sale.paymentStatus === PAYMENT_STATUS.FINANCE ||
                sale.paymentStatus === PAYMENT_STATUS.BANK_TRANSFER;

              return (
                <Grid item xs={12} sm={6} lg={4} key={sale.id}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.2s ease-in-out",
                      height: 350,
                      display: "flex",
                      flexDirection: "column",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => navigate(`/sales/view/${sale.id}`)}
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
                            <ReceiptIcon />
                          </Avatar>
                          <Box minWidth={0} flex={1}>
                            <Typography
                              variant="h6"
                              component="h3"
                              noWrap
                              sx={{ fontSize: "1.1rem", fontWeight: 700 }}
                            >
                              {sale.customerName}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                              sx={{ fontSize: "0.85rem" }}
                            >
                              {formatDate(sale.saleDate || sale.createdAt)}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                              sx={{ fontSize: "0.85rem" }}
                            >
                              {sale.invoiceNumber}
                            </Typography>
                          </Box>
                        </Box>

                        <IconButton
                          size="small"
                          onClick={(e) => handleActionMenuOpen(e, sale)}
                          sx={{ mt: -0.5 }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>

                      {/* Customer Info - Fixed height section */}
                      <Box mb={2} sx={{ flex: 1, minHeight: 160 }}>
                        {sale.customerPhone && (
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={1}
                          >
                            <PhoneIcon
                              sx={{ fontSize: 16, color: "text.secondary" }}
                            />
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{ fontSize: "0.875rem" }}
                            >
                              {sale.customerPhone}
                            </Typography>
                          </Box>
                        )}

                        {/* Total Amount */}
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <MoneyIcon
                            sx={{ fontSize: 16, color: "text.secondary" }}
                          />
                          <Typography
                            variant="h6"
                            color="primary.main"
                            fontWeight="bold"
                            sx={{ fontSize: "1.1rem" }}
                          >
                            {formatCurrency(
                              sale.grandTotal || sale.totalAmount
                            )}
                          </Typography>
                        </Box>

                        {/* NEW - Show original payment category */}
                        {sale.originalPaymentCategory && (
                          <Box mb={1}>
                            <Chip
                              label={
                                PAYMENT_CATEGORY_DISPLAY[
                                  sale.originalPaymentCategory
                                ] || sale.originalPaymentCategory
                              }
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: "0.7rem", height: 20 }}
                            />
                          </Box>
                        )}

                        {/* Payment Progress for Partial Payments */}
                        {isPartialPayment && (
                          <Box mt={1}>
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mb={0.5}
                            >
                              <TrendingUpIcon
                                sx={{ fontSize: 14, color: "success.main" }}
                              />
                              <Typography
                                variant="caption"
                                color="success.main"
                              >
                                Paid: {formatCurrency(actualPaid)}
                              </Typography>
                            </Box>
                            {remainingBalance > 0 && (
                              <Box display="flex" alignItems="center" gap={1}>
                                <TrendingDownIcon
                                  sx={{ fontSize: 14, color: "warning.main" }}
                                />
                                <Typography
                                  variant="caption"
                                  color="warning.main"
                                >
                                  Balance: {formatCurrency(remainingBalance)}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        )}

                        {/* NEW - Show if fully paid flag */}
                        {sale.fullyPaid &&
                          sale.paymentStatus !== PAYMENT_STATUS.PAID && (
                            <Box mt={1}>
                              <Chip
                                label="Fully Paid"
                                size="small"
                                color="success"
                                sx={{ fontSize: "0.7rem", height: 20 }}
                              />
                            </Box>
                          )}
                      </Box>

                      {/* Status Chips and Additional Info */}
                      <Box mt="auto">
                        {/* Status Chips */}
                        <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                          <Tooltip
                            title={
                              PAYMENT_STATUS_DISPLAY[sale.paymentStatus] ||
                              sale.paymentStatus
                            }
                          >
                            <Chip
                              label={sale.paymentStatus?.toUpperCase()}
                              size="small"
                              color={getPaymentStatusColor(sale.paymentStatus)}
                              icon={getPaymentStatusIcon(sale.paymentStatus)}
                              sx={{
                                textTransform: "capitalize",
                                fontSize: "0.75rem",
                                height: 24,
                              }}
                            />
                          </Tooltip>
                          <Chip
                            label={sale.deliveryStatus?.toUpperCase()}
                            size="small"
                            color={getDeliveryStatusColor(sale.deliveryStatus)}
                            icon={<DeliveryIcon />}
                            sx={{
                              textTransform: "capitalize",
                              fontSize: "0.75rem",
                              height: 24,
                            }}
                          />
                        </Box>

                        {/* Additional Info */}
                        <Box>
                          {sale.paymentStatus === PAYMENT_STATUS.EMI && (
                            <Box
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mb={1}
                            >
                              <ScheduleIcon
                                sx={{ fontSize: 16, color: "warning.main" }}
                              />
                              <Typography
                                variant="caption"
                                color="warning.main"
                              >
                                EMI Payment Plan
                              </Typography>
                            </Box>
                          )}

                          {sale.paymentStatus === PAYMENT_STATUS.FINANCE &&
                            sale.paymentDetails?.financeCompany && (
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                mb={1}
                              >
                                <BankIcon
                                  sx={{ fontSize: 16, color: "info.main" }}
                                />
                                <Typography variant="caption" color="info.main">
                                  Finance: {sale.paymentDetails.financeCompany}
                                </Typography>
                              </Box>
                            )}

                          {sale.paymentStatus ===
                            PAYMENT_STATUS.BANK_TRANSFER &&
                            sale.paymentDetails?.bankName && (
                              <Box
                                display="flex"
                                alignItems="center"
                                gap={1}
                                mb={1}
                              >
                                <CardIcon
                                  sx={{ fontSize: 16, color: "primary.main" }}
                                />
                                <Typography
                                  variant="caption"
                                  color="primary.main"
                                >
                                  Bank: {sale.paymentDetails.bankName}
                                </Typography>
                              </Box>
                            )}

                          {sale.deliveryStatus === DELIVERY_STATUS.SCHEDULED &&
                            sale.scheduledDeliveryDate && (
                              <Box display="flex" alignItems="center" gap={1}>
                                <CalendarIcon
                                  sx={{ fontSize: 16, color: "info.main" }}
                                />
                                <Typography variant="caption" color="info.main">
                                  Delivery:{" "}
                                  {formatDate(sale.scheduledDeliveryDate)}
                                </Typography>
                              </Box>
                            )}
                        </Box>
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
              itemName={
                customerIdFromUrl
                  ? `invoices for ${filteredCustomerName}`
                  : "invoices"
              }
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
            navigate(`/sales/view/${selectedInvoice?.id}`);
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
            navigate(`/sales/edit/${selectedInvoice?.id}`);
            handleActionMenuClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Invoice</ListItemText>
        </MenuItem>

        {/* Record Payment option */}
        {canRecordPayment(selectedInvoice) && (
          <MenuItem onClick={handleRecordPayment}>
            <ListItemIcon>
              <RecordPaymentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Record Payment</ListItemText>
          </MenuItem>
        )}

        {canDelete() && (
          <MenuItem onClick={handleDeleteClick}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete Invoice</ListItemText>
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
            Are you sure you want to delete invoice "
            {selectedInvoice?.invoiceNumber}"? This action cannot be undone and
            will permanently remove this sales record.
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

      {/* Payment Recording Dialog with Date Picker */}
      <RecordPaymentDialog
        open={Boolean(selectedInvoiceForPayment)}
        onClose={() => setSelectedInvoiceForPayment(null)}
        invoice={selectedInvoiceForPayment}
        onSuccess={async () => {
          await loadSales();
          setSelectedInvoiceForPayment(null);
        }}
      />
    </Box>
  );
};

export default SalesHistory;
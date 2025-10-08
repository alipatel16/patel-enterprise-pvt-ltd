import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  AppBar,
  Toolbar,
  Drawer,
  ListItemIcon,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Fab,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  alpha,
} from "@mui/material";
import {
  Menu as MenuIcon,
  People as PeopleIcon,
  Badge as BadgeIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon,
  Add as AddIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  LocalShipping as DeliveryIcon,
  ChecklistRtl as ChecklistIcon,
  AssignmentTurnedIn as TaskIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  ShoppingCart as ShoppingCartIcon,
} from "@mui/icons-material";

import { useAuth } from "../../contexts/AuthContext/AuthContext";
import { useUserType } from "../../contexts/UserTypeContext/UserTypeContext";
import { USER_ROLES } from "../../utils/constants/appConstants";
import LoadingSpinner from "../../components/common/UI/LoadingSpinner";
import checklistService from "../../services/checklistService";
import customerService from "../../services/api/customerService";
import employeeService from "../../services/api/employeeService";
import salesService from "../../services/api/salesService";
import DrawerContent from "../../components/common/Navigation/DrawerContent";
import { formatCurrency, formatDate } from "../../utils/helpers/formatHelpers";

const DRAWER_WIDTH = 240;

const DashboardPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { user, signOut, canManageEmployees } = useAuth();
  const { getDisplayName, getAppTitle, getThemeColors, userType } =
    useUserType();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [dashboardData, setDashboardData] = useState({
    // Customer Stats
    customers: {
      total: 0,
      wholesalers: 0,
      retailers: 0,
      individuals: 0,
      firms: 0,
      schools: 0,
      trend: 0,
    },
    // Employee Stats
    employees: {
      total: 0,
      active: 0,
      inactive: 0,
      byRole: {},
      byDepartment: {},
    },
    // Sales Stats
    sales: {
      totalSales: 0,
      totalAmount: 0,
      totalAmountPaid: 0,
      todaysSales: 0,
      todaysAmount: 0,
      todaysAmountPaid: 0,
      pendingPayments: 0,
      pendingDeliveries: 0,
      paidInvoices: 0,
      outstandingAmount: 0,
      statsByCategory: {},
      monthlyGrowth: 0,
    },
    // Recent Activity
    recentSales: [],
    // Checklist Stats
    checklists: {
      todayTotal: 0,
      todayPending: 0,
      todayCompleted: 0,
    },
  });

  const [checklistGenerationInfo, setChecklistGenerationInfo] = useState(null);

  const themeColors = getThemeColors();

  // Load dashboard data on component mount
  useEffect(() => {
    // Only load data when userType is available
    if (userType && user) {
      loadDashboardData();
    }
  }, [userType, user]);

  // ENHANCED: Load all dashboard data with real analytics
  const loadDashboardData = async () => {
    // Guard: Don't load if userType or user is not available yet
    if (!userType || !user) {
      console.log("Waiting for userType and user to be available...");
      return;
    }

    try {
      setLoading(true);
      console.log("Loading comprehensive dashboard analytics...");

      // Load data in parallel for better performance
      const promises = [];

      // Always load customer and sales data
      promises.push(customerService.getCustomerStats(userType));
      promises.push(salesService.getSalesStats(userType));
      promises.push(salesService.getSales(userType, {})); // Get recent sales

      // Load employee data if admin
      if (canManageEmployees()) {
        promises.push(employeeService.getEmployeeStats(userType));
        promises.push(checklistService.getDashboardStats(userType, user));
        promises.push(checklistService.getGenerationStatus(userType));
      } else {
        promises.push(Promise.resolve(null)); // Placeholder for employee stats
        promises.push(checklistService.getDashboardStats(userType, user));
        promises.push(Promise.resolve(null)); // Placeholder for generation status
      }

      const [
        customerStats,
        salesStats,
        allSales,
        employeeStats,
        checklistStats,
        generationStatus,
      ] = await Promise.all(promises);

      // Calculate trends and additional metrics
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const recentSales = allSales
        .filter((sale) => sale.saleDate)
        .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
        .slice(0, 10);

      // Calculate monthly growth (simple approximation)
      const monthlyGrowth = salesStats.totalAmount > 0 
        ? ((salesStats.todaysAmount / 30) / (salesStats.totalAmount / 30)) * 100 - 100
        : 0;

      // Set comprehensive dashboard data
      setDashboardData({
        customers: {
          ...customerStats,
          trend: 0, // Can be calculated if you have historical data
        },
        employees: employeeStats || {
          total: 0,
          active: 0,
          inactive: 0,
          byRole: {},
          byDepartment: {},
        },
        sales: {
          ...salesStats,
          monthlyGrowth: monthlyGrowth.toFixed(1),
        },
        recentSales,
        checklists: checklistStats || {
          todayTotal: 0,
          todayPending: 0,
          todayCompleted: 0,
        },
      });

      setChecklistGenerationInfo(generationStatus);

      console.log("Dashboard data loaded successfully:", {
        customerStats,
        salesStats,
        employeeStats,
        checklistStats,
        recentSalesCount: recentSales.length,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Failed to load dashboard data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  // Manual generation handler for admins
  const handleManualGeneration = async () => {
    try {
      setRefreshing(true);
      setSuccess("");
      setError("");

      console.log("Admin triggered manual checklist generation...");

      const result = await checklistService.manualGenerateAllAssignments(
        userType,
        user
      );

      console.log("Manual generation result:", result);

      // Reload dashboard data
      await loadDashboardData();

      setSuccess(
        `Manual generation completed! Generated ${result.totalGenerated} assignments for checked-in employees`
      );

      setTimeout(() => setSuccess(""), 5000);
    } catch (error) {
      console.error("Error in manual generation:", error);
      setError(`Manual generation failed: ${error.message}`);
      setTimeout(() => setError(""), 5000);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Handle profile menu
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // ENHANCED: Stats cards with real data
  const getStatsCards = () => {
    const data = dashboardData;
    
    const baseCards = [
      {
        title: "Total Customers",
        value: data.customers.total,
        subtitle: `${data.customers.wholesalers} Wholesalers • ${data.customers.retailers} Retailers`,
        icon: PeopleIcon,
        color: themeColors.primary,
        trend: data.customers.trend,
        action: () => navigate("/customers"),
      },
      {
        title: "Monthly Revenue",
        value: formatCurrency(data.sales.totalAmount),
        subtitle: `${formatCurrency(data.sales.totalAmountPaid)} collected`,
        icon: MoneyIcon,
        color: "#4caf50",
        trend: parseFloat(data.sales.monthlyGrowth),
        action: () => navigate("/sales/history"),
      },
      {
        title: "Today's Sales",
        value: formatCurrency(data.sales.todaysAmount),
        subtitle: `${data.sales.todaysSales} invoices`,
        icon: ShoppingCartIcon,
        color: "#2196f3",
        badge: data.sales.todaysSales,
        action: () => navigate("/sales/create"),
      },
      {
        title: "Pending Payments",
        value: formatCurrency(data.sales.outstandingAmount),
        subtitle: `${data.sales.pendingPayments} invoices pending`,
        icon: WarningIcon,
        color: "#ff9800",
        badge: data.sales.pendingPayments > 0,
        urgent: data.sales.pendingPayments > 0,
        action: () => navigate("/sales/history?filter=pending"),
      },
    ];

    // Add employees card for admin users
    if (canManageEmployees()) {
      baseCards.splice(1, 0, {
        title: "Total Employees",
        value: data.employees.total,
        subtitle: `${data.employees.active} active`,
        icon: BadgeIcon,
        color: themeColors.secondary,
        action: () => navigate("/employees"),
      });

      // Enhanced admin checklist stats
      baseCards.push({
        title: "Today's Checklists",
        value: `${data.checklists.todayCompleted}/${data.checklists.todayTotal}`,
        subtitle:
          data.checklists.todayTotal === 0
            ? "Generated on employee check-in"
            : `${data.checklists.todayPending} pending tasks`,
        icon: ChecklistIcon,
        color: "#9c27b0",
        progress: data.checklists.todayTotal > 0 
          ? (data.checklists.todayCompleted / data.checklists.todayTotal) * 100 
          : 0,
        action: () => navigate("/checklists"),
      });

      baseCards.push({
        title: "Pending Deliveries",
        value: data.sales.pendingDeliveries,
        subtitle: "Orders awaiting delivery",
        icon: DeliveryIcon,
        color: "#e91e63",
        badge: data.sales.pendingDeliveries > 0,
        action: () => navigate("/sales/history?filter=pending-delivery"),
      });
    } else {
      // Enhanced employee checklist stats
      baseCards.push({
        title: "My Checklists",
        value: `${data.checklists.todayCompleted}/${data.checklists.todayTotal}`,
        subtitle:
          data.checklists.todayTotal === 0
            ? "Check in to get your assignments"
            : `${data.checklists.todayPending} pending tasks`,
        icon: TaskIcon,
        color: "#9c27b0",
        progress: data.checklists.todayTotal > 0 
          ? (data.checklists.todayCompleted / data.checklists.todayTotal) * 100 
          : 0,
        action: () => navigate("/my-checklists"),
      });
    }

    return baseCards;
  };

  // Show loading spinner
  if (loading) {
    return <LoadingSpinner />;
  }

  const statsCards = getStatsCards();

  return (
    <Box sx={{ display: "flex" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {getAppTitle()} - Dashboard
          </Typography>

          <Box display="flex" alignItems="center" gap={1}>
            <IconButton
              color="inherit"
              onClick={() => navigate("/notifications")}
            >
              <Badge
                badgeContent={
                  dashboardData.sales.pendingPayments +
                  dashboardData.sales.pendingDeliveries
                }
                color="error"
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton color="inherit" onClick={handleProfileMenuOpen}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: "secondary.main",
                  fontSize: "0.875rem",
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: DRAWER_WIDTH,
            },
          }}
        >
          <DrawerContent
            onItemClick={() => {
              if (isMobile) setMobileOpen(false);
            }}
          />
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
        }}
      >
        <Container maxWidth="xl">
          {/* Error/Success Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              severity="success"
              sx={{ mb: 3 }}
              onClose={() => setSuccess("")}
            >
              {success}
            </Alert>
          )}

          {/* Welcome Section */}
          <Box mb={4}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
                  }}
                >
                  Welcome back, {user?.name}! 👋
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                >
                  Here's what's happening in your {getDisplayName().toLowerCase()}{" "}
                  showroom today.
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadDashboardData}
                  disabled={refreshing}
                  size={isMobile ? 'small' : 'medium'}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/sales/create')}
                  size={isMobile ? 'small' : 'medium'}
                >
                  New Invoice
                </Button>
              </Box>
            </Box>
            
            {refreshing && <LinearProgress sx={{ mb: 2 }} />}
          </Box>

          {/* Check-in Based System Info (Admin Only) */}
          {canManageEmployees() && (
            <Box mb={4}>
              <Card
                sx={{
                  bgcolor: "background.paper",
                  border: 1,
                  borderColor: "primary.main",
                }}
              >
                <CardContent>
                  <Box
                    display="flex"
                    flexDirection={{ xs: "column", md: "row" }}
                    justifyContent={{ xs: "flex-start", md: "space-between" }}
                    alignItems={{ xs: "stretch", md: "center" }}
                    gap={{ xs: 2, md: 0 }}
                  >
                    <Box flex={1} sx={{ minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontSize: { xs: "1.1rem", sm: "1.25rem" },
                        }}
                      >
                        Check-in Based Checklist System
                      </Typography>

                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        mb={2}
                      >
                        <CheckCircleIcon
                          color="success"
                          sx={{ fontSize: "1.5rem" }}
                        />
                        <Typography
                          variant="body2"
                          color="success.main"
                        >
                          Assignments generated automatically on employee check-in
                        </Typography>
                      </Box>

                      {checklistGenerationInfo && checklistGenerationInfo.todayStats && (
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Today's Status:{" "}
                            {checklistGenerationInfo.todayStats.todayCompleted}/
                            {checklistGenerationInfo.todayStats.todayTotal} assignments completed
                          </Typography>

                          {checklistGenerationInfo.todayStats.todayTotal === 0 && (
                            <Typography
                              variant="caption"
                              color="info.main"
                              sx={{ display: "block", mt: 1 }}
                            >
                              ℹ️ No assignments yet - employees will get assignments when they check in
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Box>

                    <Box
                      display="flex"
                      gap={2}
                    >
                      <Button
                        variant="outlined"
                        startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
                        onClick={loadDashboardData}
                        disabled={refreshing}
                        size="small"
                      >
                        Refresh
                      </Button>

                      <Button
                        variant="contained"
                        startIcon={refreshing ? <CircularProgress size={16} /> : <AddIcon />}
                        onClick={handleManualGeneration}
                        disabled={refreshing}
                        color="primary"
                        size="small"
                      >
                        {refreshing ? "Generating..." : "Generate for Checked-in"}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Stats Cards */}
          <Grid container spacing={3} mb={4}>
            {statsCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Grid item xs={12} sm={6} lg={4} xl={3} key={index}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      height: '100%',
                      border: card.urgent ? `2px solid ${card.color}` : 'none',
                      background: card.urgent 
                        ? `linear-gradient(135deg, ${alpha(card.color, 0.05)}, ${alpha(card.color, 0.02)})`
                        : 'none',
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 6,
                      },
                    }}
                    onClick={card.action}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: alpha(card.color, 0.1),
                          }}
                        >
                          <Icon sx={{ color: card.color, fontSize: 32 }} />
                        </Box>
                        
                        {card.badge && (
                          <Chip
                            label="Action Required"
                            size="small"
                            color="error"
                            sx={{ fontSize: '0.625rem' }}
                          />
                        )}
                      </Box>

                      <Typography
                        variant="h4"
                        component="h2"
                        fontWeight="bold"
                        color={card.urgent ? "error.main" : "inherit"}
                        sx={{ mb: 0.5 }}
                      >
                        {card.value}
                      </Typography>

                      <Typography
                        color="textSecondary"
                        variant="body2"
                        sx={{ mb: 1, fontWeight: 500 }}
                      >
                        {card.title}
                      </Typography>

                      {card.subtitle && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          {card.subtitle}
                        </Typography>
                      )}

                      {card.trend !== undefined && card.trend !== 0 && (
                        <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                          {card.trend > 0 ? (
                            <TrendingUpIcon fontSize="small" color="success" />
                          ) : (
                            <TrendingDownIcon fontSize="small" color="error" />
                          )}
                          <Typography
                            variant="caption"
                            color={card.trend > 0 ? "success.main" : "error.main"}
                            fontWeight={600}
                          >
                            {Math.abs(card.trend).toFixed(1)}%
                          </Typography>
                        </Box>
                      )}

                      {card.progress !== undefined && (
                        <Box mt={2}>
                          <LinearProgress 
                            variant="determinate" 
                            value={card.progress}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: alpha(card.color, 0.1),
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: card.color,
                              }
                            }}
                          />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Recent Sales & Quick Actions */}
          <Grid container spacing={3}>
            {/* Recent Sales */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight={600}>
                      Recent Sales
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => navigate('/sales/history')}
                    >
                      View All
                    </Button>
                  </Box>
                  
                  {dashboardData.recentSales.length > 0 ? (
                    <Box>
                      {dashboardData.recentSales.slice(0, 5).map((sale, index) => (
                        <Box
                          key={sale.id || index}
                          sx={{
                            p: 2,
                            mb: 1,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              backgroundColor: alpha(themeColors.primary, 0.04),
                              borderColor: themeColors.primary,
                            }
                          }}
                          onClick={() => navigate(`/sales/view/${sale.id}`)}
                        >
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Box flex={1}>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {sale.customerName || 'Unknown Customer'}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Invoice #{sale.invoiceNumber} • {formatDate(sale.saleDate || sale.createdAt)}
                              </Typography>
                            </Box>
                            <Box textAlign="right">
                              <Typography variant="subtitle1" fontWeight={600} color="success.main">
                                {formatCurrency(sale.grandTotal || sale.totalAmount || 0)}
                              </Typography>
                              <Chip
                                label={sale.paymentStatus || 'pending'}
                                size="small"
                                color={sale.paymentStatus === 'paid' ? 'success' : 'warning'}
                                sx={{ fontSize: '0.625rem', height: 20 }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        py: 6,
                        color: 'text.secondary'
                      }}
                    >
                      <ReceiptIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="body1" gutterBottom>
                        No recent sales
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        Create your first invoice to get started
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/sales/create')}
                      >
                        Create Invoice
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Quick Actions
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate("/customers/add")}
                        sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                      >
                        Add Customer
                      </Button>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<ReceiptIcon />}
                        onClick={() => navigate("/sales/create")}
                        sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                      >
                        Create Invoice
                      </Button>
                    </Grid>

                    {canManageEmployees() && (
                      <>
                        <Grid item xs={12}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<BadgeIcon />}
                            onClick={() => navigate("/employees/add")}
                            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                          >
                            Add Employee
                          </Button>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<ChecklistIcon />}
                            onClick={() => navigate("/checklists/create")}
                            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                          >
                            Create New Checklist
                          </Button>
                        </Grid>

                        <Grid item xs={12}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleManualGeneration}
                            disabled={refreshing}
                            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                            color="primary"
                          >
                            {refreshing ? "Generating..." : "Generate for Checked-in"}
                          </Button>
                        </Grid>

                        <Grid item xs={12}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<AssessmentIcon />}
                            onClick={() => navigate("/analytics/employee-sales")}
                            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                          >
                            Employee Analytics
                          </Button>
                        </Grid>

                        <Grid item xs={12}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<AssessmentIcon />}
                            onClick={() => navigate("/reports/employees")}
                            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                          >
                            Employee Reports
                          </Button>
                        </Grid>
                      </>
                    )}

                    {user?.role === USER_ROLES.EMPLOYEE && (
                      <>
                        <Grid item xs={12}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<ScheduleIcon />}
                            onClick={() => navigate("/attendance")}
                            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                          >
                            Check In (Get Checklists)
                          </Button>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<TaskIcon />}
                            onClick={() => navigate("/my-checklists")}
                            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                          >
                            My Checklists
                          </Button>
                        </Grid>
                      </>
                    )}

                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<HistoryIcon />}
                        onClick={() => navigate("/sales/history")}
                        sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                      >
                        View Sales
                      </Button>
                    </Grid>
                  </Grid>

                  {/* Business Summary */}
                  <Box mt={3} p={2} sx={{ bgcolor: alpha(themeColors.primary, 0.05), borderRadius: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      Business Summary
                    </Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" color="textSecondary">
                        Total Customers:
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {dashboardData.customers.total}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" color="textSecondary">
                        Monthly Sales:
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {dashboardData.sales.totalSales}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="caption" color="textSecondary">
                        Revenue Collected:
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="success.main">
                        {formatCurrency(dashboardData.sales.totalAmountPaid)}
                      </Typography>
                    </Box>
                    {canManageEmployees() && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="caption" color="textSecondary">
                          Active Employees:
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {dashboardData.employees.active}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
          }}
          onClick={() => navigate("/sales/create")}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

export default DashboardPage;
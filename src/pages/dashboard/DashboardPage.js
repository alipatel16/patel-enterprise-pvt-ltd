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
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  AccessTime as AttendanceIcon,
  Assessment as ReportsIcon,
  EmojiEvents as TrophyIcon,
  ChecklistRtl as ChecklistIcon,
  AssignmentTurnedIn as TaskIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

import { useAuth } from "../../contexts/AuthContext/AuthContext";
import { useUserType } from "../../contexts/UserTypeContext/UserTypeContext";
import { USER_ROLES } from "../../utils/constants/appConstants";
import LoadingSpinner from "../../components/common/UI/LoadingSpinner";
import checklistService from "../../services/checklistService";
import DrawerContent from "../../components/common/Navigation/DrawerContent";

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

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalEmployees: 0,
    totalSales: 0,
    pendingEMIs: 0,
    pendingDeliveries: 0,
    todaySales: 0,
    todayChecklists: 0,
    pendingChecklists: 0,
    completedChecklists: 0,
  });

  const [checklistGenerationInfo, setChecklistGenerationInfo] = useState(null);

  const themeColors = getThemeColors();

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();
  }, [userType, user]);

  // REWRITTEN: Simplified dashboard loading - no more complex generation
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log("Loading dashboard with check-in based checklist system...");

      // SIMPLIFIED: Just get current stats - no generation logic
      const [checklistStats, generationStatus] = await Promise.all([
        checklistService.getDashboardStats(userType, user),
        canManageEmployees()
          ? checklistService.getGenerationStatus(userType)
          : null,
      ]);

      setChecklistGenerationInfo(generationStatus);

      console.log("Dashboard loaded:", {
        checklistStats,
        generationMethod: "check_in_based",
      });

      // TODO: Load other dashboard stats (customers, employees, sales)
      // For now, using placeholder values
      setStats({
        totalCustomers: 0, // TODO: Load from customer service
        totalEmployees: 0, // TODO: Load from employee service
        totalSales: 0, // TODO: Load from sales service
        pendingEMIs: 0, // TODO: Load from sales service
        pendingDeliveries: 0, // TODO: Load from sales service
        todaySales: 0, // TODO: Load from sales service
        // Real checklist stats (no generation needed)
        todayChecklists: checklistStats.todayTotal,
        pendingChecklists: checklistStats.todayPending,
        completedChecklists: checklistStats.todayCompleted,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setError("Failed to load dashboard data. Please refresh the page.");
      setStats({
        totalCustomers: 0,
        totalEmployees: 0,
        totalSales: 0,
        pendingEMIs: 0,
        pendingDeliveries: 0,
        todaySales: 0,
        todayChecklists: 0,
        pendingChecklists: 0,
        completedChecklists: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // NEW: Manual generation handler for admins
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

      // Reload dashboard data to show updated stats
      await loadDashboardData();

      setSuccess(
        `Manual generation completed! Generated ${result.totalGenerated} assignments for checked-in employees`
      );

      // Clear success message after 5 seconds
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

  // UPDATED: Stats cards with new checklist messaging
  const getStatsCards = () => {
    const baseCards = [
      {
        title: "Total Customers",
        value: stats.totalCustomers,
        icon: PeopleIcon,
        color: themeColors.primary,
        action: () => navigate("/customers"),
      },
      {
        title: "Total Sales",
        value: `₹${stats.totalSales.toLocaleString()}`,
        icon: TrendingUpIcon,
        color: "#4caf50",
        action: () => navigate("/sales/history"),
      },
      {
        title: "Today's Sales",
        value: `₹${stats.todaySales.toLocaleString()}`,
        icon: MoneyIcon,
        color: "#ff9800",
        action: () => navigate("/sales/create"),
      },
      {
        title: "Pending EMIs",
        value: stats.pendingEMIs,
        icon: ScheduleIcon,
        color: "#f44336",
        badge: stats.pendingEMIs > 0,
        action: () => navigate("/sales/history?filter=pending-emi"),
      },
    ];

    // Add employees card for admin users
    if (canManageEmployees()) {
      baseCards.splice(1, 0, {
        title: "Total Employees",
        value: stats.totalEmployees,
        icon: BadgeIcon,
        color: themeColors.secondary,
        action: () => navigate("/employees"),
      });

      // Enhanced admin checklist stats
      baseCards.push({
        title: "Today's Checklists",
        value: `${stats.completedChecklists}/${stats.todayChecklists}`,
        icon: ChecklistIcon,
        color: "#9c27b0",
        subtitle:
          stats.todayChecklists === 0
            ? "Generated on employee check-in"
            : `${stats.pendingChecklists} pending tasks`,
        action: () => navigate("/checklists"),
      });
    } else {
      // Enhanced employee checklist stats
      baseCards.push({
        title: "My Checklists",
        value: `${stats.completedChecklists}/${stats.todayChecklists}`,
        icon: TaskIcon,
        color: "#9c27b0",
        subtitle:
          stats.todayChecklists === 0
            ? "Check in to get your assignments"
            : `${stats.pendingChecklists} pending tasks`,
        action: () => navigate("/my-checklists"),
      });
    }

    return baseCards;
  };

  // Show loading spinner while data is loading
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
                  stats.pendingEMIs +
                  stats.pendingDeliveries +
                  stats.pendingChecklists
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
            keepMounted: true, // Better open performance on mobile.
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
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
              }}
            >
              Welcome back, {user?.name}!
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

          {/* NEW: Check-in Based System Info Card (Admin Only) */}
          {/* NEW: Check-in Based System Info Card (Admin Only) - Mobile Responsive */}
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
                  {/* Main content area - responsive layout */}
                  <Box
                    display="flex"
                    flexDirection={{ xs: "column", md: "row" }}
                    justifyContent={{ xs: "flex-start", md: "space-between" }}
                    alignItems={{ xs: "stretch", md: "center" }}
                    gap={{ xs: 2, md: 0 }}
                  >
                    {/* Content section */}
                    <Box flex={1} sx={{ minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{
                          fontSize: { xs: "1.1rem", sm: "1.25rem" },
                          lineHeight: { xs: 1.3, sm: 1.4 },
                        }}
                      >
                        Check-in Based Checklist System
                      </Typography>

                      <Box
                        display="flex"
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        flexDirection={{ xs: "column", sm: "row" }}
                        gap={1}
                        mb={2}
                      >
                        <Box display="flex" alignItems="center" gap={1}>
                          <CheckCircleIcon
                            color="success"
                            sx={{ fontSize: { xs: "1.2rem", sm: "1.5rem" } }}
                          />
                          <Typography
                            variant="body2"
                            color="success.main"
                            sx={{
                              fontSize: { xs: "0.8rem", sm: "0.875rem" },
                              lineHeight: { xs: 1.3, sm: 1.4 },
                            }}
                          >
                            Assignments generated automatically on employee
                            check-in
                          </Typography>
                        </Box>
                      </Box>

                      {checklistGenerationInfo &&
                        checklistGenerationInfo.todayStats && (
                          <Box>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{
                                fontSize: { xs: "0.8rem", sm: "0.875rem" },
                                mb: { xs: 1, sm: 0 },
                              }}
                            >
                              Today's Status:{" "}
                              {
                                checklistGenerationInfo.todayStats
                                  .todayCompleted
                              }
                              /{checklistGenerationInfo.todayStats.todayTotal}{" "}
                              assignments completed
                            </Typography>

                            {checklistGenerationInfo.todayStats.todayTotal ===
                              0 && (
                              <Typography
                                variant="caption"
                                color="info.main"
                                sx={{
                                  display: "block",
                                  mt: 1,
                                  fontSize: { xs: "0.75rem", sm: "0.75rem" },
                                  lineHeight: { xs: 1.3, sm: 1.4 },
                                }}
                              >
                                ℹ️ No assignments yet - employees will get
                                assignments when they check in
                              </Typography>
                            )}
                          </Box>
                        )}
                    </Box>

                    {/* Buttons section - responsive */}
                    <Box
                      display="flex"
                      flexDirection={{ xs: "column", sm: "row" }}
                      gap={{ xs: 1, sm: 2 }}
                      width={{ xs: "100%", md: "auto" }}
                      sx={{ minWidth: { xs: 0, md: "max-content" } }}
                    >
                      <Button
                        variant="outlined"
                        startIcon={
                          refreshing ? (
                            <CircularProgress size={16} />
                          ) : (
                            <RefreshIcon />
                          )
                        }
                        onClick={loadDashboardData}
                        disabled={refreshing}
                        size="small"
                        sx={{
                          minWidth: { xs: "auto", sm: "max-content" },
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          px: { xs: 2, sm: 2 },
                          py: { xs: 0.5, sm: 0.5 },
                        }}
                      >
                        Refresh
                      </Button>

                      <Button
                        variant="contained"
                        startIcon={
                          refreshing ? (
                            <CircularProgress size={16} />
                          ) : (
                            <AddIcon />
                          )
                        }
                        onClick={handleManualGeneration}
                        disabled={refreshing}
                        color="primary"
                        size="small"
                        sx={{
                          minWidth: { xs: "auto", sm: "max-content" },
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          px: { xs: 2, sm: 2 },
                          py: { xs: 0.5, sm: 0.5 },
                          whiteSpace: "nowrap",
                        }}
                      >
                        {refreshing
                          ? "Generating..."
                          : "Generate for Checked-in"}
                      </Button>
                    </Box>
                  </Box>

                  {/* How it works info - responsive */}
                  <Box
                    mt={{ xs: 2, sm: 2 }}
                    sx={{
                      bgcolor: "grey.50",
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      gutterBottom
                      sx={{
                        fontSize: { xs: "0.8rem", sm: "0.875rem" },
                        fontWeight: 600,
                      }}
                    >
                      <strong>How Check-in Based System Works:</strong>
                    </Typography>
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      component="div"
                      sx={{
                        fontSize: { xs: "0.7rem", sm: "0.75rem" },
                        lineHeight: { xs: 1.4, sm: 1.5 },
                        "& br": { display: { xs: "none", sm: "block" } },
                      }}
                    >
                      <Box
                        component="span"
                        sx={{ display: "block", mb: { xs: 0.5, sm: 0 } }}
                      >
                        • <strong>Employee checks in:</strong> Automatically
                        gets today's checklist assignments
                      </Box>
                      <Box
                        component="span"
                        sx={{ display: "block", mb: { xs: 0.5, sm: 0 } }}
                      >
                        • <strong>Employee marks leave:</strong> Assignments
                        automatically go to checked-in backup employees
                      </Box>
                      <Box
                        component="span"
                        sx={{ display: "block", mb: { xs: 0.5, sm: 0 } }}
                      >
                        • <strong>Manual generation:</strong> Generates
                        assignments for all currently checked-in employees
                      </Box>
                      <Box component="span" sx={{ display: "block" }}>
                        • <strong>No login complexity:</strong> Simple,
                        reliable, based on actual attendance
                      </Box>
                    </Typography>
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
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: 6,
                      },
                    }}
                    onClick={card.action}
                  >
                    <CardContent>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Box>
                          <Typography
                            color="textSecondary"
                            gutterBottom
                            variant="body2"
                          >
                            {card.title}
                          </Typography>
                          <Typography
                            variant="h5"
                            component="h2"
                            fontWeight="bold"
                          >
                            {card.badge ? (
                              <Badge
                                badgeContent={
                                  card.badge === true ? card.value : card.badge
                                }
                                color="error"
                                max={999}
                              >
                                <span>{card.value}</span>
                              </Badge>
                            ) : (
                              card.value
                            )}
                          </Typography>
                          {card.subtitle && (
                            <Typography
                              variant="caption"
                              color="textSecondary"
                              sx={{ display: "block", mt: 0.5 }}
                            >
                              {card.subtitle}
                            </Typography>
                          )}
                        </Box>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: "50%",
                            backgroundColor: `${card.color}15`,
                          }}
                        >
                          <Icon sx={{ color: card.color, fontSize: 32 }} />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Quick Actions */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Quick Actions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate("/customers/add")}
                        sx={{ mb: 1 }}
                      >
                        Add Customer
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<ReceiptIcon />}
                        onClick={() => navigate("/sales/create")}
                        sx={{ mb: 1 }}
                      >
                        Create Invoice
                      </Button>
                    </Grid>

                    {/* Admin Actions */}
                    {canManageEmployees() && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<BadgeIcon />}
                            onClick={() => navigate("/employees/add")}
                          >
                            Add Employee
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<ChecklistIcon />}
                            onClick={() => navigate("/checklists/create")}
                            sx={{ mb: 1 }}
                          >
                            Create New Checklist
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={handleManualGeneration}
                            disabled={refreshing}
                            sx={{ mb: 1 }}
                            color="primary"
                          >
                            {refreshing
                              ? "Generating..."
                              : "Generate for Checked-in"}
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<TrophyIcon />}
                            onClick={() =>
                              navigate("/analytics/employee-sales")
                            }
                            sx={{ mb: 1 }}
                          >
                            Employee Analytics
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<ReportsIcon />}
                            onClick={() => navigate("/reports/employees")}
                          >
                            Employee Reports
                          </Button>
                        </Grid>
                      </>
                    )}

                    {/* Employee Actions */}
                    {user?.role === USER_ROLES.EMPLOYEE && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<AttendanceIcon />}
                            onClick={() => navigate("/attendance")}
                            sx={{ mb: 1 }}
                          >
                            Check In (Get Checklists)
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<TaskIcon />}
                            onClick={() => navigate("/my-checklists")}
                            sx={{ mb: 1 }}
                          >
                            My Checklists
                          </Button>
                        </Grid>
                      </>
                    )}

                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<HistoryIcon />}
                        onClick={() => navigate("/sales/history")}
                      >
                        View Sales
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Activity
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    No recent activity to display.
                  </Typography>
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
        <MenuItem>
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

      {/* Mobile FAB for quick actions */}
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

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  AppBar,
  Toolbar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Fab,
  Chip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Badge as BadgeIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  AccessTime as AttendanceIcon,
  Assessment as ReportsIcon,
  Analytics as AnalyticsIcon,
  EmojiEvents as TrophyIcon,
  ChecklistRtl as ChecklistIcon,
  AssignmentTurnedIn as TaskIcon,
} from "@mui/icons-material";

import { useAuth } from "../../contexts/AuthContext/AuthContext";
import { useUserType } from "../../contexts/UserTypeContext/UserTypeContext";
import { USER_ROLES } from "../../utils/constants/appConstants";
import LoadingSpinner from "../../components/common/UI/LoadingSpinner";
import checklistService from "../../services/checklistService"; // Import checklist service

const DRAWER_WIDTH = 240;

const DashboardPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { user, signOut, canManageEmployees } = useAuth();
  const { getDisplayName, getAppTitle, getThemeColors, userType } = useUserType();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state
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
    loadDashboardDataWithChecklistGeneration();
  }, [userType, user]);

const loadDashboardDataWithChecklistGeneration = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard with automatic checklist generation...');
      
      // Automatically generate checklists for this login
      const checklistStatsWithGeneration = await checklistService.getDashboardStatsWithGeneration(userType, user);
      
      // Extract generation info for display
      const generationInfo = checklistStatsWithGeneration.autoGeneration;
      setChecklistGenerationInfo(generationInfo);
      
      // Log generation results
      if (generationInfo) {
        console.log('Automatic generation completed:', generationInfo);
        if (generationInfo.type === 'admin') {
          console.log(`Admin login: Generated ${generationInfo.totalGenerated} assignments for ${generationInfo.processedChecklists} checklists`);
        } else {
          console.log(`Employee login: Generated ${generationInfo.totalGenerated} assignments (${generationInfo.backupAssignments} backup)`);
        }
      }
      
      // TODO: Load other dashboard stats (customers, employees, sales)
      // For now, using placeholder values
      
      setStats({
        totalCustomers: 0, // TODO: Load from customer service
        totalEmployees: 0, // TODO: Load from employee service  
        totalSales: 0, // TODO: Load from sales service
        pendingEMIs: 0, // TODO: Load from sales service
        pendingDeliveries: 0, // TODO: Load from sales service
        todaySales: 0, // TODO: Load from sales service
        // Real checklist stats from automatic generation
        todayChecklists: checklistStatsWithGeneration.todayTotal,
        pendingChecklists: checklistStatsWithGeneration.todayPending,
        completedChecklists: checklistStatsWithGeneration.todayCompleted,
      });
      
    } catch (error) {
      console.error('Error loading dashboard data with checklist generation:', error);
      // Set fallback values on error
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

  // Navigation items - Updated with checklist management
  const navigationItems = [
    {
      label: "Dashboard",
      icon: DashboardIcon,
      path: "/dashboard",
      active: true,
    },
    {
      label: "Customers",
      icon: PeopleIcon,
      path: "/customers",
    },
    {
      label: "Employees",
      icon: BadgeIcon,
      path: "/employees",
      adminOnly: true,
    },
    // Employee attendance for employees only
    {
      label: "Attendance",
      icon: AttendanceIcon,
      path: "/attendance",
      employeeOnly: true,
    },
    // Checklist management for admin
    {
      label: "Checklists",
      icon: ChecklistIcon,
      path: "/checklists",
      adminOnly: true,
    },
    // My Checklists for employees
    {
      label: "My Checklists",
      icon: TaskIcon,
      path: "/my-checklists",
      employeeOnly: true,
    },
    {
      label: "Create Invoice",
      icon: ReceiptIcon,
      path: "/sales/create",
    },
    {
      label: "Sales History",
      icon: HistoryIcon,
      path: "/sales/history",
    },
    // Employee Reports for admin only
    {
      label: "Employee Reports",
      icon: ReportsIcon,
      path: '/reports/employees',
      adminOnly: true
    }
  ];

  // Stats cards data
  const statsCards = [
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
    statsCards.splice(1, 0, {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: BadgeIcon,
      color: themeColors.secondary,
      action: () => navigate("/employees"),
    });

    // Enhanced admin checklist stats
    statsCards.push({
      title: "Today's Checklists",
      value: `${stats.completedChecklists}/${stats.todayChecklists}`,
      icon: ChecklistIcon,
      color: "#9c27b0",
      subtitle: checklistGenerationInfo ? 
        `Auto-generated ${checklistGenerationInfo.totalGenerated} assignments` : 
        'Checklist assignments',
      action: () => navigate("/checklists"),
    });
  } else {
    // Enhanced employee checklist stats
    statsCards.push({
      title: "My Checklists",
      value: `${stats.completedChecklists}/${stats.todayChecklists}`,
      icon: TaskIcon,
      color: "#9c27b0",
      subtitle: checklistGenerationInfo && checklistGenerationInfo.backupAssignments > 0 ? 
        `${checklistGenerationInfo.backupAssignments} backup assignments` : 
        'Your assigned tasks',
      action: () => navigate("/my-checklists"),
    });
  }
  

  // Drawer content
  const DrawerContent = () => (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar>
        <Box display="flex" alignItems="center" gap={2} width="100%">
          <StoreIcon sx={{ color: themeColors.primary }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontSize: "1rem",
                fontWeight: 600,
                lineHeight: 1.2,
              }}
            >
              {getDisplayName()}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                lineHeight: 1,
              }}
            >
              Management
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />

      <List sx={{ mt: 1, flex: 1 }}>
        {navigationItems.map((item) => {
          // Filter based on user role
          if (item.adminOnly && !canManageEmployees()) {
            return null;
          }

          // Show attendance and employee checklists only for employees (not admins)
          if (item.employeeOnly && user?.role === USER_ROLES.ADMIN) {
            return null;
          }

          const Icon = item.icon;
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={item.active}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  "&.Mui-selected": {
                    backgroundColor: `${themeColors.primary}15`,
                    border: `1px solid ${themeColors.primary}30`,
                    "& .MuiListItemIcon-root": {
                      color: themeColors.primary,
                    },
                    "& .MuiListItemText-primary": {
                      color: themeColors.primary,
                      fontWeight: 600,
                    },
                  },
                  "&:hover": {
                    backgroundColor: `${themeColors.primary}08`,
                  },
                  "&.Mui-selected:hover": {
                    backgroundColor: `${themeColors.primary}20`,
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: item.active ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User Info in Drawer */}
      <Box sx={{ p: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: themeColors.primary,
              fontSize: "0.875rem",
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" noWrap fontWeight={600}>
              {user?.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={user?.role}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: "0.75rem",
                  height: 20,
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  // Show loading spinner while data is loading
  if (loading) {
    return <LoadingSpinner />;
  }

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
                badgeContent={stats.pendingEMIs + stats.pendingDeliveries + stats.pendingChecklists}
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
          <DrawerContent />
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
                                badgeContent={card.badge === true ? card.value : card.badge}
                                color="error"
                                max={999}
                              >
                                <span>{card.value}</span>
                              </Badge>
                            ) : (
                              card.value
                            )}
                          </Typography>
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
                        {/* Checklist management for admin */}
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<ChecklistIcon />}
                            onClick={() => navigate("/checklists/create")}
                            sx={{ mb: 1 }}
                          >
                            Create Checklist
                          </Button>
                        </Grid>
                      </>
                    )}
                    {/* Employee Sales Analytics for admin only */}
                    {canManageEmployees() && (
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<TrophyIcon />}
                          onClick={() => navigate("/analytics/employee-sales")}
                          sx={{ mb: 1 }}
                        >
                          Employee Analytics
                        </Button>
                      </Grid>
                    )}
                    {/* Attendance quick action for employees */}
                    {user?.role === USER_ROLES.EMPLOYEE && (
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<AttendanceIcon />}
                          onClick={() => navigate("/attendance")}
                        >
                          My Attendance
                        </Button>
                      </Grid>
                    )}
                    {/* My Checklists for employees */}
                    {user?.role === USER_ROLES.EMPLOYEE && (
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
                    {/* Employee Reports quick action for admins */}
                    {canManageEmployees() && (
                      <Grid item xs={12} sm={6}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<ReportsIcon />}
                          onClick={() => navigate('/reports/employees')}
                        >
                          Employee Reports
                        </Button>
                      </Grid>
                    )}
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
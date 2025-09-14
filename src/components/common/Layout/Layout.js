// src/components/common/Layout/Layout.js - Updated with Checklist Navigation
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Drawer,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
  Container,
  Breadcrumbs,
  Link,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Badge as BadgeIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  Store as StoreIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
  AccessTime as AttendanceIcon,
  Assessment as ReportsIcon,
  ChecklistRtl as ChecklistIcon,
  AssignmentTurnedIn as TaskIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../../contexts/UserTypeContext/UserTypeContext';
import { USER_ROLES } from '../../../utils/constants/appConstants';

const DRAWER_WIDTH = 240;

const Layout = ({ children, title, breadcrumbs = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { user, signOut, canManageEmployees } = useAuth();
  const { getDisplayName, getAppTitle, getThemeColors } = useUserType();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const themeColors = getThemeColors();

  // Helper function to check if a path is active
  const isPathActive = (itemPath, currentPath) => {
    if (itemPath === '/dashboard') {
      return currentPath === '/dashboard' || currentPath === '/';
    }
    return currentPath.startsWith(itemPath);
  };

  // Enhanced navigation items with checklist integration
  const navigationItems = [
    {
      label: 'Dashboard',
      icon: DashboardIcon,
      path: '/dashboard',
      active: isPathActive('/dashboard', location.pathname),
      showForAll: true
    },
    {
      label: 'Customers',
      icon: PeopleIcon,
      path: '/customers',
      active: isPathActive('/customers', location.pathname),
      showForAll: true
    },
    {
      label: 'Employees',
      icon: BadgeIcon,
      path: '/employees',
      active: isPathActive('/employees', location.pathname),
      adminOnly: true
    },
    {
      label: 'Attendance',
      icon: AttendanceIcon,
      path: '/attendance',
      active: isPathActive('/attendance', location.pathname),
      employeeOnly: true,
      tooltip: 'Track your daily attendance'
    },
    // NEW: Checklist Management (Admin)
    {
      label: 'Checklists',
      icon: ChecklistIcon,
      path: '/checklists',
      active: isPathActive('/checklists', location.pathname),
      adminOnly: true,
      tooltip: 'Manage employee checklists and view completion status'
    },
    // NEW: My Checklists (Employee)
    {
      label: 'My Checklists',
      icon: TaskIcon,
      path: '/my-checklists',
      active: isPathActive('/my-checklists', location.pathname),
      employeeOnly: true,
      tooltip: 'View and complete your assigned checklists'
    },
    {
      label: 'Create Invoice',
      icon: ReceiptIcon,
      path: '/sales/create',
      active: location.pathname === '/sales/create',
      showForAll: true
    },
    {
      label: 'Sales History',
      icon: HistoryIcon,
      path: '/sales/history',
      active: location.pathname.startsWith('/sales/history') || (location.pathname.startsWith('/sales') && location.pathname !== '/sales/create'),
      showForAll: true
    },
    {
      label: 'Employee Reports',
      icon: ReportsIcon,
      path: '/reports/employees',
      active: isPathActive('/reports/employees', location.pathname),
      adminOnly: true
    }
  ];

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
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
    handleProfileMenuClose();
  };

  // Generate breadcrumb items
  const getBreadcrumbItems = () => {
    const items = [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: <HomeIcon sx={{ fontSize: 16 }} />
      }
    ];

    // Add custom breadcrumbs
    if (breadcrumbs && breadcrumbs.length > 0) {
      items.push(...breadcrumbs);
    }

    return items;
  };

  // Filter navigation items based on user role
  const getFilteredNavigationItems = () => {
    return navigationItems.filter((item) => {
      // Show for all users
      if (item.showForAll) return true;
      
      // Admin only items
      if (item.adminOnly && !canManageEmployees()) {
        return false;
      }
      
      // Employee only items (hide from admins to avoid confusion)
      if (item.employeeOnly && user?.role === USER_ROLES.ADMIN) {
        return false;
      }

      return true;
    });
  };

  // Get notification count (placeholder - you can implement actual logic)
  const getNotificationCount = () => {
    // This could be based on pending checklists, overdue tasks, etc.
    return 0;
  };

  // Drawer content
  const DrawerContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Box display="flex" alignItems="center" gap={2} width="100%">
          <StoreIcon sx={{ color: themeColors.primary }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography 
              variant="h6" 
              noWrap 
              sx={{ 
                fontSize: '1rem', 
                fontWeight: 600,
                lineHeight: 1.2
              }}
            >
              {getDisplayName()}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                display: 'block',
                lineHeight: 1
              }}
            >
              Management System
            </Typography>
          </Box>
        </Box>
      </Toolbar>
      <Divider />

      <List sx={{ mt: 1, flex: 1 }}>
        {getFilteredNavigationItems().map((item) => {
          const Icon = item.icon;
          const listItem = (
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
                  '&.Mui-selected': {
                    backgroundColor: `${themeColors.primary}15`,
                    border: `1px solid ${themeColors.primary}30`,
                    '& .MuiListItemIcon-root': {
                      color: themeColors.primary,
                    },
                    '& .MuiListItemText-primary': {
                      color: themeColors.primary,
                      fontWeight: 600,
                    },
                  },
                  '&:hover': {
                    backgroundColor: `${themeColors.primary}08`,
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: `${themeColors.primary}20`,
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Icon />
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: item.active ? 600 : 500
                  }}
                />
              </ListItemButton>
            </ListItem>
          );

          // Wrap with tooltip if provided
          if (item.tooltip) {
            return (
              <Tooltip key={item.label} title={item.tooltip} placement="right">
                {listItem}
              </Tooltip>
            );
          }

          return listItem;
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
              fontSize: '0.875rem'
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
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
                  fontSize: '0.75rem', 
                  height: 20,
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            {title && (
              <Typography variant="h6" noWrap component="div" sx={{ mb: 0.5 }}>
                {title}
              </Typography>
            )}
            
            {/* Breadcrumbs */}
            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" />}
              aria-label="breadcrumb"
              sx={{
                '& .MuiBreadcrumbs-separator': {
                  color: 'text.secondary'
                }
              }}
            >
              {getBreadcrumbItems().map((item, index, array) => {
                const isLast = index === array.length - 1;
                
                if (isLast) {
                  return (
                    <Box key={item.path || index} display="flex" alignItems="center" gap={0.5}>
                      {item.icon}
                      <Typography variant="body2" color="text.secondary">
                        {item.label}
                      </Typography>
                    </Box>
                  );
                }
                
                return (
                  <Link
                    key={item.path || index}
                    component="button"
                    variant="body2"
                    onClick={() => navigate(item.path)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      textDecoration: 'none',
                      color: 'primary.main',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </Breadcrumbs>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <IconButton color="inherit">
              <Badge badgeContent={getNotificationCount()} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton color="inherit" onClick={handleProfileMenuOpen}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: themeColors.primary,
                  fontSize: '0.875rem'
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
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
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid',
              borderColor: 'divider'
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
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        
        <Container 
          maxWidth="xl" 
          sx={{ 
            py: 3,
            px: { xs: 2, sm: 3 }
          }}
        >
          {children}
        </Container>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
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
    </Box>
  );
};

export default Layout;
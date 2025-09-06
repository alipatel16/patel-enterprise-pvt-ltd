import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
  Link,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Home as HomeIcon
} from '@mui/icons-material';

import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../../contexts/UserTypeContext/UserTypeContext';
import { useNotifications } from '../../../hooks/useNotifications';

/**
 * Navigation bar component with user menu and notifications
 * @param {Object} props
 * @param {function} props.onMenuToggle - Callback for menu toggle
 * @param {boolean} props.sidebarOpen - Whether sidebar is open
 * @param {array} props.breadcrumbs - Breadcrumb navigation items
 * @param {string} props.title - Page title
 */
const Navbar = ({ 
  onMenuToggle, 
  sidebarOpen = false, 
  breadcrumbs = [], 
  title = '' 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user, signOut } = useAuth();
  const { userType, getDisplayName, getThemeColors } = useUserType();
  const { unreadCount } = useNotifications();
  
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState(null);

  // Handle user menu
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  // Handle notifications menu
  const handleNotificationsOpen = (event) => {
    setNotificationMenuAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationMenuAnchor(null);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
    handleUserMenuClose();
  };

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
    handleUserMenuClose();
  };

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (path) => {
    if (path) {
      navigate(path);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get theme colors
  const themeColors = getThemeColors();

  return (
    <AppBar
      position="sticky"
      elevation={1}
      sx={{
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.text.primary,
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        {/* Menu Toggle Button */}
        <IconButton
          edge="start"
          onClick={onMenuToggle}
          sx={{ 
            mr: 2,
            display: { md: 'none' }
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo/Brand */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mr: 3,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/dashboard')}
        >
          <BusinessIcon 
            sx={{ 
              mr: 1, 
              color: themeColors.primary,
              fontSize: { xs: 24, sm: 28 }
            }} 
          />
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 700,
              color: themeColors.primary,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Business Manager
          </Typography>
        </Box>

        {/* Business Type Indicator */}
        {userType && !isMobile && (
          <Chip
            label={getDisplayName()}
            size="small"
            sx={{
              mr: 2,
              backgroundColor: `${themeColors.primary}15`,
              color: themeColors.primary,
              fontWeight: 500
            }}
          />
        )}

        {/* Title and Breadcrumbs */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {breadcrumbs.length > 0 ? (
            <Breadcrumbs
              maxItems={isMobile ? 2 : 4}
              aria-label="breadcrumb"
              sx={{
                '& .MuiBreadcrumbs-separator': {
                  mx: 0.5
                }
              }}
            >
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                
                if (isLast) {
                  return (
                    <Typography
                      key={index}
                      color="text.primary"
                      variant="body2"
                      noWrap
                      sx={{ 
                        fontWeight: 500,
                        maxWidth: { xs: 150, sm: 200 }
                      }}
                    >
                      {crumb.label}
                    </Typography>
                  );
                }
                
                return (
                  <Link
                    key={index}
                    underline="hover"
                    color="inherit"
                    onClick={() => handleBreadcrumbClick(crumb.path)}
                    sx={{
                      cursor: crumb.path ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        color: themeColors.primary
                      }
                    }}
                  >
                    {index === 0 && <HomeIcon sx={{ mr: 0.5, fontSize: 16 }} />}
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{ maxWidth: { xs: 100, sm: 150 } }}
                    >
                      {crumb.label}
                    </Typography>
                  </Link>
                );
              })}
            </Breadcrumbs>
          ) : (
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 500,
                fontSize: { xs: '1rem', sm: '1.125rem' }
              }}
            >
              {title}
            </Typography>
          )}
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Notifications */}
          <IconButton
            onClick={handleNotificationsOpen}
            sx={{ color: 'text.primary' }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* User Menu */}
          <IconButton
            onClick={handleUserMenuOpen}
            sx={{ p: 0.5 }}
          >
            <Avatar
              sx={{
                width: 36,
                height: 36,
                backgroundColor: themeColors.primary,
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              {getUserInitials()}
            </Avatar>
          </IconButton>
        </Box>
      </Toolbar>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { minWidth: 200, mt: 1 }
        }}
      >
        {/* User Info */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {user?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
          <Chip
            label={user?.role === 'admin' ? 'Administrator' : 'Employee'}
            size="small"
            sx={{ mt: 0.5 }}
          />
        </Box>
        
        <Divider />

        {/* Menu Items */}
        <MenuItem onClick={() => handleNavigation('/dashboard')}>
          <ListItemIcon>
            <DashboardIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Dashboard</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => handleNavigation('/settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign Out</ListItemText>
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationMenuAnchor}
        open={Boolean(notificationMenuAnchor)}
        onClose={handleNotificationsClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { minWidth: 320, maxHeight: 400, mt: 1 }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            Notifications
          </Typography>
        </Box>
        
        <Divider />

        {/* Notification items would be rendered here */}
        <MenuItem>
          <Typography variant="body2" color="text.secondary">
            No new notifications
          </Typography>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Navbar;
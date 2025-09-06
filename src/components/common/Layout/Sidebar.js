import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  Add as AddIcon,
  ExpandLess,
  ExpandMore,
  Person as PersonIcon,
  PersonAdd as PersonAddIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  ShoppingCart as SalesIcon,
  Inventory as InventoryIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  NotificationImportant as NotificationIcon
} from '@mui/icons-material';

import { useAuth } from '../../../contexts/AuthContext/AuthContext';
import { useUserType } from '../../../contexts/UserTypeContext/UserTypeContext';
import { useNotifications } from '../../../hooks/useNotifications';
import { USER_ROLES } from '../../../utils/constants/appConstants';

const DRAWER_WIDTH = 260;

/**
 * Sidebar navigation component
 * @param {Object} props
 * @param {boolean} props.open - Whether sidebar is open
 * @param {function} props.onClose - Close handler for mobile
 * @param {string} props.variant - Drawer variant
 */
const Sidebar = ({ 
  open = true, 
  onClose, 
  variant = 'persistent' 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { user } = useAuth();
  const { userType, getThemeColors } = useUserType();
  const { getUnreadCountByType } = useNotifications();
  
  const [expandedItems, setExpandedItems] = useState(['dashboard']);

  // Get theme colors
  const themeColors = getThemeColors();

  // Handle item expansion
  const handleExpand = (itemId) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Check if path is active
  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Navigation items configuration
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: DashboardIcon,
      roles: [USER_ROLES.ADMIN, USER_ROLES.EMPLOYEE]
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: PeopleIcon,
      roles: [USER_ROLES.ADMIN, USER_ROLES.EMPLOYEE],
      children: [
        {
          id: 'customers-list',
          label: 'All Customers',
          path: '/customers',
          icon: ViewIcon
        },
        {
          id: 'customers-add',
          label: 'Add Customer',
          path: '/customers/add',
          icon: PersonAddIcon
        }
      ]
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: GroupIcon,
      roles: [USER_ROLES.ADMIN],
      children: [
        {
          id: 'employees-list',
          label: 'All Employees',
          path: '/employees',
          icon: ViewIcon
        },
        {
          id: 'employees-add',
          label: 'Add Employee',
          path: '/employees/add',
          icon: PersonAddIcon
        }
      ]
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: SalesIcon,
      roles: [USER_ROLES.ADMIN, USER_ROLES.EMPLOYEE],
      children: [
        {
          id: 'sales-dashboard',
          label: 'Sales Overview',
          path: '/sales',
          icon: AnalyticsIcon
        },
        {
          id: 'sales-create',
          label: 'Create Invoice',
          path: '/sales/create',
          icon: AddIcon
        },
        {
          id: 'sales-history',
          label: 'Sales History',
          path: '/sales/history',
          icon: HistoryIcon,
          badge: () => getUnreadCountByType?.('sales') || 0
        }
      ]
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: AssignmentIcon,
      roles: [USER_ROLES.ADMIN],
      children: [
        {
          id: 'reports-sales',
          label: 'Sales Reports',
          path: '/reports/sales',
          icon: AnalyticsIcon
        },
        {
          id: 'reports-customers',
          label: 'Customer Reports',
          path: '/reports/customers',
          icon: PeopleIcon
        },
        {
          id: 'reports-inventory',
          label: 'Inventory Reports',
          path: '/reports/inventory',
          icon: InventoryIcon
        }
      ]
    }
  ];

  // Filter navigation items based on user role
  const filteredNavItems = navigationItems.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  // Render navigation item
  const renderNavItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const itemIsActive = item.path ? isActive(item.path) : false;
    const Icon = item.icon;
    
    // Filter children based on user role
    const filteredChildren = hasChildren 
      ? item.children.filter(child => 
          !child.roles || child.roles.includes(user?.role)
        )
      : [];

    const shouldShowItem = !item.roles || item.roles.includes(user?.role);
    
    if (!shouldShowItem) return null;

    return (
      <Box key={item.id}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                handleExpand(item.id);
              } else if (item.path) {
                handleNavigation(item.path);
              }
            }}
            sx={{
              pl: 2 + (level * 2),
              pr: 2,
              py: 1,
              mx: 1,
              mb: 0.5,
              borderRadius: 2,
              backgroundColor: itemIsActive 
                ? alpha(themeColors.primary, 0.1) 
                : 'transparent',
              color: itemIsActive 
                ? themeColors.primary 
                : theme.palette.text.primary,
              '&:hover': {
                backgroundColor: alpha(themeColors.primary, 0.08),
                color: themeColors.primary
              },
              transition: 'all 0.2s ease'
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: 'inherit',
                '& svg': {
                  fontSize: 20
                }
              }}
            >
              <Icon />
            </ListItemIcon>
            
            <ListItemText
              primary={
                <Typography 
                  variant="body2" 
                  fontWeight={itemIsActive ? 600 : 400}
                  sx={{ fontSize: '0.875rem' }}
                >
                  {item.label}
                </Typography>
              }
            />

            {/* Badge */}
            {item.badge && (
              <Badge
                badgeContent={item.badge()}
                color="error"
                sx={{ mr: hasChildren ? 1 : 0 }}
              />
            )}

            {/* Expand/Collapse Icon */}
            {hasChildren && (
              isExpanded ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>

        {/* Children */}
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {filteredChildren.map(child => renderNavItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: `linear-gradient(135deg, ${themeColors.primary}15, ${themeColors.secondary}10)`,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="h6" fontWeight={600} color={themeColors.primary}>
          {userType === 'electronics' ? 'Electronics' : 'Furniture'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Business Management
        </Typography>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List>
          {filteredNavItems.map(item => renderNavItem(item))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleNavigation('/settings')}
            sx={{
              borderRadius: 2,
              '&:hover': {
                backgroundColor: alpha(themeColors.primary, 0.08)
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              <Typography variant="body2">Settings</Typography>
            </ListItemText>
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box'
          }
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: open ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          position: 'relative',
          whiteSpace: 'nowrap',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          })
        }
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
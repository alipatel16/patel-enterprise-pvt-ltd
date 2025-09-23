// src/components/common/Layout/Sidebar.js
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
  alpha,
  useTheme,
  useMediaQuery,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  History as HistoryIcon,
  Add as AddIcon,
  ExpandLess,
  ExpandMore,
  PersonAdd as PersonAddIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  ShoppingCart as SalesIcon,
  Inventory as InventoryIcon,
  Analytics as AnalyticsIcon,
  AccessTime as AttendanceIcon,
  Assessment as ReportsIcon
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
      id: 'attendance',
      label: 'Attendance',
      icon: AttendanceIcon,
      roles: [USER_ROLES.EMPLOYEE],
      path: '/attendance'
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
          id: 'reports-employees',
          label: 'Employee Reports',
          path: '/reports/employees',
          icon: ReportsIcon
        },
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
                  fontWeight={itemIsActive ? 600 : 500}
                  sx={{ fontSize: '0.875rem' }}
                >
                  {item.label}
                </Typography>
              }
            />
            
            {/* Badge for notifications */}
            {item.badge && (
              <Badge 
                badgeContent={item.badge()} 
                color="error" 
                sx={{ mr: 1 }}
              />
            )}
            
            {/* Expand/Collapse icon */}
            {hasChildren && filteredChildren.length > 0 && (
              isExpanded ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>

        {/* Children items */}
        {hasChildren && filteredChildren.length > 0 && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {filteredChildren.map(child => renderNavItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  // Drawer content
  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Typography variant="h6" sx={{ 
          color: themeColors.primary,
          fontWeight: 600,
          textAlign: 'center'
        }}>
          {userType === 'electronics' ? 'Electronics' : 'Furniture'} Management
        </Typography>
      </Box>

      {/* Navigation Items */}
      <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        <List>
          {filteredNavItems.map(item => renderNavItem(item))}
        </List>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: themeColors.primary,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.role === USER_ROLES.ADMIN ? 'Administrator' : 'Employee'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
    >
      <Drawer
        variant={variant}
        open={open}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
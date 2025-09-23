// src/components/common/Layout/Layout.js - Updated with Checklist Navigation
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  Drawer,
  IconButton,
  Typography,
  ListItemIcon,
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
} from "@mui/material";
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";

import { useAuth } from "../../../contexts/AuthContext/AuthContext";
import { useUserType } from "../../../contexts/UserTypeContext/UserTypeContext";
import DrawerContent from "../Navigation/DrawerContent";

const DRAWER_WIDTH = 240;

const Layout = ({ children, title, breadcrumbs = [] }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { user, signOut } = useAuth();
  const { getThemeColors } = useUserType();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const themeColors = getThemeColors();

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
    handleProfileMenuClose();
  };

  // Generate breadcrumb items
  const getBreadcrumbItems = () => {
    const items = [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: <HomeIcon sx={{ fontSize: 16 }} />,
      },
    ];

    // Add custom breadcrumbs
    if (breadcrumbs && breadcrumbs.length > 0) {
      items.push(...breadcrumbs);
    }

    return items;
  };

  // Get notification count (placeholder - you can implement actual logic)
  const getNotificationCount = () => {
    // This could be based on pending checklists, overdue tasks, etc.
    return 0;
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: "background.paper",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
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
                "& .MuiBreadcrumbs-separator": {
                  color: "text.secondary",
                },
              }}
            >
              {getBreadcrumbItems().map((item, index, array) => {
                const isLast = index === array.length - 1;

                if (isLast) {
                  return (
                    <Box
                      key={item.path || index}
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                    >
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
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      textDecoration: "none",
                      color: "primary.main",
                      "&:hover": {
                        textDecoration: "underline",
                      },
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
            <IconButton color="inherit" onClick={() => navigate("/notifications")}>
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
              borderRight: "1px solid",
              borderColor: "divider",
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
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        <Container
          maxWidth="xl"
          sx={{
            py: 3,
            px: { xs: 2, sm: 3 },
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
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
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

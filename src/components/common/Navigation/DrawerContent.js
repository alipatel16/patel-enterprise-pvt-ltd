// Updated DrawerContent.js - Add Exchange Navigation
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Toolbar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Avatar,
  Typography,
  Chip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Badge as BadgeIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  Store as StoreIcon,
  AccessTime as AttendanceIcon,
  Assessment as ReportsIcon,
  ChecklistRtl as ChecklistIcon,
  AssignmentTurnedIn as TaskIcon,
  Assessment as AssessmentIcon,
  SupportAgent as ComplaintsIcon,
  RequestQuote as QuotationIcon,
  Add as AddQuotationIcon,
  LocalShipping as DeliveriesIcon,
  SwapHoriz as ExchangesIcon,
} from "@mui/icons-material";

import { useAuth } from "../../../contexts/AuthContext/AuthContext";
import { useUserType } from "../../../contexts/UserTypeContext/UserTypeContext";
import { USER_ROLES } from "../../../utils/constants/appConstants";

const DrawerContent = ({ onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, canManageEmployees } = useAuth();
  const { getDisplayName, getThemeColors } = useUserType();

  const themeColors = getThemeColors();

  // Navigation items configuration
  const navigationItems = [
    {
      label: "Dashboard",
      icon: DashboardIcon,
      path: "/dashboard",
      active: location.pathname === "/dashboard" || location.pathname === "/",
    },
    {
      label: "Customers",
      icon: PeopleIcon,
      path: "/customers",
      active: location.pathname.startsWith("/customers"),
    },
    {
      label: "Employees",
      icon: BadgeIcon,
      path: "/employees",
      active: location.pathname.startsWith("/employees"),
      adminOnly: true,
    },
    {
      label: "Complaints",
      icon: ComplaintsIcon,
      path: "/complaints",
      active: location.pathname.startsWith("/complaints"),
    },
    {
      label: "Deliveries",
      icon: DeliveriesIcon,
      path: "/deliveries",
      active: location.pathname.startsWith("/deliveries"),
    },
    {
      label: "Exchanges", // ← NEW ITEM
      icon: ExchangesIcon,
      path: "/exchanges",
      active: location.pathname.startsWith("/exchanges"),
    },
    {
      label: "Attendance",
      icon: AttendanceIcon,
      path: "/attendance",
      active: location.pathname.startsWith("/attendance"),
      employeeOnly: true,
    },
    {
      label: "Checklists",
      icon: ChecklistIcon,
      path: "/checklists",
      active: location.pathname.startsWith("/checklists"),
      adminOnly: true,
    },
    {
      label: "My Checklists",
      icon: TaskIcon,
      path: "/my-checklists",
      active: location.pathname.startsWith("/my-checklists"),
      employeeOnly: true,
    },
    // Quotation section separator
    {
      type: "divider",
      label: "Quotations & Sales",
    },
    // Quotation navigation items
    {
      label: "Quotations",
      icon: QuotationIcon,
      path: "/quotations",
      active:
        location.pathname === "/quotations" ||
        location.pathname.startsWith("/quotations/view") ||
        location.pathname.startsWith("/quotations/edit"),
    },
    {
      label: "Create Quotation",
      icon: AddQuotationIcon,
      path: "/quotations/create",
      active: location.pathname === "/quotations/create",
    },
    {
      label: "Create Invoice",
      icon: ReceiptIcon,
      path: "/sales/create",
      active: location.pathname === "/sales/create",
    },
    {
      label: "Sales History",
      icon: HistoryIcon,
      path: "/sales/history",
      active:
        location.pathname.startsWith("/sales/history") ||
        location.pathname.startsWith("/sales/view") ||
        location.pathname.startsWith("/sales/edit") ||
        location.pathname === "/sales",
    },
    // Reports section separator
    {
      type: "divider",
      label: "Reports & Analytics",
      adminOnly: true,
    },
    {
      label: "Employee Reports",
      icon: ReportsIcon,
      path: "/reports/employees",
      active: location.pathname.startsWith("/reports/employees"),
      adminOnly: true,
    },
    {
      label: "Sales Statistics",
      icon: AssessmentIcon,
      path: "/sales/statistics",
      active: location.pathname.startsWith("/sales/statistics"),
      adminOnly: true,
    },
  ];

  const handleItemClick = (path) => {
    navigate(path);
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
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
        {navigationItems.map((item, index) => {
          // Handle dividers/section separators
          if (item.type === "divider") {
            // Check if this section should be visible based on admin permissions
            if (item.adminOnly && !canManageEmployees()) {
              return null;
            }

            return (
              <Box key={`divider-${index}`}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                    sx={{ textTransform: "uppercase", letterSpacing: 1 }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              </Box>
            );
          }

          // Handle regular navigation items
          if (item.adminOnly && !canManageEmployees()) {
            return null;
          }

          if (item.employeeOnly && user?.role === USER_ROLES.ADMIN) {
            return null;
          }

          const Icon = item.icon;

          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={item.active}
                onClick={() => handleItemClick(item.path)}
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
};

export default DrawerContent;
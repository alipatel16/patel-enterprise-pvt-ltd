// src/pages/deliveries/DeliveriesPage.js
import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import {
  LocalShipping as DeliveryIcon,
  Schedule as ScheduledIcon,
  CheckCircle as DeliveredIcon,
} from "@mui/icons-material";
import { SalesProvider, useSales } from "../../contexts/SalesContext/SalesContext";
import { useUserType } from "../../contexts/UserTypeContext/UserTypeContext";
import Layout from "../../components/common/Layout/Layout";
import PendingDeliveriesTab from "./PendingDeliveriesTab";
import RecentlyDeliveredTab from "./RecentlyDeliveredTab";
import { DELIVERY_STATUS } from "../../utils/constants/appConstants";

// Main Content Component
const DeliveriesPageContent = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [recentCount, setRecentCount] = useState(0);

  const { sales, loading, loadSales } = useSales();
  const { getThemeColors } = useUserType();
  const themeColors = getThemeColors();

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Calculate counts
  useEffect(() => {
    if (sales && sales.length > 0) {
      const today = new Date();
      const next7Days = new Date();
      next7Days.setDate(today.getDate() + 7);
      const last15Days = new Date();
      last15Days.setDate(today.getDate() - 15);

      // Pending deliveries count
      const pending = sales.filter(
        (sale) => sale.deliveryStatus === DELIVERY_STATUS.PENDING
      ).length;

      // Scheduled deliveries in next 7 days
      const scheduled = sales.filter((sale) => {
        if (sale.deliveryStatus === DELIVERY_STATUS.SCHEDULED && sale.scheduledDeliveryDate) {
          const scheduledDate = new Date(sale.scheduledDeliveryDate);
          return scheduledDate >= today && scheduledDate <= next7Days;
        }
        return false;
      }).length;

      // Recently delivered (last 15 days)
      const recent = sales.filter((sale) => {
        if (sale.deliveryStatus === DELIVERY_STATUS.DELIVERED && sale.deliveryDate) {
          const deliveryDate = new Date(sale.deliveryDate);
          return deliveryDate >= last15Days && deliveryDate <= today;
        }
        return false;
      }).length;

      setPendingCount(pending);
      setScheduledCount(scheduled);
      setRecentCount(recent);
    }
  }, [sales]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const breadcrumbs = [
    {
      label: 'Delivery Management',
      path: '/deliveries'
    }
  ];

  return (
    <Layout title="Delivery Management" breadcrumbs={breadcrumbs}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <DeliveryIcon sx={{ fontSize: 40, color: themeColors.primary }} />
            <Box>
              <Typography variant="h4" fontWeight={600}>
                Delivery Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track and manage all deliveries
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 500,
              },
            }}
          >
            <Tab
              icon={<ScheduledIcon />}
              iconPosition="start"
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Pending & Scheduled
                  <Chip
                    label={pendingCount + scheduledCount}
                    size="small"
                    color="warning"
                    sx={{ height: 20, fontSize: "0.75rem" }}
                  />
                </Box>
              }
            />
            <Tab
              icon={<DeliveredIcon />}
              iconPosition="start"
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Recently Delivered
                  <Chip
                    label={recentCount}
                    size="small"
                    color="success"
                    sx={{ height: 20, fontSize: "0.75rem" }}
                  />
                </Box>
              }
            />
          </Tabs>

          {/* Tab Content */}
          <Box sx={{ p: 3 }}>
            {activeTab === 0 && <PendingDeliveriesTab />}
            {activeTab === 1 && <RecentlyDeliveredTab />}
          </Box>
        </Paper>
      </Container>
    </Layout>
  );
};

// Main Component with Provider (following your existing pattern)
const DeliveriesPage = () => {
  return (
    <SalesProvider>
      <DeliveriesPageContent />
    </SalesProvider>
  );
};

export default DeliveriesPage;
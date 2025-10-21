// src/pages/exchanges/ExchangesPage.js
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
  SwapHoriz as ExchangeIcon,
  Schedule as PendingIcon,
  CheckCircle as ReceivedIcon,
} from "@mui/icons-material";
import { SalesProvider, useSales } from "../../contexts/SalesContext/SalesContext";
import { useUserType } from "../../contexts/UserTypeContext/UserTypeContext";
import Layout from "../../components/common/Layout/Layout";
import PendingExchangesTab from "./PendingExchangesTab";
import ReceivedExchangesTab from "./ReceivedExchangesTab";

// Main Content Component
const ExchangesPageContent = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [receivedCount, setReceivedCount] = useState(0);

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
      const last15Days = new Date();
      last15Days.setDate(today.getDate() - 15);

      // Pending exchanges count
      const pending = sales.filter(
        (sale) =>
          sale.exchangeDetails?.hasExchange &&
          !sale.exchangeDetails?.itemReceived
      ).length;

      // Recently received exchanges (last 15 days)
      const received = sales.filter((sale) => {
        if (
          sale.exchangeDetails?.hasExchange &&
          sale.exchangeDetails?.itemReceived &&
          sale.exchangeDetails?.exchangeReceivedDate
        ) {
          const receivedDate = new Date(sale.exchangeDetails.exchangeReceivedDate);
          return receivedDate >= last15Days && receivedDate <= today;
        }
        return false;
      }).length;

      setPendingCount(pending);
      setReceivedCount(received);
    }
  }, [sales]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const breadcrumbs = [
    {
      label: 'Exchange Management',
      path: '/exchanges'
    }
  ];

  return (
    <Layout title="Exchange Management" breadcrumbs={breadcrumbs}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <ExchangeIcon sx={{ fontSize: 40, color: themeColors.primary }} />
            <Box>
              <Typography variant="h4" fontWeight={600}>
                Exchange Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track and manage all exchange items
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
              icon={<PendingIcon />}
              iconPosition="start"
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Pending Exchanges
                  <Chip
                    label={pendingCount}
                    size="small"
                    color="warning"
                    sx={{ height: 20, fontSize: "0.75rem" }}
                  />
                </Box>
              }
            />
            <Tab
              icon={<ReceivedIcon />}
              iconPosition="start"
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  Received Exchanges
                  <Chip
                    label={receivedCount}
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
            {activeTab === 0 && <PendingExchangesTab />}
            {activeTab === 1 && <ReceivedExchangesTab />}
          </Box>
        </Paper>
      </Container>
    </Layout>
  );
};

// Main Component with Provider
const ExchangesPage = () => {
  return (
    <SalesProvider>
      <ExchangesPageContent />
    </SalesProvider>
  );
};

export default ExchangesPage;
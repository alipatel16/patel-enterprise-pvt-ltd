import React from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import Layout from "../../../components/common/Layout/Layout";
import NotificationPanel from "../../../components/dashboard/Notifications/NotificationPanel";
import { SalesProvider } from '../../../contexts/SalesContext/SalesContext'; 

const NotificationsPage = () => {
  const navigate = useNavigate();

  const breadcrumbs = [
    {
      label: "Notifications",
      path: "/notifications",
    },
  ];

  return (
    <SalesProvider>
    <Layout title="Notifications" breadcrumbs={breadcrumbs}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Notifications
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your EMI reminders, delivery schedules, and other important
            notifications.
          </Typography>
        </Box>

        <Paper elevation={2}>
          <NotificationPanel compact={false} />
        </Paper>
      </Container>
    </Layout>
    </SalesProvider>
  );
};

export default NotificationsPage;
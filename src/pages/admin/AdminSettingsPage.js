// src/pages/admin/AdminSettingsPage.js
import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Alert
} from '@mui/material';
import {
  Settings as SettingsIcon,
  AttachMoney as PenaltyIcon,
  Business as CompanyIcon,
  Security as SecurityIcon,
  Notifications as NotificationIcon,
  People as UserIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import PenaltySettings from '../../components/admin/PenaltySettings';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { UPDATED_PERMISSIONS } from '../../utils/constants/attendanceConstants';

// Placeholder components for other settings tabs
const CompanySettings = () => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>Company Information</Typography>
      <Alert severity="info">Company settings feature coming soon...</Alert>
    </CardContent>
  </Card>
);

const SecuritySettings = () => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>Security Settings</Typography>
      <Alert severity="info">Security settings feature coming soon...</Alert>
    </CardContent>
  </Card>
);

const NotificationSettings = () => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>Notification Preferences</Typography>
      <Alert severity="info">Notification settings feature coming soon...</Alert>
    </CardContent>
  </Card>
);

const UserManagement = () => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>User Management</Typography>
      <Alert severity="info">User management feature coming soon...</Alert>
    </CardContent>
  </Card>
);

const AdminSettingsPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);

  // Check if user has permission to manage penalty settings
  const canManagePenalties = user?.role === 'admin'; // Simplified check

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const breadcrumbs = [
    { label: 'Admin', path: '/admin' },
    { label: 'Settings', path: '/admin/settings' }
  ];

  const tabsConfig = [
    {
      label: 'Penalty Settings',
      icon: <PenaltyIcon />,
      component: <PenaltySettings />,
      show: canManagePenalties
    },
    {
      label: 'Company',
      icon: <CompanyIcon />,
      component: <CompanySettings />,
      show: true
    },
    {
      label: 'Security',
      icon: <SecurityIcon />,
      component: <SecuritySettings />,
      show: true
    },
    {
      label: 'Notifications',
      icon: <NotificationIcon />,
      component: <NotificationSettings />,
      show: true
    },
    {
      label: 'Users',
      icon: <UserIcon />,
      component: <UserManagement />,
      show: true
    }
  ].filter(tab => tab.show);

  return (
    <Layout title="Admin Settings" breadcrumbs={breadcrumbs}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box display="flex" alignItems="center" gap={2} mb={4}>
          <SettingsIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
            Admin Settings
          </Typography>
        </Box>

        {/* Settings Tabs */}
        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons={isMobile ? "auto" : false}
              allowScrollButtonsMobile
            >
              {tabsConfig.map((tab, index) => (
                <Tab
                  key={index}
                  label={tab.label}
                  icon={tab.icon}
                  iconPosition="start"
                  sx={{
                    minHeight: 64,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '& .MuiTab-iconWrapper': {
                      marginBottom: 0,
                      marginRight: 1
                    }
                  }}
                />
              ))}
            </Tabs>
          </Box>

          <CardContent sx={{ p: { xs: 2, md: 4 } }}>
            {tabsConfig[tabValue]?.component}
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
};

export default AdminSettingsPage;
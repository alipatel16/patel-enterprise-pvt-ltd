import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
  useMediaQuery,
  Fab
} from '@mui/material';
import {
  Add as AddIcon,
  People as PeopleIcon,
  Badge as BadgeIcon,
  Work as WorkIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import EmployeeList from '../../components/employees/EmployeeList';
import { EmployeeProvider, useEmployee } from '../../contexts/EmployeeContext/EmployeeContext';
import { useUserType } from '../../contexts/UserTypeContext/UserTypeContext';

// Stats Component
const EmployeeStats = () => {
  const { stats, loadEmployeeStats } = useEmployee();
  const theme = useTheme();

  useEffect(() => {
    loadEmployeeStats();
  }, [loadEmployeeStats]);

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.total,
      icon: PeopleIcon,
      color: theme.palette.primary.main
    },
    {
      title: 'Active',
      value: stats.active,
      icon: BadgeIcon,
      color: theme.palette.success.main
    },
    {
      title: 'Sales Team',
      value: (stats.byRole?.sales_executive || 0) + (stats.byRole?.sales_manager || 0),
      icon: WorkIcon,
      color: theme.palette.info.main
    },
    {
      title: 'Departments',
      value: Object.keys(stats.byDepartment).length,
      icon: BusinessIcon,
      color: theme.palette.warning.main
    }
  ];

  return (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Grid item xs={6} sm={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h6" component="h2" fontWeight="bold">
                      {stat.value.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: '50%',
                      backgroundColor: `${stat.color}15`,
                    }}
                  >
                    <Icon sx={{ color: stat.color, fontSize: 24 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

// Main Page Content
const EmployeesPageContent = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { getDisplayName } = useUserType();

  const breadcrumbs = [
    {
      label: 'Employees',
      path: '/employees'
    }
  ];

  return (
    <Layout 
      title="Employee Management" 
      breadcrumbs={breadcrumbs}
    >
      <Box>
        {/* Page Header */}
        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="flex-start" 
          mb={3}
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={2}
        >
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                fontWeight: 700
              }}
            >
              Employee Management
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Manage your {getDisplayName().toLowerCase()} team, track employee information, and organize workforce.
            </Typography>
          </Box>
          
          {!isMobile && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/employees/add')}
              sx={{ 
                whiteSpace: 'nowrap',
                px: 3,
                py: 1.5
              }}
            >
              Add Employee
            </Button>
          )}
        </Box>

        {/* Statistics Cards */}
        <EmployeeStats />

        {/* Employee List */}
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <EmployeeList />
          </CardContent>
        </Card>

        {/* Mobile FAB */}
        {isMobile && (
          <Fab
            color="primary"
            aria-label="add employee"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: theme.zIndex.speedDial
            }}
            onClick={() => navigate('/employees/add')}
          >
            <AddIcon />
          </Fab>
        )}
      </Box>
    </Layout>
  );
};

// Main Component with Provider
const EmployeesPage = () => {
  return (
    <EmployeeProvider>
      <EmployeesPageContent />
    </EmployeeProvider>
  );
};

export default EmployeesPage;
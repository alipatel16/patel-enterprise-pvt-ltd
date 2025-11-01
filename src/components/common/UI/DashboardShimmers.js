import React from 'react';
import { Box, Card, CardContent, Container, Grid, Skeleton, useTheme } from '@mui/material';

/**
 * Shimmer effect for stats cards while loading
 */
export const StatsCardSkeleton = () => {
  const theme = useTheme();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="80%" height={40} sx={{ mt: 1 }} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mt: 1 }} />
          </Box>
          <Skeleton variant="circular" width={48} height={48} />
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Shimmer effect for recent sales list
 */
export const RecentSalesSkeleton = () => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Skeleton variant="text" width="30%" height={32} />
          <Skeleton variant="rectangular" width={80} height={32} />
        </Box>

        {[1, 2, 3, 4, 5].map((item) => (
          <Box
            key={item}
            sx={{
              mb: 2,
              pb: 2,
              borderBottom: item !== 5 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box flex={1}>
                <Skeleton variant="text" width="60%" height={24} />
                <Skeleton variant="text" width="40%" height={20} sx={{ mt: 0.5 }} />
              </Box>
              <Box textAlign="right">
                <Skeleton variant="text" width={80} height={24} />
                <Skeleton variant="rectangular" width={70} height={24} sx={{ mt: 0.5 }} />
              </Box>
            </Box>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
};

/**
 * Shimmer effect for recent activity
 */
export const RecentActivitySkeleton = () => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 0 }}>
        <Box sx={{ p: 3, pb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Skeleton variant="text" width="40%" height={32} />
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
          <Skeleton variant="text" width="30%" height={20} sx={{ mt: 0.5 }} />
        </Box>

        <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Box
              key={item}
              sx={{
                p: 2,
                borderBottom: item !== 6 ? '1px solid' : 'none',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Skeleton variant="circular" width={40} height={40} />
              <Box flex={1}>
                <Skeleton variant="text" width="70%" height={20} />
                <Skeleton variant="text" width="50%" height={16} sx={{ mt: 0.5 }} />
              </Box>
              <Skeleton variant="text" width={60} height={16} />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Shimmer effect for checklist stats card
 */
export const ChecklistStatsSkeleton = () => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Skeleton variant="text" width="50%" height={28} />
          <Skeleton variant="rectangular" width={70} height={28} />
        </Box>

        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width="20%" height={20} />
          </Box>
          <Skeleton variant="rectangular" width="100%" height={8} sx={{ borderRadius: 1 }} />
        </Box>

        <Skeleton variant="text" width="60%" height={16} />
      </CardContent>
    </Card>
  );
};

/**
 * Complete dashboard shimmer with all components
 */
export const DashboardShimmer = ({ canManageEmployees = true }) => {
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCardSkeleton />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCardSkeleton />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCardSkeleton />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCardSkeleton />
        </Grid>
      </Grid>

      {/* Checklist Stats (if employee manager) */}
      {canManageEmployees && (
        <Box sx={{ mb: 4 }}>
          <ChecklistStatsSkeleton />
        </Box>
      )}

      {/* Recent Sales and Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <RecentSalesSkeleton />
        </Grid>
        <Grid item xs={12} lg={4}>
          <RecentActivitySkeleton />
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardShimmer;

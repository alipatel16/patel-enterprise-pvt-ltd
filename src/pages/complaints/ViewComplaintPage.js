// src/pages/complaints/ViewComplaintPage.js - Updated with all new fields
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  alpha
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  Assignment as CompanyIcon,
  CalendarToday as CalendarIcon,
  ShoppingCart as PurchaseIcon,
  Build as ModelIcon,
  Fingerprint as SerialIcon,
  Description as DescriptionIcon,
  Place as PincodeIcon,
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import EditComplaintDialog from '../../components/complaints/EditComplaintDialog';
import {
  COMPLAINT_STATUS_DISPLAY,
  COMPLAINT_SEVERITY_DISPLAY,
  COMPLAINT_CATEGORY_DISPLAY,
  ASSIGNEE_TYPE_DISPLAY,
  getComplaintSeverityColor,
  getComplaintStatusColor,
  isComplaintOverdue
} from '../../utils/constants/appConstants';
import { useUserType } from '../../contexts/UserTypeContext';
import { formatDate, formatDateTime } from '../../utils/helpers/formatHelpers';
import complaintService from '../../services/api/complaintService';

const ViewComplaintPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userType } = useUserType();

  // State
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Helper function to parse structured description
  const parseDescription = (description) => {
    if (!description) return { model: '', serialNumber: '', reason: '' };

    const lines = description.split('\n');
    let model = '';
    let serialNumber = '';
    let reason = '';

    lines.forEach(line => {
      if (line.startsWith('Model:')) {
        model = line.replace('Model:', '').trim();
      } else if (line.startsWith('Serial Number:')) {
        serialNumber = line.replace('Serial Number:', '').trim();
      } else if (line.startsWith('Reason/Problem:')) {
        reason = line.replace('Reason/Problem:', '').trim();
      } else if (!line.startsWith('Model:') && !line.startsWith('Serial Number:') && line.trim()) {
        // If no structured format, treat content as reason
        if (!reason) {
          reason = description;
        }
      }
    });

    return { model, serialNumber, reason };
  };

  // Load complaint data
  useEffect(() => {
    if (id && userType) {
      loadComplaint();
    }
  }, [id, userType]);

  const loadComplaint = async () => {
    try {
      setLoading(true);
      setError('');
      const complaintData = await complaintService.getComplaintById(userType, id);
      
      if (!complaintData) {
        setError('Complaint not found');
        return;
      }
      
      setComplaint(complaintData);
    } catch (error) {
      console.error('Error loading complaint:', error);
      setError('Failed to load complaint details');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit complaint
  const handleEditComplaint = () => {
    setEditDialogOpen(true);
  };

  // Handle complaint update
  const handleComplaintUpdated = () => {
    setEditDialogOpen(false);
    loadComplaint(); // Reload to get updated data
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (error || !complaint) {
    return (
      <Layout>
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            {error || 'Complaint not found'}
          </Alert>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/complaints')}
            sx={{ mt: 2 }}
          >
            Back to Complaints
          </Button>
        </Box>
      </Layout>
    );
  }

  const isOverdue = isComplaintOverdue(complaint.expectedResolutionDate, complaint.status);
  const parsedDescription = parseDescription(complaint.description);

  const breadcrumbs = [
    {
      label: "Complaints",
      path: "/complaints",
    },
    {
      label: complaint.complaintNumber,
      path: `/complaints/view/${id}`,
    },
  ];

  return (
    <Layout title="View Complaint" breadcrumbs={breadcrumbs}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton
              onClick={() => navigate('/complaints')}
              sx={{ mr: 1 }}
            >
              <BackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight={600} sx={{ flexGrow: 1 }}>
              Complaint Details
            </Typography>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEditComplaint}
            >
              Edit Complaint
            </Button>
          </Box>

          {/* Complaint Number and Status */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6" color="primary" fontWeight={600}>
              {complaint.complaintNumber}
            </Typography>
            
            <Chip
              label={COMPLAINT_STATUS_DISPLAY[complaint.status]}
              sx={{
                backgroundColor: alpha(getComplaintStatusColor(complaint.status), 0.1),
                color: getComplaintStatusColor(complaint.status),
                fontWeight: 600,
                border: `1px solid ${alpha(getComplaintStatusColor(complaint.status), 0.3)}`
              }}
            />
            
            <Chip
              label={COMPLAINT_SEVERITY_DISPLAY[complaint.severity]}
              sx={{
                backgroundColor: alpha(getComplaintSeverityColor(complaint.severity), 0.1),
                color: getComplaintSeverityColor(complaint.severity),
                fontWeight: 600,
                border: `1px solid ${alpha(getComplaintSeverityColor(complaint.severity), 0.3)}`
              }}
            />

            {isOverdue && (
              <Chip
                icon={<WarningIcon />}
                label="Overdue"
                color="error"
                variant="outlined"
              />
            )}

            {/* Company Complaint Number Badge */}
            {complaint.assigneeType === 'service_person' && complaint.companyComplaintNumber && (
              <Chip
                icon={<CompanyIcon />}
                label={`Company: ${complaint.companyComplaintNumber}`}
                color="info"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Complaint Details */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Complaint Information
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {complaint.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Category: {COMPLAINT_CATEGORY_DISPLAY[complaint.category]}
                  </Typography>
                </Box>

                {/* Product Details Section */}
                <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom color="primary">
                    Product Details
                  </Typography>
                  <Grid container spacing={2}>
                    {parsedDescription.model && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ModelIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Model
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {parsedDescription.model}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}

                    {parsedDescription.serialNumber && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SerialIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Serial Number
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {parsedDescription.serialNumber}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}

                    {complaint.purchaseDate && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PurchaseIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Purchase Date
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {formatDate(complaint.purchaseDate)}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Box>

                {/* Problem/Reason */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <DescriptionIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2" fontWeight={600}>
                      Problem/Reason
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ pl: 4 }}>
                    {parsedDescription.reason || complaint.description}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Expected Resolution Date
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatDate(complaint.expectedResolutionDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Created Date
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {formatDate(complaint.createdAt)}
                    </Typography>
                  </Grid>
                  {complaint.updatedAt && complaint.updatedAt !== complaint.createdAt && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Last Updated
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formatDate(complaint.updatedAt)}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Status History */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Status History
                </Typography>

                {complaint.statusHistory && complaint.statusHistory.length > 0 ? (
                  <Stack spacing={2}>
                    {complaint.statusHistory.map((history, index) => (
                      <Paper key={index} elevation={1} sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: getComplaintStatusColor(history.status)
                            }}
                          />
                          <Typography variant="body1" fontWeight={600}>
                            {COMPLAINT_STATUS_DISPLAY[history.status]}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ marginLeft: 'auto' }}>
                            {formatDateTime(history.changedAt)}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Changed by {history.changedByName}
                        </Typography>
                        
                        {history.remarks && (
                          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                            "{history.remarks}"
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No status history available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* Customer Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Customer Information
                </Typography>

                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="action" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Customer Name
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {complaint.customerName}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon color="action" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Phone Number
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {complaint.customerPhone}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <LocationIcon color="action" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {complaint.customerAddress}
                      </Typography>
                    </Box>
                  </Box>

                  {complaint.customerPincode && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PincodeIcon color="action" />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Pincode
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {complaint.customerPincode}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Assignment Information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Assignment
                </Typography>

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Assignment Type
                    </Typography>
                    <Chip
                      label={ASSIGNEE_TYPE_DISPLAY[complaint.assigneeType]}
                      size="small"
                      variant="outlined"
                      icon={complaint.assigneeType === 'employee' ? <PersonIcon /> : <BusinessIcon />}
                    />
                  </Box>

                  {complaint.assigneeType === 'employee' ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Assigned Employee
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {complaint.assignedEmployeeName || 'Unassigned'}
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Service Person Name
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {complaint.servicePersonName || 'Not specified'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Service Person Contact
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {complaint.servicePersonContact || 'Not specified'}
                        </Typography>
                      </Box>
                      
                      {/* Company Complaint Details */}
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Company Complaint Details
                      </Typography>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Company Complaint Number
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {complaint.companyComplaintNumber || (
                            <span style={{ color: 'gray', fontStyle: 'italic' }}>
                              Not provided yet
                            </span>
                          )}
                        </Typography>
                      </Box>
                      
                      {complaint.companyComplaintNumber && complaint.companyRecordedDate && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Company Recorded Date
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {formatDate(complaint.companyRecordedDate)}
                          </Typography>
                        </Box>
                      )}
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Quick Actions
                </Typography>

                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PhoneIcon />}
                    href={`tel:${complaint.customerPhone}`}
                  >
                    Call Customer
                  </Button>
                  
                  {complaint.assigneeType === 'service_person' && complaint.servicePersonContact && (
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<PhoneIcon />}
                      href={`tel:${complaint.servicePersonContact}`}
                    >
                      Call Service Person
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<EditIcon />}
                    onClick={handleEditComplaint}
                  >
                    Edit Complaint
                  </Button>

                  {complaint.assigneeType === 'service_person' && !complaint.companyComplaintNumber && (
                    <Button
                      variant="outlined"
                      fullWidth
                      color="warning"
                      startIcon={<CompanyIcon />}
                      onClick={handleEditComplaint}
                    >
                      Add Company Details
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Edit Dialog */}
        {complaint && (
          <EditComplaintDialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            complaint={complaint}
            onComplaintUpdated={handleComplaintUpdated}
          />
        )}
      </Box>
    </Layout>
  );
};

export default ViewComplaintPage;
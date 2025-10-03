import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Divider,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  AdminPanelSettings as DefaultIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import { useUserType } from '../../contexts/UserTypeContext';
import brandHierarchyService from '../../services/api/BrandHierarchyService';

const ComplaintSettingsPage = () => {
  const navigate = useNavigate();
  const { userType } = useUserType();

  // State
  const [brands, setBrands] = useState([]);
  const [defaultHierarchy, setDefaultHierarchy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandName, setBrandName] = useState('');
  const [hierarchy, setHierarchy] = useState([]);
  const [dialogError, setDialogError] = useState('');

  // Default hierarchy dialog state
  const [defaultDialogOpen, setDefaultDialogOpen] = useState(false);
  const [defaultName, setDefaultName] = useState('');
  const [defaultContact, setDefaultContact] = useState('');
  const [defaultDialogError, setDefaultDialogError] = useState('');

  // Check if electronics usertype
  useEffect(() => {
    if (userType !== 'electronics') {
      setError('Brand hierarchy settings are only available for Electronics store');
      setLoading(false);
      return;
    }
    loadBrands();
    loadDefaultHierarchy();
  }, [userType]);

  // Load brands
  const loadBrands = async () => {
    try {
      setLoading(true);
      setError('');
      const brandsData = await brandHierarchyService.getAllBrands(userType);
      setBrands(brandsData);
    } catch (error) {
      console.error('Error loading brands:', error);
      setError('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  // Load default hierarchy
  const loadDefaultHierarchy = async () => {
    try {
      const defaultData = await brandHierarchyService.getDefaultHierarchy(userType);
      setDefaultHierarchy(defaultData);
    } catch (error) {
      console.error('Error loading default hierarchy:', error);
    }
  };

  // Open default hierarchy dialog
  const handleOpenDefaultDialog = () => {
    if (defaultHierarchy) {
      setDefaultName(defaultHierarchy.name);
      setDefaultContact(defaultHierarchy.contact);
    } else {
      setDefaultName('');
      setDefaultContact('');
    }
    setDefaultDialogError('');
    setDefaultDialogOpen(true);
  };

  // Close default hierarchy dialog
  const handleCloseDefaultDialog = () => {
    setDefaultDialogOpen(false);
    setDefaultName('');
    setDefaultContact('');
    setDefaultDialogError('');
  };

  // Save default hierarchy
  const handleSaveDefaultHierarchy = async () => {
    try {
      setDefaultDialogError('');

      // Validate
      if (!defaultName.trim()) {
        setDefaultDialogError('Service person name is required');
        return;
      }
      if (!defaultContact.trim() || !/^[6-9]\d{9}$/.test(defaultContact)) {
        setDefaultDialogError('Valid 10-digit mobile number is required');
        return;
      }

      await brandHierarchyService.saveDefaultHierarchy(userType, {
        name: defaultName.trim(),
        contact: defaultContact.trim()
      });

      setSuccess('Default hierarchy saved successfully');
      handleCloseDefaultDialog();
      loadDefaultHierarchy();
    } catch (error) {
      console.error('Error saving default hierarchy:', error);
      setDefaultDialogError(error.message || 'Failed to save default hierarchy');
    }
  };

  // Delete default hierarchy
  const handleDeleteDefaultHierarchy = async () => {
    if (!window.confirm('Are you sure you want to delete the default hierarchy?')) {
      return;
    }

    try {
      setError('');
      await brandHierarchyService.deleteDefaultHierarchy(userType);
      setSuccess('Default hierarchy deleted successfully');
      setDefaultHierarchy(null);
    } catch (error) {
      console.error('Error deleting default hierarchy:', error);
      setError('Failed to delete default hierarchy');
    }
  };

  // Open dialog for new brand
  const handleAddBrand = () => {
    setEditingBrand(null);
    setBrandName('');
    setHierarchy([]);
    setDialogError('');
    setDialogOpen(true);
  };

  // Open dialog for editing brand
  const handleEditBrand = (brand) => {
    setEditingBrand(brand);
    setBrandName(brand.brandName);
    setHierarchy(brand.hierarchy || []);
    setDialogError('');
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBrand(null);
    setBrandName('');
    setHierarchy([]);
    setDialogError('');
  };

  // Add hierarchy level
  const handleAddHierarchyLevel = () => {
    setHierarchy([...hierarchy, { name: '', contact: '' }]);
  };

  // Update hierarchy level
  const handleUpdateHierarchyLevel = (index, field, value) => {
    const updatedHierarchy = [...hierarchy];
    updatedHierarchy[index][field] = value;
    setHierarchy(updatedHierarchy);
  };

  // Remove hierarchy level
  const handleRemoveHierarchyLevel = (index) => {
    const updatedHierarchy = hierarchy.filter((_, i) => i !== index);
    setHierarchy(updatedHierarchy);
  };

  // Save brand
  const handleSaveBrand = async () => {
    try {
      setDialogError('');

      // Validate
      if (!brandName.trim()) {
        setDialogError('Brand name is required');
        return;
      }

      // Filter out empty hierarchy levels
      const validHierarchy = hierarchy.filter(
        level => level.name.trim() && level.contact.trim()
      );

      const brandData = {
        id: editingBrand?.id,
        brandName: brandName.trim(),
        hierarchy: validHierarchy,
        createdAt: editingBrand?.createdAt
      };

      await brandHierarchyService.saveBrand(userType, brandData);
      
      setSuccess(editingBrand 
        ? 'Brand updated successfully' 
        : 'Brand created successfully'
      );
      
      handleCloseDialog();
      loadBrands();

    } catch (error) {
      console.error('Error saving brand:', error);
      setDialogError(error.message || 'Failed to save brand');
    }
  };

  // Delete brand
  const handleDeleteBrand = async (brandId) => {
    if (!window.confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
      return;
    }

    try {
      setError('');
      await brandHierarchyService.deleteBrand(userType, brandId);
      setSuccess('Brand deleted successfully');
      loadBrands();
    } catch (error) {
      console.error('Error deleting brand:', error);
      setError('Failed to delete brand');
    }
  };

  const breadcrumbs = [
    {
      label: "Complaint Management",
      path: "/complaints",
    },
    {
      label: "Settings",
      path: "/complaints/settings",
    },
  ];

  if (userType !== 'electronics') {
    return (
      <Layout title="Complaint Settings" breadcrumbs={breadcrumbs}>
        <Box sx={{ p: 3 }}>
          <Alert severity="warning">
            Brand hierarchy settings are only available for Electronics store.
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

  return (
    <Layout title="Complaint Settings" breadcrumbs={breadcrumbs}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton onClick={() => navigate('/complaints')}>
                <BackIcon />
              </IconButton>
              <Typography variant="h5" fontWeight={600}>
                Complaint Settings - Brand Hierarchy
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddBrand}
            >
              Add Brand
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            Configure brands and their service hierarchy. When recording a complaint, if the title contains a brand name, 
            the first level of hierarchy will be automatically assigned as the external service person.
          </Alert>
        </Box>

        {/* Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Default Hierarchy Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DefaultIcon color="primary" />
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Default Hierarchy (Final Escalation Level)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This is the final escalation level applied to all brands when their specific hierarchy is exhausted
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                startIcon={defaultHierarchy ? <EditIcon /> : <AddIcon />}
                onClick={handleOpenDefaultDialog}
              >
                {defaultHierarchy ? 'Edit Default' : 'Set Default'}
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            {defaultHierarchy ? (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    label="Default Level"
                    size="small"
                    color="secondary"
                    variant="outlined"
                  />
                  <Typography variant="body1">
                    <strong>{defaultHierarchy.name}</strong> - {defaultHierarchy.contact}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={handleDeleteDefaultHierarchy}
                  color="error"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Alert severity="warning">
                No default hierarchy defined. Set a default hierarchy to enable final escalation for all brands.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Brands Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="30%">Brand Name</TableCell>
                    <TableCell width="60%">Service Hierarchy</TableCell>
                    <TableCell width="10%" align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ mt: 2 }}>
                          Loading brands...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : brands.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                        <SettingsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No brands configured
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Add your first brand to get started
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    brands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell>
                          <Typography variant="body1" fontWeight={500}>
                            {brand.brandName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {brand.hierarchy && brand.hierarchy.length > 0 ? (
                            <Stack spacing={1}>
                              {brand.hierarchy.map((level, index) => (
                                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip
                                    label={`Level ${index + 1}`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                  <Typography variant="body2">
                                    {level.name} - {level.contact}
                                  </Typography>
                                </Box>
                              ))}
                              {defaultHierarchy && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    ↓ Then escalates to:
                                  </Typography>
                                  <Chip
                                    label="Default Level"
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                  />
                                  <Typography variant="body2" color="text.secondary">
                                    {defaultHierarchy.name} - {defaultHierarchy.contact}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          ) : (
                            <Stack spacing={1}>
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                No brand-specific hierarchy
                              </Typography>
                              {defaultHierarchy && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Chip
                                    label="Default Level"
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                  />
                                  <Typography variant="body2" color="text.secondary">
                                    {defaultHierarchy.name} - {defaultHierarchy.contact}
                                  </Typography>
                                </Box>
                              )}
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleEditBrand(brand)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteBrand(brand.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Default Hierarchy Dialog */}
        <Dialog
          open={defaultDialogOpen}
          onClose={handleCloseDefaultDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight={600}>
              {defaultHierarchy ? 'Edit Default Hierarchy' : 'Set Default Hierarchy'}
            </Typography>
          </DialogTitle>

          <DialogContent dividers>
            <Box sx={{ py: 1 }}>
              {defaultDialogError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {defaultDialogError}
                </Alert>
              )}

              <Alert severity="info" sx={{ mb: 3 }}>
                This service person will be the final escalation level for all brands after their specific hierarchy levels are exhausted.
              </Alert>

              <TextField
                label="Service Person Name"
                value={defaultName}
                onChange={(e) => setDefaultName(e.target.value)}
                fullWidth
                required
                sx={{ mb: 2 }}
              />

              <TextField
                label="Mobile Number"
                value={defaultContact}
                onChange={(e) => setDefaultContact(e.target.value)}
                fullWidth
                required
                inputProps={{ maxLength: 10 }}
                helperText="Enter 10-digit mobile number"
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDefaultDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveDefaultHierarchy}
              variant="contained"
              startIcon={<SaveIcon />}
            >
              Save Default
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add/Edit Brand Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6" fontWeight={600}>
              {editingBrand ? 'Edit Brand' : 'Add Brand'}
            </Typography>
          </DialogTitle>

          <DialogContent dividers>
            <Box sx={{ py: 1 }}>
              {dialogError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {dialogError}
                </Alert>
              )}

              {/* Brand Name */}
              <TextField
                label="Brand Name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                fullWidth
                required
                sx={{ mb: 3 }}
                helperText="Enter the brand name (e.g., LG, Samsung, Sony)"
              />

              <Divider sx={{ my: 2 }} />

              {/* Hierarchy Section */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Brand-Specific Service Hierarchy (Optional)
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddHierarchyLevel}
                    size="small"
                    variant="outlined"
                  >
                    Add Level
                  </Button>
                </Box>

                {hierarchy.length === 0 ? (
                  <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      No brand-specific hierarchy levels defined. Click "Add Level" to add service persons.
                    </Typography>
                  </Paper>
                ) : (
                  <Stack spacing={2}>
                    {hierarchy.map((level, index) => (
                      <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Chip
                            label={`Level ${index + 1}`}
                            size="small"
                            color="primary"
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveHierarchyLevel(index)}
                            color="error"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <TextField
                            label="Service Person Name"
                            value={level.name}
                            onChange={(e) => handleUpdateHierarchyLevel(index, 'name', e.target.value)}
                            fullWidth
                            size="small"
                            required
                          />
                          <TextField
                            label="Mobile Number"
                            value={level.contact}
                            onChange={(e) => handleUpdateHierarchyLevel(index, 'contact', e.target.value)}
                            fullWidth
                            size="small"
                            required
                            inputProps={{ maxLength: 10 }}
                            helperText="10-digit mobile"
                          />
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                When a complaint title contains this brand name, Level 1 will be automatically assigned 
                as the external service person. You can escalate through levels during complaint editing.
                {defaultHierarchy && ' After all brand-specific levels are exhausted, it will escalate to the default hierarchy level.'}
              </Alert>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveBrand}
              variant="contained"
              startIcon={<SaveIcon />}
            >
              Save Brand
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default ComplaintSettingsPage;
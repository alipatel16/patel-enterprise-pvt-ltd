// src/pages/gifts/GiftSettingsPage.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CardGiftcard as GiftIcon,
  Close as CloseIcon
} from '@mui/icons-material';

import Layout from '../../components/common/Layout/Layout';
import { GiftSettingsProvider, useGiftSettings } from '../../contexts/GiftSettingsContext/GiftSettingsContext';

const GiftSettingsPageContent = () => {
  const {
    giftSets,
    loading,
    error,
    loadGiftSets,
    createGiftSet,
    updateGiftSet,
    deleteGiftSet,
    checkGiftSetUsage
  } = useGiftSettings();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    items: []
  });
  const [itemInput, setItemInput] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const breadcrumbs = [
    { label: 'Gifts', path: '/gifts' },
    { label: 'Gift Settings', path: '/gifts/settings' }
  ];

  useEffect(() => {
    loadGiftSets();
  }, [loadGiftSets]);

  const handleOpenDialog = (set = null) => {
    if (set) {
      setEditingSet(set);
      setFormData({
        title: set.title,
        items: [...set.items]
      });
    } else {
      setEditingSet(null);
      setFormData({
        title: '',
        items: []
      });
    }
    setDialogOpen(true);
    setSubmitError(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSet(null);
    setFormData({ title: '', items: [] });
    setItemInput('');
    setSubmitError(null);
  };

  const handleAddItem = () => {
    if (itemInput.trim()) {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, itemInput.trim()]
      }));
      setItemInput('');
    }
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setSubmitError('Gift set title is required');
      return;
    }

    if (formData.items.length === 0) {
      setSubmitError('At least one item is required');
      return;
    }

    try {
      if (editingSet) {
        await updateGiftSet(editingSet.id, formData);
      } else {
        await createGiftSet(formData);
      }
      handleCloseDialog();
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  const handleDeleteClick = async (set) => {
    const isInUse = await checkGiftSetUsage(set.id);
    if (isInUse) {
      setSubmitError('Cannot delete gift set that is being used in gift invoices');
      return;
    }
    setSetToDelete(set);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (setToDelete) {
      try {
        await deleteGiftSet(setToDelete.id);
        setDeleteDialogOpen(false);
        setSetToDelete(null);
      } catch (err) {
        setSubmitError(err.message);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSetToDelete(null);
  };

  return (
    <Layout title="Gift Settings" breadcrumbs={breadcrumbs}>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold">
            Gift Sets
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create Gift Set
          </Button>
        </Box>

        {/* Error Alert */}
        {(error || submitError) && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
            {error || submitError}
          </Alert>
        )}

        {/* Loading State */}
        {loading && giftSets.length === 0 ? (
          <Box display="flex" justifyContent="center" py={5}>
            <CircularProgress />
          </Box>
        ) : giftSets.length === 0 ? (
          <Card>
            <CardContent>
              <Box textAlign="center" py={5}>
                <GiftIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Gift Sets Created
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Create your first gift set to start managing gift invoices
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Create Gift Set
                </Button>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {giftSets.map((set) => (
              <Grid item xs={12} md={6} lg={4} key={set.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6" fontWeight="bold">
                        {set.title}
                      </Typography>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(set)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(set)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Items ({set.items.length}):
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {set.items.map((item, index) => (
                        <Chip
                          key={index}
                          label={item}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create/Edit Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingSet ? 'Edit Gift Set' : 'Create Gift Set'}
          </DialogTitle>
          <DialogContent>
            <Box pt={1}>
              {submitError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {submitError}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Gift Set Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                margin="normal"
                required
              />

              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Gift Items
                </Typography>
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter item name"
                    value={itemInput}
                    onChange={(e) => setItemInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddItem}
                    disabled={!itemInput.trim()}
                  >
                    Add
                  </Button>
                </Box>

                {formData.items.length > 0 && (
                  <List dense>
                    {formData.items.map((item, index) => (
                      <ListItem key={index}>
                        <ListItemText primary={item} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              disabled={loading}
            >
              {editingSet ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
          <DialogTitle>Delete Gift Set</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{setToDelete?.title}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel}>Cancel</Button>
            <Button 
              onClick={handleDeleteConfirm} 
              color="error" 
              variant="contained"
              disabled={loading}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

const GiftSettingsPage = () => {
  return (
    <GiftSettingsProvider>
      <GiftSettingsPageContent />
    </GiftSettingsProvider>
  );
};

export default GiftSettingsPage;
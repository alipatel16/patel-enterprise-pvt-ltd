import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  IconButton,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Alert,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';

import FormField from '../../common/Forms/FormField';
import { formatCurrency } from '../../../utils/helpers/formatHelpers';

/**
 * Item details component for invoice form
 * @param {Object} props
 * @param {array} props.items - Invoice items
 * @param {function} props.onChange - Items change handler
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Whether items are required
 * @param {boolean} props.readOnly - Whether items are read-only
 */
const ItemDetails = ({
  items = [],
  onChange,
  error,
  required = true,
  readOnly = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    quantity: 1,
    price: 0,
    unit: 'pcs'
  });
  const [itemErrors, setItemErrors] = useState({});

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    return {
      subtotal,
      totalItems: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0)
    };
  };

  const totals = calculateTotals();

  // Handle item form change
  const handleItemFormChange = (field) => (value) => {
    setItemForm(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error
    if (itemErrors[field]) {
      setItemErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Validate item form
  const validateItemForm = () => {
    const errors = {};
    
    if (!itemForm.name.trim()) {
      errors.name = 'Item name is required';
    }
    
    if (!itemForm.quantity || itemForm.quantity <= 0) {
      errors.quantity = 'Quantity must be greater than 0';
    }
    
    if (!itemForm.price || itemForm.price <= 0) {
      errors.price = 'Price must be greater than 0';
    }
    
    setItemErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add new item
  const handleAddItem = () => {
    if (!validateItemForm()) {
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      ...itemForm,
      total: itemForm.quantity * itemForm.price
    };

    const updatedItems = [...items, newItem];
    onChange(updatedItems);

    // Reset form
    setItemForm({
      name: '',
      description: '',
      quantity: 1,
      price: 0,
      unit: 'pcs'
    });
    setItemErrors({});
  };

  // Update existing item
  const handleUpdateItem = () => {
    if (!validateItemForm()) {
      return;
    }

    const updatedItems = items.map(item => 
      item.id === editingItem.id 
        ? {
            ...item,
            ...itemForm,
            total: itemForm.quantity * itemForm.price
          }
        : item
    );

    onChange(updatedItems);
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      quantity: 1,
      price: 0,
      unit: 'pcs'
    });
    setItemErrors({});
  };

  // Edit item
  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      price: item.price,
      unit: item.unit || 'pcs'
    });
    setItemErrors({});
  };

  // Delete item
  const handleDeleteItem = (itemId) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    onChange(updatedItems);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      description: '',
      quantity: 1,
      price: 0,
      unit: 'pcs'
    });
    setItemErrors({});
  };

  // Quick add common items (could be configurable)
  const quickAddItems = [
    { name: 'Service Charge', price: 100 },
    { name: 'Installation', price: 500 },
    { name: 'Delivery Charge', price: 200 },
    { name: 'Maintenance', price: 300 }
  ];

  const handleQuickAdd = (quickItem) => {
    setItemForm(prev => ({
      ...prev,
      name: quickItem.name,
      price: quickItem.price
    }));
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Item Details
        {required && <span style={{ color: theme.palette.error.main }}>*</span>}
      </Typography>

      {/* Add/Edit Item Form */}
      {!readOnly && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {editingItem ? 'Edit Item' : 'Add Item'}
            </Typography>

            <Grid container spacing={2}>
              {/* Item Name */}
              <Grid item xs={12} sm={6}>
                <FormField
                  label="Item Name"
                  value={itemForm.name}
                  onChange={handleItemFormChange('name')}
                  error={itemErrors.name}
                  required
                  placeholder="Enter item name"
                />
              </Grid>

              {/* Unit */}
              <Grid item xs={12} sm={6}>
                <FormField
                  type="select"
                  label="Unit"
                  value={itemForm.unit}
                  onChange={handleItemFormChange('unit')}
                  options={[
                    { value: 'pcs', label: 'Pieces' },
                    { value: 'kg', label: 'Kilograms' },
                    { value: 'ltr', label: 'Liters' },
                    { value: 'mtr', label: 'Meters' },
                    { value: 'sqft', label: 'Square Feet' },
                    { value: 'box', label: 'Boxes' },
                    { value: 'set', label: 'Sets' }
                  ]}
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <FormField
                  label="Description (Optional)"
                  value={itemForm.description}
                  onChange={handleItemFormChange('description')}
                  multiline
                  rows={2}
                  placeholder="Enter item description"
                />
              </Grid>

              {/* Quantity */}
              <Grid item xs={12} sm={4}>
                <FormField
                  type="number"
                  label="Quantity"
                  value={itemForm.quantity}
                  onChange={handleItemFormChange('quantity')}
                  error={itemErrors.quantity}
                  required
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>

              {/* Price */}
              <Grid item xs={12} sm={4}>
                <FormField
                  type="number"
                  label="Price per Unit"
                  value={itemForm.price}
                  onChange={handleItemFormChange('price')}
                  error={itemErrors.price}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                  startAdornment="₹"
                />
              </Grid>

              {/* Total */}
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Total Amount"
                  value={formatCurrency(itemForm.quantity * itemForm.price)}
                  disabled
                  fullWidth
                  variant="outlined"
                />
              </Grid>
            </Grid>

            {/* Quick Add Buttons */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Quick Add:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {quickAddItems.map((item, index) => (
                  <Button
                    key={index}
                    size="small"
                    variant="outlined"
                    onClick={() => handleQuickAdd(item)}
                  >
                    {item.name} (₹{item.price})
                  </Button>
                ))}
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              {editingItem ? (
                <>
                  <Button
                    variant="contained"
                    onClick={handleUpdateItem}
                    startIcon={<EditIcon />}
                  >
                    Update Item
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleAddItem}
                  startIcon={<AddIcon />}
                >
                  Add Item
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      {items.length > 0 ? (
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[50] }}>
                <TableCell>#</TableCell>
                <TableCell>Item</TableCell>
                {!isMobile && <TableCell>Description</TableCell>}
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Total</TableCell>
                {!readOnly && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {item.name}
                    </Typography>
                    {isMobile && item.description && (
                      <Typography variant="caption" color="text.secondary">
                        {item.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      per {item.unit || 'pcs'}
                    </Typography>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {item.description || '-'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    {formatCurrency(item.quantity * item.price)}
                  </TableCell>
                  {!readOnly && (
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEditItem(item)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteItem(item.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            No items added yet. Add items to create the invoice.
          </Typography>
        </Alert>
      )}

      {/* Summary */}
      {items.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Summary
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Total Items
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {totals.totalItems}
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Total Quantity
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {totals.totalQuantity}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal (before taxes)
                </Typography>
                <Typography variant="h5" fontWeight={700} color="primary">
                  {formatCurrency(totals.subtotal)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default ItemDetails;
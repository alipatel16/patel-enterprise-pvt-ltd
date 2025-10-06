// src/pages/deliveries/PendingDeliveriesTab.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  TextField,
  InputAdornment,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  LocalShipping as DeliveryIcon,
  Schedule as ScheduleIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CompleteIcon,
} from "@mui/icons-material";
import { format, differenceInDays } from "date-fns";
import { useSales } from "../../contexts/SalesContext/SalesContext";
import { useUserType } from "../../contexts/UserTypeContext/UserTypeContext";
import { DELIVERY_STATUS } from "../../utils/constants/appConstants";
import LoadingSpinner from "../../components/common/UI/LoadingSpinner";

const PendingDeliveriesTab = () => {
  const navigate = useNavigate();
  const { sales, loading, updateDeliveryStatus } = useSales();
  const { getThemeColors } = useUserType();
  const themeColors = getThemeColors();

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [markDeliveredDialog, setMarkDeliveredDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [markingDelivered, setMarkingDelivered] = useState(false);

  // Filter deliveries: ALL pending + ALL scheduled
  useEffect(() => {
    if (sales && sales.length > 0) {
      let filtered = sales.filter((sale) => {
        // Include ALL pending deliveries
        if (sale.deliveryStatus === DELIVERY_STATUS.PENDING) {
          return true;
        }

        // Include ALL scheduled deliveries (no date restriction)
        if (sale.deliveryStatus === DELIVERY_STATUS.SCHEDULED) {
          return true;
        }

        return false;
      });

      // Apply search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (delivery) =>
            delivery.invoiceNumber?.toLowerCase().includes(term) ||
            delivery.customerName?.toLowerCase().includes(term) ||
            delivery.customerPhone?.includes(term)
        );
      }

      // Sort: pending first, then by scheduled date (earliest first), then by creation date
      filtered.sort((a, b) => {
        // Pending items come first
        if (a.deliveryStatus === DELIVERY_STATUS.PENDING && b.deliveryStatus !== DELIVERY_STATUS.PENDING) {
          return -1;
        }
        if (a.deliveryStatus !== DELIVERY_STATUS.PENDING && b.deliveryStatus === DELIVERY_STATUS.PENDING) {
          return 1;
        }
        
        // For scheduled items, sort by scheduled date
        if (a.scheduledDeliveryDate && b.scheduledDeliveryDate) {
          return new Date(a.scheduledDeliveryDate) - new Date(b.scheduledDeliveryDate);
        }
        
        // If only one has scheduled date, prioritize it
        if (a.scheduledDeliveryDate && !b.scheduledDeliveryDate) {
          return -1;
        }
        if (!a.scheduledDeliveryDate && b.scheduledDeliveryDate) {
          return 1;
        }
        
        // Finally sort by creation date (newest first)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setFilteredDeliveries(filtered);
    }
  }, [sales, searchTerm]);

  const handleMarkDelivered = (invoice) => {
    setSelectedInvoice(invoice);
    setMarkDeliveredDialog(true);
  };

  const confirmMarkDelivered = async () => {
    if (!selectedInvoice) return;

    setMarkingDelivered(true);
    try {
      await updateDeliveryStatus(
        selectedInvoice.id,
        DELIVERY_STATUS.DELIVERED,
        {
          deliveryDate: new Date().toISOString(),
        }
      );

      setMarkDeliveredDialog(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error("Error marking delivery as complete:", error);
      alert("Failed to mark delivery as complete. Please try again.");
    } finally {
      setMarkingDelivered(false);
    }
  };

  const getDaysUntilDelivery = (scheduledDate) => {
    if (!scheduledDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduled = new Date(scheduledDate);
    scheduled.setHours(0, 0, 0, 0);
    return differenceInDays(scheduled, today);
  };

  const getDeliveryUrgency = (delivery) => {
    if (delivery.deliveryStatus === DELIVERY_STATUS.PENDING) {
      return { color: "error", label: "Pending", icon: DeliveryIcon };
    }

    const daysUntil = getDaysUntilDelivery(delivery.scheduledDeliveryDate);
    
    if (daysUntil === null) {
      return { color: "info", label: "Scheduled", icon: ScheduleIcon };
    }
    
    if (daysUntil < 0) {
      const daysOverdue = Math.abs(daysUntil);
      return { color: "error", label: `Overdue (${daysOverdue} day${daysOverdue > 1 ? 's' : ''})`, icon: DeliveryIcon };
    }
    
    if (daysUntil === 0) {
      return { color: "error", label: "Today", icon: DeliveryIcon };
    }
    
    if (daysUntil === 1) {
      return { color: "warning", label: "Tomorrow", icon: ScheduleIcon };
    }
    
    if (daysUntil <= 3) {
      return { color: "warning", label: `In ${daysUntil} days`, icon: ScheduleIcon };
    }
    
    if (daysUntil <= 7) {
      return { color: "info", label: `In ${daysUntil} days`, icon: ScheduleIcon };
    }
    
    return { color: "default", label: `In ${daysUntil} days`, icon: ScheduleIcon };
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const pendingCount = filteredDeliveries.filter(d => d.deliveryStatus === DELIVERY_STATUS.PENDING).length;
  const scheduledCount = filteredDeliveries.filter(d => d.deliveryStatus === DELIVERY_STATUS.SCHEDULED).length;

  return (
    <Box>
      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by invoice number, customer name, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Summary */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Chip
          icon={<DeliveryIcon />}
          label={`${pendingCount} pending`}
          color="error"
          variant="outlined"
        />
        <Chip
          icon={<ScheduleIcon />}
          label={`${scheduledCount} scheduled`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {searchTerm
            ? "No deliveries found matching your search."
            : "No pending or scheduled deliveries at this time."}
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {filteredDeliveries.map((delivery) => {
            const urgency = getDeliveryUrgency(delivery);
            const UrgencyIcon = urgency.icon;

            return (
              <Grid item xs={12} key={delivery.id}>
                <Card
                  sx={{
                    borderLeft: 4,
                    borderColor: `${urgency.color}.main`,
                    transition: "all 0.2s",
                    "&:hover": {
                      boxShadow: 4,
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      {/* Urgency Badge */}
                      <Grid item xs={12} sm={2}>
                        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                          <UrgencyIcon sx={{ fontSize: 40, color: `${urgency.color}.main` }} />
                          <Chip
                            label={urgency.label}
                            color={urgency.color}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Grid>

                      {/* Delivery Details */}
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <ReceiptIcon fontSize="small" color="action" />
                            <Typography variant="h6" fontWeight={600}>
                              {delivery.invoiceNumber}
                            </Typography>
                          </Box>

                          <Typography variant="body1" color="text.primary" gutterBottom>
                            {delivery.customerName}
                          </Typography>

                          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {delivery.customerPhone}
                            </Typography>
                          </Box>

                          <Box display="flex" alignItems="flex-start" gap={0.5}>
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {delivery.customerAddress}
                            </Typography>
                          </Box>

                          {delivery.scheduledDeliveryDate && (
                            <Box mt={1}>
                              <Chip
                                icon={<ScheduleIcon />}
                                label={`Scheduled: ${format(
                                  new Date(delivery.scheduledDeliveryDate),
                                  "dd MMM yyyy"
                                )}`}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            </Box>
                          )}
                        </Box>
                      </Grid>

                      {/* Amount & Items */}
                      <Grid item xs={12} sm={2}>
                        <Box textAlign="center">
                          <Typography variant="h6" color="primary" fontWeight={600}>
                            ₹{(delivery.grandTotal || 0).toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {delivery.items?.length || 0} item(s)
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Actions */}
                      <Grid item xs={12} sm={2}>
                        <Box display="flex" flexDirection="column" gap={1}>
                          <Tooltip title="View Invoice">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<ViewIcon />}
                              onClick={() => navigate(`/sales/view/${delivery.id}`)}
                              fullWidth
                            >
                              View
                            </Button>
                          </Tooltip>

                          <Tooltip title="Mark as Delivered">
                            <Button
                              variant="contained"
                              size="small"
                              color="success"
                              startIcon={<CompleteIcon />}
                              onClick={() => handleMarkDelivered(delivery)}
                              fullWidth
                            >
                              Complete
                            </Button>
                          </Tooltip>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Mark Delivered Confirmation Dialog */}
      <Dialog
        open={markDeliveredDialog}
        onClose={() => !markingDelivered && setMarkDeliveredDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CompleteIcon color="success" />
            Mark Delivery as Complete
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to mark this delivery as completed?
          </Typography>
          {selectedInvoice && (
            <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
              <Typography variant="body2" color="text.secondary">
                Invoice: <strong>{selectedInvoice.invoiceNumber}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Customer: <strong>{selectedInvoice.customerName}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Amount: <strong>₹{(selectedInvoice.grandTotal || 0).toLocaleString()}</strong>
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMarkDeliveredDialog(false)} disabled={markingDelivered}>
            Cancel
          </Button>
          <Button
            onClick={confirmMarkDelivered}
            variant="contained"
            color="success"
            disabled={markingDelivered}
            startIcon={markingDelivered ? <CircularProgress size={16} /> : <CompleteIcon />}
          >
            {markingDelivered ? "Updating..." : "Mark Delivered"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingDeliveriesTab;
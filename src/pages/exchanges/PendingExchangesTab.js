// src/pages/exchanges/PendingExchangesTab.js
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  SwapHoriz as ExchangeIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CompleteIcon,
  Description as DescriptionIcon,
  AttachMoney as MoneyIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { useSales } from "../../contexts/SalesContext/SalesContext";
import { useUserType } from "../../contexts/UserTypeContext/UserTypeContext";
import LoadingSpinner from "../../components/common/UI/LoadingSpinner";

const PendingExchangesTab = () => {
  const navigate = useNavigate();
  const { sales, loading, updateExchangeItemStatus } = useSales();
  const { getThemeColors } = useUserType();
  const themeColors = getThemeColors();

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredExchanges, setFilteredExchanges] = useState([]);
  const [markReceivedDialog, setMarkReceivedDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [markingReceived, setMarkingReceived] = useState(false);

  // Filter pending exchanges
  useEffect(() => {
    if (sales && sales.length > 0) {
      let filtered = sales.filter(
        (sale) =>
          sale.exchangeDetails?.hasExchange &&
          !sale.exchangeDetails?.itemReceived
      );

      // Apply search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (exchange) =>
            exchange.invoiceNumber?.toLowerCase().includes(term) ||
            exchange.customerName?.toLowerCase().includes(term) ||
            exchange.customerPhone?.includes(term) ||
            exchange.exchangeDetails?.exchangeDescription?.toLowerCase().includes(term)
        );
      }

      // Sort by creation date (newest first)
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setFilteredExchanges(filtered);
    }
  }, [sales, searchTerm]);

  const handleMarkReceived = (invoice) => {
    setSelectedInvoice(invoice);
    setMarkReceivedDialog(true);
  };

  const confirmMarkReceived = async () => {
    if (!selectedInvoice) return;

    setMarkingReceived(true);
    try {
      await updateExchangeItemStatus(selectedInvoice.id, true);

      setMarkReceivedDialog(false);
      setSelectedInvoice(null);
    } catch (error) {
      console.error("Error marking exchange as received:", error);
      alert("Failed to mark exchange as received. Please try again.");
    } finally {
      setMarkingReceived(false);
    }
  };

  const getDaysSinceCreation = (createdAt) => {
    const today = new Date();
    const created = new Date(createdAt);
    const diffTime = today - created;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExchangeUrgency = (exchange) => {
    const daysSince = getDaysSinceCreation(exchange.createdAt);
    
    if (daysSince === 0) {
      return { color: "info", label: "Created Today" };
    }
    if (daysSince === 1) {
      return { color: "warning", label: "1 day ago" };
    }
    if (daysSince <= 7) {
      return { color: "warning", label: `${daysSince} days ago` };
    }
    return { color: "error", label: `${daysSince} days ago` };
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box>
      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by invoice number, customer name, phone, or exchange description..."
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

      {/* Exchanges List */}
      {filteredExchanges.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          {searchTerm
            ? "No pending exchanges found matching your search."
            : "No pending exchanges at this time."}
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {filteredExchanges.map((exchange) => {
            const urgency = getExchangeUrgency(exchange);

            return (
              <Grid item xs={12} key={exchange.id}>
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
                      {/* Exchange Badge */}
                      <Grid item xs={12} sm={2}>
                        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                          <ExchangeIcon sx={{ fontSize: 40, color: `${urgency.color}.main` }} />
                          <Chip
                            label={urgency.label}
                            color={urgency.color}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Grid>

                      {/* Exchange Details */}
                      <Grid item xs={12} sm={6}>
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <ReceiptIcon fontSize="small" color="action" />
                            <Typography variant="h6" fontWeight={600}>
                              {exchange.invoiceNumber}
                            </Typography>
                          </Box>

                          <Typography variant="body1" color="text.primary" gutterBottom>
                            {exchange.customerName}
                          </Typography>

                          <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {exchange.customerPhone}
                            </Typography>
                          </Box>

                          <Box display="flex" alignItems="flex-start" gap={0.5} mb={1}>
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {exchange.customerAddress}
                            </Typography>
                          </Box>

                          {/* Exchange Description */}
                          {exchange.exchangeDetails?.exchangeDescription && (
                            <Box 
                              display="flex" 
                              alignItems="flex-start" 
                              gap={0.5} 
                              mt={1}
                              p={1.5}
                              bgcolor="warning.50"
                              borderRadius={1}
                            >
                              <DescriptionIcon fontSize="small" color="warning" />
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Exchange Item:
                                </Typography>
                                <Typography variant="body2" color="text.primary">
                                  {exchange.exchangeDetails.exchangeDescription}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Invoice Date */}
                          <Box mt={1}>
                            <Chip
                              label={`Invoice: ${format(
                                new Date(exchange.saleDate),
                                "dd MMM yyyy"
                              )}`}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          </Box>
                        </Box>
                      </Grid>

                      {/* Exchange Amount & Total */}
                      <Grid item xs={12} sm={2}>
                        <Box textAlign="center">
                          <Box mb={1}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Exchange Value
                            </Typography>
                            <Typography variant="h6" color="warning.main" fontWeight={600}>
                              ₹{(exchange.exchangeDetails?.exchangeAmount || 0).toLocaleString()}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Invoice Total
                            </Typography>
                            <Typography variant="body2" color="text.primary" fontWeight={600}>
                              ₹{(exchange.grandTotal || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Actions */}
                      <Grid item xs={12} sm={2}>
                        <Box display="flex" flexDirection="column" gap={1}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => navigate(`/sales/view/${exchange.id}`)}
                            fullWidth
                          >
                            View
                          </Button>

                          <Button
                            variant="contained"
                            size="small"
                            color="success"
                            startIcon={<CompleteIcon />}
                            onClick={() => handleMarkReceived(exchange)}
                            fullWidth
                          >
                            Mark Received
                          </Button>
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

      {/* Mark Received Confirmation Dialog */}
      <Dialog
        open={markReceivedDialog}
        onClose={() => !markingReceived && setMarkReceivedDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CompleteIcon color="success" />
            Mark Exchange as Received
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to mark this exchange item as received?
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
                Exchange Value: <strong>₹{(selectedInvoice.exchangeDetails?.exchangeAmount || 0).toLocaleString()}</strong>
              </Typography>
              {selectedInvoice.exchangeDetails?.exchangeDescription && (
                <Typography variant="body2" color="text.secondary">
                  Item: <strong>{selectedInvoice.exchangeDetails.exchangeDescription}</strong>
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMarkReceivedDialog(false)} disabled={markingReceived}>
            Cancel
          </Button>
          <Button
            onClick={confirmMarkReceived}
            variant="contained"
            color="success"
            disabled={markingReceived}
            startIcon={markingReceived ? <CircularProgress size={16} /> : <CompleteIcon />}
          >
            {markingReceived ? "Updating..." : "Mark Received"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingExchangesTab;
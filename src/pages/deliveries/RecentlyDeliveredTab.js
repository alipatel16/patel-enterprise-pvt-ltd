// src/pages/deliveries/RecentlyDeliveredTab.js
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Badge,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  CheckCircle as DeliveredIcon,
  ExpandMore as ExpandMoreIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { useSales } from "../../contexts/SalesContext/SalesContext";
import { useUserType } from "../../contexts/UserTypeContext/UserTypeContext";
import { DELIVERY_STATUS } from "../../utils/constants/appConstants";
import LoadingSpinner from "../../components/common/UI/LoadingSpinner";

const RecentlyDeliveredTab = () => {
  const navigate = useNavigate();
  const { sales, loading } = useSales();
  const { getThemeColors } = useUserType();
  const themeColors = getThemeColors();

  const [searchTerm, setSearchTerm] = useState("");
  const [groupedDeliveries, setGroupedDeliveries] = useState({});

  // Filter and group deliveries by date
  useEffect(() => {
    if (sales && sales.length > 0) {
      // Filter ALL delivered items (no date restriction)
      let filtered = sales.filter((sale) => {
        return sale.deliveryStatus === DELIVERY_STATUS.DELIVERED && sale.deliveryDate;
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

      // Group by date
      const grouped = {};

      // Add deliveries to their respective dates
      filtered.forEach((delivery) => {
        const deliveryDate = new Date(delivery.deliveryDate);
        const dateKey = format(deliveryDate, "yyyy-MM-dd");
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(delivery);
      });

      // Sort deliveries within each date by delivery time (latest first)
      Object.keys(grouped).forEach((dateKey) => {
        grouped[dateKey].sort((a, b) => {
          return new Date(b.deliveryDate) - new Date(a.deliveryDate);
        });
      });

      setGroupedDeliveries(grouped);
    }
  }, [sales, searchTerm]);

  const getDateLabel = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return "Today";
    }
    if (isYesterday(date)) {
      return "Yesterday";
    }
    return format(date, "EEEE, dd MMM yyyy");
  };

  const getTotalDeliveriesForDate = (dateString) => {
    return groupedDeliveries[dateString]?.length || 0;
  };

  const getTotalAmountForDate = (dateString) => {
    return (
      groupedDeliveries[dateString]?.reduce(
        (sum, delivery) => sum + (delivery.grandTotal || 0),
        0
      ) || 0
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const sortedDates = Object.keys(groupedDeliveries).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  const totalDeliveries = Object.values(groupedDeliveries).reduce(
    (sum, deliveries) => sum + deliveries.length,
    0
  );

  const totalAmount = Object.values(groupedDeliveries).reduce(
    (sum, deliveries) => sum + deliveries.reduce((s, d) => s + (d.grandTotal || 0), 0),
    0
  );

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
          icon={<DeliveredIcon />}
          label={`${totalDeliveries} total deliveries`}
          color="success"
          variant="outlined"
        />
        <Chip
          icon={<CalendarIcon />}
          label={`${sortedDates.length} delivery days`}
          color="primary"
          variant="outlined"
        />
        <Chip
          icon={<ReceiptIcon />}
          label={`₹${totalAmount.toLocaleString()} total`}
          color="secondary"
          variant="outlined"
        />
      </Box>

      {/* Deliveries Grouped by Date */}
      {totalDeliveries === 0 && !searchTerm ? (
        <Alert severity="info">
          No deliveries completed yet.
        </Alert>
      ) : totalDeliveries === 0 && searchTerm ? (
        <Alert severity="info">
          No deliveries found matching your search.
        </Alert>
      ) : (
        <Box>
          {sortedDates.map((dateKey) => {
            const deliveriesForDate = groupedDeliveries[dateKey];
            const count = getTotalDeliveriesForDate(dateKey);
            const totalAmount = getTotalAmountForDate(dateKey);

            return (
              <Accordion
                key={dateKey}
                defaultExpanded={isToday(parseISO(dateKey)) || isYesterday(parseISO(dateKey))}
                sx={{
                  mb: 2,
                  "&:before": { display: "none" },
                  boxShadow: 1,
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    bgcolor: "success.50",
                    "&:hover": {
                      bgcolor: "success.100",
                    },
                  }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    width="100%"
                    mr={2}
                  >
                    <Box display="flex" alignItems="center" gap={2}>
                      <CalendarIcon color="success" />
                      <Typography variant="h6" fontWeight={600}>
                        {getDateLabel(dateKey)}
                      </Typography>
                      <Badge badgeContent={count} color="success">
                        <DeliveredIcon color="success" />
                      </Badge>
                    </Box>

                    <Box textAlign="right">
                      <Typography variant="body1" color="success.main" fontWeight={600}>
                        ₹{totalAmount.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Total Amount
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    {deliveriesForDate.map((delivery, index) => (
                      <Grid item xs={12} key={delivery.id}>
                        {index > 0 && <Divider sx={{ mb: 2 }} />}
                        <Card variant="outlined">
                          <CardContent>
                            <Grid container spacing={2} alignItems="center">
                              {/* Delivery Icon */}
                              <Grid item xs={12} sm={1}>
                                <Box display="flex" justifyContent="center">
                                  <DeliveredIcon sx={{ fontSize: 40, color: "success.main" }} />
                                </Box>
                              </Grid>

                              {/* Delivery Details */}
                              <Grid item xs={12} sm={7}>
                                <Box>
                                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    <ReceiptIcon fontSize="small" color="action" />
                                    <Typography variant="h6" fontWeight={600}>
                                      {delivery.invoiceNumber}
                                    </Typography>
                                    <Chip
                                      label={format(
                                        new Date(delivery.deliveryDate),
                                        "hh:mm a"
                                      )}
                                      size="small"
                                      color="success"
                                      variant="outlined"
                                    />
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
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<ViewIcon />}
                                  onClick={() => navigate(`/sales/view/${delivery.id}`)}
                                  fullWidth
                                >
                                  View
                                </Button>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default RecentlyDeliveredTab;
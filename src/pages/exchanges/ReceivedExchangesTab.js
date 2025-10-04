// src/pages/exchanges/ReceivedExchangesTab.js
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
  CheckCircle as ReceivedIcon,
  ExpandMore as ExpandMoreIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Receipt as ReceiptIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { useSales } from "../../contexts/SalesContext/SalesContext";
import { useUserType } from "../../contexts/UserTypeContext/UserTypeContext";
import LoadingSpinner from "../../components/common/UI/LoadingSpinner";

const ReceivedExchangesTab = () => {
  const navigate = useNavigate();
  const { sales, loading } = useSales();
  const { getThemeColors } = useUserType();
  const themeColors = getThemeColors();

  const [searchTerm, setSearchTerm] = useState("");
  const [groupedExchanges, setGroupedExchanges] = useState({});

  // Filter and group exchanges by date
  useEffect(() => {
    if (sales && sales.length > 0) {
      const today = new Date();
      const last15Days = new Date();
      last15Days.setDate(today.getDate() - 15);

      // Filter received exchanges from last 15 days
      let filtered = sales.filter((sale) => {
        if (
          sale.exchangeDetails?.hasExchange &&
          sale.exchangeDetails?.itemReceived &&
          sale.exchangeDetails?.exchangeReceivedDate
        ) {
          const receivedDate = new Date(sale.exchangeDetails.exchangeReceivedDate);
          return receivedDate >= last15Days && receivedDate <= today;
        }
        return false;
      });

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

      // Group by date
      const grouped = {};
      
      // Create entries for all last 15 days
      for (let i = 0; i < 15; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateKey = format(date, "yyyy-MM-dd");
        grouped[dateKey] = [];
      }

      // Add exchanges to their respective dates
      filtered.forEach((exchange) => {
        const receivedDate = new Date(exchange.exchangeDetails.exchangeReceivedDate);
        const dateKey = format(receivedDate, "yyyy-MM-dd");
        if (grouped[dateKey]) {
          grouped[dateKey].push(exchange);
        }
      });

      // Sort exchanges within each date by received time (latest first)
      Object.keys(grouped).forEach((dateKey) => {
        grouped[dateKey].sort((a, b) => {
          return new Date(b.exchangeDetails.exchangeReceivedDate) - new Date(a.exchangeDetails.exchangeReceivedDate);
        });
      });

      setGroupedExchanges(grouped);
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

  const getTotalExchangesForDate = (dateString) => {
    return groupedExchanges[dateString]?.length || 0;
  };

  const getTotalValueForDate = (dateString) => {
    return (
      groupedExchanges[dateString]?.reduce(
        (sum, exchange) => sum + (exchange.exchangeDetails?.exchangeAmount || 0),
        0
      ) || 0
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const sortedDates = Object.keys(groupedExchanges).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  const totalExchanges = Object.values(groupedExchanges).reduce(
    (sum, exchanges) => sum + exchanges.length,
    0
  );

  const totalValue = Object.values(groupedExchanges).reduce(
    (sum, exchanges) => 
      sum + exchanges.reduce((s, e) => s + (e.exchangeDetails?.exchangeAmount || 0), 0),
    0
  );

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

      {/* Summary */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Chip
          icon={<ReceivedIcon />}
          label={`${totalExchanges} exchanges received in last 15 days`}
          color="success"
          variant="outlined"
        />
        <Chip
          label={`Total Value: ₹${totalValue.toLocaleString()}`}
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Exchanges Grouped by Date */}
      {totalExchanges === 0 && !searchTerm ? (
        <Alert severity="info">
          No exchanges received in the last 15 days.
        </Alert>
      ) : totalExchanges === 0 && searchTerm ? (
        <Alert severity="info">
          No exchanges found matching your search.
        </Alert>
      ) : (
        <Box>
          {sortedDates.map((dateKey) => {
            const exchangesForDate = groupedExchanges[dateKey];
            const count = getTotalExchangesForDate(dateKey);
            const totalValue = getTotalValueForDate(dateKey);

            // Skip dates with no exchanges
            if (count === 0 && !searchTerm) {
              return null;
            }

            return (
              <Accordion
                key={dateKey}
                defaultExpanded={count > 0 && (isToday(parseISO(dateKey)) || isYesterday(parseISO(dateKey)))}
                sx={{
                  mb: 2,
                  "&:before": { display: "none" },
                  boxShadow: 1,
                }}
              >
                <AccordionSummary
                  expandIcon={count > 0 ? <ExpandMoreIcon /> : null}
                  sx={{
                    bgcolor: count > 0 ? "success.50" : "grey.50",
                    "&:hover": {
                      bgcolor: count > 0 ? "success.100" : "grey.100",
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
                      <CalendarIcon color={count > 0 ? "success" : "disabled"} />
                      <Typography variant="h6" fontWeight={600}>
                        {getDateLabel(dateKey)}
                      </Typography>
                      {count > 0 && (
                        <Badge badgeContent={count} color="success">
                          <ReceivedIcon color="success" />
                        </Badge>
                      )}
                    </Box>

                    {count > 0 && (
                      <Box textAlign="right">
                        <Typography variant="body1" color="success.main" fontWeight={600}>
                          ₹{totalValue.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Exchange Value
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </AccordionSummary>

                {count > 0 && (
                  <AccordionDetails sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      {exchangesForDate.map((exchange, index) => (
                        <Grid item xs={12} key={exchange.id}>
                          {index > 0 && <Divider sx={{ mb: 2 }} />}
                          <Card variant="outlined">
                            <CardContent>
                              <Grid container spacing={2} alignItems="center">
                                {/* Exchange Icon */}
                                <Grid item xs={12} sm={1}>
                                  <Box display="flex" justifyContent="center">
                                    <ReceivedIcon sx={{ fontSize: 40, color: "success.main" }} />
                                  </Box>
                                </Grid>

                                {/* Exchange Details */}
                                <Grid item xs={12} sm={7}>
                                  <Box>
                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                      <ReceiptIcon fontSize="small" color="action" />
                                      <Typography variant="h6" fontWeight={600}>
                                        {exchange.invoiceNumber}
                                      </Typography>
                                      <Chip
                                        label={format(
                                          new Date(exchange.exchangeDetails.exchangeReceivedDate),
                                          "hh:mm a"
                                        )}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                      />
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
                                        p={1}
                                        bgcolor="success.50"
                                        borderRadius={1}
                                      >
                                        <DescriptionIcon fontSize="small" color="success" />
                                        <Box flex={1}>
                                          <Typography variant="caption" color="text.secondary" display="block">
                                            Exchanged Item:
                                          </Typography>
                                          <Typography variant="body2" color="text.primary">
                                            {exchange.exchangeDetails.exchangeDescription}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    )}

                                    {/* Received By Info */}
                                    {exchange.exchangeDetails?.receivedByName && (
                                      <Box 
                                        display="flex" 
                                        alignItems="center" 
                                        gap={0.5} 
                                        mt={1}
                                      >
                                        <PersonIcon fontSize="small" color="action" />
                                        <Typography variant="caption" color="text.secondary">
                                          Received by: <strong>{exchange.exchangeDetails.receivedByName}</strong>
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Grid>

                                {/* Exchange Value & Invoice Total */}
                                <Grid item xs={12} sm={2}>
                                  <Box textAlign="center">
                                    <Box mb={1}>
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Exchange Value
                                      </Typography>
                                      <Typography variant="h6" color="success.main" fontWeight={600}>
                                        ₹{(exchange.exchangeDetails?.exchangeAmount || 0).toLocaleString()}
                                      </Typography>
                                    </Box>
                                    <Box>
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        Invoice Total
                                      </Typography>
                                      <Typography variant="body2" color="text.primary">
                                        ₹{(exchange.grandTotal || 0).toLocaleString()}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Grid>

                                {/* Actions */}
                                <Grid item xs={12} sm={2}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<ViewIcon />}
                                    onClick={() => navigate(`/sales/view/${exchange.id}`)}
                                    fullWidth
                                  >
                                    View Invoice
                                  </Button>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                )}
              </Accordion>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default ReceivedExchangesTab;
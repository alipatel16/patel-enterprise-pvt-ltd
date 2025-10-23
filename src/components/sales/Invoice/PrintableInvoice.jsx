import React, { useEffect, useState } from "react";
import { Box, Typography, GlobalStyles } from "@mui/material";
import {
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  QrCode as QRCodeIcon,
} from "@mui/icons-material";
import {
  formatCurrency,
  formatDate,
} from "../../../utils/helpers/formatHelpers";

import { useUserType } from "../../../contexts/UserTypeContext";

const IMAGE_PATHS = {
  logos: {
    electronicFurniture: "/assets/electronic_furniture.jpeg",
    engineeringWorks: "/assets/engineering_works.jpeg",
    furniture: "/assets/furniture.jpeg",
    steelSyndicate: "/assets/steel_syndicate.jpeg",
  },
  qrCodes: {
    furniture: "/assets/furniture_qr.jpeg",
    electronics: "/assets/electronic_qr.jpeg",
  },
  signatures: {
    mohammed: "/assets/mohammed_sign.jpeg",
    abbas: "/assets/abbas_sign.jpeg",
  },
};

// COMPLETELY REDESIGNED MODERN PROFESSIONAL STYLES
const modernInvoiceStyles = {
  "@media print": {
    "@page": { size: "A4", margin: "15mm" },
    "body *": { visibility: "hidden !important" },
    ".print-invoice-only, .print-invoice-only *": { visibility: "visible !important" },
    ".print-invoice-only": {
      position: "absolute !important",
      left: "0 !important",
      top: "0 !important",
      width: "100% !important",
      backgroundColor: "#ffffff !important",
    },
    ".no-print-invoice": { display: "none !important" },
    
    // ROBOTO FONT GLOBAL
    "*, *::before, *::after": {
      fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif !important",
      "-webkit-print-color-adjust": "exact !important",
      "print-color-adjust": "exact !important",
    },

    // MODERN HEADER WITH BLUE ACCENT
    ".modern-invoice-header": {
      marginBottom: "25px",
      pageBreakAfter: "avoid",
    },
    ".header-blue-bar": {
      height: "6px",
      background: "linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%)",
      marginBottom: "20px",
    },
    ".header-main": {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingBottom: "18px",
      borderBottom: "1px solid #e5e7eb",
    },
    ".company-branding": {
      display: "flex",
      alignItems: "flex-start",
      gap: "15px",
      flex: 1,
    },
    ".company-logo-box": {
      width: "70px",
      height: "70px",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      padding: "6px",
      backgroundColor: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      flexShrink: 0,
    },
    ".company-logo-box img": {
      width: "100%",
      height: "100%",
      objectFit: "contain",
    },
    ".company-text": {
      flex: 1,
    },
    ".company-name-text": {
      fontSize: "24px !important",
      fontWeight: "700 !important",
      color: "#111827 !important",
      marginBottom: "6px !important",
      letterSpacing: "-0.5px",
      lineHeight: "1.2 !important",
    },
    ".company-info-text": {
      fontSize: "10px !important",
      color: "#6b7280 !important",
      lineHeight: "1.6 !important",
    },
    ".invoice-badge-box": {
      textAlign: "right",
      minWidth: "200px",
    },
    ".invoice-badge-title": {
      fontSize: "36px !important",
      fontWeight: "700 !important",
      color: "#2563eb !important",
      marginBottom: "8px !important",
      letterSpacing: "-1px",
      lineHeight: "1 !important",
    },
    ".invoice-meta-box": {
      backgroundColor: "#f9fafb",
      padding: "12px 16px",
      borderRadius: "6px",
      border: "1px solid #e5e7eb",
    },
    ".invoice-number-text": {
      fontSize: "14px !important",
      fontWeight: "600 !important",
      color: "#111827 !important",
      marginBottom: "4px !important",
    },
    ".invoice-date-text": {
      fontSize: "10px !important",
      color: "#6b7280 !important",
      lineHeight: "1.5 !important",
    },

    // BILLING CARDS - SIDE BY SIDE
    ".billing-cards-container": {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "18px",
      marginBottom: "25px",
      pageBreakInside: "avoid",
    },
    ".billing-card-modern": {
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      padding: "16px",
      backgroundColor: "#fafafa",
    },
    ".billing-card-header": {
      fontSize: "10px !important",
      fontWeight: "700 !important",
      textTransform: "uppercase",
      color: "#6b7280 !important",
      marginBottom: "10px !important",
      letterSpacing: "1px",
      paddingBottom: "6px",
      borderBottom: "2px solid #2563eb",
      width: "fit-content",
    },
    ".billing-card-name": {
      fontSize: "14px !important",
      fontWeight: "600 !important",
      color: "#111827 !important",
      marginBottom: "8px !important",
    },
    ".billing-card-detail": {
      fontSize: "10px !important",
      color: "#374151 !important",
      lineHeight: "1.7 !important",
      marginBottom: "2px !important",
    },

    // ITEMS TABLE - MODERN DARK HEADER
    ".items-table-container": {
      marginBottom: "20px",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      overflow: "hidden",
    },
    ".items-table-modern": {
      width: "100%",
      borderCollapse: "collapse",
      "& thead": {
        backgroundColor: "#1f2937 !important",
        pageBreakAfter: "avoid",
      },
      "& th": {
        padding: "14px 12px !important",
        fontSize: "9px !important",
        fontWeight: "700 !important",
        textTransform: "uppercase",
        letterSpacing: "1px",
        color: "#ffffff !important",
        textAlign: "left !important",
        borderBottom: "none !important",
      },
      "& td": {
        padding: "12px !important",
        fontSize: "11px !important",
        color: "#374151 !important",
        borderBottom: "1px solid #f3f4f6 !important",
        lineHeight: "1.5 !important",
      },
      "& tbody tr": {
        backgroundColor: "#ffffff !important",
        pageBreakInside: "avoid",
      },
      "& tbody tr:last-child td": {
        borderBottom: "none !important",
      },
    },
    ".item-desc-bold": {
      fontWeight: "600 !important",
      color: "#111827 !important",
    },
    ".text-right": { textAlign: "right !important" },
    ".text-center": { textAlign: "center !important" },

    // TOTALS SUMMARY BOX
    ".totals-container": {
      display: "flex",
      justifyContent: "flex-end",
      marginBottom: "25px",
      pageBreakInside: "avoid",
    },
    ".totals-summary-box": {
      minWidth: "320px",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      overflow: "hidden",
    },
    ".totals-line": {
      display: "flex",
      justifyContent: "space-between",
      padding: "11px 16px",
      fontSize: "11px !important",
      borderBottom: "1px solid #f3f4f6",
    },
    ".totals-line:last-child": {
      borderBottom: "none",
    },
    ".totals-line-label": {
      color: "#6b7280 !important",
      fontWeight: "500 !important",
    },
    ".totals-line-value": {
      color: "#111827 !important",
      fontWeight: "600 !important",
    },
    ".grand-total-line": {
      backgroundColor: "#1f2937 !important",
      padding: "14px 16px !important",
    },
    ".grand-total-line .totals-line-label": {
      color: "#ffffff !important",
      fontSize: "13px !important",
      fontWeight: "700 !important",
    },
    ".grand-total-line .totals-line-value": {
      color: "#ffffff !important",
      fontSize: "16px !important",
      fontWeight: "700 !important",
    },

    // PAYMENT INFO SECTION
    ".payment-section-modern": {
      border: "1px solid #d1fae5",
      backgroundColor: "#ecfdf5",
      borderRadius: "8px",
      padding: "16px",
      marginBottom: "20px",
      pageBreakInside: "avoid",
    },
    ".payment-section-title": {
      fontSize: "11px !important",
      fontWeight: "700 !important",
      color: "#065f46 !important",
      marginBottom: "10px !important",
      textTransform: "uppercase",
      letterSpacing: "0.8px",
    },
    ".payment-detail-grid": {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "8px",
      fontSize: "10px !important",
    },
    ".payment-detail-row": {
      display: "flex",
      justifyContent: "space-between",
      color: "#065f46 !important",
    },
    ".payment-detail-label": {
      fontWeight: "500 !important",
    },
    ".payment-detail-value": {
      fontWeight: "600 !important",
    },

    // PAYMENT HISTORY TABLE
    ".payment-history-wrapper": {
      marginBottom: "20px",
      pageBreakInside: "avoid",
    },
    ".payment-history-heading": {
      fontSize: "13px !important",
      fontWeight: "700 !important",
      color: "#111827 !important",
      marginBottom: "10px !important",
      paddingBottom: "6px",
      borderBottom: "2px solid #2563eb",
    },
    ".payment-history-table-modern": {
      width: "100%",
      borderCollapse: "collapse",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      overflow: "hidden",
      "& th": {
        backgroundColor: "#f9fafb !important",
        padding: "10px 12px !important",
        fontSize: "9px !important",
        fontWeight: "600 !important",
        textTransform: "uppercase",
        color: "#6b7280 !important",
        borderBottom: "1px solid #e5e7eb !important",
        textAlign: "left !important",
      },
      "& td": {
        padding: "10px 12px !important",
        fontSize: "10px !important",
        color: "#374151 !important",
        borderBottom: "1px solid #f3f4f6 !important",
      },
      "& tbody tr:last-child td": {
        fontWeight: "600 !important",
        backgroundColor: "#f9fafb !important",
        color: "#111827 !important",
        borderBottom: "none !important",
      },
    },

    // FOOTER SECTION
    ".invoice-footer-modern": {
      marginTop: "30px",
      paddingTop: "20px",
      borderTop: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-between",
      pageBreakInside: "avoid",
    },
    ".footer-terms": {
      flex: 1,
      paddingRight: "25px",
    },
    ".terms-heading": {
      fontSize: "11px !important",
      fontWeight: "700 !important",
      color: "#111827 !important",
      marginBottom: "8px !important",
      textTransform: "uppercase",
      letterSpacing: "0.8px",
    },
    ".terms-text": {
      fontSize: "8px !important",
      lineHeight: "1.6 !important",
      color: "#6b7280 !important",
    },
    ".footer-signature-qr": {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      minWidth: "130px",
    },
    ".qr-box-modern": {
      width: "100px",
      height: "100px",
      border: "1px solid #e5e7eb",
      borderRadius: "6px",
      padding: "4px",
      backgroundColor: "#ffffff",
      marginBottom: "10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    ".qr-box-modern img": {
      width: "100%",
      height: "100%",
      objectFit: "contain",
    },
    ".signature-box-modern": {
      width: "110px",
      height: "45px",
      marginBottom: "6px",
      borderBottom: "2px solid #111827",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      paddingBottom: "4px",
    },
    ".signature-box-modern img": {
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
    },
    ".signature-label-text": {
      fontSize: "8px !important",
      fontWeight: "600 !important",
      color: "#6b7280 !important",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },

    // PAGE BREAK
    ".page-break-avoid": { pageBreakInside: "avoid" },
  },
};

const PrintableInvoice = ({ invoice, onPrint, autoTriggerPrint = false }) => {
  const { userType } = useUserType();
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imagesToLoad, setImagesToLoad] = useState([]);

  // SAME DYNAMIC LOGIC - Get company details
  const getCompanyDetails = () => {
    if (invoice?.company) {
      return {
        name: invoice.company.name || "Your Company Name",
        address: invoice.company.address || "123 Business Street",
        city: invoice.company.city || "Your City",
        state: invoice.company.state || "Your State",
        pincode: invoice.company.pincode || "123456",
        phone: invoice.company.phone || "+91 12345 67890",
        email: invoice.company.email || "info@yourcompany.com",
        gst: invoice.company.gstNumber || "24ABCDE1234F1Z5",
        website: invoice.company.website || "www.yourcompany.com",
      };
    }
    return {
      name: "Your Company Name",
      address: "123 Business Street",
      city: "Your City",
      state: "Your State",
      pincode: "123456",
      phone: "+91 12345 67890",
      email: "info@yourcompany.com",
      gst: "24ABCDE1234F1Z5",
      website: "www.yourcompany.com",
    };
  };

  const companyDetails = getCompanyDetails();

  // SAME DYNAMIC LOGIC - Get company logo
  const getCompanyLogo = (companyName) => {
    if (!companyName) return null;
    const name = companyName.toLowerCase();
    if (name.includes("patel electronics and furniture")) {
      return IMAGE_PATHS.logos.electronicFurniture;
    } else if (name.includes("patel engineering works")) {
      return IMAGE_PATHS.logos.engineeringWorks;
    } else if (name.includes("patel furniture")) {
      return IMAGE_PATHS.logos.furniture;
    } else if (name.includes("m-raj steel") || name.includes("m raj steel")) {
      return IMAGE_PATHS.logos.steelSyndicate;
    }
    return null;
  };

  // SAME DYNAMIC LOGIC - Get QR code
  const getQRCode = (userType) => {
    if (userType === "furniture") {
      return IMAGE_PATHS.qrCodes.furniture;
    } else if (userType === "electronics") {
      return IMAGE_PATHS.qrCodes.electronics;
    }
    return null;
  };

  // SAME DYNAMIC LOGIC - Get signature
  const getSignature = (userType) => {
    if (userType === "furniture") {
      return IMAGE_PATHS.signatures.mohammed;
    } else if (userType === "electronics") {
      return IMAGE_PATHS.signatures.abbas;
    }
    return null;
  };

  const companyLogo = getCompanyLogo(companyDetails.name);
  const qrCodeImage = getQRCode(userType);
  const signatureImage = getSignature(userType);

  // SAME DYNAMIC LOGIC - Preload images
  useEffect(() => {
    const imagesToPreload = [companyLogo, qrCodeImage, signatureImage].filter(Boolean);
    if (imagesToPreload.length === 0) {
      setImagesLoaded(true);
      return;
    }
    setImagesToLoad(imagesToPreload);

    const preloadImage = (src) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => resolve(src);
        img.src = src;
      });
    };

    const preloadAllImages = async () => {
      try {
        await Promise.all(imagesToPreload.map(preloadImage));
        setImagesLoaded(true);
      } catch (error) {
        console.warn("Some images failed to preload:", error);
        setImagesLoaded(true);
      }
    };
    preloadAllImages();
  }, [companyLogo, qrCodeImage, signatureImage]);

  // SAME DYNAMIC LOGIC - Auto-trigger print
  useEffect(() => {
    if (autoTriggerPrint && imagesLoaded) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [autoTriggerPrint, imagesLoaded]);

  // SAME DYNAMIC LOGIC - Handle print events
  useEffect(() => {
    if (autoTriggerPrint) {
      const handleAfterPrint = () => {
        if (onPrint) onPrint();
      };
      const handleBeforePrint = () => {
        console.log("Print dialog opened");
      };
      window.addEventListener("afterprint", handleAfterPrint);
      window.addEventListener("beforeprint", handleBeforePrint);
      return () => {
        window.removeEventListener("afterprint", handleAfterPrint);
        window.removeEventListener("beforeprint", handleBeforePrint);
      };
    }
  }, [autoTriggerPrint, onPrint]);

  const handlePrint = () => {
    window.print();
  };

  // Helper function to capitalize first letter of status
  const capitalizeStatus = (status) => {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  if (!invoice) {
    return (
      <Box className="no-print-invoice" sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body1">No invoice data available</Typography>
      </Box>
    );
  }

  return (
    <>
      <GlobalStyles styles={modernInvoiceStyles} />

      {/* Non-print preview button */}
      {!autoTriggerPrint && (
        <Box className="no-print-invoice" sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            This is how your invoice will look when printed
          </Typography>
          {!imagesLoaded && imagesToLoad.length > 0 && (
            <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
              Loading images... Please wait before printing.
            </Typography>
          )}
          <button
            onClick={handlePrint}
            disabled={!imagesLoaded && imagesToLoad.length > 0}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              backgroundColor:
                !imagesLoaded && imagesToLoad.length > 0 ? "#ccc" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor:
                !imagesLoaded && imagesToLoad.length > 0
                  ? "not-allowed"
                  : "pointer",
              marginBottom: "20px",
              fontFamily: "'Roboto', sans-serif",
              fontWeight: "600",
            }}
          >
            {!imagesLoaded && imagesToLoad.length > 0
              ? "Loading Images..."
              : "Print Invoice"}
          </button>
        </Box>
      )}

      {/* Auto print loading indicator */}
      {autoTriggerPrint && !imagesLoaded && imagesToLoad.length > 0 && (
        <Box
          className="no-print-invoice"
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            padding: 3,
            borderRadius: 2,
            boxShadow: 3,
            textAlign: "center",
            zIndex: 9999,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Preparing Invoice...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Loading images before printing
          </Typography>
        </Box>
      )}

      {/* MODERN INVOICE LAYOUT - All same dynamic data */}
      <Box
        className="print-invoice-only"
        sx={{ display: autoTriggerPrint ? "block" : "none" }}
      >
        {/* MODERN HEADER */}
        <Box className="modern-invoice-header">
          <Box className="header-blue-bar" />

          <Box className="header-main">
            {/* Company Branding */}
            <Box className="company-branding">
              <Box className="company-logo-box">
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt="Company Logo"
                    loading="eager"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                    style={{ opacity: 0, transition: "opacity 0.3s" }}
                    onLoad={(e) => {
                      e.target.style.opacity = "1";
                    }}
                  />
                ) : (
                  <BusinessIcon
                    style={{ fontSize: "40px", color: "#9ca3af" }}
                  />
                )}
              </Box>

              <Box className="company-text">
                <Typography className="company-name-text">
                  {companyDetails.name}
                </Typography>
                <Box className="company-info-text">
                  <div>
                    {companyDetails.address}, {companyDetails.city}
                  </div>
                  <div>
                    {companyDetails.state} - {companyDetails.pincode}
                  </div>
                  <div>
                    Phone: {companyDetails.phone} | Email:{" "}
                    {companyDetails.email}
                  </div>
                  <div>
                    GST: {companyDetails.gst} | Website:{" "}
                    {companyDetails.website}
                  </div>
                </Box>
              </Box>
            </Box>

            {/* Invoice Badge */}
            <Box className="invoice-badge-box">
              <Typography className="invoice-badge-title">INVOICE</Typography>
              <Box className="invoice-meta-box">
                <Typography className="invoice-number-text">
                  #{invoice.invoiceNumber}
                </Typography>
                <Box className="invoice-date-text">
                  <div>Date: {formatDate(invoice.saleDate)}</div>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* BILLING CARDS */}
        <Box className="billing-cards-container">
          {/* Bill To */}
          <Box className="billing-card-modern">
            <Typography className="billing-card-header">Bill To</Typography>
            <Typography className="billing-card-name">
              {invoice.customerName}
            </Typography>
            {invoice.customerAddress && (
              <div className="billing-card-detail">
                {invoice.customerAddress}
              </div>
            )}
            {invoice.customerCity && (
              <div className="billing-card-detail">
                {invoice.customerCity}, {invoice.customerState} -{" "}
                {invoice.customerPincode}
              </div>
            )}
            {invoice.customerPhone && (
              <div className="billing-card-detail">
                Phone: {invoice.customerPhone}
              </div>
            )}
            {invoice.customerEmail && (
              <div className="billing-card-detail">
                Email: {invoice.customerEmail}
              </div>
            )}
            {invoice.customerGSTNumber && (
              <div className="billing-card-detail">
                GST: {invoice.customerGSTNumber}
              </div>
            )}
          </Box>

          {/* Sales Person */}
          <Box className="billing-card-modern">
            <Typography className="billing-card-header">
              Sales Person
            </Typography>
            <Typography className="billing-card-name">
              {invoice.salesPersonName || "Sales Representative"}
            </Typography>
            <div className="billing-card-detail">
              Sale Date: {formatDate(invoice.saleDate)}
            </div>
          </Box>
        </Box>

        {/* ITEMS TABLE */}
        <Box className="items-table-container">
          {/* Bulk Pricing Indicator */}
          {(invoice.bulkPricingApplied || invoice.bulkPricingDetails) && (
            <Box
              style={{
                backgroundColor: "#dbeafe",
                border: "1px solid #93c5fd",
                borderRadius: "6px 6px 0 0",
                padding: "8px 12px",
                fontSize: "10px",
                fontWeight: "600",
                color: "#1e40af",
                borderBottom: "none",
              }}
            >
              ⚡ Bulk Pricing Applied - Special discount rates included
            </Box>
          )}

          <table className="items-table-modern">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "30%" }}>Description</th>
                <th style={{ width: "12%" }}>HSN Code</th>
                <th style={{ width: "8%" }} className="text-center">
                  Qty
                </th>
                <th style={{ width: "13%" }} className="text-right">
                  Rate
                </th>
                {invoice.includeGST && (
                  <th style={{ width: "10%" }} className="text-center">
                    GST %
                  </th>
                )}
                <th style={{ width: "15%" }} className="text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td className="item-desc-bold">
                    {item.description || item.name}
                  </td>
                  <td>{item.hsnCode || "-"}</td>
                  <td>{item.quantity}</td>
                  <td>
                    {invoice.bulkPricingApplied ? (
                      <span
                        style={{
                          border: "1px solid #4caf50",
                          padding: "2px 6px",
                          fontSize: "9px",
                          backgroundColor: "#e8f5e8",
                          borderRadius: "3px",
                          display: "inline-block",
                        }}
                      >
                        Bulk
                      </span>
                    ) : (
                      formatCurrency(item.rate || item.unitPrice)
                    )}
                  </td>
                  {invoice.includeGST && (
                    <td>
                      {/* UPDATED: Show bulk GST slab or individual item GST */}
                      {invoice.bulkPricingApplied || item.bulkPricing
                        ? `${invoice.bulkPricingDetails?.gstSlab || 18}%`
                        : `${item.gstSlab || 18}%`}
                    </td>
                  )}
                  <td>
                    {invoice.bulkPricingApplied ? (
                      <span
                        style={{
                          border: "1px solid #2196f3",
                          padding: "2px 6px",
                          fontSize: "9px",
                          backgroundColor: "#e3f2fd",
                          borderRadius: "3px",
                          display: "inline-block",
                        }}
                      >
                        See Below
                      </span>
                    ) : (
                      formatCurrency(item.totalAmount || item.quantity * item.rate)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>

        {/* TOTALS SUMMARY */}
        <Box className="totals-container">
          <Box className="totals-summary-box">
            <Box className="totals-line">
              <span className="totals-line-label">Subtotal:</span>
              <span className="totals-line-value">
                {formatCurrency(invoice.subtotal || invoice.totalAmount)}
              </span>
            </Box>

            {/* Exchange Details - Dynamic */}
            {invoice.exchangeDetails?.hasExchange &&
              invoice.exchangeDetails?.exchangeAmount > 0 && (
                <Box className="totals-line">
                  <span className="totals-line-label">Exchange Value:</span>
                  <span
                    className="totals-line-value"
                    style={{ color: "#dc2626 !important" }}
                  >
                    -{formatCurrency(invoice.exchangeDetails.exchangeAmount)}
                  </span>
                </Box>
              )}

            {/* GST Breakdown */}
            {invoice.includeGST && invoice.totalGST > 0 && (
              <>
                {invoice.gstType === "intra_state" && (
                  <>
                    <Box className="totals-line">
                      <span className="totals-line-label">CGST:</span>
                      <span className="totals-line-value">
                        {formatCurrency(invoice.totalGST / 2)}
                      </span>
                    </Box>
                    <Box className="totals-line">
                      <span className="totals-line-label">SGST:</span>
                      <span className="totals-line-value">
                        {formatCurrency(invoice.totalGST / 2)}
                      </span>
                    </Box>
                  </>
                )}
                {invoice.gstType === "inter_state" && (
                  <Box className="totals-line">
                    <span className="totals-line-label">IGST:</span>
                    <span className="totals-line-value">
                      {formatCurrency(invoice.totalGST)}
                    </span>
                  </Box>
                )}
                {/* Total GST Line */}
                <Box
                  className="totals-line"
                  style={{ backgroundColor: "#f3f4f6" }}
                >
                  <span className="totals-line-label">
                    <strong>Total GST:</strong>
                  </span>
                  <span className="totals-line-value">
                    <strong>{formatCurrency(invoice.totalGST)}</strong>
                  </span>
                </Box>
              </>
            )}

            <Box className="totals-line grand-total-line">
              <span className="totals-line-label">
                {invoice.exchangeDetails?.hasExchange
                  ? "Net Payable:"
                  : "Grand Total:"}
              </span>
              <span className="totals-line-value">
                {formatCurrency(invoice.netPayable || invoice.grandTotal)}
              </span>
            </Box>
          </Box>
        </Box>

        {/* EXCHANGE DETAILS - Dynamic */}
        {invoice.exchangeDetails?.hasExchange && (
          <Box
            className="payment-section-modern"
            style={{ borderColor: "#fbbf24", backgroundColor: "#fef3c7" }}
          >
            <Typography
              className="payment-section-title"
              style={{ color: "#92400e" }}
            >
              Exchange Details
            </Typography>
            <Box className="payment-detail-grid">
              <Box className="payment-detail-row">
                <span className="payment-detail-label">Exchange Amount:</span>
                <span className="payment-detail-value">
                  {formatCurrency(invoice.exchangeDetails.exchangeAmount || 0)}
                </span>
              </Box>
              {invoice.exchangeDetails.exchangeDescription && (
                <Box className="payment-detail-row">
                  <span className="payment-detail-label">Description:</span>
                  <span className="payment-detail-value">
                    {invoice.exchangeDetails.exchangeDescription}
                  </span>
                </Box>
              )}
              <Box className="payment-detail-row">
                <span className="payment-detail-label">Item Received:</span>
                <span className="payment-detail-value">
                  {invoice.exchangeDetails.itemReceived ? "Yes" : "No"}
                </span>
              </Box>
            </Box>
          </Box>
        )}

        {/* DELIVERY DETAILS - Dynamic */}
        {(invoice.deliveryStatus ||
          invoice.scheduledDeliveryDate ||
          invoice.deliveryAddress) && (
          <Box
            className="payment-section-modern"
            style={{ borderColor: "#93c5fd", backgroundColor: "#dbeafe" }}
          >
            <Typography
              className="payment-section-title"
              style={{ color: "#1e40af" }}
            >
              Delivery Information
            </Typography>
            <Box className="payment-detail-grid">
              {invoice.deliveryStatus && (
                <Box className="payment-detail-row">
                  <span className="payment-detail-label">Status:</span>
                  <span className="payment-detail-value">
                    {capitalizeStatus(invoice.deliveryStatus)}
                  </span>
                </Box>
              )}
              {invoice.scheduledDeliveryDate && (
                <Box className="payment-detail-row">
                  <span className="payment-detail-label">Scheduled Date:</span>
                  <span className="payment-detail-value">
                    {formatDate(invoice.scheduledDeliveryDate)}
                  </span>
                </Box>
              )}
              {invoice.deliveryAddress && (
                <Box
                  className="payment-detail-row"
                  style={{ gridColumn: "1 / -1" }}
                >
                  <span className="payment-detail-label">Address:</span>
                  <span className="payment-detail-value">
                    {invoice.deliveryAddress}
                  </span>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* PAYMENT INFO - Dynamic Rendering */}
        {(invoice.paymentStatus || invoice.paymentDetails) && (
          <Box className="payment-section-modern">
            <Typography className="payment-section-title">
              Payment Details
            </Typography>
            <Box className="payment-detail-grid">
              <Box className="payment-detail-row">
                <span className="payment-detail-label">Status:</span>
                <span className="payment-detail-value">
                  {capitalizeStatus(invoice.paymentStatus)}
                </span>
              </Box>
              <Box className="payment-detail-row">
                <span className="payment-detail-label">Method:</span>
                <span className="payment-detail-value">
                  {capitalizeStatus(
                    invoice.paymentMethod ||
                      invoice.paymentDetails?.paymentMethod ||
                      "Cash"
                  )}
                </span>
              </Box>

              {invoice.paymentStatus === "emi" && invoice.emiDetails && (
                <>
                  {invoice.emiDetails.downPayment > 0 && (
                    <Box className="payment-detail-row">
                      <span className="payment-detail-label">
                        Down Payment:
                      </span>
                      <span className="payment-detail-value">
                        {formatCurrency(invoice.emiDetails.downPayment)}
                      </span>
                    </Box>
                  )}
                  <Box className="payment-detail-row">
                    <span className="payment-detail-label">Monthly EMI:</span>
                    <span className="payment-detail-value">
                      {formatCurrency(invoice.emiDetails.monthlyAmount)}
                    </span>
                  </Box>
                  <Box className="payment-detail-row">
                    <span className="payment-detail-label">Installments:</span>
                    <span className="payment-detail-value">
                      {invoice.emiDetails.numberOfInstallments} months
                    </span>
                  </Box>
                  <Box className="payment-detail-row">
                    <span className="payment-detail-label">
                      EMI Start Date:
                    </span>
                    <span className="payment-detail-value">
                      {formatDate(invoice.emiDetails.startDate)}
                    </span>
                  </Box>
                  {invoice.paymentDetails?.paidDate && (
                    <Box className="payment-detail-row">
                      <span className="payment-detail-label">
                        Payment Date:
                      </span>
                      <span className="payment-detail-value">
                        {formatDate(invoice.paymentDetails.paidDate)}
                      </span>
                    </Box>
                  )}
                </>
              )}

              {invoice.amountPaid > 0 && (
                <Box className="payment-detail-row">
                  <span className="payment-detail-label">Amount Paid:</span>
                  <span className="payment-detail-value">
                    {formatCurrency(invoice.amountPaid)}
                  </span>
                </Box>
              )}
              {invoice.balanceAmount > 0 && (
                <Box className="payment-detail-row">
                  <span className="payment-detail-label">Balance:</span>
                  <span className="payment-detail-value">
                    {formatCurrency(invoice.balanceAmount)}
                  </span>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* EMI SCHEDULE - Dynamic Rendering */}
        {invoice.paymentStatus === "emi" &&
          invoice.emiDetails?.schedule &&
          invoice.emiDetails.schedule.length > 0 && (
            <Box className="payment-history-wrapper">
              <Typography className="payment-history-heading">
                EMI Schedule
              </Typography>
              <table className="payment-history-table-modern">
                <thead>
                  <tr>
                    <th style={{ width: "15%" }}>Installment #</th>
                    <th style={{ width: "20%" }}>Due Date</th>
                    <th style={{ width: "20%" }} className="text-right">
                      Amount
                    </th>
                    <th style={{ width: "20%" }} className="text-center">
                      Status
                    </th>
                    <th style={{ width: "25%" }}>Paid Date</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.emiDetails.schedule.map((emi, index) => (
                    <tr
                      key={index}
                      style={{
                        backgroundColor: emi.paid ? "#f0fdf4" : "#ffffff",
                      }}
                    >
                      <td>#{emi.installmentNumber}</td>
                      <td>{formatDate(emi.dueDate)}</td>
                      <td>{formatCurrency(emi.amount)}</td>
                      <td
                        style={{
                          fontWeight: "600",
                          color: emi.paid ? "#166534" : "#9ca3af",
                        }}
                      >
                        {emi.paid ? "✓ Paid" : "Pending"}
                      </td>
                      <td>
                        {emi?.paymentHistory
                          ? formatDate(emi?.paymentHistory?.[0].paymentDate)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          )}

        {/* REMARKS SECTION - Dynamic */}
        {invoice.remarks && (
          <Box
            className="payment-section-modern"
            style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
          >
            <Typography
              className="payment-section-title"
              style={{ color: "#374151" }}
            >
              Remarks
            </Typography>
            <div
              className="terms-text"
              style={{
                fontSize: "10px !important",
                color: "#6b7280 !important",
              }}
            >
              {invoice.remarks}
            </div>
          </Box>
        )}

        {/* PAYMENT HISTORY - Dynamic Rendering */}
        {invoice.paymentDetails?.paymentHistory &&
          invoice.paymentDetails.paymentHistory.length > 0 && (
            <Box className="payment-history-wrapper">
              <Typography className="payment-history-heading">
                Payment History
              </Typography>
              <table className="payment-history-table-modern">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="text-right">Amount</th>
                    <th>Method</th>
                    <th>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.paymentDetails.paymentHistory.map(
                    (payment, index) => (
                      <tr key={index}>
                        <td>{formatDate(payment.date)}</td>
                        <td>{formatCurrency(payment.amount)}</td>
                        <td>{capitalizeStatus(payment.method) || "N/A"}</td>
                        <td>{payment.recordedByName || "System"}</td>
                      </tr>
                    )
                  )}
                  <tr>
                    <td>
                      <strong>Total Paid:</strong>
                    </td>
                    <td className="text-right" colSpan="3">
                      <strong>
                        {formatCurrency(
                          invoice.paymentDetails.paymentHistory.reduce(
                            (sum, payment) => sum + (payment.amount || 0),
                            0
                          )
                        )}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Box>
          )}

        {/* FOOTER */}
        <Box className="invoice-footer-modern">
          <Box className="footer-terms">
            <Typography className="terms-heading">
              Terms & Conditions
            </Typography>
            <Box className="terms-text">
              <div>
                1) Goods once sold will not be taken back under any
                circumstances.
              </div>
              <div>2) Cheques are subject to Realisation.</div>
              <div>3) Subject to Viramgam Jurisdiction.</div>
              <div>
                4) Warranty will be covered as per manufacturer's terms and
                conditions.
              </div>
              <div>5) Warranty from Company Not From us.</div>
              <div>
                6) {companyDetails.name} not liable for delays or
                rejections. We will assist and guide you through the service
                process.
              </div>
              <div>
                7) Cheques are in favour of {companyDetails.name}
              </div>
              <div>8) GST billed on all products</div>
            </Box>
          </Box>

          <Box className="footer-signature-qr">
            <Box className="qr-box-modern">
              {qrCodeImage ? (
                <img
                  src={qrCodeImage}
                  alt="QR Code"
                  loading="eager"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                  style={{ opacity: 0, transition: "opacity 0.3s" }}
                  onLoad={(e) => {
                    e.target.style.opacity = "1";
                  }}
                />
              ) : (
                <QRCodeIcon style={{ fontSize: "45px", color: "#9ca3af" }} />
              )}
            </Box>

            <Box className="signature-box-modern">
              {signatureImage ? (
                <img
                  src={signatureImage}
                  alt="Signature"
                  loading="eager"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                  style={{ opacity: 0, transition: "opacity 0.3s" }}
                  onLoad={(e) => {
                    e.target.style.opacity = "1";
                  }}
                />
              ) : (
                <div
                  style={{ height: "100%", borderBottom: "2px solid #111827" }}
                />
              )}
            </Box>
            <Typography className="signature-label-text">
              Authorized Signature
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default PrintableInvoice;
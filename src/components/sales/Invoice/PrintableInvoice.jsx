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

// Define image paths from public folder
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

// Professional print styles optimized for invoices
const invoicePrintStyles = {
  "@media print": {
    // A4 Page setup with proper margins
    "@page": {
      size: "A4",
      margin: "0.6in 0.5in",
      "@top-left": { content: "none" },
      "@top-center": { content: "none" },
      "@top-right": { content: "none" },
      "@bottom-left": { content: "none" },
      "@bottom-center": { content: "none" },
      "@bottom-right": { content: "none" },
    },

    // Hide everything except print content
    "body *": {
      visibility: "hidden !important",
    },
    ".print-invoice-only, .print-invoice-only *": {
      visibility: "visible !important",
    },
    ".print-invoice-only": {
      position: "absolute !important",
      left: "0 !important",
      top: "0 !important",
      width: "100% !important",
      display: "block !important",
      backgroundColor: "white !important",
    },
    ".no-print-invoice": {
      display: "none !important",
    },

    // Reset Material-UI styles for print
    ".MuiCard-root": {
      boxShadow: "none !important",
      border: "none !important",
      margin: "0 !important",
      padding: "0 !important",
      backgroundColor: "transparent !important",
    },
    ".MuiCardContent-root": {
      padding: "0 !important",
      "&:last-child": {
        paddingBottom: "0 !important",
      },
    },
    ".MuiGrid-container": {
      margin: "0 !important",
      width: "100% !important",
    },
    ".MuiGrid-item": {
      padding: "0 !important",
    },

    // Print layout sections
    ".print-invoice-header": {
      borderBottom: "1px solid #000",
      paddingBottom: "15px",
      marginBottom: "25px",
      pageBreakAfter: "avoid",
      display: "flex !important",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    ".print-invoice-company-section": {
      flex: "1",
      paddingRight: "30px",
    },
    ".print-invoice-details-section": {
      textAlign: "right",
      minWidth: "280px",
    },
    ".print-invoice-logo-section": {
      display: "flex !important",
      alignItems: "center",
      marginBottom: "15px",
      gap: "20px",
    },
    ".print-invoice-company-logo": {
      width: "65px",
      height: "65px",
      border: "2px solid #000",
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f8f9fa",
      flexShrink: 0,
      overflow: "hidden",
    },
    ".print-invoice-company-logo img": {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: "6px",
      imageRendering: "auto",
      "-webkit-print-color-adjust": "exact",
      "print-color-adjust": "exact",
    },
    ".print-invoice-customer-sales-section": {
      display: "flex !important",
      justifyContent: "space-between",
      pageBreakAfter: "avoid",
      gap: "20px",
      paddingTop: "20px",
      paddingBottom: "20px",
    },
    ".print-invoice-customer-info, .print-invoice-sales-info": {
      flex: "1",
      border: "1px solid #000",
      padding: "15px",
      borderRadius: "8px",
      backgroundColor: "#fafafa",
      marginBottom: "25px",
    },
    ".print-invoice-items-section": {
      pageBreakInside: "avoid",
      marginBottom: "0px", // No margin to connect with totals
    },
    ".print-invoice-items-table": {
      width: "100%",
      borderCollapse: "collapse",
      border: "1px solid #000",
      marginBottom: "0", // No margin to connect with totals
      "& th": {
        backgroundColor: "#e8f5e8 !important",
        border: "1px solid #000 !important",
        padding: "12px 8px !important",
        fontSize: "12px !important",
        fontWeight: "bold !important",
        textAlign: "center !important",
        lineHeight: "1.3 !important",
      },
      "& td": {
        border: "1px solid #000 !important",
        padding: "10px 8px !important",
        fontSize: "11px !important",
        verticalAlign: "top !important",
        lineHeight: "1.4 !important",
      },
      "& thead": {
        pageBreakAfter: "avoid",
      },
      "& tbody tr": {
        pageBreakInside: "avoid",
        pageBreakAfter: "auto",
      },
    },
    // NEW: Divider after items table
    ".print-invoice-totals-divider": {
      borderTop: "1px solid #000",
      margin: "0",
      marginBottom: "20px",
    },
    ".print-invoice-totals-section": {
      display: "flex !important",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "30px",
      pageBreakInside: "avoid",
      gap: "25px",
    },
    ".print-invoice-remarks-section": {
      flex: "1",
    },
    ".print-invoice-totals-box": {
      border: "3px solid #000",
      padding: "20px",
      minWidth: "280px",
      backgroundColor: "#f0f8ff",
      borderRadius: "8px",
    },
    ".print-invoice-payment-details": {
      border: "2px solid #4caf50",
      padding: "18px",
      marginBottom: "25px",
      backgroundColor: "#e8f5e8",
      borderRadius: "8px",
      pageBreakInside: "avoid",
    },
    ".print-invoice-footer-section": {
      display: "flex !important",
      justifyContent: "space-between",
      alignItems: "flex-start", // FIXED: Changed from flex-end to flex-start for proper alignment
      marginTop: "40px",
      borderTop: "2px solid #000",
      paddingTop: "20px",
      pageBreakInside: "avoid",
    },
    ".print-invoice-thank-you-section": {
      flex: "1",
      paddingRight: "25px",
    },
    ".print-invoice-qr-section": {
      textAlign: "center",
      minWidth: "140px", // Fixed width for consistency
    },
    ".print-invoice-qr-code": {
      width: "140px",
      height: "140px",
      border: "2px solid #000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
      overflow: "hidden",
    },
    ".print-invoice-qr-code img": {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: "6px",
      imageRendering: "auto",
      "-webkit-print-color-adjust": "exact",
      "print-color-adjust": "exact",
    },
    ".print-invoice-signature": {
      width: "140px",
      height: "50px",
      margin: "0 auto 8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    ".print-invoice-signature img": {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      imageRendering: "auto",
      "-webkit-print-color-adjust": "exact",
      "print-color-adjust": "exact",
    },

    // Typography adjustments for print
    h1: {
      fontSize: "28px !important",
      margin: "0 0 10px 0 !important",
      fontWeight: "bold !important",
    },
    h2: {
      fontSize: "22px !important",
      margin: "0 0 8px 0 !important",
      fontWeight: "bold !important",
    },
    h3: {
      fontSize: "18px !important",
      margin: "0 0 6px 0 !important",
      fontWeight: "bold !important",
    },
    h4: {
      fontSize: "15px !important",
      margin: "0 0 5px 0 !important",
      fontWeight: "bold !important",
    },
    h5: {
      fontSize: "13px !important",
      margin: "0 0 4px 0 !important",
      fontWeight: "bold !important",
    },
    h6: {
      fontSize: "12px !important",
      margin: "0 0 3px 0 !important",
      fontWeight: "bold !important",
    },
    "p, div, span": {
      fontSize: "11px !important",
      lineHeight: "1.5 !important",
      margin: "0 !important",
    },
    small: { fontSize: "10px !important" },

    // Force black text and proper backgrounds
    "*, *::before, *::after": {
      color: "black !important",
      backgroundColor: "transparent !important",
      "-webkit-print-color-adjust": "exact !important",
      "print-color-adjust": "exact !important",
    },
    ".print-invoice-totals-box, .print-invoice-payment-details, .print-invoice-company-logo, .print-invoice-qr-code, .print-invoice-customer-info, .print-invoice-sales-info, .print-invoice-payment-status-section":
      {
        backgroundColor: "#f5f5f5 !important",
        "-webkit-print-color-adjust": "exact !important",
        "print-color-adjust": "exact !important",
      },
    ".print-invoice-items-table th": {
      backgroundColor: "#e8f5e8 !important",
      "-webkit-print-color-adjust": "exact !important",
      "print-color-adjust": "exact !important",
    },

    // Page break controls
    ".print-page-break-before": { pageBreakBefore: "always" },
    ".print-page-break-after": { pageBreakAfter: "always" },
    ".print-page-break-avoid": { pageBreakInside: "avoid" },
  },
};

const PrintableInvoice = ({ invoice, onPrint, autoTriggerPrint = false }) => {
  const { userType } = useUserType();
  // State for image loading
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imagesToLoad, setImagesToLoad] = useState([]);
  // UPDATED: Use company details from invoice or fallback to defaults
  const getCompanyDetails = () => {
    // If invoice has company information, use it
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

    // Fallback to default values
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

  // Helper function to get company logo based on company name
  const getCompanyLogo = (companyName) => {
    if (!companyName) return null;

    const name = companyName.toLowerCase();
    if (name.includes("patel electronics and furniture")) {
      return IMAGE_PATHS.logos.electronicFurniture;
    } else if (name.includes("patel engineering works")) {
      return IMAGE_PATHS.logos.engineeringWorks;
    } else if (name.includes("patel furniture")) {
      return IMAGE_PATHS.logos.furniture;
    } else if (
      name.includes("m-raj steel sydicate") ||
      name.includes("m raj steel syndicate")
    ) {
      return IMAGE_PATHS.logos.steelSyndicate;
    }
    return null;
  };

  // Helper function to get QR code based on user type
  const getQRCode = (userType) => {
    if (userType === "furniture") {
      return IMAGE_PATHS.qrCodes.furniture;
    } else if (userType === "electronics") {
      return IMAGE_PATHS.qrCodes.electronics;
    }
    return null;
  };

  // Helper function to get signature based on user type
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

  // Preload images effect
  useEffect(() => {
    const imagesToPreload = [companyLogo, qrCodeImage, signatureImage].filter(
      Boolean
    );

    if (imagesToPreload.length === 0) {
      setImagesLoaded(true);
      return;
    }

    setImagesToLoad(imagesToPreload);

    const preloadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(src);
        img.onerror = () => resolve(src); // Resolve even on error to prevent blocking
        img.src = src;
      });
    };

    const preloadAllImages = async () => {
      try {
        await Promise.all(imagesToPreload.map(preloadImage));
        setImagesLoaded(true);
      } catch (error) {
        console.warn("Some images failed to preload:", error);
        setImagesLoaded(true); // Still proceed to allow printing
      }
    };

    preloadAllImages();
  }, [companyLogo, qrCodeImage, signatureImage]);

  // Auto-trigger print when component mounts, autoTriggerPrint is true, AND images are loaded
  useEffect(() => {
    if (autoTriggerPrint && imagesLoaded) {
      // Small delay to ensure component is fully rendered
      const timer = setTimeout(() => {
        handlePrint();
      }, 200); // Slightly longer delay

      return () => clearTimeout(timer);
    }
  }, [autoTriggerPrint, imagesLoaded]);

  // Handle print events
  useEffect(() => {
    if (autoTriggerPrint) {
      const handleAfterPrint = () => {
        // Call the onPrint callback when printing is done
        if (onPrint) {
          onPrint();
        }
      };

      const handleBeforePrint = () => {
        console.log("Print dialog opened");
      };

      // Listen for print events
      window.addEventListener("afterprint", handleAfterPrint);
      window.addEventListener("beforeprint", handleBeforePrint);

      // Also handle case where user cancels print dialog
      // This is a bit tricky - we'll use a timeout approach
      let printCheckTimer;

      const clearPrintCheck = () => {
        if (printCheckTimer) {
          clearTimeout(printCheckTimer);
        }
      };

      window.addEventListener("beforeprint", clearPrintCheck);
      window.addEventListener("afterprint", clearPrintCheck);

      return () => {
        window.removeEventListener("afterprint", handleAfterPrint);
        window.removeEventListener("beforeprint", handleBeforePrint);
        window.removeEventListener("beforeprint", clearPrintCheck);
        window.removeEventListener("afterprint", clearPrintCheck);
        if (printCheckTimer) {
          clearTimeout(printCheckTimer);
        }
      };
    }
  }, [autoTriggerPrint, onPrint]);

  const handlePrint = async () => {
    // If images aren't loaded yet, wait for them
    if (!imagesLoaded && imagesToLoad.length > 0) {
      console.log("Waiting for images to load before printing...");
      // Wait up to 3 seconds for images to load
      const maxWaitTime = 3000;
      const startTime = Date.now();

      while (!imagesLoaded && Date.now() - startTime < maxWaitTime) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Add small delay to ensure images are rendered
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <>
      <GlobalStyles styles={invoicePrintStyles} />

      {/* Screen view - Only show if NOT auto-triggering print */}
      {!autoTriggerPrint && (
        <Box className="no-print-invoice" sx={{ textAlign: "center", p: 2 }}>
          <Typography variant="h5" gutterBottom>
            Invoice Print Preview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This is how your invoice will look when printed
          </Typography>

          {/* Show loading state if images are still loading */}
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
                !imagesLoaded && imagesToLoad.length > 0 ? "#ccc" : "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                !imagesLoaded && imagesToLoad.length > 0
                  ? "not-allowed"
                  : "pointer",
              marginBottom: "20px",
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
            backgroundColor: "rgba(255, 255, 255, 0.9)",
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

      {/* Print-only content */}
      <Box
        className="print-invoice-only"
        sx={{ display: autoTriggerPrint ? "block" : "none" }}
      >
        {/* Header with Company Info and Invoice Details */}
        <Box className="print-invoice-header">
          <Box className="print-invoice-company-section">
            <Box className="print-invoice-logo-section">
              <Box className="print-invoice-company-logo">
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt="Company Logo"
                    loading="eager"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                    onLoad={(e) => {
                      e.target.style.opacity = "1";
                    }}
                    style={{ opacity: 0, transition: "opacity 0.3s" }}
                  />
                ) : null}
                <BusinessIcon
                  style={{
                    fontSize: "35px",
                    display: companyLogo ? "none" : "block",
                  }}
                />
              </Box>
              <Box>
                <Typography
                  variant="h2"
                  style={{ fontWeight: "bold", marginBottom: "5px" }}
                >
                  {companyDetails.name}
                </Typography>
              </Box>
            </Box>

            <Box style={{ fontSize: "11px", lineHeight: "1.5" }}>
              <Typography variant="body2">
                {companyDetails.address}, {companyDetails.city}
              </Typography>
              <Typography variant="body2">
                {companyDetails.state} - {companyDetails.pincode}
              </Typography>
              <Typography variant="body2">
                Phone: {companyDetails.phone} | Email: {companyDetails.email}
              </Typography>
              <Typography variant="body2">GST: {companyDetails.gst}</Typography>
              <Typography variant="body2">
                Website: {companyDetails.website}
              </Typography>
            </Box>
          </Box>

          <Box className="print-invoice-details-section">
            <Typography
              variant="h1"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                marginBottom: "15px",
              }}
            >
              <ReceiptIcon style={{ fontSize: "28px" }} />
              INVOICE
            </Typography>

            <Box
              style={{
                border: "1px solid #000",
                padding: "15px",
                backgroundColor: "#f0f8ff",
                borderRadius: "8px",
                textAlign: "left",
              }}
            >
              <Typography variant="body1" style={{ marginBottom: "5px" }}>
                <strong>Invoice #:</strong> {invoice.invoiceNumber}
              </Typography>
              <Typography variant="body1" style={{ marginBottom: "5px" }}>
                <strong>Date:</strong> {formatDate(invoice.saleDate)}
              </Typography>
              {invoice.dueDate && (
                <Typography variant="body1" style={{ marginBottom: "5px" }}>
                  <strong>Due Date:</strong> {formatDate(invoice.dueDate)}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* Customer and Sales Person Information */}
        <Box className="print-invoice-customer-sales-section">
          <Box className="print-invoice-customer-info">
            <Typography
              variant="h4"
              style={{
                marginBottom: "10px",
                borderBottom: "1px solid #000",
                paddingBottom: "8px",
                paddingTop: "3px",
              }}
            >
              Bill To:
            </Typography>
            <Typography
              variant="h5"
              style={{ fontWeight: "bold", marginBottom: "6px" }}
            >
              {invoice.customerName || "Customer Name"}
            </Typography>
            {invoice.customerPhone && (
              <Typography variant="body2" style={{ marginBottom: "3px" }}>
                Phone: {invoice.customerPhone}
              </Typography>
            )}
            {invoice.customerAddress && (
              <Typography variant="body2" style={{ marginBottom: "3px" }}>
                Address: {invoice.customerAddress}
              </Typography>
            )}
            {invoice.customerState && (
              <Typography variant="body2" style={{ marginBottom: "3px" }}>
                State: {invoice.customerState}
              </Typography>
            )}
            {invoice.customerGSTNumber && (
              <Typography variant="body2">
                GST: {invoice.customerGSTNumber}
              </Typography>
            )}
          </Box>

          <Box className="print-invoice-sales-info">
            <Typography
              variant="h4"
              style={{
                marginBottom: "10px",
                borderBottom: "1px solid #000",
                paddingBottom: "8px",
                paddingTop: "3px",
              }}
            >
              Sales Person:
            </Typography>
            <Typography
              variant="h5"
              style={{ fontWeight: "bold", marginBottom: "6px" }}
            >
              {invoice.salesPersonName || "Sales Person"}
            </Typography>
            <Typography variant="body2" style={{ color: "#666" }}>
              Sales Representative
            </Typography>
            <Typography variant="body2" style={{ marginTop: "5px" }}>
              Sale Date: {formatDate(invoice.saleDate)}
            </Typography>
          </Box>
        </Box>

        {/* Items Table */}
        <Box className="print-invoice-items-section">
          <Typography variant="h4" style={{ marginBottom: "12px" }}>
            Invoice Items
            {/* UPDATED: Show bulk pricing indicator if applicable */}
            {(invoice.bulkPricingApplied || invoice.bulkPricingDetails) && (
              <span
                style={{
                  marginLeft: "10px",
                  border: "1px solid #4caf50",
                  padding: "2px 6px",
                  fontSize: "9px",
                  backgroundColor: "#e8f5e8",
                  borderRadius: "4px",
                }}
              >
                Bulk Pricing Applied
              </span>
            )}
          </Typography>

          <table className="print-invoice-items-table">
            <thead>
              <tr>
                <th style={{ width: "5%" }}>#</th>
                <th style={{ width: "30%" }}>Description</th>
                <th style={{ width: "10%" }}>HSN Code</th>
                <th style={{ width: "8%" }}>Qty</th>
                <th style={{ width: "12%" }}>Unit Rate</th>
                {invoice.includeGST && <th style={{ width: "10%" }}>GST %</th>}
                <th style={{ width: "15%" }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={index}>
                  <td style={{ textAlign: "center", fontWeight: "bold" }}>
                    {index + 1}
                  </td>
                  <td>
                    <strong style={{ fontSize: "12px" }}>{item.name}</strong>
                    {item.description && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#666",
                          marginTop: "3px",
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                    {/* UPDATED: Show bulk pricing indicator for individual items */}
                    {(invoice.bulkPricingApplied || item.bulkPricing) && (
                      <div style={{ marginTop: "3px" }}>
                        <span
                          style={{
                            border: "1px solid #4caf50",
                            padding: "1px 4px",
                            fontSize: "8px",
                            backgroundColor: "#e8f5e8",
                            borderRadius: "3px",
                          }}
                        >
                          Bulk Pricing Applied
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: "center", fontFamily: "monospace" }}>
                    {item.hsnCode || "-"}
                  </td>
                  <td style={{ textAlign: "center", fontWeight: "bold" }}>
                    {item.quantity}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {/* UPDATED: Show bulk pricing indicator or actual rate */}
                    {invoice.bulkPricingApplied || item.bulkPricing ? (
                      <span
                        style={{
                          border: "1px solid #4caf50",
                          padding: "1px 4px",
                          fontSize: "8px",
                          backgroundColor: "#e8f5e8",
                          borderRadius: "3px",
                        }}
                      >
                        Bulk
                      </span>
                    ) : (
                      formatCurrency(item.rate || 0)
                    )}
                  </td>
                  {invoice.includeGST && (
                    <td style={{ textAlign: "center" }}>
                      {/* UPDATED: Show bulk GST slab or individual item GST */}
                      {invoice.bulkPricingApplied || item.bulkPricing
                        ? `${invoice.bulkPricingDetails?.gstSlab || 18}%`
                        : `${item.gstSlab || 18}%`}
                    </td>
                  )}
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    {/* UPDATED: Show bulk pricing indicator or actual amount */}
                    {invoice.bulkPricingApplied || item.bulkPricing ? (
                      <span
                        style={{
                          border: "1px solid #2196f3",
                          padding: "1px 4px",
                          fontSize: "8px",
                          backgroundColor: "#e3f2fd",
                          borderRadius: "3px",
                        }}
                      >
                        See Below
                      </span>
                    ) : (
                      formatCurrency(
                        item.totalAmount || item.quantity * item.rate
                      )
                    )}
                  </td>
                </tr>
              ))}

              {(!invoice.items || invoice.items.length === 0) && (
                <tr>
                  <td
                    colSpan={invoice.includeGST ? 7 : 6}
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#666",
                      fontStyle: "italic",
                    }}
                  >
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>

        {/* NEW: Divider line after items table */}
        <hr className="print-invoice-totals-divider" />

        {/* Totals Section with Remarks - NOW BELOW THE DIVIDER */}
        <Box className="print-invoice-totals-section">
          <Box className="print-invoice-remarks-section">
            {invoice.remarks && (
              <Box>
                <Typography variant="h4" style={{ marginBottom: "8px" }}>
                  Remarks:
                </Typography>
                <Typography
                  variant="body2"
                  style={{
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.5",
                    padding: "10px",
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                >
                  {invoice.remarks}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Totals Box - Now displays like quotation page */}
          <Box>
            <Box
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <Typography variant="body2">Subtotal:</Typography>
              <Typography variant="body2" style={{ fontWeight: "bold" }}>
                {formatCurrency(invoice.subtotal || 0)}
              </Typography>
            </Box>

            {invoice.includeGST && invoice.totalGST > 0 && (
              <Box
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <Typography variant="body2">
                  Total GST (
                  {invoice.customerState?.toLowerCase() === "gujarat"
                    ? "CGST+SGST"
                    : "IGST"}
                  ):
                </Typography>
                <Typography variant="body2" style={{ fontWeight: "bold" }}>
                  {formatCurrency(invoice.totalGST || 0)}
                </Typography>
              </Box>
            )}

            <hr
              style={{
                margin: "10px 0",
                border: "none",
                borderTop: "2px solid #000",
              }}
            />

            <Box style={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h5" style={{ fontWeight: "bold" }}>
                Grand Total:
              </Typography>
              <Typography
                variant="h5"
                style={{ fontWeight: "bold", color: "#2e7d32" }}
              >
                {formatCurrency(invoice.grandTotal || 0)}
              </Typography>
            </Box>

            {/* EXCHANGE CREDIT DISPLAY */}
            {invoice.exchangeDetails?.hasExchange &&
              invoice.exchangeDetails?.exchangeAmount > 0 && (
                <Box
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                  }}
                >
                  <Typography variant="body2" style={{ color: "#4caf50" }}>
                    Less: Exchange Credit:
                  </Typography>
                  <Typography
                    variant="body2"
                    style={{ fontWeight: "bold", color: "#4caf50" }}
                  >
                    -{formatCurrency(invoice.exchangeDetails.exchangeAmount)}
                  </Typography>
                </Box>
              )}

            {invoice.exchangeDetails?.hasExchange && (
              <>
                <hr
                  style={{
                    margin: "10px 0",
                    border: "none",
                    borderTop: "2px solid #000",
                  }}
                />
                <Box
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Typography variant="h5" style={{ fontWeight: "bold" }}>
                    {invoice.exchangeDetails?.hasExchange
                      ? "Net Payable:"
                      : "Grand Total:"}
                  </Typography>
                  <Typography
                    variant="h5"
                    style={{ fontWeight: "bold", color: "#2e7d32" }}
                  >
                    {formatCurrency(
                      invoice.exchangeDetails?.hasExchange && invoice.netPayable
                        ? invoice.netPayable
                        : invoice.grandTotal || 0
                    )}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Box>

        {/* PAYMENT DETAILS SECTION - MOVED TO END */}
        {(invoice.paymentStatus === "finance" ||
          invoice.paymentStatus === "bank_transfer" ||
          invoice.paymentStatus === "pending" ||
          invoice.paymentStatus === "emi") && (invoice.paymentDetails?.downPayment) ? (
            <Box
              style={{
                // border: "2px solid #000",
                padding: "15px",
                backgroundColor: "#e3f2fd",
                // borderRadius: "8px",
                margin: "15px",
                pageBreakInside: "avoid",
              }}>
              <Typography
                variant="h4"
                style={{
                  marginBottom: "10px",
                  borderBottom: "1px solid #000",
                  paddingBottom: "8px",
                  color: "#e3f0002fd",
                }}
              >
                Payment Details:
              </Typography>

              <Box style={{ fontSize: "11px", lineHeight: "1.6" }}>
                {/* Finance Details */}
                {invoice.paymentStatus === "finance" && (
                  <>
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <Typography variant="body2">
                        <strong>Finance Company:</strong>
                      </Typography>
                      <Typography variant="body2">
                        {invoice.paymentDetails?.financeCompany || "N/A"}
                      </Typography>
                    </Box>
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <Typography variant="body2">
                        <strong>Down Payment:</strong>
                      </Typography>
                      <Typography
                        variant="body2"
                        style={{ fontWeight: "bold" }}
                      >
                        {formatCurrency(
                          invoice.paymentDetails?.downPayment || 0
                        )}
                      </Typography>
                    </Box>
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <Typography variant="body2">
                        <strong>Remaining Balance:</strong>
                      </Typography>
                      <Typography
                        variant="body2"
                        style={{ fontWeight: "bold", color: "#f57c00" }}
                      >
                        {formatCurrency(
                          invoice.paymentDetails?.remainingBalance || 0
                        )}
                      </Typography>
                    </Box>
                  </>
                )}

                {/* Bank Transfer Details */}
                {invoice.paymentStatus === "bank_transfer" && (
                  <>
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <Typography variant="body2">
                        <strong>Bank Name:</strong>
                      </Typography>
                      <Typography variant="body2">
                        {invoice.paymentDetails?.bankName || "N/A"}
                      </Typography>
                    </Box>
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <Typography variant="body2">
                        <strong>Down Payment:</strong>
                      </Typography>
                      <Typography
                        variant="body2"
                        style={{ fontWeight: "bold" }}
                      >
                        {formatCurrency(
                          invoice.paymentDetails?.downPayment || 0
                        )}
                      </Typography>
                    </Box>
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <Typography variant="body2">
                        <strong>Remaining Balance:</strong>
                      </Typography>
                      <Typography
                        variant="body2"
                        style={{ fontWeight: "bold", color: "#f57c00" }}
                      >
                        {formatCurrency(
                          invoice.paymentDetails?.remainingBalance || 0
                        )}
                      </Typography>
                    </Box>
                  </>
                )}

                {/* Pending Payment Details */}
                {invoice.paymentStatus === "pending" &&
                  invoice.paymentDetails?.downPayment > 0 && (
                    <>
                      <Box
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "5px",
                        }}
                      >
                        <Typography variant="body2">
                          <strong>Amount Paid:</strong>
                        </Typography>
                        <Typography
                          variant="body2"
                          style={{ fontWeight: "bold" }}
                        >
                          {formatCurrency(
                            invoice.paymentDetails?.downPayment || 0
                          )}
                        </Typography>
                      </Box>
                      <Box
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "5px",
                        }}
                      >
                        <Typography variant="body2">
                          <strong>Remaining Balance:</strong>
                        </Typography>
                        <Typography
                          variant="body2"
                          style={{ fontWeight: "bold", color: "#f57c00" }}
                        >
                          {formatCurrency(
                            invoice.paymentDetails?.remainingBalance || 0
                          )}
                        </Typography>
                      </Box>
                    </>
                  )}

                {/* EMI Details */}
                {invoice.paymentStatus === "emi" && invoice.emiDetails && (
                  <>
                    {invoice.emiDetails.downPayment > 0 && (
                      <Box
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "5px",
                        }}
                      >
                        <Typography variant="body2">
                          <strong>Down Payment:</strong>
                        </Typography>
                        <Typography
                          variant="body2"
                          style={{ fontWeight: "bold" }}
                        >
                          {formatCurrency(invoice.emiDetails.downPayment || 0)}
                        </Typography>
                      </Box>
                    )}
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <Typography variant="body2">
                        <strong>Monthly EMI:</strong>
                      </Typography>
                      <Typography
                        variant="body2"
                        style={{ fontWeight: "bold" }}
                      >
                        {formatCurrency(invoice.emiDetails.monthlyAmount || 0)}
                      </Typography>
                    </Box>
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <Typography variant="body2">
                        <strong>Number of Installments:</strong>
                      </Typography>
                      <Typography variant="body2">
                        {invoice.emiDetails.numberOfInstallments || 0} months
                      </Typography>
                    </Box>
                    <Box
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <Typography variant="body2">
                        <strong>EMI Start Date:</strong>
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(invoice.emiDetails.startDate)}
                      </Typography>
                    </Box>
                  </>
                )}

                {invoice.paymentDetails?.paymentReference && (
                  <Box
                    style={{
                      marginTop: "8px",
                      paddingTop: "8px",
                      borderTop: "1px solid #90caf9",
                    }}
                  >
                    <Typography variant="body2" style={{ fontSize: "10px" }}>
                      <strong>Reference:</strong>{" "}
                      {invoice.paymentDetails.paymentReference}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          ) : null}

        {/* PAYMENT HISTORY SECTION - NEW */}
        {invoice.paymentDetails?.paymentHistory &&
          invoice.paymentDetails.paymentHistory.length > 0 && (
            <Box
              style={{
                border: "1px solid #000",
                padding: "15px",
                margin: "25px",
                backgroundColor: "#f1f8e9",
                borderRadius: "8px",
                pageBreakInside: "avoid",
              }}
            >
              <Typography
                variant="h4"
                style={{
                  marginBottom: "10px",
                  borderBottom: "1px solid #000",
                  paddingBottom: "8px",
                  color: "#000",
                }}
              >
                Payment History:
              </Typography>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "10px",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#c8e6c9" }}>
                    <th
                      style={{
                        border: "1px solid #000",
                        padding: "6px",
                        textAlign: "left",
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        border: "1px solid #000",
                        padding: "6px",
                        textAlign: "right",
                      }}
                    >
                      Amount
                    </th>
                    <th
                      style={{
                        border: "1px solid #000",
                        padding: "6px",
                        textAlign: "left",
                      }}
                    >
                      Method
                    </th>
                    <th
                      style={{
                        border: "1px solid #000",
                        padding: "6px",
                        textAlign: "left",
                      }}
                    >
                      Recorded By
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.paymentDetails.paymentHistory.map(
                    (payment, index) => (
                      <tr key={index}>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px",
                          }}
                        >
                          {formatDate(payment.date)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px",
                            textAlign: "right",
                            fontWeight: "bold",
                          }}
                        >
                          {formatCurrency(payment.amount)}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px",
                          }}
                        >
                          {payment.method?.toUpperCase() || "N/A"}
                        </td>
                        <td
                          style={{
                            border: "1px solid #000",
                            padding: "6px",
                          }}
                        >
                          {payment.recordedByName || "System"}
                        </td>
                      </tr>
                    )
                  )}
                  <tr
                    style={{ backgroundColor: "#e8f5e9", fontWeight: "bold" }}
                  >
                    <td
                      style={{ border: "1px solid #000", padding: "6px" }}
                      colSpan="1"
                    >
                      <strong>Total Paid:</strong>
                    </td>
                    <td
                      style={{
                        border: "1px solid #000",
                        padding: "6px",
                        textAlign: "right",
                      }}
                      colSpan="3"
                    >
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

        {/* Footer with QR Code and Signature - FIXED ALIGNMENT */}
        <Box className="print-invoice-footer-section">
          <Box className="print-invoice-thank-you-section">
            <Typography
              variant="h5"
              style={{ marginBottom: "8px", color: "#1976d2" }}
            >
              Terms & Conditions:
            </Typography>

            <Box style={{ fontSize: "10px", lineHeight: "1.4" }}>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                1) Goods once sold will not be taken back under any
                circumstances.
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                2) Cheques are subject to Realisation.
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                3) Subject to Viramgam Jurisdiction.
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                4) Warranty will be covered as per manufacturer's terms and
                conditions.
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                5) Warranty from Company Not From us.
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                6) Patel Electronics & Furniture not liable for delays or
                rejections. We will assist and guide you through the service
                process.
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                7) Cheques are in favour of PATEL ELECTRONICS & FURNITURE
              </Typography>
              <Typography
                variant="body2"
                style={{ marginBottom: "3px", fontSize: "10px" }}
              >
                8) GST billed on all products
              </Typography>
            </Box>
          </Box>

          <Box className="print-invoice-qr-section">
            <Box className="print-invoice-qr-code">
              {qrCodeImage ? (
                <img
                  src={qrCodeImage}
                  alt="QR Code"
                  loading="eager"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                  onLoad={(e) => {
                    e.target.style.opacity = "1";
                  }}
                  style={{ opacity: 0, transition: "opacity 0.3s" }}
                />
              ) : null}
              <QRCodeIcon
                style={{
                  fontSize: "50px",
                  display: qrCodeImage ? "none" : "block",
                }}
              />
            </Box>

            {/* Signature */}
            <Box
              style={{ textAlign: "center", width: "100%", paddingTop: "10px" }}
            >
              <Box className="print-invoice-signature">
                {signatureImage ? (
                  <img
                    src={signatureImage}
                    alt="Signature"
                    loading="eager"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                    onLoad={(e) => {
                      e.target.style.opacity = "1";
                    }}
                    style={{ opacity: 0, transition: "opacity 0.3s" }}
                  />
                ) : null}
                <div
                  style={{
                    borderBottom: "1px solid #000",
                    width: "100%",
                    height: "100%",
                    display: signatureImage ? "none" : "block",
                  }}
                />
              </Box>
              <Typography
                variant="body2"
                style={{
                  fontSize: "11px",
                  textAlign: "center",
                  paddingTop: "10px",
                }}
              >
                Authorized Signature
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default PrintableInvoice;

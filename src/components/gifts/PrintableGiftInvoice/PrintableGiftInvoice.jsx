// src/components/gifts/PrintableGiftInvoice/PrintableGiftInvoice.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, GlobalStyles } from "@mui/material";
import {
  Business as BusinessIcon,
  CardGiftcard as GiftIcon,
  QrCode as QRCodeIcon,
} from "@mui/icons-material";
import { formatDate } from "../../../utils/helpers/formatHelpers";
import { useUserType } from "../../../contexts/UserTypeContext";
import { 
  ITEM_DELIVERY_STATUS,
  ITEM_DELIVERY_STATUS_DISPLAY 
} from "../../../utils/constants/index";

// Define image paths from public folder
const IMAGE_PATHS = {
  logos: {
    electronicFurniture: "/assets/electronic_furniture.jpeg",
    engineeringWorks: "/assets/engineering_works.jpeg",
    furniture: "/assets/furniture.jpeg",
    steelSyndicate: "/assets/steel_syndicate.jpeg",
  },
  signatures: {
    mohammed: "/assets/mohammed_sign.jpeg",
    abbas: "/assets/abbas_sign.jpeg",
  },
};

// Professional print styles for gift invoices
const giftInvoicePrintStyles = {
  "@media print": {
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

    "body *": {
      visibility: "hidden !important",
    },
    ".print-gift-invoice-only, .print-gift-invoice-only *": {
      visibility: "visible !important",
    },
    ".print-gift-invoice-only": {
      position: "absolute !important",
      left: "0 !important",
      top: "0 !important",
      width: "100% !important",
      display: "block !important",
      backgroundColor: "white !important",
    },
    ".no-print-gift": {
      display: "none !important",
    },

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

    ".print-gift-header": {
      borderBottom: "2px solid #000",
      paddingBottom: "15px",
      marginBottom: "25px",
      pageBreakAfter: "avoid",
      display: "flex !important",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    ".print-gift-company-section": {
      flex: "1",
      paddingRight: "30px",
    },
    ".print-gift-details-section": {
      textAlign: "right",
      minWidth: "150px",
      maxWidth: "250px",
    },
    ".print-gift-logo-section": {
      display: "flex !important",
      alignItems: "center",
      marginBottom: "15px",
      gap: "20px",
    },
    ".print-gift-company-logo": {
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
    ".print-gift-company-logo img": {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      borderRadius: "6px",
      imageRendering: "auto",
      "-webkit-print-color-adjust": "exact",
      "print-color-adjust": "exact",
    },
    ".print-gift-customer-section": {
      display: "flex !important",
      justifyContent: "space-between",
      pageBreakAfter: "avoid",
      gap: "20px",
      paddingTop: "20px",
      paddingBottom: "20px",
    },
    ".print-gift-customer-info": {
      flex: "1",
      border: "1px solid #000",
      padding: "15px",
      borderRadius: "8px",
      backgroundColor: "#fafafa",
      marginBottom: "25px",
    },
    ".print-gift-items-section": {
      pageBreakInside: "avoid",
      marginBottom: "25px",
    },
    ".print-gift-items-table": {
      width: "100%",
      borderCollapse: "collapse",
      border: "1px solid #000",
      marginBottom: "0",
      "& th": {
        backgroundColor: "#ffe4e1 !important",
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
    ".print-gift-complimentary-banner": {
      backgroundColor: "#fff3cd !important",
      border: "3px solid #ffc107",
      padding: "20px",
      textAlign: "center",
      marginBottom: "25px",
      borderRadius: "8px",
      "-webkit-print-color-adjust": "exact !important",
      "print-color-adjust": "exact !important",
    },
    ".print-gift-footer-section": {
      display: "flex !important",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginTop: "40px",
      borderTop: "2px solid #000",
      paddingTop: "20px",
      pageBreakInside: "avoid",
    },
    ".print-gift-thank-you-section": {
      flex: "1",
      paddingRight: "25px",
    },
    ".print-gift-signature-section": {
      textAlign: "center",
      minWidth: "180px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },
    ".print-gift-signature": {
      width: "140px",
      height: "50px",
      margin: "0 auto 8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    ".print-gift-signature img": {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      imageRendering: "auto",
      "-webkit-print-color-adjust": "exact",
      "print-color-adjust": "exact",
    },
    ".print-gift-linked-invoice": {
      border: "2px dashed #4caf50",
      padding: "15px",
      backgroundColor: "#e8f5e8",
      borderRadius: "8px",
      marginBottom: "20px",
      "-webkit-print-color-adjust": "exact !important",
      "print-color-adjust": "exact !important",
    },

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

    "*, *::before, *::after": {
      color: "black !important",
      backgroundColor: "transparent !important",
      "-webkit-print-color-adjust": "exact !important",
      "print-color-adjust": "exact !important",
    },
    ".print-gift-complimentary-banner, .print-gift-company-logo, .print-gift-customer-info, .print-gift-linked-invoice":
      {
        backgroundColor: "#f5f5f5 !important",
        "-webkit-print-color-adjust": "exact !important",
        "print-color-adjust": "exact !important",
      },
    ".print-gift-items-table th": {
      backgroundColor: "#ffe4e1 !important",
      "-webkit-print-color-adjust": "exact !important",
      "print-color-adjust": "exact !important",
    },
    ".print-gift-complimentary-banner": {
      backgroundColor: "#fff3cd !important",
    },
    ".print-gift-linked-invoice": {
      backgroundColor: "#e8f5e8 !important",
    },

    ".page-break-before": {
      pageBreakBefore: "always !important",
    },
    ".page-break-after": {
      pageBreakAfter: "always !important",
    },
    ".page-break-inside-avoid": {
      pageBreakInside: "avoid !important",
    },
  },
};

/**
 * PrintableGiftInvoice Component
 * Professional gift invoice print layout
 */
const PrintableGiftInvoice = ({
  giftInvoice = {},
  autoTriggerPrint = false,
  onPrint = null,
}) => {
  const { userType } = useUserType();
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  const companyDetails = giftInvoice.company || {};

  // Helper function to get company logo based on company name (same logic as PrintableInvoice)
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

  // Helper function to get signature based on user type (same logic as PrintableInvoice)
  const getSignature = (userType) => {
    if (userType === "furniture") {
      return IMAGE_PATHS.signatures.mohammed;
    } else if (userType === "electronics") {
      return IMAGE_PATHS.signatures.abbas;
    }
    return null;
  };

  const companyLogo = getCompanyLogo(companyDetails.name);
  const signatureImage = getSignature(userType);

  const [imagesToLoad] = useState(() => {
    const images = [];
    if (companyLogo) images.push(companyLogo);
    if (signatureImage) images.push(signatureImage);
    return images;
  });

  useEffect(() => {
    if (imagesToLoad.length === 0) {
      setImagesLoaded(true);
      return;
    }

    let loadedCount = 0;
    const imagePromises = imagesToLoad.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            loadedCount++;
            if (loadedCount === imagesToLoad.length) {
              setImagesLoaded(true);
            }
            resolve();
          };
          img.onerror = () => {
            loadedCount++;
            if (loadedCount === imagesToLoad.length) {
              setImagesLoaded(true);
            }
            resolve();
          };
          img.src = src;
        })
    );

    Promise.all(imagePromises);
  }, [imagesToLoad]);

  useEffect(() => {
    if (autoTriggerPrint && imagesLoaded) {
      const timer = setTimeout(() => {
        window.print();
        if (onPrint) {
          onPrint();
        }
      }, 500);

      return () => clearTimeout(timer);
    }

    if (autoTriggerPrint && !imagesLoaded) {
      const handleAfterPrint = () => {
        if (onPrint) {
          onPrint();
        }
      };

      window.addEventListener("afterprint", handleAfterPrint);

      return () => {
        window.removeEventListener("afterprint", handleAfterPrint);
      };
    }
  }, [autoTriggerPrint, imagesLoaded, onPrint]);

  const handlePrint = async () => {
    if (!imagesLoaded && imagesToLoad.length > 0) {
      const maxWaitTime = 3000;
      const startTime = Date.now();

      while (!imagesLoaded && Date.now() - startTime < maxWaitTime) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <>
      <GlobalStyles styles={giftInvoicePrintStyles} />

      {!autoTriggerPrint && (
        <Box className="no-print-gift" sx={{ textAlign: "center", p: 2 }}>
          <Typography variant="h5" gutterBottom>
            Gift Invoice Print Preview
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This is how your gift invoice will look when printed
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
                !imagesLoaded && imagesToLoad.length > 0 ? "#ccc" : "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor:
                !imagesLoaded && imagesToLoad.length > 0
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            Print Gift Invoice
          </button>
        </Box>
      )}

      <Box
        className="print-gift-invoice-only"
        sx={{
          maxWidth: "210mm",
          margin: "0 auto",
          backgroundColor: "white",
          padding: "20mm",
          display: "none", // Hidden in screen view, only visible during print
          "@media screen": {
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginTop: "20px",
            marginBottom: "20px",
          },
        }}
      >
        {/* Header */}
        <Box className="print-gift-header">
          <Box className="print-gift-company-section">
            <Box className="print-gift-logo-section">
              <Box className="print-gift-company-logo">
                {companyLogo ? (
                  <img
                    src={companyLogo}
                    alt="Company Logo"
                    loading="eager"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                    onLoad={(e) => {
                      e.target.style.opacity = "1";
                    }}
                    style={{ 
                      opacity: 0, 
                      transition: "opacity 0.3s",
                      display: "block"
                    }}
                  />
                ) : null}
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
                Phone: {companyDetails.phone}
              </Typography>
              <Typography variant="body2">GST: {companyDetails.gstNumber}</Typography>
            </Box>
          </Box>

          <Box className="print-gift-details-section">
            <Typography
              variant="h3"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: "10px",
                marginBottom: "15px",
              }}
            >
              <GiftIcon style={{ fontSize: "28px" }} />
              GIFT INVOICE
            </Typography>

            <Box
              style={{
                border: "1px solid #000",
                padding: "15px",
                backgroundColor: "#f0f8ff",
                borderRadius: "8px",
                textAlign: "right",
              }}
            >
              <Typography variant="body1" style={{ marginBottom: "5px" }}>
                <strong>Invoice #:</strong> {giftInvoice.giftInvoiceNumber}
              </Typography>
              <Typography variant="body1" style={{ marginBottom: "5px" }}>
                <strong>Date:</strong> {formatDate(giftInvoice.createdAt)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Customer Section */}
        <Box className="print-gift-customer-section">
          <Box className="print-gift-customer-info">
            <Typography
              variant="h5"
              style={{ fontWeight: "bold", marginBottom: "10px" }}
            >
              GIFT RECIPIENT
            </Typography>
            <Typography variant="body2" style={{ marginBottom: "3px" }}>
              <strong>Name:</strong> {giftInvoice.customerName}
            </Typography>
            <Typography variant="body2" style={{ marginBottom: "3px" }}>
              <strong>Phone:</strong> {giftInvoice.customerPhone}
            </Typography>
            {giftInvoice.customerAddress && (
              <Typography variant="body2">
                <strong>Address:</strong> {giftInvoice.customerAddress}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Gift Items Table */}
        <Box className="print-gift-items-section">
          <Typography
            variant="h5"
            style={{ fontWeight: "bold", marginBottom: "10px" }}
          >
            GIFT ITEMS - {giftInvoice.giftSetTitle}
          </Typography>

          <table className="print-gift-items-table">
            <thead>
              <tr>
                <th style={{ width: "60px" }}>#</th>
                <th style={{ textAlign: "left" }}>Item Name</th>
                <th style={{ width: "120px" }}>Delivery Status</th>
              </tr>
            </thead>
            <tbody>
              {giftInvoice.items?.map((item, index) => {
                const itemName = typeof item === "string" ? item : item.name;
                const itemStatus =
                  typeof item === "object" && item.deliveryStatus
                    ? item.deliveryStatus
                    : ITEM_DELIVERY_STATUS.PENDING;

                return (
                  <tr key={index}>
                    <td style={{ textAlign: "center" }}>{index + 1}</td>
                    <td>{itemName}</td>
                    <td style={{ textAlign: "center" }}>
                      {ITEM_DELIVERY_STATUS_DISPLAY[itemStatus] || "Pending"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>

        {/* Remarks */}
        {giftInvoice.remarks && (
          <Box style={{ marginBottom: "25px" }}>
            <Typography
              variant="h6"
              style={{ fontWeight: "bold", marginBottom: "8px" }}
            >
              Remarks:
            </Typography>
            <Typography variant="body2">{giftInvoice.remarks}</Typography>
          </Box>
        )}

        {/* Footer */}
        <Box className="print-gift-footer-section">
          <Box className="print-gift-thank-you-section">
            <Typography
              variant="h4"
              style={{ fontWeight: "bold", marginBottom: "10px" }}
            >
              Thank You!
            </Typography>
            <Typography variant="body2" style={{ lineHeight: "1.6" }}>
              We appreciate your business and hope you enjoy these complimentary
              gifts. For any queries regarding delivery or items, please contact
              us.
            </Typography>
          </Box>

          <Box className="print-gift-signature-section">
            <Box
              style={{
                borderTop: "1px solid #000",
                paddingTop: "10px",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Box className="print-gift-signature">
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
                    style={{ 
                      opacity: 0, 
                      transition: "opacity 0.3s",
                      display: "block",
                      width: "100%",
                      height: "100%",
                      objectFit: "contain"
                    }}
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
                  fontWeight: "bold",
                  fontSize: "11px",
                  textAlign: "center",
                  paddingTop: "10px",
                }}
              >
                Authorized Signatory
              </Typography>
              <Typography 
                variant="body2" 
                style={{ 
                  fontSize: "10px",
                  textAlign: "center",
                }}
              >
                {companyDetails.name}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default PrintableGiftInvoice;
import React, { useRef } from 'react';
import { 
  Box, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';

import InvoicePreview from './InvoicePreview';
import { formatDate } from '../../../utils/helpers/formatHelpers';

/**
 * Invoice PDF component with print and download functionality
 * @param {Object} props
 * @param {Object} props.invoice - Invoice data
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onEmail - Email callback
 * @param {function} props.onShare - Share callback  
 * @param {string} props.variant - Display variant (button, icon, menu)
 * @param {string} props.size - Button size
 */
const InvoicePDF = ({ 
  invoice = {}, 
  loading = false,
  onEmail,
  onShare,
  variant = 'button',
  size = 'medium'
}) => {
  const printRef = useRef();
  const [menuAnchor, setMenuAnchor] = React.useState(null);
  const [generating, setGenerating] = React.useState(false);

  // Handle menu
  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  // Generate PDF using browser's print functionality
  const generatePDF = async () => {
    try {
      setGenerating(true);
      
      // Create a new window with the invoice content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Get the invoice HTML
      const invoiceElement = printRef.current;
      const invoiceHTML = invoiceElement.innerHTML;

      // Write the HTML to the new window
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${invoice.invoiceNumber}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: 'Arial', sans-serif;
                line-height: 1.4;
                color: #333;
                background: white;
              }
              .MuiCard-root {
                box-shadow: none !important;
                border: none !important;
              }
              .MuiCardContent-root {
                padding: 20px !important;
              }
              @media print {
                body { 
                  font-size: 12px; 
                }
                .no-print { 
                  display: none !important; 
                }
                @page { 
                  margin: 0.5in; 
                }
              }
            </style>
          </head>
          <body>
            ${invoiceHTML}
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load then trigger print dialog
      setTimeout(() => {
        printWindow.print();
      }, 500);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  // Handle direct print
  const handlePrint = () => {
    try {
      window.print();
    } catch (error) {
      console.error('Error printing:', error);
    }
    handleMenuClose();
  };

  // Handle download
  const handleDownload = async () => {
    await generatePDF();
    handleMenuClose();
  };

  // Handle email
  const handleEmail = () => {
    if (onEmail) {
      onEmail(invoice);
    }
    handleMenuClose();
  };

  // Handle share
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Invoice ${invoice.invoiceNumber}`,
          text: `Invoice ${invoice.invoiceNumber} for ${invoice.customer?.name}`,
          url: window.location.href
        });
      } else if (onShare) {
        onShare(invoice);
      } else {
        // Fallback: copy URL to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert('Invoice URL copied to clipboard');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
    handleMenuClose();
  };

  // Render based on variant
  if (variant === 'icon') {
    return (
      <Box>
        <Tooltip title="PDF Actions">
          <IconButton 
            onClick={handleMenuOpen}
            disabled={loading || generating}
            size={size}
          >
            {generating ? <CircularProgress size={20} /> : <PdfIcon />}
          </IconButton>
        </Tooltip>
        
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleDownload}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download PDF</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handlePrint}>
            <ListItemIcon>
              <PrintIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Print</ListItemText>
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleEmail}>
            <ListItemIcon>
              <EmailIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Email Invoice</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleShare}>
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  if (variant === 'menu') {
    return (
      <Box>
        <IconButton 
          onClick={handleMenuOpen}
          disabled={loading || generating}
          size="small"
        >
          <MoreVertIcon />
        </IconButton>
        
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleDownload}>
            <ListItemIcon>
              <PdfIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download PDF</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handlePrint}>
            <ListItemIcon>
              <PrintIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Print Invoice</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleEmail}>
            <ListItemIcon>
              <EmailIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Email Invoice</ListItemText>
          </MenuItem>
          
          <MenuItem onClick={handleShare}>
            <ListItemIcon>
              <ShareIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Share Invoice</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    );
  }

  // Default button variant
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      <Button
        variant="contained"
        startIcon={generating ? <CircularProgress size={16} /> : <PdfIcon />}
        onClick={handleDownload}
        disabled={loading || generating}
        size={size}
      >
        {generating ? 'Generating...' : 'Download PDF'}
      </Button>
      
      <Button
        variant="outlined"
        startIcon={<PrintIcon />}
        onClick={handlePrint}
        disabled={loading || generating}
        size={size}
      >
        Print
      </Button>
      
      <Button
        variant="outlined"
        startIcon={<EmailIcon />}
        onClick={handleEmail}
        disabled={loading || generating}
        size={size}
      >
        Email
      </Button>

      {/* Hidden invoice preview for printing */}
      <Box sx={{ display: 'none' }}>
        <InvoicePreview 
          ref={printRef}
          invoice={invoice}
          variant="print"
        />
      </Box>
    </Box>
  );
};

// PDF utility functions
export const downloadInvoicePDF = async (invoice) => {
  try {
    // This would integrate with a PDF library like jsPDF or PDFKit
    // For now, we'll use the browser's print to PDF functionality
    
    const filename = `invoice-${invoice.invoiceNumber}-${formatDate(invoice.date)}.pdf`;
    
    // Create a temporary element with invoice content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1>Invoice ${invoice.invoiceNumber}</h1>
        <p>Date: ${formatDate(invoice.date)}</p>
        <p>Customer: ${invoice.customer?.name}</p>
        <p>Total: ${invoice.totalAmount}</p>
      </div>
    `;
    
    // Create blob and download
    const content = tempDiv.innerHTML;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
};

export const emailInvoicePDF = async (invoice, emailData) => {
  try {
    // This would integrate with an email service
    // For now, we'll create a mailto link
    
    const subject = `Invoice ${invoice.invoiceNumber} - ${invoice.customer?.name}`;
    const body = `Dear ${invoice.customer?.name},\n\nPlease find attached your invoice ${invoice.invoiceNumber}.\n\nBest regards,\nPatel Enterprise Pvt Ltd`;
    
    const mailtoLink = `mailto:${invoice.customer?.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoLink);
    
    return true;
  } catch (error) {
    console.error('Error emailing PDF:', error);
    throw error;
  }
};

export const printInvoice = (invoice) => {
  try {
    window.print();
    return true;
  } catch (error) {
    console.error('Error printing invoice:', error);
    throw error;
  }
};

export default InvoicePDF;
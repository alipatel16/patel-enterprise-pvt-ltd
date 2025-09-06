import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';

/**
 * Reusable confirmation dialog component
 * @param {Object} props
 * @param {boolean} props.open - Whether dialog is open
 * @param {function} props.onClose - Close handler
 * @param {function} props.onConfirm - Confirm handler
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Dialog message
 * @param {string} props.type - Dialog type (warning, error, info, success, delete)
 * @param {string} props.confirmText - Confirm button text
 * @param {string} props.cancelText - Cancel button text
 * @param {boolean} props.loading - Show loading state
 * @param {boolean} props.destructive - Whether action is destructive
 * @param {React.ReactNode} props.children - Custom content
 */
const ConfirmDialog = ({
  open = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  destructive = false,
  children,
  ...props
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Handle confirm action
  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  // Handle cancel/close
  const handleCancel = () => {
    if (onClose) {
      onClose();
    }
  };

  // Get icon and colors based on type
  const getTypeConfig = () => {
    const configs = {
      warning: {
        icon: WarningIcon,
        color: theme.palette.warning.main,
        bgColor: theme.palette.warning.light + '20'
      },
      error: {
        icon: ErrorIcon,
        color: theme.palette.error.main,
        bgColor: theme.palette.error.light + '20'
      },
      info: {
        icon: InfoIcon,
        color: theme.palette.info.main,
        bgColor: theme.palette.info.light + '20'
      },
      success: {
        icon: SuccessIcon,
        color: theme.palette.success.main,
        bgColor: theme.palette.success.light + '20'
      },
      delete: {
        icon: DeleteIcon,
        color: theme.palette.error.main,
        bgColor: theme.palette.error.light + '20'
      }
    };

    return configs[type] || configs.warning;
  };

  const typeConfig = getTypeConfig();
  const Icon = typeConfig.icon;

  // Determine button color based on type or destructive flag
  const getButtonColor = () => {
    if (destructive || type === 'error' || type === 'delete') {
      return 'error';
    }
    if (type === 'success') {
      return 'success';
    }
    if (type === 'info') {
      return 'info';
    }
    return 'primary';
  };

  const buttonColor = getButtonColor();

  return (
    <Dialog
      open={open}
      onClose={!loading ? handleCancel : undefined}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile && type === 'delete'} // Full screen for delete on mobile
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          m: isMobile ? 0 : 2
        }
      }}
      {...props}
    >
      {/* Title */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          pb: 1,
          backgroundColor: typeConfig.bgColor
        }}
      >
        <Icon
          sx={{
            color: typeConfig.color,
            fontSize: 28
          }}
        />
        <Typography
          variant="h6"
          fontWeight={600}
          sx={{
            color: theme.palette.text.primary,
            flex: 1
          }}
        >
          {title}
        </Typography>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {children ? (
          children
        ) : (
          <DialogContentText
            sx={{
              color: theme.palette.text.primary,
              fontSize: '1rem',
              lineHeight: 1.6
            }}
          >
            {message}
          </DialogContentText>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          p: 3,
          pt: 1,
          gap: 1,
          justifyContent: 'flex-end',
          flexDirection: { xs: 'column-reverse', sm: 'row' }
        }}
      >
        {/* Cancel Button */}
        <Button
          onClick={handleCancel}
          disabled={loading}
          variant="outlined"
          size="large"
          startIcon={<CancelIcon />}
          sx={{
            minWidth: { xs: '100%', sm: 120 },
            order: { xs: 2, sm: 1 }
          }}
        >
          {cancelText}
        </Button>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          color={buttonColor}
          size="large"
          startIcon={
            loading ? null : (
              type === 'delete' ? <DeleteIcon /> : <SaveIcon />
            )
          }
          sx={{
            minWidth: { xs: '100%', sm: 120 },
            order: { xs: 1, sm: 2 }
          }}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Predefined dialog variants for common use cases
export const DeleteConfirmDialog = (props) => (
  <ConfirmDialog
    type="delete"
    title="Delete Item"
    message="This action cannot be undone. Are you sure you want to delete this item?"
    confirmText="Delete"
    destructive
    {...props}
  />
);

export const SaveConfirmDialog = (props) => (
  <ConfirmDialog
    type="info"
    title="Save Changes"
    message="Do you want to save your changes?"
    confirmText="Save"
    {...props}
  />
);

export const DiscardChangesDialog = (props) => (
  <ConfirmDialog
    type="warning"
    title="Discard Changes"
    message="You have unsaved changes. Are you sure you want to discard them?"
    confirmText="Discard"
    destructive
    {...props}
  />
);

export const LogoutConfirmDialog = (props) => (
  <ConfirmDialog
    type="warning"
    title="Sign Out"
    message="Are you sure you want to sign out?"
    confirmText="Sign Out"
    {...props}
  />
);

export default ConfirmDialog;
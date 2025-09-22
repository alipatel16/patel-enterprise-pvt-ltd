import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  CircularProgress,
  Tooltip,
  Stack,
  useTheme,
  alpha,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Assignment as ComplaintIcon,
  Warning as OverdueIcon,
} from "@mui/icons-material";

import Layout from "../../components/common/Layout/Layout";
import RecordComplaintDialog from "../../components/complaints/RecordComplaintDialog";
import EditComplaintDialog from "../../components/complaints/EditComplaintDialog";
import {
  COMPLAINT_STATUS_DISPLAY,
  COMPLAINT_SEVERITY_DISPLAY,
  getComplaintSeverityColor,
  getComplaintStatusColor,
  PAGINATION,
} from "../../utils/constants/appConstants";
import { useUserType } from "../../contexts/UserTypeContext";
import { formatDate } from "../../utils/helpers/formatHelpers";
import complaintService from "../../services/api/complaintService";

import ComplaintsNotificationPanel from "../../components/complaints/ComplaintsNotificationPanel";

const ComplaintsPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { userType } = useUserType();

  // Data state
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    overdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(PAGINATION.DEFAULT_PAGE_SIZE);
  const [totalComplaints, setTotalComplaints] = useState(0);

  // Filter state
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    severity: "",
    assignedTo: "",
  });

  // Dialog state
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Load data on component mount and when filters change
  useEffect(() => {
    loadComplaints();
    loadStats();
  }, [userType, page, rowsPerPage, filters]);

  // Load complaints
  const loadComplaints = async () => {
    try {
      setLoading(true);
      setError("");

      const options = {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        search: filters.search,
        status: filters.status,
        severity: filters.severity,
        assignedTo: filters.assignedTo,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      const response = await complaintService.getComplaints(userType, options);
      setComplaints(response.complaints);
      setTotalComplaints(response.total);
    } catch (error) {
      console.error("Error loading complaints:", error);
      setError("Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = async () => {
    try {
      const statsData = await complaintService.getComplaintStats(userType);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  // Handle filter changes
  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPage(0); // Reset to first page when filtering
  };

  // Handle search
  const handleSearch = (event) => {
    if (event.key === "Enter") {
      loadComplaints();
    }
  };

  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle complaint creation
  const handleComplaintCreated = (newComplaint) => {
    loadComplaints();
    loadStats();
  };

  // Handle complaint edit
  const handleEditComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setEditDialogOpen(true);
  };

  // Handle complaint update
  const handleComplaintUpdated = () => {
    setEditDialogOpen(false);
    setSelectedComplaint(null);
    loadComplaints();
    loadStats();
  };

  // Handle view complaint
  const handleViewComplaint = (complaint) => {
    navigate(`/complaints/view/${complaint.id}`);
  };

  // Get status chip
  const getStatusChip = (status) => {
    const color = getComplaintStatusColor(status);
    return (
      <Chip
        label={COMPLAINT_STATUS_DISPLAY[status]}
        size="small"
        sx={{
          backgroundColor: alpha(color, 0.1),
          color: color,
          fontWeight: 500,
          border: `1px solid ${alpha(color, 0.3)}`,
        }}
      />
    );
  };

  // Get severity chip
  const getSeverityChip = (severity) => {
    const color = getComplaintSeverityColor(severity);
    return (
      <Chip
        label={COMPLAINT_SEVERITY_DISPLAY[severity]}
        size="small"
        sx={{
          backgroundColor: alpha(color, 0.1),
          color: color,
          fontWeight: 500,
          border: `1px solid ${alpha(color, 0.3)}`,
        }}
      />
    );
  };

  const breadcrumbs = [
    {
      label: "Complaint Management",
      path: "/complaint",
    },
  ];

  return (
    <Layout title="Complaint Management" breadcrumbs={breadcrumbs}>
      <Box sx={{ p: 3 }}>
        {/* Page Header */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h5" fontWeight={600}></Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                startIcon={<RefreshIcon />}
                onClick={loadComplaints}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setRecordDialogOpen(true)}
              >
                Record Complaint
              </Button>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <ComplaintsNotificationPanel compact />
          </Box>

          {/* Statistics Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ textAlign: "center", p: 1 }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="h4" color="primary" fontWeight={600}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Complaints
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ textAlign: "center", p: 1 }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="h4" color="error.main" fontWeight={600}>
                    {stats.open}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Open
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ textAlign: "center", p: 1 }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography
                    variant="h4"
                    color="warning.main"
                    fontWeight={600}
                  >
                    {stats.inProgress}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ textAlign: "center", p: 1 }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography
                    variant="h4"
                    color="success.main"
                    fontWeight={600}
                  >
                    {stats.resolved}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Resolved
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Card sx={{ textAlign: "center", p: 1 }}>
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography
                    variant="h4"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    {stats.closed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Closed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Card
                sx={{
                  textAlign: "center",
                  p: 1,
                  border: "1px solid",
                  borderColor: "error.main",
                }}
              >
                <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                  <Typography variant="h4" color="error.main" fontWeight={600}>
                    {stats.overdue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overdue
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Search"
                  placeholder="Search by complaint number, title, or customer"
                  value={filters.search}
                  onChange={handleFilterChange("search")}
                  onKeyPress={handleSearch}
                  InputProps={{
                    startAdornment: (
                      <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={handleFilterChange("status")}
                    label="Status"
                  >
                    <MenuItem value="">All Status</MenuItem>
                    {Object.entries(COMPLAINT_STATUS_DISPLAY).map(
                      ([key, label]) => (
                        <MenuItem key={key} value={key}>
                          {label}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={filters.severity}
                    onChange={handleFilterChange("severity")}
                    label="Severity"
                  >
                    <MenuItem value="">All Severity</MenuItem>
                    {Object.entries(COMPLAINT_SEVERITY_DISPLAY).map(
                      ([key, label]) => (
                        <MenuItem key={key} value={key}>
                          {label}
                        </MenuItem>
                      )
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={loadComplaints}
                    disabled={loading}
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => {
                      setFilters({
                        search: "",
                        status: "",
                        severity: "",
                        assignedTo: "",
                      });
                      setPage(0);
                    }}
                  >
                    Clear
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Complaints Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Complaint #</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Expected Resolution</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Loading complaints...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : complaints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <ComplaintIcon
                        sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                      />
                      <Typography variant="h6" color="text.secondary">
                        No complaints found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {filters.search || filters.status || filters.severity
                          ? "Try adjusting your filters"
                          : "Record your first complaint to get started"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  complaints.map((complaint) => (
                    <TableRow
                      key={complaint.id}
                      sx={{
                        "&:hover": { backgroundColor: "action.hover" },
                        ...(complaint.isOverdue && {
                          backgroundColor: alpha(
                            theme.palette.error.main,
                            0.04
                          ),
                        }),
                      }}
                    >
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body2" fontWeight={500}>
                            {complaint.complaintNumber}
                          </Typography>
                          {complaint.isOverdue && (
                            <Tooltip title="Overdue">
                              <OverdueIcon color="error" fontSize="small" />
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {complaint.customerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {complaint.customerPhone}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={complaint.title}
                        >
                          {complaint.title}
                        </Typography>
                      </TableCell>

                      <TableCell>{getStatusChip(complaint.status)}</TableCell>

                      <TableCell>
                        {getSeverityChip(complaint.severity)}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {complaint.assigneeType === "employee"
                            ? complaint.assignedEmployeeName || "Unassigned"
                            : complaint.servicePersonName || "Unassigned"}
                        </Typography>
                        {complaint.assigneeType === "service_person" && (
                          <Typography variant="caption" color="text.secondary">
                            External Service
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(complaint.expectedResolutionDate)}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            justifyContent: "center",
                          }}
                        >
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewComplaint(complaint)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Complaint">
                            <IconButton
                              size="small"
                              onClick={() => handleEditComplaint(complaint)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {!loading && complaints.length > 0 && (
            <TablePagination
              component="div"
              count={totalComplaints}
              page={page}
              onPageChange={handlePageChange}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleRowsPerPageChange}
              rowsPerPageOptions={PAGINATION.PAGE_SIZE_OPTIONS}
            />
          )}
        </Card>

        {/* Dialogs */}
        <RecordComplaintDialog
          open={recordDialogOpen}
          onClose={() => setRecordDialogOpen(false)}
          onComplaintCreated={handleComplaintCreated}
        />

        {selectedComplaint && (
          <EditComplaintDialog
            open={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            complaint={selectedComplaint}
            onComplaintUpdated={handleComplaintUpdated}
          />
        )}
      </Box>
    </Layout>
  );
};

export default ComplaintsPage;

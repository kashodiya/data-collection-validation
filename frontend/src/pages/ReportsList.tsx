

























import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import { getReports, validateReport } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Report {
  id: number;
  series_id: string;
  institution_id: string;
  reporting_period: string;
  submission_date: string;
  status: string;
  validation_results?: {
    passed: boolean;
    errors: string[];
  };
}

const ReportsList: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [validating, setValidating] = useState<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getReports();
      setReports(data);
      setError('');
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value);
    setPage(0);
  };

  const handleViewReport = (reportId: number) => {
    navigate(`/reports/${reportId}`);
  };

  const handleValidateReport = async (reportId: number) => {
    try {
      setValidating(reportId);
      const result = await validateReport(reportId);
      
      // Update the report in the list with validation results
      setReports(reports.map(report => 
        report.id === reportId 
          ? { ...report, status: result.passed ? 'validated' : 'failed', validation_results: result }
          : report
      ));
      
      setError('');
    } catch (err) {
      console.error('Error validating report:', err);
      setError('Failed to validate report. Please try again.');
    } finally {
      setValidating(null);
    }
  };

  // Filter reports based on search term and status filter
  const filteredReports = reports.filter(
    (report) => {
      const matchesSearch = 
        report.series_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.institution_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.reporting_period.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }
  );

  // Paginate the filtered reports
  const paginatedReports = filteredReports.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Chip icon={<PendingIcon />} label="Submitted" color="primary" variant="outlined" />;
      case 'validated':
        return <Chip icon={<CheckCircleIcon />} label="Validated" color="success" />;
      case 'failed':
        return <Chip icon={<ErrorIcon />} label="Failed" color="error" />;
      default:
        return <Chip label={status} />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Reports</Typography>
        {user?.role === 'external' && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/submit-report')}
          >
            Submit New Report
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Search Reports"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={statusFilter}
            label="Status"
            onChange={handleStatusFilterChange}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="validated">Validated</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Report ID</TableCell>
                  <TableCell>Series</TableCell>
                  <TableCell>Institution</TableCell>
                  <TableCell>Reporting Period</TableCell>
                  <TableCell>Submission Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedReports.length > 0 ? (
                  paginatedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.id}</TableCell>
                      <TableCell>{report.series_id}</TableCell>
                      <TableCell>{report.institution_id}</TableCell>
                      <TableCell>{report.reporting_period}</TableCell>
                      <TableCell>{new Date(report.submission_date).toLocaleDateString()}</TableCell>
                      <TableCell>{getStatusChip(report.status)}</TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleViewReport(report.id)}
                          size="small"
                          title="View Report"
                        >
                          <VisibilityIcon />
                        </IconButton>
                        {(user?.role === 'analyst' || user?.role === 'admin') && report.status === 'submitted' && (
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleValidateReport(report.id)}
                            disabled={validating === report.id}
                            sx={{ ml: 1 }}
                          >
                            {validating === report.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              'Validate'
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No reports found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredReports.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </Box>
  );
};

export default ReportsList;


























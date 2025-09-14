




























import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import { getReport, validateReport } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ReportData {
  id: number;
  series_id: string;
  series_name?: string;
  institution_id: string;
  institution_name?: string;
  reporting_period: string;
  submission_date: string;
  status: string;
  data: Record<string, any>;
  validation_results?: {
    passed: boolean;
    errors: Array<{
      mdrm_id: string;
      rule_id: string;
      message: string;
    }>;
  };
}

const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchReport(parseInt(id));
    }
  }, [id]);

  const fetchReport = async (reportId: number) => {
    try {
      setLoading(true);
      const data = await getReport(reportId);
      setReport(data);
      setError('');
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!id) return;
    
    try {
      setValidating(true);
      const result = await validateReport(parseInt(id));
      
      // Update the report with validation results
      setReport(prev => prev ? {
        ...prev,
        status: result.passed ? 'validated' : 'failed',
        validation_results: result
      } : null);
      
      setError('');
    } catch (err) {
      console.error('Error validating report:', err);
      setError('Failed to validate report. Please try again.');
    } finally {
      setValidating(false);
    }
  };

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!report) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Report not found.
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Report Details</Typography>
        {(user?.role === 'analyst' || user?.role === 'admin') && report.status === 'submitted' && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleValidate}
            disabled={validating}
          >
            {validating ? <CircularProgress size={24} /> : 'Validate Report'}
          </Button>
        )}
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Report ID</Typography>
            <Typography variant="body1">{report.id}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Box>{getStatusChip(report.status)}</Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Series</Typography>
            <Typography variant="body1">{report.series_name || report.series_id}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Institution</Typography>
            <Typography variant="body1">{report.institution_name || report.institution_id}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Reporting Period</Typography>
            <Typography variant="body1">{report.reporting_period}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Submission Date</Typography>
            <Typography variant="body1">{new Date(report.submission_date).toLocaleString()}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Validation Results */}
      {report.validation_results && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Validation Results
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Chip
              icon={report.validation_results.passed ? <CheckCircleIcon /> : <ErrorIcon />}
              label={report.validation_results.passed ? 'Passed' : 'Failed'}
              color={report.validation_results.passed ? 'success' : 'error'}
            />
          </Box>
          
          {report.validation_results.errors && report.validation_results.errors.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Validation Errors
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>MDRM ID</TableCell>
                      <TableCell>Rule ID</TableCell>
                      <TableCell>Message</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.validation_results.errors.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell>{error.mdrm_id}</TableCell>
                        <TableCell>{error.rule_id}</TableCell>
                        <TableCell>{error.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Paper>
      )}

      {/* Report Data */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Report Data
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {Object.keys(report.data).length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>MDRM ID</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(report.data).map(([mdrmId, value]) => (
                  <TableRow key={mdrmId}>
                    <TableCell>{mdrmId}</TableCell>
                    <TableCell>{String(value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No data available for this report.
          </Typography>
        )}
      </Paper>

      {/* Historical Comparison (if available) */}
      {report.series_id && (
        <Accordion sx={{ mt: 3 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>Historical Comparison</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">
              Historical comparison data is not available for this report.
            </Typography>
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};

export default ReportDetail;





























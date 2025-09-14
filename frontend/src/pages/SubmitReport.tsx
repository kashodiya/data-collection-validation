































import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Divider,
  FormHelperText,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { getSeries, getSeriesById, getInstitutions, submitReportData, uploadCsvData } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Series {
  id: string;
  name: string;
  description: string;
  frequency: string;
  mdrm_elements: string[];
}

interface Institution {
  id: string;
  name: string;
  identifier: string;
}

interface MDRMField {
  mdrm_id: string;
  name: string;
  description: string;
  data_type: string;
  value: string;
  error: string;
}

const SubmitReport: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [series, setSeries] = useState<Series[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedSeries, setSelectedSeries] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('');
  const [reportingPeriod, setReportingPeriod] = useState('');
  const [mdrmFields, setMdrmFields] = useState<MDRMField[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'form' | 'csv'>('form');
  const [loading, setLoading] = useState(false);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSeries();
    fetchInstitutions();
  }, []);

  const fetchSeries = async () => {
    try {
      const data = await getSeries();
      setSeries(data);
    } catch (err) {
      console.error('Error fetching series:', err);
      setError('Failed to load series. Please try again later.');
    }
  };

  const fetchInstitutions = async () => {
    try {
      const data = await getInstitutions();
      setInstitutions(data);
      
      // If user is external and has an institution, pre-select it
      if (user?.role === 'external' && user?.institution_id) {
        setSelectedInstitution(user.institution_id);
      }
    } catch (err) {
      console.error('Error fetching institutions:', err);
      setError('Failed to load institutions. Please try again later.');
    }
  };

  const handleSeriesChange = async (event: React.ChangeEvent<{ value: unknown }>) => {
    const seriesId = event.target.value as string;
    setSelectedSeries(seriesId);
    setMdrmFields([]);
    
    if (seriesId) {
      try {
        setSeriesLoading(true);
        const seriesData = await getSeriesById(seriesId);
        
        // Create form fields for each MDRM element
        const fields = seriesData.mdrm_elements.map((mdrm: any) => ({
          mdrm_id: mdrm.mdrm_id || mdrm,
          name: mdrm.name || mdrm,
          description: mdrm.description || '',
          data_type: mdrm.data_type || 'string',
          value: '',
          error: '',
        }));
        
        setMdrmFields(fields);
      } catch (err) {
        console.error('Error fetching series details:', err);
        setError('Failed to load series details. Please try again.');
      } finally {
        setSeriesLoading(false);
      }
    }
  };

  const handleMdrmValueChange = (index: number, value: string) => {
    const updatedFields = [...mdrmFields];
    updatedFields[index].value = value;
    
    // Clear error when user types
    if (updatedFields[index].error) {
      updatedFields[index].error = '';
    }
    
    setMdrmFields(updatedFields);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const validateStep1 = () => {
    if (!selectedSeries) {
      setError('Please select a series.');
      return false;
    }
    
    if (!selectedInstitution) {
      setError('Please select an institution.');
      return false;
    }
    
    if (!reportingPeriod) {
      setError('Please enter a reporting period.');
      return false;
    }
    
    setError('');
    return true;
  };

  const validateStep2 = () => {
    if (uploadMethod === 'form') {
      // Validate all MDRM fields
      let isValid = true;
      const updatedFields = [...mdrmFields];
      
      updatedFields.forEach((field, index) => {
        if (!field.value.trim()) {
          updatedFields[index].error = 'This field is required';
          isValid = false;
        } else if (field.data_type === 'number' && isNaN(Number(field.value))) {
          updatedFields[index].error = 'Must be a number';
          isValid = false;
        }
      });
      
      setMdrmFields(updatedFields);
      return isValid;
    } else {
      // Validate file upload
      if (!file) {
        setError('Please select a CSV file to upload.');
        return false;
      }
      return true;
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (validateStep1()) {
        setActiveStep(1);
        setError('');
      }
    } else if (activeStep === 1) {
      if (validateStep2()) {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      if (uploadMethod === 'form') {
        // Submit form data
        const reportData = {
          series_id: selectedSeries,
          institution_id: selectedInstitution,
          reporting_period: reportingPeriod,
          data: Object.fromEntries(mdrmFields.map(field => [field.mdrm_id, field.value])),
        };
        
        const response = await submitReportData(0, reportData); // 0 is a placeholder, the backend will create a new report
        setSuccess(`Report submitted successfully with ID: ${response.id}`);
        
        // Navigate to the report detail page after a delay
        setTimeout(() => {
          navigate(`/reports/${response.id}`);
        }, 2000);
      } else {
        // Submit CSV file
        if (file) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('series_id', selectedSeries);
          formData.append('institution_id', selectedInstitution);
          formData.append('reporting_period', reportingPeriod);
          
          const response = await uploadCsvData(0, file); // 0 is a placeholder, the backend will create a new report
          setSuccess(`Report submitted successfully with ID: ${response.id}`);
          
          // Navigate to the report detail page after a delay
          setTimeout(() => {
            navigate(`/reports/${response.id}`);
          }, 2000);
        }
      }
    } catch (err: any) {
      console.error('Error submitting report:', err);
      setError(err.response?.data?.detail || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Report Information', 'Data Entry', 'Review & Submit'];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Submit Report
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="series-select-label">Series</InputLabel>
                <Select
                  labelId="series-select-label"
                  id="series-select"
                  value={selectedSeries}
                  label="Series"
                  onChange={handleSeriesChange as any}
                >
                  {series.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select the report series you want to submit</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="institution-select-label">Institution</InputLabel>
                <Select
                  labelId="institution-select-label"
                  id="institution-select"
                  value={selectedInstitution}
                  label="Institution"
                  onChange={(e) => setSelectedInstitution(e.target.value as string)}
                  disabled={user?.role === 'external' && user?.institution_id}
                >
                  {institutions.map((inst) => (
                    <MenuItem key={inst.id} value={inst.id}>
                      {inst.name} ({inst.identifier})
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select the institution for this report</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="reporting-period"
                label="Reporting Period"
                value={reportingPeriod}
                onChange={(e) => setReportingPeriod(e.target.value)}
                helperText="Enter the reporting period (e.g., Q1 2023, March 2023)"
              />
            </Grid>
          </Grid>
        )}

        {activeStep === 1 && (
          <>
            <Box sx={{ mb: 3 }}>
              <FormControl component="fieldset">
                <Typography variant="subtitle1" gutterBottom>
                  Upload Method
                </Typography>
                <Grid container spacing={2}>
                  <Grid item>
                    <Button
                      variant={uploadMethod === 'form' ? 'contained' : 'outlined'}
                      onClick={() => setUploadMethod('form')}
                    >
                      Form Entry
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button
                      variant={uploadMethod === 'csv' ? 'contained' : 'outlined'}
                      onClick={() => setUploadMethod('csv')}
                    >
                      CSV Upload
                    </Button>
                  </Grid>
                </Grid>
              </FormControl>
            </Box>

            <Divider sx={{ my: 3 }} />

            {uploadMethod === 'form' ? (
              seriesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : mdrmFields.length > 0 ? (
                <Grid container spacing={3}>
                  {mdrmFields.map((field, index) => (
                    <Grid item xs={12} md={6} key={field.mdrm_id}>
                      <TextField
                        fullWidth
                        id={`mdrm-${field.mdrm_id}`}
                        label={`${field.name} (${field.mdrm_id})`}
                        value={field.value}
                        onChange={(e) => handleMdrmValueChange(index, e.target.value)}
                        error={!!field.error}
                        helperText={field.error || field.description}
                        type={field.data_type === 'number' ? 'number' : 'text'}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  Please select a series first to load the data fields.
                </Typography>
              )
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <input
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <Button
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ mb: 2 }}
                >
                  Select CSV File
                </Button>
                <Typography variant="body2" color="text.secondary">
                  {file ? `Selected file: ${file.name}` : 'No file selected'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  The CSV file should have MDRM IDs as column headers and values in a single row.
                </Typography>
              </Box>
            )}
          </>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : activeStep === steps.length - 1 ? (
              'Submit'
            ) : (
              'Next'
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SubmitReport;
































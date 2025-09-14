





















import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getSeries, getSeriesById, createSeries, updateSeries, deleteSeries } from '../services/api';

interface Series {
  id: string;
  name: string;
  description: string;
  frequency: string;
  mdrm_elements: string[];
}

const SeriesList: React.FC = () => {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSeries, setCurrentSeries] = useState<Series | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: '',
    mdrm_elements: '',
  });

  useEffect(() => {
    fetchSeries();
  }, []);

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const data = await getSeries();
      setSeriesList(data);
      setError('');
    } catch (err) {
      console.error('Error fetching series:', err);
      setError('Failed to load series. Please try again later.');
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

  const handleOpenDialog = async (series: Series | null = null) => {
    if (series) {
      try {
        // Get full series details including MDRM elements
        const fullSeriesData = await getSeriesById(series.id);
        setCurrentSeries(fullSeriesData);
        setFormData({
          name: fullSeriesData.name,
          description: fullSeriesData.description,
          frequency: fullSeriesData.frequency,
          mdrm_elements: fullSeriesData.mdrm_elements.join(','),
        });
      } catch (err) {
        console.error('Error fetching series details:', err);
        setError('Failed to load series details. Please try again.');
        return;
      }
    } else {
      setCurrentSeries(null);
      setFormData({
        name: '',
        description: '',
        frequency: '',
        mdrm_elements: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async () => {
    try {
      const seriesData = {
        ...formData,
        mdrm_elements: formData.mdrm_elements.split(',').map(item => item.trim()),
      };

      if (currentSeries) {
        // Update existing series
        await updateSeries(currentSeries.id, seriesData);
      } else {
        // Create new series
        await createSeries(seriesData);
      }
      handleCloseDialog();
      fetchSeries();
    } catch (err) {
      console.error('Error saving series:', err);
      setError('Failed to save series. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this series?')) {
      try {
        await deleteSeries(id);
        fetchSeries();
      } catch (err) {
        console.error('Error deleting series:', err);
        setError('Failed to delete series. Please try again.');
      }
    }
  };

  // Filter series based on search term
  const filteredSeries = seriesList.filter(
    (series) =>
      series.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      series.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      series.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate the filtered series
  const paginatedSeries = filteredSeries.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Series</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New Series
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <TextField
          label="Search Series"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
        />
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
                  <TableCell>Series ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Frequency</TableCell>
                  <TableCell>MDRM Elements</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedSeries.length > 0 ? (
                  paginatedSeries.map((series) => (
                    <TableRow key={series.id}>
                      <TableCell>{series.id}</TableCell>
                      <TableCell>{series.name}</TableCell>
                      <TableCell>{series.description}</TableCell>
                      <TableCell>{series.frequency}</TableCell>
                      <TableCell>
                        {series.mdrm_elements && series.mdrm_elements.length > 0 ? (
                          <Chip 
                            label={`${series.mdrm_elements.length} elements`} 
                            color="primary" 
                            variant="outlined" 
                            size="small" 
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(series)}
                          size="small"
                          title="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(series.id)}
                          size="small"
                          title="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No series found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredSeries.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{currentSeries ? 'Edit Series' : 'Add New Series'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {currentSeries
              ? 'Update the details of the series.'
              : 'Enter the details of the new series.'}
          </DialogContentText>
          <TextField
            margin="dense"
            name="name"
            label="Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={handleInputChange}
            multiline
            rows={3}
          />
          <TextField
            margin="dense"
            name="frequency"
            label="Frequency"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.frequency}
            onChange={handleInputChange}
            required
            helperText="e.g., Monthly, Quarterly, Annual"
          />
          <TextField
            margin="dense"
            name="mdrm_elements"
            label="MDRM Elements"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.mdrm_elements}
            onChange={handleInputChange}
            multiline
            rows={3}
            helperText="Enter MDRM IDs separated by commas"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {currentSeries ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SeriesList;






















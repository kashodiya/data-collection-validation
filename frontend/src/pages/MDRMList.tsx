


















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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getMDRMElements, createMDRMElement, updateMDRMElement, deleteMDRMElement } from '../services/api';

interface MDRMElement {
  id: string;
  mdrm_id: string;
  name: string;
  description: string;
  data_type: string;
  series_id?: string;
}

const MDRMList: React.FC = () => {
  const [mdrmElements, setMdrmElements] = useState<MDRMElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentMdrm, setCurrentMdrm] = useState<MDRMElement | null>(null);
  const [formData, setFormData] = useState({
    mdrm_id: '',
    name: '',
    description: '',
    data_type: '',
    series_id: '',
  });

  useEffect(() => {
    fetchMDRMElements();
  }, []);

  const fetchMDRMElements = async () => {
    try {
      setLoading(true);
      const data = await getMDRMElements();
      setMdrmElements(data);
      setError('');
    } catch (err) {
      console.error('Error fetching MDRM elements:', err);
      setError('Failed to load MDRM elements. Please try again later.');
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

  const handleOpenDialog = (mdrm: MDRMElement | null = null) => {
    if (mdrm) {
      setCurrentMdrm(mdrm);
      setFormData({
        mdrm_id: mdrm.mdrm_id,
        name: mdrm.name,
        description: mdrm.description,
        data_type: mdrm.data_type,
        series_id: mdrm.series_id || '',
      });
    } else {
      setCurrentMdrm(null);
      setFormData({
        mdrm_id: '',
        name: '',
        description: '',
        data_type: '',
        series_id: '',
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
      if (currentMdrm) {
        // Update existing MDRM
        await updateMDRMElement(currentMdrm.id, formData);
      } else {
        // Create new MDRM
        await createMDRMElement(formData);
      }
      handleCloseDialog();
      fetchMDRMElements();
    } catch (err) {
      console.error('Error saving MDRM element:', err);
      setError('Failed to save MDRM element. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this MDRM element?')) {
      try {
        await deleteMDRMElement(id);
        fetchMDRMElements();
      } catch (err) {
        console.error('Error deleting MDRM element:', err);
        setError('Failed to delete MDRM element. Please try again.');
      }
    }
  };

  // Filter MDRM elements based on search term
  const filteredMdrmElements = mdrmElements.filter(
    (mdrm) =>
      mdrm.mdrm_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mdrm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mdrm.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate the filtered elements
  const paginatedMdrmElements = filteredMdrmElements.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">MDRM Elements</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add New MDRM
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <TextField
          label="Search MDRM Elements"
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
                  <TableCell>MDRM ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Data Type</TableCell>
                  <TableCell>Series ID</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedMdrmElements.length > 0 ? (
                  paginatedMdrmElements.map((mdrm) => (
                    <TableRow key={mdrm.id}>
                      <TableCell>{mdrm.mdrm_id}</TableCell>
                      <TableCell>{mdrm.name}</TableCell>
                      <TableCell>{mdrm.description}</TableCell>
                      <TableCell>{mdrm.data_type}</TableCell>
                      <TableCell>{mdrm.series_id || '-'}</TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(mdrm)}
                          size="small"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(mdrm.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No MDRM elements found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredMdrmElements.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentMdrm ? 'Edit MDRM Element' : 'Add New MDRM Element'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {currentMdrm
              ? 'Update the details of the MDRM element.'
              : 'Enter the details of the new MDRM element.'}
          </DialogContentText>
          <TextField
            margin="dense"
            name="mdrm_id"
            label="MDRM ID"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.mdrm_id}
            onChange={handleInputChange}
            required
          />
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
            name="data_type"
            label="Data Type"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.data_type}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="series_id"
            label="Series ID (Optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.series_id}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {currentMdrm ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MDRMList;



















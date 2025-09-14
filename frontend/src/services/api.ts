




import axios from 'axios';

const API_URL = 'http://localhost:52308/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
export const login = async (username: string, password: string) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await api.post('/token', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const register = async (userData: any) => {
  const response = await api.post('/register', userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

// MDRM API
export const getMDRMElements = async (params = {}) => {
  const response = await api.get('/mdrm-elements/', { params });
  return response.data;
};

export const getMDRMElement = async (mdrmId: string) => {
  const response = await api.get(`/mdrm-elements/${mdrmId}`);
  return response.data;
};

export const createMDRMElement = async (mdrmData: any) => {
  const response = await api.post('/mdrm-elements/', mdrmData);
  return response.data;
};

export const updateMDRMElement = async (mdrmId: string, mdrmData: any) => {
  const response = await api.put(`/mdrm-elements/${mdrmId}`, mdrmData);
  return response.data;
};

export const deleteMDRMElement = async (mdrmId: string) => {
  const response = await api.delete(`/mdrm-elements/${mdrmId}`);
  return response.data;
};

// Series API
export const getSeries = async (params = {}) => {
  const response = await api.get('/series/', { params });
  return response.data;
};

export const getSeriesById = async (seriesId: string) => {
  const response = await api.get(`/series/${seriesId}`);
  return response.data;
};

export const createSeries = async (seriesData: any) => {
  const response = await api.post('/series/', seriesData);
  return response.data;
};

export const updateSeries = async (seriesId: string, seriesData: any) => {
  const response = await api.put(`/series/${seriesId}`, seriesData);
  return response.data;
};

export const deleteSeries = async (seriesId: string) => {
  const response = await api.delete(`/series/${seriesId}`);
  return response.data;
};

// Reports API
export const getReports = async (params = {}) => {
  const response = await api.get('/reports/', { params });
  return response.data;
};

export const getReport = async (reportId: number) => {
  const response = await api.get(`/reports/${reportId}`);
  return response.data;
};

export const createReport = async (reportData: any) => {
  const response = await api.post('/reports/', reportData);
  return response.data;
};

export const submitReportData = async (reportId: number, data: any) => {
  const response = await api.post(`/reports/${reportId}/data`, data);
  return response.data;
};

export const uploadCsvData = async (reportId: number, file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/reports/${reportId}/upload-csv`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const validateReport = async (reportId: number) => {
  const response = await api.get(`/reports/${reportId}/validation`);
  return response.data;
};

// Institutions API
export const getInstitutions = async (params = {}) => {
  const response = await api.get('/institutions/', { params });
  return response.data;
};

export const createInstitution = async (name: string, identifier: string, type: string) => {
  const response = await api.post('/institutions/', { name, identifier, type });
  return response.data;
};

export default api;





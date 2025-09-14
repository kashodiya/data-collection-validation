import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import './App.css';

// Import our components
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import our components
import MDRMList from './pages/MDRMList';
import SeriesList from './pages/SeriesList';
import ReportsList from './pages/ReportsList';
import ReportDetail from './pages/ReportDetail';
import SubmitReport from './pages/SubmitReport';
import NotFound from './pages/NotFound';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function ProtectedRoute({ children, requiredRoles = [] }: { children: JSX.Element, requiredRoles?: string[] }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/mdrm" element={
              <ProtectedRoute requiredRoles={['admin', 'analyst']}>
                <Layout>
                  <MDRMList />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/series" element={
              <ProtectedRoute requiredRoles={['admin', 'analyst']}>
                <Layout>
                  <SeriesList />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Layout>
                  <ReportsList />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/reports/:id" element={
              <ProtectedRoute>
                <Layout>
                  <ReportDetail />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/submit-report" element={
              <ProtectedRoute requiredRoles={['external']}>
                <Layout>
                  <SubmitReport />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

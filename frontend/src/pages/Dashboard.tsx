











import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  Card, 
  CardContent, 
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getReports, getSeries, getMDRMElements } from '../services/api';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [seriesCount, setSeriesCount] = useState(0);
  const [mdrmCount, setMdrmCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent reports
        const reportsData = await getReports({ limit: 5 });
        setRecentReports(reportsData);

        // Fetch series count
        const seriesData = await getSeries();
        setSeriesCount(seriesData.length);

        // Fetch MDRM elements count
        const mdrmData = await getMDRMElements();
        setMdrmCount(mdrmData.length);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Welcome, {user?.username}!
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Stats Cards */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Reports
            </Typography>
            <Typography variant="h3">
              {loading ? '...' : recentReports.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Recent submissions
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Series
            </Typography>
            <Typography variant="h3">
              {loading ? '...' : seriesCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Available report series
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              MDRM Elements
            </Typography>
            <Typography variant="h3">
              {loading ? '...' : mdrmCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Data elements in system
            </Typography>
          </Paper>
        </Grid>

        {/* Recent Reports */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Recent Reports" />
            <CardContent>
              {loading ? (
                <Typography>Loading...</Typography>
              ) : recentReports.length > 0 ? (
                <List>
                  {recentReports.map((report, index) => (
                    <React.Fragment key={report.id}>
                      <ListItem>
                        <ListItemText
                          primary={`Report ID: ${report.id}`}
                          secondary={`Series: ${report.series_id} | Period: ${report.reporting_period} | Status: ${report.status}`}
                        />
                      </ListItem>
                      {index < recentReports.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography>No recent reports found.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Role-specific content */}
        {user?.role === 'admin' && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Admin Panel" />
              <CardContent>
                <Typography>
                  As an administrator, you have access to all system features including user management,
                  MDRM element management, and validation rule configuration.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {user?.role === 'analyst' && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Analyst Tools" />
              <CardContent>
                <Typography>
                  As an analyst, you can manage MDRM elements, define validation rules,
                  and review submitted reports.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}

        {user?.role === 'external' && (
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Submission Tools" />
              <CardContent>
                <Typography>
                  As an external user, you can submit reports for your institution and
                  view validation results.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard;












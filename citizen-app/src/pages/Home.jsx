import { Typography, Box, Button, Grid, Card, CardContent } from '@mui/material';
import { Add, List, Assessment } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.name}!
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Report road damage and track your complaints
      </Typography>
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }} onClick={() => navigate('/report')}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Add sx={{ fontSize: 60, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Report New Issue
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Submit a new road damage complaint
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }} onClick={() => navigate('/my-complaints')}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <List sx={{ fontSize: 60, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                My Complaints
              </Typography>
              <Typography variant="body2" color="textSecondary">
                View and track your submissions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Assessment sx={{ fontSize: 60, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ mt: 2 }}>
                Statistics
              </Typography>
              <Typography variant="body2" color="textSecondary">
                View complaint statistics
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

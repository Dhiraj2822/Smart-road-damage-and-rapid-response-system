import { useState, useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, CardActions, Button, 
  Grid, Chip, Dialog, DialogTitle, DialogContent, 
  TextField, DialogActions, CircularProgress, Alert 
} from '@mui/material';
import { contractorAPI } from '../services/api';
import { format } from 'date-fns';

export default function ContractorDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Completion Form State
  const [completionData, setCompletionData] = useState({
    finalCost: '',
    completionNotes: '',
    proofImageUrl: '' 
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await contractorAPI.getMyOrders();
      setOrders(res.data.workOrders);
      setLoading(false);
    } catch (err) {
      setError("Failed to load work orders");
      setLoading(false);
    }
  };

  const handleCompleteClick = (order) => {
    setSelectedOrder(order);
    setCompletionData({ finalCost: order.estimatedCost, completionNotes: '', proofImageUrl: '' });
  };

  const handleSubmitCompletion = async () => {
    try {
        setUploading(true);
        // In a real app, we would upload the file here. 
        // For compliance, we will simulate the upload url or use a placeholder if they didn't provide one
        const payload = {
            finalCost: completionData.finalCost,
            completionNotes: completionData.completionNotes,
            proofImageUrl: completionData.proofImageUrl || "https://placehold.co/600x400?text=Repaired"
        };
        
        await contractorAPI.completeOrder(selectedOrder.id, payload);
        setUploading(false);
        setSelectedOrder(null);
        fetchOrders(); // Refresh list
    } catch (err) {
        setUploading(false);
        alert("Failed to complete order");
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        My Assigned Jobs
      </Typography>
      
      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={3}>
        {orders.map((order) => (
          <Grid item xs={12} sm={6} md={4} key={order.id}>
            <Card sx={{ borderLeft: order.status === 'COMPLETED' ? '5px solid green' : '5px solid orange' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="h6">{order.orderNumber}</Typography>
                    <Chip label={order.status} color={order.status === 'COMPLETED' ? 'success' : 'warning'} />
                </Box>
                
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Due: {format(new Date(order.dueDate), 'MMM dd, yyyy')}
                </Typography>
                
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {order.description}
                </Typography>
                
                <Box mt={2} bgcolor="#f5f5f5" p={1} borderRadius={1}>
                    <Typography variant="caption">Complaint ID: {order.complaintId}</Typography>
                    <br/>
                     <Typography variant="caption">Est. Cost: ₹{order.estimatedCost}</Typography>
                </Box>

                {order.complaint.images[0] && (
                    <Box mt={2}>
                        <img 
                            src={`http://localhost:3000${order.complaint.images[0].imageUrl}`} 
                            alt="Damage" 
                            style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }} 
                        />
                    </Box>
                )}
              </CardContent>
              <CardActions>
                {order.status === 'IN_PROGRESS' && (
                    <Button 
                        fullWidth 
                        variant="contained" 
                        color="primary"
                        onClick={() => handleCompleteClick(order)}
                    >
                        Mark Completed
                    </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
        {orders.length === 0 && <Typography p={2}>No assigned jobs found.</Typography>}
      </Grid>

      {/* Completion Dialog */}
      <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)}>
        <DialogTitle>Complete Job {selectedOrder?.orderNumber}</DialogTitle>
        <DialogContent>
            <TextField
                margin="dense"
                label="Final Actual Cost (₹)"
                fullWidth
                type="number"
                value={completionData.finalCost}
                onChange={(e) => setCompletionData({...completionData, finalCost: e.target.value})}
            />
            <TextField
                margin="dense"
                label="Completion Notes"
                fullWidth
                multiline
                rows={3}
                value={completionData.completionNotes}
                onChange={(e) => setCompletionData({...completionData, completionNotes: e.target.value})}
            />
            <TextField
                margin="dense"
                label="Proof Image URL (e.g. upload to imgur and paste)"
                fullWidth
                placeholder="https://..."
                helperText="In production this would be a file picker"
                value={completionData.proofImageUrl}
                onChange={(e) => setCompletionData({...completionData, proofImageUrl: e.target.value})}
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setSelectedOrder(null)}>Cancel</Button>
            <Button onClick={handleSubmitCompletion} variant="contained" disabled={uploading}>
                {uploading ? 'Submitting...' : 'Submit & Close'}
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

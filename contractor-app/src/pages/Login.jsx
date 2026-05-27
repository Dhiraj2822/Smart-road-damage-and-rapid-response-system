import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, Alert, Paper, InputAdornment, IconButton } from '@mui/material';
import { Engineering, Visibility, VisibilityOff, Email } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.user.role !== 'CONTRACTOR') {
          setError('Access denied. Contractor portal only.');
          return;
      }
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: 3
    }}>
      <Container maxWidth="xs">
        <Paper elevation={6} sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ 
            bgcolor: 'primary.main', 
            p: 2, 
            borderRadius: '50%', 
            mb: 2,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
          }}>
             <Engineering sx={{ fontSize: 40, color: 'white' }} />
          </Box>
          <Typography component="h1" variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
            Contractor Portal
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }} align="center">
            Sign in to access your assigned work orders and submit completion proofs.
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2, width: '100%', borderRadius: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            <TextField
              margin="normal" required fullWidth label="Email Address"
              autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal" required fullWidth label="Password" 
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Engineering color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />
            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              size="large"
              sx={{ 
                py: 1.5, 
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
              }}>
              Sign In to Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

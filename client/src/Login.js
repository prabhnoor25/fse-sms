import React, { useState, useEffect } from 'react';
import { login } from './api';

import { TextField, Button, Paper, Typography, Alert, Box } from '@mui/material';

export default function Login({ setUser, setToken, setPage }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflowY;
    document.body.style.overflowY = 'hidden';
    return () => { document.body.style.overflowY = prev || ''; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(username, password);
    if (res.token) {
      setToken(res.token);
      setUser(res.user);
      setPage('dashboard');
    } else {
      setError(res.error || 'Login failed');
    }
  };

  return (
    <Box>
      <Box sx={{
        position: 'fixed',
        inset: 0,
        backgroundImage: "url('/images/school.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: -1,
      }} />

      <Box sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 0
      }}>
        <Paper elevation={6} sx={{ p: 4, width: '100%', maxWidth: 400, bgcolor: 'rgba(255,255,255,0.95)' }}>
          <Typography variant="h5" gutterBottom>Login</Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField label="Username" fullWidth margin="normal" value={username} onChange={e => setUsername(e.target.value)} />
            <TextField label="Password" type="password" fullWidth margin="normal" value={password} onChange={e => setPassword(e.target.value)} />
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Login</Button>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

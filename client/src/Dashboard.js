import React, { useEffect, useState } from 'react';
import { getDashboard } from './api';

import { Paper, Typography, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box } from '@mui/material';

export default function Dashboard({ token, user }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user.role === 'admin') {
      getDashboard(token).then(res => {
        if (res.users) setUsers(res.users);
        else setError(res.error || 'Failed to load dashboard');
      });
    }
  }, [token, user]);

  if (user.role !== 'admin') return (
    <Paper elevation={3} sx={{ p: 4, minWidth: 320 }}>
      <Typography variant="h5">Welcome, {user.name} ({user.role})</Typography>
    </Paper>
  );

  return (
    <Box sx={{ width: '100%', maxWidth: 800 }}>
      <Typography variant="h5" gutterBottom>Admin Dashboard</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.id}>
                <TableCell>{u.id}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

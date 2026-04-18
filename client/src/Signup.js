import React, { useState } from 'react';
import { signup } from './api';

import { TextField, Button, Paper, Typography, Alert, Box, MenuItem, Select, InputLabel, FormControl } from '@mui/material';

export default function Signup() {
  const [form, setForm] = useState({ username: '', password: '', role: 'student', name: '', email: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await signup(form);
    if (res.user) {
      setMessage('Signup successful!');
      setError('');
    } else {
      setError(res.error || 'Signup failed');
      setMessage('');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, minWidth: 320 }}>
      <Typography variant="h5" gutterBottom>Sign Up</Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <TextField name="username" label="Username" fullWidth margin="normal" value={form.username} onChange={handleChange} />
        <TextField name="password" label="Password" type="password" fullWidth margin="normal" value={form.password} onChange={handleChange} />
        <TextField name="name" label="Name" fullWidth margin="normal" value={form.name} onChange={handleChange} />
        <TextField name="email" label="Email" fullWidth margin="normal" value={form.email} onChange={handleChange} />
        <FormControl fullWidth margin="normal">
          <InputLabel>Role</InputLabel>
          <Select name="role" value={form.role} label="Role" onChange={handleChange}>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="teacher">Teacher</MenuItem>
            <MenuItem value="student">Student</MenuItem>
          </Select>
        </FormControl>
        <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>Sign Up</Button>
        {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Box>
    </Paper>
  );
}

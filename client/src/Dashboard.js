import React, { useEffect, useState } from 'react';
import { getDashboard, getCounts } from './api';
import { io as socketIOClient } from 'socket.io-client';

import { Paper, Typography, Alert, Box, Grid, Card, CardContent, List, ListItem, ListItemText } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ClassIcon from '@mui/icons-material/Class';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';

export default function Dashboard({ token, user }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [counts, setCounts] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (user.role === 'admin') {
      getDashboard(token).then(res => {
        if (res.users) setUsers(res.users);
        if (res.activity) setRecentActivity(res.activity);
        if (res.error) setError(res.error || 'Failed to load dashboard');
      });
      getCounts(token).then(c => setCounts(c)).catch(()=>{});

      let socket;
      let pollingInterval;
      try {
        socket = socketIOClient('http://localhost:5000', { transports: ['websocket'] });
        socket.on('connect', () => { console.info('Socket connected'); });
        socket.on('activity', (a) => {
          setRecentActivity(prev => [a, ...prev].slice(0,20));
        });
        socket.on('connect_error', (err) => {
          console.warn('Socket connect_error', err);
          // fallback to polling
          if (!pollingInterval) {
            pollingInterval = setInterval(() => {
              getDashboard(token).then(res => { if (res.activity) setRecentActivity(res.activity); });
            }, 5000);
          }
        });
      } catch (e) {
        // start polling if socket lib failed
        pollingInterval = setInterval(() => {
          getDashboard(token).then(res => { if (res.activity) setRecentActivity(res.activity); });
        }, 5000);
      }

      return () => { if (socket) socket.disconnect(); if (pollingInterval) clearInterval(pollingInterval); };
    }
  }, [token, user]);

  if (user.role !== 'admin') return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h4">Welcome, {user.name}</Typography>
      <Typography color="text.secondary">Role: {user.role}</Typography>
    </Paper>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PeopleIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">Students</Typography>
                <Typography variant="h4">{counts ? counts.students : '—'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <GroupIcon color="secondary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">Teachers</Typography>
                <Typography variant="h4">{counts ? counts.teachers : '—'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ClassIcon color="success" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">Classes</Typography>
                <Typography variant="h4">{counts ? counts.classes : '—'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MenuBookIcon color="info" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">Subjects</Typography>
                <Typography variant="h4">{counts ? counts.subjects : '—'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AssignmentIcon color="warning" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">Assignments</Typography>
                <Typography variant="h4">{counts ? counts.assignments : '—'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SchoolIcon color="error" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6">Enrollments</Typography>
                <Typography variant="h4">{counts ? counts.enrollments : '—'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Paper sx={{ p:3, ml:0, mr:2 , width:1143 }}>
            <Typography variant="h5">Recent Activity</Typography>
            <List>
              {recentActivity.map((a, i) => (
                <ListItem key={a.id ? `${a.type}-${a.id}` : `a-${i}`} divider>
                  <ListItemText
                    primary={(a.type === 'login') ? `${a.name} logged in` : (a.type === 'student_created') ? `New student: ${a.name}` : (a.message || '')}
                    primaryTypographyProps={{ variant: 'subtitle1' }}
                    secondary={a.time ? new Date(a.time).toLocaleString() : ''}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </ListItem>
              ))}
              {recentActivity.length === 0 && <Typography color="text.secondary">No recent activity.</Typography>}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

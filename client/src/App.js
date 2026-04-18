import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import SchoolIcon from '@mui/icons-material/School';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [page, setPage] = useState('login');

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <AppBar position="static">
        <Toolbar>
          <SchoolIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            School Management System
          </Typography>
          {user ? (
            <Button color="inherit" onClick={() => { setUser(null); setToken(''); setPage('login'); }}>Logout</Button>
          ) : (
            <>
              <Button color="inherit" onClick={() => setPage('login')}>Login</Button>
              <Button color="inherit" onClick={() => setPage('signup')}>Sign Up</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        {!user ? (
          page === 'login' ? <Login setUser={setUser} setToken={setToken} /> : <Signup />
        ) : (
          <Dashboard user={user} token={token} />
        )}
      </Box>
    </Box>
  );
}

export default App;

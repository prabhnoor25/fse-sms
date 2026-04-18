import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import Dashboard from './Dashboard';
import Students from './Students';
import Teachers from './Teachers';
import Classes from './Classes';
import Subjects from './Subjects';
import Assignments from './Assignments';
import Enrollments from './Enrollments';
import Grades from './Grades';
import Attendance from './Attendance';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CssBaseline from '@mui/material/CssBaseline';

import PeopleIcon from '@mui/icons-material/People';
import GroupIcon from '@mui/icons-material/Group';
import ClassIcon from '@mui/icons-material/Class';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import TableRowsIcon from '@mui/icons-material/TableRows';

const drawerWidth = 220;

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState('');
  const [page, setPage] = useState('login');

  const handleLogout = () => { setUser(null); setToken(''); setPage('login'); };

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <SchoolIcon /> },
    { key: 'students', label: 'Students', icon: <PeopleIcon /> },
    { key: 'teachers', label: 'Teachers', icon: <GroupIcon /> },
    { key: 'classes', label: 'Classes', icon: <ClassIcon /> },
    { key: 'subjects', label: 'Subjects', icon: <MenuBookIcon /> },
    { key: 'assignments', label: 'Assignments', icon: <AssignmentIcon /> },
    { key: 'enrollments', label: 'Enrollments', icon: <TableRowsIcon /> },
    { key: 'grades', label: 'Grades', icon: <AssignmentIcon /> },
    { key: 'attendance', label: 'Attendance', icon: <AssignmentIcon /> }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <SchoolIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Campus Care
          </Typography>
          {user && <Button color="inherit" onClick={handleLogout}>Logout</Button>}
        </Toolbar>
      </AppBar>

      {user && (
        <Drawer variant="permanent" sx={{ width: drawerWidth, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' } }}>
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {navItems.map(item => (
                <ListItem key={item.key} disablePadding>
                  <ListItemButton selected={page === item.key} onClick={() => setPage(item.key)}>
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {!user ? (
          page === 'login' ? <Login setUser={setUser} setToken={setToken} setPage={setPage} /> : <Signup />
        ) : (
          <>
            {page === 'dashboard' && <Dashboard user={user} token={token} />}
            {page === 'students' && <Students token={token} user={user} />}
            {page === 'teachers' && <Teachers token={token} user={user} />}
            {page === 'classes' && <Classes token={token} user={user} />}
            {page === 'subjects' && <Subjects token={token} user={user} />}
            {page === 'assignments' && <Assignments token={token} user={user} />}
            {page === 'enrollments' && <Enrollments token={token} user={user} />}
            {page === 'grades' && <Grades token={token} user={user} />}
            {page === 'attendance' && <Attendance token={token} user={user} />}
          </>
        )}
      </Box>
    </Box>
  );
}

export default App;

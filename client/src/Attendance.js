import React, { useEffect, useState } from 'react';
import { createAttendance, getAttendanceByStudent, getAttendanceByClass, getStudents, getClasses } from './api';
import { Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Alert, Select, MenuItem, FormControl, InputLabel, Grid } from '@mui/material';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

export default function Attendance({ token, user }) {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ studentId: '', classId: '', date: '', status: 'present' });
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [query, setQuery] = useState({ type: 'student', value: '' });
  const [error, setError] = useState('');

  useEffect(()=>{ loadRefs(); }, [token]);

  async function loadRefs() { try{ const s = await getStudents(token); if (s.students) setStudents(s.students); const c = await getClasses(token); if (c.classes) setClasses(c.classes); }catch(e){} }

  const loadByStudent = async (studentId) => {
    const res = await getAttendanceByStudent(token, studentId);
    if (res.attendance) setRecords(res.attendance);
    else setError(res.error || 'Failed to load');
  };

  const loadByClass = async (classId) => {
    const res = await getAttendanceByClass(token, classId);
    if (res.attendance) setRecords(res.attendance);
    else setError(res.error || 'Failed to load');
  };

  useEffect(() => {
    // If student, auto-load own attendance
    if (user && user.role === 'student') {
      (async () => {
        try {          const s = await getStudents(token);
          const my = s.students ? s.students.find(x => String(x.rollNumber) === String(user.username)) : null;
          if (!my) { setError('Student record not found'); return; }
          await loadByStudent(my.id);
        } catch (e) { setError('Failed to load student attendance'); }
      })();
    }
  }, [user, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { studentId: form.studentId, classId: form.classId, date: form.date, status: form.status };
    const res = await createAttendance(token, payload);
    if (res.attendance) { setForm({ studentId: '', classId: '', date: '', status: 'present' }); setError(''); }
    else setError(res.error || 'Create failed');
  };

  const handleLoad = async () => {
    if (!query.value) return setError('Enter ID to query');
    setError('');
    if (query.type === 'student') await loadByStudent(query.value);
    else await loadByClass(query.value);
  };

  // Chart data preparation
  const chartData = React.useMemo(() => {
    if (!records || records.length === 0) return { monthly: [], summary: [] };
    const monthlyMap = {}; // YYYY-MM -> {total, present}
    let present = 0, absent = 0, late = 0, excused = 0;
    records.forEach(r => {      const m = (r.date || '').slice(0,7) || 'unknown';      monthlyMap[m] = monthlyMap[m] || { total: 0, present: 0 };      monthlyMap[m].total += 1;      if (String(r.status).toLowerCase() === 'present') { monthlyMap[m].present += 1; present += 1; }      else if (String(r.status).toLowerCase() === 'absent') { absent += 1; }      else if (String(r.status).toLowerCase() === 'late') { late += 1; }      else if (String(r.status).toLowerCase() === 'excused') { excused += 1; }    });    const months = Object.keys(monthlyMap).sort();    const monthly = months.map(m => ({ month: m, percent: Math.round((monthlyMap[m].present / monthlyMap[m].total) * 100) }));    const summary = [ { name: 'Present', value: present }, { name: 'Absent', value: absent }, { name: 'Late', value: late }, { name: 'Excused', value: excused } ];    return { monthly, summary };  }, [records]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Attendance</Typography>
      {error && <Alert severity="error">{error}</Alert>}

      {user && user.role !== 'student' && (
        <Paper sx={{ p:2, mb:2 }}>          <form onSubmit={handleSubmit}>            <FormControl fullWidth margin="dense">              <InputLabel>Student</InputLabel>              <Select value={form.studentId} label="Student" onChange={e=>setForm({...form, studentId:e.target.value})}>                {students.map(s=> <MenuItem key={s.id} value={s.id}>{s.name} ({s.rollNumber||s.id})</MenuItem>)}              </Select>            </FormControl>            <FormControl fullWidth margin="dense">              <InputLabel>Class</InputLabel>              <Select value={form.classId} label="Class" onChange={e=>setForm({...form, classId:e.target.value})}>                {classes.map(c=> <MenuItem key={c.id} value={c.id}>{c.name} ({c.grade}{c.section?'-'+c.section:''})</MenuItem>)}              </Select>            </FormControl>            <LocalizationProvider dateAdapter={AdapterDayjs}>              <DatePicker                label="Date"                value={form.date ? dayjs(form.date) : null}                onChange={(newValue)=>setForm({...form, date: newValue ? newValue.format('YYYY-MM-DD') : ''})}                renderInput={(params)=><TextField {...params} fullWidth margin="dense" />}              />            </LocalizationProvider>            <FormControl fullWidth margin="dense">              <InputLabel>Status</InputLabel>              <Select value={form.status} label="Status" onChange={e=>setForm({...form, status:e.target.value})}>                <MenuItem value="present">Present</MenuItem>                <MenuItem value="absent">Absent</MenuItem>                <MenuItem value="late">Late</MenuItem>                <MenuItem value="excused">Excused</MenuItem>              </Select>            </FormControl>            <Button type="submit" variant="contained" sx={{ mt:1 }}>Add Attendance</Button>          </form>        </Paper>      )}

      {user && user.role !== 'student' && (
        <Paper sx={{ p:2, mb:2 }}>          <Typography variant="subtitle1">Query Attendance</Typography>          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>            <FormControl>              <InputLabel>Type</InputLabel>              <Select value={query.type} label="Type" onChange={e=>setQuery({...query, type: e.target.value})}>                <MenuItem value="student">Student</MenuItem>                <MenuItem value="class">Class</MenuItem>              </Select>            </FormControl>            {query.type === 'student' ? (              <FormControl>                <InputLabel>Student</InputLabel>                <Select value={query.value} label="Student" onChange={e=>setQuery({...query, value: e.target.value})} sx={{ minWidth: 200 }}>                  {students.map(s=> <MenuItem key={s.id} value={s.id}>{s.name} ({s.rollNumber||s.id})</MenuItem>)}                </Select>              </FormControl>            ) : (              <FormControl>                <InputLabel>Class</InputLabel>                <Select value={query.value} label="Class" onChange={e=>setQuery({...query, value: e.target.value})} sx={{ minWidth: 200 }}>                  {classes.map(c=> <MenuItem key={c.id} value={c.id}>{c.name} ({c.grade}{c.section?'-'+c.section:''})</MenuItem>)}                </Select>              </FormControl>            )}            <Button variant="contained" onClick={handleLoad}>Load</Button>          </Box>        </Paper>      )}

      {/* Charts area */}      <Grid container spacing={2} sx={{ mb:2 }}>        <Grid item xs={12} md={8}>          <Paper sx={{ p:2, height: 300 }}>            <Typography variant="h6">Monthly Attendance %</Typography>            <ResponsiveContainer width="100%" height="85%">              <LineChart data={chartData.monthly} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>                <CartesianGrid strokeDasharray="3 3" />                <XAxis dataKey="month" />                <YAxis unit="%" />                <Tooltip />                <Line type="monotone" dataKey="percent" stroke="#8884d8" activeDot={{ r: 8 }} />              </LineChart>            </ResponsiveContainer>          </Paper>        </Grid>        <Grid item xs={12} md={4}>          <Paper sx={{ p:2, height: 300 }}>            <Typography variant="h6">Summary</Typography>            <ResponsiveContainer width="100%" height="85%">              <BarChart data={chartData.summary} layout="vertical">                <CartesianGrid strokeDasharray="3 3" />                <XAxis type="number" />                <YAxis dataKey="name" type="category" width={100} />                <Tooltip />                <Legend />                <Bar dataKey="value" fill="#82ca9d" />              </BarChart>            </ResponsiveContainer>          </Paper>        </Grid>      </Grid>

      <TableContainer component={Paper}>        <Table>          <TableHead>            <TableRow>              <TableCell>ID</TableCell>              <TableCell>Student</TableCell>              <TableCell>Class</TableCell>              <TableCell>Date</TableCell>              <TableCell>Status</TableCell>            </TableRow>          </TableHead>          <TableBody>            {records.map(r=> (              <TableRow key={r.id}>                <TableCell>{r.id}</TableCell>                <TableCell>{ (user && user.role==='student') ? (user.name || user.username) : (students.find(s=>String(s.id)===String(r.studentId)) ? students.find(s=>String(s.id)===String(r.studentId)).name : r.studentId)}</TableCell>                <TableCell>{classes.find(c=>String(c.id)===String(r.classId)) ? classes.find(c=>String(c.id)===String(r.classId)).name : r.classId}</TableCell>                <TableCell>{r.date}</TableCell>                <TableCell>{r.status}</TableCell>              </TableRow>            ))}          </TableBody>        </Table>      </TableContainer>    </Box>  );
}
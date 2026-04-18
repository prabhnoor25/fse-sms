import React, { useEffect, useState } from 'react';
import { createAttendance, getAttendanceByStudent, getAttendanceByClass, getStudents, getClasses } from './api';
import { Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Alert, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

export default function Attendance({ token }) {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ studentId: '', classId: '', date: '', status: 'present' });
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [query, setQuery] = useState({ type: 'student', value: '' });
  const [error, setError] = useState('');

  const loadRefs = async () => { try{ const s = await getStudents(token); if (s.students) setStudents(s.students); const c = await getClasses(token); if (c.classes) setClasses(c.classes); }catch(e){} };
  React.useEffect(()=>{ loadRefs(); }, [token]);

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

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Attendance</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper sx={{ p:2, mb:2 }}>
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="dense">
            <InputLabel>Student</InputLabel>
            <Select value={form.studentId} label="Student" onChange={e=>setForm({...form, studentId:e.target.value})}>
              {students.map(s=> <MenuItem key={s.id} value={s.id}>{s.name} ({s.rollNumber||s.id})</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Class</InputLabel>
            <Select value={form.classId} label="Class" onChange={e=>setForm({...form, classId:e.target.value})}>
              {classes.map(c=> <MenuItem key={c.id} value={c.id}>{c.name} ({c.grade}{c.section?'-'+c.section:''})</MenuItem>)}
            </Select>
          </FormControl>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date"
              value={form.date ? dayjs(form.date) : null}
              onChange={(newValue)=>setForm({...form, date: newValue ? newValue.format('YYYY-MM-DD') : ''})}
              renderInput={(params)=><TextField {...params} fullWidth margin="dense" />}
            />
          </LocalizationProvider>
          <FormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>
            <Select value={form.status} label="Status" onChange={e=>setForm({...form, status:e.target.value})}>
              <MenuItem value="present">Present</MenuItem>
              <MenuItem value="absent">Absent</MenuItem>
              <MenuItem value="late">Late</MenuItem>
              <MenuItem value="excused">Excused</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="contained" sx={{ mt:1 }}>Add Attendance</Button>
        </form>
      </Paper>

      <Paper sx={{ p:2, mb:2 }}>
        <Typography variant="subtitle1">Query Attendance</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl>
            <InputLabel>Type</InputLabel>
            <Select value={query.type} label="Type" onChange={e=>setQuery({...query, type: e.target.value})}>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="class">Class</MenuItem>
            </Select>
          </FormControl>
          {query.type === 'student' ? (
            <FormControl>
              <InputLabel>Student</InputLabel>
              <Select value={query.value} label="Student" onChange={e=>setQuery({...query, value: e.target.value})} sx={{ minWidth: 200 }}>
                {students.map(s=> <MenuItem key={s.id} value={s.id}>{s.name} ({s.rollNumber||s.id})</MenuItem>)}
              </Select>
            </FormControl>
          ) : (
            <FormControl>
              <InputLabel>Class</InputLabel>
              <Select value={query.value} label="Class" onChange={e=>setQuery({...query, value: e.target.value})} sx={{ minWidth: 200 }}>
                {classes.map(c=> <MenuItem key={c.id} value={c.id}>{c.name} ({c.grade}{c.section?'-'+c.section:''})</MenuItem>)}
              </Select>
            </FormControl>
          )}
          <Button variant="contained" onClick={handleLoad}>Load</Button>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Student ID</TableCell>
              <TableCell>Class ID</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map(r=> (
              <TableRow key={r.id}>
                <TableCell>{r.id}</TableCell>
                <TableCell>{students.find(s=>String(s.id)===String(r.studentId)) ? students.find(s=>String(s.id)===String(r.studentId)).name : r.studentId}</TableCell>
                <TableCell>{classes.find(c=>String(c.id)===String(r.classId)) ? classes.find(c=>String(c.id)===String(r.classId)).name : r.classId}</TableCell>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
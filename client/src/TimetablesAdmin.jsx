import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Button, TextField, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { getTimetables, createTimetable, updateTimetable, deleteTimetable, getClasses, getTeachers, getSubjects } from './api';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const TIMES = ['09:00','10:00','11:00','12:00','13:00','14:00'];

function emptyGrid() {
  const g = {};
  DAYS.forEach(d => {
    g[d] = {};
    TIMES.forEach(t => g[d][t] = { subject: '', subjectId: '', teacherId: '', teacherEmployeeId: '' });
  });
  return g;
}

export default function TimetablesAdmin({ token, user }) {
  const [timetables, setTimetables] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [grid, setGrid] = useState(emptyGrid());

  const load = async () => {
    if (!token) { setError('Not authenticated'); return; }
    try {
      const t = await getTimetables(token);
      if (t && t.timetables) setTimetables(t.timetables);
      const c = await getClasses(token);
      if (c && c.classes) setClasses(c.classes);
      const ts = await getTeachers(token);
      if (ts && ts.teachers) setTeachers(ts.teachers);
      const s = await getSubjects(token);
      if (s && s.subjects) setSubjects(s.subjects);
      setError('');
    } catch (e) {
      setError(e && e.error ? e.error : 'Failed to load');
    }
  };

  useEffect(() => { load(); }, [token]);

  const setCell = (day, time, field, value) => {
    setGrid(prev => ({ ...prev, [day]: { ...prev[day], [time]: { ...prev[day][time], [field]: value } } }));
  };

  const handleSave = async (e) => {
    e && e.preventDefault();
    if (!selectedClass) { alert('Class is required'); return; }
    const payload = { title: title || `Timetable for ${selectedClass}`, forClassId: selectedClass, data: grid };
    if (editingId) {
      const res = await updateTimetable(token, editingId, payload);
      if (res && res.timetable) { resetForm(); load(); }
      else alert(res.error || 'Update failed');
    } else {
      const res = await createTimetable(token, payload);
      if (res && res.timetable) { resetForm(); load(); }
      else alert(res.error || 'Create failed');
    }
  };

  const resetForm = () => { setEditingId(null); setTitle(''); setSelectedClass(''); setGrid(emptyGrid()); };

  const handleEdit = (t) => {
    setEditingId(t.id);
    setTitle(t.title || '');
    setSelectedClass(t.forClassId || '');
    // normalize loaded data: if array-based convert, if object keep
    setGrid(t.data || emptyGrid());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => { if (!window.confirm('Delete timetable?')) return; await deleteTimetable(token, id); load(); };

  // helper: returns teachers filtered by subjectId (if provided)
  const teachersForSubject = (subjectId) => {
    if (!subjectId) return teachers;
    return teachers.filter(t => {
      if (!t.subjects) return false;
      const parts = t.subjects.split(',').map(p => p.trim()).filter(Boolean);
      return parts.includes(String(subjectId)) || parts.includes(subjectId);
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <Paper sx={{ p:3, mt:3, mx:3 }}>
        <Typography variant="h6">Timetables</Typography>
        <Typography color="text.secondary">This section is for admins only. Please log in as an admin to manage timetables.</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h5">Timetables (Admin)</Typography>
      {error && <Paper sx={{ p:2, mt:2, mx:3 }}><Typography color="error">{error}</Typography></Paper>}
      <Paper sx={{ p:3, mt:3, mx:3 }}>
        <form onSubmit={handleSave}>
          <TextField label="Title" value={title} onChange={e=>setTitle(e.target.value)} fullWidth margin="dense" />
          <FormControl fullWidth margin="dense">
            <InputLabel id="class-select-label">Class (required)</InputLabel>
            <Select labelId="class-select-label" label="Class (required)" value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}>
              <MenuItem value="">-- Select Class --</MenuItem>
              {classes.map(c => <MenuItem key={c.id} value={c.id}>{c.name} ({c.grade}{c.section?'-'+c.section:''})</MenuItem>)}
            </Select>
          </FormControl>

          <Typography sx={{ mt:2 }}>Edit timetable grid (subject + teacher). Leave fields empty for free periods.</Typography>
          <TableContainer component={Paper} sx={{ mt:2, mx:1 }}>
            <Table size="small" sx={{ borderCollapse: 'separate', borderSpacing: '8px' }}>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  {DAYS.map(d => <TableCell key={d}>{d}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {TIMES.map(time => (
                  <TableRow key={time}>
                    <TableCell sx={{ fontWeight: 600, width:120 }}>{time}</TableCell>
                    {DAYS.map(day => {
                      const cell = grid[day]?.[time] || { subject: '', subjectId: '', teacherId: '' };
                      const availableTeachers = teachersForSubject(cell.subjectId);
                      return (
                        <TableCell key={day} sx={{ px:2, py:1 }}>
                          <Box sx={{ display:'flex', flexDirection:'column', gap:1 }}>
                            <FormControl fullWidth>
                              <Select
                                displayEmpty
                                value={cell.subjectId || ''}
                                onChange={e=>{
                                  const subId = e.target.value;
                                  const sub = subjects.find(s => String(s.id) === String(subId));
                                  setCell(day, time, 'subjectId', subId);
                                  setCell(day, time, 'subject', sub ? sub.name : '');
                                  const filtered = teachersForSubject(subId).map(t=>t.id);
                                  if (!filtered.includes(cell.teacherId)) { setCell(day, time, 'teacherId', ''); setCell(day, time, 'teacherEmployeeId', ''); }
                                }}
                                size="small"
                                sx={{ '& .MuiSelect-select': { textAlign: 'center' } }}
                                inputProps={{ 'aria-label': 'Subject' }}
                              >
                                <MenuItem value="">Free</MenuItem>
                                {subjects.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                              </Select>
                            </FormControl>

                            <FormControl fullWidth>
                              <Select
                                displayEmpty
                                value={cell.teacherId || ''}
                                onChange={e=>setCell(day,time,'teacherId',e.target.value)}
                                size="small"
                                sx={{ '& .MuiSelect-select': { textAlign: 'center' } }}
                                inputProps={{ 'aria-label': 'Teacher' }}
                              >
                                <MenuItem value="">--</MenuItem>
                                {availableTeachers.map(t => <MenuItem key={t.id} value={t.id}>{t.name || t.employeeId || t.username}</MenuItem>)}
                              </Select>
                            </FormControl>
                          </Box>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt:3 }}>
            <Button type="submit" variant="contained" sx={{ mr:1 }}>{editingId ? 'Save changes' : 'Create Timetable'}</Button>
            <Button onClick={resetForm}>Reset</Button>
          </Box>
        </form>
      </Paper>

      <TableContainer component={Paper} sx={{ mt:2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timetables.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.id}</TableCell>
                <TableCell>{t.title}</TableCell>
                <TableCell>{t.forClassId}</TableCell>
                <TableCell>
                  <Button onClick={()=>handleEdit(t)} sx={{ mr:1 }}>Edit</Button>
                  <Button onClick={()=>navigator.clipboard.writeText(JSON.stringify(t.data || {}))} sx={{ mr:1 }}>Copy JSON</Button>
                  <Button color="error" onClick={()=>handleDelete(t.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

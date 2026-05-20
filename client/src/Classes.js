import React, { useEffect, useState, useMemo } from 'react';
import { getClasses, createClass, deleteClass, updateClass, getTeachers, getEnrollments, getStudents } from './api';
import { Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Classes({ token, user }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', grade: '', section: '', teacherId: '' });
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const load = async () => {
    const res = await getClasses(token);
    if (res.classes) setItems(res.classes);
    else setError(res.error || 'Failed to load');

    // load teachers for dropdowns and enrollments/students
    try {
      const t = await getTeachers(token);
      if (t && t.teachers) setTeachers(t.teachers);
    } catch (e) { /* ignore */ }
    try {      const e = await getEnrollments(token);      if (e && e.enrollments) setEnrollments(e.enrollments);    } catch (e) {}    try {      const s = await getStudents(token);      if (s && s.students) setStudents(s.students);    } catch (e) {}  };

  useEffect(()=>{ load(); }, [token]);

  useEffect(() => {
    if (user && user.role === 'student') {
      (async () => {
        try {
          const sres = await getStudents(token);
          const allStudents = sres.students || [];
          const me = allStudents.find(x => String(x.rollNumber) === String(user.username) || String(x.id) === String(user.id));
          if (!me) return;
          const eres = await getEnrollments(token);
          const myEnrolls = (eres.enrollments || []).filter(en => String(en.studentId) === String(me.id));
          const classIds = myEnrolls.map(en => String(en.classId));
          const classesRes = await getClasses(token);
          const myClasses = (classesRes.classes || []).filter(c => classIds.includes(String(c.id)));
          setItems(myClasses);
        } catch (err) {          // ignore
        }
      })();
    }
  }, [user, token]);

  const handleSubmit = async (e) => { e.preventDefault(); const res = await createClass(token, form); if (res.class) { setForm({ name: '', grade: '', section: '', teacherId: '' }); load(); setError(''); } else setError(res.error || 'Create failed'); };
  const handleDelete = async (id) => { await deleteClass(token, id); load(); };

  const handleEditOpen = (item) => { setEditForm({ id: item.id, name: item.name || '', grade: item.grade || '', section: item.section || '', teacherId: item.teacherId || '' }); setEditOpen(true); };
  const handleEditClose = () => { setEditOpen(false); setEditForm(null); };
  const handleUpdate = async (e) => { if (e && e.preventDefault) e.preventDefault(); const payload = { ...editForm }; const res = await updateClass(token, editForm.id, payload); if (res && res.class) { handleEditClose(); load(); setError(''); } else setError(res.error || 'Update failed'); };

  const chartData = useMemo(() => {
    // show enrollment counts per class
    if (!items || items.length === 0) return [];
    const map = {};
    items.forEach(c => { map[c.id] = 0; });
    (enrollments || []).forEach(en => { if (map[en.classId] !== undefined) map[en.classId]++; });
    return Object.keys(map).map(id => ({ className: (items.find(x=>String(x.id)===String(id))?.name) || id, count: map[id] }));
  }, [items, enrollments]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Classes</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {user && user.role !== 'student' && (
      <Paper sx={{ p:2, mb:2 }}>
        <form onSubmit={handleSubmit}>
          <TextField label="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} fullWidth margin="dense" />
          <TextField label="Grade" value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})} fullWidth margin="dense" />
          <TextField label="Section" value={form.section} onChange={e=>setForm({...form, section:e.target.value})} fullWidth margin="dense" />
          <FormControl fullWidth margin="dense">
            <InputLabel id="teacher-select-label">Teacher</InputLabel>
            <Select
              labelId="teacher-select-label"
              label="Teacher"
              value={form.teacherId}
              onChange={e=>setForm({...form, teacherId:e.target.value})}
            >
              {teachers.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.name || t.employeeId || t.username || t.id}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button type="submit" variant="contained" sx={{ mt:1 }}>Add Class</Button>
        </form>
      </Paper>
      )}

      <Grid container spacing={2} sx={{ mb:2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:2, height: 300 }}>
            <Typography variant="h6">Students per Class (enrollments)</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="className" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Grade</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Teacher ID</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(i=> (
              <TableRow key={i.id}>
                <TableCell>{i.id}</TableCell>
                <TableCell>{i.name}</TableCell>
                <TableCell>{i.grade}</TableCell>
                <TableCell>{i.section}</TableCell>
                <TableCell>{(teachers.find(t=>t.id===i.teacherId)?.name) || i.teacherId}</TableCell>
                <TableCell>
                  {user && user.role !== 'student' && (<><Button onClick={()=>handleEditOpen(i)} sx={{ mr:1 }}>Edit</Button>
                  <Button color="error" onClick={()=>handleDelete(i.id)}>Delete</Button></>)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editOpen} onClose={handleEditClose} fullWidth>
        <DialogTitle>Edit Class</DialogTitle>
        <DialogContent>
          {editForm && (
            <Box component="form" onSubmit={handleUpdate} sx={{ mt:1 }}>
              <TextField label="Name" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} fullWidth margin="dense" />
              <TextField label="Grade" value={editForm.grade} onChange={e=>setEditForm({...editForm, grade:e.target.value})} fullWidth margin="dense" />
              <TextField label="Section" value={editForm.section} onChange={e=>setEditForm({...editForm, section:e.target.value})} fullWidth margin="dense" />
              <FormControl fullWidth margin="dense">
                <InputLabel id="edit-teacher-select-label">Teacher</InputLabel>
                <Select
                  labelId="edit-teacher-select-label"
                  label="Teacher"
                  value={editForm.teacherId}
                  onChange={e=>setEditForm({...editForm, teacherId:e.target.value})}
                >
                  {teachers.map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.name || t.employeeId || t.username || t.id}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
import React, { useEffect, useState } from 'react';
import { getEnrollments, createEnrollment, deleteEnrollment, updateEnrollment, getStudents, getClasses } from './api';
import { Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export default function Enrollments({ token }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ studentId: '', classId: '' });
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const load = async () => { const res = await getEnrollments(token); if (res.enrollments) setItems(res.enrollments); else setError(res.error || 'Failed to load'); };
  const loadRefs = async () => { const s = await getStudents(token); if (s.students) setStudents(s.students); const c = await getClasses(token); if (c.classes) setClasses(c.classes); };
  useEffect(()=>{ load(); loadRefs(); }, []);

  const handleSubmit = async (e) => { e.preventDefault(); const res = await createEnrollment(token, form); if (res.enrollment) { setForm({ studentId: '', classId: '' }); load(); setError(''); } else setError(res.error || 'Create failed'); };
  const handleDelete = async (id) => { await deleteEnrollment(token, id); load(); };

  const handleEditOpen = (item) => { setEditForm({ id: item.id, studentId: item.studentId || '', classId: item.classId || '' }); setEditOpen(true); };
  const handleEditClose = () => { setEditOpen(false); setEditForm(null); };
  const handleUpdate = async (e) => { if (e && e.preventDefault) e.preventDefault(); const payload = { ...editForm }; const res = await updateEnrollment(token, editForm.id, payload); if (res && res.enrollment) { handleEditClose(); load(); setError(''); } else setError(res.error || 'Update failed'); };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Enrollments</Typography>
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
          <Button type="submit" variant="contained" sx={{ mt:1 }}>Enroll</Button>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Student ID</TableCell>
              <TableCell>Class ID</TableCell>
              <TableCell>Enrolled At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(i=> (
              <TableRow key={i.id}>
                <TableCell>{i.id}</TableCell>
                <TableCell>{i.studentId}</TableCell>
                <TableCell>{i.classId}</TableCell>
                <TableCell>{new Date(i.enrolledAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Button onClick={()=>handleEditOpen(i)} sx={{ mr:1 }}>Edit</Button>
                  <Button color="error" onClick={()=>handleDelete(i.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editOpen} onClose={handleEditClose} fullWidth>
        <DialogTitle>Edit Enrollment</DialogTitle>
        <DialogContent>
          {editForm && (
            <Box component="form" onSubmit={handleUpdate} sx={{ mt:1 }}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Student</InputLabel>
                <Select value={editForm.studentId} label="Student" onChange={e=>setEditForm({...editForm, studentId:e.target.value})}>
                  {students.map(s=> <MenuItem key={s.id} value={s.id}>{s.name} ({s.rollNumber||s.id})</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Class</InputLabel>
                <Select value={editForm.classId} label="Class" onChange={e=>setEditForm({...editForm, classId:e.target.value})}>
                  {classes.map(c=> <MenuItem key={c.id} value={c.id}>{c.name} ({c.grade}{c.section?'-'+c.section:''})</MenuItem>)}
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
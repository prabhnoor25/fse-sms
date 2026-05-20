import React, { useEffect, useState } from 'react';
import { getStudents, createStudent, deleteStudent, updateStudent } from './api';
import { Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

export default function Students({ token, user }) {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ rollNumber: '', name: '', class: '', section: '', email: '', guardianName: '', phone: '', password: '' });
  const [error, setError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const handleEditOpen = (student) => {
    setEditForm({
      id: student.id,
      rollNumber: student.rollNumber || '',
      name: student.name || '',
      class: student.class || '',
      section: student.section || '',
      email: student.email || '',
      guardianName: student.guardianName || '',
      phone: student.phone || '',
      password: ''
    });
    setEditOpen(true);
  };

  const handleEditClose = () => { setEditOpen(false); setEditForm(null); };

  const handleUpdate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const payload = { ...editForm };
    const res = await updateStudent(token, editForm.id, payload);
    if (res && res.student) { handleEditClose(); load(); setError(''); } else setError(res.error || 'Update failed');
  };

  const load = async () => {
    const res = await getStudents(token);
    if (res.students) setStudents(res.students);
    else setError(res.error || 'Failed to load');
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createStudent(token, form);
    if (res.student) { setForm({ rollNumber: '', name: '', class: '', section: '', email: '', guardianName: '', phone: '', password: '' }); load(); setError(''); }
    else setError(res.error || 'Create failed');
  };

  const handleDelete = async (id) => {
    await deleteStudent(token, id);
    load();
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Students</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {user && user.role === 'admin' && (
      <Paper sx={{ p:2, mb:2 }}>
        <form onSubmit={handleSubmit}>
          <TextField label="Roll Number" value={form.rollNumber} onChange={e=>setForm({...form, rollNumber:e.target.value})} fullWidth margin="dense" />
          <TextField label="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} fullWidth margin="dense" />
          <TextField label="Class" value={form.class} onChange={e=>setForm({...form, class:e.target.value})} fullWidth margin="dense" />
          <TextField label="Section" value={form.section} onChange={e=>setForm({...form, section:e.target.value})} fullWidth margin="dense" />
          <TextField label="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} fullWidth margin="dense" />
          <TextField label="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} fullWidth margin="dense" />
          <TextField label="Guardian" value={form.guardianName} onChange={e=>setForm({...form, guardianName:e.target.value})} fullWidth margin="dense" />
          <TextField label="Phone" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} fullWidth margin="dense" />
          <Button type="submit" variant="contained" sx={{ mt:1 }}>Add Student</Button>
        </form>
      </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Roll</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Guardian</TableCell>
              <TableCell>Phone</TableCell>
              {user && user.role === 'admin' && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map(s=> (
              <TableRow key={s.id}>
                <TableCell>{s.id}</TableCell>
                <TableCell>{s.rollNumber}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.class}</TableCell>
                <TableCell>{s.section}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell>{s.guardianName}</TableCell>
                <TableCell>{s.phone}</TableCell>
                <TableCell>
                  {user && user.role === 'admin' ? (
                    <>
                      <Button onClick={()=>handleEditOpen(s)} sx={{ mr:1 }}>Edit</Button>
                      <Button color="error" onClick={()=>handleDelete(s.id)}>Delete</Button>
                    </>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editOpen} onClose={handleEditClose} fullWidth>
        <DialogTitle>Edit Student</DialogTitle>
        <DialogContent>
          {editForm && (
            <Box component="form" onSubmit={handleUpdate} sx={{ mt:1 }}>
              <TextField label="Roll Number" value={editForm.rollNumber} onChange={e=>setEditForm({...editForm, rollNumber:e.target.value})} fullWidth margin="dense" />
              <TextField label="Name" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} fullWidth margin="dense" />
              <TextField label="Class" value={editForm.class} onChange={e=>setEditForm({...editForm, class:e.target.value})} fullWidth margin="dense" />
              <TextField label="Section" value={editForm.section} onChange={e=>setEditForm({...editForm, section:e.target.value})} fullWidth margin="dense" />
              <TextField label="Email" value={editForm.email} onChange={e=>setEditForm({...editForm, email:e.target.value})} fullWidth margin="dense" />
              <TextField label="Password (leave blank to keep)" value={editForm.password || ''} type="password" onChange={e=>setEditForm({...editForm, password:e.target.value})} fullWidth margin="dense" />
              <TextField label="Guardian" value={editForm.guardianName} onChange={e=>setEditForm({...editForm, guardianName:e.target.value})} fullWidth margin="dense" />
              <TextField label="Phone" value={editForm.phone} onChange={e=>setEditForm({...editForm, phone:e.target.value})} fullWidth margin="dense" />
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
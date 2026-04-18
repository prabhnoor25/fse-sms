import React, { useEffect, useState } from 'react';
import { getClasses, createClass, deleteClass, updateClass } from './api';
import { Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

export default function Classes({ token }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', grade: '', section: '', teacherId: '' });
  const [error, setError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const load = async () => { const res = await getClasses(token); if (res.classes) setItems(res.classes); else setError(res.error || 'Failed to load'); };
  useEffect(()=>{ load(); }, []);

  const handleSubmit = async (e) => { e.preventDefault(); const res = await createClass(token, form); if (res.class) { setForm({ name: '', grade: '', section: '', teacherId: '' }); load(); setError(''); } else setError(res.error || 'Create failed'); };
  const handleDelete = async (id) => { await deleteClass(token, id); load(); };

  const handleEditOpen = (item) => { setEditForm({ id: item.id, name: item.name || '', grade: item.grade || '', section: item.section || '', teacherId: item.teacherId || '' }); setEditOpen(true); };
  const handleEditClose = () => { setEditOpen(false); setEditForm(null); };
  const handleUpdate = async (e) => { if (e && e.preventDefault) e.preventDefault(); const payload = { ...editForm }; const res = await updateClass(token, editForm.id, payload); if (res && res.class) { handleEditClose(); load(); setError(''); } else setError(res.error || 'Update failed'); };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Classes</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper sx={{ p:2, mb:2 }}>
        <form onSubmit={handleSubmit}>
          <TextField label="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} fullWidth margin="dense" />
          <TextField label="Grade" value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})} fullWidth margin="dense" />
          <TextField label="Section" value={form.section} onChange={e=>setForm({...form, section:e.target.value})} fullWidth margin="dense" />
          <TextField label="Teacher ID" value={form.teacherId} onChange={e=>setForm({...form, teacherId:e.target.value})} fullWidth margin="dense" />
          <Button type="submit" variant="contained" sx={{ mt:1 }}>Add Class</Button>
        </form>
      </Paper>

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
                <TableCell>{i.teacherId}</TableCell>
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
        <DialogTitle>Edit Class</DialogTitle>
        <DialogContent>
          {editForm && (
            <Box component="form" onSubmit={handleUpdate} sx={{ mt:1 }}>
              <TextField label="Name" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} fullWidth margin="dense" />
              <TextField label="Grade" value={editForm.grade} onChange={e=>setEditForm({...editForm, grade:e.target.value})} fullWidth margin="dense" />
              <TextField label="Section" value={editForm.section} onChange={e=>setEditForm({...editForm, section:e.target.value})} fullWidth margin="dense" />
              <TextField label="Teacher ID" value={editForm.teacherId} onChange={e=>setEditForm({...editForm, teacherId:e.target.value})} fullWidth margin="dense" />
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
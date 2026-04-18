import React, { useEffect, useState } from 'react';
import { getSubjects, createSubject, deleteSubject, updateSubject, getClasses } from './api';
import { Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export default function Subjects({ token }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', description: '', classId: '' });
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const load = async () => { const res = await getSubjects(token); if (res.subjects) setItems(res.subjects); else setError(res.error || 'Failed to load'); };
  const loadRefs = async () => { const c = await getClasses(token); if (c.classes) setClasses(c.classes); };
  useEffect(()=>{ load(); loadRefs(); }, [token]);

  const handleSubmit = async (e) => { e.preventDefault(); const res = await createSubject(token, form); if (res.subject) { setForm({ code: '', name: '', description: '', classId: '' }); load(); setError(''); } else setError(res.error || 'Create failed'); };
  const handleDelete = async (id) => { await deleteSubject(token, id); load(); };

  const handleEditOpen = (item) => {
    setEditForm({ id: item.id, code: item.code || '', name: item.name || '', description: item.description || '', classId: item.classId || '' });
    setEditOpen(true);
  };
  const handleEditClose = () => { setEditOpen(false); setEditForm(null); };
  const handleUpdate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const payload = { ...editForm };
    const res = await updateSubject(token, editForm.id, payload);
    if (res && res.subject) { handleEditClose(); load(); setError(''); } else setError(res.error || 'Update failed');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Subjects</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper sx={{ p:2, mb:2 }}>
        <form onSubmit={handleSubmit}>
          <TextField label="Code" value={form.code} onChange={e=>setForm({...form, code:e.target.value})} fullWidth margin="dense" />
          <TextField label="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} fullWidth margin="dense" />
          <TextField label="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} fullWidth margin="dense" />
          <FormControl fullWidth margin="dense">
            <InputLabel>Class</InputLabel>
            <Select value={form.classId} label="Class" onChange={e=>setForm({...form, classId:e.target.value})}>
              {classes.map(c=> <MenuItem key={c.id} value={c.id}>{c.name} ({c.grade}{c.section?'-'+c.section:''})</MenuItem>)}
            </Select>
          </FormControl>
          <Button type="submit" variant="contained" sx={{ mt:1 }}>Add Subject</Button>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Class ID</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(i=> (
              <TableRow key={i.id}>
                <TableCell>{i.id}</TableCell>
                <TableCell>{i.code}</TableCell>
                <TableCell>{i.name}</TableCell>
                <TableCell>{i.description}</TableCell>
                <TableCell>{classes.find(c=>String(c.id)===String(i.classId)) ? classes.find(c=>String(c.id)===String(i.classId)).name : i.classId}</TableCell>
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
        <DialogTitle>Edit Subject</DialogTitle>
        <DialogContent>
          {editForm && (
            <Box component="form" onSubmit={handleUpdate} sx={{ mt:1 }}>
              <TextField label="Code" value={editForm.code} onChange={e=>setEditForm({...editForm, code:e.target.value})} fullWidth margin="dense" />
              <TextField label="Name" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} fullWidth margin="dense" />
              <TextField label="Description" value={editForm.description} onChange={e=>setEditForm({...editForm, description:e.target.value})} fullWidth margin="dense" />
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
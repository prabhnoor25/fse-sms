import React, { useEffect, useState } from 'react';
import { getTeachers, createTeacher, deleteTeacher, getSubjects, updateTeacher } from './api';
import { Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Alert, FormControl, InputLabel, Select, MenuItem, OutlinedInput, Checkbox, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

export default function Teachers({ token, user }) {
  const [teachers, setTeachers] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [form, setForm] = useState({ employeeId: '', name: '', email: '', phone: '', subjects: [], password: '' });
  const [error, setError] = useState('');
  const load = async () => { const res = await getTeachers(token); if (res.teachers) setTeachers(res.teachers); else setError(res.error || 'Failed to load'); };
  useEffect(()=>{
    load();
    (async ()=>{
      try {
        const s = await getSubjects(token);
        if (s.subjects) setSubjectsList(s.subjects);
      } catch (e) {}
    })();
  }, [token]);

  // helper that supports subjects from API as array of names or CSV of ids
  const renderSubjects = (tSubjects) => {
    if (!tSubjects) return '';
    if (Array.isArray(tSubjects)) return tSubjects.join(', ');
    return renderTeacherSubjects(tSubjects);
  };

  const handleSubmit = async (e) => { e.preventDefault(); const payload = { ...form, subjects: Array.isArray(form.subjects) ? form.subjects.join(',') : form.subjects }; const res = await createTeacher(token, payload); if (res.teacher) { setForm({ employeeId: '', name: '', email: '', phone: '', subjects: [], password: '' }); load(); setError(''); } else setError(res.error || 'Create failed'); };
  const handleDelete = async (id) => { await deleteTeacher(token, id); load(); };

  const renderTeacherSubjects = (tSubjects) => {
    if (!tSubjects) return '';
    const parts = String(tSubjects).split(',').map(p=>p.trim()).filter(Boolean);
    if (parts.length === 0) return '';
    const names = parts.map(pt => {
      const found = subjectsList.find(s => String(s.id) === String(pt));
      return found ? found.name : pt;
    });
    return names.join(', ');
  };

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const handleEditOpen = (teacher) => {
    setEditForm({
      id: teacher.id,
      employeeId: teacher.employeeId || '',
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      subjects: teacher.subjects ? String(teacher.subjects).split(',').map(s=>s.trim()) : [],
      password: ''
    });
    setEditOpen(true);
  };

  const handleEditClose = () => { setEditOpen(false); setEditForm(null); };

  const handleUpdate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const payload = { ...editForm, subjects: Array.isArray(editForm.subjects) ? editForm.subjects.join(',') : editForm.subjects };
    const res = await updateTeacher(token, editForm.id, payload);
    if (res && res.teacher) { handleEditClose(); load(); setError(''); } else setError((res && res.error) || 'Update failed');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Teachers</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {(!user || user.role !== 'student') && (
      <Paper sx={{ p:2, mb:2 }}>
        <form onSubmit={handleSubmit}>
          <TextField label="Employee ID" value={form.employeeId} onChange={e=>setForm({...form, employeeId:e.target.value})} fullWidth margin="dense" />
          <TextField label="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} fullWidth margin="dense" />
          <TextField label="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} fullWidth margin="dense" />
          <TextField label="Phone" value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} fullWidth margin="dense" />
          <TextField label="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} fullWidth margin="dense" />
          <FormControl fullWidth margin="dense">
            <InputLabel id="subjects-label">Subjects</InputLabel>
            <Select labelId="subjects-label" multiple value={form.subjects} onChange={e=>setForm({...form, subjects: e.target.value })} input={<OutlinedInput label="Subjects" />} renderValue={(selected)=>{
              const sel = Array.isArray(selected) ? selected : [];
              return sel.map(id => {
                const s = subjectsList.find(x => String(x.id) === String(id));
                return s ? s.name : id;
              }).join(', ');
            }}>
              {subjectsList.map(s=>(
                <MenuItem key={s.id} value={s.id}>
                  <Checkbox checked={form.subjects.indexOf(s.id) > -1} />
                  <ListItemText primary={s.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button type="submit" variant="contained" sx={{ mt:1 }}>Add Teacher</Button>
        </form>
      </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Emp ID</TableCell>
              <TableCell>Name</TableCell>
              {user && user.role === 'student' ? <TableCell>Class(es)</TableCell> : <TableCell>Email</TableCell>}
              <TableCell>Phone</TableCell>
              <TableCell>Subjects</TableCell>
              {(!user || user.role !== 'student') && <TableCell>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.map(t=> (
              <TableRow key={t.id}>
                <TableCell>{t.id}</TableCell>
                <TableCell>{t.employeeId}</TableCell>
                <TableCell>{t.name}</TableCell>
                {user && user.role === 'student' ? (
                  <>
                    <TableCell>{(t.classes || []).join(', ')}</TableCell>
                    <TableCell>{renderSubjects(t.subjects)}</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{t.email}</TableCell>
                    <TableCell>{t.phone}</TableCell>
                    <TableCell>{renderSubjects(t.subjects)}</TableCell>
                    <TableCell>
                      <Button onClick={()=>handleEditOpen(t)} sx={{ mr:1 }}>Edit</Button>
                      <Button color="error" onClick={()=>handleDelete(t.id)}>Delete</Button>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editOpen} onClose={handleEditClose} fullWidth>
        <DialogTitle>Edit Teacher</DialogTitle>
        <DialogContent>
          {editForm && (
            <Box component="form" onSubmit={handleUpdate} sx={{ mt:1 }}>
              <TextField label="Employee ID" value={editForm.employeeId} onChange={e=>setEditForm({...editForm, employeeId:e.target.value})} fullWidth margin="dense" />
              <TextField label="Name" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} fullWidth margin="dense" />
              <TextField label="Email" value={editForm.email} onChange={e=>setEditForm({...editForm, email:e.target.value})} fullWidth margin="dense" />
              <TextField label="Phone" value={editForm.phone} onChange={e=>setEditForm({...editForm, phone:e.target.value})} fullWidth margin="dense" />
              <FormControl fullWidth margin="dense">
                <InputLabel id="edit-subjects-label">Subjects</InputLabel>
                <Select labelId="edit-subjects-label" multiple value={editForm.subjects || []} onChange={e=>setEditForm({...editForm, subjects: e.target.value })} input={<OutlinedInput label="Subjects" />} renderValue={(selected)=>{
                  const sel = Array.isArray(selected) ? selected : [];
                  return sel.map(id => {
                    const s = subjectsList.find(x => String(x.id) === String(id));
                    return s ? s.name : id;
                  }).join(', ');
                }}>
                  {subjectsList.map(s=>(
                    <MenuItem key={s.id} value={s.id}>
                      <Checkbox checked={(editForm.subjects || []).indexOf(s.id) > -1} />
                      <ListItemText primary={s.name} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField label="Password (leave blank to keep)" value={editForm.password || ''} type="password" onChange={e=>setEditForm({...editForm, password:e.target.value})} fullWidth margin="dense" />
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
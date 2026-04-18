import React, { useEffect, useState } from 'react';
import { getAssignments, createAssignment, deleteAssignment, updateAssignment, getClasses, getSubjects, getTeachers } from './api';
import { Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

export default function Assignments({ token }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', classId: '', subjectId: '', teacherId: '' });
  const [error, setError] = useState('');

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const load = async () => { const res = await getAssignments(token); if (res.assignments) setItems(res.assignments); else setError(res.error || 'Failed to load'); };
  useEffect(()=>{ load(); (async ()=>{ try{ const c = await getClasses(token); if (c.classes) setClasses(c.classes); const s = await getSubjects(token); if (s.subjects) setSubjects(s.subjects); const t = await getTeachers(token); if (t.teachers) setTeachers(t.teachers); }catch(e){} })(); }, [token]);

  const handleSubmit = async (e) => { e.preventDefault(); const res = await createAssignment(token, form); if (res.assignment) { setForm({ title: '', description: '', dueDate: '', classId: '', subjectId: '', teacherId: '' }); load(); setError(''); } else setError(res.error || 'Create failed'); };
  const handleDelete = async (id) => { await deleteAssignment(token, id); load(); };

  const handleEditOpen = (item) => { setEditForm({ id: item.id, title: item.title || '', description: item.description || '', dueDate: item.dueDate || '', classId: item.classId || '', subjectId: item.subjectId || '', teacherId: item.teacherId || '' }); setEditOpen(true); };
  const handleEditClose = () => { setEditOpen(false); setEditForm(null); };
  const handleUpdate = async (e) => { if (e && e.preventDefault) e.preventDefault(); const payload = { ...editForm }; const res = await updateAssignment(token, editForm.id, payload); if (res && res.assignment) { handleEditClose(); load(); setError(''); } else setError(res.error || 'Update failed'); };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Assignments</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper sx={{ p:2, mb:2 }}>
        <form onSubmit={handleSubmit}>
          <TextField label="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} fullWidth margin="dense" />
          <TextField label="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} fullWidth margin="dense" />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Due Date"
              value={form.dueDate ? dayjs(form.dueDate) : null}
              onChange={(newValue)=>setForm({...form, dueDate: newValue ? newValue.format('YYYY-MM-DD') : ''})}
              renderInput={(params)=><TextField {...params} fullWidth margin="dense" />}
            />
          </LocalizationProvider>
          <FormControl fullWidth margin="dense">
            <InputLabel>Class</InputLabel>
            <Select value={form.classId} label="Class" onChange={e=>setForm({...form, classId:e.target.value})}>
              {classes.map(c=> <MenuItem key={c.id} value={c.id}>{c.name} ({c.grade}{c.section?'-'+c.section:''})</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Subject</InputLabel>
            <Select value={form.subjectId} label="Subject" onChange={e=>setForm({...form, subjectId:e.target.value})}>
              {subjects.map(s=> <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Teacher</InputLabel>
            <Select value={form.teacherId} label="Teacher" onChange={e=>setForm({...form, teacherId:e.target.value})}>
              {teachers.map(t=> <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button type="submit" variant="contained" sx={{ mt:1 }}>Add Assignment</Button>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Due</TableCell>
              <TableCell>Class ID</TableCell>
              <TableCell>Subject ID</TableCell>
              <TableCell>Teacher ID</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map(i=> (
              <TableRow key={i.id}>
                <TableCell>{i.id}</TableCell>
                <TableCell>{i.title}</TableCell>
                <TableCell>{i.dueDate ? new Date(i.dueDate).toLocaleString() : ''}</TableCell>
                <TableCell>{classes.find(c=>String(c.id)===String(i.classId)) ? classes.find(c=>String(c.id)===String(i.classId)).name : i.classId}</TableCell>
                <TableCell>{subjects.find(s=>String(s.id)===String(i.subjectId)) ? subjects.find(s=>String(s.id)===String(i.subjectId)).name : i.subjectId}</TableCell>
                <TableCell>{teachers.find(t=>String(t.id)===String(i.teacherId)) ? teachers.find(t=>String(t.id)===String(i.teacherId)).name : i.teacherId}</TableCell>
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
        <DialogTitle>Edit Assignment</DialogTitle>
        <DialogContent>
          {editForm && (
            <Box component="form" onSubmit={handleUpdate} sx={{ mt:1 }}>
              <TextField label="Title" value={editForm.title} onChange={e=>setEditForm({...editForm, title:e.target.value})} fullWidth margin="dense" />
              <TextField label="Description" value={editForm.description} onChange={e=>setEditForm({...editForm, description:e.target.value})} fullWidth margin="dense" />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Due Date"
                  value={editForm.dueDate ? dayjs(editForm.dueDate) : null}
                  onChange={(newValue)=>setEditForm({...editForm, dueDate: newValue ? newValue.format('YYYY-MM-DD') : ''})}
                  renderInput={(params)=><TextField {...params} fullWidth margin="dense" />}
                />
              </LocalizationProvider>
              <FormControl fullWidth margin="dense">
                <InputLabel>Class</InputLabel>
                <Select value={editForm.classId} label="Class" onChange={e=>setEditForm({...editForm, classId:e.target.value})}>
                  {classes.map(c=> <MenuItem key={c.id} value={c.id}>{c.name} ({c.grade}{c.section?'-'+c.section:''})</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Subject</InputLabel>
                <Select value={editForm.subjectId} label="Subject" onChange={e=>setEditForm({...editForm, subjectId:e.target.value})}>
                  {subjects.map(s=> <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Teacher</InputLabel>
                <Select value={editForm.teacherId} label="Teacher" onChange={e=>setEditForm({...editForm, teacherId:e.target.value})}>
                  {teachers.map(t=> <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
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
import React, { useEffect, useState, useMemo } from 'react';
import { getSubjects, createSubject, deleteSubject, updateSubject, getClasses, getEnrollments, getStudents } from './api';
import { Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Grid } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Subjects({ token, user }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', description: '', classId: '' });
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const load = async () => { const res = await getSubjects(token); if (res.subjects) setItems(res.subjects); else setError(res.error || 'Failed to load'); };
  const loadRefs = async () => { const c = await getClasses(token); if (c.classes) setClasses(c.classes); };
  useEffect(()=>{ load(); loadRefs(); }, [token]);

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
          const subRes = await getSubjects(token);
          const mySubjects = (subRes.subjects || []).filter(s => classIds.includes(String(s.classId)));
          setItems(mySubjects);
          const classesAll = (await getClasses(token)).classes || [];
          setClasses(classesAll.filter(c => classIds.includes(String(c.id))));
        } catch (err) {
          // ignore, keep full list if any step fails
        }
      })();
    }
  }, [user, token]);

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

  const chartData = useMemo(() => {
    if (!items || items.length === 0) return [];
    const map = {};
    items.forEach(s => { const cid = s.classId || 'Unassigned'; map[cid] = (map[cid] || 0) + 1; });
    return Object.keys(map).map(cid => ({ className: (classes.find(c=>String(c.id)===String(cid))?.name) || cid, count: map[cid] }));
  }, [items, classes]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Subjects</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {user && user.role !== 'student' && (
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
      )}

      <Grid container spacing={2} sx={{ mb:2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:2, height: 300 }}>
            <Typography variant="h6">Subjects per Class</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="className" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#82ca9d" />
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
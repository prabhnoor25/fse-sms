import React, { useEffect, useState } from 'react';
import { getAssignments, createAssignment, deleteAssignment, updateAssignment, getClasses, getSubjects, getTeachers, getQuestions, createQuestion, submitAssignment, getSubmissions, getAssignmentStats } from './api';
import { Paper, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Box, Alert, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, List, ListItem } from '@mui/material';
import dayjs from 'dayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

export default function Assignments({ token, user }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', classId: '', subjectId: '', teacherId: '' });
  const [error, setError] = useState('');
  const [qOpen, setQOpen] = useState(false);
  const [qAssignment, setQAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', ''], correctOption: 0, points: 1 });
  const [attemptOpen, setAttemptOpen] = useState(false);
  const [attemptAnswers, setAttemptAnswers] = useState({});
  const [subsOpen, setSubsOpen] = useState(false);
  const [stats, setStats] = useState(null);

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

  const openQuestions = async (assignment) => { setQAssignment(assignment); setQOpen(true); const res = await getQuestions(token, assignment.id); if (res.questions) setQuestions(res.questions); };
  const addQuestion = async () => { const res = await createQuestion(token, qAssignment.id, { text: newQuestion.text, options: newQuestion.options, correctOption: newQuestion.correctOption, points: newQuestion.points }); if (res.question) { setNewQuestion({ text:'', options:['',''], correctOption:0, points:1 }); const res2 = await getQuestions(token, qAssignment.id); if (res2.questions) setQuestions(res2.questions); } else setError(res.error || 'Question create failed'); };

  const openAttempt = async (assignment) => { setQAssignment(assignment); setAttemptOpen(true); const res = await getQuestions(token, assignment.id); if (res.questions) setQuestions(res.questions); setAttemptAnswers({}); };
  const submitAttempt = async () => { // build answers array
    const answers = Object.keys(attemptAnswers).map(qid => ({ questionId: Number(qid), selectedOption: attemptAnswers[qid] }));
    const res = await submitAssignment(token, qAssignment.id, answers);
    if (res.submission) { setAttemptOpen(false); load(); alert('Submitted. Score: '+res.score); } else setError(res.error || 'Submit failed');
  };

  const openSubs = async (assignment) => { setQAssignment(assignment); const res = await getAssignmentStats(token, assignment.id); if (res) setStats(res); setSubsOpen(true); };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Assignments</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {(user && (user.role === 'admin' || user.role === 'teacher')) ? (
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
      ) : null}

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
                  {user && (user.role === 'admin' || user.role === 'teacher') && (
                    <>
                      <Button onClick={()=>openQuestions(i)} sx={{ mr:1 }}>Questions</Button>
                      <Button onClick={()=>openSubs(i)} sx={{ mr:1 }}>View Submissions</Button>
                      <Button onClick={()=>handleEditOpen(i)} sx={{ mr:1 }}>Edit</Button>
                      <Button color="error" onClick={()=>handleDelete(i.id)}>Delete</Button>
                    </>
                  )}
                  {user && user.role === 'student' && (
                    <>
                      <Button onClick={()=>openAttempt(i)} sx={{ mr:1 }}>Attempt</Button>
                    </>
                  )}
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

      {/* Questions dialog */}
      <Dialog open={qOpen} onClose={()=>setQOpen(false)} fullWidth>
        <DialogTitle>Questions for: {qAssignment ? qAssignment.title : ''}</DialogTitle>
        <DialogContent>
          {questions.map(q => (
            <Box key={q.id} sx={{ mb:2 }}>
              <Typography variant="subtitle1">{q.text}</Typography>
              <List>
                {(q.options||[]).map((o, idx) => <ListItem key={idx}>{o}{(q.correctOption===idx) ? ' (correct)' : ''}</ListItem>)}
              </List>
            </Box>
          ))}

          {(user && (user.role==='admin' || user.role==='teacher')) && (
            <Box sx={{ mt:2 }}>
              <TextField label="Question text" value={newQuestion.text} onChange={e=>setNewQuestion({...newQuestion, text:e.target.value})} fullWidth margin="dense" />
              <Typography variant="caption">Options</Typography>
              {newQuestion.options.map((opt, idx) => (
                <TextField key={idx} value={opt} onChange={e=>{ const opts = [...newQuestion.options]; opts[idx]=e.target.value; setNewQuestion({...newQuestion, options:opts}); }} fullWidth margin="dense" />
              ))}
              <Button onClick={()=>setNewQuestion({...newQuestion, options:[...newQuestion.options, '']})}>Add option</Button>
              <TextField label="Correct option index" value={newQuestion.correctOption} onChange={e=>setNewQuestion({...newQuestion, correctOption: Number(e.target.value) })} margin="dense" />
              <TextField label="Points" value={newQuestion.points} onChange={e=>setNewQuestion({...newQuestion, points: Number(e.target.value) })} margin="dense" />
              <Button variant="contained" onClick={addQuestion} sx={{ mt:1 }}>Add Question</Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setQOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Attempt dialog for students */}
      <Dialog open={attemptOpen} onClose={()=>setAttemptOpen(false)} fullWidth>
        <DialogTitle>Attempt: {qAssignment ? qAssignment.title : ''}</DialogTitle>
        <DialogContent>
          {questions.map(q => (
            <Box key={q.id} sx={{ mb:2 }}>
              <Typography variant="subtitle1">{q.text}</Typography>
              <FormControl component="fieldset">
                { (q.options||[]).map((o, idx) => (
                  <Button key={idx} onClick={()=>setAttemptAnswers({...attemptAnswers, [q.id]: idx})} sx={{ display:'block', textAlign:'left', mb:1 }} variant={attemptAnswers[q.id]===idx? 'contained' : 'outlined'}>{o}</Button>
                ))}
            </FormControl>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setAttemptOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitAttempt}>Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Submissions / stats dialog */}
      <Dialog open={subsOpen} onClose={()=>setSubsOpen(false)} fullWidth>
        <DialogTitle>Submissions: {qAssignment ? qAssignment.title : ''}</DialogTitle>
        <DialogContent>
          {stats && (
            <>
              <Typography variant="h6">Highest Over Time</Typography>
              <Box sx={{ width: '100%', height: 150 }}>
                {/* Simple SVG line chart */}
                <svg width="100%" height="150" viewBox="0 0 300 150">
                  {stats.highestOverTime && stats.highestOverTime.length > 0 && (() => {
                    const pts = stats.highestOverTime.map((p, i) => ({ x: (i/(stats.highestOverTime.length-1||1))*280+10, y: 140 - (p.highest/100)*120 }));
                    const path = pts.map((p,i)=> (i===0?`M ${p.x} ${p.y}`:`L ${p.x} ${p.y}`)).join(' ');
                    return (
                      <>
                        <path d={path} stroke="#1976d2" fill="none" strokeWidth="2" />
                        {pts.map((p,idx)=> <circle key={idx} cx={p.x} cy={p.y} r="3" fill="#1976d2" />)}
                      </>
                    );
                  })()}
                </svg>
              </Box>

              <Typography variant="h6" sx={{ mt:2 }}>Student Scores (best)</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.students && stats.students.map(s => (
                    <TableRow key={s.studentId}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.score}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setSubsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
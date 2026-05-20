import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { getTimetables, getTeachers } from './api';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
const TIMES = ['09:00','10:00','11:00','12:00','13:00','14:00'];

function normalizeTimetable(raw, teachersMap = {}) {
  const out = {};
  DAYS.forEach(d => {
    out[d] = [];
    if (!raw || !raw[d]) {
      out[d] = TIMES.map(t => ({ time: t, subject: '', className: '', teacher: '', teacherId: '' }));
      return;
    }
    if (Array.isArray(raw[d])) {
      out[d] = TIMES.map(t => {
        const found = raw[d].find(e => e.time === t);
        if (!found) return { time: t, subject: '', className: '', teacher: '', teacherId: '' };
        const teacherId = found.teacherId ?? found.teacher ?? '';
        const teacherName = teacherId ? (teachersMap[String(teacherId)] || String(teacherId)) : (found.teacher || '');
        return { time: t, subject: found.subject || '', className: found.className || '', teacher: teacherName, teacherId };
      });
    } else {
      out[d] = TIMES.map(t => {
        const e = raw[d][t];
        if (!e) return { time: t, subject: '', className: '', teacher: '', teacherId: '' };
        const teacherId = e.teacherId ?? e.teacher ?? '';
        const teacherName = teacherId ? (teachersMap[String(teacherId)] || String(teacherId)) : (e.teacher || '');
        return { time: t, subject: e.subject || '', className: e.className || '', teacher: teacherName, teacherId };
      });
    }
  });
  return out;
}

export default function MiuiCalendar({ user, token }) {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [teachersMap, setTeachersMap] = useState({});

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        const [tRes, thRes] = await Promise.all([
          getTimetables(token).catch(()=>({ timetables: [] })),
          getTeachers(token).catch(()=>({ teachers: [] }))
        ]);
        const teachers = thRes && thRes.teachers ? thRes.teachers : [];
        const tmap = {};
        teachers.forEach(t => {
          const name = t.name || t.employeeId || t.username || String(t.id);
          if (t.id !== undefined && t.id !== null) tmap[String(t.id)] = name;
          if (t.employeeId) tmap[String(t.employeeId)] = name;
          if (t.username) tmap[String(t.username)] = name;
          if (t.email) tmap[String(t.email)] = name;
          // also store canonical mapping for lookup by name
          if (t.name) tmap[String(t.name)] = name;
        });
        if (!mounted) return;
        setTeachersMap(tmap);

        const tts = tRes && tRes.timetables ? tRes.timetables : [];
        let chosen = null;
        // Prefer timetable that matches student's class
        if (user && user.role === 'student' && user.classId) {
          chosen = tts.find(tt => String(tt.forClassId) === String(user.classId));
        }
        // Prepare identifier set to match teacher: id, employeeId, username, name
        const userIdentifiers = user ? [String(user.id), String(user.employeeId || ''), String(user.username || ''), String(user.name || '')].filter(Boolean) : [];
        const matchesUser = (val) => userIdentifiers.includes(String(val));
        // For teachers, find a timetable that contains lessons for this teacher (match on multiple id forms)
        if (!chosen && user && user.role === 'teacher') {
          chosen = tts.find(tt => {
            if (!tt.data) return false;
            return DAYS.some(day => {
              const dayData = tt.data[day] || {};
              if (Array.isArray(dayData)) {
                return dayData.some(cell => matchesUser(cell.teacherId) || matchesUser(cell.teacher));
              } else {
                return TIMES.some(time => {
                  const c = dayData[time];
                  return c && (matchesUser(c.teacherId) || matchesUser(c.teacher));
                });
              }
            });
          });
        }
        if (!chosen && tts.length) chosen = tts[0];

        if (chosen) {
          setTimetable(normalizeTimetable(chosen.data || {}, tmap));
        } else {
          // No timetable found: show empty grid (no placeholder subjects)
          const empty = {};
          DAYS.forEach((d) => {
            empty[d] = TIMES.map((t) => ({ time: t, subject: '', className: '', teacher: '', teacherId: '' }));
          });
          setTimetable(empty);
        }
      } catch (e) {
        const empty = {};
        DAYS.forEach((d) => {
          empty[d] = TIMES.map((t) => ({ time: t, subject: '', className: '', teacher: '', teacherId: '' }));
        });
        if (!mounted) return;
        setTimetable(empty);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user, token]);

  if (loading) return (
    <Paper sx={{ p: 3, mt: 3, mx: 3 }}>
      <Typography>Loading timetable...</Typography>
    </Paper>
  );

  return (
    <Paper sx={{ p: 3, mt: 3, mx: 3, borderRadius: 2 }} elevation={3}>
      <Typography variant="h6" sx={{ mb: 2 }}>Timetable</Typography>
      <Table size="small" sx={{ tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 110 }}>Time</TableCell>
            {DAYS.map(d => <TableCell key={d} align="center">{d}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {TIMES.map(time => (
            <TableRow key={time}>
              <TableCell sx={{ fontWeight: 600 }}>{time}</TableCell>
              {DAYS.map(day => {
                const entries = (timetable && timetable[day]) || [];
                const cell = entries.find(e => e.time === time) || { subject: '', className: '', teacher: '', teacherId: '' };
                const isTeacher = user && user.role === 'teacher';
                const userIdentifiers = user ? [String(user.id), String(user.employeeId || ''), String(user.username || ''), String(user.name || '')].filter(Boolean) : [];
                const matchesUser = (val) => userIdentifiers.includes(String(val));
                const isMine = isTeacher && (matchesUser(cell.teacherId) || matchesUser(cell.teacher));
                return (
                  <TableCell key={day} align="center" sx={{ px:2, py:1 }}>
                    <Box sx={{
                      minHeight: 64,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5,
                      borderRadius: 1,
                      px:1,
                      py:0.5,
                      backgroundColor: isMine ? 'rgba(25,118,210,0.06)' : 'transparent',
                      border: isMine ? '1px solid rgba(25,118,210,0.18)' : '1px solid transparent',
                      opacity: (isTeacher && !isMine) ? 0.7 : 1
                    }}>
                      {cell && cell.subject ? (
                        <>
                          <Typography variant="body2" sx={{ textAlign: 'center', fontWeight: 600 }}>{cell.subject}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>{cell.className ? `${cell.className}` : ''}{cell.className && cell.teacher ? ' • ' : ''}{cell.teacher}</Typography>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary">---</Typography>
                      )}
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Timetable shown for your class (students) or highlighted for your lessons (teachers). Free = no class scheduled.
      </Typography>
    </Paper>
  );
}

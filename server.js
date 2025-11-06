const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let students = [];
let courses = [{ id: 1, name: 'Mathematics' }, { id: 2, name: 'English' }];
let grades = [];
let idCounter = 1;

app.get('/students', (req, res) => res.json(students));
app.post('/students', (req, res) => {
  const s = { id: idCounter++, created_at: new Date().toISOString(), ...req.body };
  students.push(s);
  res.status(201).json(s);
});
app.put('/students/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = students.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  students[idx] = { ...students[idx], ...req.body };
  res.json(students[idx]);
});
app.delete('/students/:id', (req, res) => {
  const id = Number(req.params.id);
  students = students.filter(x => x.id !== id);
  res.status(204).end();
});

app.get('/courses', (req, res) => res.json(courses));
app.post('/courses', (req, res) => {
  const c = { id: idCounter++, ...req.body };
  courses.push(c);
  res.status(201).json(c);
});
app.delete('/courses/:id', (req, res) => {
  const id = Number(req.params.id);
  courses = courses.filter(c => c.id !== id);
  res.status(204).end();
});

app.get('/grades', (req, res) => res.json(
  grades.map(g => ({ ...g, student_name: (students.find(s=>s.id===g.student_id)||{}).name }))
));
app.post('/grades', (req, res) => {
  const g = { id: idCounter++, created_at: new Date().toISOString(), ...req.body };
  grades.push(g);
  res.status(201).json(g);
});
app.put('/grades/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = grades.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  grades[idx] = { ...grades[idx], ...req.body };
  res.json(grades[idx]);
});
app.delete('/grades/:id', (req, res) => {
  const id = Number(req.params.id);
  grades = grades.filter(x => x.id !== id);
  res.status(204).end();
});

app.get('/grades/averages', (req, res) => {
  const studentAverages = students.map(s => {
    const sGrades = grades.filter(g => g.student_id === s.id).map(g => g.score);
    const avg = sGrades.length ? sGrades.reduce((a,b)=>a+b,0)/sGrades.length : 0;
    return { student: s.name, average_score: avg };
  });
  const courseMap = {};
  grades.forEach(g => {
    courseMap[g.course] = courseMap[g.course] || [];
    courseMap[g.course].push(g.score);
  });
  const courseAverages = Object.entries(courseMap).map(([course, arr]) => ({
    course,
    average_score: arr.reduce((a,b)=>a+b,0)/arr.length
  }));
  res.json({ studentAverages, courseAverages });
});

app.get('/grades/export', (req, res) => {
  const csv = ['student,course,score,created_at', ...grades.map(g => {
    const student = (students.find(s=>s.id===g.student_id)||{}).name || '';
    return `${JSON.stringify(student)},${JSON.stringify(g.course)},${g.score},${g.created_at}`;
  })].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="grades.csv"');
  res.send(csv);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));

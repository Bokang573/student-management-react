const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',        // change if you set a password in XAMPP
  database: 'student_mgmt',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

/* GET /courses */
app.get('/courses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name FROM courses ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

/* GET /students (joined course name) */
app.get('/students', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.name, s.email, s.created_at, c.id AS course_id, c.name AS course_name
       FROM students s
       LEFT JOIN courses c ON s.course_id = c.id
       ORDER BY s.id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

/* GET /grades */
app.get('/grades', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT g.id, g.student_id, s.name AS student_name, g.course_id, c.name AS course_name, g.score, g.created_at
       FROM grades g
       LEFT JOIN students s ON g.student_id = s.id
       LEFT JOIN courses c ON g.course_id = c.id
       ORDER BY g.id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

/* GET /grades/averages */
app.get('/grades/averages', async (req, res) => {
  try {
    const [studentAverages] = await pool.query(
      `SELECT s.id AS student, s.name AS student_name, AVG(g.score) AS average_score
       FROM students s
       LEFT JOIN grades g ON g.student_id = s.id
       GROUP BY s.id, s.name`
    );
    const [courseAverages] = await pool.query(
      `SELECT c.id AS course, c.name AS course_name, AVG(g.score) AS average_score
       FROM courses c
       LEFT JOIN grades g ON g.course_id = c.id
       GROUP BY c.id, c.name`
    );
    res.json({ studentAverages, courseAverages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

/* CSV export */
app.get('/grades/export', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.name AS student_name, c.name AS course_name, g.score, g.created_at
       FROM grades g
       LEFT JOIN students s ON g.student_id = s.id
       LEFT JOIN courses c ON g.course_id = c.id
       ORDER BY g.id`
    );
    const csv = ['student,course,score,created_at', ...rows.map(r =>
      `${JSON.stringify(r.student_name)},${JSON.stringify(r.course_name)},${r.score},${r.created_at}`
    )].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="grades.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send('Export error');
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`API server listening on http://localhost:${PORT}`));

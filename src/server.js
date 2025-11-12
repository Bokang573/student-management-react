import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_NAME = process.env.DB_NAME || 'student_mgmt';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

let pool = null;
let isDbSetup = false;

const memory = {
  students: [],
  courses: [],
  grades: [],
};

async function tryCreatePool() {
  if (!DB_HOST || !DB_USER) return false;
  try {
    pool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      port: DB_PORT,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 10000,
    });
    await pool.query('SELECT 1');
    console.log('✅ MySQL pool created and reachable');
    return true;
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.code || err.message || err);
    pool = null;
    return false;
  }
}

(async () => {
  isDbSetup = await tryCreatePool();
  if (!isDbSetup) console.log('⚠️ No DB connection — using in-memory store.');
})();

async function dbQuery(sql, params = []) {
  if (isDbSetup && pool) {
    const [rows] = await pool.query(sql, params);
    return rows;
  }
  throw new Error('DB not available');
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', usingDb: !!isDbSetup });
});

app.get('/students', async (req, res) => {
  try {
    if (isDbSetup) {
      const rows = await dbQuery('SELECT id, name, email, course_id, created_at FROM students ORDER BY id');
      return res.json(rows);
    }
    return res.json(memory.students);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
});

app.post('/students', async (req, res) => {
  const { name, email, course_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    if (isDbSetup) {
      const result = await dbQuery(
        'INSERT INTO students (name, email, course_id) VALUES (?, ?, ?)',
        [name, email || null, course_id || null]
      );
      const [row] = await dbQuery('SELECT * FROM students WHERE id = ?', [result.insertId]);
      return res.status(201).json(row);
    }
    const id = memory.students.length ? memory.students[memory.students.length - 1].id + 1 : 1;
    const newStudent = { id, name, email: email || null, course_id: course_id || null, created_at: new Date().toISOString() };
    memory.students.push(newStudent);
    return res.status(201).json(newStudent);
  } catch {
    return res.status(500).json({ error: 'Failed to create student' });
  }
});

app.put('/students/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, course_id } = req.body;
  try {
    if (isDbSetup) {
      await dbQuery('UPDATE students SET name=?, email=?, course_id=? WHERE id=?', [name, email, course_id, id]);
      const [updated] = await dbQuery('SELECT * FROM students WHERE id=?', [id]);
      return res.json(updated || {});
    }
    const index = memory.students.findIndex(s => s.id == id);
    if (index === -1) return res.status(404).json({ error: 'Student not found' });
    memory.students[index] = { ...memory.students[index], name, email, course_id };
    return res.json(memory.students[index]);
  } catch {
    return res.status(500).json({ error: 'Failed to update student' });
  }
});

app.delete('/students/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbSetup) {
      await dbQuery('DELETE FROM students WHERE id=?', [id]);
      return res.json({ message: 'Student deleted' });
    }
    memory.students = memory.students.filter(s => s.id != id);
    return res.json({ message: 'Student deleted (memory)' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete student' });
  }
});

app.get('/courses', async (req, res) => {
  try {
    if (isDbSetup) {
      const rows = await dbQuery('SELECT id, name FROM courses ORDER BY id');
      return res.json(rows);
    }
    return res.json(memory.courses);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

app.post('/courses', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    if (isDbSetup) {
      const result = await dbQuery('INSERT INTO courses (name) VALUES (?)', [name]);
      const [row] = await dbQuery('SELECT * FROM courses WHERE id = ?', [result.insertId]);
      return res.status(201).json(row);
    }
    const id = memory.courses.length ? memory.courses[memory.courses.length - 1].id + 1 : 1;
    const newCourse = { id, name };
    memory.courses.push(newCourse);
    return res.status(201).json(newCourse);
  } catch {
    return res.status(500).json({ error: 'Failed to create course' });
  }
});

app.put('/courses/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    if (isDbSetup) {
      await dbQuery('UPDATE courses SET name=? WHERE id=?', [name, id]);
      const [updated] = await dbQuery('SELECT * FROM courses WHERE id=?', [id]);
      return res.json(updated || {});
    }
    const index = memory.courses.findIndex(c => c.id == id);
    if (index === -1) return res.status(404).json({ error: 'Course not found' });
    memory.courses[index].name = name;
    return res.json(memory.courses[index]);
  } catch {
    return res.status(500).json({ error: 'Failed to update course' });
  }
});

app.delete('/courses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbSetup) {
      await dbQuery('DELETE FROM courses WHERE id=?', [id]);
      return res.json({ message: 'Course deleted' });
    }
    memory.courses = memory.courses.filter(c => c.id != id);
    return res.json({ message: 'Course deleted (memory)' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete course' });
  }
});

app.get('/grades', async (req, res) => {
  try {
    if (isDbSetup) {
      const rows = await dbQuery('SELECT id, student_id, course_id, score, created_at FROM grades ORDER BY id');
      return res.json(rows);
    }
    return res.json(memory.grades);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

app.post('/grades', async (req, res) => {
  const { student_id, course_id, score } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id is required' });
  try {
    if (isDbSetup) {
      const result = await dbQuery('INSERT INTO grades (student_id, course_id, score) VALUES (?, ?, ?)', [
        student_id,
        course_id || null,
        score || null,
      ]);
      const [row] = await dbQuery('SELECT * FROM grades WHERE id = ?', [result.insertId]);
      return res.status(201).json(row);
    }
    const id = memory.grades.length ? memory.grades[memory.grades.length - 1].id + 1 : 1;
    const newGrade = { id, student_id, course_id, score, created_at: new Date().toISOString() };
    memory.grades.push(newGrade);
    return res.status(201).json(newGrade);
  } catch {
    return res.status(500).json({ error: 'Failed to create grade' });
  }
});

app.put('/grades/:id', async (req, res) => {
  const { id } = req.params;
  const { student_id, course_id, score } = req.body;
  try {
    if (isDbSetup) {
      await dbQuery('UPDATE grades SET student_id=?, course_id=?, score=? WHERE id=?', [student_id, course_id, score, id]);
      const [updated] = await dbQuery('SELECT * FROM grades WHERE id=?', [id]);
      return res.json(updated || {});
    }
    const index = memory.grades.findIndex(g => g.id == id);
    if (index === -1) return res.status(404).json({ error: 'Grade not found' });
    memory.grades[index] = { ...memory.grades[index], student_id, course_id, score };
    return res.json(memory.grades[index]);
  } catch {
    return res.status(500).json({ error: 'Failed to update grade' });
  }
});

app.delete('/grades/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (isDbSetup) {
      await dbQuery('DELETE FROM grades WHERE id=?', [id]);
      return res.json({ message: 'Grade deleted' });
    }
    memory.grades = memory.grades.filter(g => g.id != id);
    return res.json({ message: 'Grade deleted (memory)' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete grade' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`Using DB: ${isDbSetup ? 'true' : 'false'}`);
});
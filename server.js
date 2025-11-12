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

// Enhanced connection function with detailed logging
async function tryCreatePool() {
  console.log('🔧 Attempting to create MySQL pool...');
  console.log('Connection details:', {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS ? '***' : '(empty)',
    database: DB_NAME,
    port: DB_PORT
  });
  
  if (!DB_HOST || !DB_USER) {
    console.log('❌ Missing DB_HOST or DB_USER');
    return false;
  }
  
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
      acquireTimeout: 10000,
      timeout: 10000,
    });

    console.log('✅ MySQL pool created, testing connection...');
    
    // Test the connection with a simple query
    const [result] = await pool.query('SELECT 1 as test');
    console.log('✅ Connection test successful:', result);
    
    // Test accessing the actual tables
    const [tables] = await pool.query('SHOW TABLES');
    console.log('✅ Tables accessible:', tables.map(t => Object.values(t)[0]));
    
    // Test each table
    for (const table of ['students', 'courses', 'grades']) {
      try {
        const [rows] = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table} table: ${rows[0].count} rows`);
      } catch (err) {
        console.log(`⚠️ ${table} table query failed: ${err.message}`);
      }
    }
    
    return true;
  } catch (err) {
    console.error('❌ MySQL pool creation failed:');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    
    // Try alternative connection method
    console.log('🔄 Trying alternative connection method...');
    try {
      const connection = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
        port: DB_PORT,
        database: DB_NAME,
      });
      
      console.log('✅ Alternative connection successful!');
      await connection.end();
      
      // Create pool again after successful connection
      pool = mysql.createPool({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASS,
        port: DB_PORT,
        database: DB_NAME,
      });
      
      return true;
    } catch (err2) {
      console.error('❌ Alternative connection also failed:', err2.message);
      pool = null;
      return false;
    }
  }
}

async function dbQuery(sql, params = []) {
  if (isDbSetup && pool) {
    try {
      const [rows] = await pool.query(sql, params);
      return rows;
    } catch (err) {
      console.error('Database query error:', err.message);
      throw new Error('Database query failed');
    }
  }
  throw new Error('DB not available');
}

// Initialize server with proper async handling
async function initializeServer() {
  console.log('🚀 Initializing server...');
  
  // Test database connection
  isDbSetup = await tryCreatePool();
  
  if (isDbSetup) {
    console.log('✅ Database connection established');
  } else {
    console.log('⚠️ Running in in-memory mode (no database)');
  }
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n🎉 API server running on http://localhost:${PORT}`);
    console.log(`📊 Using DB: ${isDbSetup}`);
    console.log(`💡 Endpoints available:`);
    console.log(`   GET  http://localhost:${PORT}/students`);
    console.log(`   POST http://localhost:${PORT}/students`);
    console.log(`   GET  http://localhost:${PORT}/courses`);
    console.log(`   POST http://localhost:${PORT}/courses`);
    console.log(`   GET  http://localhost:${PORT}/grades`);
    console.log(`   POST http://localhost:${PORT}/grades`);
  });
}

// Routes
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    usingDb: isDbSetup,
    endpoints: {
      students: '/students',
      courses: '/courses', 
      grades: '/grades'
    }
  });
});

app.get('/students', async (req, res) => {
  try {
    if (isDbSetup) {
      const rows = await dbQuery(`
        SELECT s.id, s.name, s.email, s.course_id, c.name as course_name, s.created_at 
        FROM students s 
        LEFT JOIN courses c ON s.course_id = c.id 
        ORDER BY s.id
      `);
      return res.json(rows);
    }
    return res.json(memory.students);
  } catch (err) {
    console.error('Error fetching students:', err);
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
      const [row] = await dbQuery(`
        SELECT s.*, c.name as course_name 
        FROM students s 
        LEFT JOIN courses c ON s.course_id = c.id 
        WHERE s.id = ?
      `, [result.insertId]);
      return res.status(201).json(row);
    }
    const id = memory.students.length ? memory.students[memory.students.length - 1].id + 1 : 1;
    const newStudent = { 
      id, 
      name, 
      email: email || null, 
      course_id: course_id || null, 
      created_at: new Date().toISOString() 
    };
    memory.students.push(newStudent);
    return res.status(201).json(newStudent);
  } catch (err) {
    console.error('Error creating student:', err);
    return res.status(500).json({ error: 'Failed to create student' });
  }
});

app.put('/students/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, course_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  
  try {
    if (isDbSetup) {
      await dbQuery(
        'UPDATE students SET name=?, email=?, course_id=? WHERE id=?', 
        [name, email || null, course_id || null, id]
      );
      const [updated] = await dbQuery(`
        SELECT s.*, c.name as course_name 
        FROM students s 
        LEFT JOIN courses c ON s.course_id = c.id 
        WHERE s.id=?
      `, [id]);
      return res.json(updated || {});
    }
    const index = memory.students.findIndex(s => s.id == id);
    if (index === -1) return res.status(404).json({ error: 'Student not found' });
    memory.students[index] = { ...memory.students[index], name, email, course_id };
    return res.json(memory.students[index]);
  } catch (err) {
    console.error('Error updating student:', err);
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
  } catch (err) {
    console.error('Error deleting student:', err);
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
  } catch (err) {
    console.error('Error fetching courses:', err);
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
  } catch (err) {
    console.error('Error creating course:', err);
    return res.status(500).json({ error: 'Failed to create course' });
  }
});

app.put('/courses/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  
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
  } catch (err) {
    console.error('Error updating course:', err);
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
  } catch (err) {
    console.error('Error deleting course:', err);
    return res.status(500).json({ error: 'Failed to delete course' });
  }
});

app.get('/grades', async (req, res) => {
  try {
    if (isDbSetup) {
      const rows = await dbQuery(`
        SELECT g.id, g.student_id, g.course_id, g.score, g.created_at,
               s.name as student_name, c.name as course_name
        FROM grades g
        LEFT JOIN students s ON g.student_id = s.id
        LEFT JOIN courses c ON g.course_id = c.id
        ORDER BY g.id
      `);
      return res.json(rows);
    }
    return res.json(memory.grades);
  } catch (err) {
    console.error('Error fetching grades:', err);
    return res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

app.post('/grades', async (req, res) => {
  const { student_id, course_id, score } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id is required' });
  try {
    if (isDbSetup) {
      const result = await dbQuery(
        'INSERT INTO grades (student_id, course_id, score) VALUES (?, ?, ?)', 
        [student_id, course_id || null, score || null]
      );
      const [row] = await dbQuery(`
        SELECT g.*, s.name as student_name, c.name as course_name
        FROM grades g
        LEFT JOIN students s ON g.student_id = s.id
        LEFT JOIN courses c ON g.course_id = c.id
        WHERE g.id = ?
      `, [result.insertId]);
      return res.status(201).json(row);
    }
    const id = memory.grades.length ? memory.grades[memory.grades.length - 1].id + 1 : 1;
    const newGrade = { 
      id, 
      student_id, 
      course_id, 
      score, 
      created_at: new Date().toISOString() 
    };
    memory.grades.push(newGrade);
    return res.status(201).json(newGrade);
  } catch (err) {
    console.error('Error creating grade:', err);
    return res.status(500).json({ error: 'Failed to create grade' });
  }
});

app.put('/grades/:id', async (req, res) => {
  const { id } = req.params;
  const { student_id, course_id, score } = req.body;
  if (!student_id) return res.status(400).json({ error: 'student_id is required' });
  
  try {
    if (isDbSetup) {
      await dbQuery(
        'UPDATE grades SET student_id=?, course_id=?, score=? WHERE id=?', 
        [student_id, course_id || null, score || null, id]
      );
      const [updated] = await dbQuery(`
        SELECT g.*, s.name as student_name, c.name as course_name
        FROM grades g
        LEFT JOIN students s ON g.student_id = s.id
        LEFT JOIN courses c ON g.course_id = c.id
        WHERE g.id=?
      `, [id]);
      return res.json(updated || {});
    }
    const index = memory.grades.findIndex(g => g.id == id);
    if (index === -1) return res.status(404).json({ error: 'Grade not found' });
    memory.grades[index] = { ...memory.grades[index], student_id, course_id, score };
    return res.json(memory.grades[index]);
  } catch (err) {
    console.error('Error updating grade:', err);
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
  } catch (err) {
    console.error('Error deleting grade:', err);
    return res.status(500).json({ error: 'Failed to delete grade' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Initialize the server
initializeServer().catch(err => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});

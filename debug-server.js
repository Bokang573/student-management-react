import mysql from 'mysql2/promise';

async function testConnection() {
  const config = {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'student_mgmt',
    port: 3306
  };

  console.log('Testing MySQL connection to student_mgmt database...');
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ MySQL connection successful!');
    
    // Test each table
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('✅ Tables found:', tables.map(t => Object.values(t)[0]));
    
    // Test query on each table
    for (const table of ['students', 'courses', 'grades']) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table}: ${rows[0].count} rows`);
      } catch (err) {
        console.log(`❌ ${table} query failed: ${err.message}`);
      }
    }
    
    await connection.end();
    return true;
  } catch (err) {
    console.error('❌ MySQL connection failed:');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    console.error('Full error:', err);
    return false;
  }
}

testConnection();

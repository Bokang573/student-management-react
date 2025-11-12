import React, { useEffect, useState } from 'react';
import {
  getStudents,
  getCourses,
  getGrades,
  getAverages,
  exportGrades
} from '../api';

import StudentForm from '../components/StudentForm';
import StudentTable from '../components/StudentTable';
import CourseForm from '../components/CourseForm';
import CourseTable from '../components/CourseTable';
import GradeForm from '../components/GradeForm';
import GradeTable from '../components/GradeTable';

export default function Home() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [averages, setAverages] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [s, c, g] = await Promise.all([getStudents(), getCourses(), getGrades()]);
      setStudents(s || []);
      setCourses(c || []);
      setGrades(g || []);
    } catch (err) {
      console.error('Refresh failed', err);
      alert('Failed to load data from backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, [refreshKey]);

  const loadAverages = async () => {
    try {
      const data = await getAverages();
      setAverages(data);
    } catch (err) {
      console.error('Load averages failed', err);
      alert('Failed to load averages');
    }
  };

  return (
    <div className="app" style={{ padding: 20, background: '#f5f5f5', color: '#222' }}>
      <header className="header">
        <h1>Student Management System</h1>
        <div className="actions" style={{ marginTop: 10 }}>
          <button onClick={() => exportGrades()}>Export Grades CSV</button>
          <button onClick={loadAverages}>Show Averages</button>
          <button onClick={refreshAll}>Refresh</button>
        </div>
      </header>

      <main style={{ marginTop: 20 }}>
        <section className="panel">
          <h2>Add / Edit Student</h2>
          <StudentForm
            selected={selectedStudent}
            clearSelected={() => setSelectedStudent(null)}
            refresh={triggerRefresh}
            courses={courses}
          />
        </section>

        <section className="panel">
          <h2>Students {loading ? ' (Loading...)' : ''}</h2>
          <StudentTable
            students={students}
            onEdit={s => setSelectedStudent(s)}
            refresh={triggerRefresh}
          />
        </section>

        <section className="panel">
          <h2>Courses</h2>
          <CourseForm refresh={triggerRefresh} />
          <CourseTable refreshTrigger={refreshKey} />
        </section>

        <section className="panel">
          <h2>Grades</h2>
          <GradeForm
            selected={selectedGrade}
            clearSelected={() => setSelectedGrade(null)}
            refresh={triggerRefresh}
          />
          <GradeTable
            refreshTrigger={refreshKey}
            onEdit={g => setSelectedGrade(g)}
          />
        </section>

        {averages && (
          <section className="panel">
            <h2>Average Scores</h2>
            <div>
              <strong>Student Averages</strong>
              {averages.studentAverages?.map(s => (
                <div key={s.student}>
                  {s.student}: {Number(s.average_score).toFixed(2)}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10 }}>
              <strong>Course Averages</strong>
              {averages.courseAverages?.map(c => (
                <div key={c.course}>
                  {c.course}: {Number(c.average_score).toFixed(2)}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer style={{ marginTop: 40 }}>
        <hr />
        <p>Local backend: http://localhost:3000</p>
      </footer>
    </div>
  );
}

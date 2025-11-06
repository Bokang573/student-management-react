import React, { useEffect, useState } from 'react';
import {
  getStudents,
  getCourses,
  getGrades,
  getAverages,
  exportGrades
} from '../services/api';

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
    <div className="app">
      <header className="header">
        <h1>Student Management</h1>
        <div className="actions">
          <button onClick={() => exportGrades()}>Export Grades CSV</button>
          <button onClick={loadAverages}>Show Averages</button>
        </div>
      </header>

      <main>
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
          <h2>Students {loading ? ' (loading...)' : ''}</h2>
          <StudentTable
            students={students}
            onEdit={(s) => setSelectedStudent(s)}
            refresh={triggerRefresh}
          />
        </section>

        <section className="panel">
          <h2>Courses</h2>
          <div className="small-note">Create new courses and view current list</div>
          <CourseForm refresh={triggerRefresh} />
          <CourseTable refreshTrigger={refreshKey} />
        </section>

        <section className="panel">
          <h2>Grades</h2>
          <div className="small-note">Add or edit grades and review all records</div>
          <GradeForm
            selected={selectedGrade}
            clearSelected={() => setSelectedGrade(null)}
            refresh={triggerRefresh}
          />
          <GradeTable
            refreshTrigger={refreshKey}
            onEdit={(g) => setSelectedGrade(g)}
          />
        </section>

        {averages && (
          <section className="panel">
            <h2>Averages</h2>

            <div>
              <strong>Student Averages</strong>
              {averages.studentAverages && averages.studentAverages.length === 0 && <div className="muted">No student averages</div>}
              {averages.studentAverages && averages.studentAverages.map(s => (
                <div key={s.student}><strong>{s.student}</strong>: {Number(s.average_score).toFixed(2)}</div>
              ))}
            </div>

            <div style={{ marginTop: 8 }}>
              <strong>Course Averages</strong>
              {averages.courseAverages && averages.courseAverages.length === 0 && <div className="muted">No course averages</div>}
              {averages.courseAverages && averages.courseAverages.map(c => (
                <div key={c.course}><strong>{c.course}</strong>: {Number(c.average_score).toFixed(2)}</div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">Local backend: http://localhost:3000</footer>
    </div>
  );
}
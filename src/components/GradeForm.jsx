import { useEffect, useState } from 'react';
import apiBase from '../api';

export default function GradeForm() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [studentId, setStudentId] = useState(''); // keep as string for the select control
  const [courseId, setCourseId] = useState('');
  const [score, setScore] = useState('');

  useEffect(() => {
    fetch(`${apiBase}/students`)
      .then(r => r.json())
      .then(data => {
        setStudents(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Failed to load students', err);
        setStudents([]);
      });

    fetch(`${apiBase}/courses`)
      .then(r => r.json())
      .then(data => {
        setCourses(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Failed to load courses', err);
        setCourses([]);
      });
  }, []);

  const handleAddGrade = async (e) => {
    e.preventDefault();
    if (!studentId || !courseId) {
      alert('Please select a student and a course.');
      return;
    }
    const payload = {
      student_id: Number(studentId),
      course_id: Number(courseId),
      score: Number(score)
    };
    try {
      const res = await fetch(`${apiBase}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Add grade failed');
      // optional: refresh grades list elsewhere in your app
      setStudentId('');
      setCourseId('');
      setScore('');
    } catch (err) {
      console.error(err);
      alert('Add grade failed');
    }
  };

  return (
    <form onSubmit={handleAddGrade}>
      <div>
        <label htmlFor="student">Student</label>
        <select
          id="student"
          value={studentId}
          onChange={e => setStudentId(e.target.value)}
        >
          <option value="">Select student</option>
          {students.map(s => (
            <option key={s.id} value={String(s.id)}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="course">Course</label>
        <select
          id="course"
          value={courseId}
          onChange={e => setCourseId(e.target.value)}
        >
          <option value="">Select course</option>
          {courses.map(c => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="score">Score</label>
        <input
          id="score"
          type="number"
          step="0.01"
          value={score}
          onChange={e => setScore(e.target.value)}
        />
      </div>

      <div>
        <button type="submit">Add Grade</button>
        <button
          type="button"
          onClick={() => {
            setStudentId('');
            setCourseId('');
            setScore('');
          }}
        >
          Clear
        </button>
      </div>
    </form>
  );
}
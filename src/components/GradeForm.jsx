import React, { useEffect, useState } from 'react';
import { addGrade, getStudents, getCourses, updateGrade } from '../services/api';

export default function GradeForm({ selected, clearSelected, refresh }) {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [gradeId, setGradeId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [courseName, setCourseName] = useState('');
  const [score, setScore] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [s, c] = await Promise.all([getStudents(), getCourses()]);
        setStudents(s || []);
        setCourses(c || []);
      } catch (err) {
        console.error('Load students/courses failed', err);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (selected) {
      setGradeId(selected.id || '');
      setStudentId(selected.student_id ?? selected.student ?? '');
      setCourseName(selected.course || '');
      setScore(selected.score ?? '');
    } else {
      setGradeId('');
      setStudentId('');
      setCourseName('');
      setScore('');
    }
  }, [selected]);

  const validate = () => {
    if (!studentId) return 'Select student';
    if (!courseName) return 'Select course';
    if (score === '' || isNaN(Number(score))) return 'Enter numeric score';
    const n = Number(score);
    if (n < 0 || n > 100) return 'Score must be between 0 and 100';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);
    setSaving(true);
    try {
      const payload = { student_id: studentId, course: courseName, score: Number(score) };
      if (gradeId) {
        await updateGrade(gradeId, payload);
      } else {
        await addGrade(payload);
      }
      setGradeId('');
      setStudentId('');
      setCourseName('');
      setScore('');
      clearSelected && clearSelected();
      refresh && refresh();
    } catch (err) {
      console.error('Add/update grade failed', err);
      alert('Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <input type="hidden" value={gradeId} readOnly />
      <label>
        Student
        <select value={studentId} onChange={e => setStudentId(e.target.value)}>
          <option value="">-- select student --</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>

      <label>
        Course
        <select value={courseName} onChange={e => setCourseName(e.target.value)}>
          <option value="">-- select course --</option>
          {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </label>

      <label>
        Score
        <input value={score} onChange={e => setScore(e.target.value)} placeholder="0 - 100" />
      </label>

      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : gradeId ? 'Update Grade' : 'Add Grade'}</button>
        <button type="button" onClick={() => { setGradeId(''); setStudentId(''); setCourseName(''); setScore(''); clearSelected && clearSelected(); }}>Clear</button>
      </div>
    </form>
  );
}
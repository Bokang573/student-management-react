import React, { useEffect, useState } from 'react';
import { getGrades, deleteGrade } from '../api';

function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleString('en-ZA', {
    timeZone: 'Africa/Maseru',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function GradeTable({ refreshTrigger, onEdit }) {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getGrades();
      setGrades(data || []);
    } catch (err) {
      console.error('Load grades failed', err);
      alert('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshTrigger]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this grade?')) return;
    try {
      await deleteGrade(id);
      load();
    } catch (err) {
      console.error('Delete grade failed', err);
      alert('Failed to delete grade');
    }
  };

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Student</th>
          <th>Course</th>
          <th>Score</th>
          <th>Created At</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {loading && grades.length === 0 && (
          <tr><td colSpan="5" className="muted">Loading...</td></tr>
        )}

        {!loading && grades.length === 0 && (
          <tr><td colSpan="5" className="muted">No grades recorded</td></tr>
        )}

        {!loading && grades.map(g => (
          <tr key={g.id}>
            <td>{g.student_name ?? g.student ?? '—'}</td>
            <td>{g.course}</td>
            <td>{g.score}</td>
            <td>{formatDate(g.created_at ?? g.createdAt)}</td>
            <td>
              <button onClick={() => onEdit && onEdit(g)} style={{ marginRight: 8 }}>Edit</button>
              <button onClick={() => handleDelete(g.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
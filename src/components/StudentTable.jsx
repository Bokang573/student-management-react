import React from 'react';
import { deleteStudent } from '../services/api';

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

export default function StudentTable({ students = [], onEdit, refresh }) {
  const handleDelete = (id) => {
    if (!confirm('Delete this student?')) return;
    deleteStudent(id).then(() => refresh && refresh()).catch(err => {
      console.error('Delete failed', err);
      alert('Delete failed');
    });
  };

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Course</th>
          <th>Created At</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {students.length === 0 && (
          <tr><td colSpan="5" className="muted">No students found</td></tr>
        )}
        {students.map(s => (
          <tr key={s.id}>
            <td>{s.name}</td>
            <td>{s.email}</td>
            <td>{s.course}</td>
            <td>{formatDate(s.created_at ?? s.createdAt)}</td>
            <td>
              <button onClick={() => onEdit && onEdit(s)} style={{ marginRight: 8 }}>Edit</button>
              <button onClick={() => handleDelete(s.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
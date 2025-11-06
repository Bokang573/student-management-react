import React, { useEffect, useState } from 'react';
import { getCourses } from '../services/api';

export default function CourseTable({ refreshTrigger }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCourses();
      setCourses(data || []);
    } catch (err) {
      console.error('Load courses failed', err);
      alert('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshTrigger]);

  return (
    <div>
      <table className="table">
        <thead>
          <tr><th>Course</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan="2" className="muted">Loading...</td></tr>}
          {!loading && courses.length === 0 && <tr><td colSpan="2" className="muted">No courses found</td></tr>}
          {!loading && courses.map(c => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>
                {/* Add course actions here if needed */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
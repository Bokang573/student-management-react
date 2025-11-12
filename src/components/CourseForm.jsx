import React, { useState } from 'react';
import { addCourse } from '../api';

export default function CourseForm({ refresh }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const validate = () => {
    if (!name.trim()) return 'Course name required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);
    setSaving(true);
    try {
      await addCourse({ name: name.trim() });
      setName('');
      refresh && refresh();
    } catch (err) {
      console.error('Add course failed', err);
      alert('Failed to add course');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label>
        Course name
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Mathematics" />
      </label>
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Add Course'}</button>
        <button type="button" onClick={() => setName('')}>Clear</button>
      </div>
    </form>
  );
}
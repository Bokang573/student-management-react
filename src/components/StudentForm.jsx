import React, { useEffect, useState } from 'react';
import { addStudent, updateStudent } from '../api';

export default function StudentForm({ selected, clearSelected, refresh, courses = [] }) {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selected) {
      setId(selected.id || '');
      setName(selected.name || '');
      setEmail(selected.email || '');
      setCourse(selected.course || '');
    } else {
      setId('');
      setName('');
      setEmail('');
      setCourse('');
    }
  }, [selected]);

  const validate = () => {
    if (!name.trim()) return 'Name required';
    if (!email.trim()) return 'Email required';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Invalid email';
    if (!course) return 'Course required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      alert(err);
      return;
    }
    setSaving(true);
    const payload = { name: name.trim(), email: email.trim(), course };
    try {
      if (id) {
        await updateStudent(id, payload);
      } else {
        await addStudent(payload);
      }
      refresh && refresh();
      setId('');
      setName('');
      setEmail('');
      setCourse('');
      clearSelected && clearSelected();
    } catch (e) {
      console.error('Save failed', e);
      alert('Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <input type="hidden" value={id} readOnly />
      <label>
        Name
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
      </label>
      <label>
        Email
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
      </label>
      <label>
        Course
        <select value={course} onChange={e => setCourse(e.target.value)}>
          <option value="">-- select course --</option>
          {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
      </label>
      <div className="form-actions">
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : id ? 'Update' : 'Add Student'}</button>
        <button type="button" onClick={() => { setId(''); setName(''); setEmail(''); setCourse(''); clearSelected && clearSelected(); }}>
          Clear
        </button>
      </div>
    </form>
  );
}
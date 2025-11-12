const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

async function handleRes(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    try {
      const json = JSON.parse(text || '{}');
      throw new Error(json.error || json.message || text || `HTTP ${res.status}`);
    } catch {
      throw new Error(text || res.statusText || `HTTP ${res.status}`);
    }
  }
  if (res.status === 204) return null;
  return res.json();
}

function fetchJson(url, opts) {
  return fetch(url, opts).then(handleRes);
}

export const getStudents = () =>
  fetchJson(`${base}/students`);

export const addStudent = (data) =>
  fetchJson(`${base}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const getCourses = () =>
  fetchJson(`${base}/courses`);

export const addCourse = (data) =>
  fetchJson(`${base}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const getGrades = () =>
  fetchJson(`${base}/grades`);

export const addGrade = (data) =>
  fetchJson(`${base}/grades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });


export const deleteStudent = (id) =>
  fetchJson(`${base}/students/${id}`, { method: 'DELETE' });

export const updateStudent = (id, data) =>
  fetchJson(`${base}/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const deleteCourse = (id) =>
  fetchJson(`${base}/courses/${id}`, { method: 'DELETE' });

export const updateCourse = (id, data) =>
  fetchJson(`${base}/courses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const deleteGrade = (id) =>
  fetchJson(`${base}/grades/${id}`, { method: 'DELETE' });

export const updateGrade = (id, data) =>
  fetchJson(`${base}/grades/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

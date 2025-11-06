const base = 'http://localhost:3000';

async function handleRes(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || res.statusText || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

/* Students */
export const getStudents = () => fetch(`${base}/students`).then(handleRes);
export const getStudent = (id) => fetch(`${base}/students/${id}`).then(handleRes);
export const addStudent = (data) =>
  fetch(`${base}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleRes);
export const updateStudent = (id, data) =>
  fetch(`${base}/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleRes);
export const deleteStudent = (id) =>
  fetch(`${base}/students/${id}`, { method: 'DELETE' }).then(handleRes);

/* Courses */
export const getCourses = () => fetch(`${base}/courses`).then(handleRes);
export const addCourse = (data) =>
  fetch(`${base}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleRes);
export const deleteCourse = (id) =>
  fetch(`${base}/courses/${id}`, { method: 'DELETE' }).then(handleRes);

/* Grades */
export const getGrades = () => fetch(`${base}/grades`).then(handleRes);
export const addGrade = (data) =>
  fetch(`${base}/grades`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleRes);
export const updateGrade = (id, data) =>
  fetch(`${base}/grades/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleRes);
export const deleteGrade = (id) =>
  fetch(`${base}/grades/${id}`, { method: 'DELETE' }).then(handleRes);

/* Extras */
export const getAverages = () => fetch(`${base}/grades/averages`).then(handleRes);
export const exportGrades = () => { window.location.href = `${base}/grades/export`; };
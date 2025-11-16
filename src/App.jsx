import React, { useEffect, useState } from "react";
import {
  getStudents,
  addStudent,
  deleteStudent,
  updateStudent,
  getCourses,
  addCourse,
  deleteCourse,
  updateCourse,
  getGrades,
  addGrade,
  deleteGrade,
  updateGrade,
} from "./pages/api";
import "./styles.css";

export default function App() {
  const [tab, setTab] = useState("students");
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);

  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);

  const fetchData = async () => {
    if (tab === "students") setStudents(await getStudents());
    if (tab === "courses") setCourses(await getCourses());
    if (tab === "grades") setGrades(await getGrades());
  };

  useEffect(() => {
    fetchData();
  }, [tab]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tab === "students") {
      if (editing) {
        await updateStudent(editing.id, form);
      } else {
        await addStudent(form);
      }
    } else if (tab === "courses") {
      if (editing) {
        await updateCourse(editing.id, form);
      } else {
        await addCourse(form);
      }
    } else if (tab === "grades") {
      if (editing) {
        await updateGrade(editing.id, form);
      } else {
        await addGrade(form);
      }
    }
    setForm({});
    setEditing(null);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    if (tab === "students") await deleteStudent(id);
    if (tab === "courses") await deleteCourse(id);
    if (tab === "grades") await deleteGrade(id);
    fetchData();
  };

  const handleEdit = (item) => {
    setEditing(item);
    setForm(item);
  };

  const exportGradesCSV = () => {
    const headers = Object.keys(grades[0] || {}).join(",");
    const rows = grades.map((g) => Object.values(g).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "grades.csv";
    link.click();
  };

  const renderTable = (data) => (
    <table className="table">
      <thead>
        <tr>
          {Object.keys(data[0] || {}).map((key) => (
            <th key={key}>{key}</th>
          ))}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.length ? (
          data.map((item) => (
            <tr key={item.id}>
              {Object.values(item).map((val, i) => (
                <td key={i}>{val}</td>
              ))}
              <td>
                <button onClick={() => handleEdit(item)}>✏️</button>
                <button onClick={() => handleDelete(item.id)}>🗑</button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td className="muted" colSpan="100%">
              No data
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div className="app">
      <div className="header">
        <h1>Student Management</h1>
        <div className="actions">
          <button onClick={() => setTab("students")}>Students</button>
          <button onClick={() => setTab("courses")}>Courses</button>
          <button onClick={() => setTab("grades")}>Grades</button>
          {tab === "grades" && <button onClick={exportGradesCSV}>💾 Export CSV</button>}
        </div>
      </div>

      <div className="panel">
        <form onSubmit={handleSubmit} className="form">
          {Object.keys(form).length === 0 && <p className="small-note">Fill the form to add or edit.</p>}
          {tab === "students" && (
            <>
              <label>
                Name:
                <input name="name" value={form.name || ""} onChange={handleChange} />
              </label>
              <label>
                Email:
                <input name="email" value={form.email || ""} onChange={handleChange} />
              </label>
              <label>
                Course ID:
                <input name="course_id" value={form.course_id || ""} onChange={handleChange} />
              </label>
            </>
          )}
          {tab === "courses" && (
            <label>
              Course Name:
              <input name="name" value={form.name || ""} onChange={handleChange} />
            </label>
          )}
          {tab === "grades" && (
            <>
              <label>
                Student ID:
                <input name="student_id" value={form.student_id || ""} onChange={handleChange} />
              </label>
              <label>
                Course ID:
                <input name="course_id" value={form.course_id || ""} onChange={handleChange} />
              </label>
              <label>
                Grade:
                <input name="grade" value={form.grade || ""} onChange={handleChange} />
              </label>
            </>
          )}
          <div className="form-actions">
            <button type="submit">{editing ? "Update" : "Add"}</button>
            {editing && <button onClick={() => setEditing(null)}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="panel">{renderTable(tab === "students" ? students : tab === "courses" ? courses : grades)}</div>
    </div>
  );
}

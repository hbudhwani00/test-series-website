import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminService } from '../../services/api';
import './ViewStudents.css';

const ViewStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await adminService.getStudents();
      setStudents(response.data.students);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.includes(searchTerm)
  );

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  return (
    <div className="container">
      <h1>Student Management</h1>

      <div className="card">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="students-summary">
          <p>
            Total Students: <strong>{students.length}</strong>
          </p>
          <p>
            Showing: <strong>{filteredStudents.length}</strong>
          </p>
        </div>
      </div>

      <div className="students-table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Subscriptions</th>
              <th>Registered On</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student._id}>
                <td>{student.name}</td>
                <td>{student.phone}</td>
                <td>
                  {student.subscriptions.length > 0 ? (
                    <div className="subscriptions-list">
                      {student.subscriptions
                        .filter((sub) => sub.isActive)
                        .map((sub, idx) => (
                          <span key={idx} className="subscription-badge">
                            {sub.examType.replace('_', ' ')}
                          </span>
                        ))}
                      {student.subscriptions.filter((sub) => sub.isActive)
                        .length === 0 && (
                        <span className="no-subscription">No active</span>
                      )}
                    </div>
                  ) : (
                    <span className="no-subscription">None</span>
                  )}
                </td>
                <td>{new Date(student.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredStudents.length === 0 && (
          <div className="no-results">No students found</div>
        )}
      </div>
    </div>
  );
};

export default ViewStudents;

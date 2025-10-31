import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const StudentAnalytics = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filterSubject, setFilterSubject] = useState('All');

  useEffect(() => {
    fetchStudentAnalytics();
  }, []);

  const fetchStudentAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/ai/admin/student-analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load student analytics');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Excellent': return '#4caf50';
      case 'Good': return '#8bc34a';
      case 'Average': return '#ff9800';
      case 'Weak': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 90) return '#4caf50';
    if (accuracy >= 70) return '#8bc34a';
    if (accuracy >= 50) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading student analytics...</div>
      </div>
    );
  }

  const filteredTopics = selectedStudent
    ? filterSubject === 'All'
      ? selectedStudent.topics
      : selectedStudent.topics.filter(t => t.subject === filterSubject)
    : [];

  return (
    <div className="container">
      <h1>📊 Student Performance Analytics</h1>
      <p className="text-gray-600 mb-4">
        View detailed topic-wise performance for all students. Updated after every test.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students List */}
        <div className="card">
          <h3 className="mb-4">Students ({students.length})</h3>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {students.map((student) => (
              <div
                key={student.studentId}
                onClick={() => setSelectedStudent(student)}
                className={`p-4 mb-2 rounded-lg cursor-pointer transition-all ${
                  selectedStudent?.studentId === student.studentId
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <div className="font-bold">{student.studentName}</div>
                <div className="text-sm text-gray-600">{student.studentEmail}</div>
                <div className="flex gap-4 mt-2 text-xs">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {student.totalTests} tests
                  </span>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                    {student.weakTopicsCount} weak topics
                  </span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    {student.excellentTopicsCount} excellent
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Topic Performance */}
        <div className="card lg:col-span-2">
          {selectedStudent ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3>{selectedStudent.studentName}</h3>
                  <p className="text-sm text-gray-600">{selectedStudent.studentEmail}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterSubject('All')}
                    className={`px-3 py-1 rounded ${filterSubject === 'All' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  >
                    All
                  </button>
                  {['Physics', 'Chemistry', 'Mathematics', 'Biology'].map(subject => (
                    <button
                      key={subject}
                      onClick={() => setFilterSubject(subject)}
                      className={`px-3 py-1 rounded ${filterSubject === subject ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedStudent.totalTests}</div>
                  <div className="text-xs text-gray-600">Total Tests</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedStudent.excellentTopicsCount}</div>
                  <div className="text-xs text-gray-600">Excellent Topics</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedStudent.weakTopicsCount}</div>
                  <div className="text-xs text-gray-600">Weak Topics (&lt;90%)</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{selectedStudent.topics.length}</div>
                  <div className="text-xs text-gray-600">Topics Attempted</div>
                </div>
              </div>

              {/* Topics Table */}
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-3 text-left">Subject</th>
                      <th className="p-3 text-left">Chapter</th>
                      <th className="p-3 text-left">Topic</th>
                      <th className="p-3 text-center">Total</th>
                      <th className="p-3 text-center">Correct</th>
                      <th className="p-3 text-center">Incorrect</th>
                      <th className="p-3 text-center">Unattempted</th>
                      <th className="p-3 text-center">Accuracy</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTopics.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center p-8 text-gray-500">
                          No data available. Student hasn't taken any tests yet.
                        </td>
                      </tr>
                    ) : (
                      filteredTopics
                        .sort((a, b) => parseFloat(a.accuracy) - parseFloat(b.accuracy))
                        .map((topic, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="p-3">{topic.subject}</td>
                            <td className="p-3">{topic.chapter}</td>
                            <td className="p-3">{topic.topic}</td>
                            <td className="p-3 text-center">{topic.total}</td>
                            <td className="p-3 text-center text-green-600 font-semibold">{topic.correct}</td>
                            <td className="p-3 text-center text-red-600 font-semibold">{topic.incorrect}</td>
                            <td className="p-3 text-center text-gray-600">{topic.unattempted}</td>
                            <td className="p-3 text-center">
                              <span
                                className="px-3 py-1 rounded-full text-white font-bold"
                                style={{ backgroundColor: getAccuracyColor(parseFloat(topic.accuracy)) }}
                              >
                                {topic.accuracy}%
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className="px-3 py-1 rounded-full text-white font-semibold text-xs"
                                style={{ backgroundColor: getStatusColor(topic.status) }}
                              >
                                {topic.status}
                              </span>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center p-12 text-gray-500">
              <div className="text-6xl mb-4">👈</div>
              <p>Select a student to view their detailed performance analytics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentAnalytics;

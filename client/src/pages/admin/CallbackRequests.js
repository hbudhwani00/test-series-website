import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './CallbackRequests.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CallbackRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filter === 'all' 
        ? `${API_URL}/admin/callback-requests`
        : `${API_URL}/admin/callback-requests?status=${filter}`;
      
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(data.requests || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch callback requests:', error);
      toast.error('Failed to load requests');
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/admin/callback-requests/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Status updated');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const addNotes = async (id) => {
    const notes = prompt('Enter notes:');
    if (!notes) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/admin/callback-requests/${id}`,
        { notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Notes added');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to add notes');
    }
  };

  const deleteRequest = async (id) => {
    if (!window.confirm('Delete this callback request?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/callback-requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Request deleted');
      fetchRequests();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      contacted: '#17a2b8',
      completed: '#28a745',
      cancelled: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  if (loading) {
    return <div className="callback-requests loading">Loading...</div>;
  }

  return (
    <div className="callback-requests">
      <div className="header">
        <h1>📞 Callback Requests</h1>
        <div className="stats">
          <span className="stat">Total: {requests.length}</span>
          <span className="stat pending">
            Pending: {requests.filter(r => r.status === 'pending').length}
          </span>
        </div>
      </div>

      <div className="filters">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'pending' ? 'active' : ''} 
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button 
          className={filter === 'contacted' ? 'active' : ''} 
          onClick={() => setFilter('contacted')}
        >
          Contacted
        </button>
        <button 
          className={filter === 'completed' ? 'active' : ''} 
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      <div className="requests-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Message</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(request => (
              <tr key={request._id}>
                <td>{new Date(request.createdAt).toLocaleString()}</td>
                <td>{request.name}</td>
                <td>
                  <a href={`tel:${request.phone}`}>{request.phone}</a>
                </td>
                <td>{request.message || '-'}</td>
                <td>
                  <select
                    value={request.status}
                    onChange={(e) => updateStatus(request._id, e.target.value)}
                    style={{ 
                      background: getStatusColor(request.status),
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '5px'
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td>
                  {request.notes ? (
                    <span title={request.notes}>📝 {request.notes.substring(0, 30)}...</span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="actions">
                  <button 
                    className="btn-icon" 
                    onClick={() => addNotes(request._id)}
                    title="Add Notes"
                  >
                    📝
                  </button>
                  <button 
                    className="btn-icon danger" 
                    onClick={() => deleteRequest(request._id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {requests.length === 0 && (
          <div className="no-data">No callback requests found</div>
        )}
      </div>
    </div>
  );
};

export default CallbackRequests;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ManageUsers.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, subscribed, non-subscribed
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    subscriptionStatus: 'inactive',
    subscriptionType: '',
    subscriptionExpiry: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(data.users || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/admin/users/create`,
        newUser,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('User created successfully!');
      setShowAddModal(false);
      setNewUser({
        name: '',
        email: '',
        phoneNumber: '',
        password: '',
        subscriptionStatus: 'inactive',
        subscriptionType: '',
        subscriptionExpiry: ''
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleChangePassword = async (userId, newPassword) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/admin/users/${userId}/password`,
        { newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error('Failed to change password');
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/admin/users/${userId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUser(data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load user details');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'subscribed') return matchesSearch && user.subscriptionStatus === 'active';
    if (filterType === 'non-subscribed') return matchesSearch && user.subscriptionStatus !== 'active';
    return matchesSearch;
  });

  if (loading) {
    return <div className="manage-users loading">Loading users...</div>;
  }

  return (
    <div className="manage-users">
      <div className="header">
        <h1>👥 User Management</h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add New User
        </button>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="🔍 Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
          <option value="all">All Users ({users.length})</option>
          <option value="subscribed">Subscribed ({users.filter(u => u.subscriptionStatus === 'active').length})</option>
          <option value="non-subscribed">Non-Subscribed ({users.filter(u => u.subscriptionStatus !== 'active').length})</option>
        </select>
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Subscription</th>
              <th>Last Active</th>
              <th>Tests Taken</th>
              <th>Devices</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phoneNumber || 'N/A'}</td>
                <td>
                  <span className={`badge ${user.subscriptionStatus === 'active' ? 'active' : 'inactive'}`}>
                    {user.subscriptionStatus === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}</td>
                <td>{user.testsTaken || 0}</td>
                <td>{user.deviceCount || 1}</td>
                <td className="actions">
                  <button className="btn-icon" onClick={() => handleViewDetails(user._id)} title="View Details">
                    👁️
                  </button>
                  <button className="btn-icon" onClick={() => {
                    const newPass = prompt('Enter new password for ' + user.name);
                    if (newPass) handleChangePassword(user._id, newPass);
                  }} title="Change Password">
                    🔑
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDeleteUser(user._id)} title="Delete User">
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label>Subscription Status</label>
                <select
                  value={newUser.subscriptionStatus}
                  onChange={(e) => setNewUser({ ...newUser, subscriptionStatus: e.target.value })}
                >
                  <option value="inactive">Inactive</option>
                  <option value="active">Active</option>
                </select>
              </div>
              {newUser.subscriptionStatus === 'active' && (
                <>
                  <div className="form-group">
                    <label>Subscription Type</label>
                    <select
                      value={newUser.subscriptionType}
                      onChange={(e) => setNewUser({ ...newUser, subscriptionType: e.target.value })}
                    >
                      <option value="">Select Type</option>
                      <option value="JEE">JEE</option>
                      <option value="NEET">NEET</option>
                      <option value="BOTH">Both</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Subscription Expiry</label>
                    <input
                      type="date"
                      value={newUser.subscriptionExpiry}
                      onChange={(e) => setNewUser({ ...newUser, subscriptionExpiry: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <h2>User Details: {selectedUser.name}</h2>
            
            <div className="user-details">
              <section className="detail-section">
                <h3>Basic Information</h3>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Phone:</strong> {selectedUser.phoneNumber || 'N/A'}</p>
                <p><strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                <p><strong>Last Active:</strong> {selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleString() : 'Never'}</p>
              </section>

              <section className="detail-section">
                <h3>Subscription Details</h3>
                <p><strong>Status:</strong> <span className={`badge ${selectedUser.subscriptionStatus === 'active' ? 'active' : 'inactive'}`}>
                  {selectedUser.subscriptionStatus}
                </span></p>
                <p><strong>Type:</strong> {selectedUser.subscriptionType || 'N/A'}</p>
                <p><strong>Expiry:</strong> {selectedUser.subscriptionExpiry ? new Date(selectedUser.subscriptionExpiry).toLocaleDateString() : 'N/A'}</p>
              </section>

              <section className="detail-section">
                <h3>Test Performance</h3>
                <div className="test-results">
                  {selectedUser.testResults && selectedUser.testResults.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Test Name</th>
                          <th>Score</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.testResults.map((result, index) => (
                          <tr key={index}>
                            <td>{result.testName}</td>
                            <td>{result.score}/{result.totalMarks}</td>
                            <td>{new Date(result.date).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No tests taken yet</p>
                  )}
                </div>
              </section>

              <section className="detail-section">
                <h3>Login Activity</h3>
                <div className="login-devices">
                  {selectedUser.loginHistory && selectedUser.loginHistory.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Device</th>
                          <th>IP Address</th>
                          <th>Last Login</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedUser.loginHistory.map((login, index) => (
                          <tr key={index}>
                            <td>{login.device || 'Unknown Device'}</td>
                            <td>{login.ipAddress || 'N/A'}</td>
                            <td>{new Date(login.timestamp).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>No login history available</p>
                  )}
                </div>
              </section>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;

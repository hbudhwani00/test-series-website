import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../../services/api';
import './DemoLeads.css';

const DemoLeads = () => {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  
  // Filters
  const [search, setSearch] = useState('');
  const [convertedFilter, setConvertedFilter] = useState(''); // '', 'true', 'false'
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  useEffect(() => {
    fetchLeads();
  }, [pagination.page, convertedFilter, sortBy, order]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        order,
        search,
        converted: convertedFilter
      });

      const response = await axios.get(`${API_URL}/admin/demo-leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLeads(response.data.leads);
      setPagination(response.data.pagination);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch demo leads');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchLeads();
  };

  const handleMarkConverted = async (leadId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/admin/demo-leads/${leadId}/convert`,
        { converted: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`Lead marked as ${!currentStatus ? 'converted' : 'not converted'}`);
      fetchLeads();
    } catch (error) {
      toast.error('Failed to update lead');
    }
  };

  const handleDelete = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_URL}/admin/demo-leads/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Lead deleted successfully');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/demo-leads/export/csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `demo-leads-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Leads exported successfully!');
    } catch (error) {
      toast.error('Failed to export leads');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && leads.length === 0) {
    return <div className="loading">Loading demo leads...</div>;
  }

  return (
    <div className="demo-leads-container">
      <div className="leads-header">
        <h1>📋 Demo Test Leads</h1>
        <button className="export-btn" onClick={handleExportCSV}>
          📥 Export to CSV
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.totalLeads}</div>
              <div className="stat-label">Total Leads</div>
            </div>
          </div>

          <div className="stat-card converted">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.convertedLeads}</div>
              <div className="stat-label">Converted</div>
            </div>
          </div>

          <div className="stat-card unconverted">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{stats.unconvertedLeads}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          <div className="stat-card score">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.averageScore}%</div>
              <div className="stat-label">Avg Score</div>
            </div>
          </div>

          <div className="stat-card today">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{stats.leadsToday}</div>
              <div className="stat-label">Today</div>
            </div>
          </div>

          <div className="stat-card week">
            <div className="stat-icon">📆</div>
            <div className="stat-content">
              <div className="stat-value">{stats.leadsThisWeek}</div>
              <div className="stat-label">This Week</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="search-input"
          />
          <button type="submit" className="search-btn">🔍 Search</button>
        </form>

        <div className="filter-controls">
          <select 
            value={convertedFilter} 
            onChange={(e) => setConvertedFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Leads</option>
            <option value="false">Pending</option>
            <option value="true">Converted</option>
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="createdAt">Date</option>
            <option value="testPercentage">Score</option>
            <option value="name">Name</option>
          </select>

          <select 
            value={order} 
            onChange={(e) => setOrder(e.target.value)}
            className="filter-select"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Status</th>
              <th>Submitted On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-data">
                  No leads found
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead._id}>
                  <td className="name-cell">
                    <strong>{lead.name}</strong>
                  </td>
                  <td className="phone-cell">
                    <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                    <a 
                      href={`https://wa.me/91${lead.phone}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="whatsapp-btn"
                      title="Send WhatsApp"
                    >
                      💬
                    </a>
                  </td>
                  <td className="email-cell">
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`}>{lead.email}</a>
                    ) : (
                      <span className="no-data-text">N/A</span>
                    )}
                  </td>
                  <td className="score-cell">
                    {lead.testScore ? (
                      `${lead.testScore}/${lead.resultId?.totalMarks || 300}`
                    ) : (
                      <span className="no-data-text">N/A</span>
                    )}
                  </td>
                  <td className="percentage-cell">
                    {lead.testPercentage ? (
                      <span className={`percentage-badge ${
                        lead.testPercentage >= 70 ? 'good' : 
                        lead.testPercentage >= 40 ? 'average' : 'low'
                      }`}>
                        {lead.testPercentage.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="no-data-text">N/A</span>
                    )}
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge ${lead.convertedToUser ? 'converted' : 'pending'}`}>
                      {lead.convertedToUser ? '✅ Converted' : '⏳ Pending'}
                    </span>
                  </td>
                  <td className="date-cell">
                    {formatDate(lead.createdAt)}
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleMarkConverted(lead._id, lead.convertedToUser)}
                      className={`action-btn ${lead.convertedToUser ? 'unconvert' : 'convert'}`}
                      title={lead.convertedToUser ? 'Mark as Pending' : 'Mark as Converted'}
                    >
                      {lead.convertedToUser ? '↩️' : '✓'}
                    </button>
                    <button
                      onClick={() => handleDelete(lead._id)}
                      className="action-btn delete"
                      title="Delete Lead"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="pagination-btn"
          >
            ← Previous
          </button>
          
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </span>
          
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.pages}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default DemoLeads;

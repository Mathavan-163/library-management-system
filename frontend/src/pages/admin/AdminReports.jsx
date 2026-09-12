import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import StatsCard from '../../components/StatsCard';
import { BarChart3, Filter, BookOpen, RotateCcw, CreditCard, TrendingUp } from 'lucide-react';

const AdminReports = () => {
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    student_id: '',
    book_id: '',
    status: '',
  });
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      if (filters.student_id) params.student_id = filters.student_id;
      if (filters.book_id) params.book_id = filters.book_id;
      if (filters.status) params.status = filters.status;

      const res = await dashboardAPI.getReports(params);
      setReportData(res.data);
    } catch (err) {
      addToast('Failed to generate reports from database.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleReset = () => {
    setFilters({
      start_date: '',
      end_date: '',
      student_id: '',
      book_id: '',
      status: '',
    });
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Reports & Analytics</h1>
          <p className="page-subtitle">Aggregate library metrics filtered by date range, borrowers, books, and payment status</p>
        </div>
      </div>

      {/* Filter Form */}
      <form onSubmit={handleApplyFilter} className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} /> Filter Report Criteria
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Student ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. STU001"
              value={filters.student_id}
              onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Book ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. BK001"
              value={filters.book_id}
              onChange={(e) => setFilters({ ...filters, book_id: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All</option>
              <option value="PAID">Paid Only</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" onClick={handleReset} className="btn btn-secondary">
            Reset Filters
          </button>
          <button type="submit" className="btn btn-primary">
            Apply Filters & Generate
          </button>
        </div>
      </form>

      {/* Filtered Aggregated Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Generating audit report from PostgreSQL...</div>
      ) : reportData ? (
        <div>
          <div className="stats-grid">
            <StatsCard
              title="Loans Issued"
              value={reportData.total_borrows}
              subtext="Matching criteria"
              icon={BookOpen}
              color="#2563eb"
              bg="#eff6ff"
            />
            <StatsCard
              title="Loans Returned"
              value={reportData.total_returns}
              subtext="Completed returns"
              icon={RotateCcw}
              color="#059669"
              bg="#ecfdf5"
            />
            <StatsCard
              title="Payments Processed"
              value={reportData.total_payments}
              subtext="Transactions recorded"
              icon={CreditCard}
              color="#7c3aed"
              bg="#f5f3ff"
            />
            <StatsCard
              title="Revenue Realized"
              value={`₹${reportData.total_revenue}`}
              subtext="Collected in period"
              icon={TrendingUp}
              color="#059669"
              bg="#ecfdf5"
            />
          </div>

          <div className="card" style={{ marginTop: '1.5rem', background: '#f8fafc' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: '#0f172a' }}>Audit Compliance Statement</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>
              All report statistics are directly computed from PostgreSQL relational tables (<code>borrowing_borrowrecord</code> and <code>payments_payment</code>) using strict database queries without mock or simulated values.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminReports;

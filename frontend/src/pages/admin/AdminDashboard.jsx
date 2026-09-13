import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import StatsCard from '../../components/StatsCard';
import { useToast } from '../../components/Toast';
import {
  Users, Briefcase, BookOpen, BookCheck, BookmarkCheck,
  RotateCcw, ClockAlert, IndianRupee, CreditCard, CheckCircle2,
  TrendingUp, ArrowRight
} from 'lucide-react';

const AdminDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getAdminDashboard();
      setStats(res.data);
    } catch (err) {
      addToast('Failed to load admin dashboard analytics from PostgreSQL.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem' }}>Aggregating PostgreSQL metrics...</div>;
  }

  if (!stats) return null;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Operational Center</h1>
          <p className="page-subtitle">Real-time PostgreSQL aggregates across users, collections, loans, and finances</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => onNavigate('reports')} className="btn btn-secondary">
            <TrendingUp size={16} /> Audit Reports
          </button>
          <button onClick={() => onNavigate('settings')} className="btn btn-primary">
            Settings & Rates
          </button>
        </div>
      </div>

      {/* User & Book Aggregates */}
      <h3 style={{ fontSize: '1rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
        Inventory & Population Metrics
      </h3>
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <StatsCard
          title="Total Students"
          value={stats.total_students}
          subtext="Registered borrowers"
          icon={Users}
          color="#2563eb"
          bg="#eff6ff"
        />
        <StatsCard
          title="Total Staff"
          value={stats.total_staff}
          subtext="Circulation operators"
          icon={Briefcase}
          color="#7c3aed"
          bg="#f5f3ff"
        />
        <StatsCard
          title="Total Book Copies"
          value={stats.total_books}
          subtext={`${stats.total_book_titles} catalog titles`}
          icon={BookOpen}
          color="#0284c7"
          bg="#f0f9ff"
        />
        <StatsCard
          title="Available Copies"
          value={stats.available_books}
          subtext="Ready on shelves"
          icon={BookCheck}
          color="#10b981"
          bg="#ecfdf5"
        />
      </div>

      {/* Circulation Status Aggregates */}
      <h3 style={{ fontSize: '1rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
        Circulation Activity
      </h3>
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <StatsCard
          title="Borrowed Books"
          value={stats.borrowed_books}
          subtext="Currently checked out"
          icon={BookmarkCheck}
          color="#d97706"
          bg="#fffbeb"
        />
        <StatsCard
          title="Returned Books"
          value={stats.returned_books}
          subtext="Completed loans"
          icon={RotateCcw}
          color="#059669"
          bg="#ecfdf5"
        />
        <StatsCard
          title="Overdue Books"
          value={stats.overdue_books}
          subtext="Active past due date"
          icon={ClockAlert}
          color="#dc2626"
          bg="#fef2f2"
        />
        <StatsCard
          title="Total Payments"
          value={stats.total_payments}
          subtext="Completed transactions"
          icon={CheckCircle2}
          color="#2563eb"
          bg="#eff6ff"
        />
      </div>

      {/* Financial & Fine Ledger Aggregates (Strict PostgreSQL Requirements) */}
      <h3 style={{ fontSize: '1rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
        Financial & Penalty Ledger (PostgreSQL Aggregation)
      </h3>
      <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
        <StatsCard
          title="Total Fine Generated"
          value={`₹${stats.total_fine_generated}`}
          subtext="Calculated from fine records"
          icon={IndianRupee}
          color="#b91c1c"
          bg="#fef2f2"
        />
        <StatsCard
          title="Total Fine Paid"
          value={`₹${stats.total_fine_paid}`}
          subtext="From successful payments"
          icon={CreditCard}
          color="#059669"
          bg="#ecfdf5"
        />
        <StatsCard
          title="Total Fine Pending"
          value={`₹${stats.total_fine_pending}`}
          subtext="Generated minus Paid"
          icon={ClockAlert}
          color={Number(stats.total_fine_pending) > 0 ? '#d97706' : '#10b981'}
          bg={Number(stats.total_fine_pending) > 0 ? '#fffbeb' : '#ecfdf5'}
        />
        <StatsCard
          title="Total Payment Amount"
          value={`₹${stats.total_payment_amount}`}
          subtext="Net recorded revenue"
          icon={TrendingUp}
          color="#2563eb"
          bg="#eff6ff"
        />
      </div>

      {/* Recent Activity Tables */}
      <div className="admin-recent-grid">
        <div className="card admin-recent-card">
          <div className="admin-recent-header">
            <h3 style={{ fontSize: '1.1rem' }}>Recent Loans</h3>
            <button onClick={() => onNavigate('borrows')} className="btn btn-secondary btn-sm">
              All Borrows <ArrowRight size={14} />
            </button>
          </div>
          <div className="admin-recent-table-wrap">
            <table className="data-table">
            <thead>
              <tr>
                <th>Borrow ID</th>
                <th>Student</th>
                <th>Book Title</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_borrows?.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.borrow_id}</td>
                  <td>{b.student_name}</td>
                  <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.book_title}</td>
                  <td>{b.due_date}</td>
                  <td><span className={`badge ${b.status === 'RETURNED' ? 'badge-success' : 'badge-info'}`}>{b.status}</span></td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>

        <div className="card admin-recent-card">
          <div className="admin-recent-header">
            <h3 style={{ fontSize: '1.1rem' }}>Recent Payments</h3>
            <button onClick={() => onNavigate('payments')} className="btn btn-secondary btn-sm">
              Payment Ledger <ArrowRight size={14} />
            </button>
          </div>
          <div className="admin-recent-table-wrap">
            <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_payments?.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.payment_id}</td>
                  <td>{p.student_name}</td>
                  <td style={{ color: '#059669', fontWeight: 700 }}>₹{p.amount}</td>
                  <td><span className="badge badge-info">{p.method}</span></td>
                  <td><code style={{ fontSize: '0.75rem' }}>{p.reference}</code></td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

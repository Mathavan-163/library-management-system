import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';
import StatsCard from '../../components/StatsCard';
import { useToast } from '../../components/Toast';
import { BookOpen, BookCheck, ClockAlert, Users, BookPlus, BookDown, CheckCircle, ArrowRight } from 'lucide-react';

const StaffDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchStats = async () => {
    try {
      const res = await dashboardAPI.getStaffDashboard();
      setStats(res.data);
    } catch (err) {
      addToast('Failed to load staff dashboard statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem' }}>Loading circulation dashboard...</div>;
  }

  if (!stats) return null;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Circulation Desk</h1>
          <p className="page-subtitle">Manage daily library operations, book issuance, returns, and inventory</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => onNavigate('issue')} className="btn btn-primary">
            <BookPlus size={16} /> Issue Book
          </button>
          <button onClick={() => onNavigate('returns')} className="btn btn-success">
            <BookDown size={16} /> Accept Return
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatsCard
          title="Active Students"
          value={stats.total_students}
          subtext="Registered borrowers"
          icon={Users}
          color="#2563eb"
          bg="#eff6ff"
        />
        <StatsCard
          title="Total Books (Copies)"
          value={stats.total_books}
          subtext={`${stats.total_book_titles} distinct titles`}
          icon={BookOpen}
          color="#8b5cf6"
          bg="#f5f3ff"
        />
        <StatsCard
          title="Available Copies"
          value={stats.available_books}
          subtext="Ready for circulation"
          icon={BookCheck}
          color="#10b981"
          bg="#ecfdf5"
        />
        <StatsCard
          title="Currently Borrowed"
          value={stats.borrowed_books}
          subtext="Active loans out"
          icon={BookOpen}
          color="#f59e0b"
          bg="#fffbeb"
        />
        <StatsCard
          title="Overdue Loans"
          value={stats.overdue_books}
          subtext="Active past due date"
          icon={ClockAlert}
          color="#ef4444"
          bg="#fef2f2"
        />
        <StatsCard
          title="Today's Borrows"
          value={stats.today_borrows}
          subtext="Issued today"
          icon={BookPlus}
          color="#0284c7"
          bg="#f0f9ff"
        />
        <StatsCard
          title="Today's Returns"
          value={stats.today_returns}
          subtext="Processed today"
          icon={CheckCircle}
          color="#059669"
          bg="#ecfdf5"
        />
        <StatsCard
          title="Pending Fines"
          value={stats.pending_fines_count}
          subtext="Awaiting collection"
          icon={ClockAlert}
          color="#d97706"
          bg="#fef3c7"
        />
      </div>

      {/* Recent Circulation Operations */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem' }}>Recent Circulation Transactions</h3>
          <button onClick={() => onNavigate('borrows')} className="btn btn-secondary btn-sm">
            View All Records <ArrowRight size={14} />
          </button>
        </div>

        {stats.recent_borrows && stats.recent_borrows.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Borrow ID</th>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Book Title</th>
                  <th>Borrow Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_borrows.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.borrow_id}</td>
                    <td style={{ fontFamily: 'monospace' }}>{b.student_id}</td>
                    <td style={{ fontWeight: 600 }}>{b.student_name}</td>
                    <td>{b.book_title}</td>
                    <td>{b.borrow_date}</td>
                    <td>{b.due_date}</td>
                    <td>
                      <span className={`badge ${b.status === 'RETURNED' ? 'badge-success' : 'badge-info'}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No transactions recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;

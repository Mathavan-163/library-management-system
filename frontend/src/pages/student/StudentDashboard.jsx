import React, { useState, useEffect } from 'react';
import { dashboardAPI, borrowAPI } from '../../services/api';
import StatsCard from '../../components/StatsCard';
import ReceiptModal from '../../components/ReceiptModal';
import { useToast } from '../../components/Toast';
import { BookOpen, BookmarkCheck, CheckCircle, AlertTriangle, IndianRupee, ArrowRight, RotateCcw } from 'lucide-react';

const StudentDashboard = ({ onNavigate }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [returningId, setReturningId] = useState(null);
  const { addToast } = useToast();

  const fetchStats = async () => {
    try {
      const res = await dashboardAPI.getStudentDashboard();
      setStats(res.data);
    } catch (err) {
      addToast('Failed to load student dashboard statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleReturn = async (borrowId) => {
    setReturningId(borrowId);
    try {
      const res = await borrowAPI.returnBook(borrowId);
      addToast(res.data.message || 'Book returned successfully.', 'success');
      if (res.data.receipt) {
        setSelectedReceipt(res.data.receipt);
      }
      fetchStats();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to return book.', 'error');
    } finally {
      setReturningId(null);
    }
  };

  if (loading) {
    return <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem' }}>Loading dashboard...</div>;
  }

  if (!stats) return null;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Dashboard</h1>
          <p className="page-subtitle">
            Welcome, <strong>{stats.student_name}</strong> (Student ID: <code style={{ color: '#2563eb', fontWeight: 700 }}>{stats.student_id}</code>) • {stats.department}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => onNavigate('books')} className="btn btn-primary">
            <BookOpen size={16} /> Browse Books
          </button>
          {Number(stats.pending_fine) > 0 && (
            <button onClick={() => onNavigate('fines')} className="btn btn-danger">
              <IndianRupee size={16} /> Pay Pending Fine (₹{stats.pending_fine})
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid">
        <StatsCard
          title="Total Borrowed"
          value={stats.total_borrowed}
          subtext="Lifetime borrowed books"
          icon={BookOpen}
          color="#2563eb"
          bg="#eff6ff"
        />
        <StatsCard
          title="Currently Borrowed"
          value={stats.currently_borrowed}
          subtext="Books in your possession"
          icon={BookmarkCheck}
          color="#8b5cf6"
          bg="#f5f3ff"
        />
        <StatsCard
          title="Returned Books"
          value={stats.returned_books}
          subtext="Completed returns"
          icon={CheckCircle}
          color="#10b981"
          bg="#ecfdf5"
        />
        <StatsCard
          title="Pending Fine"
          value={`₹${stats.pending_fine}`}
          subtext={stats.payment_status === 'CLEAR' ? 'All dues clear' : 'Payment required'}
          icon={AlertTriangle}
          color={Number(stats.pending_fine) > 0 ? '#ef4444' : '#10b981'}
          bg={Number(stats.pending_fine) > 0 ? '#fef2f2' : '#ecfdf5'}
        />
      </div>

      {/* Active Borrowed Books */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem' }}>Currently Borrowed Books</h3>
          <button onClick={() => onNavigate('borrows')} className="btn btn-secondary btn-sm">
            View All History <ArrowRight size={14} />
          </button>
        </div>

        {stats.active_borrows && stats.active_borrows.length > 0 ? (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Borrow ID</th>
                  <th>Book Title</th>
                  <th>Author</th>
                  <th>Borrow Date</th>
                  <th>Due Date</th>
                  <th>Late Days</th>
                  <th>Current Fine</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.active_borrows.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.borrow_id}</td>
                    <td style={{ fontWeight: 600 }}>{b.book_title}</td>
                    <td style={{ color: '#64748b' }}>{b.book_author}</td>
                    <td>{b.borrow_date}</td>
                    <td>
                      <span style={{
                        color: b.is_overdue ? '#dc2626' : '#0f172a',
                        fontWeight: b.is_overdue ? 700 : 500
                      }}>
                        {b.due_date} {b.is_overdue && '(Overdue)'}
                      </span>
                    </td>
                    <td>
                      {b.late_days > 0 ? (
                        <span className="badge badge-danger">{b.late_days} Days</span>
                      ) : (
                        <span className="badge badge-success">On Time</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: Number(b.current_fine) > 0 ? '#dc2626' : '#10b981' }}>
                        ₹{b.current_fine}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleReturn(b.borrow_id)}
                        disabled={returningId === b.borrow_id}
                        className="btn btn-primary btn-sm"
                      >
                        <RotateCcw size={14} /> {returningId === b.borrow_id ? 'Returning...' : 'Return Book'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
            <p>You currently do not have any borrowed books.</p>
            <button onClick={() => onNavigate('books')} className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }}>
              Borrow a Book Now
            </button>
          </div>
        )}
      </div>

      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
};

export default StudentDashboard;

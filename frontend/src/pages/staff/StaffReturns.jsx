import React, { useState, useEffect } from 'react';
import { borrowAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import ReceiptModal from '../../components/ReceiptModal';
import DataTable from '../../components/DataTable';
import { BookDown, Search, CheckCircle, ClockAlert, RotateCcw } from 'lucide-react';

const StaffReturns = () => {
  const [activeLoans, setActiveLoans] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const { addToast } = useToast();

  const fetchActiveLoans = async () => {
    setLoading(true);
    try {
      const res = await borrowAPI.getBorrowRecords({ status: 'BORROWED', search });
      setActiveLoans(res.data.results || res.data || []);
    } catch (err) {
      addToast('Failed to load active borrow loans.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, [search]);

  const handleReturn = async (borrow) => {
    setReturningId(borrow.id);
    try {
      const res = await borrowAPI.returnBook(borrow.borrow_id);
      addToast(`Book "${borrow.book_title}" returned successfully!`, 'success');
      if (res.data.receipt) {
        setReceipt(res.data.receipt);
      }
      fetchActiveLoans();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to process return.', 'error');
    } finally {
      setReturningId(null);
    }
  };

  const columns = [
    {
      header: 'Borrow ID',
      accessor: 'borrow_id',
      render: (r) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.borrow_id}</span>
    },
    {
      header: 'Student',
      accessor: 'student_name',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.student_name}</div>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>{r.student_id}</span>
        </div>
      )
    },
    {
      header: 'Book Title',
      accessor: 'book_title',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.book_title}</div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>by {r.book_author}</span>
        </div>
      )
    },
    { header: 'Borrow Date', accessor: 'borrow_date' },
    {
      header: 'Due Date',
      accessor: 'due_date',
      render: (r) => (
        <span style={{ color: r.is_overdue ? '#dc2626' : 'inherit', fontWeight: r.is_overdue ? 700 : 400 }}>
          {r.due_date} {r.is_overdue && '(Overdue)'}
        </span>
      )
    },
    {
      header: 'Late Days',
      accessor: 'late_days',
      render: (r) => (
        r.late_days > 0 ? (
          <span className="badge badge-danger">{r.late_days} Late</span>
        ) : (
          <span className="badge badge-success">On Time</span>
        )
      )
    },
    {
      header: 'Est. Fine',
      accessor: 'current_fine',
      render: (r) => (
        <span style={{ fontWeight: 700, color: Number(r.current_fine) > 0 ? '#dc2626' : '#10b981' }}>
          ₹{r.current_fine}
        </span>
      )
    },
    {
      header: 'Action',
      render: (r) => (
        <button
          onClick={() => handleReturn(r)}
          disabled={returningId === r.id}
          className="btn btn-success btn-sm"
        >
          <RotateCcw size={14} /> {returningId === r.id ? 'Returning...' : 'Accept Return'}
        </button>
      )
    }
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Accept Book Returns</h1>
          <p className="page-subtitle">Verify book returns, calculate automatic late fines, and restock inventory</p>
        </div>
      </div>

      <div className="filter-bar card" style={{ padding: '1rem' }}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search active loans by Borrow ID, Student ID, or Book Title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={activeLoans}
        keyField="id"
        emptyMessage="No active borrowed books found awaiting return."
      />

      <ReceiptModal
        isOpen={!!receipt}
        onClose={() => setReceipt(null)}
        receipt={receipt}
      />
    </div>
  );
};

export default StaffReturns;

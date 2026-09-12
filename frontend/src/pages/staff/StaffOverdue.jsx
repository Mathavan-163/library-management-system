import React, { useState, useEffect } from 'react';
import { borrowAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import DataTable from '../../components/DataTable';
import ReceiptModal from '../../components/ReceiptModal';
import { ClockAlert, Search, RotateCcw } from 'lucide-react';

const StaffOverdue = () => {
  const [overdueList, setOverdueList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const { addToast } = useToast();

  const fetchOverdue = async () => {
    setLoading(true);
    try {
      const res = await borrowAPI.getOverdueBorrows({ search });
      setOverdueList(res.data.results || res.data || []);
    } catch (err) {
      addToast('Failed to load overdue records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, [search]);

  const handleReturn = async (borrow) => {
    setReturningId(borrow.id);
    try {
      const res = await borrowAPI.returnBook(borrow.borrow_id);
      addToast(`Book "${borrow.book_title}" returned. Fine of ₹${res.data.fine_amount} recorded.`, 'success');
      if (res.data.receipt) {
        setReceipt(res.data.receipt);
      }
      fetchOverdue();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to process return.', 'error');
    } finally {
      setReturningId(null);
    }
  };

  const columns = [
    {
      header: 'Student ID',
      accessor: 'student_id',
      render: (r) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.student_id}</span>
    },
    {
      header: 'Student Name',
      accessor: 'student_name',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.student_name}</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.student_department}</span>
        </div>
      )
    },
    {
      header: 'Book Name',
      accessor: 'book_title',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.book_title}</div>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: {r.book_id_code}</span>
        </div>
      )
    },
    { header: 'Borrow Date', accessor: 'borrow_date' },
    {
      header: 'Due Date',
      accessor: 'due_date',
      render: (r) => <span style={{ color: '#dc2626', fontWeight: 700 }}>{r.due_date}</span>
    },
    {
      header: 'Current Late Days',
      accessor: 'late_days',
      render: (r) => <span className="badge badge-danger">{r.late_days} Days Late</span>
    },
    {
      header: 'Current Fine',
      accessor: 'current_fine',
      render: (r) => <strong style={{ color: '#dc2626', fontSize: '1.05rem' }}>₹{r.current_fine}</strong>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: () => <span className="badge badge-danger">OVERDUE</span>
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
          <h1 className="page-title">Overdue Loans Monitoring</h1>
          <p className="page-subtitle">Real-time identification of past-due active loans with dynamic fine accrual</p>
        </div>
      </div>

      <div className="filter-bar card" style={{ padding: '1rem' }}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search overdue records by Student Name, Student ID, or Book..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={overdueList}
        keyField="id"
        emptyMessage="Awesome! There are currently no active overdue loans in the library system."
      />

      <ReceiptModal
        isOpen={!!receipt}
        onClose={() => setReceipt(null)}
        receipt={receipt}
      />
    </div>
  );
};

export default StaffOverdue;

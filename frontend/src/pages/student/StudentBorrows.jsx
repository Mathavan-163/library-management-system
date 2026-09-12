import React, { useState, useEffect } from 'react';
import { borrowAPI, receiptsAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import ReceiptModal from '../../components/ReceiptModal';
import DataTable from '../../components/DataTable';
import { RotateCcw, Receipt, BookmarkCheck } from 'lucide-react';

const StudentBorrows = () => {
  const [borrows, setBorrows] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const { addToast } = useToast();

  const fetchBorrows = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await borrowAPI.getMyBorrows(params);
      setBorrows(res.data.results || res.data || []);
    } catch (err) {
      addToast('Failed to load borrow records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrows();
  }, [statusFilter]);

  const handleReturn = async (borrowId) => {
    setReturningId(borrowId);
    try {
      const res = await borrowAPI.returnBook(borrowId);
      addToast('Book returned successfully!', 'success');
      if (res.data.receipt) {
        setSelectedReceipt(res.data.receipt);
      }
      fetchBorrows();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to return book.', 'error');
    } finally {
      setReturningId(null);
    }
  };

  const handleViewReceipt = async (borrow) => {
    try {
      // Find latest receipt for this borrow
      const res = await receiptsAPI.getReceipts({ borrow_id: borrow.borrow_id });
      const list = res.data.results || res.data || [];
      if (list.length > 0) {
        setSelectedReceipt(list[0]);
      } else {
        addToast('No receipt found for this borrow record.', 'error');
      }
    } catch (err) {
      addToast('Failed to fetch receipt.', 'error');
    }
  };

  const columns = [
    {
      header: 'Borrow ID',
      accessor: 'borrow_id',
      render: (r) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.borrow_id}</span>
    },
    {
      header: 'Book Title',
      accessor: 'book_title',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.book_title}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>by {r.book_author}</div>
        </div>
      )
    },
    { header: 'Borrow Date', accessor: 'borrow_date' },
    {
      header: 'Due Date',
      accessor: 'due_date',
      render: (r) => (
        <span style={{ color: r.is_overdue ? '#dc2626' : 'inherit', fontWeight: r.is_overdue ? 700 : 400 }}>
          {r.due_date} {r.is_overdue && '(Late)'}
        </span>
      )
    },
    {
      header: 'Return Date',
      accessor: 'return_date',
      render: (r) => r.return_date || <span style={{ color: '#94a3b8' }}>Pending Return</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => {
        if (r.status === 'RETURNED') return <span className="badge badge-success">RETURNED</span>;
        if (r.is_overdue) return <span className="badge badge-danger">OVERDUE</span>;
        return <span className="badge badge-info">BORROWED</span>;
      }
    },
    {
      header: 'Fine',
      accessor: 'fine_amount',
      render: (r) => {
        const amt = r.status === 'RETURNED' ? r.fine_amount : r.current_fine;
        return (
          <span style={{ fontWeight: 700, color: Number(amt) > 0 ? '#dc2626' : '#10b981' }}>
            ₹{amt}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {r.status === 'BORROWED' && (
            <button
              onClick={() => handleReturn(r.borrow_id)}
              disabled={returningId === r.borrow_id}
              className="btn btn-primary btn-sm"
            >
              <RotateCcw size={14} /> Return
            </button>
          )}
          <button
            onClick={() => handleViewReceipt(r)}
            className="btn btn-secondary btn-sm"
            title="View Official Receipt"
          >
            <Receipt size={14} /> Receipt
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Borrowed Books</h1>
          <p className="page-subtitle">Track current loans, due dates, return statuses, and print receipts</p>
        </div>
        <div>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Loans</option>
            <option value="BORROWED">Currently Borrowed</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={borrows}
        keyField="id"
        emptyMessage="No borrow records found."
      />

      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
};

export default StudentBorrows;

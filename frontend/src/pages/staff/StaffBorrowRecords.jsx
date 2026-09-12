import React, { useState, useEffect } from 'react';
import { borrowAPI, receiptsAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import DataTable from '../../components/DataTable';
import ReceiptModal from '../../components/ReceiptModal';
import { Search, Receipt, Filter } from 'lucide-react';

const StaffBorrowRecords = () => {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const { addToast } = useToast();

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await borrowAPI.getBorrowRecords(params);
      setRecords(res.data.results || res.data || []);
    } catch (err) {
      addToast('Failed to load borrow records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [search, statusFilter]);

  const handleViewReceipt = async (record) => {
    try {
      const res = await receiptsAPI.getReceipts({ borrow_id: record.borrow_id });
      const list = res.data.results || res.data || [];
      if (list.length > 0) {
        setSelectedReceipt(list[0]);
      } else {
        addToast('No receipt on file for this borrow.', 'error');
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
    { header: 'Due Date', accessor: 'due_date' },
    {
      header: 'Return Date',
      accessor: 'return_date',
      render: (r) => r.return_date || <span style={{ color: '#94a3b8' }}>-</span>
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
        return <strong style={{ color: Number(amt) > 0 ? '#dc2626' : '#10b981' }}>₹{amt}</strong>;
      }
    },
    {
      header: 'Receipt',
      render: (r) => (
        <button onClick={() => handleViewReceipt(r)} className="btn btn-secondary btn-sm">
          <Receipt size={14} /> Slip
        </button>
      )
    }
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Borrow Records Audit</h1>
          <p className="page-subtitle">Historical and active registry of all library borrow transactions</p>
        </div>
      </div>

      <div className="filter-bar card" style={{ padding: '1rem' }}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by Borrow ID, Student, or Book Title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="BORROWED">Currently Borrowed</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={records}
        keyField="id"
        emptyMessage="No borrow transactions found."
      />

      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
};

export default StaffBorrowRecords;

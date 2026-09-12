import React, { useState, useEffect } from 'react';
import { paymentsAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import DataTable from '../../components/DataTable';
import PaymentModal from '../../components/PaymentModal';
import { CreditCard, Search, IndianRupee } from 'lucide-react';

const StaffFines = () => {
  const [fines, setFines] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFine, setSelectedFine] = useState(null);
  const { addToast } = useToast();

  const fetchFines = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await paymentsAPI.getFines(params);
      setFines(res.data.results || res.data || []);
    } catch (err) {
      addToast('Failed to load fines.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, [search, statusFilter]);

  const columns = [
    {
      header: 'Borrow Ref',
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
    { header: 'Book Title', accessor: 'book_title' },
    {
      header: 'Assessed Fine',
      accessor: 'amount',
      render: (r) => `₹${r.amount}`
    },
    {
      header: 'Paid Amount',
      accessor: 'paid_amount',
      render: (r) => <span style={{ color: '#10b981', fontWeight: 600 }}>₹{r.paid_amount}</span>
    },
    {
      header: 'Remaining Due',
      accessor: 'remaining_amount',
      render: (r) => <strong style={{ color: Number(r.remaining_amount) > 0 ? '#dc2626' : '#10b981' }}>₹{r.remaining_amount}</strong>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => (
        <span className={`badge ${r.status === 'PAID' ? 'badge-success' : 'badge-danger'}`}>
          {r.status}
        </span>
      )
    },
    {
      header: 'Action',
      render: (r) => (
        r.status === 'PENDING' && (
          <button
            onClick={() => setSelectedFine(r)}
            className="btn btn-success btn-sm"
          >
            <CreditCard size={14} /> Collect
          </button>
        )
      )
    }
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fines Collection Management</h1>
          <p className="page-subtitle">Track assessed fines, verify payment status, and accept over-the-counter payments</p>
        </div>
      </div>

      <div className="filter-bar card" style={{ padding: '1rem' }}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by Student ID, Name, Book, or Borrow ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '160px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending Fines</option>
          <option value="PAID">Settled / Paid</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={fines}
        keyField="id"
        emptyMessage="No fines found matching your search."
      />

      <PaymentModal
        isOpen={!!selectedFine}
        onClose={() => setSelectedFine(null)}
        fine={selectedFine}
        onPaymentSuccess={() => fetchFines()}
      />
    </div>
  );
};

export default StaffFines;

import React, { useState, useEffect } from 'react';
import { paymentsAPI, dashboardAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import StatsCard from '../../components/StatsCard';
import DataTable from '../../components/DataTable';
import { CreditCard, Search, IndianRupee, ClockAlert, CheckCircle2, TrendingUp } from 'lucide-react';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (methodFilter) params.method = methodFilter;

      const [payRes, dashRes] = await Promise.all([
        paymentsAPI.getPayments(params),
        dashboardAPI.getAdminDashboard()
      ]);
      setPayments(payRes.data.results || payRes.data || []);
      setSummary(dashRes.data);
    } catch (err) {
      addToast('Failed to load payment ledger records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, methodFilter]);

  const columns = [
    {
      header: 'Payment ID',
      accessor: 'payment_id',
      render: (r) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.payment_id}</span>
    },
    {
      header: 'Student ID',
      accessor: 'student_id',
      render: (r) => <span style={{ fontFamily: 'monospace' }}>{r.student_id}</span>
    },
    { header: 'Student Name', accessor: 'student_name' },
    {
      header: 'Borrow ID',
      accessor: 'borrow_id',
      render: (r) => <span style={{ fontFamily: 'monospace' }}>{r.borrow_id}</span>
    },
    {
      header: 'Fine Amount',
      accessor: 'fine_amount',
      render: (r) => `₹${r.fine_amount}`
    },
    {
      header: 'Paid Amount',
      accessor: 'paid_amount',
      render: (r) => <strong style={{ color: '#059669' }}>₹{r.paid_amount}</strong>
    },
    {
      header: 'Payment Date',
      accessor: 'payment_date',
      render: (r) => new Date(r.payment_date).toLocaleString()
    },
    {
      header: 'Method',
      accessor: 'payment_method',
      render: (r) => <span className="badge badge-info">{r.payment_method}</span>
    },
    {
      header: 'Transaction Ref',
      accessor: 'transaction_reference',
      render: (r) => <code style={{ fontSize: '0.78rem' }}>{r.transaction_reference}</code>
    },
    {
      header: 'Status',
      accessor: 'payment_status',
      render: (r) => <span className="badge badge-success">{r.payment_status}</span>
    }
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Management & Ledger</h1>
          <p className="page-subtitle">Inspect fine payment transactions and audit PostgreSQL ledger records</p>
        </div>
      </div>

      {/* Summary Cards directly from PostgreSQL */}
      {summary && (
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <StatsCard
            title="Total Fine Generated"
            value={`₹${summary.total_fine_generated}`}
            subtext="Assessed penalties"
            icon={IndianRupee}
            color="#b91c1c"
            bg="#fef2f2"
          />
          <StatsCard
            title="Total Fine Paid"
            value={`₹${summary.total_fine_paid}`}
            subtext="Settled transactions"
            icon={CreditCard}
            color="#059669"
            bg="#ecfdf5"
          />
          <StatsCard
            title="Total Fine Pending"
            value={`₹${summary.total_fine_pending}`}
            subtext="Outstanding arrears"
            icon={ClockAlert}
            color={Number(summary.total_fine_pending) > 0 ? '#d97706' : '#10b981'}
            bg={Number(summary.total_fine_pending) > 0 ? '#fffbeb' : '#ecfdf5'}
          />
          <StatsCard
            title="Total Payments Count"
            value={summary.total_payments}
            subtext={`Net Amount: ₹${summary.total_payment_amount}`}
            icon={TrendingUp}
            color="#2563eb"
            bg="#eff6ff"
          />
        </div>
      )}

      <div className="filter-bar card" style={{ padding: '1rem' }}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by Payment ID, Reference, Student ID, or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '160px' }}
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
        >
          <option value="">All Payment Methods</option>
          <option value="ONLINE">Online Gateway</option>
          <option value="CASH">Cash Counter</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={payments}
        keyField="id"
        emptyMessage="No payment records found."
      />
    </div>
  );
};

export default AdminPayments;

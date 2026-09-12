import React, { useState, useEffect } from 'react';
import { paymentsAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import PaymentModal from '../../components/PaymentModal';
import DataTable from '../../components/DataTable';
import { CreditCard, IndianRupee, CheckCircle, AlertCircle } from 'lucide-react';

const StudentFines = () => {
  const [fines, setFines] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFineToPay, setSelectedFineToPay] = useState(null);
  const { addToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [finesRes, payRes] = await Promise.all([
        paymentsAPI.getMyFines(),
        paymentsAPI.getMyPayments()
      ]);
      setFines(finesRes.data.results || finesRes.data || []);
      setPayments(payRes.data.results || payRes.data || []);
    } catch (err) {
      addToast('Failed to load fine and payment data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingFines = fines.filter((f) => f.status === 'PENDING' && Number(f.remaining_amount) > 0);
  const totalPending = pendingFines.reduce((acc, f) => acc + Number(f.remaining_amount), 0);

  const paymentColumns = [
    {
      header: 'Payment ID',
      accessor: 'payment_id',
      render: (r) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.payment_id}</span>
    },
    {
      header: 'Borrow ID',
      accessor: 'borrow_id',
      render: (r) => <span style={{ fontFamily: 'monospace' }}>{r.borrow_id}</span>
    },
    { header: 'Book Title', accessor: 'book_title' },
    {
      header: 'Fine',
      accessor: 'fine_amount',
      render: (r) => `₹${r.fine_amount}`
    },
    {
      header: 'Paid',
      accessor: 'paid_amount',
      render: (r) => <strong style={{ color: '#10b981' }}>₹{r.paid_amount}</strong>
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
          <h1 className="page-title">Fines & Payment Ledger</h1>
          <p className="page-subtitle">Settle outstanding overdue penalties and review your complete transaction history</p>
        </div>
      </div>

      {/* Pending Fines Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem' }}>Outstanding Fines</h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Total Outstanding: <strong style={{ color: totalPending > 0 ? '#dc2626' : '#10b981' }}>₹{totalPending.toFixed(2)}</strong>
            </span>
          </div>
          {totalPending === 0 && (
            <span className="badge badge-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              <CheckCircle size={16} /> All Fines Cleared
            </span>
          )}
        </div>

        {pendingFines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
            <p>You have no pending library fines. Great job returning books on time!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {pendingFines.map((fine) => (
              <div key={fine.id} style={{
                border: '1px solid #fca5a5',
                background: '#fff5f5',
                borderRadius: '10px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem' }}>
                      {fine.borrow_id}
                    </span>
                    <span className="badge badge-danger">PENDING</span>
                  </div>
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>{fine.book_title}</h4>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                    Total Fine: ₹{fine.amount} • Paid: ₹{fine.paid_amount}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #fed7d7', paddingTop: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Due Now:</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#dc2626' }}>₹{fine.remaining_amount}</span>
                  </div>
                  <button
                    onClick={() => setSelectedFineToPay(fine)}
                    className="btn btn-success btn-sm"
                  >
                    <CreditCard size={14} /> Pay ₹{fine.remaining_amount}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Payment History</h3>
        <DataTable
          columns={paymentColumns}
          data={payments}
          keyField="id"
          emptyMessage="No payment records found."
        />
      </div>

      <PaymentModal
        isOpen={!!selectedFineToPay}
        onClose={() => setSelectedFineToPay(null)}
        fine={selectedFineToPay}
        onPaymentSuccess={() => fetchData()}
      />
    </div>
  );
};

export default StudentFines;

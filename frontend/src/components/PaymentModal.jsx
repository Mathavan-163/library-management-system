import React, { useState } from 'react';
import Modal from './Modal';
import { paymentsAPI } from '../services/api';
import { useToast } from './Toast';
import { CreditCard, ShieldCheck, Banknote } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, fine, onPaymentSuccess }) => {
  const [method, setMethod] = useState('ONLINE');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  if (!fine) return null;

  const remaining = fine.remaining_amount || fine.amount;

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await paymentsAPI.createPayment({
        fine_id: fine.id,
        paid_amount: remaining,
        payment_method: method
      });
      addToast(`Payment of ₹${remaining} recorded successfully!`, 'success');
      if (onPaymentSuccess) {
        onPaymentSuccess(res.data);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Payment failed to process.';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pay Outstanding Fine" maxWidth="460px">
      <form onSubmit={handlePay}>
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '1.25rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
            <span style={{ color: '#64748b' }}>Borrow Reference:</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{fine.borrow_id}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.88rem' }}>
            <span style={{ color: '#64748b' }}>Book Title:</span>
            <span style={{ fontWeight: 600 }}>{fine.book_title}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #cbd5e1', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Amount Payable:</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626' }}>₹{remaining}</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Select Payment Method</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setMethod('ONLINE')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.85rem',
                borderRadius: '8px',
                border: method === 'ONLINE' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                background: method === 'ONLINE' ? '#eff6ff' : '#ffffff',
                color: method === 'ONLINE' ? '#1d4ed8' : '#475569',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <CreditCard size={18} /> Online Gateway
            </button>
            <button
              type="button"
              onClick={() => setMethod('CASH')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.85rem',
                borderRadius: '8px',
                border: method === 'CASH' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                background: method === 'CASH' ? '#eff6ff' : '#ffffff',
                color: method === 'CASH' ? '#1d4ed8' : '#475569',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Banknote size={18} /> Cash Counter
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.6rem',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          padding: '0.75rem',
          borderRadius: '8px',
          fontSize: '0.78rem',
          color: '#166534',
          marginBottom: '1.5rem'
        }}>
          <ShieldCheck size={18} style={{ flexShrink: 0 }} />
          <span>
            Development Mode: This payment workflow records an authentic transaction in the PostgreSQL database ledger with unique TXN reference without real credit card charges.
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn btn-success">
            {loading ? 'Processing...' : `Confirm & Pay ₹${remaining}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentModal;

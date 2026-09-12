import React from 'react';
import Modal from './Modal';
import { Printer, Download, CheckCircle, Clock } from 'lucide-react';

const ReceiptModal = ({ isOpen, onClose, receipt }) => {
  if (!receipt) return null;

  const data = receipt.data || {};
  const isBorrow = receipt.receipt_type === 'BORROW' || data.receipt_type === 'BOOK BORROW RECEIPT';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Standard cross-platform browser print dialog supports "Save as PDF" natively
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Library Receipt" maxWidth="520px">
      <div className="receipt-paper">
        <div className="receipt-header">
          <div className="receipt-title">
            {data.system_title || 'LIBRARY MANAGEMENT SYSTEM'}
          </div>
          <div className="receipt-type-badge">
            {data.receipt_type || (isBorrow ? 'BOOK BORROW RECEIPT' : 'RETURN RECEIPT')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.4rem' }}>
            Receipt Ref: {receipt.receipt_id}
          </div>
        </div>

        <div className="receipt-body">
          <div className="receipt-row">
            <span className="receipt-label">Borrow ID:</span>
            <span className="receipt-val">{data.borrow_id || receipt.borrow_id}</span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Student ID:</span>
            <span className="receipt-val">{data.student_id || receipt.student_id}</span>
          </div>

          <div className="receipt-row">
            <span className="receipt-label">Student Name:</span>
            <span className="receipt-val">{data.student_name || receipt.student_name}</span>
          </div>

          {isBorrow ? (
            <>
              <div className="receipt-row">
                <span className="receipt-label">Book ID:</span>
                <span className="receipt-val">{data.book_id || '-'}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Book Name:</span>
                <span className="receipt-val">{data.book_name || receipt.book_title}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Author:</span>
                <span className="receipt-val">{data.author || '-'}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Borrow Date:</span>
                <span className="receipt-val">{data.borrow_date}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Due Date:</span>
                <span className="receipt-val">{data.due_date}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Status:</span>
                <span className="receipt-val" style={{ color: '#2563eb' }}>
                  {data.status || 'BORROWED'}
                </span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Fine:</span>
                <span className="receipt-val" style={{ color: '#10b981' }}>
                  {data.fine || '₹0'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="receipt-row">
                <span className="receipt-label">Book:</span>
                <span className="receipt-val">{data.book || receipt.book_title}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Borrow Date:</span>
                <span className="receipt-val">{data.borrow_date}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Due Date:</span>
                <span className="receipt-val">{data.due_date}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Return Date:</span>
                <span className="receipt-val">{data.return_date}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Late Days:</span>
                <span className="receipt-val">{data.late_days}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Fine Per Day:</span>
                <span className="receipt-val">{data.fine_per_day}</span>
              </div>
              <div className="receipt-row" style={{ borderTop: '2px solid #0f172a', marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                <span className="receipt-label" style={{ fontWeight: 800, color: '#0f172a' }}>Total Fine:</span>
                <span className="receipt-val" style={{ fontSize: '1.05rem', color: '#b91c1c' }}>{data.total_fine}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-label">Payment Status:</span>
                <span className="receipt-val" style={{
                  color: data.payment_status === 'PAID' ? '#10b981' : '#f59e0b',
                  fontWeight: 800
                }}>
                  {data.payment_status || 'PENDING'}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="receipt-footer">
          This is an official computer-generated receipt from PostgreSQL database.<br />
          Generated on {new Date(receipt.created_at || Date.now()).toLocaleString()}
        </div>
      </div>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button onClick={onClose} className="btn btn-secondary">
          Close
        </button>
        <button onClick={handleDownloadPDF} className="btn btn-secondary" title="Save as PDF using browser print">
          <Download size={16} /> Save / Download PDF
        </button>
        <button onClick={handlePrint} className="btn btn-primary">
          <Printer size={16} /> Print Receipt
        </button>
      </div>
    </Modal>
  );
};

export default ReceiptModal;

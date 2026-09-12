import React, { useState, useEffect } from 'react';
import { receiptsAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import ReceiptModal from '../../components/ReceiptModal';
import DataTable from '../../components/DataTable';
import { Receipt, Eye, Printer, BookmarkCheck, RotateCcw } from 'lucide-react';

const StudentReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const { addToast } = useToast();

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await receiptsAPI.getReceipts();
      setReceipts(res.data.results || res.data || []);
    } catch (err) {
      addToast('Failed to load receipts archive.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const columns = [
    {
      header: 'Receipt ID',
      accessor: 'receipt_id',
      render: (r) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.receipt_id}</span>
    },
    {
      header: 'Type',
      accessor: 'receipt_type',
      render: (r) => {
        const isBorrow = r.receipt_type === 'BORROW';
        return (
          <span className={`badge ${isBorrow ? 'badge-info' : 'badge-success'}`}>
            {isBorrow ? <BookmarkCheck size={12} /> : <RotateCcw size={12} />}
            {r.receipt_type === 'BORROW' ? 'BORROW RECEIPT' : 'RETURN RECEIPT'}
          </span>
        );
      }
    },
    {
      header: 'Borrow Ref',
      accessor: 'borrow_id',
      render: (r) => <span style={{ fontFamily: 'monospace' }}>{r.borrow_id}</span>
    },
    { header: 'Book Title', accessor: 'book_title' },
    {
      header: 'Generated Date',
      accessor: 'created_at',
      render: (r) => new Date(r.created_at).toLocaleString()
    },
    {
      header: 'Action',
      render: (r) => (
        <button
          onClick={() => setSelectedReceipt(r)}
          className="btn btn-secondary btn-sm"
        >
          <Eye size={14} /> View / Print
        </button>
      )
    }
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Receipts Archive</h1>
          <p className="page-subtitle">View, print, and download PDF receipts for all book loans and returns</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={receipts}
        keyField="id"
        emptyMessage="No receipts generated yet."
      />

      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
      />
    </div>
  );
};

export default StudentReceipts;

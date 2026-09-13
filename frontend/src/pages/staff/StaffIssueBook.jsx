import React, { useState, useEffect } from 'react';
import { booksAPI, authAPI, borrowAPI, settingsAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import ReceiptModal from '../../components/ReceiptModal';
import { BookPlus, Search, User, BookOpen, Calendar, CheckCircle } from 'lucide-react';

const StaffIssueBook = () => {
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    const initData = async () => {
      try {
        const [stRes, bkRes, setRes] = await Promise.all([
          authAPI.getStudents(),
          booksAPI.getBooks({ availability: 'available' }),
          settingsAPI.getSettings()
        ]);
        setStudents(stRes.data.results || stRes.data || []);
        setBooks(bkRes.data.results || bkRes.data || []);
        setSettings(setRes.data);
      } catch (err) {
        addToast('Failed to load issuance data.', 'error');
      }
    };
    initData();
  }, []);

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedBookId) {
      addToast('Please select both a student and a book.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await borrowAPI.borrowBook({
        student_id: selectedStudentId,
        book_id: selectedBookId
      });
      addToast('Book issued successfully!', 'success');
      if (res.data.receipt) {
        setReceipt(res.data.receipt);
      }
      // Refresh available books
      const bkRes = await booksAPI.getBooks({ availability: 'available' });
      setBooks(bkRes.data.results || bkRes.data || []);
      setSelectedBookId('');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to issue book.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find((s) => s.student_id === selectedStudentId);
  const selectedBook = books.find((b) => b.book_id === selectedBookId);

  return (
    <div className="page-wrapper" style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Issue Book to Student</h1>
          <p className="page-subtitle">Allocate books, calculate loan deadlines, and produce instant borrow slips</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleIssue}>
          <div className="form-group">
            <label className="form-label">Select Registered Student</label>
            <select
              className="form-select"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
            >
              <option value="">-- Choose Student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.student_id}>
                  {s.student_id} - {s.full_name} ({s.department}) {s.status !== 'ACTIVE' && '[INACTIVE]'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Select Available Book</label>
            <select
              className="form-select"
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              required
            >
              <option value="">-- Choose Book --</option>
              {books.map((b) => (
                <option key={b.id} value={b.book_id}>
                  {b.book_id} - {b.title} by {b.author} ({b.available_quantity} available)
                </option>
              ))}
            </select>
          </div>

          {/* Issue Summary Card */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '1.25rem',
            margin: '1.5rem 0'
          }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#475569' }}>Transaction Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.88rem' }}>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Student:</span>
                <strong>{selectedStudent ? `${selectedStudent.full_name} (${selectedStudent.student_id})` : '-'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Book Title:</span>
                <strong>{selectedBook ? selectedBook.title : '-'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Loan Duration:</span>
                <strong>{settings?.borrow_period_days || 7} Days</strong>
              </div>
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>Daily Overdue Rate:</span>
                <strong>₹{settings?.fine_per_day || '10.00'} / day</strong>
              </div>
            </div>
          </div>

          <div className="responsive-action-row" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={loading || !selectedStudentId || !selectedBookId}
              className="btn btn-primary"
              style={{ padding: '0.75rem 2rem' }}
            >
              <BookPlus size={18} /> {loading ? 'Issuing Book...' : 'Confirm Loan & Print Receipt'}
            </button>
          </div>
        </form>
      </div>

      <ReceiptModal
        isOpen={!!receipt}
        onClose={() => setReceipt(null)}
        receipt={receipt}
      />
    </div>
  );
};

export default StaffIssueBook;

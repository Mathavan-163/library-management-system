import React, { useState, useEffect } from 'react';
import { booksAPI, borrowAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import ReceiptModal from '../../components/ReceiptModal';
import { Search, Filter, BookOpen, CheckCircle, XCircle } from 'lucide-react';

const StudentBooks = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [loading, setLoading] = useState(true);
  const [borrowingId, setBorrowingId] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const { addToast } = useToast();

  const fetchCategories = async () => {
    try {
      const res = await booksAPI.getCategories();
      setCategories(res.data.results || res.data || []);
    } catch (err) {
      console.warn('Failed to load categories');
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      if (availability) params.availability = availability;
      const res = await booksAPI.getBooks(params);
      setBooks(res.data.results || res.data || []);
    } catch (err) {
      addToast('Failed to load books catalog.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [search, selectedCategory, availability]);

  const handleBorrow = async (book) => {
    if (book.available_quantity <= 0) {
      addToast('Book currently unavailable', 'error');
      return;
    }
    setBorrowingId(book.id);
    try {
      const res = await borrowAPI.borrowBook({ book_id: book.book_id });
      addToast(`Successfully borrowed "${book.title}"!`, 'success');
      if (res.data.receipt) {
        setReceipt(res.data.receipt);
      }
      fetchBooks();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to borrow book.', 'error');
    } finally {
      setBorrowingId(null);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Library Book Catalog</h1>
          <p className="page-subtitle">Search, filter, and borrow books instantly from the library collection</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar card" style={{ padding: '1rem' }}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by title, author, ISBN, or Book ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '160px' }}
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
        >
          <option value="">All Availability</option>
          <option value="available">Available Only</option>
          <option value="unavailable">Currently Out of Stock</option>
        </select>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Loading books collection...</div>
      ) : books.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
          <p>No books matched your search and filter criteria.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {books.map((book) => {
            const isAvailable = book.available_quantity > 0;
            return (
              <div key={book.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    background: '#f1f5f9',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    color: '#475569'
                  }}>
                    {book.book_id}
                  </span>
                  <span className={`badge ${isAvailable ? 'badge-success' : 'badge-danger'}`}>
                    {isAvailable ? `${book.available_quantity} of ${book.total_quantity} Available` : 'Out of Stock'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', color: '#0f172a' }}>{book.title}</h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  by <strong>{book.author}</strong> {book.category_name && `• ${book.category_name}`}
                </div>

                <p style={{
                  fontSize: '0.85rem',
                  color: '#475569',
                  lineHeight: 1.5,
                  marginBottom: '1.25rem',
                  flex: 1,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {book.description || 'Standard library edition textbook and reference resource.'}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-color)'
                }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    ISBN: {book.isbn || 'N/A'}
                  </span>
                  <button
                    onClick={() => handleBorrow(book)}
                    disabled={!isAvailable || borrowingId === book.id}
                    className={`btn btn-sm ${isAvailable ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    <BookOpen size={14} />
                    {!isAvailable
                      ? 'Book currently unavailable'
                      : borrowingId === book.id
                      ? 'Borrowing...'
                      : 'Borrow Book'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ReceiptModal
        isOpen={!!receipt}
        onClose={() => setReceipt(null)}
        receipt={receipt}
      />
    </div>
  );
};

export default StudentBooks;

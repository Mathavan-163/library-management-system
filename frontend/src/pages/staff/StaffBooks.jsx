import React, { useState, useEffect } from 'react';
import { booksAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import Modal from '../../components/Modal';
import DataTable from '../../components/DataTable';
import { Plus, Search, Edit2, Trash2, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StaffBooks = () => {
  const { role } = useAuth();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category_id: '',
    total_quantity: 5,
    available_quantity: 5,
    description: '',
  });
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
      const res = await booksAPI.getBooks(params);
      setBooks(res.data.results || res.data || []);
    } catch (err) {
      addToast('Failed to load books.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [search, selectedCategory]);

  const handleOpenAdd = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      isbn: '',
      category_id: categories[0]?.id || '',
      total_quantity: 5,
      available_quantity: 5,
      description: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (book) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn || '',
      category_id: book.category || '',
      total_quantity: book.total_quantity,
      available_quantity: book.available_quantity,
      description: book.description || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await booksAPI.updateBook(editingBook.id, formData);
        addToast('Book updated successfully!', 'success');
      } else {
        await booksAPI.createBook(formData);
        addToast('Book added successfully!', 'success');
      }
      setModalOpen(false);
      fetchBooks();
    } catch (err) {
      const errors = err.response?.data;
      let msg = 'Failed to save book.';
      if (typeof errors === 'object') {
        msg = Object.entries(errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join(' | ');
      }
      addToast(msg, 'error');
    }
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`Are you sure you want to delete "${book.title}"?`)) return;
    try {
      await booksAPI.deleteBook(book.id);
      addToast('Book deleted successfully.', 'success');
      fetchBooks();
    } catch (err) {
      addToast('Failed to delete book.', 'error');
    }
  };

  const columns = [
    {
      header: 'Book ID',
      accessor: 'book_id',
      render: (r) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.book_id}</span>
    },
    {
      header: 'Title & Author',
      accessor: 'title',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.title}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>by {r.author} • ISBN: {r.isbn || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Category',
      accessor: 'category_name',
      render: (r) => r.category_name ? <span className="badge badge-info">{r.category_name}</span> : '-'
    },
    {
      header: 'Total Copies',
      accessor: 'total_quantity',
      render: (r) => <strong>{r.total_quantity}</strong>
    },
    {
      header: 'Available',
      accessor: 'available_quantity',
      render: (r) => (
        <span className={`badge ${r.available_quantity > 0 ? 'badge-success' : 'badge-danger'}`}>
          {r.available_quantity} Avail
        </span>
      )
    },
    {
      header: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => handleOpenEdit(r)} className="btn btn-secondary btn-sm">
            <Edit2 size={14} /> Edit
          </button>
          {role === 'ADMIN' && (
            <button onClick={() => handleDelete(r)} className="btn btn-danger btn-sm">
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Library Books Inventory</h1>
          <p className="page-subtitle">Add new acquisitions, update inventory counts, and categorize catalogue</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} /> Add New Book
        </button>
      </div>

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
      </div>

      <DataTable
        columns={columns}
        data={books}
        keyField="id"
        emptyMessage="No books found."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBook ? 'Edit Book Record' : 'Add New Book to Collection'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Book Title</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Author</label>
              <input
                type="text"
                className="form-input"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">ISBN</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 978-0134076430"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Total Quantity</label>
              <input
                type="number"
                min={0}
                className="form-input"
                value={formData.total_quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setFormData({
                    ...formData,
                    total_quantity: val,
                    available_quantity: editingBook ? Math.min(val, formData.available_quantity) : val
                  });
                }}
                required
              />
            </div>
          </div>

          {editingBook && (
            <div className="form-group">
              <label className="form-label">Available Quantity</label>
              <input
                type="number"
                min={0}
                max={formData.total_quantity}
                className="form-input"
                value={formData.available_quantity}
                onChange={(e) => setFormData({ ...formData, available_quantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Description / Synopsis</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingBook ? 'Save Changes' : 'Add Book'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffBooks;

import React, { useState, useEffect } from 'react';
import { booksAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Plus, Edit2, Trash2, Tags } from 'lucide-react';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const { addToast } = useToast();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await booksAPI.getCategories();
      setCategories(res.data.results || res.data || []);
    } catch (err) {
      addToast('Failed to load categories.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({ name: cat.name, description: cat.description || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await booksAPI.updateCategory(editingCategory.id, formData);
        addToast('Category updated successfully!', 'success');
      } else {
        await booksAPI.createCategory(formData);
        addToast('Category created successfully!', 'success');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      addToast(err.response?.data?.name?.[0] || 'Failed to save category.', 'error');
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? Books in this category will become unassigned.`)) return;
    try {
      await booksAPI.deleteCategory(cat.id);
      addToast('Category deleted.', 'success');
      fetchCategories();
    } catch (err) {
      addToast('Failed to delete category.', 'error');
    }
  };

  const columns = [
    {
      header: 'Category Name',
      accessor: 'name',
      render: (r) => <strong>{r.name}</strong>
    },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Books Count',
      accessor: 'book_count',
      render: (r) => <span className="badge badge-info">{r.book_count || 0} Titles</span>
    },
    {
      header: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => handleOpenEdit(r)} className="btn btn-secondary btn-sm">
            <Edit2 size={14} /> Edit
          </button>
          <button onClick={() => handleDelete(r)} className="btn btn-danger btn-sm">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Category Management</h1>
          <p className="page-subtitle">Organize books into academic disciplines and genres</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} /> Add Category
        </button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        keyField="id"
        emptyMessage="No categories created yet."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Category Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Computer Science"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Brief description of subject area..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCategories;

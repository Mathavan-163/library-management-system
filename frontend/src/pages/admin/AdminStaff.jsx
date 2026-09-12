import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Plus, Search, Edit2, Trash2, UserCheck, UserX, Briefcase } from 'lucide-react';

const AdminStaff = () => {
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    department: 'Library Operations',
    status: 'ACTIVE',
  });
  const { addToast } = useToast();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await authAPI.getStaff({ search });
      setStaffList(res.data || []);
    } catch (err) {
      addToast('Failed to load staff records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      department: 'Library Operations',
      status: 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      username: staff.username,
      email: staff.email,
      password: '',
      first_name: staff.first_name,
      last_name: staff.last_name,
      phone: staff.staff_profile?.phone || '',
      department: staff.staff_profile?.department || 'Library Operations',
      status: staff.staff_profile?.status || 'ACTIVE',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await authAPI.updateStaff(editingStaff.id, formData);
        addToast('Staff member updated successfully!', 'success');
      } else {
        await authAPI.createStaff(formData);
        addToast('Staff member created with auto-allocated Staff ID!', 'success');
      }
      setModalOpen(false);
      fetchStaff();
    } catch (err) {
      const errors = err.response?.data?.errors;
      let msg = 'Failed to save staff record.';
      if (errors) {
        msg = Object.entries(errors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`)
          .join(' | ');
      }
      addToast(msg, 'error');
    }
  };

  const handleDelete = async (staff) => {
    if (!window.confirm(`Are you sure you want to delete staff account "${staff.username}"?`)) return;
    try {
      await authAPI.deleteStaff(staff.id);
      addToast('Staff account deleted successfully.', 'success');
      fetchStaff();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to delete staff.', 'error');
    }
  };

  const handleToggleStatus = async (staff) => {
    try {
      await authAPI.toggleStaffStatus(staff.id);
      addToast('Staff status updated.', 'success');
      fetchStaff();
    } catch (err) {
      addToast('Failed to toggle staff status.', 'error');
    }
  };

  const columns = [
    {
      header: 'Staff ID',
      render: (r) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.staff_profile?.staff_id || 'STF...'}</span>
    },
    {
      header: 'Full Name',
      accessor: 'full_name',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.full_name}</div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>@{r.username}</span>
        </div>
      )
    },
    { header: 'Email', accessor: 'email' },
    {
      header: 'Phone',
      render: (r) => r.staff_profile?.phone || <span style={{ color: '#94a3b8' }}>-</span>
    },
    {
      header: 'Department',
      render: (r) => r.staff_profile?.department || 'Library'
    },
    {
      header: 'Status',
      render: (r) => (
        <span className={`badge ${r.staff_profile?.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
          {r.staff_profile?.status || 'ACTIVE'}
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
          <button
            onClick={() => handleToggleStatus(r)}
            className={`btn btn-sm ${r.staff_profile?.status === 'ACTIVE' ? 'btn-secondary' : 'btn-success'}`}
            title="Toggle Account Status"
          >
            {r.staff_profile?.status === 'ACTIVE' ? <UserX size={14} /> : <UserCheck size={14} />}
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
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">Configure circulation staff accounts, assign roles, and allocate Staff IDs (STF001, STF002...)</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} /> Add Staff Member
        </button>
      </div>

      <div className="filter-bar card" style={{ padding: '1rem' }}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search staff by username, name, email, or Staff ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={staffList}
        keyField="id"
        emptyMessage="No staff members registered."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStaff ? 'Edit Staff Account' : 'Add New Staff Member'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Password {editingStaff && '(leave blank to keep)'}</label>
              <input
                type="password"
                className="form-input"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!editingStaff}
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Department / Desk</label>
              <input
                type="text"
                className="form-input"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Account Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingStaff ? 'Save Changes' : 'Create Staff'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminStaff;

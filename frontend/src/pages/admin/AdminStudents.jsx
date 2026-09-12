import React, { useState, useEffect } from 'react';
import { authAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import DataTable from '../../components/DataTable';
import { Search, UserCheck, UserX, Users } from 'lucide-react';

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const { addToast } = useToast();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (departmentFilter) params.department = departmentFilter;
      const res = await authAPI.getStudents(params);
      setStudents(res.data.results || res.data || []);
    } catch (err) {
      addToast('Failed to load students roster.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, statusFilter, departmentFilter]);

  const handleToggleStatus = async (student) => {
    setTogglingId(student.id);
    const newStatus = student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await authAPI.updateStudent(student.id, { status: newStatus });
      addToast(`Student ${student.student_id} account marked as ${newStatus}.`, 'success');
      fetchStudents();
    } catch (err) {
      addToast('Failed to update student account status.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    {
      header: 'Student ID',
      accessor: 'student_id',
      render: (r) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.student_id}</span>
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
      accessor: 'phone',
      render: (r) => r.phone || <span style={{ color: '#94a3b8' }}>-</span>
    },
    { header: 'Department', accessor: 'department' },
    {
      header: 'Date Joined',
      accessor: 'date_joined',
      render: (r) => new Date(r.date_joined).toLocaleDateString()
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => (
        <span className={`badge ${r.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
          {r.status}
        </span>
      )
    },
    {
      header: 'Account Access',
      render: (r) => (
        <button
          onClick={() => handleToggleStatus(r)}
          disabled={togglingId === r.id}
          className={`btn btn-sm ${r.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
        >
          {r.status === 'ACTIVE' ? (
            <><UserX size={14} /> Deactivate</>
          ) : (
            <><UserCheck size={14} /> Activate</>
          )}
        </button>
      )
    }
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Management</h1>
          <p className="page-subtitle">View student details, verify auto-allocated IDs, and manage borrowing permissions</p>
        </div>
      </div>

      <div className="filter-bar card" style={{ padding: '1rem' }}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by Student ID, name, email, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Electrical Engineering">Electrical Engineering</option>
          <option value="Mechanical Engineering">Mechanical Engineering</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Physics">Physics</option>
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '150px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active Accounts</option>
          <option value="INACTIVE">Inactive Accounts</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={students}
        keyField="id"
        emptyMessage="No students found."
      />
    </div>
  );
};

export default AdminStudents;

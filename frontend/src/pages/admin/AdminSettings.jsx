import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api';
import { useToast } from '../../components/Toast';
import { Settings, Save, CheckCircle2, Shield } from 'lucide-react';

const AdminSettings = () => {
  const [formData, setFormData] = useState({
    borrow_period_days: 7,
    fine_per_day: '10.00',
    library_name: 'Library Management System',
    contact_email: 'admin@library.edu',
    contact_phone: '+91 98765 43210',
    address: 'Central Campus Library, Block A',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsAPI.getSettings();
      if (res.data) {
        setFormData({
          borrow_period_days: res.data.borrow_period_days,
          fine_per_day: res.data.fine_per_day,
          library_name: res.data.library_name,
          contact_email: res.data.contact_email,
          contact_phone: res.data.contact_phone,
          address: res.data.address,
        });
      }
    } catch (err) {
      addToast('Failed to load library configuration from PostgreSQL.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsAPI.updateSettings(formData);
      addToast('Library settings saved to PostgreSQL successfully!', 'success');
      fetchSettings();
    } catch (err) {
      addToast('Failed to save settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem' }}>Loading settings...</div>;
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Library System Settings</h1>
          <p className="page-subtitle">Configure loan periods, late return penalties, and institutional contact details</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.85rem',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Shield size={16} color="#2563eb" />
            <span>
              Values configured here are stored directly in PostgreSQL (<code>core_settings_librarysetting</code>) and immediately govern all borrowing transactions and fine calculations.
            </span>
          </div>

          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            Loan Rules & Overdue Rates
          </h3>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Default Borrow Period (Days)</label>
              <input
                type="number"
                min={1}
                max={365}
                className="form-input"
                value={formData.borrow_period_days}
                onChange={(e) => setFormData({ ...formData, borrow_period_days: parseInt(e.target.value) || 7 })}
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Standard loan window calculated automatically upon student checkout.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Daily Fine Rate (₹ per late day)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="form-input"
                value={formData.fine_per_day}
                onChange={(e) => setFormData({ ...formData, fine_per_day: e.target.value })}
                required
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Formula: Fine = Late Days × Fine Per Day (₹10 default).
              </span>
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', margin: '1.5rem 0 1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            Institution Information (Printed on Receipts)
          </h3>

          <div className="form-group">
            <label className="form-label">Library / Institution Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.library_name}
              onChange={(e) => setFormData({ ...formData, library_name: e.target.value })}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="form-input"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Physical Address</label>
            <textarea
              className="form-textarea"
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
              <Save size={16} /> {saving ? 'Updating Database...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;

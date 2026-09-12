import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { LogIn, Lock, User, BookOpen } from 'lucide-react';

const LoginPage = ({ onNavigate }) => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usernameOrEmail || !password) {
      addToast('Please enter both username/email and password.', 'error');
      return;
    }
    setLoading(true);
    try {
      const user = await login(usernameOrEmail, password);
      addToast(`Welcome back, ${user.first_name || user.username}!`, 'success');
      onNavigate('dashboard');
    } catch (err) {
      const errorMsg =
        err.response?.data?.errors?.non_field_errors?.[0] ||
        err.response?.data?.errors?.detail ||
        err.response?.data?.errors?.username_or_email?.[0] ||
        'Invalid credentials. Please check your username/email and password.';
      addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u, p) => {
    setUsernameOrEmail(u);
    setPassword(p);
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 68px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '2.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            marginBottom: '1rem',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
          }}>
            <BookOpen size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Account Login</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Access your role-based library dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="e.g. admin or student@univ.edu"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
          >
            <LogIn size={18} /> {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            New Student?{' '}
            <button
              onClick={() => onNavigate('register')}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}
            >
              Create Student Account
            </button>
          </span>
        </div>

        <div style={{ marginTop: '1.25rem', background: '#f8fafc', borderRadius: '8px', padding: '0.85rem', fontSize: '0.78rem' }}>
          <div style={{ fontWeight: 700, color: '#475569', marginBottom: '0.4rem' }}>Demo Shortcuts:</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('admin', 'Admin@123')}
            >
              Fill Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => handleQuickLogin('staff_jane', 'Staff@123')}
            >
              Fill Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

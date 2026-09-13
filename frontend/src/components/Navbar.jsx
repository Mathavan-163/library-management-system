import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogOut, User as UserIcon, Shield, Briefcase, GraduationCap, Menu } from 'lucide-react';

const Navbar = ({ onNavigate, onLogout, onMenuToggle }) => {
  const { user, role, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="badge" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' }}>
            <Shield size={12} /> ADMIN
          </span>
        );
      case 'STAFF':
        return (
          <span className="badge" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' }}>
            <Briefcase size={12} /> STAFF
          </span>
        );
      case 'STUDENT':
        return (
          <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd' }}>
            <GraduationCap size={12} /> STUDENT
          </span>
        );
      default:
        return null;
    }
  };

  const getIdentifier = () => {
    if (role === 'STUDENT') {
      return user?.student_profile?.student_id || 'Student';
    }
    if (role === 'STAFF') {
      return user?.staff_profile?.staff_id || 'Staff';
    }
    return 'Admin';
  };

  return (
    <header className="app-navbar" style={{
      height: '68px',
      background: '#ffffff',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }} onClick={() => onNavigate('dashboard')}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
        }}>
          <BookOpen size={22} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Library Management System
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            PostgreSQL Database Edition
          </span>
        </div>
      </div>

      {user && (
        <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div className="navbar-user" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'right' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                  {user.first_name || user.username}
                </span>
                {getRoleBadge()}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>
                {getIdentifier()} • {user.email}
              </span>
            </div>
            <button
              onClick={() => onNavigate('profile')}
              title="View Profile"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#f1f5f9',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#475569',
                cursor: 'pointer'
              }}
            >
              <UserIcon size={18} />
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-secondary btn-sm"
            title="Log out"
            style={{ color: '#dc2626', borderColor: '#fecaca', background: '#fff5f5' }}
          >
            <LogOut size={16} /> Logout
          </button>
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={onMenuToggle}
            aria-label="Open navigation menu"
            title="Open navigation menu"
          >
            <Menu size={21} />
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;

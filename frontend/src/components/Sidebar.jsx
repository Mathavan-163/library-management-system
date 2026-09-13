import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, BookOpen, BookmarkCheck, ClockAlert,
  CreditCard, Receipt, User, Users, Briefcase,
  FileText, BookPlus, BookDown, Tags, BarChart3, Settings
} from 'lucide-react';

const Sidebar = ({ activeTab, onSelectTab, isOpen = false, onClose }) => {
  const { role } = useAuth();

  const studentNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'Book Catalog', icon: BookOpen },
    { id: 'borrows', label: 'My Borrowed Books', icon: BookmarkCheck },
    { id: 'overdue', label: 'Overdue Books', icon: ClockAlert },
    { id: 'fines', label: 'Fines & Payments', icon: CreditCard },
    { id: 'receipts', label: 'My Receipts', icon: Receipt },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  const staffNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'Books Management', icon: BookOpen },
    { id: 'issue', label: 'Issue Books', icon: BookPlus },
    { id: 'returns', label: 'Accept Returns', icon: BookDown },
    { id: 'borrows', label: 'Borrow Records', icon: FileText },
    { id: 'overdue', label: 'Overdue Tracking', icon: ClockAlert },
    { id: 'students', label: 'Students Roster', icon: Users },
    { id: 'fines', label: 'Fines & Payments', icon: CreditCard },
    { id: 'profile', label: 'Staff Profile', icon: User },
  ];

  const adminNav = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'books', label: 'Books Inventory', icon: BookOpen },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'students', label: 'Student Management', icon: Users },
    { id: 'staff', label: 'Staff Management', icon: Briefcase },
    { id: 'borrows', label: 'Borrow Records', icon: FileText },
    { id: 'overdue', label: 'Overdue Monitoring', icon: ClockAlert },
    { id: 'payments', label: 'Payment Ledger', icon: CreditCard },
    { id: 'reports', label: 'Reports & Audits', icon: BarChart3 },
    { id: 'settings', label: 'Library Settings', icon: Settings },
    { id: 'profile', label: 'Admin Profile', icon: User },
  ];

  const navItems = role === 'ADMIN' ? adminNav : role === 'STAFF' ? staffNav : studentNav;

  return (
    <>
      <button className={`sidebar-overlay ${isOpen ? 'is-visible' : ''}`} onClick={onClose} aria-label="Close navigation menu" />
      <aside className={`app-sidebar ${isOpen ? 'is-open' : ''}`} style={{
      width: '260px',
      background: '#0f172a',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid #1e293b'
    }}>
      <div style={{ padding: '1.5rem 1.25rem 0.75rem', borderBottom: '1px solid #1e293b' }}>
        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', fontWeight: 700 }}>
          {role} NAVIGATION
        </span>
      </div>

      <nav style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#2563eb' : 'transparent',
                color: isActive ? '#ffffff' : '#94a3b8',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#1e293b';
                  e.currentTarget.style.color = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#94a3b8';
                }
              }}
            >
              <Icon size={18} color={isActive ? '#ffffff' : '#94a3b8'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid #1e293b', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
        PostgreSQL Connected • v1.0
      </div>
      </aside>
    </>
  );
};

export default Sidebar;

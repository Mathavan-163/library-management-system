import React from 'react';
import { BookOpen, Shield, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

const HomePage = ({ onNavigate }) => {
  return (
    <div style={{ minHeight: 'calc(100vh - 68px)', background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 1rem',
          background: '#dbeafe',
          color: '#1e40af',
          borderRadius: '9999px',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1.5rem'
        }}>
          <Shield size={16} /> Production-Style Full-Stack Application
        </div>

        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: '1.25rem' }}>
          Modern Library Management System
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#475569', maxWidth: '720px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          A unified library system powered by <strong>PostgreSQL</strong> and <strong>Django REST Framework</strong> with atomic borrow/return transactions, automated fine calculations, role-based security, and printable receipts.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
          <button onClick={() => onNavigate('login')} className="btn btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
            Login to Portal <ArrowRight size={18} />
          </button>
          <button onClick={() => onNavigate('register')} className="btn btn-secondary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
            Register as Student
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', textAlign: 'left' }}>
          <div className="card">
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <BookOpen size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Student Portal</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Auto-generated Student ID (<code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>STU001</code>), real-time catalog search, one-click borrow with instant receipts, fine payment ledger, and return status tracking.
            </p>
            <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={14} /> Student self-service
            </div>
          </div>

          <div className="card">
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f0fdf4', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Staff Circulation Desk</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Issue and accept returned books, automatic backend fine computation, overdue loans tracking, student rosters, and immediate receipt printing.
            </p>
            <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={14} /> Desk workflow automation
            </div>
          </div>

          <div className="card">
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Shield size={24} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>Admin Control Center</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Live PostgreSQL aggregation dashboards (Total Fine Generated, Paid, and Pending), inventory CRUD, staff management, configurable borrow periods, and fine rates.
            </p>
            <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={14} /> Zero mock data
            </div>
          </div>
        </div>

        <div style={{ marginTop: '3.5rem', padding: '1.5rem', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'inline-flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, display: 'block' }}>Default Admin</span>
            <span style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>admin / Admin@123</span>
          </div>
          <div style={{ width: '1px', background: '#e2e8f0' }} />
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, display: 'block' }}>Default Staff</span>
            <span style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>staff_jane / Staff@123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

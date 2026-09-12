import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Public pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentBooks from './pages/student/StudentBooks';
import StudentBorrows from './pages/student/StudentBorrows';
import StudentFines from './pages/student/StudentFines';
import StudentReceipts from './pages/student/StudentReceipts';
import StudentProfile from './pages/student/StudentProfile';

// Staff pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffBooks from './pages/staff/StaffBooks';
import StaffIssueBook from './pages/staff/StaffIssueBook';
import StaffReturns from './pages/staff/StaffReturns';
import StaffBorrowRecords from './pages/staff/StaffBorrowRecords';
import StaffOverdue from './pages/staff/StaffOverdue';
import StaffFines from './pages/staff/StaffFines';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminStaff from './pages/admin/AdminStaff';
import AdminPayments from './pages/admin/AdminPayments';
import AdminCategories from './pages/admin/AdminCategories';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';

const AppContent = () => {
  const { isAuthenticated, role, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [publicPage, setPublicPage] = useState('home'); // 'home' | 'login' | 'register'

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ color: '#475569', fontWeight: 600 }}>Connecting to Library Management System...</div>
        </div>
      </div>
    );
  }

  // Not authenticated: render public views
  if (!isAuthenticated) {
    return (
      <div className="app-container" style={{ flexDirection: 'column' }}>
        <Navbar onNavigate={(page) => setPublicPage(page === 'dashboard' ? 'home' : page)} />
        <main className="main-content">
          {publicPage === 'home' && <HomePage onNavigate={setPublicPage} />}
          {publicPage === 'login' && <LoginPage onNavigate={setPublicPage} />}
          {publicPage === 'register' && <RegisterPage onNavigate={setPublicPage} />}
        </main>
      </div>
    );
  }

  // Render role-specific views with route protection
  const renderRoleView = () => {
    if (role === 'STUDENT') {
      switch (activeTab) {
        case 'dashboard':
          return <StudentDashboard onNavigate={setActiveTab} />;
        case 'books':
          return <StudentBooks />;
        case 'borrows':
        case 'overdue':
          return <StudentBorrows />;
        case 'fines':
          return <StudentFines />;
        case 'receipts':
          return <StudentReceipts />;
        case 'profile':
          return <StudentProfile />;
        default:
          return <StudentDashboard onNavigate={setActiveTab} />;
      }
    }

    if (role === 'STAFF') {
      switch (activeTab) {
        case 'dashboard':
          return <StaffDashboard onNavigate={setActiveTab} />;
        case 'books':
          return <StaffBooks />;
        case 'issue':
          return <StaffIssueBook />;
        case 'returns':
          return <StaffReturns />;
        case 'borrows':
          return <StaffBorrowRecords />;
        case 'overdue':
          return <StaffOverdue />;
        case 'students':
          return <AdminStudents />;
        case 'fines':
          return <StaffFines />;
        case 'profile':
          return <StudentProfile />;
        default:
          return <StaffDashboard onNavigate={setActiveTab} />;
      }
    }

    if (role === 'ADMIN') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard onNavigate={setActiveTab} />;
        case 'books':
          return <StaffBooks />;
        case 'categories':
          return <AdminCategories />;
        case 'students':
          return <AdminStudents />;
        case 'staff':
          return <AdminStaff />;
        case 'borrows':
          return <StaffBorrowRecords />;
        case 'overdue':
          return <StaffOverdue />;
        case 'payments':
          return <AdminPayments />;
        case 'reports':
          return <AdminReports />;
        case 'settings':
          return <AdminSettings />;
        case 'profile':
          return <StudentProfile />;
        default:
          return <AdminDashboard onNavigate={setActiveTab} />;
      }
    }

    return <div>Unknown user role.</div>;
  };

  return (
    <div className="app-container" style={{ flexDirection: 'column' }}>
      <Navbar onNavigate={setActiveTab} />
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 68px)' }}>
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <main className="main-content">
          {renderRoleView()}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;

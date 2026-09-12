import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach DRF Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('library_token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('library_token');
      localStorage.removeItem('library_user');
      // Dispatch custom event to notify auth context
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (data) => api.post('/auth/register/', data),
  logout: () => api.post('/auth/logout/'),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.put('/auth/profile/', data),
  getStudents: (params) => api.get('/auth/students/', { params }),
  updateStudent: (id, data) => api.patch(`/auth/students/${id}/`, data),
  getStaff: (params) => api.get('/auth/staff/', { params }),
  createStaff: (data) => api.post('/auth/staff/', data),
  updateStaff: (id, data) => api.put(`/auth/staff/${id}/`, data),
  deleteStaff: (id) => api.delete(`/auth/staff/${id}/`),
  toggleStaffStatus: (id) => api.post(`/auth/staff/${id}/toggle-status/`),
};

// Books Services
export const booksAPI = {
  getBooks: (params) => api.get('/books/', { params }),
  getBook: (id) => api.get(`/books/${id}/`),
  createBook: (data) => api.post('/books/', data),
  updateBook: (id, data) => api.put(`/books/${id}/`, data),
  patchBook: (id, data) => api.patch(`/books/${id}/`, data),
  deleteBook: (id) => api.delete(`/books/${id}/`),
  getCategories: () => api.get('/books/categories/'),
  createCategory: (data) => api.post('/books/categories/', data),
  updateCategory: (id, data) => api.put(`/books/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/books/categories/${id}/`),
};

// Borrowing Services
export const borrowAPI = {
  borrowBook: (data) => api.post('/borrow/', data),
  returnBook: (id) => api.post(`/borrow/${id}/return/`),
  getBorrowRecords: (params) => api.get('/borrow/list/', { params }),
  getMyBorrows: (params) => api.get('/borrow/my/', { params }),
  getOverdueBorrows: (params) => api.get('/borrow/overdue/', { params }),
};

// Fines & Payments Services
export const paymentsAPI = {
  getFines: (params) => api.get('/payments/fines/', { params }),
  getMyFines: () => api.get('/payments/fines/my/'),
  getPayments: (params) => api.get('/payments/records/', { params }),
  getMyPayments: () => api.get('/payments/records/my/'),
  createPayment: (data) => api.post('/payments/records/', data),
};

// Receipts Services
export const receiptsAPI = {
  getReceipts: (params) => api.get('/receipts/', { params }),
  getReceipt: (id) => api.get(`/receipts/${id}/`),
};

// Dashboard & Reports Services
export const dashboardAPI = {
  getAdminDashboard: () => api.get('/dashboard/admin/'),
  getStaffDashboard: () => api.get('/dashboard/staff/'),
  getStudentDashboard: () => api.get('/dashboard/student/'),
  getReports: (params) => api.get('/dashboard/reports/', { params }),
};

// Settings Services
export const settingsAPI = {
  getSettings: () => api.get('/settings/'),
  updateSettings: (data) => api.put('/settings/', data),
};

export default api;

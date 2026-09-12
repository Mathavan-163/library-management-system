# Library Management System

A complete, production-grade Library Management System full-stack web application built with **React.js**, **Django REST Framework**, and a real **PostgreSQL** database.

The application enforces strict role-based access control across **Student**, **Staff**, and **Admin** roles, featuring atomic database transactions (`select_for_update` + `transaction.atomic()`) for book borrowing and returns, automatic backend-driven fine calculation, development-safe payment ledger tracking with unique transaction references, and printable/downloadable official receipts.

---

## Key Features

### 1. Student Module
- **Self Registration**: Unique auto-incrementing Student ID generated automatically (`STU001`, `STU002`, `STU003`...).
- **Authentication**: Token-based login with password hashing (PBKDF2).
- **Student Dashboard**: Live PostgreSQL counts for Total Borrowed, Currently Borrowed, Returned, and Outstanding Fines.
- **Book Catalog & Search**: Real-time filtering by category, search by title/author/ISBN, and live stock indicator.
- **One-Click Borrowing**: Available copies decrease by 1 atomically. Disallows borrowing when available quantity is 0 ("Book currently unavailable").
- **Loan Deadlines**: Configurable borrowing period (default 7 days) automatically calculates due date upon checkout.
- **Instant Borrow Receipt**: Auto-generates official `BOOK BORROW RECEIPT` with Print & Save as PDF functionality.
- **Return & Fine Settlement**: Return books, inspect late days and backend-calculated fines (₹10/day default), settle outstanding fines with simulated safe online/cash payment, and print `RETURN RECEIPT`.

### 2. Staff Circulation Module
- **Desk Workflow**: Issue books to registered students and accept book returns.
- **Automatic Fine Calculation**: Backend is the single source of truth for overdue penalties.
- **Overdue Monitoring**: Dynamically lists active overdue loans and accrued fines without waiting for return.
- **Inventory Management**: Add and update book titles, quantities, and category associations.
- **Audit Logs**: View all historical and active loan records and student rosters.
- **Security Constraints**: Staff cannot create admin accounts, delete admins, or escalate permissions.

### 3. Admin Control Center
- **Aggregated Dashboard**: Direct SQL aggregations on PostgreSQL:
  - Total Students, Total Staff, Total Books, Available Books
  - Borrowed Books, Returned Books, Overdue Books
  - Total Fine Generated (`SUM(amount)` from Fine records)
  - Total Fine Paid (`SUM(paid_amount)` from Payment records)
  - Total Fine Pending (`Generated - Paid`)
  - Total Payments count and Total Payment Amount
- **Staff Management**: Add, edit, delete, activate/deactivate staff accounts with auto-allocated IDs (`STF001`, `STF002`...).
- **Student Management**: Full roster inspection and account activation/deactivation toggles.
- **Payment Ledger**: Audit table with Payment ID (`PAY001`), Student ID, Borrow ID, Fine Amount, Paid Amount, Method, and Transaction Reference (`TXN...`).
- **Reports & Audits**: Filterable reports by date range, student, book, and payment status.
- **System Settings**: Modify borrowing period (days), fine rate (₹/day), library title, and contact details directly in the PostgreSQL database.

---

## Technologies Used

- **Frontend**:
  - React 19 + Vite
  - HTML5 & Clean CSS3 (Custom Responsive Design System)
  - JavaScript (ES6+) & Axios API Client
  - Lucide React Icons
- **Backend**:
  - Python 3.14
  - Django 5.2 & Django REST Framework (DRF)
  - Token Authentication & Custom Role Permissions
  - Django Database Transactions (`transaction.atomic`)
- **Database**:
  - PostgreSQL 18
  - `psycopg2-binary` driver
  - Strictly zero mock or fake data

---

## Default User Accounts & Credentials

| Role | Username | Password | ID Code | Email |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `Admin@123` | N/A | `admin@library.edu` |
| **Staff** | `staff_jane` | `Staff@123` | `STF001` | `jane@library.edu` |
| **Student** | Self-registered or `mathavan_test` | `StudentPassword123!` | `STU001` | `mathavan.test@institution.edu` |

---

## Project Structure

```
Library/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env
│   ├── .env.example
│   ├── test_complete_flow.py          # Automated 21-step verification script
│   ├── config/                        # Settings, URLs, WSGI, ASGI
│   ├── accounts/                      # Custom User, StudentProfile, StaffProfile
│   ├── books/                         # Book, Category, Inventory management
│   ├── core_settings/                 # LibrarySetting (PostgreSQL stored config)
│   ├── borrowing/                     # BorrowRecord, Atomic Borrow & Return logic
│   ├── payments/                      # Fine & Payment ledger (PAY..., TXN...)
│   ├── receipts/                      # Immutable receipt snapshots & services
│   └── dashboard/                     # PostgreSQL aggregations & reporting views
└── frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── index.css                  # Modern design system & print styles
        ├── App.jsx                    # Role-based router & layout wrapper
        ├── main.jsx                   # Entry point
        ├── context/AuthContext.jsx    # Auth state & token persistence
        ├── services/api.js            # Axios client with interceptors
        ├── components/                # Navbar, Sidebar, StatsCard, DataTable, Modals, Toasts
        └── pages/
            ├── public/                # Home, Login, Register
            ├── student/               # Dashboard, Books, Borrows, Fines, Receipts, Profile
            ├── staff/                 # Dashboard, Books, Issue, Returns, Borrows, Overdue, Fines
            └── admin/                 # Dashboard, Books, Categories, Students, Staff, Payments, Reports, Settings
```

---

## Getting Started & Setup Instructions

### 1. PostgreSQL Database Setup
Ensure PostgreSQL is running locally on port `5432`. Create the database `library_db`:

```sql
CREATE DATABASE library_db;
```

### 2. Backend Setup (Django)

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables (.env)
# Verify DB_NAME=library_db, DB_USER=postgres, DB_PASSWORD=your_password, DB_HOST=127.0.0.1, DB_PORT=5432

# Apply database migrations to PostgreSQL
python manage.py makemigrations accounts books core_settings receipts borrowing payments dashboard
python manage.py migrate

# Populate initial settings, admin, staff, categories, and books
python manage.py seed_data

# Run the 21-step end-to-end automated test suite
python test_complete_flow.py

# Start Django development server
python manage.py runserver
```
The Django REST API will be accessible at `http://127.0.0.1:8000/`.

### 3. Frontend Setup (React.js + Vite)

In a separate terminal:

```bash
cd frontend

# Install node dependencies
npm install

# Start Vite dev server
npm run dev
```
The React frontend will be accessible at `http://localhost:5173/`.

---

## REST API Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register/` | Public | Student registration with auto `STU...` ID |
| `POST` | `/api/auth/login/` | Public | Authenticates and returns DRF Token + Role |
| `POST` | `/api/auth/logout/` | Authenticated | Revokes user authentication token |
| `GET` | `/api/auth/profile/` | Authenticated | Retrieves current authenticated profile |
| `GET` | `/api/auth/students/` | Staff, Admin | List students with search and department filters |
| `PATCH`| `/api/auth/students/<id>/` | Staff, Admin | Toggle student active/inactive status |
| `GET/POST`| `/api/auth/staff/` | Admin | List or create staff members (`STF...`) |
| `GET` | `/api/books/` | Anyone | Search and filter books by category/availability |
| `POST`| `/api/books/` | Staff, Admin | Add new book with copies count |
| `POST`| `/api/borrow/` | Student, Staff | Atomic borrow, locks row, generates receipt |
| `POST`| `/api/borrow/<id>/return/` | Authenticated | Atomic return, calculates fine, generates return receipt |
| `GET` | `/api/borrow/list/` | Staff, Admin | Complete audit list of borrow transactions |
| `GET` | `/api/borrow/overdue/` | Authenticated | Lists currently overdue loans with dynamic fine accrual |
| `GET` | `/api/payments/fines/` | Authenticated | View assessed fines and payment statuses |
| `POST`| `/api/payments/records/` | Authenticated | Development-safe payment execution (`TXN...`) |
| `GET` | `/api/receipts/` | Authenticated | View generated borrow & return receipts |
| `GET` | `/api/dashboard/admin/` | Admin | PostgreSQL aggregates for cards & recent actions |
| `GET` | `/api/dashboard/staff/` | Staff, Admin | Circulation operational metrics |
| `GET` | `/api/dashboard/student/` | Student | Personal borrow counts, active loans, and fine ledger |
| `GET` | `/api/settings/` | Anyone | Fetch library title, loan period, and fine rate |
| `PUT` | `/api/settings/` | Admin | Update system settings in PostgreSQL table |

---

## 21-Step Verified Workflow

The application includes an automated verification script (`backend/test_complete_flow.py`) executing directly against PostgreSQL:
1. Admin logs in with `admin` / `Admin@123`.
2. Admin verifies or creates book `BK001` ("Python Programming", Quantity: 10).
3. Student registers ("Mathavan").
4. Student is allocated unique ID `STU001`.
5. Student logs in.
6. Student borrows book `BK001`.
7. Book available quantity decreases from 10 to 9.
8. Official `BOOK BORROW RECEIPT` is generated (`RCP001`).
9. Due date is set to 7 days from borrow date.
10. Student returns the book on time.
11. Fine is verified as ₹0.
12. Available quantity is restored to 10.
13. Student borrows book again.
14. System simulates 2-day overdue return in database.
15. Backend automatically calculates ₹20 fine (2 days × ₹10/day).
16. Return receipt is generated (`RCP004`) with late days and total fine.
17. Student submits payment for ₹20.
18. Payment record is stored in PostgreSQL (`PAY001`, `TXN...`).
19. Fine and payment status become `PAID`.
20. Admin dashboard aggregates update: Total Fine Generated = ₹20, Total Fine Paid = ₹20, Total Fine Pending = ₹0, Total Payment Amount = ₹20.
21. Verified 100% direct match with PostgreSQL database queries without any mock data.

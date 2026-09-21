# Full-Stack Inventory & Order Management System

A high-reliability inventory management system built with Node.js, Express, and MySQL. Implements ACID-compliant database transactions and row-level locking (`FOR UPDATE`) to maintain data integrity and prevent race conditions during high-concurrency order placement.

---

## 🔑 Key Features & System Highlights

* **ACID Transaction Security**: Utilizes explicit SQL transactions (`START TRANSACTION`, `COMMIT`, `ROLLBACK`) to guarantee order integrity across `orders`, `order_items`, and `products` tables.
* **Row-Level Concurrency Control**: Prevents double-selling and race conditions by locking target product rows (`SELECT ... FOR UPDATE`) during active transactions.
* **Input Validation & Guard Clauses**: Validates payload structure, numerical boundaries, and stock availability before mutating database state.
* **Optimized Database Schema**: Features explicit indexing (`idx_products_sku`, `idx_orders_customer`) for fast lookup performance under scale.
* **Graceful Application Termination**: Intercepts `SIGINT` and `SIGTERM` process signals to safely drain and terminate MySQL connection pool instances.
* **Real-time Responsive Dashboard**: Lightweight HTML5/CSS3/JavaScript frontend with automatic UI state updates and asynchronous error rendering.

---

## 🛠️ Tech Stack

* **Backend**: Node.js, Express.js, `mysql2` (Connection Pooling)
* **Database**: MySQL 8.0 (InnoDB Engine)
* **Frontend**: Vanilla JavaScript (Fetch API), HTML5, CSS3
* **Configuration**: `dotenv` for environment variable isolation

---

## 📐 System Architecture & Order Flow

```text
[ Frontend Dashboard ]
         │
         │ POST /api/orders
         ▼
[ Express REST API ]
         │
         ├─► Validate Payload Data Types & Quantities
         │
         ├─► Acquire Connection from MySQL Pool
         │
         ├─► BEGIN TRANSACTION
         │     ├── SELECT stock_quantity FROM products WHERE product_id = ? FOR UPDATE
         │     ├── Verify Stock Availability (Rollback on failure)
         │     ├── UPDATE products SET stock_quantity = stock_quantity - ?
         │     ├── INSERT INTO orders (...)
         │     └── INSERT INTO order_items (...)
         │
         ├─► COMMIT TRANSACTION
         │
         └─► Release Connection to Pool ──► Return 201 Created Status

```

🚀 Getting Started
1. Database Setup
Execute Data.sql in MySQL Workbench to initialize the schema, indexes, and initial dataset.
SOURCE Data.sql;

2. Environment Configuration
Create a .env file in the project directory:
PORT=5000
DB_HOST=localhost
DB_USER=appuser
DB_PASSWORD=YourPassword123!
DB_NAME=inventory_db

3. Installation & Local Execution
# Install dependencies
npm install

# Start backend server
node server.js

Open index.html in your web browser (or run via VS Code Live Server) to access the interactive dashboard.



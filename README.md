# Full-Stack-Inventory-System
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

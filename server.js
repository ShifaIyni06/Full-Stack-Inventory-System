const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Fetch all products
app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT product_id, name, sku, price, stock_quantity FROM products ORDER BY product_id ASC');
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ success: false, error: 'Failed to retrieve inventory data.' });
    }
});

// 2. Fetch all orders with customer details (SQL JOIN)
app.get('/api/orders', async (req, res) => {
    try {
        const query = `
            SELECT o.order_id, c.name AS customer_name, o.total_amount, o.status, o.created_at 
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            ORDER BY o.order_id DESC
        `;
        const [rows] = await pool.query(query);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ success: false, error: 'Failed to retrieve order records.' });
    }
});

// 3. Process Order with ACID Transaction and Inventory Lock
app.post('/api/orders', async (req, res) => {
    const { customer_id, items } = req.body;

    // Payload & Data Type Validation
    if (!customer_id || !Number.isInteger(Number(customer_id))) {
        return res.status(400).json({ success: false, error: 'A valid customer ID is required.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Order must contain at least one product item.' });
    }

    for (const item of items) {
        if (!item.product_id || !Number.isInteger(Number(item.product_id))) {
            return res.status(400).json({ success: false, error: 'Invalid product ID supplied.' });
        }
        if (!item.quantity || !Number.isInteger(Number(item.quantity)) || item.quantity <= 0) {
            return res.status(400).json({ success: false, error: 'Item quantity must be a positive integer.' });
        }
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        let totalAmount = 0;
        const orderItemsToInsert = [];

        for (const item of items) {
            // Row-level locking to prevent race conditions during concurrent orders
            const [rows] = await connection.query(
                'SELECT price, stock_quantity FROM products WHERE product_id = ? FOR UPDATE',
                [item.product_id]
            );

            if (rows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, error: `Product ID ${item.product_id} was not found.` });
            }

            const product = rows[0];

            if (product.stock_quantity < item.quantity) {
                await connection.rollback();
                return res.status(409).json({ 
                    success: false, 
                    error: `Insufficient stock for product ID ${item.product_id}. Requested: ${item.quantity}, Available: ${product.stock_quantity}` 
                });
            }

            const unitPrice = parseFloat(product.price);
            totalAmount += unitPrice * item.quantity;

            // Deduct stock safely
            await connection.query(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?',
                [item.quantity, item.product_id]
            );

            orderItemsToInsert.push({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: unitPrice
            });
        }

        // Insert Order Record
        const [orderResult] = await connection.query(
            'INSERT INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)',
            [customer_id, totalAmount, 'COMPLETED']
        );

        const orderId = orderResult.insertId;

        // Insert Order Details
        for (const item of orderItemsToInsert) {
            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.unit_price]
            );
        }

        await connection.commit();
        res.status(201).json({ 
            success: true, 
            message: 'Order created successfully!', 
            order_id: orderId, 
            total_amount: totalAmount 
        });

    } catch (err) {
        await connection.rollback();
        console.error('Transaction failed:', err);
        res.status(500).json({ success: false, error: 'Database transaction failed while processing order.' });
    } finally {
        connection.release();
    }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Inventory Backend Server running on port ${PORT}`);
});

// Graceful Shutdown
const shutdown = async () => {
    console.log('\nShutting down backend server...');
    server.close(async () => {
        try {
            await pool.end();
            console.log('Database pool connection closed cleanly.');
            process.exit(0);
        } catch (err) {
            console.error('Error closing database pool:', err);
            process.exit(1);
        }
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
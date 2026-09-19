const API_URL = 'http://localhost:5000/api';

// Fetch and render inventory
async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const result = await response.json();

        if (!result.success) throw new Error(result.error);

        const tableBody = document.getElementById('product-list');
        const productSelect = document.getElementById('product');

        tableBody.innerHTML = '';
        productSelect.innerHTML = '';

        result.data.forEach(product => {
            const stockBadge = product.stock_quantity > 5 
                ? `<span class="badge in-stock">${product.stock_quantity} available</span>`
                : `<span class="badge low-stock">${product.stock_quantity} low stock</span>`;

            const row = `
                <tr>
                    <td>${product.product_id}</td>
                    <td><strong>${product.name}</strong></td>
                    <td>${product.sku}</td>
                    <td>$${parseFloat(product.price).toFixed(2)}</td>
                    <td>${stockBadge}</td>
                </tr>
            `;
            tableBody.innerHTML += row;

            const option = document.createElement('option');
            option.value = product.product_id;
            option.textContent = `${product.name} ($${product.price})`;
            productSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

// Fetch and render recent order logs
async function loadOrders() {
    try {
        const response = await fetch(`${API_URL}/orders`);
        const result = await response.json();

        if (!result.success) throw new Error(result.error);

        const tableBody = document.getElementById('order-list');
        tableBody.innerHTML = '';

        if (result.data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">No orders recorded yet.</td></tr>';
            return;
        }

        result.data.forEach(order => {
            const formattedDate = new Date(order.created_at).toLocaleString();
            const row = `
                <tr>
                    <td>#${order.order_id}</td>
                    <td>${order.customer_name}</td>
                    <td>$${parseFloat(order.total_amount).toFixed(2)}</td>
                    <td><span class="badge status-completed">${order.status}</span></td>
                    <td>${formattedDate}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

    } catch (error) {
        console.error('Failed to load orders:', error);
    }
}

// Handle Order Submission with Transaction
document.getElementById('order-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const customerId = parseInt(document.getElementById('customer').value);
    const productId = parseInt(document.getElementById('product').value);
    const quantity = parseInt(document.getElementById('quantity').value);
    const messageDiv = document.getElementById('message');

    // UI Loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing Transaction...';
    messageDiv.style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer_id: customerId,
                items: [{ product_id: productId, quantity: quantity }]
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            messageDiv.className = 'success';
            messageDiv.textContent = `Order #${result.order_id} placed! Total: $${result.total_amount.toFixed(2)}`;
            messageDiv.style.display = 'block';
            
            // Refresh inventory and order tables
            await Promise.all([loadProducts(), loadOrders()]);
        } else {
            throw new Error(result.error || 'Failed to process order.');
        }

    } catch (error) {
        messageDiv.className = 'error';
        messageDiv.textContent = error.message;
        messageDiv.style.display = 'block';
    } finally {
        // Reset UI state
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Order (ACID Transaction)';
    }
});

// Initial load
loadProducts();
loadOrders();
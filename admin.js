let products = [];
let allOrders = [];

async function initAdmin() {
    try {
        const user = await window.checkSession();
        
        if (!user || user.role !== 'admin') {
            document.body.innerHTML = `
                <div style="text-align:center; padding:100px;">
                    <h2>Access Denied</h2>
                    <p>You must be an administrator to view this page.</p>
                    <a href="index.html" style="color:var(--primary);">Return to Store</a>
                </div>
            `;
            return;
        }

        document.getElementById('loader').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        document.getElementById('adminName').innerText = `Hello, ${user.name}`;

        await loadAdminProducts();
        await loadAdminOrders();

    } catch(err) {
        alert("Authentication failed.");
        window.location.href = "index.html";
    }
}

async function handleLogout() {
    await window.logoutUser();
    window.location.href = "index.html";
}

async function loadAdminProducts() {
    try {
        products = await window.loadProducts();
        renderTable();
    } catch(err) {
        alert("Failed to load products: " + err.message);
    }
}

function renderTable() {
    const tbody = document.getElementById('productTableBody');
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No products found</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(p => `
        <tr>
            <td>#${p.id}</td>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:24px;">${p.emoji || '📦'}</span>
                    <span><strong>${p.name}</strong></span>
                </div>
            </td>
            <td><span style="background:var(--border); padding:4px 8px; border-radius:4px; font-size:12px; text-transform:uppercase;">${p.cat}</span></td>
            <td>₹${p.price.toLocaleString('en-IN')}</td>
            <td>${p.badge ? `<span style="color:var(--primary); font-weight:500;">${p.badge}</span>` : '-'}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick='openProductModal(${JSON.stringify(p)})'>Edit</button>
                    <button class="btn-delete" onclick="deleteProduct(${p.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openProductModal(product = null) {
    document.getElementById('productModal').classList.add('open');
    document.getElementById('productOverlay').classList.add('open');
    
    const form = document.getElementById('productForm');
    form.reset();
    
    if (product) {
        document.getElementById('modalTitle').innerText = 'Edit Product';
        document.getElementById('productId').value = product.id;
        document.getElementById('p_name').value = product.name;
        document.getElementById('p_cat').value = product.cat;
        document.getElementById('p_price').value = product.price;
        document.getElementById('p_oldPrice').value = product.oldPrice || '';
        document.getElementById('p_emoji').value = product.emoji || '';
        document.getElementById('p_badge').value = product.badge || '';
        document.getElementById('p_rating').value = product.rating || 5;
    } else {
        document.getElementById('modalTitle').innerText = 'Add Product';
        document.getElementById('productId').value = '';
    }
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('open');
    document.getElementById('productOverlay').classList.remove('open');
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('productId').value;
    const data = {
        name: document.getElementById('p_name').value,
        cat: document.getElementById('p_cat').value,
        price: parseFloat(document.getElementById('p_price').value),
        oldPrice: document.getElementById('p_oldPrice').value ? parseFloat(document.getElementById('p_oldPrice').value) : null,
        emoji: document.getElementById('p_emoji').value,
        badge: document.getElementById('p_badge').value || null,
        rating: parseFloat(document.getElementById('p_rating').value)
    };

    try {
        if (id) {
            await window.adminUpdateProduct(id, data);
            alert("Product updated!");
        } else {
            // New products default to 0 reviews initially
            data.reviews = 0;
            await window.adminCreateProduct(data);
            alert("Product created!");
        }
        
        closeProductModal();
        await loadAdminProducts();
        
    } catch(err) {
        alert("Error saving product: " + err.message);
    }
}

async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
        await window.adminDeleteProduct(id);
        await loadAdminProducts();
    } catch(err) {
        alert("Error deleting product: " + err.message);
    }
}

// ── Tab Switching ─────────────────────────────────────────────

function switchTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));

    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`section-${tab}`).classList.add('active');

    // Show/hide Add Product button
    const addBtn = document.getElementById('addProductBtn');
    if (addBtn) addBtn.style.display = tab === 'products' ? 'block' : 'none';
}

// ── Admin: Orders ─────────────────────────────────────────────

async function loadAdminOrders() {
    try {
        allOrders = await window.adminGetAllOrders();
        renderOrdersTable();
    } catch(err) {
        document.getElementById('ordersTableBody').innerHTML =
            '<tr><td colspan="6" style="text-align:center; color:#f87171;">Failed to load orders.</td></tr>';
    }
}

function formatAdminDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (allOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No orders yet.</td></tr>';
        return;
    }

    const statusColors = {
        'Placed':     '#e8ff3c',
        'Processing': '#fbbf24',
        'Shipped':    '#60a5fa',
        'Delivered':  '#4ade80',
        'Cancelled':  '#f87171',
    };

    tbody.innerHTML = allOrders.map(order => `
        <tr id="orow-${order.id}">
            <td><strong style="color:var(--accent);">#${order.id}</strong></td>
            <td>
                <div style="font-weight:600;">${order.customer_name}</div>
                <div style="font-size:12px; color:var(--text-muted);">${order.customer_email}</div>
            </td>
            <td>${order.item_count} item${order.item_count !== 1 ? 's' : ''}</td>
            <td style="font-weight:700;">₹${Number(order.total_amount).toLocaleString('en-IN')}</td>
            <td style="color:var(--text-muted); font-size:13px;">${formatAdminDate(order.created_at)}</td>
            <td>
                <select class="status-select" id="status-${order.id}"
                        onchange="updateOrderStatus(${order.id}, this.value)"
                        style="color:${statusColors[order.status] || '#f0f0f0'}">
                    ${['Placed','Processing','Shipped','Delivered','Cancelled'].map(s =>
                        `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s}</option>`
                    ).join('')}
                </select>
            </td>
        </tr>
    `).join('');
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await window.adminUpdateOrderStatus(orderId, newStatus);
        // Update local data
        const order = allOrders.find(o => o.id === orderId);
        if (order) order.status = newStatus;
        // Update select color
        const statusColors = {
            'Placed':'#e8ff3c','Processing':'#fbbf24',
            'Shipped':'#60a5fa','Delivered':'#4ade80','Cancelled':'#f87171'
        };
        const sel = document.getElementById(`status-${orderId}`);
        if (sel) sel.style.color = statusColors[newStatus] || '#f0f0f0';
    } catch(err) {
        alert('Failed to update status: ' + err.message);
        // Reload to revert
        await loadAdminOrders();
    }
}

// Start
document.addEventListener('DOMContentLoaded', initAdmin);


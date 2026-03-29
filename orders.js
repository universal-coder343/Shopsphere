// ── ShopSphere — Orders Page ───────────────────────────────────

const STATUS_ORDER = ['Placed', 'Processing', 'Shipped', 'Delivered'];

function formatPrice(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function getStatusClass(status) {
  const map = {
    'Placed':     'status-placed',
    'Processing': 'status-processing',
    'Shipped':    'status-shipped',
    'Delivered':  'status-delivered',
    'Cancelled':  'status-cancelled',
  };
  return map[status] || 'status-placed';
}

function getStatusEmoji(status) {
  const map = {
    'Placed':     '🎉',
    'Processing': '⚙️',
    'Shipped':    '🚚',
    'Delivered':  '✅',
    'Cancelled':  '✕',
  };
  return map[status] || '📦';
}

function renderTimeline(status) {
  if (status === 'Cancelled') {
    return `
      <div class="order-timeline">
        <div class="timeline-steps">
          ${STATUS_ORDER.map((s, i) => `
            <div class="timeline-step cancelled">
              <div class="timeline-dot">✕</div>
              <div class="timeline-label">${i === 0 ? 'Placed' : s}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  const activeIndex = STATUS_ORDER.indexOf(status);
  return `
    <div class="order-timeline">
      <div class="timeline-steps">
        ${STATUS_ORDER.map((s, i) => {
          const isDone   = i < activeIndex;
          const isActive = i === activeIndex;
          const cls = isDone ? 'done' : (isActive ? 'active' : '');
          const dot = isDone ? '✓' : getStatusEmoji(s);
          return `
            <div class="timeline-step ${cls}">
              <div class="timeline-dot">${dot}</div>
              <div class="timeline-label">${s}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderOrderItems(items) {
  if (!items || items.length === 0) {
    return '<p style="color:var(--text-muted); font-size:14px;">No items found.</p>';
  }
  return items.map(item => `
    <div class="order-item-row">
      <div class="order-item-emoji">${item.emoji || '📦'}</div>
      <div class="order-item-info">
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-cat">${item.cat}</div>
      </div>
      <div class="order-item-right">
        <div class="order-item-price">${formatPrice(item.price_at_purchase * item.qty)}</div>
        <div class="order-item-qty">Qty: ${item.qty} × ${formatPrice(item.price_at_purchase)}</div>
      </div>
    </div>
  `).join('');
}

// Toggle order card expand/collapse — loads items lazily
async function toggleOrder(cardEl, orderId) {
  const isExpanded = cardEl.classList.contains('expanded');

  if (isExpanded) {
    cardEl.classList.remove('expanded');
    return;
  }

  // Load items if not already loaded
  const detailInner = cardEl.querySelector('.order-detail-items');
  if (!detailInner.dataset.loaded) {
    detailInner.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);">Loading items…</div>`;
    try {
      const data = await window.getOrderDetails(orderId);
      detailInner.innerHTML = renderOrderItems(data.items);
      detailInner.dataset.loaded = '1';
    } catch (err) {
      detailInner.innerHTML = `<p style="color:#f87171;">Failed to load items.</p>`;
    }
  }

  cardEl.classList.add('expanded');
}

function renderOrders(orders) {
  const container = document.getElementById('ordersContent');

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="orders-empty">
        <div class="e-icon">📦</div>
        <p>You haven't placed any orders yet.<br>Start shopping and they'll appear here!</p>
        <a href="index.html" class="btn-primary" style="display:inline-block; padding:14px 32px; text-decoration:none;">Shop Now →</a>
      </div>
    `;
    return;
  }

  container.innerHTML = orders.map((order, idx) => `
    <div class="order-card" id="order-card-${order.id}" style="animation-delay:${idx * 0.07}s">
      <div class="order-card-header" onclick="toggleOrder(document.getElementById('order-card-${order.id}'), ${order.id})">
        <div>
          <div class="order-id">Order #${order.id}</div>
          <div class="order-date">${formatDate(order.created_at)}</div>
          <div class="order-items-count">${order.item_count} item${order.item_count !== 1 ? 's' : ''}</div>
        </div>
        <div class="order-card-header-right">
          <div>
            <div class="order-total">${formatPrice(order.total_amount)}</div>
            <div style="text-align:right; margin-top:6px;">
              <span class="status-badge ${getStatusClass(order.status)}">${order.status}</span>
            </div>
          </div>
          <div class="order-expand-icon">▾</div>
        </div>
      </div>

      ${renderTimeline(order.status)}

      <div class="order-detail">
        <div class="order-detail-inner">
          <div class="order-detail-title">Items in this order</div>
          <div class="order-detail-items"></div>
        </div>
      </div>
    </div>
  `).join('');
}

async function initOrders() {
  try {
    const user = await window.checkSession();
    if (!user) {
      window.location.replace('auth.html');
      return;
    }

    document.getElementById('orderUserName').textContent = user.name;

    const orders = await window.loadOrders();
    renderOrders(orders);

  } catch (err) {
    document.getElementById('ordersContent').innerHTML = `
      <div class="orders-loading">
        <p style="color:#f87171;">Error loading orders: ${err.message}</p>
      </div>
    `;
  }
}

async function handleLogout() {
  await window.logoutUser();
}

window.addEventListener('DOMContentLoaded', initOrders);

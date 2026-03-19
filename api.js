// ─────────────────────────────────────────────────────────────
//  ShopSphere — API connector for your HTML/CSS/JS frontend
//  Drop this <script> tag in your index.html:
//  <script src="api.js"></script>
// ─────────────────────────────────────────────────────────────

// Use the exact hostname the user is visiting on to ensure cookies aren't dropped cross-origin!
const API = `http://${window.location.hostname || "localhost"}:5000/api`;  // Flask server address

// ── Helper ────────────────────────────────────────────────────
// IMPORTANT: credentials: 'include' is required for Cookies/Sessions to work across origins
async function callAPI(endpoint, method = "GET", body = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: 'include' 
    };
    if (body) options.body = JSON.stringify(body);
    
    try {
        const res = await fetch(`${API}${endpoint}`, options);
        // We handle empty responses gracefully (e.g., 204 No Content or simple 200 OK without JSON)
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};
        
        if (!res.ok) {
            throw new Error(data.error || "Something went wrong");
        }
        return data;
    } catch (err) {
        console.error("API Error:", err);
        throw err;
    }
}


// ── AUTH ──────────────────────────────────────────────────────

async function registerUser(name, email, password) {
    return callAPI("/auth/register", "POST", { name, email, password });
}

async function loginUser(email, password) {
    const result = await callAPI("/auth/login", "POST", { email, password });
    if (result.user) {
        // Save user details to localStorage (Auth is still handled via secure Cookies!)
        localStorage.setItem("shopsphere_user", JSON.stringify(result.user));
    }
    return result;
}

// Validates the session with the backend to ensure the cookie is still valid
async function checkSession() {
    const userStr = localStorage.getItem("shopsphere_user");
    
    try {
        const result = await callAPI("/auth/me");
        localStorage.setItem("shopsphere_user", JSON.stringify(result.user));
        return result.user;
    } catch {
        // Session invalid, expired, or server restarted (dropping memory cookies)
        localStorage.removeItem("shopsphere_user");
        return null; // Force user to log in again to get a fresh valid cookie
    }
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem("shopsphere_user"));
}

async function logoutUser() {
    await callAPI("/auth/logout", "POST");
    localStorage.removeItem("shopsphere_user");
    window.location.reload();
}


// ── PRODUCTS (Public) ─────────────────────────────────────────

async function loadProducts() {
    return callAPI("/products");
}

async function getProduct(id) {
    return callAPI(`/products/${id}`);
}


// ── CART (Protected) ──────────────────────────────────────────

async function addToCart(product_id, qty = 1) {
    try {
        return await callAPI("/cart/add", "POST", { product_id, qty });
    } catch (err) {
        if (err.message.includes("Unauthorized")) {
            alert("Please login first to add items to your cart!");
        }
        throw err;
    }
}

async function loadCart() {
    try {
        return await callAPI("/cart");
    } catch {
        // If not logged in, or 401, return empty array silently
        return [];
    }
}

async function updateCartItem(item_id, qty) {
    return callAPI(`/cart/update/${item_id}`, "PUT", { qty: parseInt(qty) });
}

// Used to completely remove an item
async function removeFromCart(item_id) {
     return callAPI(`/cart/update/${item_id}`, "PUT", { qty: 0 });
}


// ── CHECKOUT (Protected) ──────────────────────────────────────

async function placeOrder() {
    try {
        const result = await callAPI("/checkout", "POST");
        alert(result.message + " Order ID: " + result.order_id);
        return result;
    } catch (err) {
        alert(err.message);
        throw err;
    }
}


// ── ADMIN ONLY (Protected) ────────────────────────────────────
// These will fail (401/403) if the logged-in user isn't an admin

async function adminCreateProduct(productData) {
    return callAPI("/admin/products", "POST", productData);
}

async function adminUpdateProduct(id, productData) {
    return callAPI(`/admin/products/${id}`, "PUT", productData);
}

async function adminDeleteProduct(id) {
    return callAPI(`/admin/products/${id}`, "DELETE");
}

async function adminGetUsers() {
    return callAPI("/admin/users");
}

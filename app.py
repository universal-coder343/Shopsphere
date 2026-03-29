from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from functools import wraps
import sqlite3
import hashlib
import os

app = Flask(__name__)
# Enable CORS for the frontend, crucially enabling credentials to allow Cookies to be set and sent back
CORS(app, supports_credentials=True, origins=["http://localhost:8000", "http://127.0.0.1:8000", "http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:3000", "http://localhost", "http://127.0.0.1"])

# Provide a secret key for session/cookie encryption
app.secret_key = 'super_secret_shopsphere_key_change_in_production'

# Cookie configs to allow cross-origin requests (development)
app.config.update(
    SESSION_COOKIE_SAMESITE="Lax",  # Adjust to "None" if frontend on different port but requires HTTPS. Lax works for local same-domain.
    SESSION_COOKIE_SECURE=False     # Set to True when using HTTPS
)

DB_FILE = 'shopsphere.db'
MAX_CART_LIMIT = 200

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Returns dict-like rows
    return conn

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# ─────────────────────────────────────────────
#  DECORATORS FOR AUTH & ADMIN
# ─────────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized. Please login first.'}), 401
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Unauthorized. Please login first.'}), 401
        if session.get('role') != 'admin':
            return jsonify({'error': 'Forbidden. Admin access required.'}), 403
        return f(*args, **kwargs)
    return decorated_function

# ─────────────────────────────────────────────
#  AUTH ROUTES
# ─────────────────────────────────────────────

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not name or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    hashed_pw = hash_password(password)
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')",
            (name, email, hashed_pw)
        )
        conn.commit()
        return jsonify({"message": "Registered successfully!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already registered"}), 409
    finally:
        conn.close()

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
         return jsonify({"error": "Missing email or password"}), 400

    hashed_pw = hash_password(password)
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, email, role FROM users WHERE email=? AND password_hash=?",
        (email, hashed_pw)
    )
    user = cursor.fetchone()
    conn.close()

    if user:
        # Create user session
        session['user_id'] = user['id']
        session['role'] = user['role']
        
        return jsonify({
            "message": "Login successful!", 
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "role": user['role']
            }
        }), 200
    
    return jsonify({"error": "Invalid email or password"}), 401

@app.route("/api/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully"}), 200

@app.route("/api/auth/me", methods=["GET"])
@login_required
def get_current_user():
    user_id = session.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, role FROM users WHERE id=?", (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return jsonify({
            "user": {
                "id": user['id'],
                "name": user['name'],
                "email": user['email'],
                "role": user['role']
            }
        }), 200
    
    return jsonify({"error": "User not found"}), 404

# ─────────────────────────────────────────────
#  PUBLIC PRODUCTS ROUTES
# ─────────────────────────────────────────────

@app.route("/api/products", methods=["GET"])
def get_products():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products")
    products = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(products), 200

@app.route("/api/products/<int:id>", methods=["GET"])
def get_product(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id=?", (id,))
    product = cursor.fetchone()
    conn.close()
    if product:
        return jsonify(dict(product)), 200
    return jsonify({"error": "Product not found"}), 404

# ─────────────────────────────────────────────
#  ADMIN ROUTES
# ─────────────────────────────────────────────

@app.route("/api/admin/products", methods=["POST"])
@admin_required
def create_product():
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO products (name, cat, price, oldPrice, rating, reviews, emoji, badge)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('name'), data.get('cat'), data.get('price'), 
            data.get('oldPrice'), data.get('rating', 0), data.get('reviews', 0), 
            data.get('emoji'), data.get('badge')
        ))
        conn.commit()
        new_id = cursor.lastrowid
        conn.close()
        return jsonify({"message": "Product created successfully", "id": new_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/admin/products/<int:id>", methods=["PUT"])
@admin_required
def update_product(id):
    data = request.json
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Check if product exists first
        cursor.execute("SELECT id FROM products WHERE id=?", (id,))
        if not cursor.fetchone():
            return jsonify({"error": "Product not found"}), 404

        cursor.execute('''
            UPDATE products 
            SET name=?, cat=?, price=?, oldPrice=?, rating=?, reviews=?, emoji=?, badge=?
            WHERE id=?
        ''', (
            data.get('name'), data.get('cat'), data.get('price'), 
            data.get('oldPrice'), data.get('rating'), data.get('reviews'), 
            data.get('emoji'), data.get('badge'), id
        ))
        conn.commit()
        conn.close()
        return jsonify({"message": "Product updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/admin/products/<int:id>", methods=["DELETE"])
@admin_required
def delete_product(id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Remove from cart_items to prevent integrity errors, or handle cascade
        cursor.execute("DELETE FROM cart_items WHERE product_id=?", (id,))
        cursor.execute("DELETE FROM products WHERE id=?", (id,))
        conn.commit()
        
        rows_deleted = cursor.rowcount
        conn.close()
        
        if rows_deleted == 0:
             return jsonify({"error": "Product not found"}), 404
             
        return jsonify({"message": "Product deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/api/admin/users", methods=["GET"])
@admin_required
def get_users():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, role FROM users")
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(users), 200

# ─────────────────────────────────────────────
#  CART ROUTES (Requires Login)
# ─────────────────────────────────────────────

@app.route("/api/cart", methods=["GET"])
@login_required
def get_cart():
    user_id = session.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT c.id as cart_item_id,c.product_id,c.qty, p.* 
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    ''', (user_id,))
    
    items = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(items), 200

@app.route("/api/cart/add", methods=["POST"])
@login_required
def add_to_cart():
    user_id = session.get('user_id')
    data = request.json
    product_id = data.get('product_id')
    
    if not product_id:
        return jsonify({"error": "Product ID required"}), 400

    # Ensure valid quantity
    try:
        qty = int(data.get('qty', 1))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid quantity"}), 400

    if qty <= 0:
        return jsonify({"error": "Quantity must be greater than zero"}), 400

    conn = get_db()
    cursor = conn.cursor()
    
    # Check if already in cart
    cursor.execute("SELECT id, qty FROM cart_items WHERE user_id=? AND product_id=?", (user_id, product_id))
    existing = cursor.fetchone()
    
    # Calculate new quantity for THIS product
    new_qty = (existing['qty'] + qty) if existing else qty
    
    if new_qty > MAX_CART_LIMIT:
        conn.close()
        return jsonify({"error": "maximum cart exceeded"}), 400
    
    if existing:
        cursor.execute("UPDATE cart_items SET qty=? WHERE id=?", (new_qty, existing['id']))
    else:
        cursor.execute("INSERT INTO cart_items (user_id, product_id, qty) VALUES (?, ?, ?)", 
                       (user_id, product_id, qty))
        
    conn.commit()
    conn.close()
    return jsonify({"message": "Added to cart"}), 200

@app.route("/api/cart/update/<int:item_id>", methods=["PUT"])
@login_required
def update_cart_item(item_id):
    user_id = session.get('user_id')
    data = request.json
    
    if 'qty' not in data:
        return jsonify({"error": "Quantity required"}), 400
        
    try:
        qty = int(data.get('qty'))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid quantity"}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    
    # Ensure this item belongs to current user
    cursor.execute("SELECT id FROM cart_items WHERE id=? AND user_id=?", (item_id, user_id))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Item not found in your cart"}), 404
        
    if qty > MAX_CART_LIMIT:
        conn.close()
        return jsonify({"error": "maximum cart exceeded"}), 400

    if qty <= 0:
        cursor.execute("DELETE FROM cart_items WHERE id=?", (item_id,))
    else:
        cursor.execute("UPDATE cart_items SET qty=? WHERE id=?", (qty, item_id))
        
    conn.commit()
    conn.close()
    return jsonify({"message": "Cart updated"}), 200

@app.route("/api/checkout", methods=["POST"])
@login_required
def checkout():
    user_id = session.get('user_id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get cart
    cursor.execute('''
        SELECT c.product_id, c.qty, p.price 
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ?
    ''', (user_id,))
    cart_items = cursor.fetchall()
    
    if not cart_items:
        conn.close()
        return jsonify({"error": "Cart is empty"}), 400
        
    # Strictly parse numeric values to prevent any discrepancy
    total = sum(float(item['price']) * int(item['qty']) for item in cart_items)
    
    # Create order
    cursor.execute("INSERT INTO orders (user_id, total_amount) VALUES (?, ?)", (user_id, total))
    order_id = cursor.lastrowid
    
    # Create order items
    for item in cart_items:
        cursor.execute('''
            INSERT INTO order_items (order_id, product_id, qty, price_at_purchase)
            VALUES (?, ?, ?, ?)
        ''', (order_id, item['product_id'], item['qty'], item['price']))
        
    # Clear cart
    cursor.execute("DELETE FROM cart_items WHERE user_id=?", (user_id,))
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "Order placed successfully!", "order_id": order_id}), 201

# ─────────────────────────────────────────────
#  ORDER ROUTES (Requires Login)
# ─────────────────────────────────────────────

VALID_STATUSES = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

@app.route("/api/orders", methods=["GET"])
@login_required
def get_orders():
    user_id = session.get('user_id')
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT o.id, o.total_amount, o.status, o.created_at,
               COUNT(oi.id) as item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
    ''', (user_id,))
    orders = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(orders), 200

@app.route("/api/orders/<int:order_id>", methods=["GET"])
@login_required
def get_order_detail(order_id):
    user_id = session.get('user_id')
    conn = get_db()
    cursor = conn.cursor()

    # Verify order belongs to this user
    cursor.execute("SELECT * FROM orders WHERE id=? AND user_id=?", (order_id, user_id))
    order = cursor.fetchone()
    if not order:
        conn.close()
        return jsonify({"error": "Order not found"}), 404

    # Fetch order items with product details
    cursor.execute('''
        SELECT oi.qty, oi.price_at_purchase,
               p.name, p.emoji, p.cat
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
    ''', (order_id,))
    items = [dict(row) for row in cursor.fetchall()]
    conn.close()

    result = dict(order)
    result['items'] = items
    return jsonify(result), 200

# ─────────────────────────────────────────────
#  ADMIN ORDER ROUTES
# ─────────────────────────────────────────────

@app.route("/api/admin/orders", methods=["GET"])
@admin_required
def admin_get_orders():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT o.id, o.total_amount, o.status, o.created_at,
               u.name as customer_name, u.email as customer_email,
               COUNT(oi.id) as item_count
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    ''')
    orders = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(orders), 200

@app.route("/api/admin/orders/<int:order_id>/status", methods=["PUT"])
@admin_required
def admin_update_order_status(order_id):
    data = request.json
    new_status = data.get('status')

    if new_status not in VALID_STATUSES:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM orders WHERE id=?", (order_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Order not found"}), 404

    cursor.execute("UPDATE orders SET status=? WHERE id=?", (new_status, order_id))
    conn.commit()
    conn.close()
    return jsonify({"message": f"Order #{order_id} status updated to '{new_status}'"}), 200

# ─────────────────────────────────────────────
#  SERVE FRONTEND STATIC FILES
# ─────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(BASE_DIR, filename)

if __name__ == "__main__":
    app.run(debug=True, port=5000)


import sqlite3
import hashlib
import os

DB_FILE = 'shopsphere.db'

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def init_db():
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
        print(f"Removed existing {DB_FILE}")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'customer'
        )
    ''')
    print("Created users table.")

    # 2. Products Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            cat TEXT NOT NULL,
            price REAL NOT NULL,
            oldPrice REAL,
            rating REAL,
            reviews INTEGER,
            emoji TEXT,
            badge TEXT
        )
    ''')
    print("Created products table.")

    # 3. Cart Items Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            qty INTEGER NOT NULL DEFAULT 1,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        )
    ''')
    print("Created cart_items table.")

    # 4. Orders Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total_amount REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'Placed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    print("Created orders table.")

    # 5. Order Items Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            qty INTEGER NOT NULL,
            price_at_purchase REAL NOT NULL,
            FOREIGN KEY(order_id) REFERENCES orders(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        )
    ''')
    print("Created order_items table.")

    # -------------------------------------------------------------------
    # SEED DATA
    # -------------------------------------------------------------------

    # Seed Admin and Test User
    cursor.execute(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        ("Admin User", "admin@shopsphere.com", hash_password("admin123"), "admin")
    )
    cursor.execute(
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        ("Test Customer", "test@example.com", hash_password("test1234"), "customer")
    )
    print("Seeded test users (admin and customer).")


    # Seed 16 Products exactly matching app.js
    products = [
        ('Wireless Headphones Pro', 'electronics', 12499, 16599, 4.8, 234, '🎧', 'Sale'),
        ('iPhone 15 Pro Case', 'electronics', 2449, None, 4.5, 89, '📱', 'New'),
        ('4K Smart TV 55"', 'electronics', 58299, 74999, 4.7, 156, '📺', 'Sale'),
        ('Mechanical Keyboard', 'electronics', 9899, 12499, 4.9, 312, '⌨️', 'Sale'),
        ('Premium Sneakers', 'clothes', 10799, None, 4.6, 201, '👟', 'New'),
        ('Winter Hoodie', 'clothes', 4949, 6599, 4.4, 145, '🧥', 'Sale'),
        ('Linen Summer Dress', 'clothes', 7449, None, 4.7, 98, '👗', 'New'),
        ('Slim Fit Jeans', 'clothes', 6599, 8299, 4.5, 267, '👖', 'Sale'),
        ('Air Fryer XL', 'home', 7449, 9999, 4.8, 445, '🫕', 'Sale'),
        ('Robot Vacuum', 'home', 24999, 33299, 4.6, 332, '🤖', 'Sale'),
        ('Coffee Machine', 'home', 14999, None, 4.9, 189, '☕', 'New'),
        ('Blender Pro 2000', 'home', 5799, 7449, 4.4, 122, '🌀', 'Sale'),
        ('Vitamin C Serum', 'beauty', 3299, None, 4.7, 567, '💆', 'New'),
        ('Perfume Luxe', 'beauty', 8299, 10799, 4.8, 213, '🌸', 'Sale'),
        ('Yoga Mat Pro', 'sports', 4099, None, 4.6, 178, '🧘', 'New'),
        ('Smart Fitness Watch', 'sports', 16599, 20799, 4.7, 389, '⌚', 'Sale')
    ]

    cursor.executemany('''
        INSERT INTO products (name, cat, price, oldPrice, rating, reviews, emoji, badge)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', products)
    print("Seeded 16 default products.")

    conn.commit()
    conn.close()
    print("Database initialization complete! -> shopsphere.db")

if __name__ == '__main__':
    init_db()

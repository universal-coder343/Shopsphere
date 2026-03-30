# 🛍️ ShopSphere — E-Commerce App

A full-stack e-commerce web app with a Python Flask backend and vanilla HTML/CSS/JS frontend.

---

## ⚙️ Prerequisites

- **Python 3.10+** — [Download here](https://www.python.org/downloads/) *(check "Add python.exe to PATH" during install)*
- **pip** — comes bundled with Python

---

## 🚀 Setup & Run

### 1. Install dependencies

Open a terminal in the project folder and run:

```bash
pip install flask flask-cors
```

### 2. Initialize the database (first time only)

```bash
python backend/init_db.py
```

### 3. Start the server

```bash
python backend/app.py
```

The app will be available at: **http://127.0.0.1:5000**

---

## 📁 Project Structure

| Folder/File | Purpose |
|-------------|---------|
| `backend/app.py` | Flask backend — API routes + static file serving |
| `backend/init_db.py` | Creates the SQLite database and seeds initial data |
| `backend/api.js` | API call helpers for frontend |
| `frontend/index.html` | Main storefront page |
| `frontend/auth.html` | Login / Register page |
| `frontend/admin.html` | Admin dashboard |
| `frontend/orders.html` | Order tracking page |
| `frontend/style.css` | Global styles |
| `frontend/app.js` | Frontend logic |
| `frontend/auth.js` | Authentication logic |
| `frontend/admin.js` | Admin dashboard logic |
| `frontend/orders.js` | Order tracking logic |
| `shopsphere.db` | SQLite database (auto-created) |
| `documentation/README.md` | This documentation |

---

## 👤 Default Admin Account

After running `init_db.py`, an admin account is seeded:

| Field | Value |
|-------|-------|
| Email | `admin@shopsphere.com` |
| Password | `admin123` |

---

## 🔧 Configuration

Key settings in `backend/app.py`:

| Setting | Default | Description |
|---------|---------|-------------|
| `MAX_CART_LIMIT` | `10000` | Max quantity per cart item |
| `PORT` | `5000` | Server port |
| `app.secret_key` | `super_secret_...` | Session encryption key (change in production) |

---

## 🧪 Running Tests

The project includes several test files in the `backend/` folder:

- `test_api.py` — API endpoint tests
- `test_cart.py` — Cart functionality tests
- `test_max_cart.py` — Max cart limit tests
- `test_playwright.py` — End-to-end tests using Playwright

To run the tests, ensure the server is running and execute:

```bash
python backend/test_api.py
python backend/test_cart.py
python backend/test_max_cart.py
python backend/test_playwright.py
```

*Note: `test_playwright.py` requires Playwright to be installed. Run `pip install playwright` and `playwright install` first.*

---

## 🛑 Stopping the Server

Press `Ctrl + C` in the terminal to stop Flask.

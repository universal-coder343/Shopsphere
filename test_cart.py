import sqlite3

def check_cart():
    conn = sqlite3.connect('shopsphere.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM cart_items')
    items = cursor.fetchall()
    print("Cart Items explicitly in DB:")
    for item in items:
        print(item)

if __name__ == '__main__':
    check_cart()

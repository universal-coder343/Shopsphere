import urllib.request
import urllib.parse
import json
from http.cookiejar import CookieJar
import time

API_BASE = 'http://127.0.0.1:5000/api'
cj = CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

def _post(url, data):
    req = urllib.request.Request(API_BASE + url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        response = opener.open(req)
        return response.getcode(), json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

def _get(url):
    req = urllib.request.Request(API_BASE + url)
    response = opener.open(req)
    return json.loads(response.read().decode('utf-8'))

# Wait for server to be up
time.sleep(2)

# Clear existing users/carts to have a clean state, or just login
print("1. Login as test user")
code, res = _post('/auth/login', {'email': 'test@example.com', 'password': 'test1234'})
print(f"Login Response: {code} {res}")

# Get current cart total to know how many to add
cart = _get('/cart')
current_qty = sum(item['qty'] for item in cart)
print(f"2. Current cart quantity: {current_qty}")

# Add items up to 20
to_add = 20 - current_qty
if to_add > 0:
    print(f"3. Adding {to_add} items to reach limit of 20")
    code, res = _post('/cart/add', {'product_id': 1, 'qty': to_add})
    print(f"Add Response: {code} {res}")
else:
    print("3. Cart already at or above 20 items")

# Try adding 1 more item (should fail for the same product)
print("4. Trying to add 1 more item of the same product (should fail)")
code, res = _post('/cart/add', {'product_id': 1, 'qty': 1})
print(f"Add 21st item Response: {code} {res}")

if code == 400 and res.get('error') == 'maximum cart exceeded':
    print("\nSUCCESS: The maximum cart limit is working correctly!")
else:
    print(f"\nFAILURE: Expected 400 'maximum cart exceeded' but got {code} {res}")


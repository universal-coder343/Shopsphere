import json
import urllib.request
import urllib.parse
from http.cookiejar import CookieJar

cj = CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
API_BASE = 'http://127.0.0.1:5000/api'

def _post(url, data):
    req = urllib.request.Request(API_BASE + url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    return json.loads(opener.open(req).read().decode('utf-8'))

def _get(url):
    req = urllib.request.Request(API_BASE + url)
    return json.loads(opener.open(req).read().decode('utf-8'))

print("Login:", _post('/auth/login', {'email': 'test@example.com', 'password': 'test1234'}))
print("Add item 1:", _post('/cart/add', {'product_id': 1, 'qty': 1}))
print("Add item 2:", _post('/cart/add', {'product_id': 2, 'qty': 1}))
print("Cart:", _get('/cart'))

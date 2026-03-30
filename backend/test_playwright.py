from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Capture console
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        
        # Capture network responses for cart
        def handle_response(response):
            if "cart" in response.url.lower() and response.request.method == "GET":
                try:
                    print(f"Network GET /cart: {response.json()}")
                except:
                    pass
        page.on("response", handle_response)
        
        print("Navigating to index...")
        page.goto("http://localhost:5500/auth.html")
        page.fill("#email", "test@example.com")
        page.fill("#password", "test1234")
        page.click("button:has-text('Log In')")
        
        print("Waiting for index load")
        page.wait_for_selector(".product-card")
        
        print("Adding product 1...")
        page.click("#btn-6") # Hoodie
        time.sleep(1.5)
        
        print("Adding product 2...")
        page.click("#btn-7") # Dress
        time.sleep(1.5)
        
        browser.close()

if __name__ == "__main__":
    run()

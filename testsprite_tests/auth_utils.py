import requests
import sys

BASE_URL = "http://localhost:3000"
AUTH_USERNAME = "admin@mvpvideo.test"
AUTH_PASSWORD = "senha123"

async def login_user(page):
    """
    Logs in the user using Playwright page object.
    Returns True if successful, False otherwise.
    """
    try:
        # Wait for hydration/load
        try:
            await page.wait_for_load_state("domcontentloaded")
            await page.wait_for_timeout(2000)
        except:
            pass

        # Check if already logged in (redirected to dashboard)
        if "/dashboard" in page.url:
            print("Already on dashboard.")
            return True

        login_rapido_btn = page.locator('button:has-text("Login Rápido")').or_(page.locator('button:has-text("Admin")'))
        if await login_rapido_btn.count() > 0 and await login_rapido_btn.first.is_visible():
            print("Using Login Rápido (Admin)...")
            await login_rapido_btn.first.click()
        else:
            print(f"Using standard login with {AUTH_USERNAME}...")
            if await page.locator('text=Entrar').is_visible():
                await page.fill('input[type="email"]', AUTH_USERNAME)
                await page.fill('input[type="password"]', AUTH_PASSWORD)
                await page.click('button:has-text("Entrar")')
            else:
                print("Login form not found.")
                return False
        
        return True
    except Exception as e:
        print(f"Login error: {e}")
        return False

def login_user_sync(page):
    """
    Logs in the user using Playwright page object (Sync API).
    Returns True if successful, False otherwise.
    """
    try:
        # Wait for hydration/load
        try:
            page.wait_for_load_state("domcontentloaded")
            page.wait_for_timeout(2000)
        except:
            pass

        # Handle Onboarding Overlay if present (it might block login buttons)
        try:
            onboarding_overlay = page.locator('.fixed.inset-0.z-50')
            if onboarding_overlay.count() > 0 and onboarding_overlay.first.is_visible():
                print("Onboarding overlay detected in login_user_sync. Removing...")
                page.evaluate("document.querySelectorAll('.fixed.inset-0.z-50').forEach(e => e.remove())")
                page.wait_for_timeout(500)
        except:
            pass

        # Check if already logged in (redirected to dashboard)
        if "/dashboard" in page.url:
            print("Already on dashboard.")
            return True

        login_rapido_btn = page.locator('button:has-text("Login Rápido")').or_(page.locator('button:has-text("Admin")'))
        if login_rapido_btn.count() > 0 and login_rapido_btn.first.is_visible():
            print("Using Login Rápido (Admin)...")
            login_rapido_btn.first.click()
            try:
                page.wait_for_url("**/dashboard", timeout=30000)
            except:
                print("Warning: Redirection to dashboard timed out or didn't happen.")
                # Check for error message
                try:
                    if page.locator('.text-destructive').count() > 0 and page.locator('.text-destructive').first.is_visible():
                         print(f"Login Error Message: {page.locator('.text-destructive').first.inner_text()}")
                    elif page.locator('.text-red-500').count() > 0 and page.locator('.text-red-500').first.is_visible():
                         print(f"Login Error Message: {page.locator('.text-red-500').first.inner_text()}")
                except Exception as e:
                    print(f"Could not read error message: {e}")
        else:
            print(f"Using standard login with {AUTH_USERNAME}...")
            
            # Check if we are already on a form with email input
            email_input = page.locator('input[type="email"]')
            if not email_input.is_visible():
                # Try to click Entrar/Login to navigate to form
                login_link = page.locator('text=Entrar').or_(page.locator('text=Login')).or_(page.locator('text=Sign in'))
                if login_link.count() > 0 and login_link.first.is_visible():
                    print("Clicking Login/Entrar button/link...")
                    login_link.first.click()
                    # Wait for input
                    try:
                        email_input.wait_for(state="visible", timeout=5000)
                    except:
                        print("Login form did not appear after clicking Entrar.")
                
                # If still not visible, force navigation to /login
                if not email_input.is_visible():
                     print("Login form still not found. Forcing navigation to /login...")
                     page.goto(f"{BASE_URL}/login", timeout=60000)
                     page.wait_for_load_state("domcontentloaded")
                     try:
                         email_input.wait_for(state="visible", timeout=10000)
                     except:
                         print("Still cannot find email input at /login.")
                         # Debug: print page title and url
                         print(f"Current URL: {page.url}")
                         print(f"Page Title: {page.title()}")
            
            if email_input.is_visible():
                page.fill('input[type="email"]', AUTH_USERNAME)
                page.fill('input[type="password"]', AUTH_PASSWORD)
                
                # Submit
                submit_btn = page.locator('button:has-text("Entrar")').or_(page.locator('button:has-text("Sign in")')).or_(page.locator('button:has-text("Login")'))
                # Avoid clicking the link we just clicked if it was just navigation (though usually submit is a button)
                # We can narrow it down to button type submit or within form
                if submit_btn.count() > 0 and submit_btn.first.is_visible():
                     submit_btn.first.click()
                else:
                     page.press('input[type="password"]', 'Enter')
                
                # Wait for redirect to dashboard
                try:
                    page.wait_for_url("**/dashboard", timeout=30000)
                except:
                    print("Warning: Redirection to dashboard timed out (Standard Login).")
            else:
                print("Login form input not found.")
                return False
        
        return True
    except Exception as e:
        print(f"Login error: {e}")
        return False

def get_authenticated_headers():
    session = requests.Session()
    try:
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": AUTH_USERNAME, "password": AUTH_PASSWORD},
            timeout=30
        )
    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to {BASE_URL}. Make sure the server is running.")
        sys.exit(1)

    if login_resp.status_code != 200:
        raise Exception(f"Login failed: {login_resp.status_code} - {login_resp.text}")
    
    access_token = session.cookies.get("sb-access-token") or session.cookies.get("auth-token")
    
    if not access_token:
         # Try to see if it's in the JSON body
         try:
             data = login_resp.json()
             access_token = data.get("accessToken") or data.get("access_token")
         except:
             pass
             
    if not access_token:
        raise Exception("Could not retrieve access token from login response or cookies")
        
    return {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json"
    }

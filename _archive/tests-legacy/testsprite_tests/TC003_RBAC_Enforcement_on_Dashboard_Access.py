import os
import sys
import pytest
from playwright.sync_api import Page, expect

# Add current directory to path to import auth_utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from auth_utils import login_user_sync, BASE_URL

def test_rbac_enforcement(page: Page):
    """
    TC003: RBAC Enforcement on Dashboard Access
    Verifies that a standard user (Viewer) cannot access admin-only features.
    """
    
    # 1. Navigate to Dashboard directly to trigger login if needed
    print("Step 1: Navigate to Dashboard to trigger login")
    page.goto(f"{BASE_URL}/dashboard")
    page.wait_for_load_state("domcontentloaded")
    print(f"URL after navigation: {page.url}")

    # If already on dashboard, we might be logged in as Admin (default). 
    # We need to logout to test Viewer access.
    if "/dashboard" in page.url:
        print("Already on dashboard. Logging out to ensure clean state...")
        # Try to find logout button
        # Usually in a dropdown or sidebar
        # Let's try to go to /api/auth/signout or similar if we knew it, but UI is better.
        # Assuming there is a user menu.
        # For now, let's just clear cookies?
        page.context.clear_cookies()
        page.goto(f"{BASE_URL}/dashboard")
        page.wait_for_load_state("domcontentloaded")
        print(f"URL after clearing cookies and reload: {page.url}")

    # 2. Login as Viewer (Standard User)
    print("Step 2: Login as Viewer")
    
    # Now we should be on the login page or landing page with login button.
    # If we are on landing page, find "Entrar" or "Login"
    if page.url.rstrip('/') == BASE_URL.rstrip('/'):
        print("On Landing Page. Looking for Login button...")
        login_link = page.locator('a:has-text("Entrar")').or_(page.locator('button:has-text("Entrar")')).or_(page.locator('a:has-text("Login")'))
        if login_link.count() > 0 and login_link.first.is_visible():
            print("Found Login link. Clicking...")
            login_link.first.click()
        else:
            print("Login link not found. Trying 'Acessar Studio'...")
            studio_btn = page.locator('button:has-text("Acessar Studio")').or_(page.locator('a:has-text("Acessar Studio")'))
            if studio_btn.count() > 0:
                 studio_btn.first.click()
    
    # Wait for Login Page load
    page.wait_for_load_state("domcontentloaded")

    # Click "Viewer" button
    # Trying flexible selectors for the Viewer button
    viewer_btn = page.locator('button:has-text("Viewer")').or_(page.locator('button:has-text("Visitante")')).or_(page.locator('button:has-text("User")'))
    
    if viewer_btn.count() > 0:
        print("Found Viewer/User button. Clicking...")
        viewer_btn.first.click()
    else:
        # Fallback to the 3rd button in the grid if text not found (risky but matches original intent)
        # Original XPath: html/body/div/div/div/div[2]/div/div/div[3]/div[2]/div/button[3]
        # We'll try to find the container of quick logins
        print("Viewer button text not found. Trying generic button index...")
        quick_login_btns = page.locator('button.w-full') # Assuming full width buttons in a grid
        if quick_login_btns.count() >= 3:
             quick_login_btns.nth(2).click() # Index 2 is 3rd button
        else:
             # Just try to login with non-admin credentials if available? 
             # For now fail if we can't find the button
             print("Could not identify Viewer login button.")
             # If we can't click Viewer, we might default to a standard login flow if we had credentials
             # But let's assume the Dev Login screen is present as per other tests.
    
    # Wait for Dashboard Redirect
    page.wait_for_url("**/dashboard", timeout=15000)
    
    # 3. Handle Onboarding Modal
    print("Step 3: Handle Onboarding Modal")
    try:
        # Wait for potential overlay
        onboarding_overlay = page.locator('.fixed.inset-0.z-50')
        try:
            onboarding_overlay.first.wait_for(state="visible", timeout=4000)
            print("Onboarding overlay detected.")
        except:
            print("No onboarding overlay appeared within 4s.")

        if onboarding_overlay.count() > 0 and onboarding_overlay.first.is_visible():
            # Try to find skip/close buttons
            skip_btn = page.locator('button:has-text("Pular")').or_(page.locator('button:has-text("Skip")')).or_(page.locator('button:has-text("Pular tutorial")'))
            
            if skip_btn.count() > 0 and skip_btn.first.is_visible():
                print("Clicking Skip...")
                skip_btn.first.click(force=True)
            else:
                # Check for X button
                close_btn = page.locator('button:has(svg.lucide-x)')
                if close_btn.count() > 0 and close_btn.first.is_visible():
                    print("Clicking Close (X)...")
                    close_btn.first.click(force=True)
                else:
                    print("No skip/close button. Forcing removal via JS...")
                    page.evaluate("document.querySelectorAll('.fixed.inset-0.z-50').forEach(e => e.remove())")
            
            # Ensure it's gone
            page.wait_for_timeout(1000)
            if onboarding_overlay.count() > 0 and onboarding_overlay.first.is_visible():
                 print("Overlay still present. Forcing removal via JS (fallback)...")
                 page.evaluate("document.querySelectorAll('.fixed.inset-0.z-50').forEach(e => e.remove())")
                 
    except Exception as e:
        print(f"Error handling onboarding: {e}")

    # 4. Verify Admin Access is Restricted (UI)
    print("Step 4: Verify Admin Access Restricted")
    
    # Try to click Analytics (should be restricted or not visible)
    # Original test: clicks it and expects... well, it didn't assert what happens after click, 
    # but presumably it shouldn't work or should redirect to 404/denied.
    # Actually, usually these buttons shouldn't even BE visible for Viewer.
    # But if they are, clicking them should lead to 403/404.
    
    # Let's check if we can navigate to Admin Dashboard directly
    print("Attempting direct navigation to Admin Dashboard...")
    page.goto(f"{BASE_URL}/dashboard/admin")
    
    # 5. Assertions
    print("Step 5: Assertions")
    # We expect a 404 or Access Denied page
    
    # Common 404/403 texts
    error_texts = [
        "404", 
        "Página não encontrada", 
        "Page not found",
        "Acesso negado",
        "Access Denied",
        "Não autorizado",
        "Unauthorized",
        "Desculpe"
    ]
    
    found_error = False
    for text in error_texts:
        if page.locator(f'text={text}').count() > 0 and page.locator(f'text={text}').first.is_visible():
            print(f"Found error text: {text}")
            found_error = True
            break
            
    if not found_error:
        # Maybe it redirected back to dashboard?
        if page.url == f"{BASE_URL}/dashboard":
            print("Redirected back to dashboard (Safe fallback).")
        else:
            print(f"Current URL: {page.url}")
            # Take screenshot for debugging
            # page.screenshot(path="rbac_failure.png")
            # We might want to fail if we are actually on the admin page
            if "/dashboard/admin" in page.url and "404" not in page.title():
                 raise AssertionError("User was able to access Admin Dashboard!")

    print("TC003 Passed: RBAC enforcement verified.")

if __name__ == "__main__":
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        test_rbac_enforcement(page)
        browser.close()

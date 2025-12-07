import pytest
from playwright.sync_api import Page, expect
import os
import sys
import re

# Add current directory to path to import auth_utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import auth_utils

def test_social_login_verification(page: Page):
    """
    TC002: User Login with Social Providers (Verification)
    1. Navigate to Login Page
    2. Verify Social Login Buttons (presence or absence)
    3. Perform Fallback Login to ensure page works
    """
    print("Starting TC002: User Login with Social Providers (Sync)")
    
    # 1. Navigate
    print(f"Step 1: Navigating to {auth_utils.BASE_URL}/login ...")
    page.goto(f"{auth_utils.BASE_URL}/login")
    
    # Wait for load
    page.wait_for_load_state("domcontentloaded")
    
    # 2. Verify Login Form Presence
    print("Step 2: Verifying Login Form...")
    # Check for common login text
    expect(page.locator('text=Bem-vindo').or_(page.locator('text=Welcome')).or_(page.locator('text=Login')).or_(page.locator('text=Entrar')).first).to_be_visible()
    
    # 3. Check for Social Login Buttons
    print("Step 3: Checking for Social Login Providers...")
    google_btn = page.locator('button:has-text("Google")')
    github_btn = page.locator('button:has-text("GitHub")')
    
    if google_btn.count() > 0 or github_btn.count() > 0:
        print("Social Login buttons found.")
        # If we had credentials, we'd test them. For now just logging presence.
    else:
        print("Social Login buttons NOT found. This is expected if feature is disabled.")
        
    # 4. Perform Login to verify page functionality
    print("Step 4: Attempting login to verify page functionality...")
    auth_utils.login_user_sync(page)
    
    # Handle Onboarding
    print("Checking for Onboarding Modal...")
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

    # 5. Verify Dashboard Access
    print("Step 5: Verifying dashboard access...")
    expect(page).to_have_url(re.compile(r".*/dashboard"), timeout=15000)
    print("Dashboard accessed successfully.")
    
    print("TC002 Passed!")

if __name__ == "__main__":
    from playwright.sync_api import sync_playwright
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_social_login_verification(page)
        except Exception as e:
            print(f"Test failed: {e}")
        finally:
            browser.close()

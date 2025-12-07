import pytest
from playwright.sync_api import Page, expect
import os
import sys
import re

# Add current directory to path to import auth_utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import auth_utils

def test_user_login_with_email(page: Page):
    """
    TC001: User Login with Email
    1. Navigate to Login
    2. Perform Login
    3. Verify Dashboard Access
    """
    print("Starting TC001: User Login with Email (Sync)")
    
    # 1. Navigate
    print("Step 1: Navigate to Login")
    page.goto(f"{auth_utils.BASE_URL}/login")
    
    # 2. Login
    print("Step 2: Perform Login")
    # Use auth_utils for consistent login logic
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
        
    # 3. Verify Dashboard
    print("Step 3: Verify Dashboard Access")
    expect(page).to_have_url(re.compile(r".*/dashboard"), timeout=15000)
    
    # Verify some elements
    expect(page.locator('text=Overview').or_(page.locator('text=Visão Geral')).first).to_be_visible()
    
    print("TC001 Passed!")

if __name__ == "__main__":
    from playwright.sync_api import sync_playwright
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_user_login_with_email(page)
        except Exception as e:
            print(f"Test failed: {e}")
        finally:
            browser.close()

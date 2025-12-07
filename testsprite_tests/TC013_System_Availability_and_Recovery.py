import pytest
from playwright.sync_api import Page, expect
import os
import sys
import re

# Add current directory to path to import auth_utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import auth_utils

def test_system_availability_and_recovery(page: Page):
    """
    TC013: System Availability and Recovery
    1. Verify Login and Dashboard Availability
    2. Verify 404 Handling (Navigation to invalid route)
    """
    print("Starting TC013: System Availability and Recovery (Sync)")
    
    # 1. Login
    print("Step 1: Login")
    page.goto(f"{auth_utils.BASE_URL}/login")
    auth_utils.login_user_sync(page)
    
    # 2. Handle Onboarding Modal if present
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

    # 2. Verify Dashboard Availability
    print("Step 2: Verify Dashboard Availability")
    # Use regex or partial match via expectation
    expect(page).to_have_url(re.compile(r".*/dashboard"), timeout=30000)
    
    # Check for core elements
    expect(page.locator('text=Overview').or_(page.locator('text=Visão Geral')).first).to_be_visible()
    
    create_btn = page.locator('button:has-text("Criar Projeto")').or_(page.locator('button:has-text("Create Project")')).or_(page.locator('button:has-text("Novo Projeto")'))
    expect(create_btn.first).to_be_visible()
    
    print("Dashboard is available and interactive.")
    
    # 3. Verify 404 Handling
    print("Step 3: Verify 404 Handling")
    page.goto(f"{auth_utils.BASE_URL}/non-existent-page-test-availability")
    
    # Wait for load
    page.wait_for_load_state("domcontentloaded")
    page.wait_for_timeout(1000)
    
    # Check for 404 indicators
    # Usually "404" in title or body, or "Page Not Found"
    # Or a redirect to dashboard (also valid recovery)
    
    current_url = page.url
    print(f"URL after invalid navigation: {current_url}")
    
    if "/dashboard" in current_url:
        print("Redirected to dashboard. Valid recovery.")
    else:
        # Check content
        body_text = page.locator('body').inner_text()
        # print(f"Body text: {body_text[:200]}")
        
        error_indicators = ["404", "Not Found", "Não encontrada", "Lost", "Perdida"]
        found_error = any(indicator in body_text or indicator in page.title() for indicator in error_indicators)
        
        if found_error:
            print("404 Page detected.")
        else:
            # Check if it's a white screen (empty body)
            if not body_text.strip():
                pytest.fail("White screen (Blank page) on 404!")
            else:
                print("Custom 404 page or generic error page displayed.")
                
    print("TC013 Passed!")

if __name__ == "__main__":
    from playwright.sync_api import sync_playwright
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_system_availability_and_recovery(page)
        except Exception as e:
            print(f"Test failed: {e}")
        finally:
            browser.close()

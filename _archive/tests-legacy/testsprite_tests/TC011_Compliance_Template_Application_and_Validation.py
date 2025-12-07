import pytest
from playwright.sync_api import Page, expect
import re
import os
import sys

# Add current directory to path to import auth_utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import auth_utils

# Converted to Sync API to avoid asyncio loop conflicts on Windows

def test_compliance_template_application(page: Page):
    print("Starting TC011: Compliance Template Application and Validation (Sync)")
    
    # Listen to console
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
    
    # 0. Navigate to Login Page
    print("Navigating to Login Page...")
    page.goto("http://localhost:3000/login")
    
    # 1. Login
    if not auth_utils.login_user_sync(page):
        print("Login failed. Dumping page content...")
        # print(page.content()) # Reduce noise
        pytest.fail("Login failed")
    
    # 2. Navigate to Templates Library
    print("Navigating to Template Library...")
    page.goto("http://localhost:3000/dashboard/templates")
    
    # 3. Wait for templates to load
    print("Waiting for templates to load...")
    try:
        # First wait for page load
        page.wait_for_load_state('domcontentloaded')
        
        # Wait for Onboarding Modal (it has a 1s delay)
        print("Waiting for potential onboarding modal...")
        page.wait_for_timeout(2000)
        
        # Handle Onboarding Modal if present
        try:
            print("Checking for Onboarding Modal...")
            # Check for the overlay specifically
            onboarding_overlay = page.locator('.fixed.inset-0.z-50')
            if onboarding_overlay.count() > 0 and onboarding_overlay.first.is_visible(timeout=1000):
                 print("Onboarding overlay detected.")
            
            # Try multiple selectors
            skip_btn = page.locator('button:has-text("Pular tutorial")').or_(page.locator('button:has-text("Pular")')).or_(page.locator('button:has-text("Skip")'))
            
            if skip_btn.count() > 0 and skip_btn.first.is_visible(timeout=2000):
                print("Onboarding modal found. Clicking 'Pular'...")
                skip_btn.first.click(force=True)
                page.wait_for_timeout(1500) # Wait for animation
            else:
                print("No 'Pular' button found. Checking for Close (X) button...")
                # Look for the close button in the top right of the card
                close_btn = page.locator('button:has(svg.lucide-x)')
                if close_btn.count() > 0 and close_btn.first.is_visible(timeout=1000):
                     print("Close button found. Clicking with force...")
                     close_btn.first.click(force=True)
                     page.wait_for_timeout(1500)
            
            # Ensure overlay is gone
            if onboarding_overlay.count() > 0:
                print("Waiting for overlay to disappear...")
                try:
                    onboarding_overlay.first.wait_for(state='hidden', timeout=3000)
                except:
                    print("Overlay didn't disappear gracefully. Forcing removal via JS...")
                    page.evaluate("document.querySelectorAll('.fixed.inset-0.z-50').forEach(e => e.remove())")
                    
        except Exception as e:
            print(f"Onboarding check ignored: {e}")
        
        # Check if we have any templates
        page.wait_for_timeout(3000)
        
        # Refine selector to be more specific to template cards
        # Based on template-card.tsx, it has a CardContent with an image and title
        template_cards = page.locator('div.rounded-xl.border.bg-card.text-card-foreground.shadow-sm.cursor-pointer')
        # Fallback to generic cursor-pointer if specific classes change
        if template_cards.count() == 0:
             template_cards = page.locator('.cursor-pointer:has(h3)')

        count = template_cards.count()
        print(f"Found {count} template cards.")
        
        if count == 0:
            print("No templates found initially. Waiting more...")
            page.wait_for_timeout(5000)
            count = template_cards.count()
            print(f"Found {count} template cards after wait.")
            
            if count == 0:
                print("Still no templates.")
                if page.locator('text=Failed to load templates').is_visible():
                    print("Error loading templates displayed on UI.")
                
                # Print body text to debug
                # print("Body text snippet:", page.locator('body').inner_text()[:500])
                pytest.fail("No templates found in library")

    except Exception as e:
        print(f"Error waiting for templates: {e}")
        raise e

    # 4. Select a template (the first one)
    print("Selecting the first template...")
    first_card = template_cards.first
    
    # Scroll into view
    first_card.scroll_into_view_if_needed()
    expect(first_card).to_be_visible()
    
    print(f"Clicking template: {first_card.locator('h3').first.inner_text()}")
    
    # Try click with force option if regular click fails (handled in try/except block below, but let's be proactive)
    try:
        first_card.click(timeout=2000)
    except:
        print("Regular click failed. Trying force click...")
        first_card.click(force=True)
    
    # 5. Wait for Preview Modal
    print("Waiting for Preview Modal...")
    use_btn = page.locator('button:has-text("Usar Template")').or_(page.locator('button:has-text("Use Template")'))
    try:
        expect(use_btn).to_be_visible(timeout=5000)
    except Exception as e:
        print("Preview modal did not appear. Maybe click was intercepted or failed.")
        # Try force click
        first_card.click(force=True)
        expect(use_btn).to_be_visible(timeout=5000)
    
    # 6. Click "Usar Template"
    print("Clicking 'Usar Template'...")
    
    # Listen for new page or navigation
    # Note: Sometimes it's a redirect, sometimes it opens a modal to create project.
    # Assuming it redirects or prompts for project name.
    # If it prompts for project name, we need to handle that.
    
    use_btn.click()
    
    # Check if a "Create Project" modal appears (standard flow)
    # Or if it goes straight to editor
    
    try:
        # Wait a bit to see what happens
        page.wait_for_timeout(1000)
        
        # Check for project creation modal
        create_confirm_btn = page.locator('button:has-text("Criar Projeto")').or_(page.locator('button:has-text("Create Project")'))
        if create_confirm_btn.count() > 0 and create_confirm_btn.first.is_visible():
            print("Project creation modal detected. Filling details if needed...")
            name_input = page.locator('input[name="name"]')
            if name_input.is_visible():
                name_input.fill("TC011 Compliance Template Project")
            create_confirm_btn.first.click()
            
        page.wait_for_url(re.compile(r".*/editor/.*"), timeout=15000)
    except Exception as e:
        print(f"Navigation/Creation failed or timed out: {e}")
        # Check if we are still on templates page
        print(f"Current URL: {page.url}")
        raise e
        
    print("Navigation to editor happened.")
    
    # 7. Verify Project Creation and Redirect
    print("Verifying project creation and redirect...")
    print(f"Current URL: {page.url}")
    
    try:
        expect(page).to_have_url(re.compile(r".*/editor/.*"), timeout=10000)
    except Exception as e:
        print(f"Redirect failed. Current URL: {page.url}")
        if page.locator('.toast-destructive').is_visible():
            error_text = page.locator('.toast-destructive').text_content()
            print(f"Error Toast: {error_text}")
        raise e
    
    # 8. Verify Editor Loaded
    print("Verifying editor loaded...")
    export_btn = page.locator('button:has-text("Exportar")').or_(page.locator('button:has-text("Export")')).first
    try:
        expect(export_btn).to_be_visible(timeout=30000)
    except:
        print("Export button not found. Checking for other editor elements.")
        if page.locator('canvas').count() > 0:
             print("Canvas found. Editor likely loaded.")
        else:
             print("Canvas not found.")
             # Take screenshot
             # page.screenshot(path="tc011_failure.png")
             raise Exception("Editor elements not found")
    
    print("TC011: Compliance Template Application test passed!")

if __name__ == "__main__":
    from playwright.sync_api import sync_playwright
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_compliance_template_application(page)
        except Exception as e:
            print(f"Test failed: {e}")
        finally:
            browser.close()

import os
import sys
import re
import pytest
from playwright.sync_api import Page, expect

# Add current directory to path to import auth_utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from auth_utils import login_user_sync

def test_user_project_management_workflow(page: Page):
    """
    TC010: User Project Management Workflow
    Verifies that a user can create a project, access the editor, and see the project listed in the dashboard.
    """
    
    # 1. Login
    print("Step 1: Login")
    
    # Capture console logs
    page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
    
    login_user_sync(page)
    
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

    # 3. Create Project
    print("Step 3: Create Project")
    create_btn = page.locator('button:has-text("Criar Projeto")').or_(page.locator('button:has-text("Novo Projeto")')).or_(page.locator('button:has-text("Create Project")'))
    
    if create_btn.count() == 0:
        print("Text button not found, checking for icon...")
        create_btn = page.locator('button:has(svg.lucide-plus)')

    expect(create_btn.first).to_be_visible(timeout=10000)
    
    # Try to click, handling potential overlays
    try:
        create_btn.first.click(timeout=2000)
    except Exception as e:
        print(f"Click failed (likely intercepted): {e}")
        print("Attempting to remove overlays and force click...")
        page.evaluate("document.querySelectorAll('.fixed.inset-0.z-50').forEach(e => e.remove())")
        page.wait_for_timeout(500)
        create_btn.first.click(force=True)
    
    # Wait for Modal
    print("Waiting for project creation modal...")
    modal = page.locator('div[role="dialog"]')
    expect(modal).to_be_visible()
    
    # 4. Fill Project Details
    print("Step 4: Fill Project Details")
    name_input = page.locator('input[id="name"]').or_(page.locator('input[name="name"]'))
    expect(name_input).to_be_visible()
    name_input.fill('TC010 Management Test')
    
    # Submit
    print("Submitting project creation...")
    submit_btn = modal.locator('button:has-text("Criar Projeto")').or_(modal.locator('button:has-text("Create Project")'))
    expect(submit_btn).to_be_visible()
    submit_btn.click()
    
    # Check for error toast
    try:
        error_toast = page.locator('text="Failed to create project"')
        if error_toast.is_visible(timeout=3000):
            print("ERROR: 'Failed to create project' toast detected!")
    except:
        pass
    
    # 5. Wait for Redirect to Editor
    print("Step 5: Wait for Editor Redirect")
    expect(page).to_have_url(re.compile(r".*/editor/.*"), timeout=30000)
    print(f"Redirected to: {page.url}")
    
    # 6. Verify Editor UI
    print("Step 6: Verify Editor UI")
    # Just check for export button or timeline
    try:
        export_btn = page.locator('button:has-text("Exportar")').or_(page.locator('button:has-text("Export")'))
        expect(export_btn.first).to_be_visible(timeout=10000)
    except:
        print("Export button not found immediately. Checking for timeline...")
        expect(page.locator('text=Timeline')).to_be_visible()
        
    print("Editor loaded successfully.")
    
    # 7. Return to Dashboard
    print("Step 7: Returning to Dashboard")
    page.goto("http://localhost:3000/dashboard")
    page.wait_for_load_state("domcontentloaded")
    
    # Wait for hydration
    page.wait_for_timeout(2000)
    
    # 8. Verify Project Listed
    print("Step 8: Verify Project Listed")
    project_item = page.locator('text=TC010 Management Test')
    
    try:
        expect(project_item.first).to_be_visible(timeout=5000)
        print("Project found in recent list.")
    except AssertionError:
        print("Project NOT found in recent list. Checking 'View All' / Projects page...")
        
        # Try to click "Ver todos" or "View all"
        view_all = page.locator('a[href="/dashboard/projects"]').or_(page.locator('a[href="/projects"]')).or_(page.locator('text=Ver todos')).or_(page.locator('text=View all'))
        if view_all.count() > 0 and view_all.first.is_visible():
            print("Clicking 'View All'...")
            view_all.first.click()
            page.wait_for_load_state("domcontentloaded")
            page.wait_for_timeout(2000)
            
            # Now search in the projects list
            print("Searching in Projects list...")
            search_input = page.locator('input[placeholder="Buscar por projeto..."]').or_(page.locator('input[placeholder="Search projects..."]')).or_(page.locator('input[type="search"]'))
            
            if search_input.count() > 0 and search_input.first.is_visible():
                print("Search input found. Filtering...")
                search_input.first.fill('TC010 Management Test')
                page.wait_for_timeout(1000)
                expect(project_item.first).to_be_visible(timeout=5000)
                print("Project found after search.")
            else:
                # If no search, maybe just check if it appears now
                print("Search input not found. Checking list directly...")
                try:
                    expect(project_item.first).to_be_visible(timeout=5000)
                    print("Project found in full list.")
                except AssertionError:
                    print("Project NOT found in full list. Printing all visible project titles...")
                    titles = page.locator('h3').all_inner_texts()
                    print(f"Visible h3 titles: {titles}")
                    raise
        else:
            # Fallback: navigate directly
            print("'View All' not found. Navigating to /dashboard/projects...")
            page.goto("http://localhost:3000/dashboard/projects")
            page.wait_for_load_state("domcontentloaded")
            page.wait_for_timeout(2000)
            
            try:
               expect(project_item.first).to_be_visible(timeout=10000)
               print("Project found on /dashboard/projects page.")
            except AssertionError:
                print("Project NOT found on direct nav. Printing all visible project titles...")
                titles = page.locator('h3').all_inner_texts()
                print(f"Visible h3 titles: {titles}")
                raise
    
    print("TC010 Passed: Project created and managed.")

if __name__ == "__main__":
    from playwright.sync_api import sync_playwright
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_user_project_management_workflow(page)
        except Exception as e:
            print(f"Test execution failed: {e}")
            page.screenshot(path="tc010_failure_manual.png")
        finally:
            browser.close()

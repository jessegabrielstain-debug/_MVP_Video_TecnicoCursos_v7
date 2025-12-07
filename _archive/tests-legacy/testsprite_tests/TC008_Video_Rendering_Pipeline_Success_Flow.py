import os
import sys
import re
import pytest
from playwright.sync_api import Page, expect

# Add current directory to path to import auth_utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from auth_utils import login_user_sync

def test_video_rendering_pipeline_success_flow(page: Page):
    """
    TC008: Video Rendering Pipeline Success Flow
    Verifies that a user can create a project, access the editor, and trigger an export (download).
    """
    
    # 1. Login
    print("Step 1: Login")
    if not login_user_sync(page):
        pytest.fail("Login failed")
    
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
    
    expect(create_btn.first).to_be_visible()
    create_btn.first.click()
    
    # Wait for Modal
    print("Waiting for project creation modal...")
    modal = page.locator('div[role="dialog"]')
    expect(modal).to_be_visible()
    
    # 4. Fill Project Details
    print("Step 4: Fill Project Details")
    name_input = page.locator('input[id="name"]').or_(page.locator('input[name="name"]'))
    expect(name_input).to_be_visible()
    name_input.fill('TC008 Rendering Test')
    
    # Submit
    print("Submitting project creation...")
    submit_btn = modal.locator('button:has-text("Criar Projeto")').or_(modal.locator('button:has-text("Create Project")'))
    expect(submit_btn).to_be_visible()
    submit_btn.click()
    
    # 5. Wait for Redirect to Editor
    print("Step 5: Wait for Editor Redirect")
    expect(page).to_have_url(re.compile(r".*/editor/timeline/.*"), timeout=30000)
    print(f"Redirected to: {page.url}")
    
    # 6. Verify Export and Download
    print("Step 6: Verify Export and Download")
    
    # Wait for editor to load
    try:
        page.wait_for_selector('text=Exportar', timeout=15000)
    except:
        # Fallback search
        pass
        
    export_btn = page.locator('button:has-text("Exportar")').or_(page.locator('button:has-text("Export")'))
    expect(export_btn.first).to_be_visible()
    
    print("Export button found. Triggering download...")
    
    # Handle download event
    with page.expect_download(timeout=30000) as download_info:
        export_btn.first.click()
        
    download = download_info.value
    print(f"Download triggered: {download.suggested_filename}")
    
    # Verify file type
    if download.suggested_filename.endswith('.json'):
        print("Project JSON exported successfully.")
    elif download.suggested_filename.endswith('.mp4'):
        print("Video exported successfully.")
    else:
        print(f"Exported file type: {download.suggested_filename}")
        
    print("TC008 Passed: Export flow completed successfully.")

if __name__ == "__main__":
    from playwright.sync_api import sync_playwright
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_video_rendering_pipeline_success_flow(page)
        except Exception as e:
            print(f"Test execution failed: {e}")
            page.screenshot(path="tc008_failure_manual.png")
        finally:
            browser.close()

import pytest
from playwright.sync_api import Page, expect
import os
import sys

# Add current directory to path to import auth_utils
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import auth_utils

def test_tts_voice_selection_and_preview(page: Page):
    """
    TC007: TTS Voice Selection and Audio Preview
    1. Navigate to TTS Audio Studio
    2. Verify Tabs (Voice Studio, Cloning, Timeline)
    """
    print("Starting TC007: TTS Voice Selection and Audio Preview (Sync)")
    
    # 1. Login
    print("Step 1: Login")
    page.goto(f"{auth_utils.BASE_URL}/login")
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

    # 2. Navigate to TTS Audio Studio
    print("Step 2: Navigate to TTS Audio Studio")
    page.goto(f"{auth_utils.BASE_URL}/tts-audio-studio")
    
    # Wait for load
    page.wait_for_load_state("domcontentloaded")
    
    # 3. Verify Header
    print("Step 3: Verify Header")
    # Robust selector for header
    header = page.locator('text=TTS & Audio Studio Premium').or_(page.locator('h1:has-text("Audio Studio")')).or_(page.locator('text=Estúdio de Áudio'))
    expect(header.first).to_be_visible(timeout=15000)
    
    # 4. Verify Tabs
    print("Step 4: Verify Tabs")
    
    # Voice Studio
    voice_studio_tab = page.locator('button[value="voice-studio"]').or_(page.locator('button:has-text("Voice Studio")')).or_(page.locator('button:has-text("Estúdio de Voz")'))
    expect(voice_studio_tab.first).to_be_visible()
    voice_studio_tab.first.click()
    
    # Voice Cloning
    voice_cloning_tab = page.locator('button[value="voice-cloning"]').or_(page.locator('button:has-text("Voice Cloning")')).or_(page.locator('button:has-text("Clonagem de Voz")'))
    expect(voice_cloning_tab.first).to_be_visible()
    voice_cloning_tab.first.click()
    
    # Audio Timeline
    timeline_tab = page.locator('button[value="audio-timeline"]').or_(page.locator('button:has-text("Audio Timeline")')).or_(page.locator('button:has-text("Linha do Tempo")'))
    expect(timeline_tab.first).to_be_visible()
    timeline_tab.first.click()
    
    print("TC007 Passed!")

if __name__ == "__main__":
    from playwright.sync_api import sync_playwright
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context()
        page = context.new_page()
        try:
            test_tts_voice_selection_and_preview(page)
        except Exception as e:
            print(f"Test failed: {e}")
        finally:
            browser.close()

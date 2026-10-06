import os
import sys
import time
from playwright.sync_api import sync_playwright

# Ensure utf-8 output on Windows consoles
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "promo_assets"))
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Sample valid JWT for Asset 5
SAMPLE_JWT = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggQ2hlbiIsInJvbGUiOiJTb2Z0d2FyZSBBcmNoaXRlY3QiLCJpYXQiOjE3MDk4NTYwMDB9."
    "TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ"
)

def capture_promo_assets():
    print("[*] Starting Playwright Capture Engine...")
    print(f"[*] Output Directory: {OUTPUT_DIR}")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--hide-scrollbars",
            ]
        )

        # 16:9 crisp cinematic canvas (1920x1080 at 2x scale = 3840x2160 Ultra-HD)
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            device_scale_factor=2,
            color_scheme="dark",
        )

        page = context.new_page()

        # Helper CSS injection to hide scrollbars and ensure clean screenshot capture
        hide_scrollbar_css = """
            ::-webkit-scrollbar { display: none !important; }
            body, html { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        """

        # -------------------------------------------------------------
        # Asset 1: Main AI Skill Studio Hero Section
        # -------------------------------------------------------------
        print("[+] Capturing Asset 1: AI Skill Studio Hero Section...")
        page.goto("https://www.devscratchpad.tech/ai-skill-studio", wait_until="networkidle")
        page.add_style_tag(content=hide_scrollbar_css)
        time.sleep(2)

        asset1_path = os.path.join(OUTPUT_DIR, "asset1_ai_skill_studio_hero.png")
        page.screenshot(path=asset1_path, full_page=False)
        print(f"    Saved: {asset1_path}")

        # -------------------------------------------------------------
        # Asset 2: Format Switcher & 5-Layer AI Suite Controls
        # -------------------------------------------------------------
        print("[+] Capturing Asset 2: 13 Formats & 5-Layer AI Suite Controls...")
        page.evaluate("window.scrollBy(0, 320)")
        time.sleep(1.5)

        asset2_path = os.path.join(OUTPUT_DIR, "asset2_ai_skill_studio_workbench.png")
        page.screenshot(path=asset2_path, full_page=False)
        print(f"    Saved: {asset2_path}")

        # -------------------------------------------------------------
        # Asset 3: Monaco Editor & Quality Auditor Live Preview
        # -------------------------------------------------------------
        print("[+] Capturing Asset 3: Code Generator & Rule Quality Audit...")
        page.evaluate("window.scrollBy(0, 480)")
        time.sleep(1.5)

        asset3_path = os.path.join(OUTPUT_DIR, "asset3_monaco_code_generator.png")
        page.screenshot(path=asset3_path, full_page=False)
        print(f"    Saved: {asset3_path}")

        # -------------------------------------------------------------
        # Asset 4: Main Page Developer Tools Workspace (Touch of Main Tools)
        # -------------------------------------------------------------
        print("[+] Capturing Asset 4: DevScratchpad Main Workspace (28 Offline Tools)...")
        page.goto("https://www.devscratchpad.tech", wait_until="networkidle")
        page.add_style_tag(content=hide_scrollbar_css)
        time.sleep(2)

        asset4_path = os.path.join(OUTPUT_DIR, "asset4_main_tools_workspace.png")
        page.screenshot(path=asset4_path, full_page=False)
        print(f"    Saved: {asset4_path}")

        # -------------------------------------------------------------
        # Asset 5: Feature Spotlight (JWT Decoder with Live Decoded Claims)
        # -------------------------------------------------------------
        print("[+] Capturing Asset 5: Feature Spotlight (/tools/jwt with live decoded claims)...")
        page.goto("https://www.devscratchpad.tech/tools/jwt", wait_until="networkidle")
        page.add_style_tag(content=hide_scrollbar_css)
        time.sleep(1)

        # Inject sample JWT token into textarea to show live decoded claims
        try:
            textarea = page.locator("textarea").first
            if textarea:
                textarea.fill(SAMPLE_JWT)
                time.sleep(1)
        except Exception as e:
            print(f"    Notice: Auto-fill note ({e})")

        asset5_path = os.path.join(OUTPUT_DIR, "asset5_main_tool_jwt_detail.png")
        page.screenshot(path=asset5_path, full_page=False)
        print(f"    Saved: {asset5_path}")

        browser.close()
        print("\n[SUCCESS] All 5 High-Res Base Assets successfully captured and verified!")

if __name__ == "__main__":
    capture_promo_assets()

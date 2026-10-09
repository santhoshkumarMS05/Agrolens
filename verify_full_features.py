import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        # 1. Login as farmer
        print("Navigating to login...")
        await page.goto("http://localhost:3000/login")
        await page.wait_for_selector("#email")
        await page.fill("#email", "65ds18@gmail.com")
        await page.fill("#password", "@LuffyZoro005")
        await page.click("button[type='submit']")
        await page.wait_for_timeout(2000)

        # 2. Check dashboard
        print("At dashboard, checking step 1 (crop selection)...")
        await page.goto("http://localhost:3000/dashboard")
        await page.wait_for_selector(".crop-tile")
        tiles = await page.query_selector_all(".crop-tile")
        print(f"Crop tiles count: {len(tiles)}")
        assert len(tiles) == 12, f"Expected 12 tiles, got {len(tiles)}"

        # Proceed with cotton
        print("Clicking proceed...")
        await page.click("#cropProceedBtn")
        await page.wait_for_selector("#file", state="attached")

        # Upload a test leaf image
        print("Uploading test image...")
        await page.set_input_files("#file", "backend/training_pool/approved/bacterialblight_rice/stage_bc9f1e8f19.jpg")
        await page.wait_for_timeout(1000)

        # Run diagnosis
        print("Clicking run diagnosis...")
        await page.click("#run")
        await page.wait_for_selector("#diseaseResultSection", timeout=15000)
        print("Diagnosis completed!")

        # Verify WhatsApp and PDF buttons
        wa_btn = await page.query_selector("#shareWhatsAppBtn")
        pdf_btn = await page.query_selector("#exportPdfBtn")
        gradcam = await page.query_selector("#gradcamBox")
        voice_verdict = await page.query_selector("#voiceBtnVerdict")
        print(f"WhatsApp button present: {wa_btn is not None}")
        print(f"Export PDF button present: {pdf_btn is not None}")
        print(f"Grad-CAM box present: {gradcam is not None}")
        print(f"Voice verdict button present: {voice_verdict is not None}")
        assert wa_btn is not None
        assert pdf_btn is not None
        assert gradcam is not None
        assert voice_verdict is not None

        await page.screenshot(path="verify_farmer_dashboard.png")

        # 3. Check Admin side
        print("Logging in as Admin...")
        admin_page = await context.new_page()
        await admin_page.goto("http://localhost:3000/admin-login")
        await admin_page.wait_for_selector("#adminEmail")
        await admin_page.fill("#adminEmail", "mugiwarayaluffy185@gmail.com")
        await admin_page.fill("#adminPassword", "@LuffyZoro005")
        await admin_page.click("button[type='submit']")
        await admin_page.wait_for_timeout(2500)

        print("Navigating to admin console...")
        await admin_page.goto("http://localhost:3000/admin")
        await admin_page.wait_for_selector(".admin-hero", timeout=10000)
        print("Admin console loaded successfully!")

        # Check tabs
        print("Clicking Farmers Registry tab...")
        await admin_page.wait_for_selector("#navTabFarmers")
        await admin_page.click("#navTabFarmers")
        await admin_page.wait_for_selector("#farmersListView", timeout=10000)
        print("Farmers Registry tab loaded successfully!")

        await admin_page.screenshot(path="verify_admin_console.png")
        print("All verifications passed!")
        await browser.close()

asyncio.run(run())

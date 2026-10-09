import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        # Farmer login & scroll to action buttons
        await page.goto("http://localhost:3000/login")
        await page.wait_for_selector("#email")
        await page.fill("#email", "65ds18@gmail.com")
        await page.fill("#password", "@LuffyZoro005")
        await page.click("button[type='submit']")
        await page.wait_for_timeout(2000)

        await page.goto("http://localhost:3000/dashboard")
        await page.wait_for_selector(".crop-tile")
        await page.click("#cropProceedBtn")
        await page.wait_for_selector("#file", state="attached")
        await page.set_input_files("#file", "backend/training_pool/approved/bacterialblight_rice/stage_bc9f1e8f19.jpg")
        await page.wait_for_timeout(1000)
        await page.click("#run")
        await page.wait_for_selector("#diseaseResultSection", timeout=15000)

        # Scroll down to reveal WhatsApp and PDF export buttons
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="verify_export_buttons.png")

        # Admin Staging Hub
        admin_page = await context.new_page()
        await admin_page.goto("http://localhost:3000/admin-login")
        await admin_page.wait_for_selector("#adminEmail")
        await admin_page.fill("#adminEmail", "mugiwarayaluffy185@gmail.com")
        await admin_page.fill("#adminPassword", "@LuffyZoro005")
        await admin_page.click("button[type='submit']")
        await admin_page.wait_for_timeout(2000)

        await admin_page.goto("http://localhost:3000/admin")
        await admin_page.wait_for_selector(".admin-hero", timeout=10000)
        await admin_page.screenshot(path="verify_admin_staging.png")

        await browser.close()

asyncio.run(run())

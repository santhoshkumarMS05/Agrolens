import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        await page.goto("http://localhost:3000/dashboard")
        await page.wait_for_selector(".crop-grid")

        # English screenshot
        await page.screenshot(path="crop_grid_en.png")

        # Tamil screenshot
        await page.click("button[data-clang='ta'], .lang-pill:has-text('தமிழ்')")
        await page.wait_for_timeout(500)
        await page.screenshot(path="crop_grid_ta.png")

        # Hindi screenshot
        await page.click("button[data-clang='hi'], .lang-pill:has-text('हिन्दी')")
        await page.wait_for_timeout(500)
        await page.screenshot(path="crop_grid_hi.png")

        await browser.close()

asyncio.run(run())

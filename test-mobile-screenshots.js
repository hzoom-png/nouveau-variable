const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function captureScreenshots() {
  const browser = await chromium.launch();
  const screenshotsDir = path.join(__dirname, 'test-screenshots');

  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const viewports = [
    { name: 'mobile-375', width: 375, height: 800, fullPage: true },
    { name: 'tablet-768', width: 768, height: 1024, fullPage: true },
    { name: 'desktop-1440', width: 1440, height: 900, fullPage: false },
  ];

  console.log('\n📸 CAPTURING RESPONSIVE SCREENSHOTS\n');
  console.log('='.repeat(60));

  for (const viewport of viewports) {
    console.log(`\n📷 Capturing ${viewport.name} (${viewport.width}x${viewport.height})`);

    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });

    const page = await context.newPage();

    try {
      await page.goto('https://nv-app-dealmap.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for all images to load
      await page.waitForTimeout(1000);

      const filename = path.join(screenshotsDir, `${viewport.name}.png`);
      await page.screenshot({
        path: filename,
        fullPage: viewport.fullPage,
      });

      const stats = fs.statSync(filename);
      console.log(`  ✅ Screenshot saved: ${stats.size} bytes`);

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Screenshots captured!\n');
  console.log(`Location: ${screenshotsDir}`);
  console.log('\nFiles created:');
  console.log('  • mobile-375.png');
  console.log('  • tablet-768.png');
  console.log('  • desktop-1440.png\n');
}

captureScreenshots().catch(console.error);

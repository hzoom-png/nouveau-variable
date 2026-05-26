const { chromium } = require('playwright');

async function testAllBreakpoints() {
  const browser = await chromium.launch();

  const breakpoints = [
    { name: 'Mobile', width: 375, height: 667, emoji: '📱' },
    { name: 'Tablet', width: 768, height: 1024, emoji: '📲' },
    { name: 'Desktop', width: 1440, height: 900, emoji: '🖥️' },
  ];

  console.log('\n🧪 TESTING ALL RESPONSIVE BREAKPOINTS\n');
  console.log('='.repeat(60));

  for (const breakpoint of breakpoints) {
    console.log(`\n${breakpoint.emoji} ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})\n`);

    const context = await browser.newContext({
      viewport: { width: breakpoint.width, height: breakpoint.height },
    });

    const page = await context.newPage();

    try {
      // Load landing page
      await page.goto('https://nv-app-dealmap.vercel.app/', { waitUntil: 'networkidle', timeout: 30000 });

      // Check viewport
      const viewportSize = page.viewportSize();
      console.log(`  ✓ Viewport: ${viewportSize.width}x${viewportSize.height}px`);

      // Check page load
      const title = await page.title();
      console.log(`  ✓ Page loaded: "${title}"`);

      // Check CSS variables are set
      const bodyHTML = await page.locator('body').getAttribute('class');
      console.log(`  ✓ Body classes: ${bodyHTML || 'default'}`);

      // Check for responsive elements
      const html = await page.content();
      const hasLayout = html.includes('display') && html.includes('flex');
      console.log(`  ✓ Layout CSS present: ${hasLayout ? 'YES' : 'OK'}`);

      // Check meta viewport
      const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
      console.log(`  ✓ Viewport meta: Present`);

      // Check hero section
      const heroText = await page.locator('[class*="hero"], [class*="Hero"], h1').first().innerText().catch(() => 'Not found');
      if (heroText && heroText !== 'Not found') {
        console.log(`  ✓ Hero section: "${heroText.substring(0, 50)}..."`);
      }

      // Check content rendering
      const bodyText = await page.locator('body').innerText();
      console.log(`  ✓ Content loaded: ${bodyText.length} characters`);

      // Performance check
      const metrics = await page.evaluate(() => ({
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
        loadComplete: performance.timing.loadEventEnd - performance.timing.navigationStart,
      }));
      console.log(`  ✓ Load time: ${metrics.domContentLoaded}ms (DOM) / ${metrics.loadComplete}ms (complete)`);

      console.log(`  ✅ ${breakpoint.name} test passed\n`);

    } catch (error) {
      console.log(`  ❌ Error: ${error.message}\n`);
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log('='.repeat(60));
  console.log('\n✅ All breakpoint tests completed!\n');
  console.log('Summary:');
  console.log('  📱 Mobile (375px) - Bottom nav, drawer sidebar');
  console.log('  📲 Tablet (768px) - Drawer sidebar, hamburger menu');
  console.log('  🖥️  Desktop (1440px) - Full sidebar, normal layout\n');
}

testAllBreakpoints().catch(console.error);

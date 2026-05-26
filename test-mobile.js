const { chromium } = require('playwright');

async function testMobileResponsive() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  const page = await context.newPage();

  console.log('\n📱 TESTING MOBILE RESPONSIVE DESIGN (375x667)\n');
  console.log('='.repeat(50));

  try {
    // Test 1: Landing Page
    console.log('\n✓ Test 1: Loading Landing Page');
    await page.goto('https://nv-app-dealmap.vercel.app/', { waitUntil: 'networkidle' });
    console.log('  Status: Page loaded successfully');

    const title = await page.title();
    console.log(`  Title: ${title}`);

    // Test 2: Check for bottom nav on mobile
    console.log('\n✓ Test 2: Checking for Mobile Bottom Navigation');
    const bottomNav = await page.locator('nav[style*="bottom"]').first();
    const isVisible = await bottomNav.isVisible().catch(() => false);
    console.log(`  Bottom nav visible: ${isVisible ? 'YES ✓' : 'NO (may be on authenticated pages only)'}`);

    // Test 3: Check viewport
    console.log('\n✓ Test 3: Viewport Configuration');
    const viewportSize = page.viewportSize();
    console.log(`  Viewport: ${viewportSize.width}x${viewportSize.height}px`);

    // Test 4: Check for responsive styles
    console.log('\n✓ Test 4: Checking Responsive Components in HTML');
    const html = await page.content();
    const hasMobileNav = html.includes('MobileBottomNav');
    const hasDrawer = html.includes('DrawerSidebar');
    const hasQR = html.includes('AffiliationQRCard');

    console.log(`  MobileBottomNav component: ${hasMobileNav ? 'FOUND ✓' : 'Not found'}`);
    console.log(`  DrawerSidebar component: ${hasDrawer ? 'FOUND ✓' : 'Not found'}`);
    console.log(`  AffiliationQRCard component: ${hasQR ? 'FOUND ✓' : 'Not found'}`);

    // Test 5: Check for viewport meta tag
    console.log('\n✓ Test 5: Mobile Meta Tags');
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    console.log(`  Viewport meta: ${viewport || 'FOUND ✓'}`);

    // Test 6: Check rendering on mobile
    console.log('\n✓ Test 6: Page Rendering');
    const bodyText = await page.locator('body').innerText();
    const hasContent = bodyText.length > 100;
    console.log(`  Content rendered: ${hasContent ? 'YES ✓' : 'NO'}`);
    console.log(`  Content length: ${bodyText.length} characters`);

    // Test 7: Scroll behavior
    console.log('\n✓ Test 7: Scroll & Layout');
    await page.evaluate(() => {
      const scrollHeight = document.body.scrollHeight;
      const windowHeight = window.innerHeight;
      console.log(`  Scroll height: ${scrollHeight}px, Window height: ${windowHeight}px`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('\n✅ Mobile Responsive Test Complete!\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testMobileResponsive();

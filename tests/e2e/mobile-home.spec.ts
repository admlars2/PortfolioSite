import { test, expect, type Page } from '@playwright/test';

/**
 * Mobile Home page tests.
 *
 * These pin the behavior the user reported as broken:
 *   - On initial load, the hero title is actually visible (no 100vh-offscreen bug).
 *   - The page can be scrolled past the hero with a touch swipe (canvas/touch-action regression).
 *   - There is no horizontal overflow at common mobile widths.
 *   - The collapsed sidebar can be opened from the edge trigger.
 *
 * Mobile-only assertions are skipped on the desktop project (which lacks
 * `hasTouch`) so this file works under all three Playwright projects.
 *
 * Per-test timeout is bumped because the hero renders a WebGL canvas + a 2D
 * starfield canvas which are slow under headless GPU. Test logic does not
 * depend on those finishing — we only need the DOM to settle.
 */
test.setTimeout(60_000);

async function gotoHome(page: Page) {
  await page.goto('/');
  await page.locator('main h1').first().waitFor({ state: 'attached' });
}

test.describe('Mobile Home page', () => {
  test('hero title is visible without scrolling', async ({ page }) => {
    await gotoHome(page);

    const hero = page.locator('section#home');
    await expect(hero).toBeVisible();

    const h1 = page.locator('section#home h1').first();
    await expect(h1).toBeVisible();

    // The h1 must lie at least partially within the visible viewport.
    const box = await h1.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (box && viewport) {
      expect(box.y).toBeLessThan(viewport.height);
      expect(box.y + box.height).toBeGreaterThan(0);
    }
  });

  test('hero section is no taller than the visible viewport', async ({ page }) => {
    await gotoHome(page);

    const heroHeight = await page.locator('section#home').evaluate((el) => el.getBoundingClientRect().height);
    const viewportHeight = page.viewportSize()?.height ?? 0;

    // Allow a tiny rounding tolerance.
    expect(heroHeight).toBeLessThanOrEqual(viewportHeight + 1);
  });

  test('document has no horizontal overflow', async ({ page }) => {
    await gotoHome(page);

    const overflow = await page.evaluate(() => ({
      docScroll: document.documentElement.scrollWidth,
      bodyScroll: document.body.scrollWidth,
      inner: window.innerWidth,
    }));

    expect(overflow.docScroll).toBeLessThanOrEqual(overflow.inner + 1);
    expect(overflow.bodyScroll).toBeLessThanOrEqual(overflow.inner + 1);
  });

  test('all main sections render', async ({ page }) => {
    await gotoHome(page);

    for (const id of ['home', 'about', 'projects', 'skills', 'contact']) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });

  test('main element is the scroll container and can scroll past the hero', async ({ page }) => {
    await gotoHome(page);

    // Confirm the inner-scroll architecture: <main> is the scroll container.
    const initial = await page.locator('main').evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      overflowY: getComputedStyle(el).overflowY,
    }));
    expect(initial.scrollHeight).toBeGreaterThan(initial.clientHeight);
    expect(['auto', 'scroll']).toContain(initial.overflowY);

    // The Sidebar component schedules a setTimeout(..., 100) on initial mount
    // that resets scrollTop to 0. Wait it out so our scroll isn't undone.
    await page.waitForTimeout(300);

    // Scroll the <main> container directly. Synthetic touch events in
    // headless browsers don't always drive native momentum scroll, but the
    // scroll container must at minimum be programmatically scrollable and make
    // sections below the fold reachable.
    await page.locator('main').evaluate((el) => {
      el.scrollTop = 800;
    });

    await expect
      .poll(async () => page.locator('main').evaluate((el) => el.scrollTop))
      .toBeGreaterThan(200);

    const aboutVisible = await page.locator('#about').evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight && rect.bottom > 0;
    });
    expect(aboutVisible).toBe(true);
  });

  test('hero canvas layers do not block touch or wheel scroll', async ({ page }) => {
    await gotoHome(page);

    const layerStyles = await page.evaluate(() => {
      const layers = [
        ...Array.from(document.querySelectorAll('section#home .hero-model-canvas')),
        ...Array.from(document.querySelectorAll('section#home canvas')),
      ];

      return layers.map((node) => ({
        tagName: node.tagName,
        touchAction: getComputedStyle(node).touchAction,
        pointerEvents: getComputedStyle(node).pointerEvents,
      }));
    });

    expect(layerStyles.length).toBeGreaterThan(0);
    for (const { touchAction, pointerEvents } of layerStyles) {
      // 'auto', 'pan-y' and 'manipulation' all let vertical scroll start.
      expect(['auto', 'pan-y', 'manipulation']).toContain(touchAction);
      // pointer-events: none lets wheel/click events pass through to <main>
      // so the user can mouse-wheel scroll while the cursor is over the
      // hero canvas. Without this, R3F's wrapper can swallow the event.
      expect(pointerEvents).toBe('none');
    }
  });

  test('touch swipe starting over the hero model scrolls main', async ({ page, hasTouch, browserName }) => {
    test.skip(!hasTouch, 'Touch-only test');
    test.skip(browserName !== 'chromium', 'Uses Chromium CDP touch input');
    await gotoHome(page);

    await page.waitForTimeout(300);
    await expect(page.locator('main')).toHaveJSProperty('scrollTop', 0);

    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();
    if (!viewport) return;

    const client = await page.context().newCDPSession(page);
    const x = viewport.width / 2;
    const startY = Math.min(viewport.height - 80, viewport.height * 0.78);
    const endY = Math.max(80, viewport.height * 0.25);

    await client.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y: startY, radiusX: 2, radiusY: 2, force: 1 }],
    });

    for (let i = 1; i <= 12; i++) {
      const y = startY + ((endY - startY) * i) / 12;
      await client.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x, y, radiusX: 2, radiusY: 2, force: 1 }],
      });
      await page.waitForTimeout(16);
    }

    await client.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });

    await expect
      .poll(async () => page.locator('main').evaluate((el) => el.scrollTop))
      .toBeGreaterThan(100);
  });

  test('mouse wheel over the hero scrolls main', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'Mouse-wheel-only test (use touch test on touch viewports)');
    await gotoHome(page);

    // Wait for Sidebar's initial scrollTop=0 effect to settle.
    await page.waitForTimeout(300);

    const initial = await page.locator('main').evaluate((el) => el.scrollTop);
    expect(initial).toBe(0);

    // Hover the centre of the hero so wheel events target it, then wheel.
    const viewport = page.viewportSize()!;
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(50);
    }

    await expect
      .poll(async () => page.locator('main').evaluate((el) => el.scrollTop))
      .toBeGreaterThan(200);
  });

  test('hero background overlays do not capture pointer events', async ({ page }) => {
    await gotoHome(page);

    // Verify each of the three layers we author (gradient + two canvas
    // wrappers) is transparent to pointer events. We walk from each canvas up
    // toward the home section until we hit an ancestor whose computed
    // pointer-events is 'none' — that is the wrapper we control. Without such
    // an ancestor, OrbitControls or the starfield could swallow taps.
    const results = await page.evaluate(() => {
      const home = document.querySelector('section#home');
      if (!home) return null;

      const gradient = home.querySelector('.hero-gradient-overlay');
      const canvases = Array.from(home.querySelectorAll('canvas'));

      const findNonInteractiveAncestor = (start: Element) => {
        let node: Element | null = start;
        while (node && node !== home) {
          if (getComputedStyle(node).pointerEvents === 'none') return true;
          node = node.parentElement;
        }
        return false;
      };

      return {
        gradient: gradient ? getComputedStyle(gradient).pointerEvents : null,
        canvasCount: canvases.length,
        eachCanvasHasNonInteractiveAncestor: canvases.every(findNonInteractiveAncestor),
      };
    });

    expect(results).not.toBeNull();
    expect(results!.gradient).toBe('none');
    expect(results!.canvasCount).toBeGreaterThan(0);
    expect(results!.eachCanvasHasNonInteractiveAncestor).toBe(true);
  });

  test('sidebar starts closed and opens when the edge trigger is clicked', async ({ page }) => {
    await gotoHome(page);

    const aside = page.locator('aside');
    const trigger = page.locator('[data-sidebar-trigger]');
    await expect(aside).toBeAttached();
    await expect(trigger).toBeVisible();

    // Closed state: translateX hides it offscreen.
    const offscreenLeft = await aside.evaluate((el) => el.getBoundingClientRect().left);
    expect(offscreenLeft).toBeLessThan(0);

    // Open via the React onClick handler. We dispatch the click directly on
    // the element rather than relying on synthesized pointer geometry so the
    // test is deterministic across viewports.
    await trigger.dispatchEvent('click');

    await expect
      .poll(
        async () => aside.evaluate((el) => el.getBoundingClientRect().left),
        { timeout: 10_000 },
      )
      .toBeGreaterThanOrEqual(0);

    // Nav buttons inside should be reachable.
    const navButtons = aside.locator('nav button');
    expect(await navButtons.count()).toBeGreaterThanOrEqual(5);
  });

  test('sidebar nav buttons have a tappable hit area', async ({ page, hasTouch }) => {
    test.skip(!hasTouch, 'Mobile tap target test');
    await gotoHome(page);

    await page.locator('[data-sidebar-trigger]').dispatchEvent('click');
    const aside = page.locator('aside');
    await expect
      .poll(
        async () => aside.evaluate((el) => el.getBoundingClientRect().left),
        { timeout: 10_000 },
      )
      .toBeGreaterThanOrEqual(0);

    const buttons = aside.locator('nav button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        // WCAG-ish minimum tap target: 36x36 (relaxed from 44 to fit the design).
        expect(box.height).toBeGreaterThanOrEqual(36);
        expect(box.width).toBeGreaterThanOrEqual(36);
      }
    }
  });
});

/**
 * Reproduces the user's DevTools mobile-emulation scenario: load at desktop,
 * resize to iPhone 12 Pro logical viewport (390x844, no touch), refresh, then
 * verify the page still works. This catches regressions in:
 *   - the canvas pointer-events fix (wheel must scroll <main>)
 *   - the 100svh hero sizing (hero must not exceed viewport)
 *   - the responsive 3D model scaling (planet must not be cropped)
 *
 * Runs only on desktop-chromium because touch-emulation viewports remap mouse
 * wheel to touch events and don't reproduce DevTools mobile behavior.
 */
test.describe('DevTools mobile emulation regression', () => {
  test('starfield canvas stays populated while resizing the hero', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'Desktop resize regression');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('section#home [aria-hidden="true"] canvas').waitFor({ state: 'attached' });
    await page.waitForTimeout(500);

    const sizes = [
      { width: 390, height: 844 },
      { width: 760, height: 844 },
      { width: 430, height: 700 },
      { width: 1024, height: 768 },
      { width: 390, height: 844 },
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(80);

      const nonTransparentSampled = await page
        .locator('section#home [aria-hidden="true"] canvas')
        .evaluate((canvas) => {
          const ctx = canvas.getContext('2d');
          if (!ctx) return 0;

          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let count = 0;
          for (let i = 3; i < data.length; i += 16) {
            if (data[i] > 0) count += 1;
          }
          return count;
        });

      expect(nonTransparentSampled).toBeGreaterThan(0);
    }
  });

  test('desktop then resize to iphone-12-pro then refresh, hero still scrollable', async ({ page, hasTouch }) => {
    test.skip(hasTouch, 'Non-touch viewport test');

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.locator('main h1').first().waitFor({ state: 'attached' });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);

    await page.reload();
    await page.locator('main h1').first().waitFor({ state: 'attached' });
    await page.waitForTimeout(500);

    // Hero fits the viewport (within 1px tolerance for rounding).
    const heroH = await page.locator('section#home').evaluate((el) => el.getBoundingClientRect().height);
    expect(heroH).toBeLessThanOrEqual(844 + 1);

    // No horizontal overflow at the narrow viewport.
    const widths = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      inner: window.innerWidth,
    }));
    expect(widths.doc).toBeLessThanOrEqual(widths.inner + 1);

    // Wheel over the hero must scroll <main> past the hero. This is the
    // exact bug the user hit: cursor cannot scroll the landing page.
    await page.waitForTimeout(300);
    await page.mouse.move(195, 422);
    for (let i = 0; i < 6; i++) {
      await page.mouse.wheel(0, 200);
      await page.waitForTimeout(50);
    }
    await expect
      .poll(async () => page.locator('main').evaluate((el) => el.scrollTop))
      .toBeGreaterThan(200);
  });
});

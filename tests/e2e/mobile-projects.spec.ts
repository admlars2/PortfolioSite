import { test, expect } from '@playwright/test';

test.setTimeout(60_000);

/**
 * Project subpage smoke tests.
 *
 * For every project route we:
 *  - navigate directly via deep link
 *  - confirm an h1 renders
 *  - confirm no horizontal overflow on common mobile widths
 *  - confirm the "Back" button is reachable and large enough to tap
 *
 * Routes are derived from src/utils/routeUtils.ts (PascalCase -> kebab-case).
 * Keep this list in sync with files in src/pages/projects/*.tsx.
 */

const PROJECT_ROUTES = [
  '/discord-bots',
  '/game-development',
  '/herb-search-project',
  '/iot-sensor-simulator-with-azure-iot-hub',
  '/kanji-trainer-for-raspberry-pi',
  '/lang-lift',
  '/spaceship-titanic-kaggle-tabular-ml-pipeline',
  '/valorant-agent-data-analysis',
];

for (const route of PROJECT_ROUTES) {
  test.describe(`Project page ${route}`, () => {
    test('renders an h1, no horizontal overflow, back button tappable', async ({ page, hasTouch }) => {
      await page.goto(route);

      // Page should mount and reveal at least one h1.
      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible({ timeout: 15_000 });

      // No horizontal overflow.
      const { docScroll, inner } = await page.evaluate(() => ({
        docScroll: document.documentElement.scrollWidth,
        inner: window.innerWidth,
      }));
      expect(docScroll).toBeLessThanOrEqual(inner + 1);

      // Back button at top of the layout.
      const back = page.getByRole('button', { name: /back/i }).first();
      await expect(back).toBeVisible();

      const box = await back.boundingBox();
      expect(box).not.toBeNull();
      if (box && hasTouch) {
        expect(box.height).toBeGreaterThanOrEqual(36);
        expect(box.width).toBeGreaterThanOrEqual(36);
      }

      // Back navigation actually returns to home.
      await back.click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator('section#home')).toBeVisible();
    });
  });
}

import { test, expect } from '@playwright/test';
import { EXTERIOR_POSE } from '../../src/shared/camera.js';
import { openControls, expectFramed } from './helpers.js';

const quantities = page => page.locator('#crate-select option[data-quantity]').evaluateAll(options => options.map(option => Number(option.dataset.quantity)));
const inspect = page => page.evaluate(() => window.medianDepotQA.inspect());
async function capture(page, name) { if (process.env.CAPTURE_DIR) await page.screenshot({ path: `${process.env.CAPTURE_DIR}/${name}.png` }); }

test('shared exterior, animated arrival, and stable teaching camera preserve cargo', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Sample time zero before rAF advances, rather than racing the 988ms hold on CPU CI.
  // Historical PR #14/#16 failures are retained in docs/SCENE-REVIEW.md.
  await page.addInitScript(() => {
    const original = window.requestAnimationFrame, pending = [];
    window.requestAnimationFrame = callback => pending.push(callback);
    window.releaseIntroFrames = () => { window.requestAnimationFrame = original; pending.forEach(callback => original(callback)); };
  });
  await page.goto('/?qa=1');
  await expect(page.locator('#intro-card')).toBeVisible();
  const start = await inspect(page);
  expect(start.camera.position).toEqual(EXTERIOR_POSE.position);
  expect(start.camera.fov).toBe(EXTERIOR_POSE.fov);
  expect(await page.locator('#yard-controls').evaluate(e => e.inert)).toBe(true);
  expect(await page.locator('#scene-dock').evaluate(e => e.inert)).toBe(true);
  await page.evaluate(() => window.releaseIntroFrames());
  await capture(page, 'shared-exterior');
  await expect(page.locator('#scene')).toHaveAttribute('data-intro', 'complete', { timeout: 20000 });
  await expect(page.locator('#scene')).toHaveAttribute('data-intro-end', 'arrived');
  await expect(page.locator('#controls-toggle')).toBeFocused();
  const arrived = await inspect(page);
  expect(arrived.pallets.map(p => [p.id, p.quantity, p.appearance])).toEqual(start.pallets.map(p => [p.id, p.quantity, p.appearance]));
  await capture(page, 'arrival');
  await openControls(page);
  const openCamera = (await inspect(page)).camera;
  await page.locator('#crate-select').selectOption('MD-1-001-C01');
  await page.locator('#move-right').click();
  await page.locator('#reset').click();
  expect((await inspect(page)).camera).toEqual(openCamera);
  expect(await quantities(page)).toEqual([8,2,18,4,3]);
  await expect(page.locator('#intro-card')).toBeHidden();
  expect(errors).toEqual([]);
});

test('skip is idempotent while resizing and reduced motion reaches the same endpoint', async ({ page }) => {
  await page.goto('/?qa=1');
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.locator('#skip-intro').evaluate(button => { button.click(); button.click(); button.click(); });
  const skipped = await inspect(page);
  expect(skipped.introActive).toBe(false);
  await expect(page.locator('#controls-toggle')).toBeFocused();
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect.poll(async () => (await inspect(page)).camera.position).not.toEqual(skipped.camera.position);
  const fit = await inspect(page);
  await expectFramed(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect(page.locator('#intro-card')).toBeHidden();
  await expect(page.locator('#scene')).toHaveAttribute('data-intro-end', 'reduced-motion');
  expect((await inspect(page)).camera).toEqual(fit.camera);
  expect(await quantities(page)).toEqual([8,2,18,4,3]);
  await capture(page, 'reduced-motion-yard');
});

test('changing motion preference during the trip cuts once and preserves the shipment', async ({ page }) => {
  await page.goto('/?qa=1');
  await page.getByLabel('Reduce Intro Motion').check();
  await expect(page.locator('#intro-card')).toBeHidden();
  await expect(page.getByLabel('Reduce Motion', { exact: true })).toBeChecked();
  expect(await quantities(page)).toEqual([8,2,18,4,3]);
  await page.locator('#shipment').selectOption('MD-1-002');
  await expect(page.locator('#intro-card')).toBeHidden();
  expect(await quantities(page)).toEqual([4,8,2,4,3]);
});

test('hidden-tab interruption settles once and a later context loss retains keyboard gameplay', async ({ page }) => {
  await page.goto('/?qa=1');
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.hidden;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.locator('#scene')).toHaveAttribute('data-intro-end', 'interrupted');
  await page.locator('#scene canvas').evaluate(canvas => canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.locator('#renderer-notice')).toBeVisible();
  await openControls(page);
  await page.locator('#crate-select').selectOption('MD-1-001-C01');
  await page.locator('#move-right').click();
  expect(await quantities(page)).toEqual([2,8,18,4,3]);
});

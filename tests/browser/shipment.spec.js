import { test, expect } from '@playwright/test';

const crate = (page, label) => page.locator(`.crate-button[data-crate-id$="-${label}"]`);
const values = page => page.locator('.crate-button strong').allTextContents();
async function arrange(page, labels) {
  for (let target = 0; target < labels.length; target++) {
    const button = crate(page, labels[target]);
    await button.click();
    const position = Number((await button.getAttribute('aria-label')).match(/position (\d+)/)[1]) - 1;
    for (let i = position; i > target; i--) await button.press('ArrowLeft');
    for (let i = position; i < target; i++) await button.press('ArrowRight');
  }
}

test('full shipment loop, useful errors, correct median, and replay', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#scene canvas')).toBeVisible();
  await expect(page.locator('#renderer-notice')).toBeHidden();
  if (process.env.CAPTURE_DIR) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: `${process.env.CAPTURE_DIR}/desktop.png`, fullPage: true });
  }
  expect(await values(page)).toEqual(['8', '2', '18', '4', '3']);
  await page.getByRole('button', { name: 'Check My Order' }).click();
  await expect(page.locator('#feedback')).toContainText('Almost!');
  await arrange(page, ['C02', 'C05', 'C04', 'C01', 'C03']);
  expect(await values(page)).toEqual(['2', '3', '4', '8', '18']);
  await page.getByRole('button', { name: 'Check My Order' }).click();
  await expect(page.locator('#answer-form')).toBeVisible();
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#feedback')).toContainText('First select');
  await crate(page, 'C01').click();
  await page.getByLabel('Median Quantity').fill('4');
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#feedback')).toContainText('same number');
  await crate(page, 'C04').click();
  await page.getByLabel('Median Quantity').fill('3');
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#feedback')).toContainText('position');
  await page.getByLabel('Median Quantity').fill('4');
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#success-value')).toHaveText('4');
  await expect(page.locator('#success')).toBeVisible();
  if (process.env.CAPTURE_DIR) await page.screenshot({ path: `${process.env.CAPTURE_DIR}/complete.png`, fullPage: true });
  await page.getByRole('button', { name: 'Try This Shipment Again' }).click();
  expect(await values(page)).toEqual(['8', '2', '18', '4', '3']);
  await expect(page.locator('.crate-button[aria-pressed=true]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('duplicate crates may swap identities and the middle occurrence must be selected', async ({ page }) => {
  await page.goto('/?shipment=MD-1-002');
  await arrange(page, ['C03', 'C05', 'C04', 'C01', 'C02']);
  expect(await values(page)).toEqual(['2', '3', '4', '4', '8']);
  await page.getByRole('button', { name: 'Check My Order' }).click();
  await crate(page, 'C01').click();
  await page.getByLabel('Median Quantity').fill('4');
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#success')).toBeHidden();
  await crate(page, 'C04').click();
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#success')).toBeVisible();
});

test('manifest, replay URL, shipment switch, unknown code, and reload', async ({ page }) => {
  await page.goto('/?shipment=MD-9-999');
  await expect(page.locator('#code-notice')).toContainText('not supported');
  await page.locator('#shipment').selectOption('MD-1-002');
  await expect(page).toHaveURL(/shipment=MD-1-002/);
  await crate(page, 'C01').click();
  await page.getByRole('button', { name: 'Move Selected Crate Right' }).click();
  await page.getByRole('button', { name: 'Shipment Manifest' }).click();
  await expect(page.locator('#manifest-body tr')).toHaveCount(5);
  await expect(page.locator('#manifest-body tr').first()).toContainText('MD-1-002-C01');
  await expect(page.locator('#replay-link')).toHaveValue(/shipment=MD-1-002/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#manifest-dialog')).toBeHidden();
  await expect(page.locator('#manifest-button')).toBeFocused();
  await page.reload();
  expect(await values(page)).toEqual(['4', '8', '2', '4', '3']);
  await expect(page.locator('#code-notice')).toBeHidden();
});

test('resize and reduced motion retain order and selected identity', async ({ page }) => {
  await page.goto('/');
  await crate(page, 'C03').click();
  await page.getByRole('button', { name: 'Move Selected Crate Left' }).click();
  await page.getByLabel('Reduce Motion').check();
  for (const size of [{ width: 1024, height: 768 }, { width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(size);
    expect(await values(page)).toEqual(['8', '18', '2', '4', '3']);
    await expect(crate(page, 'C03')).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (process.env.CAPTURE_DIR && size.width === 390) await page.screenshot({ path: `${process.env.CAPTURE_DIR}/mobile.png`, fullPage: true });
  }
});

test('keyboard-only operation retains focus during reorder and supports dialog dismissal', async ({ page }) => {
  await page.goto('/');
  await crate(page, 'C01').focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(crate(page, 'C01')).toBeFocused();
  await expect(crate(page, 'C01')).toHaveAttribute('aria-label', /position 3/);
  await page.getByRole('button', { name: 'How to Play', exact: true }).click();
  await expect(page.locator('#help-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#help-button')).toBeFocused();
});

test('touch-sized controls can finish the shipment without dragging', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  for (const [label, moves] of [['C02', 1], ['C05', 3], ['C04', 2]]) {
    await crate(page, label).tap();
    for (let i = 0; i < moves; i++) await page.getByRole('button', { name: 'Move Selected Crate Left' }).tap();
  }
  expect(await values(page)).toEqual(['2', '3', '4', '8', '18']);
  await page.getByRole('button', { name: 'Check My Order' }).tap();
  await crate(page, 'C04').tap();
  await page.getByLabel('Median Quantity').fill('4');
  await page.getByRole('button', { name: 'Submit Median' }).tap();
  await expect(page.locator('#success')).toBeVisible();
  await context.close();
});

test('renderer failure leaves the complete learning loop usable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return type.startsWith('webgl') ? null : original.call(this, type, ...args);
    };
  });
  await page.goto('/');
  await expect(page.locator('#renderer-notice')).toBeVisible();
  await arrange(page, ['C02', 'C05', 'C04', 'C01', 'C03']);
  await page.getByRole('button', { name: 'Check My Order' }).click();
  await crate(page, 'C04').click();
  await page.getByLabel('Median Quantity').fill('4');
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#success')).toBeVisible();
});

test('direct 3D picking and dragging move a whole crate, including a drop outside the yard', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Reduce Motion').check();
  const canvas = page.locator('#scene canvas');
  const bounds = await canvas.boundingBox();
  // Fixed teaching camera; coordinates target the visible first crate and last bay.
  const point = (x, y) => [bounds.x + bounds.width * x, bounds.y + bounds.height * y];
  await page.mouse.click(...point(0.267, 0.54));
  await expect(crate(page, 'C01')).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.move(...point(0.267, 0.54));
  await page.mouse.down();
  await page.mouse.move(...point(0.684, 0.66), { steps: 12 });
  await page.mouse.up();
  await expect(crate(page, 'C01')).toHaveAttribute('aria-label', /position 5/);
  expect(await values(page)).toEqual(['2', '18', '4', '3', '8']);
  // Pointer capture keeps the same observation even when the pointer leaves the canvas.
  await page.mouse.move(...point(0.684, 0.61));
  await page.mouse.down();
  await page.mouse.move(bounds.x - 20, bounds.y + bounds.height * 0.7, { steps: 12 });
  await page.mouse.up();
  await expect(crate(page, 'C01')).toHaveAttribute('aria-label', /position 1/);
  expect(await values(page)).toEqual(['8', '2', '18', '4', '3']);
});

test('fullscreen preserves in-progress state', async ({ page }) => {
  await page.goto('/');
  await crate(page, 'C04').click();
  await page.getByRole('button', { name: 'Move Selected Crate Left' }).click();
  await page.getByRole('button', { name: 'Enter Fullscreen' }).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  expect(await values(page)).toEqual(['8', '2', '4', '18', '3']);
  await expect(crate(page, 'C04')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Exit Fullscreen' }).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  expect(await values(page)).toEqual(['8', '2', '4', '18', '3']);
});

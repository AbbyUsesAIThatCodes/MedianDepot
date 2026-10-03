import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

const picker = page => page.getByRole('combobox', { name: 'Select a Pallet' });
const values = page => page.locator('#crate-select option[data-quantity]').evaluateAll(options => options.map(option => option.dataset.quantity));
const crateOption = (page, label) => page.locator(`#crate-select option[value$="-${label}"]`);
async function choose(page, label) { await picker(page).selectOption(await crateOption(page, label).getAttribute('value')); }
async function position(page, label) { return Number((await crateOption(page, label).textContent()).match(/Position (\d+)/)[1]) - 1; }
async function arrange(page, labels) {
  for (let target = 0; target < labels.length; target++) {
    await choose(page, labels[target]);
    const from = await position(page, labels[target]);
    for (let i = from; i > target; i--) await page.getByRole('button', { name: 'Move Selected Pallet Left' }).click();
    for (let i = from; i < target; i++) await page.getByRole('button', { name: 'Move Selected Pallet Right' }).click();
  }
}
async function capture(page, name) {
  if (!process.env.CAPTURE_DIR) return;
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({ path: `${process.env.CAPTURE_DIR}/${name}.png` });
}
async function expectFullWindow(page) {
  const size = page.viewportSize();
  await expect.poll(() => page.locator('#scene canvas').boundingBox()).toEqual({ x: 0, y: 0, width: size.width, height: size.height });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
}

test('full shipment loop, useful errors, correct median, and replay', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#scene canvas')).toBeVisible();
  await expect(page.locator('#renderer-notice')).toBeHidden();
  await expectFullWindow(page);
  await expect(page.locator('#crate-row')).toHaveCount(0);
  await expect(page.getByText('Pallet Quantities', { exact: true })).toHaveCount(0);
  await capture(page, 'desktop');
  expect(await values(page)).toEqual(['8', '2', '18', '4', '3']);
  await page.getByRole('button', { name: 'Check My Order' }).click();
  await expect(page.locator('#feedback')).toContainText('Almost!');
  await arrange(page, ['C02', 'C05', 'C04', 'C01', 'C03']);
  expect(await values(page)).toEqual(['2', '3', '4', '8', '18']);
  await page.getByRole('button', { name: 'Check My Order' }).click();
  await expect(page.locator('#answer-form')).toBeVisible();
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#feedback')).toContainText('First select');
  await choose(page, 'C01');
  await page.getByLabel('Median Quantity').fill('4');
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#feedback')).toContainText('same number');
  await choose(page, 'C04');
  await page.getByLabel('Median Quantity').fill('3');
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#feedback')).toContainText('position');
  await page.getByLabel('Median Quantity').fill('4');
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#success-value')).toHaveText('4');
  await expect(page.locator('#success')).toBeVisible();
  await capture(page, 'complete');
  await page.getByRole('button', { name: 'Try This Shipment Again' }).click();
  expect(await values(page)).toEqual(['8', '2', '18', '4', '3']);
  await expect(picker(page)).toHaveValue('');
  expect(errors).toEqual([]);
});

test('duplicate crates may swap identities and the middle occurrence must be selected', async ({ page }) => {
  await page.goto('/?shipment=MD-1-002');
  await arrange(page, ['C03', 'C05', 'C04', 'C01', 'C02']);
  expect(await values(page)).toEqual(['2', '3', '4', '4', '8']);
  await page.getByRole('button', { name: 'Check My Order' }).click();
  await choose(page, 'C01');
  await page.getByLabel('Median Quantity').fill('4');
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#success')).toBeHidden();
  await choose(page, 'C04');
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#success')).toBeVisible();
});

test('manifest, replay URL, shipment switch, unknown code, and reload', async ({ page }) => {
  await page.goto('/?shipment=MD-9-999');
  await expect(page.locator('#code-notice')).toContainText('not supported');
  await page.locator('#shipment').selectOption('MD-1-002');
  await expect(page).toHaveURL(/shipment=MD-1-002/);
  await choose(page, 'C01');
  await page.getByRole('button', { name: 'Move Selected Pallet Right' }).click();
  await page.getByRole('button', { name: 'Shipment Manifest' }).click();
  await expect(page.locator('#manifest-body tr')).toHaveCount(5);
  await expect(page.locator('#manifest-body tr').first()).toContainText('MD-1-002-C01');
  await expect(page.locator('#replay-link')).toHaveValue(/shipment=MD-1-002/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#manifest-dialog')).toBeHidden();
  await expect(page.locator('#manifest-button')).toBeFocused();
  await expect(page.locator('#yard-controls')).toBeVisible();
  await page.reload();
  expect(await values(page)).toEqual(['4', '8', '2', '4', '3']);
});

test('resize and reduced motion preserve state, full-window canvas, and reachable overlays', async ({ page }) => {
  await page.goto('/');
  await choose(page, 'C03');
  await page.getByRole('button', { name: 'Move Selected Pallet Left' }).click();
  await page.getByLabel('Reduce Motion').check();
  for (const size of [{ width: 1024, height: 600 }, { width: 1280, height: 720 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }, { width: 1440, height: 1000 }]) {
    await page.setViewportSize(size);
    await expectFullWindow(page);
    expect(await values(page)).toEqual(['8', '18', '2', '4', '3']);
    await expect(picker(page)).toHaveValue(/-C03$/);
    const panel = await page.locator('#yard-controls').boundingBox();
    expect(panel.x).toBeGreaterThanOrEqual(0);
    expect(panel.y).toBeGreaterThanOrEqual(0);
    expect(panel.x + panel.width).toBeLessThanOrEqual(size.width);
    expect(panel.y + panel.height).toBeLessThanOrEqual(size.height);
    await picker(page).scrollIntoViewIfNeeded();
    if (size.width === 1366) await capture(page, 'laptop');
    if (size.width === 1024) await capture(page, 'compact-window');
  }
});

test('keyboard selection, movement, overlay focus return, and dialog dismissal', async ({ page }) => {
  await page.goto('/');
  await picker(page).focus();
  await page.keyboard.press('ArrowDown');
  await expect(picker(page)).toHaveValue(/-C01$/);
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Move Selected Pallet Right' })).toBeFocused();
  await page.keyboard.press('Space');
  await page.keyboard.press('Space');
  expect(await position(page, 'C01')).toBe(2);
  await expect(page.getByRole('button', { name: 'Move Selected Pallet Right' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#yard-controls')).toBeHidden();
  await expect(page.locator('#controls-toggle')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#controls-close')).toBeFocused();
  await page.getByRole('button', { name: 'How to Play', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#help-button')).toBeFocused();
});

test('compact laptop overlay completes a shipment without dragging', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1024, height: 600 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/');
  for (const [label, moves] of [['C02', 1], ['C05', 3], ['C04', 2]]) {
    await choose(page, label);
    for (let i = 0; i < moves; i++) await page.getByRole('button', { name: 'Move Selected Pallet Left' }).click();
  }
  expect(await values(page)).toEqual(['2', '3', '4', '8', '18']);
  await page.getByRole('button', { name: 'Check My Order' }).click();
  await choose(page, 'C04');
  await page.getByLabel('Median Quantity').fill('4');
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#success')).toBeVisible();
  await page.locator('#controls-close').click();
  await expect(page.locator('#yard-controls')).toBeHidden();
  await page.locator('#controls-toggle').click();
  await expect(page.locator('#success')).toBeVisible();
  await context.close();
});

test('renderer failure keeps accessible overlay controls usable', async ({ page }) => {
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
  await choose(page, 'C04');
  await page.getByLabel('Median Quantity').fill('4');
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#success')).toBeVisible();
});

test('overlay toggles retain selection, answer draft, phase, and order', async ({ page }) => {
  await page.goto('/');
  await arrange(page, ['C02', 'C05', 'C04', 'C01', 'C03']);
  await page.getByRole('button', { name: 'Check My Order' }).click();
  await choose(page, 'C04');
  await page.getByLabel('Median Quantity').fill('3.5');
  const before = await values(page);
  await page.locator('#controls-toggle').click();
  await expect(page.locator('#yard-controls')).toBeHidden();
  await expect(page.locator('#controls-toggle')).toHaveAttribute('aria-expanded', 'false');
  await expectFullWindow(page);
  await capture(page, 'unobstructed');
  await page.locator('#controls-toggle').click();
  await expect(page.locator('#answer-form')).toBeVisible();
  await expect(picker(page)).toHaveValue(/-C04$/);
  await expect(page.getByLabel('Median Quantity')).toHaveValue('3.5');
  expect(await values(page)).toEqual(before);
  await page.getByLabel('Median Quantity').fill('4');
  await page.getByRole('button', { name: 'Submit Median' }).click();
  await expect(page.locator('#success')).toBeVisible();
});

test('fullscreen preserves the in-progress overlay state', async ({ page }) => {
  await page.goto('/');
  await choose(page, 'C04');
  await page.getByRole('button', { name: 'Move Selected Pallet Left' }).click();
  await page.getByRole('button', { name: 'Enter Fullscreen' }).click();
  // Software rendering can block a fullscreen state read for over five seconds.
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement)), { timeout: 15000 }).toBe(true);
  expect(await values(page)).toEqual(['8', '2', '4', '18', '3']);
  await expect(picker(page)).toHaveValue(/-C04$/);
  await page.getByRole('button', { name: 'Exit Fullscreen' }).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement)), { timeout: 15000 }).toBe(false);
  expect(await values(page)).toEqual(['8', '2', '4', '18', '3']);
});

test('all five 3D pallets remain pickable and dragging preserves identities', async ({ page }) => {
  await page.goto('/?qa=1');
  const inspect = () => page.evaluate(() => window.medianDepotQA.inspect());
  await expect(page.locator('#scene')).toHaveAttribute('data-intro', 'complete');
  const points = (await inspect()).pallets;
  for (const point of points) {
    await page.mouse.click(point.x, point.y);
    await expect(picker(page)).toHaveValue(point.id);
  }
  await page.mouse.move(points[0].x, points[0].y);
  await page.mouse.down();
  await page.mouse.move(points[4].x + 45, points[4].y + 15, { steps: 12 });
  await page.mouse.up();
  expect(await position(page, 'C01')).toBe(4);
  expect(await values(page)).toEqual(['2', '18', '4', '3', '8']);
  const last = (await inspect()).pallets.find(p => p.id.endsWith('C01'));
  await page.mouse.move(last.x, last.y);
  await page.mouse.down();
  await page.mouse.move(points[0].x - 45, points[0].y + 15, { steps: 12 });
  await page.mouse.up();
  expect(await position(page, 'C01')).toBe(0);
  expect(await values(page)).toEqual(['8', '2', '18', '4', '3']);
});

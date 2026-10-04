import { test, expect } from '@playwright/test';
import { inspect, values, sortByDragging, doublePallet, openControls, capture } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
});
const hoverIds = async page => (await inspect(page)).pallets.filter(p => p.hoverGlow).map(p => p.id);

test('nine-pallet hover, paired lights and median arrows remain independent with dropdown focus', async ({ page }) => {
  await page.goto('/?shipment=MD-1-006&qa=1');
  await page.locator('#shipment').focus();
  const sorted = await sortByDragging(page);
  expect(await values(page)).toEqual([0, 1, 2, 4, 4, 6, 7, 8, 9]);
  await doublePallet(page, sorted[4].id);
  await expect(page.locator('#success-value')).toHaveText('4');
  await expect(page.locator('#shipment')).toBeFocused();
  const left = (await inspect(page)).pallets.find(p => p.id === sorted[1].id);
  await page.mouse.move(left.x, left.y);
  expect(await hoverIds(page)).toEqual([sorted[1].id]);
  expect((await inspect(page)).state.medianIds).toEqual([sorted[4].id]);
  expect((await inspect(page)).pallets.filter(p => p.pairGlow)).toHaveLength(9);
  await capture(page, 'nine-hover-and-median');
  await page.locator('#shipment').click(); await page.keyboard.press('Escape');
  expect(await hoverIds(page)).toEqual([]);
  expect((await inspect(page)).state.medianIds).toEqual([sorted[4].id]);
  await page.locator('#show-pairs').uncheck();
  expect((await inspect(page)).pallets.some(p => p.pairGlow)).toBe(false);
  await page.locator('#show-pairs').check();
  expect((await inspect(page)).pairLabels).toEqual(['Pair 1','Pair 2','Pair 3','Pair 4','Middle','Pair 4','Pair 3','Pair 2','Pair 1']);
  await capture(page, 'nine-pairs-without-hover');
  await doublePallet(page, sorted[4].id);
  expect((await inspect(page)).state.medianIds).toEqual([]);
  expect(await hoverIds(page)).toEqual([sorted[4].id]);
  await doublePallet(page, sorted[4].id);
  expect((await inspect(page)).state.medianIds).toEqual([sorted[4].id]);
});

test('keyboard control clears mouse hover without changing the median, and replay and shipments stay clear', async ({ page }) => {
  await page.goto('/?shipment=MD-1-006&qa=1');
  const sorted = await sortByDragging(page); await doublePallet(page, sorted[4].id);
  await page.locator('#shipment').focus();
  const left = (await inspect(page)).pallets.find(p => p.id === sorted[1].id);
  await page.mouse.move(left.x, left.y); expect(await hoverIds(page)).toEqual([sorted[1].id]);
  await page.keyboard.press('Tab'); await expect(page.locator('#reset-view')).toBeFocused();
  expect(await hoverIds(page)).toEqual([]);
  await page.keyboard.press('Enter');
  expect((await inspect(page)).state.medianIds).toEqual([sorted[4].id]);
  await capture(page, 'keyboard-clears-hover');
  await openControls(page);
  await page.locator('#crate-select').selectOption(sorted[4].id);
  await page.locator('#use-middle').focus(); await page.keyboard.press('Enter');
  expect((await inspect(page)).state.medianIds).toEqual([]);
  await page.keyboard.press('Enter');
  expect((await inspect(page)).state.medianIds).toEqual([sorted[4].id]);
  await page.locator('#move-left').focus(); await page.keyboard.press('Enter');
  expect((await inspect(page)).state.medianIds).toEqual([]);
  expect((await inspect(page)).pairsVisible).toBe(false);
  expect(await hoverIds(page)).toEqual([]);
  await page.locator('#reset').focus(); await page.keyboard.press('Enter');
  expect(await values(page)).toEqual([9, 2, 7, 0, 4, 4, 6, 1, 8]);
  expect(await hoverIds(page)).toEqual([]);
  await page.locator('#shipment').focus(); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/shipment=MD-1-007/);
  expect((await inspect(page)).state.medianIds).toEqual([]);
  expect(await hoverIds(page)).toEqual([]);
});

test('stationary mouse hover follows the current pallet after animated replay moves the row underneath it', async ({ page }) => {
  await page.goto('/?shipment=MD-1-006&qa=1');
  const sorted = await sortByDragging(page); await doublePallet(page, sorted[4].id);
  const left = (await inspect(page)).pallets.find(p => p.id === sorted[1].id);
  await page.mouse.move(left.x, left.y); expect(await hoverIds(page)).toEqual(['MD-1-006-C08']);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // Semantic activation preserves the actual stationary mouse location.
  await page.locator('#reset').evaluate(button => button.click());
  await expect.poll(() => hoverIds(page)).toEqual(['MD-1-006-C02']);
  await expect.poll(async () => (await inspect(page)).pallets.some(p => p.moving)).toBe(false);
  expect(await hoverIds(page)).toEqual(['MD-1-006-C02']);
  expect((await inspect(page)).state.medianIds).toEqual([]);
  expect((await inspect(page)).pallets.some(p => p.pairGlow)).toBe(false);
  await capture(page, 'replay-hover-current-position');
});

test('drag release over controls and pointer cancellation clear hover without inventing a median selection', async ({ page }) => {
  await page.goto('/?shipment=MD-1-006&qa=1');
  let pallet = (await inspect(page)).pallets.find(p => p.quantity === 1);
  await page.mouse.move(pallet.x, pallet.y); await page.mouse.down();
  const control = await page.locator('#shipment').boundingBox();
  await page.mouse.move(control.x + control.width / 2, control.y + control.height / 2, { steps: 10 });
  await page.mouse.up(); expect(await hoverIds(page)).toEqual([]);
  expect((await inspect(page)).state.medianIds).toEqual([]);
  pallet = (await inspect(page)).pallets.find(p => p.quantity === 1);
  await page.mouse.move(pallet.x, pallet.y); await page.mouse.down();
  await page.locator('#scene canvas').dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse', isPrimary: true });
  expect(await hoverIds(page)).toEqual([]);
  expect((await inspect(page)).gesture).toBe(null);
  expect((await inspect(page)).state.medianIds).toEqual([]);
  await page.mouse.up();
});

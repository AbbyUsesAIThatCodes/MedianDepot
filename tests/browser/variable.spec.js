import { test, expect } from '@playwright/test';
test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });
const inspect = page => page.evaluate(() => window.medianDepotQA.inspect());
async function sort(page) {
  const observations = await page.locator('#crate-select option[data-quantity]').evaluateAll(options => options.map(o => ({ id: o.value, quantity: Number(o.dataset.quantity) })).sort((a,b) => a.quantity-b.quantity));
  for (let target = 0; target < observations.length; target++) {
    const id = observations[target].id;
    await page.locator('#crate-select').selectOption(id);
    let position = await page.locator(`#crate-select option[value="${id}"]`).evaluate(o => Array.from(o.parentElement.options).indexOf(o)-1);
    while (position-- > target) await page.locator('#move-left').click();
  }
  await page.locator('#check-order').click();
  return observations;
}
async function capture(page, name) { if (process.env.CAPTURE_DIR) await page.screenshot({ path: `${process.env.CAPTURE_DIR}/${name}.png` }); }

for (const [code,count,median] of [['MD-1-003',4,2.5],['MD-1-004',6,4],['MD-1-005',7,3],['MD-1-006',9,4],['MD-1-007',2,3.5],['MD-1-008',3,3]]) {
  test(`${count} pallets preserve zero/duplicates, show readable pairs, and complete with median ${median}`, async ({ page }) => {
    await page.goto(`/?shipment=${code}&qa=1`);
    const original = (await inspect(page)).pallets;
    expect(original).toHaveLength(count);
    for (const pallet of original) expect(pallet.visibleRings).toBe(pallet.covered ? 0 : pallet.quantity);
    const sorted = await sort(page);
    const after = await inspect(page);
    expect(after.pairsVisible).toBe(true);
    expect(after.pallets.map(p => [p.id,p.quantity,p.appearance])).toEqual(original.map(p => [p.id,p.quantity,p.appearance]));
    expect(after.pairLabels.filter(label => label.startsWith('Middle'))).toHaveLength(count % 2 ? 1 : 2);
    await page.getByLabel('Show Pairs', { exact: true }).uncheck();
    expect((await inspect(page)).pairsVisible).toBe(false);
    await page.getByLabel('Show Pairs', { exact: true }).check();
    await page.setViewportSize({ width: 1366, height: 768 });
    const panel = await page.locator('#yard-controls').boundingBox();
    await expect.poll(async () => (await inspect(page)).pallets.every(p => p.x > 25 && p.x < panel.x - 20 && p.y > 110 && p.y < 650)).toBe(true);
    await capture(page, `sorted-${count}-pallets`);
    const id = sorted[Math.floor(count / 2)].id;
    await page.locator('#crate-select').selectOption(id);
    await page.locator('#use-middle').focus();
    await page.keyboard.press('Enter');
    if (!(count % 2)) {
      await expect(page.locator('#success')).toBeHidden();
      await expect(page.locator('#median-answer')).toBeFocused();
      await page.getByRole('button', { name: 'Submit Median' }).click();
      await expect(page.locator('#feedback')).toContainText('Enter a number');
      await page.locator('#median-answer').fill(String(median + 1));
      await page.getByRole('button', { name: 'Submit Median' }).click();
      await expect(page.locator('#feedback')).toContainText('both middle');
      await page.locator('#median-answer').fill(String(median));
      await page.keyboard.press('Enter');
    } else await expect(page.locator('#answer-form')).toBeHidden();
    await expect(page.locator('#success-value')).toHaveText(String(median));
    await expect(page.locator('#success')).toBeVisible();
    if (count === 4) await capture(page, 'fractional-median-complete');
    await page.locator('#reset').click();
    await expect(page.locator('#scene')).toHaveAttribute('data-phase','sort');
    await expect(page.locator('#intro-card')).toBeHidden();
    expect((await inspect(page)).pairsVisible).toBe(false);
    expect(await page.locator('#crate-select option[data-quantity]').evaluateAll(os => os.map(o => Number(o.dataset.quantity)))).toEqual(original.map(p => p.quantity));
  });
}

test('actual double-click on either even middle requires the same average; wrong position cannot pass', async ({ page }) => {
  for (const index of [1,2]) {
    await page.goto('/?shipment=MD-1-003&qa=1');
    const sorted = await sort(page);
    const wrong = (await inspect(page)).pallets.find(p => p.id === sorted[0].id);
    await page.mouse.dblclick(wrong.x, wrong.y);
    await expect(page.locator('#feedback')).toContainText('two middle positions');
    await expect(page.locator('#answer-form')).toBeHidden();
    const middle = (await inspect(page)).pallets.find(p => p.id === sorted[index].id);
    await page.mouse.dblclick(middle.x, middle.y);
    await expect(page.locator('#middle-equation')).toHaveText('(2 + 3) ÷ 2 = ?');
    await page.locator('#median-answer').fill(String(sorted[index].quantity));
    await page.getByRole('button', { name: 'Submit Median' }).click();
    await expect(page.locator('#success')).toBeHidden();
    await page.locator('#median-answer').fill('2.5');
    await page.getByRole('button', { name: 'Submit Median' }).click();
    await expect(page.locator('#success-value')).toHaveText('2.5');
  }
});

test('nine-pallet picking survives compact resize, pair toggle, and repeated odd activation; Next Shipment stays in yard', async ({ page }) => {
  await page.goto('/?shipment=MD-1-006&qa=1');
  await page.setViewportSize({ width: 1024, height: 600 });
  const sorted = await sort(page);
  const original = await inspect(page);
  for (const point of original.pallets) {
    await page.mouse.click(point.x, point.y);
    await expect(page.locator('#crate-select')).toHaveValue(point.id);
  }
  await page.getByLabel('Show Pairs', { exact: true }).uncheck();
  const sameQuantityWrongPosition = original.pallets.find(p => p.id === sorted[3].id);
  await page.mouse.dblclick(sameQuantityWrongPosition.x, sameQuantityWrongPosition.y);
  await expect(page.locator('#success')).toBeHidden();
  await page.getByLabel('Show Pairs', { exact: true }).check();
  await page.locator('#controls-close').click();
  await capture(page,'nine-pallets-unobstructed');
  const middle = (await inspect(page)).pallets.find(p => p.id === sorted[4].id);
  await page.mouse.dblclick(middle.x, middle.y);
  await expect(page.locator('#success-value')).toHaveText('4');
  await expect(page.locator('#yard-controls')).toBeVisible();
  await page.locator('#use-middle').evaluate(button => { button.click(); button.click(); });
  await expect(page.locator('#success-value')).toHaveText('4');
  await page.locator('#next-shipment').click();
  await expect(page).toHaveURL(/shipment=MD-1-007/);
  await expect(page.locator('#intro-card')).toBeHidden();
  await expect(page.locator('#shipment-badge')).toContainText('2 Pallets');
});

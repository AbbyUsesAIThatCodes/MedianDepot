import { test, expect } from '@playwright/test';
import { inspect, values, openControls, closeControls, sortControls, sortByDragging, doublePallet, expectFramed, capture } from './helpers.js';
test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});});

test('complete odd shipment by scene dragging and double toggle without opening a panel',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?qa=1');
  await expect(page.locator('#yard-controls')).toBeHidden();
  await expect(page.locator('#scene-instructions p').first()).toHaveText('Click and drag to rearrange the pallets in order from smallest to biggest.');
  const arrival=await inspect(page);
  await doublePallet(page,arrival.state.order[0]);
  await expect(page.locator('#feedback')).toContainText('Sort the pallets');
  expect((await inspect(page)).state.medianIds).toEqual([]);
  const sorted=await sortByDragging(page);
  expect(await values(page)).toEqual([2,3,4,8,18]);
  await doublePallet(page,sorted[0].id);
  await expect(page.locator('#feedback')).toContainText('same number');
  await doublePallet(page,sorted[2].id);
  await expect(page.locator('#success-value')).toHaveText('4');
  await expect(page.locator('#yard-controls')).toBeHidden();
  expect((await inspect(page)).pallets.filter(p=>p.arrow).map(p=>p.id)).toEqual([sorted[2].id]);
  await capture(page,'odd-arrow');
  await doublePallet(page,sorted[2].id);
  await expect(page.locator('#success')).toBeHidden();
  expect((await inspect(page)).pallets.some(p=>p.arrow)).toBe(false);
  await page.locator('#reset').click();
  expect(await values(page)).toEqual([8,2,18,4,3]);
  expect((await inspect(page)).state.medianIds).toEqual([]);
  expect(errors).toEqual([]);
});

test('duplicate quantities require the positional middle and equal pallets can swap order',async({page})=>{
  await page.goto('/?shipment=MD-1-002&qa=1');
  const sorted=await sortControls(page);
  await closeControls(page);
  await doublePallet(page,sorted[3].id);
  await expect(page.locator('#success')).toBeHidden();
  await doublePallet(page,sorted[2].id);
  await expect(page.locator('#success-value')).toHaveText('4');
  const before=await inspect(page), a=before.pallets.find(p=>p.id===sorted[2].id),b=before.pallets.find(p=>p.id===sorted[3].id);
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:12});await page.mouse.up();
  expect((await inspect(page)).state.phase).toBe('sort');
  expect((await inspect(page)).state.medianIds).toEqual([]);
  await doublePallet(page,sorted[3].id);
  await expect(page.locator('#success-value')).toHaveText('4');
});

test('manifest replay URL, unknown code and reload preserve immutable arrival data',async({page})=>{
  await page.goto('/?shipment=MD-9-999&qa=1');await openControls(page);
  await expect(page.locator('#code-notice')).toContainText('not supported');
  await page.locator('#shipment').selectOption('MD-1-002');
  await page.locator('#crate-select').selectOption('MD-1-002-C01');await page.locator('#move-right').click();
  await page.locator('#manifest-button').click();
  await expect(page.locator('#manifest-body tr')).toHaveCount(5);
  await expect(page.locator('#manifest-body tr').first()).toContainText('MD-1-002-C01');
  await expect(page.locator('#replay-link')).toHaveValue(/shipment=MD-1-002/);
  await page.keyboard.press('Escape');await expect(page.locator('#manifest-button')).toBeFocused();
  await page.reload();expect(await values(page)).toEqual([4,8,2,4,3]);
  expect(await page.evaluate(()=>Object.keys(localStorage))).toEqual([]);
});

test('keyboard selection, movement and toggle remain available in compact laptop controls',async({page})=>{
  await page.setViewportSize({width:1024,height:600});await page.goto('/?qa=1');await openControls(page);
  await page.locator('#crate-select').focus();await page.keyboard.press('ArrowDown');
  await expect(page.locator('#crate-select')).toHaveValue('MD-1-001-C01');
  await page.keyboard.press('Tab');await expect(page.locator('#move-right')).toBeFocused();await page.keyboard.press('Space');
  expect(await values(page)).toEqual([2,8,18,4,3]);
  await sortControls(page);await page.locator('#crate-select').selectOption('MD-1-001-C04');
  await page.locator('#use-middle').focus();await page.keyboard.press('Enter');
  await expect(page.locator('#success-value')).toHaveText('4');
  await page.keyboard.press('Space');await expect(page.locator('#success')).toBeHidden();
  await page.keyboard.press('Escape');await expect(page.locator('#yard-controls')).toBeHidden();
  await expect(page.locator('#controls-toggle')).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.locator('#controls-close')).toBeFocused();
  await page.locator('#help-button').click();await page.keyboard.press('Escape');await expect(page.locator('#help-button')).toBeFocused();
  await capture(page,'compact-keyboard');
});

test('renderer failure still completes an even shipment using accessible controls',async({page})=>{
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args);};});
  await page.goto('/?shipment=MD-1-003');await expect(page.locator('#renderer-notice')).toBeVisible();
  const sorted=await sortControls(page);
  for(const i of [1,2]){await page.locator('#crate-select').selectOption(sorted[i].id);await page.locator('#use-middle').click();}
  await page.locator('#median-answer').fill('2.5');await page.getByRole('button',{name:'Submit Median'}).click();
  await expect(page.locator('#success-value')).toHaveText('2.5');
});

test('overlay toggles and resizing retain even candidates, answer draft and order',async({page})=>{
  await page.goto('/?shipment=MD-1-003&qa=1');const sorted=await sortControls(page);await closeControls(page);
  for(const i of [1,2])await doublePallet(page,sorted[i].id);
  await page.locator('#median-answer').fill('2.1');const before=(await inspect(page)).state;
  for(const size of [{width:1024,height:600},{width:1280,height:720},{width:1366,height:768},{width:1920,height:1080}]){
    await page.setViewportSize(size);await openControls(page);await expectFramed(page);await closeControls(page);await expectFramed(page);
    expect((await inspect(page)).state).toEqual(before);await expect(page.locator('#median-answer')).toHaveValue('2.1');
    const dock=await page.locator('#scene-dock').boundingBox();
    for(const selector of ['#median-answer','#answer-form button','#shipment','#reset-view']){
      const box=await page.locator(selector).boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(dock.x);expect(box.y).toBeGreaterThanOrEqual(dock.y);
      expect(box.x+box.width).toBeLessThanOrEqual(dock.x+dock.width);expect(box.y+box.height).toBeLessThanOrEqual(dock.y+dock.height);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  }
  await page.locator('#median-answer').fill('2.5');await page.keyboard.press('Enter');await expect(page.locator('#success')).toBeVisible();
});

test('fullscreen and panel access preserve scene selection state',async({page})=>{
  await page.goto('/?qa=1');const sorted=await sortByDragging(page);await doublePallet(page,sorted[2].id);
  const before=(await inspect(page)).state;
  await page.getByRole('button',{name:'Enter Fullscreen'}).click();
  await expect.poll(()=>page.evaluate(()=>Boolean(document.fullscreenElement)),{timeout:15000}).toBe(true);
  expect((await inspect(page)).state).toEqual(before);await expectFramed(page);
  await page.getByRole('button',{name:'Exit Fullscreen'}).click();
  await expect.poll(()=>page.evaluate(()=>Boolean(document.fullscreenElement)),{timeout:15000}).toBe(false);
  expect((await inspect(page)).state).toEqual(before);
});

import {test,expect} from '@playwright/test';
import {inspect,values,sortControls,closeControls,doublePallet,expectFramed,capture} from './helpers.js';
test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});});
for(const [code,count,median] of [['MD-1-003',4,2.5],['MD-1-004',6,4],['MD-1-005',7,3],['MD-1-006',9,4],['MD-1-007',2,3.5],['MD-1-008',3,3]]){
  test(`${count} pallets retain zero/duplicates, toggle independent arrows and complete median ${median}`,async({page})=>{
    await page.goto(`/?shipment=${code}&qa=1`);const original=(await inspect(page)).pallets;
    for(const p of original)expect(p.visibleRings).toBe(p.covered?0:p.quantity);
    const sorted=await sortControls(page);await closeControls(page);await page.setViewportSize({width:1366,height:768});await expectFramed(page);
    await page.getByLabel('Show Pairs',{exact:true}).uncheck();expect((await inspect(page)).pairsVisible).toBe(false);
    await page.getByLabel('Show Pairs',{exact:true}).check();
    const mids=count%2?[Math.floor(count/2)]:[count/2-1,count/2];
    await doublePallet(page,sorted[mids[0]].id);
    expect((await inspect(page)).pallets.filter(p=>p.arrow)).toHaveLength(1);
    await doublePallet(page,sorted[mids[0]].id);
    expect((await inspect(page)).pallets.filter(p=>p.arrow)).toHaveLength(0);
    await doublePallet(page,sorted[mids[0]].id);
    if(!(count%2)){
      await expect(page.locator('#answer-form')).toBeHidden();await doublePallet(page,sorted[mids[1]].id);
      expect((await inspect(page)).pallets.filter(p=>p.arrow)).toHaveLength(2);
      await expect(page.locator('#median-answer')).toBeFocused();
      await page.getByRole('button',{name:'Submit Median'}).click();await expect(page.locator('#feedback')).toContainText('Enter a number');
      await page.locator('#median-answer').fill(String(median+1));await page.keyboard.press('Enter');await expect(page.locator('#feedback')).toContainText('both middle');
      await capture(page,`even-${count}-arrows`);
      await page.locator('#median-answer').fill(String(median));await page.keyboard.press('Enter');
    }
    await expect(page.locator('#success-value')).toHaveText(String(median));await expect(page.locator('#success')).toBeVisible();
    expect((await inspect(page)).pallets.map(p=>[p.id,p.quantity,p.appearance])).toEqual(original.map(p=>[p.id,p.quantity,p.appearance]));
    await capture(page,`complete-${count}-pallets`);
    await page.locator('#reset').click();expect(await values(page)).toEqual(original.map(p=>p.quantity));
    expect((await inspect(page)).state.medianIds).toEqual([]);await expect(page.locator('#intro-card')).toBeHidden();
  });
}

test('either even selection order requires both correct middle positions and averaging',async({page})=>{
  for(const order of [[1,2],[2,1]]){
    await page.goto('/?shipment=MD-1-003&qa=1');const sorted=await sortControls(page);await closeControls(page);
    await doublePallet(page,sorted[0].id);await expect(page.locator('#feedback')).toContainText('two middle positions');
    expect((await inspect(page)).pallets.filter(p=>p.arrow)).toHaveLength(1);await doublePallet(page,sorted[0].id);
    for(const i of order)await doublePallet(page,sorted[i].id);
    await expect(page.locator('#middle-equation')).toHaveText('(2 + 3) ÷ 2 = ?');
    await page.locator('#median-answer').fill(String(sorted[order[0]].quantity));await page.keyboard.press('Enter');await expect(page.locator('#success')).toBeHidden();
    await page.locator('#median-answer').fill('2.5');await page.keyboard.press('Enter');await expect(page.locator('#success-value')).toHaveText('2.5');
    await doublePallet(page,sorted[order[0]].id);await expect(page.locator('#answer-form')).toBeHidden();await expect(page.locator('#success')).toBeHidden();
  }
});

test('all nine pallets remain pickable in compact framing and Next Shipment resets arrows/view',async({page})=>{
  await page.setViewportSize({width:1024,height:600});await page.goto('/?shipment=MD-1-006&qa=1');
  const sorted=await sortControls(page);await closeControls(page);await expectFramed(page);
  for(const p of (await inspect(page)).pallets){await page.mouse.click(p.x,p.y);await expect(page.locator('#crate-select')).toHaveValue(p.id);}
  await doublePallet(page,sorted[3].id);await expect(page.locator('#success')).toBeHidden();
  await doublePallet(page,sorted[4].id);await expect(page.locator('#success-value')).toHaveText('4');await capture(page,'compact-nine');
  await page.locator('#next-shipment').click();await expect(page).toHaveURL(/shipment=MD-1-007/);
  expect((await inspect(page)).state.medianIds).toEqual([]);await expect(page.locator('#intro-card')).toBeHidden();
});

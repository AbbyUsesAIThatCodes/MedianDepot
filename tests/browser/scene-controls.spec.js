import {test,expect} from '@playwright/test';
import {inspect,values,sortByDragging,sortControls,openControls,closeControls,doublePallet,expectFramed,capture} from './helpers.js';
test.beforeEach(async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});});

test('yellow median arrows toggle independently of transparent hover glow',async({page})=>{
  await page.goto('/?shipment=MD-1-003&qa=1');const sorted=await sortByDragging(page);
  const p=(await inspect(page)).pallets.find(p=>p.id===sorted[1].id);
  await page.mouse.move(p.x,p.y);
  const before=(await inspect(page)).pallets.find(q=>q.id===p.id);
  expect(before.hoverGlow).toBe(true);expect(before.glowTransparent).toBe(true);expect(before.glowDepthWrite).toBe(false);expect(before.arrow).toBe(false);
  await doublePallet(page,p.id);
  const after=(await inspect(page)).pallets.find(q=>q.id===p.id);expect(after.arrow).toBe(true);expect(after.hoverGlow).toBe(true);
  await capture(page,'hover-and-arrow');
  await page.mouse.move(100,300);expect((await inspect(page)).pallets.find(q=>q.id===p.id).hoverGlow).toBe(false);
  expect((await inspect(page)).pallets.find(q=>q.id===p.id).arrow).toBe(true);
  await doublePallet(page,p.id);expect((await inspect(page)).pallets.find(q=>q.id===p.id).arrow).toBe(false);
  expect((await inspect(page)).pallets.find(q=>q.id===p.id).hoverGlow).toBe(true);
});

test('pallet drag wins over camera movement and a drag never toggles a median arrow',async({page})=>{
  await page.goto('/?qa=1');const start=await inspect(page),p=start.pallets[0],to=start.pallets[4];
  await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(to.x,to.y,{steps:15});await page.mouse.up();
  const after=await inspect(page);expect(after.view).toEqual(start.view);expect(after.state.order.at(-1)).toBe(p.id);expect(after.state.medianIds).toEqual([]);
  await page.mouse.click(to.x,to.y);expect((await inspect(page)).state.medianIds).toEqual([]);
});

test('tiny pointer jitter counts as a tap, substantial movement cancels a pending double tap',async({page})=>{
  await page.goto('/?shipment=MD-1-008&qa=1');const sorted=await sortByDragging(page),p=(await inspect(page)).pallets.find(p=>p.id===sorted[1].id);
  for(let i=0;i<2;i++){await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+2,p.y+1);await page.mouse.up();}
  await expect(page.locator('#success-value')).toHaveText('3');
  await doublePallet(page,p.id);expect((await inspect(page)).state.medianIds).toEqual([]);
  await page.mouse.click(p.x,p.y);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x+30,p.y+5,{steps:3});await page.mouse.up();
  expect((await inspect(page)).state.medianIds).toEqual([]);
});

test('background drag clamps the camera and keeps every pallet/arrow framed at all laptop sizes',async({page})=>{
  await page.goto('/?shipment=MD-1-006&qa=1');const original=(await inspect(page)).state;
  for(const size of [{width:1024,height:600},{width:1366,height:768}]){
    await page.setViewportSize(size);
    for(const [dx,dy] of [[1500,1000],[-1500,-1000]]){
      await page.mouse.move(40,size.height-215);await page.mouse.down();await page.mouse.move(40+dx,size.height-215+dy,{steps:10});await page.mouse.up();
      const now=await inspect(page);expect(now.view.yaw).toBe(dx>0?now.limits.yaw[0]:now.limits.yaw[1]);
      expect(now.view.elevation).toBe(dy>0?now.limits.elevation[1]:now.limits.elevation[0]);
      expect(now.state).toEqual(original);await expectFramed(page);
      for(const p of now.pallets){await page.mouse.click(p.x,p.y);await expect(page.locator('#crate-select')).toHaveValue(p.id);}
      await capture(page,`camera-extreme-${size.width}-${dx>0?'left-high':'right-low'}`);
      // Only keyboard-focus selection changes when picking; order/candidates remain unchanged.
      await page.locator('#reset').click();
    }
    await capture(page,`camera-${size.width}`);
  }
});

test('keyboard camera buttons, reset, replay and shipment changes keep mathematical state separate',async({page})=>{
  await page.goto('/?shipment=MD-1-003&qa=1');const sorted=await sortControls(page);const before=(await inspect(page)).view;
  await page.locator('#camera-left').focus();await page.keyboard.press('Enter');
  expect((await inspect(page)).view.yaw).toBeLessThan(before.yaw);
  await page.locator('#camera-up').click();await expectFramed(page);
  await closeControls(page);for(const i of [1,2])await doublePallet(page,sorted[i].id);
  const candidates=(await inspect(page)).state.medianIds;
  await page.locator('#reset-view').click();expect((await inspect(page)).view).toEqual(before);expect((await inspect(page)).state.medianIds).toEqual(candidates);
  await page.locator('#reset').click();expect((await inspect(page)).view).toEqual(before);expect((await inspect(page)).state.medianIds).toEqual([]);
  await page.locator('#shipment').selectOption('MD-1-008');expect((await inspect(page)).view).toEqual(before);await expectFramed(page);
});

test('touchscreen drag and double-tap complete a shipment without opening Yard Controls',async({browser,baseURL})=>{
  const context=await browser.newContext({baseURL,viewport:{width:1366,height:768},hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();await page.goto('/?shipment=MD-1-008&qa=1');
  const cdp=await context.newCDPSession(page);
  const before=await inspect(page),start=before.pallets[2],dest=before.pallets[1];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start.x,y:start.y,id:0}]});
  for(let step=1;step<=12;step++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(dest.x-start.x)*step/12,y:start.y+(dest.y-start.y)*step/12,id:0}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  expect(await values(page)).toEqual([0,3,6]);
  const middle=(await inspect(page)).pallets.find(p=>p.quantity===3);
  await page.touchscreen.tap(middle.x,middle.y);await page.touchscreen.tap(middle.x,middle.y);
  await expect(page.locator('#success-value')).toHaveText('3');await expect(page.locator('#yard-controls')).toBeHidden();
  await page.touchscreen.tap(middle.x,middle.y);await page.touchscreen.tap(middle.x,middle.y);
  await expect(page.locator('#success')).toBeHidden();expect((await inspect(page)).pallets.some(p=>p.hoverGlow)).toBe(false);
  await capture(page,'touch-review');await context.close();
});

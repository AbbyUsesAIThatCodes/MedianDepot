import { expect } from '@playwright/test';
export const inspect = page => page.evaluate(() => window.medianDepotQA.inspect());
export const values = page => page.locator('#crate-select option[data-quantity]').evaluateAll(os => os.map(o => Number(o.dataset.quantity)));
export async function openControls(page) { if (!(await page.locator('#yard-controls').isVisible())) await page.locator('#controls-toggle').click(); }
export async function closeControls(page) { if (await page.locator('#yard-controls').isVisible()) await page.locator('#controls-close').click(); }
export async function sortControls(page, check = true) {
  await openControls(page);
  const crates = await page.locator('#crate-select option[data-quantity]').evaluateAll(os => os.map(o => ({ id:o.value,quantity:Number(o.dataset.quantity) })).sort((a,b)=>a.quantity-b.quantity));
  for (let target=0; target<crates.length; target++) {
    const id=crates[target].id; await page.locator('#crate-select').selectOption(id);
    const position=await page.locator('#crate-select option[data-quantity]').evaluateAll((os,id)=>os.findIndex(o=>o.value===id),id);
    for (let index=position; index>target; index--) await page.locator('#move-left').click();
  }
  if(check) await page.locator('#check-order').click();
  return crates;
}
export async function doublePallet(page,id) {
  const pallet=(await inspect(page)).pallets.find(p=>p.id===id);
  await page.mouse.dblclick(pallet.x,pallet.y);
}
export async function sortByDragging(page) {
  await closeControls(page);
  const crates=(await inspect(page)).pallets.toSorted((a,b)=>a.quantity-b.quantity);
  for(let target=0;target<crates.length;target++) {
    const before=await inspect(page), from=before.state.order.indexOf(crates[target].id);
    if(from===target)continue;
    const start=before.pallets.find(p=>p.id===crates[target].id), dest=before.pallets.find(p=>p.id===before.state.order[target]);
    await page.mouse.move(start.x,start.y); await page.mouse.down(); await page.mouse.move(dest.x,dest.y,{steps:12}); await page.mouse.up();
    await expect.poll(async()=>(await inspect(page)).state.order.indexOf(start.id)).toBe(target);
  }
  return crates;
}
export async function expectFramed(page) {
  await expect.poll(async()=>{
    const {safeBounds:s,framingCorners:corners}=await inspect(page);
    return corners.every(p=>p.x>=s.x-1&&p.x<=s.x+s.width+1&&p.y>=s.y-1&&p.y<=s.y+s.height+1);
  }).toBe(true);
}
export async function capture(page,name) { if(process.env.CAPTURE_DIR)await page.screenshot({path:`${process.env.CAPTURE_DIR}/${name}.png`}); }

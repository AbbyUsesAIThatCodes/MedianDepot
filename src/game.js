// The catalog is immutable: a code always describes the same observations and arrival order.
const catalog = [
  { code: 'MD-1-001', title: 'First Delivery', values: [8, 2, 18, 4, 3] },
  { code: 'MD-1-002', title: 'Matching Quantities', values: [4, 8, 2, 4, 3] },
  { code: 'MD-1-003', title: 'Between Two Middles', values: [8, 2, 0, 3] },
  { code: 'MD-1-004', title: 'Twin Middles', values: [7, 4, 0, 9, 4, 2] },
  { code: 'MD-1-005', title: 'Room for Zero', values: [6, 0, 3, 3, 1, 8, 2] },
  { code: 'MD-1-006', title: 'The Long Line', values: [9, 2, 7, 0, 4, 4, 6, 1, 8] },
  { code: 'MD-1-007', title: 'Two Pallets', values: [5, 2] },
  { code: 'MD-1-008', title: 'Three Stops', values: [0, 6, 3] },
];

export const SHIPMENTS = Object.freeze(catalog.map(({ values, ...shipment }) => Object.freeze({
  ...shipment,
  crates: Object.freeze(values.map((quantity, index) => Object.freeze({
    id: `${shipment.code}-C${String(index + 1).padStart(2, '0')}`,
    label: `C${String(index + 1).padStart(2, '0')}`,
    quantity,
  }))),
})));

export function resolveShipment(code) {
  const shipment = SHIPMENTS.find(item => item.code === code);
  return { shipment: shipment ?? SHIPMENTS[0], unknown: Boolean(code && !shipment) };
}

export function createGame(code = SHIPMENTS[0].code) {
  const { shipment, unknown } = resolveShipment(code);
  if (unknown) throw new RangeError(`Unknown shipment: ${code}`);
  return Object.freeze({
    code: shipment.code,
    order: Object.freeze(shipment.crates.map(crate => crate.id)),
    selectedId: null,
    phase: 'sort',
    middleActivated: false,
    medianIds: Object.freeze([]),
  });
}

export function orderedCrates(state) {
  const { shipment, unknown } = resolveShipment(state.code);
  if (unknown || state.order.length !== shipment.crates.length || new Set(state.order).size !== shipment.crates.length) {
    throw new Error('The shipment must contain each original crate exactly once.');
  }
  const byId = new Map(shipment.crates.map(crate => [crate.id, crate]));
  return state.order.map(id => {
    if (!byId.has(id)) throw new Error('A crate does not belong to this shipment.');
    return byId.get(id);
  });
}

export function isSorted(state) {
  const crates = orderedCrates(state);
  return crates.every((crate, index) => index === 0 || crates[index - 1].quantity <= crate.quantity);
}

export function selectCrate(state, id) {
  if (!state.order.includes(id)) return state;
  return Object.freeze({ ...state, selectedId: id });
}

export function moveCrate(state, id, targetIndex) {
  orderedCrates(state);
  if (!state.order.includes(id) || !Number.isInteger(targetIndex)) return state;
  const fromIndex = state.order.indexOf(id);
  const bounded = Math.max(0, Math.min(state.order.length - 1, targetIndex));
  const order = [...state.order];
  order.splice(fromIndex, 1);
  order.splice(bounded, 0, id);
  if (fromIndex === bounded) return state;
  return Object.freeze({ ...state, order: Object.freeze(order), selectedId: id, phase: 'sort', medianIds: Object.freeze([]), middleActivated: false });
}

export function checkOrder(state) {
  if (state.phase !== 'sort') return { state, ok: false, message: 'This shipment is already checked.' };
  if (!isSorted(state)) return { state, ok: false, message: 'Almost! Read the quantities from left to right. Each one must be at least as large as the one before it.' };
  return {
    state: Object.freeze({ ...state, phase: 'median', selectedId: null, middleActivated: false, medianIds: Object.freeze([]) }),
    ok: true,
    message: state.order.length % 2 ? 'Order checked! Double-click the middle pallet.' : 'Order checked! Select both middle pallets, then add their quantities and divide by 2.',
  };
}

export function middleInfo(state) {
  const crates = orderedCrates(state);
  const right = Math.floor(crates.length / 2);
  const even = crates.length % 2 === 0;
  const indices = even ? [right - 1, right] : [right];
  const middle = indices.map(index => crates[index]);
  return { even, indices, ids: middle.map(crate => crate.id), values: middle.map(crate => crate.quantity), median: middle.reduce((total, crate) => total + crate.quantity, 0) / middle.length, sideCount: even ? right - 1 : right };
}

export function activateMedian(state, id) {
  if (!state.order.includes(id)) return { state, ok: false, message: 'Choose a pallet in this shipment.' };
  if (!isSorted(state)) return { state, ok: false, message: 'Sort the pallets from smallest to biggest first. Then double-click the middle pallet or pallets.' };
  const info = middleInfo(state);
  const before = state.medianIds ?? [];
  const removing = before.includes(id);
  if (!removing && info.even && before.length === 2) return { state, ok: false, message: 'Two pallets are selected. Double-click one again to remove its arrow before choosing another.' };
  const ids = removing ? before.filter(item => item !== id) : info.even ? [...before, id] : [id];
  const valid = ids.length === info.ids.length && info.ids.every(item => ids.includes(item));
  const next = Object.freeze({ ...state, selectedId: id, medianIds: Object.freeze(ids), middleActivated: valid, phase: valid && !info.even ? 'complete' : 'median' });
  if (removing) return { state: next, ok: true, message: 'Arrow removed. Double-click a pallet to select it again.' };
  if (!info.ids.includes(id) || (ids.length === 2 && !valid)) return { state: next, ok: false, message: info.even ? 'Choose the two middle positions. Repeated quantities still count as separate pallets. Double-click an arrowed pallet to unselect it.' : 'The middle pallet has the same number of pallets on each side. Choose that position.' };
  return { state: next, ok: true, message: info.even ? valid ? `Both middle pallets selected. Add ${info.values[0]} and ${info.values[1]}, then divide by 2.` : 'One middle pallet selected. Double-click the other middle pallet too.' : `The median is ${info.median}. There are ${info.sideCount} pallets on each side.` };
}

export function submitMedian(state, answer) {
  if (state.phase !== 'median') return { state, ok: false, message: 'Check the order before finding the median.' };
  const info = middleInfo(state);
  if (info.even && (!state.middleActivated || state.medianIds?.length !== 2 || !info.ids.every(id => state.medianIds.includes(id)))) return { state, ok: false, message: 'Select both middle pallets before calculating their average.' };
  if (!info.even && !state.selectedId) return { state, ok: false, message: 'First select the pallet in the middle of the sorted row.' };
  if (!info.even && !info.ids.includes(state.selectedId)) return { state, ok: false, message: 'Look again: the middle pallet has the same number of pallets on each side.' };
  const raw = String(answer).trim();
  if (!raw || !Number.isFinite(Number(raw))) return { state, ok: false, message: 'Enter a number for the median quantity.' };
  if (Number(raw) !== info.median) return { state, ok: false, message: info.even ? `Use both middle quantities: (${info.values[0]} + ${info.values[1]}) ÷ 2. One middle value alone may not be the median.` : 'Use the quantity printed on the middle pallet. Its position in the row is a different number.' };
  return {
    state: Object.freeze({ ...state, phase: 'complete' }),
    ok: true,
    message: info.even ? `The median is (${info.values[0]} + ${info.values[1]}) ÷ 2 = ${info.median}. Both middle observations count.` : `The median is ${info.median}. There are ${info.sideCount} pallets on each side of the middle pallet.`,
  };
}

export function editOrder(state) {
  return Object.freeze({ ...state, phase: 'sort', selectedId: null, middleActivated: false, medianIds: Object.freeze([]) });
}

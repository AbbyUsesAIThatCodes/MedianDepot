// The catalog is immutable: a code always describes the same observations and arrival order.
const catalog = [
  { code: 'MD-1-001', title: 'First Delivery', values: [8, 2, 18, 4, 3] },
  { code: 'MD-1-002', title: 'Matching Quantities', values: [4, 8, 2, 4, 3] },
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
  if (!state.order.includes(id) || state.phase === 'complete') return state;
  return Object.freeze({ ...state, selectedId: id });
}

export function moveCrate(state, id, targetIndex) {
  orderedCrates(state);
  if (state.phase !== 'sort' || !state.order.includes(id) || !Number.isInteger(targetIndex)) return state;
  const fromIndex = state.order.indexOf(id);
  const bounded = Math.max(0, Math.min(state.order.length - 1, targetIndex));
  const order = [...state.order];
  order.splice(fromIndex, 1);
  order.splice(bounded, 0, id);
  return Object.freeze({ ...state, order: Object.freeze(order), selectedId: id });
}

export function checkOrder(state) {
  if (state.phase !== 'sort') return { state, ok: false, message: 'This shipment is already checked.' };
  if (!isSorted(state)) return { state, ok: false, message: 'Almost! Read the quantities from left to right. Each one must be at least as large as the one before it.' };
  return {
    state: Object.freeze({ ...state, phase: 'median', selectedId: null }),
    ok: true,
    message: 'Order checked! Select the crate in the middle, then enter its quantity.',
  };
}

export function submitMedian(state, answer) {
  if (state.phase !== 'median') return { state, ok: false, message: 'Check the order before finding the median.' };
  const crates = orderedCrates(state);
  const middle = crates[Math.floor(crates.length / 2)];
  if (!state.selectedId) return { state, ok: false, message: 'First select the crate in the middle of the sorted row.' };
  if (state.selectedId !== middle.id) return { state, ok: false, message: 'Look again: the middle crate has the same number of crates on each side.' };
  const raw = String(answer).trim();
  if (!raw || !Number.isFinite(Number(raw))) return { state, ok: false, message: 'Enter a number for the quantity on your selected crate.' };
  if (Number(raw) !== middle.quantity) return { state, ok: false, message: 'Use the quantity printed on the middle crate. Its position in the row is a different number.' };
  return {
    state: Object.freeze({ ...state, phase: 'complete' }),
    ok: true,
    message: `The median is ${middle.quantity}. There are ${Math.floor(crates.length / 2)} crates on each side of the middle crate.`,
  };
}

export function editOrder(state) {
  return Object.freeze({ ...state, phase: 'sort', selectedId: null });
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { SHIPMENTS, resolveShipment, createGame, orderedCrates, isSorted, selectCrate, moveCrate, checkOrder, submitMedian, editOrder, middleInfo, activateMedian } from '../src/game.js';
import { pairMarkers } from '../src/pairs.js';

const quantities = state => orderedCrates(state).map(crate => crate.quantity);
function sorted(state) {
  const ids = [...orderedCrates(state)].sort((a, b) => a.quantity - b.quantity).map(crate => crate.id);
  return ids.reduce((next, id, index) => moveCrate(next, id, index), state);
}
function permutations(array) {
  if (!array.length) return [[]];
  return array.flatMap((id, index) => permutations(array.filter((_, i) => i !== index)).map(rest => [id, ...rest]));
}

test('canonical shipment has stable code, IDs, arrival order, and median 4', () => {
  const arrival = createGame('MD-1-001');
  assert.deepEqual(quantities(arrival), [8, 2, 18, 4, 3]);
  assert.deepEqual(arrival.order, Array.from({ length: 5 }, (_, i) => `MD-1-001-C0${i + 1}`));
  let state = sorted(arrival);
  assert.deepEqual(quantities(state), [2, 3, 4, 8, 18]);
  state = checkOrder(state).state;
  assert.equal(state.phase, 'median');
  state = selectCrate(state, state.order[2]);
  const result = submitMedian(state, '4');
  assert.equal(result.ok, true);
  assert.equal(result.state.phase, 'complete');
  assert.deepEqual(quantities(arrival), [8, 2, 18, 4, 3]);
});

test('duplicates count as separate observations in either equal-value order', () => {
  let state = sorted(createGame('MD-1-002'));
  assert.deepEqual(quantities(state), [2, 3, 4, 4, 8]);
  const firstEqual = state.order[2];
  const secondEqual = state.order[3];
  assert.notEqual(firstEqual, secondEqual);
  state = moveCrate(state, firstEqual, 3);
  assert.equal(isSorted(state), true);
  assert.equal(state.order[2], secondEqual);
  state = checkOrder(state).state;
  // A different crate with the right quantity is not the middle observation.
  assert.equal(submitMedian(selectCrate(state, firstEqual), 4).ok, false);
  assert.equal(submitMedian(selectCrate(state, secondEqual), 4).ok, true);
});

test('small-shipment permutations and larger-row moves preserve all identities and values', () => {
  for (const shipment of SHIPMENTS) {
    const arrival = createGame(shipment.code);
    const original = [...shipment.crates].sort((a, b) => a.id.localeCompare(b.id));
    // Exhaust the smaller catalogs; cover rotations/reversals and every move
    // for larger rows without growing to 9! × 81 equivalent identity checks.
    const arrangements = arrival.order.length <= 5 ? permutations(arrival.order) : arrival.order.flatMap((_, index) => {
      const rotated = [...arrival.order.slice(index), ...arrival.order.slice(0, index)];
      return [rotated, [...rotated].reverse()];
    });
    for (const order of arrangements) {
      const state = order.reduce((next, id, index) => moveCrate(next, id, index), arrival);
      for (const id of order) for (let to = -1; to <= order.length; to++) {
        const next = moveCrate(state, id, to);
        assert.deepEqual([...orderedCrates(next)].sort((a, b) => a.id.localeCompare(b.id)), original);
        assert.deepEqual(state.order, order);
      }
      const values = quantities(state);
      assert.equal(isSorted(state), values.every((value, i) => i === 0 || values[i - 1] <= value));
      assert.deepEqual(createGame(shipment.code), arrival);
    }
  }
});

test('new shipment codes span two through nine observations including zero and fractional medians', () => {
  const expected = { 'MD-1-003': [4, 2.5], 'MD-1-004': [6, 4], 'MD-1-005': [7, 3], 'MD-1-006': [9, 4], 'MD-1-007': [2, 3.5], 'MD-1-008': [3, 3] };
  for (const [code, [count, median]] of Object.entries(expected)) {
    const state = checkOrder(sorted(createGame(code))).state;
    assert.equal(state.order.length, count);
    assert.equal(middleInfo(state).median, median);
    assert.equal(new Set(state.order).size, count);
    if (code !== 'MD-1-007') assert.ok(quantities(state).includes(0));
  }
});

test('both even middles must be toggled before accepting the same average in either selection order', () => {
  for (const code of ['MD-1-003', 'MD-1-004', 'MD-1-007']) {
    const state = checkOrder(sorted(createGame(code))).state;
    const info = middleInfo(state);
    assert.equal(submitMedian(selectCrate(state, info.ids[0]), info.median).ok, false);
    for (const id of info.ids) {
      const first = activateMedian(state, id);
      assert.equal(first.ok, true);
      assert.equal(first.state.phase, 'median');
      assert.equal(first.state.middleActivated, false);
      assert.equal(submitMedian(first.state, info.median).ok, false);
      const activated = activateMedian(first.state, info.ids.find(other => other !== id));
      assert.equal(activated.state.middleActivated, true);
      for (const answer of ['', ' ', 'NaN', 'Infinity', 'no', info.median + 1]) assert.equal(submitMedian(activated.state, answer).ok, false);
      if (info.values[0] !== info.values[1]) for (const value of info.values) assert.equal(submitMedian(activated.state, value).ok, false);
      const complete = submitMedian(activated.state, info.median);
      assert.equal(complete.ok, true);
      assert.equal(complete.state.phase, 'complete');
      assert.deepEqual(complete.state.order, state.order);
      assert.equal(editOrder(complete.state).middleActivated, false);
      assert.equal(createGame(code).middleActivated, false);
    }
    for (const id of state.order.filter(id => !info.ids.includes(id))) assert.equal(activateMedian(state, id).ok, false);
  }
});

test('odd activation requires the positional middle, including duplicate quantities', () => {
  for (const shipment of SHIPMENTS.filter(s => s.crates.length % 2)) {
    const state = checkOrder(sorted(createGame(shipment.code))).state;
    const info = middleInfo(state);
    assert.equal(activateMedian(createGame(shipment.code), info.ids[0]).ok, false);
    for (const id of state.order) {
      const result = activateMedian(state, id);
      assert.equal(result.ok, id === info.ids[0]);
      assert.equal(result.state.phase, result.ok ? 'complete' : 'median');
      assert.deepEqual(result.state.order, state.order);
    }
  }
});

test('mirrored pair guides have matching noncolor labels, unique pair colors, and distinct middles', () => {
  for (let count = 2; count <= 9; count++) {
    const markers = pairMarkers(count);
    assert.equal(markers.filter(m => m.middle).length, count % 2 ? 1 : 2);
    const outer = markers.filter(m => !m.middle);
    assert.equal(new Set(outer.map(m => m.color)).size, outer.length / 2);
    for (let index = 0; index < Math.floor((count - 1) / 2); index++) assert.deepEqual(markers[index], markers[count - 1 - index]);
    assert.ok(markers.every(m => /^(Pair \d|Middle(?: \d)?)$/.test(m.label)));
  }
});

test('incorrect sorting and premature submissions do not alter data', () => {
  const state = createGame();
  assert.equal(checkOrder(state).ok, false);
  assert.equal(checkOrder(state).state, state);
  assert.equal(submitMedian(state, 4).ok, false);
  assert.equal(submitMedian(state, 4).state, state);
});

test('median selection and quantity are both required; invalid and position answers can be retried', () => {
  const state = checkOrder(sorted(createGame())).state;
  assert.equal(submitMedian(state, 4).ok, false);
  assert.equal(submitMedian(selectCrate(state, state.order[0]), 4).ok, false);
  const selected = selectCrate(state, state.order[2]);
  for (const answer of ['', ' ', 'no', 'Infinity', 'NaN', 3, 0, -4, 4.5]) {
    const result = submitMedian(selected, answer);
    assert.equal(result.ok, false);
    assert.equal(result.state, selected);
  }
  assert.equal(submitMedian(selected, ' 4.0 ').ok, true);
});

test('reordering checked or complete rows clears median candidates and deliberately reopens sorting', () => {
  const state = checkOrder(sorted(createGame())).state;
  assert.equal(moveCrate(state, state.order[0], 4).phase, 'sort');
  const editing = editOrder(state);
  assert.equal(editing.phase, 'sort');
  assert.equal(editing.selectedId, null);
  assert.deepEqual(editing.order, state.order);
  const complete = submitMedian(selectCrate(state, state.order[2]), 4).state;
  assert.deepEqual(createGame(complete.code), createGame());
});

test('direct toggles auto-check sorting, preserve duplicate positions, and undo completion without changing values', () => {
  let state = sorted(createGame('MD-1-002'));
  const order = state.order;
  state = activateMedian(state, order[3]).state;
  assert.deepEqual(state.medianIds, [order[3]]);
  assert.equal(state.phase, 'median');
  state = activateMedian(state, order[2]).state;
  assert.equal(state.phase, 'complete');
  assert.deepEqual(state.medianIds, [order[2]]);
  state = activateMedian(state, order[2]).state;
  assert.equal(state.phase, 'median');
  assert.deepEqual(state.medianIds, []);
  assert.deepEqual(state.order, order);
  assert.deepEqual(quantities(state), [2,3,4,4,8]);
});

test('even candidates cap at two, can be removed and retried, and remain independent of keyboard focus selection', () => {
  let state = sorted(createGame('MD-1-003'));
  const order = state.order;
  state = activateMedian(state, order[0]).state;
  state = activateMedian(state, order[1]).state;
  assert.equal(state.middleActivated, false);
  const rejected = activateMedian(state, order[2]);
  assert.equal(rejected.state, state);
  assert.equal(rejected.ok, false);
  state = activateMedian(state, order[0]).state;
  state = activateMedian(state, order[2]).state;
  assert.equal(state.middleActivated, true);
  state = selectCrate(state, order[3]);
  assert.equal(submitMedian(state, '2.5').ok, true);
  state = activateMedian(submitMedian(state, '2.5').state, order[1]).state;
  assert.equal(state.phase, 'median');
  assert.equal(state.middleActivated, false);
  assert.equal(submitMedian(state, '2.5').ok, false);
  state = moveCrate(state, order[0], 3);
  assert.equal(state.phase, 'sort');
  assert.deepEqual(state.medianIds, []);
  assert.equal(activateMedian(state, order[1]).ok, false);
});

test('catalog and original observations are frozen; invalid mutations are rejected', () => {
  const state = createGame();
  assert.throws(() => { SHIPMENTS[0].crates[0].quantity = 100; }, TypeError);
  assert.throws(() => { state.order.push('extra'); }, TypeError);
  assert.equal(moveCrate(state, 'foreign', 0), state);
  assert.equal(moveCrate(state, state.order[0], NaN), state);
  assert.equal(moveCrate(state, state.order[0], 1.5), state);
  assert.equal(selectCrate(state, 'foreign'), state);
  assert.throws(() => orderedCrates({ ...state, order: [state.order[0]] }));
  assert.throws(() => orderedCrates({ ...state, order: Array(5).fill(state.order[0]) }));
  assert.throws(() => orderedCrates({ ...state, order: ['foreign', ...state.order.slice(1)] }));
});

test('unsupported and future codes are explicit, never silently accepted as valid identity', () => {
  for (const code of ['MD-2-001', 'MD-1-999', 'md-1-001', '<script>']) {
    assert.equal(resolveShipment(code).unknown, true);
    assert.equal(resolveShipment(code).shipment.code, 'MD-1-001');
    assert.throws(() => createGame(code), RangeError);
  }
  assert.equal(resolveShipment(null).unknown, false);
});

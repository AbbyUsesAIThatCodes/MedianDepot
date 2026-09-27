import test from 'node:test';
import assert from 'node:assert/strict';
import { SHIPMENTS, resolveShipment, createGame, orderedCrates, isSorted, selectCrate, moveCrate, checkOrder, submitMedian, editOrder } from '../src/game.js';

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

test('every permutation and every single destination preserve all crate identities and values', () => {
  for (const shipment of SHIPMENTS) {
    const arrival = createGame(shipment.code);
    const original = [...shipment.crates].sort((a, b) => a.id.localeCompare(b.id));
    for (const order of permutations(arrival.order)) {
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

test('median phase locks order; editing and replay deliberately reopen it', () => {
  const state = checkOrder(sorted(createGame())).state;
  assert.equal(moveCrate(state, state.order[0], 4), state);
  const editing = editOrder(state);
  assert.equal(editing.phase, 'sort');
  assert.equal(editing.selectedId, null);
  assert.deepEqual(editing.order, state.order);
  const complete = submitMedian(selectCrate(state, state.order[2]), 4).state;
  assert.deepEqual(createGame(complete.code), createGame());
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

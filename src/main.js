import './style.css';
import { SHIPMENTS, resolveShipment, createGame, orderedCrates, selectCrate, moveCrate, checkOrder, submitMedian, editOrder } from './game.js';
import { createDepot } from './scene.js';

const icons = {
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 1.5-2.5 3.5m0 3v.1"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  manifest: '<path d="M7 3h10v3h3v15H4V6h3zm0 0v5h10V3M8 12h8m-8 4h8"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const requested = new URL(location.href).searchParams.get('shipment');
const resolved = resolveShipment(requested);
let state = createGame(resolved.shipment.code);
let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let feedback = '';
let feedbackKind = 'neutral';
let depot;

document.querySelector('#app').innerHTML = `
  <header class="app-header">
    <a class="brand" href="./" aria-label="Median Depot Home"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>Median Depot<small>A Little Order. A Big Discovery.</small></span></a>
    <nav aria-label="Yard Tools">
      <button id="manifest-button" class="quiet">${icon('manifest')}<span>Shipment Manifest</span></button>
      <button id="help-button" class="icon-button" aria-label="How to Play" title="How to Play">${icon('help')}</button>
      <button id="fullscreen-button" class="icon-button" aria-label="Enter Fullscreen" title="Fullscreen">${icon('expand')}</button>
    </nav>
  </header>
  <main>
    <section class="intro" aria-labelledby="page-title">
      <div><p class="eyebrow"><span></span> THE SORTING YARD</p><h1 id="page-title">Every Crate Has a Place.</h1><p>Sort the shipment. Find the middle. Discover the median.</p></div>
      <label class="shipment-picker"><span>YOUR SHIPMENT</span><select id="shipment">${SHIPMENTS.map(s => `<option value="${s.code}">${s.code} · ${s.title}</option>`).join('')}</select></label>
    </section>
    <p id="code-notice" class="notice" hidden></p>
    <div class="workspace">
      <section class="yard-card" aria-label="Sorting Yard">
        <div class="yard-topline"><span><span class="status-dot"></span> BAY 01 <b>/</b> <span id="yard-status">Ready for Sorting</span></span><span>5 CRATES <b>·</b> ODD COUNT</span></div>
        <div id="scene" class="scene"><p class="scene-hint">Drag a crate, or select one below.</p><p id="renderer-notice" class="renderer-notice" hidden>The 3D view is unavailable. All shipment controls still work below.</p></div>
        <div class="row-controls">
          <div class="row-heading"><h2>Crate Quantities</h2><span>Least <span aria-hidden="true">⟶</span> Greatest</span></div>
          <ol id="crate-row" aria-label="Crates in Current Order"></ol>
          <p class="row-caption">Big number = quantity inside. <span>Position = place in the row.</span></p>
        </div>
      </section>
      <aside class="task-card" aria-labelledby="task-title">
        <ol class="steps" aria-label="Shipment Steps"><li id="step-sort" aria-current="step"><span>1</span>Sort</li><li id="step-median"><span>2</span>Find</li><li id="step-done"><span>3</span>Discover</li></ol>
        <div class="task-content">
          <p class="eyebrow" id="task-kicker">YOUR FIRST TASK</p>
          <h2 id="task-title">Put the Crates<br>in Order.</h2>
          <p id="task-description">Arrange the quantities from least to greatest. Move whole crates; keep everything inside.</p>
          <div id="selection" class="selection"><span>Selected Crate</span><strong id="selected-value">Choose a Crate</strong><small id="selected-detail">Tap a crate in the yard or the row below.</small></div>
          <div id="move-controls" class="move-controls"><button id="move-left" aria-label="Move Selected Crate Left"><span aria-hidden="true">←</span> Move Left</button><button id="move-right" aria-label="Move Selected Crate Right">Move Right <span aria-hidden="true">→</span></button></div>
          <form id="answer-form" hidden><label for="median-answer">Median Quantity</label><div class="answer-field"><input id="median-answer" type="number" step="any" inputmode="decimal" autocomplete="off" placeholder="?" aria-describedby="answer-hint"><span>items</span></div><small id="answer-hint">Enter the quantity on the middle crate.</small><button class="primary" type="submit">Submit Median ${icon('arrow')}</button></form>
          <div id="success" class="success" hidden><span class="success-icon">${icon('check')}</span><span>THE MEDIAN IS</span><strong id="success-value"></strong><p id="success-explanation"></p></div>
          <p id="feedback" class="feedback" role="status" aria-live="polite"></p>
          <button id="check-order" class="primary">Check My Order ${icon('arrow')}</button>
          <button id="edit-order" class="text-button" hidden>Edit the Order</button>
          <button id="reset" class="reset-button">${icon('reset')} Replay Shipment</button>
        </div>
        <div class="yard-note"><span aria-hidden="true">✦</span><p id="teaching-note"><strong>One Crate, One Observation</strong>Matching quantities still count as separate crates.</p></div>
      </aside>
    </div>
    <footer><span>MEDIAN DEPOT <b>·</b> First Playable Shipment</span><label><input type="checkbox" id="reduced-motion"> Reduce Motion</label><span>Take your time. There’s no timer here.</span></footer>
    <p id="movement-status" class="sr-only" role="status" aria-live="polite"></p>
  </main>
  <dialog id="help-dialog" aria-labelledby="help-title"><div class="dialog-heading"><p class="eyebrow">WELCOME TO THE YARD</p><button class="dialog-close icon-button" aria-label="Close How to Play">×</button></div><h2 id="help-title">How to Play</h2><ol class="help-list"><li><strong>Sort the quantities.</strong>Drag crates in the yard, or select a crate and use Move Left or Move Right.</li><li><strong>Check your order.</strong>Quantities should run from least to greatest. Equal quantities can be in either order.</li><li><strong>Find the middle.</strong>Select the middle crate, then type its quantity and submit.</li></ol><p><strong>Keyboard:</strong> Tab to a crate, then press Enter or Space to select it. While a crate button is focused, use Left or Right Arrow to move it during sorting. You can also use the Move buttons.</p><p><strong>Replay Shipment</strong> restores the original arrival order. Changing shipments starts that shipment fresh.</p><button class="primary dialog-close">Back to the Yard ${icon('arrow')}</button></dialog>
  <dialog id="manifest-dialog" aria-labelledby="manifest-title"><div class="dialog-heading"><p class="eyebrow">ORIGINAL ARRIVAL RECORD</p><button class="dialog-close icon-button" aria-label="Close Shipment Manifest">×</button></div><h2 id="manifest-title">Shipment Manifest</h2><p id="manifest-code"></p><table><thead><tr><th>Arrival</th><th>Crate ID</th><th>Quantity</th></tr></thead><tbody id="manifest-body"></tbody></table><p>Each ID stays with its crate. Replay restores this exact arrival order.</p><p class="share-label">Replay Link</p><input id="replay-link" type="text" readonly aria-label="Replay Link"><button class="primary dialog-close">Back to the Yard ${icon('arrow')}</button></dialog>
`;

const $ = selector => document.querySelector(selector);
$('#shipment').value = state.code;
$('#reduced-motion').checked = reduced;
if (resolved.unknown) {
  $('#code-notice').hidden = false;
  $('#code-notice').textContent = `Shipment code “${requested}” is not supported. Showing ${state.code} in its original arrival order instead.`;
}
function syncURL() {
  const url = new URL(location.href);
  url.searchParams.set('shipment', state.code);
  history.replaceState(null, '', url);
}
syncURL();

function setFeedback(message = '', kind = 'neutral') { feedback = message; feedbackKind = kind; }
function select(id) {
  state = selectCrate(state, id);
  setFeedback();
  render();
}
function move(id, index) {
  if (state.phase !== 'sort' || state.order.indexOf(id) === index) return;
  state = moveCrate(state, id, index);
  setFeedback();
  const crate = orderedCrates(state).find(item => item.id === id);
  $('#movement-status').textContent = `Crate ${crate.label}, quantity ${crate.quantity}, moved to position ${state.order.indexOf(id) + 1}.`;
  render();
}
function replay() {
  state = createGame(state.code);
  $('#median-answer').value = '';
  setFeedback('Original arrival order restored. Ready for another try.');
  render();
}

function render() {
  const crates = orderedCrates(state);
  const selected = crates.find(crate => crate.id === state.selectedId);
  const isSort = state.phase === 'sort';
  const isComplete = state.phase === 'complete';
  // Reuse buttons by immutable ID to retain keyboard focus while the DOM order changes.
  const row = $('#crate-row');
  const focusedId = document.activeElement?.dataset.crateId;
  const existing = new Map([...row.children].map(li => [li.firstElementChild.dataset.crateId, li]));
  row.replaceChildren(...crates.map((crate, index) => {
    const li = existing.get(crate.id) ?? document.createElement('li');
    if (!li.firstElementChild) {
      li.innerHTML = '<button class="crate-button" type="button"><span class="crate-id"></span><strong></strong><span class="position"></span></button>';
      const button = li.firstElementChild;
      button.dataset.crateId = crate.id;
      button.addEventListener('click', () => select(crate.id));
      button.addEventListener('keydown', event => {
        if (state.phase !== 'sort' || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        move(crate.id, state.order.indexOf(crate.id) + (event.key === 'ArrowLeft' ? -1 : 1));
      });
    }
    const button = li.firstElementChild;
    button.querySelector('.crate-id').textContent = crate.label;
    button.querySelector('strong').textContent = crate.quantity;
    button.querySelector('.position').textContent = `Position ${index + 1}`;
    button.setAttribute('aria-label', `Crate ${crate.label}, quantity ${crate.quantity}, position ${index + 1}`);
    button.setAttribute('aria-pressed', String(crate.id === state.selectedId));
    button.disabled = isComplete;
    return li;
  }));
  if (focusedId) [...row.querySelectorAll('button')].find(button => button.dataset.crateId === focusedId)?.focus({ preventScroll: true });
  $('#selected-value').textContent = selected ? `${selected.quantity} items` : 'Choose a Crate';
  $('#selected-detail').textContent = selected ? `${selected.label} · Position ${state.order.indexOf(selected.id) + 1} of ${crates.length}` : 'Tap a crate in the yard or the row below.';
  $('#move-left').disabled = !selected || state.order.indexOf(selected.id) === 0;
  $('#move-right').disabled = !selected || state.order.indexOf(selected.id) === crates.length - 1;
  $('#move-controls').hidden = !isSort;
  $('#answer-form').hidden = state.phase !== 'median';
  $('#check-order').hidden = !isSort;
  $('#edit-order').hidden = isSort;
  $('#selection').hidden = isComplete;
  $('#success').hidden = !isComplete;
  $('#feedback').textContent = feedback;
  $('#feedback').className = `feedback ${feedbackKind}`;
  $('#feedback').hidden = !feedback;
  $('#task-kicker').textContent = isSort ? 'YOUR FIRST TASK' : isComplete ? 'SHIPMENT COMPLETE' : 'LOOK FOR THE MIDDLE';
  $('#task-title').innerHTML = isSort ? 'Put the Crates<br>in Order.' : isComplete ? 'Right in the<br>Middle.' : 'Which Crate Is<br>in the Middle?';
  $('#task-description').textContent = isSort ? 'Arrange the quantities from least to greatest. Move whole crates; keep everything inside.' : isComplete ? 'Order brings the answer into view. Nicely done, yard crew.' : 'Select the crate with the same number of crates on each side. What quantity does it hold?';
  $('#yard-status').textContent = isSort ? 'Ready for Sorting' : isComplete ? 'Shipment Complete' : 'Order Checked';
  $('.scene-hint').textContent = isSort ? 'Drag a crate, or select one below.' : isComplete ? 'Shipment complete. Replay to sort again.' : 'Select the crate in the middle.';
  $('#reset').innerHTML = `${icon('reset')} ${isComplete ? 'Try This Shipment Again' : 'Replay Shipment'}`;
  ['sort', 'median', 'done'].forEach((step, index) => {
    const currentIndex = isSort ? 0 : isComplete ? 2 : 1;
    const li = $(`#step-${step}`);
    if (index === currentIndex) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    li.classList.toggle('completed', index < currentIndex);
  });
  if (isComplete) {
    $('#success-value').textContent = selected.quantity;
    $('#success-explanation').textContent = `Two crates on the left. Two on the right. The middle crate holds ${selected.quantity} items.`;
  }
  depot?.update(crates, state);
}

$('#move-left').addEventListener('click', () => move(state.selectedId, state.order.indexOf(state.selectedId) - 1));
$('#move-right').addEventListener('click', () => move(state.selectedId, state.order.indexOf(state.selectedId) + 1));
$('#check-order').addEventListener('click', () => {
  const result = checkOrder(state);
  state = result.state;
  setFeedback(result.message, result.ok ? 'good' : 'retry');
  render();
  if (result.ok) $('#crate-row button').focus();
});
$('#answer-form').addEventListener('submit', event => {
  event.preventDefault();
  const result = submitMedian(state, $('#median-answer').value);
  state = result.state;
  setFeedback(result.message, result.ok ? 'good' : 'retry');
  render();
  if (result.ok) $('#reset').focus();
});
$('#edit-order').addEventListener('click', () => { state = editOrder(state); $('#median-answer').value = ''; setFeedback(); render(); $('#crate-row button').focus(); });
$('#reset').addEventListener('click', replay);
$('#shipment').addEventListener('change', event => { state = createGame(event.target.value); $('#code-notice').hidden = true; syncURL(); replay(); });
$('#reduced-motion').addEventListener('change', event => { reduced = event.target.checked; document.documentElement.classList.toggle('reduced-motion', reduced); render(); });
document.documentElement.classList.toggle('reduced-motion', reduced);

$('#help-button').addEventListener('click', () => $('#help-dialog').showModal());
$('#manifest-button').addEventListener('click', () => {
  const { shipment } = resolveShipment(state.code);
  $('#manifest-code').textContent = `${shipment.code} · ${shipment.title}`;
  $('#manifest-body').innerHTML = shipment.crates.map((crate, index) => `<tr><td>${index + 1}</td><td>${crate.id}</td><td>${crate.quantity}</td></tr>`).join('');
  $('#replay-link').value = location.href;
  $('#manifest-dialog').showModal();
});
$('#replay-link').addEventListener('click', event => event.target.select());
document.querySelectorAll('.dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('#fullscreen-button').hidden = !document.fullscreenEnabled;
$('#fullscreen-button').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { setFeedback('Fullscreen is unavailable in this browser. You can keep playing in this window.'); render(); }
});
document.addEventListener('fullscreenchange', () => { $('#fullscreen-button').setAttribute('aria-label', document.fullscreenElement ? 'Exit Fullscreen' : 'Enter Fullscreen'); });

function rendererUnavailable() { $('#renderer-notice').hidden = false; $('.scene-hint').hidden = true; }
try { depot = createDepot($('#scene'), { onSelect: select, onMove: move, onUnavailable: rendererUnavailable, reducedMotion: () => reduced }); }
catch (error) { console.warn('3D view unavailable:', error.message); rendererUnavailable(); }
render();

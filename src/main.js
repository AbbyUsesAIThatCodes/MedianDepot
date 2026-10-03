import './style.css';
import { SHIPMENTS, resolveShipment, createGame, orderedCrates, selectCrate, moveCrate, checkOrder, submitMedian, editOrder } from './game.js';
import { createDepot } from './scene.js';
import { BUILD } from './build.js';

const icons = {
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  expand: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 1.5-2.5 3.5m0 3v.1"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
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
let introPlaying = true;

document.querySelector('#app').innerHTML = `
  <main aria-label="Median Depot Sorting Yard">
    <div id="scene" class="scene"><p id="renderer-notice" class="renderer-notice" hidden>The 3D view is unavailable. Open Yard Controls to select and sort the pallets.</p></div>
    <section id="intro-card" class="intro-card" aria-labelledby="intro-title"><p class="eyebrow">Foam Works · Two Ways to Think</p><h2 id="intro-title">Next Stop: Median Depot</h2><p>From the factory to the rail yard. Keep each pallet whole and find the middle.</p><div class="intro-actions"><button id="skip-intro" class="primary">Skip Intro</button><label class="motion-option"><input type="checkbox" id="intro-reduced" aria-label="Reduce Intro Motion"> Reduce Motion</label></div></section>
    <header class="app-header">
      <div class="brand"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><div><h1>Median Depot</h1><small id="shipment-badge"></small></div></div>
      <nav aria-label="Yard Tools">
        <button id="manifest-button" class="icon-button" aria-label="Shipment Manifest" title="Shipment Manifest">${icon('manifest')}</button>
        <button id="help-button" class="icon-button" aria-label="How to Play" title="How to Play">${icon('help')}</button>
        <button id="fullscreen-button" class="icon-button" aria-label="Enter Fullscreen" title="Fullscreen">${icon('expand')}</button>
        <button id="controls-toggle" class="controls-toggle" aria-label="Hide Yard Controls" aria-controls="yard-controls" aria-expanded="true" title="Hide Yard Controls">${icon('menu')}<span>Yard Controls</span></button>
      </nav>
    </header>
    <aside id="yard-controls" class="task-card" aria-labelledby="controls-title">
      <div class="panel-heading"><h2 id="controls-title">Yard Controls</h2><button id="controls-close" class="icon-button" aria-label="Hide Yard Controls">×</button></div>
      <div class="panel-scroll">
        <ol class="steps" aria-label="Shipment Steps"><li id="step-sort" aria-current="step"><span>1</span>Sort</li><li id="step-median"><span>2</span>Find</li><li id="step-done"><span>3</span>Discover</li></ol>
        <div class="task-content">
          <h2 id="task-title">Put the Pallets in Order.</h2>
          <p id="task-description">Arrange quantities from least to greatest. Each pallet stays whole.</p>
          <div id="selection" class="selection"><label for="crate-select">Select a Pallet</label><select id="crate-select" aria-describedby="selected-detail"></select><div class="selection-readout"><strong id="selected-value">No Pallet Selected</strong><small id="selected-detail">Choose here or tap a pallet in the yard.</small></div></div>
          <div id="move-controls" class="move-controls"><button id="move-left" aria-label="Move Selected Pallet Left"><span aria-hidden="true">←</span> Move Left</button><button id="move-right" aria-label="Move Selected Pallet Right">Move Right <span aria-hidden="true">→</span></button></div>
          <form id="answer-form" hidden><label for="median-answer">Median Quantity</label><div class="answer-field"><input id="median-answer" type="number" step="any" inputmode="decimal" autocomplete="off" placeholder="?" aria-describedby="answer-hint"><span>items</span></div><small id="answer-hint">Use the quantity, not its position in the row.</small><button class="primary" type="submit">Submit Median ${icon('arrow')}</button></form>
          <div id="success" class="success" hidden><span class="success-icon">${icon('check')}</span><span>THE MEDIAN IS</span><strong id="success-value"></strong><p id="success-explanation"></p></div>
          <p id="feedback" class="feedback" role="status" aria-live="polite"></p>
          <button id="check-order" class="primary">Check My Order ${icon('arrow')}</button>
          <div class="replay-actions"><button id="edit-order" class="text-button" hidden>Edit the Order</button><button id="reset" class="reset-button">${icon('reset')} Replay Shipment</button></div>
          <div class="panel-settings"><label class="shipment-picker" for="shipment">Shipment</label><select id="shipment">${SHIPMENTS.map(s => `<option value="${s.code}">${s.code} · ${s.title}</option>`).join('')}</select><label class="motion-option"><input type="checkbox" id="reduced-motion"> Reduce Motion</label><p id="code-notice" class="notice" role="status" hidden></p></div>
        </div>
      </div>
    </aside>
    <div class="yard-status" aria-hidden="true"><span class="status-dot"></span><div><strong id="yard-status">Ready for Sorting</strong><span class="scene-hint">Drag a pallet, or open Yard Controls.</span></div></div>
    <p id="movement-status" class="sr-only" role="status" aria-live="polite"></p>
    <footer id="build-identity" class="build-identity" aria-label="Build Identity"></footer>
  </main>
  <dialog id="help-dialog" aria-labelledby="help-title"><div class="dialog-heading"><p class="eyebrow">WELCOME TO THE YARD</p><button class="dialog-close icon-button" aria-label="Close How to Play">×</button></div><h2 id="help-title">How to Play</h2><ol class="help-list"><li><strong>Sort the quantities.</strong>Drag pallets in the yard, or use Select a Pallet in Yard Controls followed by Move Left or Move Right.</li><li><strong>Check your order.</strong>Quantities should run from least to greatest. Equal quantities can be in either order.</li><li><strong>Find the middle.</strong>Select the middle pallet, then type its quantity and submit.</li></ol><p><strong>Keyboard:</strong> Open Yard Controls, Tab to Select a Pallet, and use the arrow keys to choose. Tab to Move Left or Move Right and press Enter or Space to move the selected pallet. Native select menus may require Enter to confirm. Escape hides Yard Controls; its toolbar button reopens them. All shipment actions remain available in the overlay.</p><p><strong>Replay Shipment</strong> restores the original arrival order. Changing shipments starts that shipment fresh.</p><button class="primary dialog-close">Back to the Yard ${icon('arrow')}</button></dialog>
  <dialog id="manifest-dialog" aria-labelledby="manifest-title"><div class="dialog-heading"><p class="eyebrow">ORIGINAL ARRIVAL RECORD</p><button class="dialog-close icon-button" aria-label="Close Shipment Manifest">×</button></div><h2 id="manifest-title">Shipment Manifest</h2><p id="manifest-code"></p><table><thead><tr><th>Arrival</th><th>Pallet ID</th><th>Quantity</th></tr></thead><tbody id="manifest-body"></tbody></table><p>Each ID stays with its pallet. Replay restores this exact arrival order.</p><p class="share-label">Replay Link</p><input id="replay-link" type="text" readonly aria-label="Replay Link"><button class="primary dialog-close">Back to the Yard ${icon('arrow')}</button></dialog>
`;

const $ = selector => document.querySelector(selector);
$('#build-identity').textContent = BUILD.identifier;
document.documentElement.classList.add('intro-playing');
$('#yard-controls').inert = true;
$('nav').inert = true;
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
  if (introPlaying) return;
  state = selectCrate(state, id);
  setFeedback();
  render();
}
function move(id, index) {
  if (introPlaying) return;
  if (state.phase !== 'sort' || !state.order.includes(id) || state.order.indexOf(id) === index) return;
  state = moveCrate(state, id, index);
  setFeedback();
  const crate = orderedCrates(state).find(item => item.id === id);
  $('#movement-status').textContent = `Pallet ${crate.label}, quantity ${crate.quantity}, moved to position ${state.order.indexOf(id) + 1}.`;
  render();
}
function replay() {
  if (introPlaying) return;
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
  // A native selector supplies keyboard/touch access without duplicating a permanent row.
  const picker = $('#crate-select');
  const placeholder = new Option('Choose a Pallet…', '');
  placeholder.disabled = true;
  picker.replaceChildren(placeholder, ...crates.map((crate, index) => {
    const option = new Option(`${crate.label} · ${crate.quantity} items · Position ${index + 1}`, crate.id);
    option.dataset.quantity = crate.quantity;
    return option;
  }));
  picker.value = state.selectedId ?? '';
  picker.disabled = isComplete;
  $('#selected-value').textContent = selected ? `${selected.quantity} items` : 'No Pallet Selected';
  $('#selected-detail').textContent = selected ? `${selected.label} · Position ${state.order.indexOf(selected.id) + 1} of ${crates.length}` : 'Choose here or tap a pallet in the yard.';
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
  $('#task-title').textContent = isSort ? 'Put the Pallets in Order.' : isComplete ? 'Right in the Middle.' : 'Find the Middle Pallet.';
  $('#task-description').textContent = isSort ? 'Arrange quantities from least to greatest. Each pallet stays whole.' : isComplete ? 'Nicely done, yard crew.' : 'Select the pallet with the same number on each side, then enter its quantity.';
  $('#shipment-badge').textContent = `${state.code} · 5 Pallets`;
  $('#yard-status').textContent = isSort ? 'Ready for Sorting' : isComplete ? 'Shipment Complete' : 'Order Checked';
  $('.scene-hint').textContent = isSort ? 'Drag pallets from least to greatest. Controls are in the overlay.' : isComplete ? 'Shipment complete. Replay to sort again.' : 'Select the pallet in the middle.';
  $('#reset').innerHTML = `${icon('reset')} ${isComplete ? 'Try This Shipment Again' : 'Replay Shipment'}`;
  ['sort', 'median', 'done'].forEach((step, index) => {
    const currentIndex = isSort ? 0 : isComplete ? 2 : 1;
    const li = $(`#step-${step}`);
    if (index === currentIndex) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    li.classList.toggle('completed', index < currentIndex);
  });
  if (isComplete) {
    $('#success-value').textContent = selected.quantity;
    $('#success-explanation').textContent = `Two pallets on the left. Two on the right. The middle pallet holds ${selected.quantity} items.`;
  }
  depot?.update(crates, state);
}

$('#crate-select').addEventListener('change', event => { if (event.target.value) select(event.target.value); });
$('#move-left').addEventListener('click', () => move(state.selectedId, state.order.indexOf(state.selectedId) - 1));
$('#move-right').addEventListener('click', () => move(state.selectedId, state.order.indexOf(state.selectedId) + 1));
$('#check-order').addEventListener('click', () => {
  if (introPlaying) return;
  const result = checkOrder(state);
  state = result.state;
  setFeedback(result.message, result.ok ? 'good' : 'retry');
  render();
  if (result.ok) $('#crate-select').focus();
});
$('#answer-form').addEventListener('submit', event => {
  event.preventDefault();
  if (introPlaying) return;
  const result = submitMedian(state, $('#median-answer').value);
  state = result.state;
  setFeedback(result.message, result.ok ? 'good' : 'retry');
  render();
  if (result.ok) $('#reset').focus();
});
$('#edit-order').addEventListener('click', () => { state = editOrder(state); $('#median-answer').value = ''; setFeedback(); render(); $('#crate-select').focus(); });
$('#reset').addEventListener('click', replay);
$('#shipment').addEventListener('change', event => { state = createGame(event.target.value); $('#code-notice').hidden = true; syncURL(); replay(); });
function setReduced(value) {
  reduced = value;
  $('#reduced-motion').checked = value;
  $('#intro-reduced').checked = value;
  document.documentElement.classList.toggle('reduced-motion', value);
  if (value) depot?.reduceMotion();
  render();
}
$('#reduced-motion').addEventListener('change', event => setReduced(event.target.checked));
$('#intro-reduced').addEventListener('change', event => setReduced(event.target.checked));
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => setReduced(event.matches));
$('#skip-intro').addEventListener('click', () => depot?.skipIntro());
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

let controlsOpen = true;
function setControlsOpen(open, focus = true) {
  controlsOpen = open;
  $('#yard-controls').hidden = !open;
  $('#controls-toggle').setAttribute('aria-expanded', String(open));
  $('#controls-toggle').setAttribute('aria-label', open ? 'Hide Yard Controls' : 'Show Yard Controls');
  $('#controls-toggle').title = open ? 'Hide Yard Controls' : 'Show Yard Controls';
  if (focus) (open ? $('#controls-close') : $('#controls-toggle')).focus({ preventScroll: true });
  depot?.resize();
}
$('#controls-toggle').addEventListener('click', () => setControlsOpen(!controlsOpen));
$('#controls-close').addEventListener('click', () => setControlsOpen(false));
document.addEventListener('keydown', event => {
  // Dialogs and native select popups own Escape while they have focus.
  if (event.key === 'Escape' && controlsOpen && !document.querySelector('dialog[open]') && document.activeElement?.tagName !== 'SELECT') {
    event.preventDefault();
    setControlsOpen(false);
  }
});
function viewBounds() {
  const { width, height } = $('#scene').getBoundingClientRect();
  const header = $('.app-header').getBoundingClientRect();
  const margin = width <= 1000 || height <= 620 ? 12 : 24;
  const top = header.bottom + margin;
  let right = width - margin;
  let bottom = height - 100;
  if (controlsOpen) {
    const panel = $('#yard-controls').getBoundingClientRect();
    right = panel.left - margin;
  }
  return { x: margin, y: top, width: Math.max(100, right - margin), height: Math.max(90, bottom - top) };
}
function rendererUnavailable() {
  endIntro('renderer-unavailable');
  $('#renderer-notice').hidden = false;
  $('.yard-status').hidden = true;
  setControlsOpen(true, false);
}
function endIntro(reason) {
  if (!introPlaying) return;
  introPlaying = false;
  $('#intro-card').hidden = true;
  document.documentElement.classList.remove('intro-playing');
  $('#yard-controls').inert = false;
  $('nav').inert = false;
  if (reason !== 'interrupted') $('#crate-select').focus({ preventScroll: true });
}
try { depot = createDepot($('#scene'), { onSelect: select, onMove: move, onUnavailable: rendererUnavailable, onIntroEnd: endIntro, reducedMotion: () => reduced, viewBounds }); }
catch (error) { console.warn('3D view unavailable:', error.message); rendererUnavailable(); }
const overlayObserver = new ResizeObserver(() => depot?.resize());
overlayObserver.observe($('#yard-controls'));
overlayObserver.observe($('.app-header'));
setControlsOpen(true, false);
render();
if (new URL(location.href).searchParams.has('qa')) {
  Object.defineProperty(window, 'medianDepotQA', { value: Object.freeze({ inspect: () => depot?.inspect(), build: BUILD }) });
}

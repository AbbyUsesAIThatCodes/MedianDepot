export const PALETTE = Object.freeze({
  sky: '#d8eef0', ground: '#afcb96', cream: '#fff3d1', ink: '#254f57',
  teal: '#328c91', coral: '#ed9379', wood: '#d6a46b', woodDark: '#9c6c44',
  rail: '#667d83', pavement: '#e5dcc0',
});
export const PATTERNS = Object.freeze(['smooth', 'ribbed', 'grooved', 'studded']);
const colors = ['#eb976f', '#64b7b3', '#a78ad2', '#efc660', '#86b96c', '#78a8df', '#e491bc', '#83c9cb', '#dbaf75'];
const symbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'];
export function appearanceFor(index) {
  if (!Number.isInteger(index) || index < 0) throw new RangeError('Appearance index must be a nonnegative integer.');
  return Object.freeze({ color: colors[index % colors.length], pattern: PATTERNS[index % PATTERNS.length], symbol: symbols[index % symbols.length] });
}

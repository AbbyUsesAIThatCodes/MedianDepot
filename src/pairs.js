const colors = ['#9256ba', '#d9a328', '#589b58', '#438aca'];
export function pairMarkers(count) {
  if (!Number.isInteger(count) || count < 2 || count > 9) throw new RangeError('Pair assistance supports two to nine observations.');
  const middleStart = Math.floor((count - 1) / 2), middleEnd = Math.floor(count / 2);
  return Array.from({ length: count }, (_, index) => {
    if (index >= middleStart && index <= middleEnd) return { color: '#fff5d9', label: count % 2 ? 'Middle' : `Middle ${index - middleStart + 1}`, middle: true };
    const pair = Math.min(index, count - 1 - index);
    return { color: colors[pair], label: `Pair ${pair + 1}`, middle: false };
  });
}

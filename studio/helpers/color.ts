export function rgbToHex([r, g, b]: [number, number, number]): string {
  return (
    '#' +
    [r, g, b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')
  );
} 
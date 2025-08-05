export const discRanges = {
  D: [
    { min: 6, max: 27, segment: 7 },
    { min: 0, max: 5, segment: 6 },
    { min: -4, max: -1, segment: 5 },
    { min: -7, max: -5, segment: 4 },
    { min: -11, max: -8, segment: 3 },
    { min: -14, max: -12, segment: 2 },
    { min: -27, max: -15, segment: 1 },
  ],
  i: [
    { min: 8, max: 28, segment: 7 },
    { min: 6, max: 7, segment: 6 },
    { min: 3, max: 5, segment: 5 },
    { min: 1, max: 2, segment: 4 },
    { min: -2, max: 0, segment: 3 },
    { min: -5, max: -3, segment: 2 },
    { min: -26, max: -6, segment: 1 },
  ],
  S: [
    { min: 12, max: 26, segment: 7 },
    { min: 9, max: 11, segment: 6 },
    { min: 6, max: 8, segment: 5 },
    { min: 3, max: 5, segment: 4 },
    { min: 0, max: 2, segment: 3 },
    { min: -4, max: -1, segment: 2 },
    { min: -27, max: -5, segment: 1 },
  ],
  C: [
    { min: 6, max: 24, segment: 7 },
    { min: 3, max: 5, segment: 6 },
    { min: -0, max: 2, segment: 5 },
    { min: -2, max: -1, segment: 4 },
    { min: -5, max: -3, segment: 3 },
    { min: -8, max: -6, segment: 2 },
    { min: -26, max: -9, segment: 1 },
  ]
};

export function getSegment(letter, value) {
  const ranges = discRanges[letter];
  if (!ranges) return null;
  const found = ranges.find(r => value >= r.min && value <= r.max);
  return found ? found.segment : null;
} 
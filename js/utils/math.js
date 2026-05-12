export function clampBetween(min, max, width, from, to) {
  if (width <= from) return min;
  if (width >= to) return max;
  return min + ((max - min) * (width - from)) / (to - from);
}


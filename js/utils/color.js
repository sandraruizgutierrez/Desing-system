export function clampHex(hex) {
  const normalized = String(hex || "").trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalized)) return normalized.toLowerCase();
  return null;
}

export function hexToRgb(hex) {
  const normalized = String(hex || "").replace("#", "");
  const safeHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized.padEnd(6, "0").slice(0, 6);
  const value = Number.parseInt(safeHex, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

export function getReadableTextColor(hex) {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  const contrastWhite = 1.05 / (luminance + 0.05);
  const contrastDark = (luminance + 0.05) / 0.05;
  return contrastWhite >= contrastDark ? "#ffffff" : "#0f172a";
}

export function mixColor(hexA, hexB, ratio) {
  const colorA = hexToRgb(hexA);
  const colorB = hexToRgb(hexB);
  const weight = Math.min(1, Math.max(0, ratio));
  const mix = {
    r: Math.round(colorA.r * (1 - weight) + colorB.r * weight),
    g: Math.round(colorA.g * (1 - weight) + colorB.g * weight),
    b: Math.round(colorA.b * (1 - weight) + colorB.b * weight),
  };
  return `rgb(${mix.r}, ${mix.g}, ${mix.b})`;
}

export function isDark(hex) {
  return getReadableTextColor(hex) === "#ffffff";
}

export function colorToHexForInput(hex) {
  const clamped = clampHex(hex);
  if (!clamped) return "#000000";
  // <input type="color"> requires a 6-digit hex.
  if (clamped.length === 4) {
    const r = clamped[1];
    const g = clamped[2];
    const b = clamped[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return clamped.toLowerCase();
}


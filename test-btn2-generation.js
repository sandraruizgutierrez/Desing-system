// Test what CSS gets generated for btn2 from parsed CSS

function normalizeColorTokenValue(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (value.startsWith("var(")) return value;
  return value;
}

function normalizeRadiusValue(raw) {
  const value = String(raw || "").trim();
  if (!value || value === "none") return "0px";
  if (/^0(?:px)?$/i.test(value)) return "0px";
  return value;
}

function parseBorderToken(raw, fallbackColor = "") {
  const value = String(raw || "").trim();
  if (!value || value === "none") return { width: 0, color: normalizeColorTokenValue(fallbackColor) || "" };
  const match = value.match(/^(\d+(?:\.\d+)?)px(?:\s+([a-z-]+))?(?:\s+(.+))?$/i);
  if (!match) return { width: 0, color: normalizeColorTokenValue(fallbackColor) || "" };
  const width = Number(match[1]);
  const color = normalizeColorTokenValue(match[3] || fallbackColor || "");
  return { width: Number.isFinite(width) ? width : 0, color };
}

function buildBorderCss(width, color) {
  const numericWidth = Number(width);
  if (!Number.isFinite(numericWidth) || numericWidth <= 0) return "none";
  const nextColor = normalizeColorTokenValue(color);
  return `${Math.round(numericWidth)}px solid ${nextColor || "currentColor"}`;
}

// Parsed values from CSS import for btn2:
const parsedBtn2 = {
  color: "var(--e-global-color-47eea86e)",
  bg: "var(--e-global-color-primary)",
  border: "2px solid var(--e-global-color-primary)",
  radius: "160px",
  padY: "var(--mft-space-2xs)",
  padX: "var(--mft-space-xs)",
  hoverBg: "var(--e-global-color-13f4851a)",
  hoverColor: "var(--e-global-color-47eea86e)",
  hoverBorder: "2px solid var(--e-global-color-13f4851a)"
};

// After normalizeButtonConfig
const normalizedBtn2 = {
  color: normalizeColorTokenValue(parsedBtn2.color),
  bg: normalizeColorTokenValue(parsedBtn2.bg),
  border: String(parsedBtn2.border || ""),
  radius: normalizeRadiusValue(parsedBtn2.radius),
  borderWidth: String(parseBorderToken(parsedBtn2.border, parsedBtn2.color).width || 2),
  borderColor: normalizeColorTokenValue(parseBorderToken(parsedBtn2.border, parsedBtn2.color).color || parsedBtn2.color || ""),
  padY: String(parsedBtn2.padY || ""),
  padX: String(parsedBtn2.padX || ""),
  hoverBg: normalizeColorTokenValue(parsedBtn2.hoverBg),
  hoverColor: normalizeColorTokenValue(parsedBtn2.hoverColor),
  hoverBorder: String(parsedBtn2.hoverBorder || ""),
  hoverBorderWidth: String(parseBorderToken(parsedBtn2.hoverBorder, parsedBtn2.hoverColor).width || parseBorderToken(parsedBtn2.border, parsedBtn2.color).width || 2),
  hoverBorderColor: normalizeColorTokenValue(parseBorderToken(parsedBtn2.hoverBorder, parsedBtn2.hoverColor).color || parseBorderToken(parsedBtn2.border, parsedBtn2.color).color || parsedBtn2.hoverColor || parsedBtn2.color || ""),
};

console.log("=== Parsed btn2 from CSS ===");
console.log(JSON.stringify(parsedBtn2, null, 2));

console.log("\n=== After normalizeButtonConfig ===");
console.log(JSON.stringify(normalizedBtn2, null, 2));

// What buildButtonCssSnippet would generate
const color = normalizeColorTokenValue(normalizedBtn2.color);
const bg = normalizeColorTokenValue(normalizedBtn2.bg);
const border = buildBorderCss(normalizedBtn2.borderWidth ?? parseBorderToken(normalizedBtn2.border, color).width, normalizedBtn2.borderColor || parseBorderToken(normalizedBtn2.border, color).color);
const hoverBg = normalizeColorTokenValue(normalizedBtn2.hoverBg || bg);
const hoverColor = normalizeColorTokenValue(normalizedBtn2.hoverColor || color);
const hoverBorder = buildBorderCss(normalizedBtn2.hoverBorderWidth ?? parseBorderToken(normalizedBtn2.hoverBorder, hoverColor).width, normalizedBtn2.hoverBorderColor || parseBorderToken(normalizedBtn2.hoverBorder, hoverColor).color);
const radius = normalizeRadiusValue(normalizedBtn2.radius || "");
const hoverRadius = normalizeRadiusValue(normalizedBtn2.hoverRadius || radius);

console.log("\n=== CSS that would be generated ===");
console.log(`color: ${color}`);
console.log(`background-color: ${bg}`);
console.log(`border: ${border}`);
console.log(`border-radius: ${radius}`);
console.log(`padding: ${String(normalizedBtn2.padY || "")} ${String(normalizedBtn2.padX || "")};\n`);
console.log(`HOVER:`);
console.log(`color: ${hoverColor}`);
console.log(`background-color: ${hoverBg}`);
console.log(`border: ${hoverBorder}`);
console.log(`border-radius: ${hoverRadius}`);

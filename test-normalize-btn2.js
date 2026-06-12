// Test normalizeButtonConfig for btn2

function normalizeFontFamily(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  return value.split(",")[0].replace(/['"]/g, "").trim();
}

function normalizePx(raw, fallback = "") {
  const value = String(raw || "").trim();
  if (!value) return fallback;
  if (/^\d+/.test(value)) return value.replace(/[^\d.px-]/g, "");
  return value;
}

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

// Simulate state.btn.btn2 default values
const defaultBtn2 = {
  label: "CTA sólido",
  color: "var(--e-global-color-47eea86e)",
  bg: "var(--e-global-color-primary)",
  border: "2px solid var(--e-global-color-primary)",
  radius: "0px",
  padY: "var(--mft-space-2xs)",
  padX: "var(--mft-space-xs)",
  hoverBg: "var(--e-global-color-13f4851a)",
  hoverColor: "var(--e-global-color-47eea86e)",
  hoverBorder: "2px solid var(--e-global-color-13f4851a)",
};

// Parsed values from imported CSS
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

// What applyButtonStyleFromCss builds
const config = {};
if (parsedBtn2.color) config.color = normalizeColorTokenValue(parsedBtn2.color);
if (parsedBtn2.bg) config.bg = normalizeColorTokenValue(parsedBtn2.bg);
if (parsedBtn2.border) config.border = String(parsedBtn2.border);
if (parsedBtn2.radius) config.radius = normalizeRadiusValue(parsedBtn2.radius);
if (parsedBtn2.padY) config.padY = String(parsedBtn2.padY);
if (parsedBtn2.padX) config.padX = String(parsedBtn2.padX);
if (parsedBtn2.hoverColor) config.hoverColor = normalizeColorTokenValue(parsedBtn2.hoverColor);
if (parsedBtn2.hoverBg) config.hoverBg = normalizeColorTokenValue(parsedBtn2.hoverBg);
if (parsedBtn2.hoverBorder) config.hoverBorder = String(parsedBtn2.hoverBorder);

console.log("=== Parsed config from CSS ===");
console.log(JSON.stringify(config, null, 2));

// Now simulate normalizeButtonConfig
const base = {
  label: "CTA sólido",
  codeName: "mft-btn-2",
  color: "var(--e-global-color-47eea86e)",
  bg: "var(--e-global-color-primary)",
  border: "2px solid var(--e-global-color-primary)",
  borderWidth: "2",
  borderColor: "var(--e-global-color-primary)",
  radius: "0px",
  padY: "var(--mft-space-2xs)",
  padX: "var(--mft-space-xs)",
  hoverBg: "var(--e-global-color-13f4851a)",
  hoverColor: "var(--e-global-color-47eea86e)",
  hoverBorder: "2px solid var(--e-global-color-13f4851a)",
};

const currentBorder = parseBorderToken(config.border || base.border || "", config.color || base.color || "");
const currentHoverBorder = parseBorderToken(config.hoverBorder || base.hoverBorder || "", config.hoverColor || config.color || base.hoverColor || base.color || "");

const normalized = {
  ...base,
  ...config,
  label: String(config.label || base.label || "CTA sólido").trim() || "CTA sólido",
  codeName: String(config.codeName || base.codeName || "mft-btn-2").trim() || "mft-btn-2",
  color: normalizeColorTokenValue(config.color || base.color || ""),
  bg: normalizeColorTokenValue(config.bg || base.bg || ""),
  border: String(config.border || base.border || ""),
  borderWidth: String(config.borderWidth || currentBorder.width || base.borderWidth || 0),
  borderColor: normalizeColorTokenValue(config.borderColor || currentBorder.color || base.borderColor || config.color || base.color || ""),
  radius: normalizeRadiusValue(config.radius || base.radius || ""),
  padY: String(config.padY || base.padY || ""),
  padX: String(config.padX || base.padX || ""),
  hoverBg: normalizeColorTokenValue(config.hoverBg || base.hoverBg || ""),
  hoverColor: normalizeColorTokenValue(config.hoverColor || base.hoverColor || ""),
  hoverBorder: String(config.hoverBorder || base.hoverBorder || ""),
  hoverBorderWidth: String(config.hoverBorderWidth || currentHoverBorder.width || currentBorder.width || base.hoverBorderWidth || 0),
  hoverBorderColor: normalizeColorTokenValue(config.hoverBorderColor || currentHoverBorder.color || base.hoverBorderColor || config.hoverColor || config.color || base.hoverColor || base.color || ""),
};

console.log("\n=== After normalizeButtonConfig ===");
console.log(JSON.stringify(normalized, null, 2));

console.log("\n=== Key values for rendering ===");
console.log(`radius: ${normalized.radius}`);
console.log(`hoverBorder: ${normalized.hoverBorder}`);
console.log(`hoverBorderWidth: ${normalized.hoverBorderWidth}`);
console.log(`hoverBorderColor: ${normalized.hoverBorderColor}`);

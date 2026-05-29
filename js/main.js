import { clampHex, hexToRgb, getReadableTextColor, isDark, mixColor } from "./utils/color.js";
import { clampBetween } from "./utils/math.js";
import { safeJsonParse } from "./utils/json.js";
import { cloneData } from "./utils/clone.js";
import { escapeHtml } from "./utils/string.js";
import { setupEditorModal } from "./modals/editorModal.js";
import { devices } from "./core/devices.js";
import { el } from "./core/elements.js";

function copyIconSvg() {
  return `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="12" height="12" rx="2"></rect>
            <path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path>
          </svg>
        `.trim();
}

const defaultPalette = {
  primary: "#d09e5c", // e-global-color-primary
  secondary: "#32505c", // e-global-color-secondary
  accent: "#e0bf93", // e-global-color-accent
  text: "#202020", // Text / Black
  primaryDark: "#89683d", // e-global-color-13f4851a
  primaryLight: "#e0bf93", // mirai primary-light alias
  light: "#ffffff", // e-global-color-47eea86e
  dark: "#1c3042", // e-global-color-bd9d5b8
};

const defaultPaletteLabels = [
  { key: "primary", label: "--mirai-wp-Primary", varId: "--e-global-color-primary" },
  { key: "secondary", label: "--mirai-wp-secondary", varId: "--e-global-color-secondary" },
  { key: "primaryLight", label: "--mirai-wp-Primary-light", varId: "--e-global-color-6cb047a" },
  { key: "accent", label: "--mirai-wp-Primary-light", varId: "--e-global-color-accent" },
  { key: "text", label: "Text", varId: "--e-global-color-text" },
  { key: "primaryDark", label: "--mirai-wp-Primary-dark", varId: "--e-global-color-13f4851a", displayVarId: "--e-global-color-primary-dark" },
  { key: "light", label: "white", varId: "--e-global-color-47eea86e" },
  { key: "dark", label: "color-header", varId: "--e-global-color-bd9d5b8" },
];

const legacyPaletteLabelsByKey = {
  primary: ["Primary"],
  secondary: ["Secondary"],
  primaryLight: ["Primary Light", "--mirai-wp-Primary-light"],
  accent: ["Accent"],
  text: ["Text"],
  primaryDark: ["Primary Dark", "--mirai-wp-Primary-dark"],
  light: ["Light"],
  dark: ["Dark"],
};

const defaultTypographyLabels = {
  primaryHeading: "Primary Heading",
  secondaryHeading: "Secondary Heading",
  tertiaryHeading: "Tertiary Heading",
  subheading: "Subheading",
  overline: "Overline",
  menuLinkL: "Large Menu Link",
  menuLinkM: "Medium Menu Link",
  menuLinkS: "Small Menu Link",
  paragraphL: "Paragraph L",
  paragraphM: "Paragraph M",
  paragraphS: "Paragraph S",
  paragraphXS: "Paragraph XS",
  button: "Button",
  buttonS: "Button S",
  uiMain: "UI Main",
  uiSub: "UI Sub",
  uiTiny: "UI Tiny",
};

const defaultExtraColors = [
  // Elementor kit 1397 colors (extras)
  { id: "--e-global-color-52235058", label: "--mirai-wp-Primary-super-dark", value: "#45341e" },
  { id: "--e-global-color-13f4851a", label: "--mirai-wp-Primary-dark", value: "#89683d" },
  { id: "--e-global-color-6cb047a", label: "--mirai-wp-Primary-super-light", value: "#f1e5d9" },
  { id: "--e-global-color-c192f6c", label: "--mirai-wp-Primary-background", value: "#faf6f2" },
  { id: "--e-global-color-d2ec73e", label: "--mirai-wp-secondary-super-dark", value: "#111a1e" },
  { id: "--e-global-color-cde7fbb", label: "--mirai-wp-secondary-dark", value: "#21353d" },
  { id: "--e-global-color-ca1687a", label: "--mirai-wp-secondary-light", value: "#788b93" },
  { id: "--e-global-color-9c3eef3", label: "--mirai-wp-secondary-super-light", value: "#bbc5c9" },
  { id: "--e-global-color-f79e654", label: "--mirai-wp-secondary-background", value: "#eaedef" },
  { id: "--e-global-color-d9f1a36", label: "--mirai-ui-content", value: "#484848" },
  { id: "--e-global-color-485e56c", label: "--mirai-ui-content-light", value: "#737373" },
  { id: "--e-global-color-610777e", label: "--mirai-ui-accent-border", value: "#e4e4e4" },
  { id: "--e-global-color-15b9b07", label: "--mirai-ui-content-background", value: "#f6f6f6" },
  { id: "--e-global-color-bd9d5b8", label: "color-header", value: "#1c3042" },
  { id: "--e-global-color-fc842eb", label: "color-header-hover", value: "#89683d" },
  { id: "--e-global-color-e0ef2e7", label: "--e-global-color-e0ef2e7", value: "#1c3042" },
];

const defaultExtraColorMap = new Map(
  defaultExtraColors.map((item) => [String(item.id || "").toLowerCase(), item]),
);

const kitColorDisplayOrder = [
  { kind: "palette", key: "primary", label: "--mirai-wp-Primary", varId: "--e-global-color-primary" },
  { kind: "palette", key: "secondary", label: "--mirai-wp-secondary", varId: "--e-global-color-secondary" },
  { kind: "palette", key: "accent", label: "--mirai-wp-Primary-light", varId: "--e-global-color-accent" },
  { kind: "palette", key: "text", label: "Text", varId: "--e-global-color-text" },
  { kind: "extra", id: "--e-global-color-52235058", label: "--mirai-wp-Primary-super-dark" },
  { kind: "palette", key: "primaryDark", label: "--mirai-wp-Primary-dark", varId: "--e-global-color-13f4851a" },
  { kind: "extra", id: "--e-global-color-6cb047a", label: "--mirai-wp-Primary-super-light" },
  { kind: "extra", id: "--e-global-color-c192f6c", label: "--mirai-wp-Primary-background" },
  { kind: "extra", id: "--e-global-color-d2ec73e", label: "--mirai-wp-secondary-super-dark" },
  { kind: "extra", id: "--e-global-color-cde7fbb", label: "--mirai-wp-secondary-dark" },
  { kind: "extra", id: "--e-global-color-ca1687a", label: "--mirai-wp-secondary-light" },
  { kind: "extra", id: "--e-global-color-9c3eef3", label: "--mirai-wp-secondary-super-light" },
  { kind: "extra", id: "--e-global-color-f79e654", label: "--mirai-wp-secondary-background" },
  { kind: "extra", id: "--e-global-color-21f8c9b7", label: "black" },
  { kind: "extra", id: "--e-global-color-d9f1a36", label: "--mirai-ui-content" },
  { kind: "extra", id: "--e-global-color-485e56c", label: "--mirai-ui-content-light" },
  { kind: "extra", id: "--e-global-color-610777e", label: "--mirai-ui-accent-border" },
  { kind: "extra", id: "--e-global-color-15b9b07", label: "--mirai-ui-content-background" },
  { kind: "palette", key: "light", label: "white", varId: "--e-global-color-47eea86e" },
  { kind: "palette", key: "dark", label: "color-header", varId: "--e-global-color-bd9d5b8" },
  { kind: "extra", id: "--e-global-color-fc842eb", label: "color-header-hover" },
  { kind: "extra", id: "--e-global-color-e0ef2e7", label: "--e-global-color-e0ef2e7" },
];

const kitColorOrderIndex = new Map(
  kitColorDisplayOrder.map((item, index) => [item.kind === "palette" ? `${item.kind}:${item.key}` : `${item.kind}:${String(item.id).toLowerCase()}`, index]),
);

function getKitColorLabel(kind, keyOrId, fallback = "") {
  const token = kind === "palette" ? `palette:${String(keyOrId || "").trim()}` : `extra:${String(keyOrId || "").trim().toLowerCase()}`;
  const match = kitColorDisplayOrder.find((item) => (item.kind === "palette" ? `palette:${item.key}` : `extra:${String(item.id).toLowerCase()}`) === token);
  return match?.label || String(fallback || keyOrId || "").trim();
}

function getKitColorVarId(kind, keyOrId) {
  const token = kind === "palette" ? `palette:${String(keyOrId || "").trim()}` : `extra:${String(keyOrId || "").trim().toLowerCase()}`;
  const match = kitColorDisplayOrder.find((item) => (item.kind === "palette" ? `palette:${item.key}` : `extra:${String(item.id).toLowerCase()}`) === token);
  if (match?.varId) return match.varId;
  return String(keyOrId || "").trim();
}

function buildKitColorCards() {
  const paletteKeyAllowList = Array.isArray(state.kitPaletteKeysPresent) && state.kitPaletteKeysPresent.length ? new Set(state.kitPaletteKeysPresent) : null;
  const paletteIds = new Set(
    (state.paletteLabels || [])
      .map((item) => String(item.varId || item.displayVarId || "").trim().toLowerCase())
      .filter(Boolean),
  );
  const extraById = new Map(
    (Array.isArray(state.extraColors) ? state.extraColors : [])
      .filter((item) => item && String(item.id || "").trim())
      .map((item, index) => [String(item.id).trim().toLowerCase(), { item, index }]),
  );

  const cards = [];
  const seenExtras = new Set();

  kitColorDisplayOrder.forEach((entry) => {
    if (entry.kind === "palette") {
      if (paletteKeyAllowList && !paletteKeyAllowList.has(entry.key)) return;
      const value = state.palette?.[entry.key];
      if (!value) return;
      const label = state.paletteLabels?.find((item) => item.key === entry.key)?.label || entry.label;
      cards.push({
        kind: "palette",
        key: entry.key,
        label,
        value,
        varId: getKitColorVarId("palette", entry.key),
        sortIndex: kitColorOrderIndex.get(`palette:${entry.key}`) ?? Number.MAX_SAFE_INTEGER,
      });
      return;
    }

    const found = extraById.get(String(entry.id).trim().toLowerCase());
    if (!found?.item?.value) return;
    seenExtras.add(String(entry.id).trim().toLowerCase());
    cards.push({
      kind: "extra",
      index: found.index,
      id: found.item.id,
      label: String(found.item.label || entry.label || entry.id || "").trim(),
      value: found.item.value,
      varId: getKitColorVarId("extra", found.item.id),
      sortIndex: kitColorOrderIndex.get(`extra:${String(found.item.id).trim().toLowerCase()}`) ?? Number.MAX_SAFE_INTEGER,
    });
  });

  Array.from(extraById.values())
    .filter((entry) => !seenExtras.has(String(entry.item.id).trim().toLowerCase()))
    .filter((entry) => !paletteIds.has(String(entry.item.id).trim().toLowerCase()))
    .sort((a, b) => {
      const aLabel = String(a.item.id || a.item.label || "").toLowerCase();
      const bLabel = String(b.item.id || b.item.label || "").toLowerCase();
      return aLabel.localeCompare(bLabel);
    })
    .forEach((entry) => {
      cards.push({
        kind: "extra",
        index: entry.index,
        id: entry.item.id,
        label: String(entry.item.label || entry.item.id || "Color").trim(),
        value: entry.item.value,
        varId: String(entry.item.id || entry.item.label || "").trim(),
        sortIndex: Number.MAX_SAFE_INTEGER,
      });
    });

  return cards.sort((a, b) => {
    if (a.sortIndex !== b.sortIndex) return a.sortIndex - b.sortIndex;
    const aLabel = String(a.label || a.varId || "").toLowerCase();
    const bLabel = String(b.label || b.varId || "").toLowerCase();
    return aLabel.localeCompare(bLabel);
  });
}

function getPaletteLabelByValue(value) {
  const normalizedValue = clampHex(value);
  if (!normalizedValue || !state?.palette || !state?.paletteLabels) return null;
  return state.paletteLabels.find((item) => clampHex(state.palette?.[item.key]) === normalizedValue) || null;
}

function buildExtraColorLabel(varName, value = "") {
  const key = String(varName || "").toLowerCase();
  const known = defaultExtraColorMap.get(key);
  if (known?.label) return known.label;
  return String(varName || "").trim() || "Color";
}

function ensureDefaultPaletteLabels(labels = []) {
  const incoming = Array.isArray(labels)
    ? labels
      .filter((item) => item && typeof item === "object" && String(item.key || "").trim())
      .map((item) => ({ ...item, key: String(item.key).trim() }))
    : [];
  const incomingByKey = new Map(incoming.map((item) => [item.key, item]));
  const next = defaultPaletteLabels.map((defaultItem) => {
    const current = incomingByKey.get(defaultItem.key);
    if (!current) return { ...defaultItem };
    const currentLabel = String(current.label || "").trim();
    const legacyLabels = legacyPaletteLabelsByKey[defaultItem.key] || [];
    if (!currentLabel || legacyLabels.includes(currentLabel)) {
      return {
        ...defaultItem,
        ...current,
        key: defaultItem.key,
        label: defaultItem.label,
      };
    }
    return {
      ...defaultItem,
      ...current,
      key: defaultItem.key,
      label: currentLabel || defaultItem.label,
    };
  });
  incoming.forEach((item) => {
    if (defaultPaletteLabels.some((entry) => entry.key === item.key)) return;
    next.push({ ...item });
  });
  return next;
}

function normalizeColorTokenValue(raw) {
  const value = String(raw || "").trim();
  if (!value) return value;
  const aliasMap = {
    "--e-global-color-primary-dark": "--e-global-color-13f4851a",
    "--e-global-color-primary-light": "--e-global-color-6cb047a",
  };
  const aliasMatch = value.match(/^var\((--e-global-color-[^)]+)\)$/i);
  if (aliasMatch) {
    const normalizedId = aliasMap[String(aliasMatch[1]).toLowerCase()] || String(aliasMatch[1]).toLowerCase();
    return `var(${normalizedId})`;
  }
  if (/^--e-global-color-[a-z0-9]+$/i.test(value)) return `var(${value.toLowerCase()})`;
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

function normalizeRadiusValue(raw) {
  const value = String(raw || "").trim();
  if (!value || value === "none") return "0px";
  if (/^0(?:px)?$/i.test(value)) return "0px";
  return value;
}

const spaceOrder = ["5xs", "4xs", "3xs", "2xs", "xs", "s", "m", "l", "xl", "2xl", "3xl", "4xl", "5xl"];
const defaultPaddingOrder = ["xxs", "xs", "s", "ms", "m", "lxs", "ls", "l", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"];
const paddingLegacyKeyMap = { x: "lxs" };

function getSpaceOrderList() {
  const base = Array.isArray(spaceOrder) ? spaceOrder.slice() : [];
  const custom = Array.isArray(state?.spaceCustomOrder) ? state.spaceCustomOrder : [];
  const fromState = Object.keys(state?.spaces || {}).filter((key) => !base.includes(key) && !custom.includes(key));
  const seen = new Set();
  return [...base, ...custom, ...fromState].filter((key) => {
    if (!key || seen.has(key)) return false;
    seen.add(key);
    if (!Object.prototype.hasOwnProperty.call(state?.spaces || {}, key)) return false;
    return true;
  });
}

function isBaseSpaceKey(key) {
  return spaceOrder.includes(String(key || ""));
}

function isCustomSpaceKey(key) {
  const value = String(key || "");
  return !!value && !isBaseSpaceKey(value);
}

function getPaddingOrderList() {
  if (!state?.paddingSpaces || !Object.keys(state.paddingSpaces).length) return [];
  const base = Array.isArray(state?.paddingBaseOrder) && state.paddingBaseOrder.length ? state.paddingBaseOrder.slice() : defaultPaddingOrder.slice();
  const custom = Array.isArray(state?.paddingCustomOrder) ? state.paddingCustomOrder : [];
  const fromState = Object.keys(state?.paddingSpaces || {}).filter((key) => !base.includes(key) && !custom.includes(key));
  const seen = new Set();
  return [...base, ...custom, ...fromState].filter((key) => {
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isBasePaddingKey(key) {
  const value = String(key || "");
  const base = Array.isArray(state?.paddingBaseOrder) && state.paddingBaseOrder.length ? state.paddingBaseOrder : defaultPaddingOrder;
  return base.includes(value);
}

function sanitizePaddingKey(raw) {
  const key = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^--/g, "")
    .replace(/^mft-padding-/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return paddingLegacyKeyMap[key] || key;
}

function sanitizeSpaceKey(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^--/g, "")
    .replace(/^mft-space-/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const state = {
  device: "desktop",
  palette: { ...defaultPalette },
  paletteLabels: defaultPaletteLabels.map((item) => ({ ...item })),
  extraColors: defaultExtraColors.map((c) => ({ ...c })),
  kitPaletteKeysPresent: Object.keys(defaultPalette),
  spaceClamp: { from: 1180, to: 1920 },
  spaceCustomOrder: [],
  spaceHidden: [],
  spaces: {
    "5xs": { type: "fixed", value: 4 },
    "4xs": { type: "fixed", value: 8 },
    "3xs": { type: "fixed", value: 12 },
    "2xs": { type: "fixed", value: 16 },
    xs: { type: "fluid", min: 16, max: 24 }, // 24 --- 16
    s: { type: "fluid", min: 24, max: 32 }, // 32 --- 24
    m: { type: "fluid", min: 32, max: 40 }, // 40 --- 32
    l: { type: "fluid", min: 32, max: 48 }, // 48 --- 32
    xl: { type: "fluid", min: 32, max: 56 }, // 56 --- 32
    "2xl": { type: "fluid", min: 48, max: 64 }, // 64 --- 48
    "3xl": { type: "fluid", min: 48, max: 80 }, // 80 --- 48
    "4xl": { type: "fluid", min: 48, max: 96 }, // 96 --- 48
    "5xl": { type: "fluid", min: 48, max: 160 }, // 160 --- 48
  },
  paddingCustomOrder: [],
  paddingBaseOrder: [],
  paddingHidden: [],
  paddingSpaces: {},
  typographyClamp: { from: 1180, to: 1920 },
  imageByDevice: {
    desktop: { radius: "var(--mft-space-2xs)", box: "500px" },
    tablet: { radius: "var(--mft-space-2xs)", box: "500px" },
    mobile: { radius: "var(--mft-space-2xs)", box: "500px" },
  },
  btn: {
    arrowGap: "8px",
    arrowContent: '"\\2192"',
    hiddenButtons: [],
    customButtons: [],
    btn1: {
      label: "Base global",
      color: "var(--e-global-color-47eea86e)",
      bg: "var(--e-global-color-bd9d5b8)",
      border: "2px solid var(--e-global-color-bd9d5b8)",
      radius: "var(--mft-space-5xs)",
      padY: "var(--mft-space-2xs)",
      padX: "var(--mft-space-xs)",
      hoverBg: "var(--e-global-color-primary)",
      hoverColor: "var(--e-global-color-47eea86e)",
      hoverBorder: "2px solid var(--e-global-color-primary)",
    },
    btn2: {
      label: "CTA sólido",
      color: "var(--e-global-color-47eea86e)",
      bg: "var(--e-global-color-primary)",
      border: "2px solid var(--e-global-color-primary)",
      radius: "var(--mft-space-5xs)",
      padY: "var(--mft-space-2xs)",
      padX: "var(--mft-space-xs)",
      hoverBg: "var(--e-global-color-13f4851a)",
      hoverColor: "var(--e-global-color-47eea86e)",
      hoverBorder: "2px solid var(--e-global-color-13f4851a)",
    },
    btn3: {
      label: "CTA destacado",
      color: "var(--e-global-color-primary)",
      bg: "transparent",
      border: "2px solid var(--e-global-color-primary)",
      radius: "var(--mft-space-5xs)",
      padY: "var(--mft-space-2xs)",
      padX: "var(--mft-space-xs)",
      hoverBg: "var(--e-global-color-primary)",
      hoverColor: "var(--e-global-color-47eea86e)",
      hoverBorder: "2px solid var(--e-global-color-primary)",
    },
    btn4: {
      label: "CTA claro",
      color: "var(--e-global-color-primary)",
      bg: "transparent",
      border: "none",
      radius: "0px",
      padY: "0px",
      padX: "0px",
      hoverBg: "transparent",
      hoverColor: "var(--e-global-color-primary-dark)",
      hoverBorder: "none",
    },
    btn5: {
      label: "Outline",
      color: "var(--e-global-color-text)",
      bg: "transparent",
      border: "2px solid var(--e-global-color-text)",
      radius: "var(--mft-space-5xs)",
      padY: "var(--mft-space-2xs)",
      padX: "var(--mft-space-xs)",
      hoverColor: "var(--e-global-color-47eea86e)",
      hoverBg: "var(--e-global-color-text)",
      hoverBorder: "2px solid var(--e-global-color-text)",
    },
  },
  sectionUseByDevice: {
    desktop: {
      paddingTop: "4xl",
      paddingBottom: "4xl",
      paddingLeft: "xs",
      paddingRight: "xs",
      gap: "s",
      containerTop: "4xl",
      containerBottom: "4xl",
      containerLeft: "s",
      containerRight: "s",
    },
    tablet: {
      paddingTop: "4xl",
      paddingBottom: "4xl",
      paddingLeft: "xs",
      paddingRight: "xs",
      gap: "s",
      containerTop: "4xl",
      containerBottom: "4xl",
      containerLeft: "s",
      containerRight: "s",
    },
    mobile: {
      paddingTop: "4xl",
      paddingBottom: "4xl",
      paddingLeft: "xs",
      paddingRight: "xs",
      gap: "s",
      containerTop: "4xl",
      containerBottom: "4xl",
      containerLeft: "s",
      containerRight: "s",
    },
  },
  typographyByDevice: {
    desktop: {
      families: {
        heading: "\"The Seasons\", serif",
        links: "\"Lato\", sans-serif",
        body: "\"Lato\", sans-serif",
        ui: "Inter, system-ui, sans-serif",
      },
      labels: { ...defaultTypographyLabels },
      styles: {
        primaryHeading: { size: 96, weight: 400, line: 1.1, space: 0 }, // 110%
        secondaryHeading: { size: 72, weight: 400, line: 1.1, space: 0 }, // 110%
        tertiaryHeading: { size: 56, weight: 300, line: 1.1, space: 0 }, // 110%
        subheading: { size: 40, weight: 300, line: 1.5, space: 0 }, // 150%
        overline: { size: 32, weight: 300, line: 1.1, space: 0 }, // 110%
        menuLinkL: { size: 56, weight: 400, line: 1.1, space: 0 }, // 110%
        menuLinkM: { size: 18, weight: 500, line: 1.1, space: 0 }, // 110%
        menuLinkS: { size: 14, weight: 500, line: 1.1, space: 0 }, // 110%
        paragraphL: { size: 22, weight: 400, line: 1.5, space: 0 },
        paragraphM: { size: 18, weight: 400, line: 1.5, space: 0 },
        paragraphS: { size: 16, weight: 400, line: 1.5, space: 0 },
        paragraphXS: { size: 14, weight: 400, line: 1.5, space: 0 },
        button: { size: 18, weight: 600, line: 1.1, space: 0 }, // 110%
        buttonS: { size: 14, weight: 600, line: 1.1, space: 0 }, // 110%
        uiMain: { size: 14, weight: 500, line: 1.35, space: 0.02 },
        uiSub: { size: 12, weight: 500, line: 1.35, space: 0.02 },
        uiTiny: { size: 11, weight: 600, line: 1.2, space: 0.08 },
      },
    },
    tablet: {
      families: {
        heading: "\"The Seasons\", serif",
        links: "\"Lato\", sans-serif",
        body: "\"Lato\", sans-serif",
        ui: "Inter, system-ui, sans-serif",
      },
      labels: { ...defaultTypographyLabels },
      styles: {},
    },
    mobile: {
      families: {
        heading: "\"The Seasons\", serif",
        links: "\"Lato\", sans-serif",
        body: "\"Lato\", sans-serif",
        ui: "Inter, system-ui, sans-serif",
      },
      labels: { ...defaultTypographyLabels },
      styles: {
        primaryHeading: { size: 40, weight: 400, line: 1.1, space: 0 }, // 110%
        secondaryHeading: { size: 36, weight: 400, line: 1.1, space: 0 },
        tertiaryHeading: { size: 32, weight: 300, line: 1.1, space: 0 },
        subheading: { size: 24, weight: 300, line: 1.5, space: 0 }, // 150%
        overline: { size: 24, weight: 300, line: 1.1, space: 0 },
        menuLinkL: { size: 32, weight: 400, line: 1.1, space: 0 },
        menuLinkM: { size: 16, weight: 500, line: 1.1, space: 0 }, // 110%
        menuLinkS: { size: 12, weight: 500, line: 1.1, space: 0 }, // 110%
        paragraphL: { size: 20, weight: 400, line: 1.5, space: 0 },
        paragraphM: { size: 16, weight: 400, line: 1.5, space: 0 },
        paragraphS: { size: 14, weight: 400, line: 1.5, space: 0 },
        paragraphXS: { size: 12, weight: 400, line: 1.5, space: 0 },
        button: { size: 16, weight: 600, line: 1.1, space: 0 }, // 110%
        buttonS: { size: 12, weight: 600, line: 1.1, space: 0 }, // 110%
        uiMain: { size: 13, weight: 500, line: 1.35, space: 0.02 },
        uiSub: { size: 12, weight: 500, line: 1.35, space: 0.02 },
        uiTiny: { size: 11, weight: 600, line: 1.2, space: 0.08 },
      },
    },
  },
  // Typography UI follows the top device switcher; no cross-device compare here.
};

function getDeviceWidth() {
  return devices[state.device].tokenWidth ?? devices[state.device].width;
}

function getCurrentSpaceValue(key) {
  const width = getDeviceWidth();
  const token = state.spaces[key];
  if (!token) return 0;
  if (token.type === "fixed") return token.value;
  return Math.round(clampBetween(token.min, token.max, width, state.spaceClamp.from, state.spaceClamp.to));
}

function getSpaceValueForDevice(device, key) {
  const d = devices[device];
  const width = d?.tokenWidth ?? d?.width ?? devices.desktop.tokenWidth;
  const token = state.spaces[key];
  if (!token) return 0;
  if (token.type === "fixed") return token.value;
  return Math.round(clampBetween(token.min, token.max, width, state.spaceClamp.from, state.spaceClamp.to));
}

function findSpaceTokenByPx(px, preferredDevice = null) {
  const value = Number(px);
  if (!Number.isFinite(value)) return null;
  const order = [preferredDevice, "desktop", "tablet", "mobile"].filter((device, index, list) => device && list.indexOf(device) === index);
  for (const device of order) {
    for (const key of getSpaceOrderList()) {
      if (Math.round(getSpaceValueForDevice(device, key)) === Math.round(value)) {
        return key;
      }
    }
  }
  return null;
}

function resolveSpaceLike(value) {
  const raw = String(value || "").trim();
  if (!raw) return { kind: "unknown", raw, px: 0 };

  if (getSpaceOrderList().includes(raw)) return { kind: "token", raw, token: raw, px: getCurrentSpaceValue(raw) };

  const paddingResolved = resolvePaddingLike(raw);
  if (paddingResolved) return paddingResolved;

  const varMatch = raw.match(/^var\(--mft-space-([^)]+)\)$/);
  if (varMatch && getSpaceOrderList().includes(varMatch[1])) {
    const token = varMatch[1];
    return { kind: "token", raw, token, px: getCurrentSpaceValue(token) };
  }

  const pxMatch = raw.match(/^(\d+(?:\.\d+)?)\s*px$/i);
  if (pxMatch) {
    const px = Number(pxMatch[1]);
    const token = findSpaceTokenByPx(px, "desktop");
    if (token) return { kind: "token", raw: `${px}px`, token, px: getCurrentSpaceValue(token) };
    return { kind: "px", raw: `${px}px`, px };
  }

  const num = Number(raw);
  if (!Number.isNaN(num) && Number.isFinite(num)) return { kind: "px", raw: `${num}px`, px: num };

  return { kind: "css", raw, px: 0 };
}

function resolveSpaceLikeForDevice(device, value) {
  const raw = String(value || "").trim();
  if (!raw) return { kind: "unknown", raw, px: 0 };

  if (getSpaceOrderList().includes(raw)) return { kind: "token", raw, token: raw, px: getSpaceValueForDevice(device, raw) };

  const paddingResolved = resolvePaddingLike(raw, device);
  if (paddingResolved) return paddingResolved;

  const aliasMatch = raw.match(/^--([a-z0-9]+)$/i);
  if (aliasMatch && getSpaceOrderList().includes(aliasMatch[1])) {
    const token = aliasMatch[1];
    return { kind: "token", raw, token, px: getSpaceValueForDevice(device, token) };
  }

  if (aliasMatch && getPaddingOrderList().includes(aliasMatch[1])) {
    const token = aliasMatch[1];
    return { kind: "token", raw, token, px: getPaddingValueForDevice(device, token) };
  }

  const varMatch = raw.match(/^var\(--mft-space-([^)]+)\)$/);
  if (varMatch && getSpaceOrderList().includes(varMatch[1])) {
    const token = varMatch[1];
    return { kind: "token", raw, token, px: getSpaceValueForDevice(device, token) };
  }

  const paddingVarMatch = raw.match(/^var\(--mft-padding-([^)]+)\)$/);
  if (paddingVarMatch && getPaddingOrderList().includes(paddingVarMatch[1])) {
    const token = paddingVarMatch[1];
    return { kind: "token", raw, token, px: getPaddingValueForDevice(device, token) };
  }

  const pxMatch = raw.match(/^(\d+(?:\.\d+)?)\s*px$/i);
  if (pxMatch) {
    const px = Number(pxMatch[1]);
    const token = findSpaceTokenByPx(px, device);
    if (token) return { kind: "token", raw: `${px}px`, token, px: getSpaceValueForDevice(device, token) };
    const paddingToken = findPaddingTokenByPx(px, device);
    if (paddingToken) return { kind: "token", raw: `${px}px`, token: paddingToken, px: getPaddingValueForDevice(device, paddingToken) };
    return { kind: "px", raw: `${px}px`, px };
  }

  const num = Number(raw);
  if (!Number.isNaN(num) && Number.isFinite(num)) return { kind: "px", raw: `${num}px`, px: num };

  return { kind: "css", raw, px: 0 };
}

function formatSpaceLikeDisplay(device, value) {
  const resolved = resolveSpaceLikeForDevice(device, value);
  if (resolved.kind === "token") return `--${resolved.token} · ${resolved.px}px`;
  if (resolved.kind === "px") return `${resolved.px}px`;
  return resolved.raw || "";
}

function normalizeSpaceLikeToken(raw) {
  const value = String(raw || "").trim();
  if (!value) return value;
  const aliasMatch = value.match(/^--([a-z0-9]+)$/i);
  if (aliasMatch && getSpaceOrderList().includes(aliasMatch[1])) return `var(--mft-space-${aliasMatch[1]})`;
  const varMatch = value.match(/^var\(--mft-space-([^)]+)\)$/);
  if (varMatch && getSpaceOrderList().includes(varMatch[1])) return `var(--mft-space-${varMatch[1]})`;
  return value;
}

function normalizeSpaceLikeTokenForDevice(device, raw) {
  const value = String(raw || "").trim();
  if (!value) return value;
  const normalized = normalizeSpaceLikeToken(value);
  const resolved = resolveSpaceLikeForDevice(device, normalized);
  if (resolved.kind === "px") {
    const match = findSpaceTokenByPx(resolved.px, device);
    if (match) return `var(--mft-space-${match})`;
  }
  return normalized;
}

function normalizeButtonSpacingConfig(input) {
  return {
    radius: normalizeSpaceLikeToken(input?.radius || "var(--mft-space-5xs)"),
    padY: normalizeSpaceLikeToken(input?.padY || "var(--mft-space-2xs)"),
    padX: normalizeSpaceLikeToken(input?.padX || "var(--mft-space-xs)"),
  };
}

function getPaddingCurrentValue(key) {
  const token = state.paddingSpaces[key];
  if (!token) return 0;
  const width = getDeviceWidth();
  if (token.type === "fixed") return token.value;
  return Math.round(clampBetween(token.min, token.max, width, state.spaceClamp.from, state.spaceClamp.to));
}

function getPaddingValueForDevice(device, key) {
  const d = devices[device];
  const width = d?.tokenWidth ?? d?.width ?? devices.desktop.tokenWidth;
  const token = state.paddingSpaces[key];
  if (!token) return 0;
  if (token.type === "fixed") return token.value;
  return Math.round(clampBetween(token.min, token.max, width, state.spaceClamp.from, state.spaceClamp.to));
}

function findPaddingTokenByPx(px, preferredDevice = null) {
  const value = Number(px);
  if (!Number.isFinite(value)) return null;
  const order = [preferredDevice, "desktop", "tablet", "mobile"].filter((device, index, list) => device && list.indexOf(device) === index);
  for (const device of order) {
    for (const key of getPaddingOrderList()) {
      if (Math.round(getPaddingValueForDevice(device, key)) === Math.round(value)) return key;
    }
  }
  return null;
}

function resolvePaddingLike(value, device = null) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (getPaddingOrderList().includes(raw)) {
    const px = device ? getPaddingValueForDevice(device, raw) : getPaddingCurrentValue(raw);
    return { kind: "token", raw, token: raw, px };
  }

  const aliasMatch = raw.match(/^--([a-z0-9]+)$/i);
  if (aliasMatch && getPaddingOrderList().includes(aliasMatch[1])) {
    const token = aliasMatch[1];
    const px = device ? getPaddingValueForDevice(device, token) : getPaddingCurrentValue(token);
    return { kind: "token", raw, token, px };
  }

  const varMatch = raw.match(/^var\(--mft-padding-([^)]+)\)$/);
  if (varMatch && getPaddingOrderList().includes(varMatch[1])) {
    const token = varMatch[1];
    const px = device ? getPaddingValueForDevice(device, token) : getPaddingCurrentValue(token);
    return { kind: "token", raw, token, px };
  }

  const pxMatch = raw.match(/^(\d+(?:\.\d+)?)\s*px$/i);
  if (pxMatch) {
    const px = Number(pxMatch[1]);
    const token = findPaddingTokenByPx(px, device || "desktop");
    if (token) {
      const resolvedPx = device ? getPaddingValueForDevice(device, token) : getPaddingCurrentValue(token);
      return { kind: "token", raw: `${px}px`, token, px: resolvedPx };
    }
    return { kind: "px", raw: `${px}px`, px };
  }

  const num = Number(raw);
  if (!Number.isNaN(num) && Number.isFinite(num)) return { kind: "px", raw: `${num}px`, px: num };

  return null;
}

function normalizePaddingLikeToken(raw) {
  const value = String(raw || "").trim();
  if (!value) return value;
  const aliasMatch = value.match(/^--([a-z0-9]+)$/i);
  if (aliasMatch && getPaddingOrderList().includes(aliasMatch[1])) return `var(--mft-padding-${aliasMatch[1]})`;
  const varMatch = value.match(/^var\(--mft-padding-([^)]+)\)$/);
  if (varMatch && getPaddingOrderList().includes(varMatch[1])) return `var(--mft-padding-${varMatch[1]})`;
  return value;
}

function normalizePaddingLikeTokenForDevice(device, raw) {
  const value = String(raw || "").trim();
  if (!value) return value;
  const normalized = normalizePaddingLikeToken(value);
  const resolved = (() => {
    const tokenMatch = normalized.match(/^var\(--mft-padding-([^)]+)\)$/);
    if (tokenMatch && getPaddingOrderList().includes(tokenMatch[1])) {
      return { kind: "token", token: tokenMatch[1], px: getPaddingValueForDevice(device, tokenMatch[1]) };
    }
    const pxMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*px$/i);
    if (pxMatch) {
      const px = Number(pxMatch[1]);
      return { kind: "px", px };
    }
    return { kind: "css", raw: normalized };
  })();
  if (resolved.kind === "px") {
    const match = findPaddingTokenByPx(resolved.px, device);
    if (match) return `var(--mft-padding-${match})`;
  }
  return normalized;
}

function normalizeSectionUseConfig(input) {
  const base = {
    paddingTop: "4xl",
    paddingBottom: "4xl",
    paddingLeft: "xs",
    paddingRight: "xs",
    gap: "s",
    containerTop: "4xl",
    containerBottom: "4xl",
    containerLeft: "s",
    containerRight: "s",
  };
  const output = { ...base };
  Object.keys(base).forEach((key) => {
    output[key] = normalizeSpaceLikeTokenForDevice("desktop", input?.[key] || base[key]).replace(/^var\(--mft-space-([^)]+)\)$/, "$1");
  });
  return output;
}

function normalizeImageConfig(input) {
  return {
    radius: normalizeSpaceLikeToken(input?.radius || "var(--mft-space-2xs)"),
    box: normalizePx(input?.box, "500px"),
  };
}

function normalizePaddingConfig(input) {
  const base = {
    xxs: { type: "fluid", min: 4, max: 8 },
    xs: { type: "fluid", min: 8, max: 12 },
    s: { type: "fluid", min: 16, max: 32 },
    ms: { type: "fluid", min: 24, max: 32 },
    m: { type: "fluid", min: 24, max: 40 },
    lxs: { type: "fluid", min: 24, max: 72 },
    ls: { type: "fluid", min: 40, max: 72 },
    l: { type: "fluid", min: 48, max: 80 },
    xl: { type: "fluid", min: 72, max: 96 },
    "2xl": { type: "fluid", min: 48, max: 96 },
    "3xl": { type: "fluid", min: 72, max: 96 },
    "4xl": { type: "fluid", min: 24, max: 96 },
    "5xl": { type: "fluid", min: 72, max: 120 },
    "6xl": { type: "fluid", min: 72, max: 160 },
  };
  const out = {};
  getPaddingOrderList().forEach((key) => {
    const current = input?.[key] && typeof input[key] === "object" ? input[key] : base[key];
    if (!current) return;
    if (current.type === "fixed" && typeof current.value === "number") {
      out[key] = { type: "fixed", value: current.value };
    } else {
      out[key] = {
        type: "fluid",
        min: Number(current.min ?? base[key]?.min ?? 0),
        max: Number(current.max ?? base[key]?.max ?? 0),
      };
    }
  });
  return out;
}

function parseScaleCssValue(raw) {
  const value = String(raw || "").trim();
  if (!value) return null;
  const fixedMatch = value.match(/^(\d+(?:\.\d+)?)px$/i);
  if (fixedMatch) return { type: "fixed", value: Number(fixedMatch[1]) };
  const clampMatch = value.match(/^clamp\(\s*(\d+(?:\.\d+)?)px\s*,[\s\S]*?,\s*(\d+(?:\.\d+)?)px\s*\)$/i);
  if (clampMatch) {
    const min = Number(clampMatch[1]);
    const max = Number(clampMatch[2]);
    if (Number.isFinite(min) && Number.isFinite(max)) return { type: "fluid", min, max };
  }
  const numMatch = value.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch) return { type: "fixed", value: Number(numMatch[1]) };
  return null;
}

function upsertScaleToken(collection, orderList, key, parsed) {
  if (!collection || !key || !parsed) return;
  if (parsed.type === "fixed") {
    collection[key] = { type: "fixed", value: Math.max(0, Number(parsed.value)) };
  } else {
    const min = Math.max(0, Number(parsed.min));
    const max = Math.max(min, Number(parsed.max));
    collection[key] = { type: "fluid", min, max };
  }
  if (Array.isArray(orderList) && !orderList.includes(key)) orderList.push(key);
}

function importSpaceScaleFromCss(cssText) {
  const text = String(cssText || "");
  const matcher = /--mft-space-([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  const nextSpaces = {};
  const nextCustomOrder = [];
  const seen = new Set();
  let match = matcher.exec(text);
  while (match) {
    const key = sanitizeSpaceKey(match[1]);
    const parsed = parseScaleCssValue(match[2]);
    if (key && parsed) {
      upsertScaleToken(nextSpaces, null, key, parsed);
      if (!spaceOrder.includes(key) && !seen.has(key)) nextCustomOrder.push(key);
      if (!seen.has(key)) seen.add(key);
    }
    match = matcher.exec(text);
  }
  if (!Object.keys(nextSpaces).length) return;
  state.spaces = nextSpaces;
  state.spaceCustomOrder = nextCustomOrder;
  state.spaceHidden = [];
}

function importPaddingScaleFromCss(cssText) {
  const text = String(cssText || "");
  const matcher = /--mft-padding-([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  const nextSpaces = {};
  const nextBaseOrder = [];
  const seen = new Set();
  let match = matcher.exec(text);
  while (match) {
    const key = sanitizePaddingKey(match[1]);
    const parsed = parseScaleCssValue(match[2]);
    if (key && parsed) {
      upsertScaleToken(nextSpaces, nextBaseOrder, key, parsed);
      if (!seen.has(key)) seen.add(key);
    }
    match = matcher.exec(text);
  }
  if (!nextBaseOrder.length) {
    state.paddingSpaces = {};
    state.paddingBaseOrder = [];
    state.paddingCustomOrder = [];
    state.paddingHidden = [];
    return;
  }
  state.paddingSpaces = nextSpaces;
  state.paddingBaseOrder = nextBaseOrder;
  state.paddingCustomOrder = [];
  state.paddingHidden = Array.isArray(state.paddingHidden) ? state.paddingHidden.filter((key) => Object.prototype.hasOwnProperty.call(nextSpaces, key)) : [];
}

function importSectionUseFromCss(cssText) {
  const text = String(cssText || "");
  const rules = [
    ["paddingTop", ".mft-space-section-t", "padding-top"],
    ["paddingBottom", ".mft-space-section-b", "padding-bottom"],
  ];
  const next = {};

  rules.forEach(([key, selector, prop]) => {
    const block = parseCssDeclarations(findCssBlockBySelector(text, selector));
    const raw = String(block[prop] || "").trim();
    if (raw) next[key] = normalizePaddingLikeTokenForDevice("desktop", raw);
  });

  if (!Object.keys(next).length) return;
  ["desktop", "tablet", "mobile"].forEach((device) => {
    state.sectionUseByDevice = {
      ...state.sectionUseByDevice,
      [device]: normalizeSectionUseConfig({ ...getSectionUseForDevice(device), ...next }),
    };
  });
}

function parseCssVarMap(cssText) {
  const map = {};
  const text = String(cssText || "");
  const matcher = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match = matcher.exec(text);
  while (match) {
    map[`--${match[1].toLowerCase()}`] = String(match[2] || "").trim();
    match = matcher.exec(text);
  }
  return map;
}

function extractCssSlice(cssText, startMarker, endMarker) {
  const source = String(cssText || "");
  const start = source.indexOf(startMarker);
  if (start < 0) return "";
  const end = endMarker ? source.indexOf(endMarker, start + startMarker.length) : -1;
  return source.slice(start, end > -1 ? end : undefined);
}

function findCssBlockBySelector(cssText, selector) {
  const text = String(cssText || "");
  const safeSelector = String(selector || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`${safeSelector}\\s*\\{([\\s\\S]*?)\\}`, "i");
  const match = text.match(regex);
  return match ? match[1] : "";
}

function parseClampFontSize(raw, width) {
  const text = String(raw || "").trim();
  if (!text) return null;
  const clampMatch = text.match(
    /^clamp\(\s*([0-9.]+)px\s*,\s*calc\(\s*([0-9.]+)px\s*\+\s*\(\s*([0-9.]+)\s*-\s*\2\s*\)\s*\*\s*\(\(\s*100vw\s*-\s*([0-9.]+)px\s*\)\s*\/\s*\(\s*([0-9.]+)\s*-\s*\4\s*\)\)\s*\)\s*,\s*([0-9.]+)px\s*\)$/i,
  );
  if (clampMatch) {
    const min = Number(clampMatch[1]);
    const base = Number(clampMatch[2]);
    const maxDelta = Number(clampMatch[3]);
    const from = Number(clampMatch[4]);
    const to = Number(clampMatch[5]);
    const max = Number(clampMatch[6]);
    if ([min, base, maxDelta, from, to, max].every(Number.isFinite)) {
      const interpolated = clampBetween(min, max, width, from, to);
      return Number(interpolated.toFixed(2));
    }
  }
  const pxMatch = text.match(/^([0-9.]+)px$/i);
  if (pxMatch) return Number(pxMatch[1]);
  const num = Number(text);
  return Number.isFinite(num) ? num : null;
}

function parseLineHeightValue(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  const pctMatch = text.match(/^([0-9.]+)%$/);
  if (pctMatch) {
    const value = Number(pctMatch[1]);
    return Number.isFinite(value) ? Number((value / 100).toFixed(3)) : null;
  }
  const num = Number(text);
  return Number.isFinite(num) ? Number(num.toFixed(3)) : null;
}

function parseLetterSpacingValue(raw) {
  const text = String(raw || "").trim();
  if (!text) return null;
  const emMatch = text.match(/^(-?[0-9.]+)em$/i);
  if (emMatch) return Number(emMatch[1]);
  const pxMatch = text.match(/^(-?[0-9.]+)px$/i);
  if (pxMatch) return Number(pxMatch[1]);
  const num = Number(text);
  return Number.isFinite(num) ? num : null;
}

const typographyVarKeyByStyle = {
  primaryHeading: "primary",
  secondaryHeading: "secondary",
  tertiaryHeading: "accent",
  subheading: "962030d",
  overline: "4d3a7db",
  menuLinkL: "3ed5403",
  menuLinkM: "5c843f5",
  menuLinkS: "c9a8330",
  paragraphL: "fcce242",
  paragraphM: "text",
  paragraphS: "013566d",
  paragraphXS: "8035a56",
  button: "6d2edf1",
  buttonS: "179695a",
};

function buildTypographyStylesFromKit(varMap) {
  const buildForWidth = (width) => {
    const styles = {};
    Object.entries(typographyVarKeyByStyle).forEach(([styleKey, base]) => {
      const sizeRaw = varMap[`--e-global-typography-${base}-font-size`];
      const weightRaw = varMap[`--e-global-typography-${base}-font-weight`];
      const lineRaw = varMap[`--e-global-typography-${base}-line-height`];
      const spaceRaw = varMap[`--e-global-typography-${base}-letter-spacing`];
      const size = parseClampFontSize(sizeRaw, width);
      const weight = Number(weightRaw);
      const line = parseLineHeightValue(lineRaw);
      const space = parseLetterSpacingValue(spaceRaw);
      styles[styleKey] = {
        size: Number.isFinite(size) ? size : 0,
        weight: Number.isFinite(weight) ? weight : 400,
        line: Number.isFinite(line) ? line : 1.1,
        space: Number.isFinite(space) ? space : 0,
      };
    });
    return styles;
  };

  return {
    desktop: buildForWidth(devices.desktop.tokenWidth || devices.desktop.width),
    tablet: buildForWidth(devices.tablet.tokenWidth || devices.tablet.width),
    mobile: buildForWidth(devices.mobile.tokenWidth || devices.mobile.width),
  };
}

function normalizeSpaceFieldValue(value, device = "desktop") {
  const raw = String(value || "").trim();
  if (!raw) return raw;
  const normalized = normalizeSpaceLikeTokenForDevice(device, raw);
  const match = normalized.match(/^var\(--mft-space-([^)]+)\)$/);
  return match ? match[1] : normalized;
}

function extractSpaceValueFromClass(selector, property) {
  try {
    // Create a temporary element and apply the selector style
    const temp = document.createElement("div");
    temp.className = selector.replace(/^\./, "");
    document.body.appendChild(temp);

    const computed = window.getComputedStyle(temp);
    const value = computed[property];

    document.body.removeChild(temp);

    if (value) {
      // Extract variable name from computed padding value
      // The computed value might be the actual pixel value, so we need to match it to our spacing scale
      const match = value.match(/var\(--([^)]+)\)/);
      if (match) {
        const varName = match[1].replace(/^mft-space-/, "");
        return varName;
      }

      // If it's a direct pixel value, try to match it to our spacing scale
      const pxValue = parseFloat(value);
      if (!Number.isNaN(pxValue)) {
        // Map common spacing values to their aliases
        const spacingMap = {
          4: "5xs",
          8: "4xs",
          12: "3xs",
          16: "2xs",
          24: "xs",
          32: "s",
          40: "m",
          48: "l",
          56: "xl",
          64: "2xl",
          80: "3xl",
          96: "4xl",
          160: "5xl"
        };
        return spacingMap[pxValue] || null;
      }
    }
  } catch (e) {
    console.log(`Error extracting space value for ${selector}:`, e);
  }
  return null;
}

function buildSectionUseFromKit(cssText) {
  const rootChunk = extractCssSlice(cssText, ".elementor-kit-", "@media(max-width: 1024px)") || cssText;
  const rootVars = parseCssVarMap(rootChunk);
  const desktopChunk = extractCssSlice(cssText, "@media(max-width: 1024px)", "@media(max-width: 767px)");
  const mobileChunk = extractCssSlice(cssText, "@media(max-width: 767px)", "/* Start custom CSS */");
  const tabletVars = parseCssVarMap(desktopChunk);
  const mobileVars = parseCssVarMap(mobileChunk);
  const read = (varMap, name, fallback, device = "desktop") => normalizeSpaceFieldValue(varMap[`--${name}`] || fallback, device);

  const containerTop = extractSpaceValueFromClass(".mft-space-section-t", "paddingTop") || "4xl";
  const containerBottom = extractSpaceValueFromClass(".mft-space-section-b", "paddingBottom") || "4xl";

  const base = {
    paddingTop: read(rootVars, "container-default-padding-top", "0", "desktop"),
    paddingBottom: read(rootVars, "container-default-padding-bottom", "0", "desktop"),
    paddingLeft: read(rootVars, "container-default-padding-left", "0", "desktop"),
    paddingRight: read(rootVars, "container-default-padding-right", "0", "desktop"),
    gap: read(rootVars, "widgets-spacing-row", rootVars["--widgets-spacing-row"] || "0", "desktop"),
    containerTop: containerTop,
    containerBottom: containerBottom,
    containerLeft: read(rootVars, "container-default-padding-left", "s", "desktop"),
    containerRight: read(rootVars, "container-default-padding-right", "s", "desktop"),
  };
  const tablet = {
    ...base,
    paddingTop: read(tabletVars, "container-default-padding-top", base.paddingTop, "tablet"),
    paddingBottom: read(tabletVars, "container-default-padding-bottom", base.paddingBottom, "tablet"),
    paddingLeft: read(tabletVars, "container-default-padding-left", base.paddingLeft, "tablet"),
    paddingRight: read(tabletVars, "container-default-padding-right", base.paddingRight, "tablet"),
    gap: read(tabletVars, "widgets-spacing-row", base.gap, "tablet"),
  };
  const mobile = {
    ...base,
    paddingTop: read(mobileVars, "container-default-padding-top", base.paddingTop, "mobile"),
    paddingBottom: read(mobileVars, "container-default-padding-bottom", base.paddingBottom, "mobile"),
    paddingLeft: read(mobileVars, "container-default-padding-left", base.paddingLeft, "mobile"),
    paddingRight: read(mobileVars, "container-default-padding-right", base.paddingRight, "mobile"),
    gap: read(mobileVars, "widgets-spacing-row", base.gap, "mobile"),
  };
  return { desktop: base, tablet, mobile };
}

function applyKitDerivedButtonDefaults() {
  ensureTypographyByDevice();
  const buttonPreset = resolveButtonTypographyPreset("button");
  const light = "var(--e-global-color-47eea86e)";
  const primary = "var(--e-global-color-primary)";
  const text = "var(--e-global-color-text)";
  const header = "var(--e-global-color-bd9d5b8)";
  const primaryDark = "var(--e-global-color-13f4851a)";

  state.btn.btn1 = {
    label: "Base global",
    typographyPreset: buttonPreset.preset,
    fontFamily: buttonPreset.fontFamily,
    fontSize: buttonPreset.fontSize,
    fontWeight: buttonPreset.fontWeight,
    color: light,
    bg: header,
    border: `2px solid ${header}`,
    radius: "4px",
    padY: "var(--mft-space-2xs)",
    padX: "var(--mft-space-xs)",
    hoverBg: primary,
    hoverColor: light,
    hoverRadius: "4px",
  };
  state.btn.btn2 = {
    label: "CTA sólido",
    typographyPreset: buttonPreset.preset,
    fontFamily: buttonPreset.fontFamily,
    fontSize: buttonPreset.fontSize,
    fontWeight: buttonPreset.fontWeight,
    color: light,
    bg: primary,
    border: `2px solid ${primary}`,
    radius: "4px",
    padY: "var(--mft-space-2xs)",
    padX: "var(--mft-space-xs)",
    hoverBg: primaryDark,
    hoverColor: light,
    hoverRadius: "4px",
  };
  state.btn.btn3 = {
    label: "CTA destacado",
    typographyPreset: buttonPreset.preset,
    fontFamily: buttonPreset.fontFamily,
    fontSize: buttonPreset.fontSize,
    fontWeight: buttonPreset.fontWeight,
    color: primary,
    bg: "transparent",
    border: `2px solid ${primary}`,
    radius: "4px",
    padY: "var(--mft-space-2xs)",
    padX: "var(--mft-space-xs)",
    hoverBg: primary,
    hoverColor: light,
    hoverRadius: "4px",
  };
  state.btn.btn4 = {
    label: "CTA claro",
    typographyPreset: buttonPreset.preset,
    fontFamily: buttonPreset.fontFamily,
    fontSize: buttonPreset.fontSize,
    fontWeight: buttonPreset.fontWeight,
    color: primary,
    bg: "transparent",
    border: "none",
    radius: "0px",
    padY: "0px",
    padX: "0px",
    hoverBg: "transparent",
    hoverColor: primaryDark,
    hoverRadius: "0px",
  };
  state.btn.btn5 = {
    label: "Outline",
    typographyPreset: buttonPreset.preset,
    fontFamily: buttonPreset.fontFamily,
    fontSize: buttonPreset.fontSize,
    fontWeight: buttonPreset.fontWeight,
    color: text,
    bg: "transparent",
    border: `2px solid ${text}`,
    radius: "4px",
    padY: "var(--mft-space-2xs)",
    padX: "var(--mft-space-xs)",
    hoverColor: light,
    hoverBg: text,
    hoverRadius: "4px",
  };
  if (!Array.isArray(state.btn.customButtons)) state.btn.customButtons = [];
  if (!Array.isArray(state.btn.hiddenButtons)) state.btn.hiddenButtons = [];
  if (!Array.isArray(state.spaceCustomOrder)) state.spaceCustomOrder = [];
  if (!Array.isArray(state.spaceHidden)) state.spaceHidden = [];
  if (!Array.isArray(state.paddingCustomOrder)) state.paddingCustomOrder = [];
  if (!Array.isArray(state.paddingHidden)) state.paddingHidden = [];
}

function applyKitCssText(cssText) {
  // Reset kit-derived values so we don't keep leftovers from previous kits.
  if (factoryDefaultStateSnapshot) {
    state.palette = cloneData(factoryDefaultStateSnapshot.palette);
    state.paletteLabels = cloneData(factoryDefaultStateSnapshot.paletteLabels);
    state.extraColors = [];
    state.kitPaletteKeysPresent = [];
    state.typographyClamp = cloneData(factoryDefaultStateSnapshot.typographyClamp);
    state.typographyByDevice = cloneData(factoryDefaultStateSnapshot.typographyByDevice);
    state.sectionUseByDevice = cloneData(factoryDefaultStateSnapshot.sectionUseByDevice);
    state.imageByDevice = cloneData(factoryDefaultStateSnapshot.imageByDevice);
    state.btn = cloneData(factoryDefaultStateSnapshot.btn);
  }

  const rootChunk = extractCssSlice(cssText, ".elementor-kit-", "@media(max-width: 1024px)") || cssText;
  const vars = parseCssVarMap(rootChunk);
  const mainColorIds = new Set([
    "--e-global-color-primary",
    "--e-global-color-secondary",
    "--e-global-color-accent",
    "--e-global-color-text",
    "--e-global-color-13f4851a",
    "--e-global-color-47eea86e",
    "--e-global-color-bd9d5b8",
  ]);
  const colorMap = {
    primary: "--e-global-color-primary",
    secondary: "--e-global-color-secondary",
    accent: "--e-global-color-accent",
    text: "--e-global-color-text",
    primaryDark: "--e-global-color-13f4851a",
    primaryLight: "--e-global-color-6cb047a",
    light: "--e-global-color-47eea86e",
    dark: "--e-global-color-bd9d5b8",
  };
  const presentPaletteKeys = [];
  Object.entries(colorMap).forEach(([key, varName]) => {
    const value = clampHex(vars[varName]);
    if (value) {
      state.palette[key] = value;
      presentPaletteKeys.push(key);
    }
  });
  state.kitPaletteKeysPresent = presentPaletteKeys;

  const discoveredExtraColors = Object.entries(vars)
    .filter(([name, value]) => /^--e-global-color-/i.test(name) && clampHex(value))
    .filter(([name]) => !mainColorIds.has(String(name).toLowerCase()))
    .map(([name, value]) => {
      const id = String(name).trim();
      const lowerId = id.toLowerCase();
      const base = defaultExtraColorMap.get(lowerId);
      return {
        id,
        label: String(base?.label || buildExtraColorLabel(id)).trim(),
        value: clampHex(value),
      };
    });
  state.extraColors = discoveredExtraColors
    .map((item) => ({
      ...item,
      label: buildExtraColorLabel(item.id, item.value),
    }))
    .sort((a, b) => String(a.id || "").localeCompare(String(b.id || ""), "en", { sensitivity: "base" }));

  const families = {
    heading: vars["--e-global-typography-primary-font-family"] || state.typographyByDevice.desktop.families.heading,
    links: vars["--e-global-typography-013566d-font-family"] || vars["--e-global-typography-6d2edf1-font-family"] || state.typographyByDevice.desktop.families.links,
    body: vars["--e-global-typography-text-font-family"] || vars["--e-global-typography-013566d-font-family"] || state.typographyByDevice.desktop.families.body,
    ui: vars["--e-global-typography-6d2edf1-font-family"] || vars["--e-global-typography-179695a-font-family"] || state.typographyByDevice.desktop.families.ui,
  };
  const styles = buildTypographyStylesFromKit(vars);
  const typographyClampMatch = String(cssText || "").match(/100vw\s*-\s*([0-9.]+)px[\s\S]*?\/\s*\(([0-9.]+)\s*-\s*\1\)/i);
  if (typographyClampMatch) {
    state.typographyClamp = {
      from: Number(typographyClampMatch[1]),
      to: Number(typographyClampMatch[2]),
    };
  }
  ["desktop", "tablet", "mobile"].forEach((device) => {
    state.typographyByDevice[device].families = { ...families };
    state.typographyByDevice[device].styles = styles[device];
  });

  state.sectionUseByDevice = buildSectionUseFromKit(cssText);
  applyKitDerivedButtonDefaults();
  applyThemeVariables();
  renderAll();
  saveToLocalStorage();
}

applyKitDerivedButtonDefaults();
const factoryDefaultStateSnapshot = cloneData(state);

function restoreDefaultState() {
  const snapshot = factoryDefaultStateSnapshot || cloneData(state);
  state.device = snapshot.device;
  state.palette = cloneData(snapshot.palette);
  state.paletteLabels = cloneData(snapshot.paletteLabels);
  state.extraColors = cloneData(snapshot.extraColors);
  state.kitPaletteKeysPresent = cloneData(snapshot.kitPaletteKeysPresent);
  state.spaceClamp = cloneData(snapshot.spaceClamp);
  state.spaces = cloneData(snapshot.spaces);
  state.typographyClamp = cloneData(snapshot.typographyClamp);
  state.imageByDevice = cloneData(snapshot.imageByDevice);
  state.btn = cloneData(snapshot.btn);
  state.sectionUseByDevice = cloneData(snapshot.sectionUseByDevice);
  state.typographyByDevice = cloneData(snapshot.typographyByDevice);
  applyThemeVariables();
  renderAll();
  saveToLocalStorage();
}

function formatImageRadiusTriplet() {
  ensureImageByDevice();
  const desktop = resolveSpaceLikeForDevice("desktop", state.imageByDevice.desktop.radius).px;
  const tablet = resolveSpaceLikeForDevice("tablet", state.imageByDevice.tablet.radius).px;
  const mobile = resolveSpaceLikeForDevice("mobile", state.imageByDevice.mobile.radius).px;
  return `${Math.round(desktop)}/${Math.round(tablet)}/${Math.round(mobile)}`;
}

function formatImageRadiusDisplay(device, value) {
  const resolved = resolveSpaceLikeForDevice(device, value);
  if (String(resolved.raw || "").trim().toLowerCase() === "none") return `None`;
  if (Number.isFinite(resolved.px)) return `${Math.round(resolved.px)}px`;
  return `${resolved.raw || ""}`.trim();
}

function normalizePx(input, fallbackPx) {
  const raw = String(input ?? "").trim();
  if (!raw) return fallbackPx;
  const pxMatch = raw.match(/^(\d+(?:\.\d+)?)px$/i);
  if (pxMatch) return `${Number(pxMatch[1])}px`;
  const num = Number(raw);
  if (!Number.isNaN(num) && Number.isFinite(num)) return `${num}px`;
  return fallbackPx;
}

function ensureSectionUseByDevice() {
  // Ensure shape exists for all devices.
  const base = normalizeSectionUseConfig({});

  ["desktop", "tablet", "mobile"].forEach((device) => {
    if (!state.sectionUseByDevice[device] || typeof state.sectionUseByDevice[device] !== "object") {
      state.sectionUseByDevice[device] = { ...base };
    } else {
      state.sectionUseByDevice[device] = normalizeSectionUseConfig({ ...base, ...state.sectionUseByDevice[device] });
    }
  });

  // Defensive: if any device entries somehow share the same object reference,
  // clone them so edits are guaranteed to be device-specific.
  const seen = new Set();
  ["desktop", "tablet", "mobile"].forEach((device) => {
    const ref = state.sectionUseByDevice[device];
    if (seen.has(ref)) state.sectionUseByDevice[device] = { ...ref };
    seen.add(state.sectionUseByDevice[device]);
  });
}

function getSectionUseForDevice(device) {
  ensureSectionUseByDevice();
  return state.sectionUseByDevice[device];
}

function setSectionUseForDevice(device, key, value) {
  ensureSectionUseByDevice();
  const normalized =
    key === "paddingTop" || key === "paddingBottom"
      ? normalizePaddingLikeTokenForDevice(device, value)
      : normalizeSpaceLikeTokenForDevice(device, value);
  state.sectionUseByDevice = {
    ...state.sectionUseByDevice,
    [device]: {
      ...state.sectionUseByDevice[device],
      [key]: key === "paddingTop" || key === "paddingBottom" ? normalized : normalized.replace(/^var\(--mft-space-([^)]+)\)$/, "$1"),
    },
  };
}

function ensureImageByDevice() {
  const base = normalizeImageConfig({});
  if (!state.imageByDevice || typeof state.imageByDevice !== "object") state.imageByDevice = {};

  ["desktop", "tablet", "mobile"].forEach((device) => {
    if (!state.imageByDevice[device] || typeof state.imageByDevice[device] !== "object") {
      state.imageByDevice[device] = { ...base };
    } else {
      state.imageByDevice[device] = normalizeImageConfig({ ...base, ...state.imageByDevice[device] });
    }
  });

  // Defensive: avoid shared references across devices.
  const seen = new Set();
  ["desktop", "tablet", "mobile"].forEach((device) => {
    const ref = state.imageByDevice[device];
    if (seen.has(ref)) state.imageByDevice[device] = { ...ref };
    seen.add(state.imageByDevice[device]);
  });
}

function getImageForDevice(device) {
  ensureImageByDevice();
  return state.imageByDevice[device];
}

function setImageForDevice(device, key, value) {
  ensureImageByDevice();
  const nextValue = key === "radius" ? normalizeSpaceLikeToken(value) : value;
  state.imageByDevice = {
    ...state.imageByDevice,
    [device]: {
      ...state.imageByDevice[device],
      [key]: key === "radius" ? nextValue : normalizePx(nextValue, "500px"),
    },
  };
}

function ensureTypographyByDevice() {
  const cloneStyles = (styles) => {
    const out = {};
    Object.keys(styles || {}).forEach((k) => {
      const v = styles[k];
      out[k] = v && typeof v === "object" ? { ...v } : v;
    });
    return out;
  };

  const cloneLabels = (labels) => ({ ...(labels || {}) });

  const base = {
    families: {
      heading: "\"The Seasons\", serif",
      links: "\"Lato\", sans-serif",
      body: "\"Lato\", sans-serif",
      ui: "Inter, system-ui, sans-serif",
    },
    labels: { ...defaultTypographyLabels },
    styles: {
      primaryHeading: { size: 96, weight: 400, line: 1.1, space: 0 }, // 110%
      secondaryHeading: { size: 72, weight: 400, line: 1.1, space: 0 },
      tertiaryHeading: { size: 56, weight: 300, line: 1.1, space: 0 },
      subheading: { size: 40, weight: 300, line: 1.5, space: 0 }, // 150%
      overline: { size: 32, weight: 300, line: 1.1, space: 0 },
      menuLinkL: { size: 56, weight: 400, line: 1.1, space: 0 },
      menuLinkM: { size: 18, weight: 500, line: 1.1, space: 0 }, // 110%
      menuLinkS: { size: 14, weight: 500, line: 1.1, space: 0 }, // 110%
      paragraphL: { size: 22, weight: 400, line: 1.5, space: 0 },
      paragraphM: { size: 18, weight: 400, line: 1.5, space: 0 },
      paragraphS: { size: 16, weight: 400, line: 1.5, space: 0 },
      paragraphXS: { size: 14, weight: 400, line: 1.5, space: 0 },
      button: { size: 18, weight: 600, line: 1.1, space: 0 }, // 110%
      buttonS: { size: 14, weight: 600, line: 1.1, space: 0 }, // 110%
      uiMain: { size: 14, weight: 500, line: 1.35, space: 0.02 },
      uiSub: { size: 12, weight: 500, line: 1.35, space: 0.02 },
      uiTiny: { size: 11, weight: 600, line: 1.2, space: 0.08 },
    },
  };

  if (!state.typographyByDevice || typeof state.typographyByDevice !== "object") state.typographyByDevice = {};

  ["desktop", "tablet", "mobile"].forEach((device) => {
    const current = state.typographyByDevice[device];
    if (!current || typeof current !== "object") {
      state.typographyByDevice[device] = { families: { ...base.families }, labels: cloneLabels(base.labels), styles: cloneStyles(base.styles) };
      return;
    }
    const families = current.families && typeof current.families === "object" ? { ...base.families, ...current.families } : { ...base.families };
    Object.keys(families).forEach((key) => {
      families[key] = normalizeFontFamily(families[key]);
    });
    const labels = current.labels && typeof current.labels === "object" ? { ...base.labels, ...current.labels } : { ...base.labels };
    const merged = current.styles && typeof current.styles === "object" ? { ...base.styles, ...current.styles } : { ...base.styles };
    const styles = cloneStyles(merged);
    state.typographyByDevice[device] = { families, labels, styles };
  });

  // Defensive: ensure no shared references across devices or across style keys.
  ["desktop", "tablet", "mobile"].forEach((device) => {
    const ref = state.typographyByDevice[device];
    if (!ref) return;
    state.typographyByDevice[device] = { families: { ...ref.families }, labels: cloneLabels(ref.labels), styles: cloneStyles(ref.styles) };
  });
}

function getTypographyForDevice(device) {
  ensureTypographyByDevice();
  return state.typographyByDevice[device];
}

function getTypographyStyleLabel(device, styleKey) {
  const t = getTypographyForDevice(device);
  return String(t?.labels?.[styleKey] || defaultTypographyLabels[styleKey] || styleKey);
}

function migrateTypographyKitLineHeights() {
  // If a user has older saved state from before we aligned line-heights to the kit,
  // gently patch only the known wrong defaults (1.0 -> kit values).
  ensureTypographyByDevice();
  const fixes = [
    { device: "desktop", key: "menuLinkM", line: 1.1 },
    { device: "desktop", key: "menuLinkS", line: 1.1 },
    { device: "desktop", key: "button", line: 1.1 },
    { device: "desktop", key: "buttonS", line: 1.1 },
    { device: "mobile", key: "menuLinkM", line: 1.1 },
    { device: "mobile", key: "menuLinkS", line: 1.1 },
    { device: "mobile", key: "button", line: 1.1 },
    { device: "mobile", key: "buttonS", line: 1.1 },
  ];

  let changed = false;
  fixes.forEach(({ device, key, line }) => {
    const t = state.typographyByDevice?.[device];
    const s = t?.styles?.[key];
    if (!s) return;
    if (Number(s.line) !== 1.0) return;
    s.line = line;
    changed = true;
  });

  if (changed) saveToLocalStorage();
}

function applyThemeVariables() {
  const root = document.documentElement;
  root.style.setProperty("--e-global-color-primary", state.palette.primary);
  root.style.setProperty("--e-global-color-secondary", state.palette.secondary);
  root.style.setProperty("--e-global-color-accent", state.palette.accent);
  root.style.setProperty("--e-global-color-text", state.palette.text);
  root.style.setProperty("--e-global-color-47eea86e", state.palette.light);
  root.style.setProperty("--e-global-color-bd9d5b8", state.palette.dark);
  root.style.setProperty("--e-global-color-13f4851a", state.palette.primaryDark);
  root.style.setProperty("--e-global-color-primary-dark", state.palette.primaryDark);
  root.style.setProperty("--e-global-color-primary-light", state.palette.primaryLight);
  root.style.setProperty("--e-global-color-21f8c9b7", state.palette.text);
  root.style.setProperty("--mirai-wp-primary", state.palette.primary);
  root.style.setProperty("--mirai-wp-secondary", state.palette.secondary);
  root.style.setProperty("--mirai-ui-content", state.palette.text);
  root.style.setProperty("--mirai-wp-primary-dark", state.palette.primaryDark);
  root.style.setProperty("--mirai-wp-primary-light", state.palette.primaryLight);
  root.style.setProperty("--mirai-ui-button-background", state.btn.btn1.bg);
  root.style.setProperty("--mirai-ui-button-background-active", state.btn.btn1.hoverBg || state.palette.primary);
  root.style.setProperty("--mirai-ui-button-color", state.btn.btn1.color);
  root.style.setProperty("--mirai-ui-button-color-active", state.btn.btn1.hoverColor || state.btn.btn1.color);
  root.style.setProperty("--mirai-ui-button-font-family", state.btn.btn1.fontFamily || state.typographyByDevice?.[state.device]?.families?.body || state.typographyByDevice?.desktop?.families?.body || "sans-serif");
  root.style.setProperty("--mirai-ui-button-font-size", state.btn.btn1.fontSize || `${state.typographyByDevice?.[state.device]?.styles?.button?.size || 18}px`);
  root.style.setProperty("--mirai-ui-button-font-weight", state.btn.btn1.fontWeight || String(state.typographyByDevice?.[state.device]?.styles?.button?.weight || 600));
  root.style.setProperty("--mirai-ui-button-radius", state.btn.btn1.radius);
  root.style.setProperty("--mirai-ui-button-radius-active", state.btn.btn1.hoverRadius || state.btn.btn1.radius);
  root.style.setProperty("--mirai-ui-button-pad-y", state.btn.btn1.padY);
  root.style.setProperty("--mirai-ui-button-pad-x", state.btn.btn1.padX);

  function applyButtonThemeVars(btnKey, cfg) {
    const index = getButtonIndex(btnKey);
    if (!Number.isFinite(index)) return;
    const className = `mft-btn-${index}`;
    const preset = resolveButtonTypographyPreset(cfg.typographyPreset || "button");
    root.style.setProperty(`--${className}-color`, cfg.color);
    root.style.setProperty(`--${className}-font-family`, cfg.fontFamily || state.typographyByDevice?.[state.device]?.families?.body || state.typographyByDevice?.desktop?.families?.body || preset.fontFamily || "sans-serif");
    root.style.setProperty(`--${className}-font-size`, cfg.fontSize || preset.fontSize || `${state.typographyByDevice?.[state.device]?.styles?.button?.size || 18}px`);
    root.style.setProperty(`--${className}-font-weight`, cfg.fontWeight || preset.fontWeight || String(state.typographyByDevice?.[state.device]?.styles?.button?.weight || 600));
    root.style.setProperty(`--${className}-bg`, cfg.bg);
    root.style.setProperty(`--${className}-border`, cfg.border);
    root.style.setProperty(`--${className}-radius`, cfg.radius);
    root.style.setProperty(`--${className}-pad-y`, cfg.padY);
    root.style.setProperty(`--${className}-pad-x`, cfg.padX);
    root.style.setProperty(`--${className}-hover-bg`, cfg.hoverBg);
    root.style.setProperty(`--${className}-hover-color`, cfg.hoverColor || cfg.color);
    root.style.setProperty(`--${className}-hover-border`, cfg.hoverBorder || cfg.border);
    root.style.setProperty(`--${className}-hover-radius`, cfg.hoverRadius || cfg.radius);
  }

  // Typography vars (Elementor kit naming) for the active device.
  try {
    const t = getTypographyForDevice(state.device);
    Object.keys(typographyVarKeyByStyle).forEach((styleKey) => {
      const vars = getTypographyVarNames(styleKey);
      const s = t?.styles?.[styleKey];
      if (!vars || !s) return;
      root.style.setProperty(vars.size, `${s.size}px`);
      root.style.setProperty(vars.weight, String(s.weight));
      root.style.setProperty(vars.line, formatLineHeightPct(s.line));
    });
  } catch { }

  // Apply extra kit color tokens so the canvas matches Elementor variables.
  if (Array.isArray(state.extraColors)) {
    state.extraColors.forEach((c) => {
      const id = String(c?.id || "").trim().toLowerCase();
      const value = clampHex(c?.value);
      if (!id.startsWith("--")) return;
      if (!value) return;
      root.style.setProperty(id, value);
    });
  }

  getSpaceOrderList().forEach((key) => {
    root.style.setProperty(`--mft-space-${key}`, `${getCurrentSpaceValue(key)}px`);
  });
  getPaddingOrderList().forEach((key) => {
    root.style.setProperty(`--mft-padding-${key}`, `${getPaddingCurrentValue(key)}px`);
  });

  root.style.setProperty("--mft-btn-arrow-gap", state.btn.arrowGap);
  root.style.setProperty("--mft-btn-arrow-content", state.btn.arrowContent);

  root.style.setProperty("--mft-btn-2-color", state.btn.btn2.color);
  root.style.setProperty("--mft-btn-2-font-family", state.btn.btn2.fontFamily || state.typographyByDevice?.[state.device]?.families?.body || state.typographyByDevice?.desktop?.families?.body || "sans-serif");
  root.style.setProperty("--mft-btn-2-font-size", state.btn.btn2.fontSize || `${state.typographyByDevice?.[state.device]?.styles?.button?.size || 18}px`);
  root.style.setProperty("--mft-btn-2-font-weight", state.btn.btn2.fontWeight || String(state.typographyByDevice?.[state.device]?.styles?.button?.weight || 600));
  root.style.setProperty("--mft-btn-2-bg", state.btn.btn2.bg);
  root.style.setProperty("--mft-btn-2-border", state.btn.btn2.border);
  root.style.setProperty("--mft-btn-2-radius", state.btn.btn2.radius);
  root.style.setProperty("--mft-btn-2-pad-y", state.btn.btn2.padY);
  root.style.setProperty("--mft-btn-2-pad-x", state.btn.btn2.padX);
  root.style.setProperty("--mft-btn-2-hover-bg", state.btn.btn2.hoverBg);
  root.style.setProperty("--mft-btn-2-hover-color", state.btn.btn2.hoverColor || state.btn.btn2.color);
  root.style.setProperty("--mft-btn-2-hover-border", state.btn.btn2.hoverBorder || state.btn.btn2.border);

  root.style.setProperty("--mft-btn-3-color", state.btn.btn3.color);
  root.style.setProperty("--mft-btn-3-font-family", state.btn.btn3.fontFamily || state.typographyByDevice?.[state.device]?.families?.body || state.typographyByDevice?.desktop?.families?.body || "sans-serif");
  root.style.setProperty("--mft-btn-3-font-size", state.btn.btn3.fontSize || `${state.typographyByDevice?.[state.device]?.styles?.button?.size || 18}px`);
  root.style.setProperty("--mft-btn-3-font-weight", state.btn.btn3.fontWeight || String(state.typographyByDevice?.[state.device]?.styles?.button?.weight || 600));
  root.style.setProperty("--mft-btn-3-bg", state.btn.btn3.bg);
  root.style.setProperty("--mft-btn-3-border", state.btn.btn3.border);
  root.style.setProperty("--mft-btn-3-radius", state.btn.btn3.radius);
  root.style.setProperty("--mft-btn-3-pad-y", state.btn.btn3.padY);
  root.style.setProperty("--mft-btn-3-pad-x", state.btn.btn3.padX);
  root.style.setProperty("--mft-btn-3-hover-bg", state.btn.btn3.hoverBg);
  root.style.setProperty("--mft-btn-3-hover-color", state.btn.btn3.hoverColor || state.btn.btn3.color);
  root.style.setProperty("--mft-btn-3-hover-border", state.btn.btn3.hoverBorder || state.btn.btn3.border);

  root.style.setProperty("--mft-btn-4-color", state.btn.btn4.color);
  root.style.setProperty("--mft-btn-4-font-family", state.btn.btn4.fontFamily || state.typographyByDevice?.[state.device]?.families?.body || state.typographyByDevice?.desktop?.families?.body || "sans-serif");
  root.style.setProperty("--mft-btn-4-font-size", state.btn.btn4.fontSize || `${state.typographyByDevice?.[state.device]?.styles?.button?.size || 18}px`);
  root.style.setProperty("--mft-btn-4-font-weight", state.btn.btn4.fontWeight || String(state.typographyByDevice?.[state.device]?.styles?.button?.weight || 600));
  root.style.setProperty("--mft-btn-4-bg", state.btn.btn4.bg);
  root.style.setProperty("--mft-btn-4-border", state.btn.btn4.border);
  root.style.setProperty("--mft-btn-4-radius", state.btn.btn4.radius);
  root.style.setProperty("--mft-btn-4-pad-y", state.btn.btn4.padY);
  root.style.setProperty("--mft-btn-4-pad-x", state.btn.btn4.padX);
  root.style.setProperty("--mft-btn-4-hover-bg", state.btn.btn4.hoverBg);
  root.style.setProperty("--mft-btn-4-hover-color", state.btn.btn4.hoverColor || state.btn.btn4.color);
  root.style.setProperty("--mft-btn-4-hover-border", state.btn.btn4.hoverBorder || state.btn.btn4.border);

  root.style.setProperty("--mft-btn-5-color", state.btn.btn5.color);
  root.style.setProperty("--mft-btn-5-font-family", state.btn.btn5.fontFamily || state.typographyByDevice?.[state.device]?.families?.body || state.typographyByDevice?.desktop?.families?.body || "sans-serif");
  root.style.setProperty("--mft-btn-5-font-size", state.btn.btn5.fontSize || `${state.typographyByDevice?.[state.device]?.styles?.button?.size || 18}px`);
  root.style.setProperty("--mft-btn-5-font-weight", state.btn.btn5.fontWeight || String(state.typographyByDevice?.[state.device]?.styles?.button?.weight || 600));
  root.style.setProperty("--mft-btn-5-bg", state.btn.btn5.bg);
  root.style.setProperty("--mft-btn-5-border", state.btn.btn5.border);
  root.style.setProperty("--mft-btn-5-radius", state.btn.btn5.radius);
  root.style.setProperty("--mft-btn-5-pad-y", state.btn.btn5.padY);
  root.style.setProperty("--mft-btn-5-pad-x", state.btn.btn5.padX);
  root.style.setProperty("--mft-btn-5-hover-color", state.btn.btn5.hoverColor);
  root.style.setProperty("--mft-btn-5-hover-bg", state.btn.btn5.hoverBg);
  root.style.setProperty("--mft-btn-5-hover-border", state.btn.btn5.hoverBorder || state.btn.btn5.border);

  const customButtons = ensureCustomButtonOrder();
  customButtons.forEach((btnKey) => {
    const cfg = state.btn[btnKey];
    if (!cfg || typeof cfg !== "object") return;
    applyButtonThemeVars(btnKey, cfg);
  });

  const dynamicButtonStyles = document.getElementById("dynamicButtonStyles");
  if (dynamicButtonStyles) {
    dynamicButtonStyles.textContent = customButtons
      .map((btnKey) => {
        const cfg = state.btn[btnKey];
        const className = `mft-btn-${getButtonIndex(btnKey)}`;
        return cfg && typeof cfg === "object" ? buildButtonCssSnippet(className, cfg) : "";
      })
      .filter(Boolean)
      .join("\n\n");
  }
}

function renderStaticUI() {
  el.previewCanvas.innerHTML = `
          <div class="preview-columns">
            <div class="preview-column">
              <details class="reference-card rounded-2xl" data-collapsible="palette" open>
                <summary class="flex cursor-pointer items-start justify-between gap-4 px-4 py-4">
                  <div class="min-w-0">
                    <p class="section-kicker kicker-color"><span class="section-kicker-dot"></span>Sistema de color</p>
                    <h3 class="mt-2 text-lg font-semibold text-slate-950">Paleta</h3>
                  </div>
                  <span class="mft-collapsible-chevron mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
                      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z" clip-rule="evenodd" />
                    </svg>
                  </span>
                </summary>
                <div class="px-4 pb-4">
                  <div class="mt-1" id="colorSwatches"></div>
                </div>
              </details>

              <details class="reference-card rounded-2xl" data-collapsible="spacing-scale" open>
                <summary class="flex cursor-pointer items-start justify-between gap-4 px-4 py-4">
                  <div class="min-w-0 flex-1">
                    <p class="section-kicker kicker-space"><span class="section-kicker-dot"></span>Sistema de espacios</p>
                    <div class="mt-2 flex items-center justify-between gap-4">
                      <h3 class="text-lg font-semibold text-slate-950">Escala de espacios</h3>
                      <div class="flex items-center gap-2">
                        <span id="spaceModeLabel" class="hidden rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600"></span>
                      </div>
                    </div>
                  </div>
                  <span class="mft-collapsible-chevron mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
                      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z" clip-rule="evenodd" />
                    </svg>
                  </span>
                </summary>
                <div class="px-4 pb-4">
                  <div id="spaceScale" class="mt-1 space-y-2"></div>
                </div>
              </details>

              <details class="reference-card rounded-2xl" data-collapsible="padding-scale" open>
                <summary class="flex cursor-pointer items-start justify-between gap-4 px-4 py-4">
                  <div class="min-w-0 flex-1">
                    <p class="section-kicker kicker-padding"><span class="section-kicker-dot"></span>Escala auxiliar</p>
                    <div class="mt-2 flex items-center justify-between gap-4">
                      <h3 class="text-lg font-semibold text-slate-950">Escala de paddings</h3>
                      <div class="flex items-center gap-2">
                        <button type="button" data-padding-import class="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white hover:bg-slate-800">Pegar lista</button>
                        <span id="paddingModeLabel" class="hidden rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600"></span>
                      </div>
                    </div>
                  </div>
                  <span class="mft-collapsible-chevron mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
                      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z" clip-rule="evenodd" />
                    </svg>
                  </span>
                </summary>
                <div class="px-4 pb-4">
                  <div id="paddingScale" class="mt-1 space-y-2"></div>
                </div>
              </details>

              <details class="reference-card rounded-2xl" data-collapsible="typography" open>
                <summary class="flex cursor-pointer items-start justify-between gap-4 px-4 py-4">
                  <div class="min-w-0 flex-1">
                    <p class="section-kicker kicker-type"><span class="section-kicker-dot"></span>Tipografía</p>
                    <h3 class="mt-2 text-lg font-semibold text-slate-950">Sistema tipográfico</h3>
                  </div>
                  <span class="mft-collapsible-chevron mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
                      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z" clip-rule="evenodd" />
                    </svg>
                  </span>
                </summary>
                <div class="px-4 pb-4">
                  <div id="typeStudio" class="mt-1 grid gap-4"></div>
                </div>
              </details>
            </div>

            <div class="preview-column">
              <details class="reference-card rounded-2xl" data-collapsible="images" open>
                <summary class="flex cursor-pointer items-start justify-between gap-4 px-4 py-4">
                  <div class="min-w-0 flex-1">
                    <p class="section-kicker kicker-image"><span class="section-kicker-dot"></span>Imagen de referencia</p>
                    <h3 class="mt-2 text-lg font-semibold text-slate-950">Tratamiento de imagen</h3>
                  </div>
                  <span class="mft-collapsible-chevron mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
                      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z" clip-rule="evenodd" />
                    </svg>
                  </span>
                </summary>
                <div class="px-4 pb-4">
                  <div class="mt-1">
                    <div id="imagePreview" class="mft-bg-img relative overflow-hidden rounded-[20px] bg-slate-200">
                      <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80" alt="Ejemplo de imagen de referencia" />
                      <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent p-3 text-white">
                        <p class="text-xs font-semibold">Vista previa</p>
                      </div>
                    </div>
                    <div class="mt-3 rounded-2xl bg-white p-3 border border-pink-100">
                      <div class="flex items-center justify-between gap-3">
                        <p class="text-xs font-semibold tracking-[0.2em] text-slate-500">Radio</p>
                        <button id="imageRadiusBtn" type="button" class="space-edit" title="Clic para editar">
                          <span id="imageRadiusRead"></span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </details>

              <details class="reference-card rounded-2xl" data-collapsible="spacing-usage" open>
                <summary class="flex cursor-pointer items-start justify-between gap-4 px-4 py-4">
                  <div class="min-w-0 flex-1">
                    <p class="section-kicker kicker-context"><span class="section-kicker-dot"></span>Aplicación real</p>
                    <div class="mt-2 flex items-center justify-between gap-4">
                      <h3 class="text-lg font-semibold text-slate-950">Espaciado en contexto</h3>
                      <span id="sectionUseMeta" class="hidden rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600"></span>
                    </div>
                  </div>
                  <span class="mft-collapsible-chevron mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
                      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z" clip-rule="evenodd" />
                    </svg>
                  </span>
                </summary>
                <div class="px-4 pb-4">
                  <div id="sectionUseTokens" class="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3"></div>
                </div>
              </details>

              <details class="reference-card rounded-2xl" data-collapsible="buttons" open>
                <summary class="flex cursor-pointer items-start justify-between gap-4 px-4 py-4">
                  <div class="min-w-0 flex-1">
                    <p class="section-kicker kicker-buttons"><span class="section-kicker-dot"></span>Botones</p>
                    <div class="mt-2 flex items-center justify-between gap-4">
                      <h3 class="text-lg font-semibold text-slate-950">Sistema de botones</h3>
                      <span class="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">mft-btn-1 · 2 · 3 · 4 · 5</span>
                    </div>
                  </div>
                  <span class="mft-collapsible-chevron mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
                      <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z" clip-rule="evenodd" />
                    </svg>
                  </span>
                </summary>
                <div class="px-4 pb-4">
                  <div id="btnTokens" class="mb-4 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3"></div>
                </div>
              </details>
            </div>
          </div>
        `;
}

function renderTokenBadge() {
  if (!el.tokenBadge) return;
  el.tokenBadge.textContent = "";
  el.tokenBadge.style.background = "transparent";
  el.tokenBadge.style.color = "transparent";
}

function renderDeviceFrame() {
  const device = devices[state.device];
  el.canvasFrame.style.width = device.canvasWidth;
  if (el.deviceMeta) el.deviceMeta.textContent = "";
  // Keep the visual layout stable; only the computed token values change per device.
  el.previewCanvas.dataset.sim = "desktop";
  el.previewCanvas.dataset.device = state.device;
  el.canvasFrame.style.maxWidth = "100%";

  el.previewCanvas.style.background = `linear-gradient(180deg, ${mixColor(state.palette.light, "#ffffff", 0.1)} 0%, #ffffff 100%)`;
}

function getTypographyVarNames(styleKey) {
  const base = typographyVarKeyByStyle[styleKey];
  if (!base) return null;
  const prefix = `--e-global-typography-${base}-`;
  return {
    size: `${prefix}font-size`,
    weight: `${prefix}font-weight`,
    line: `${prefix}line-height`,
    space: `${prefix}letter-spacing`,
  };
}

function getTypographyClampValues(styleKey) {
  const desktop = getTypographyForDevice("desktop")?.styles?.[styleKey];
  const mobile = getTypographyForDevice("mobile")?.styles?.[styleKey];
  if (!desktop || !mobile) return { min: null, max: null };
  return {
    min: Math.round(mobile.size),
    max: Math.round(desktop.size),
  };
}

function getTypographyClampValue(styleKey) {
  const desktop = getTypographyForDevice("desktop")?.styles?.[styleKey];
  const mobile = getTypographyForDevice("mobile")?.styles?.[styleKey];
  if (!desktop || !mobile) return "";

  const min = Math.round(mobile.size);
  const max = Math.round(desktop.size);
  const from = Number(state.typographyClamp?.from) || 1180;
  const to = Number(state.typographyClamp?.to) || 1920;
  return `clamp(${min}px, calc(${min}px + (${max} - ${min}) * ((100vw - ${from}px) / (${to} - ${from}))), ${max}px)`;
}

function getTypographyClampDeclaration(styleKey) {
  const vars = getTypographyVarNames(styleKey);
  const clampValue = getTypographyClampValue(styleKey);
  if (!vars || !clampValue) return "";
  return `${vars.size}: ${clampValue};`;
}

function getColorTokenOptions() {
  return buildKitColorCards().map((card) => ({
    label: String(card.label || card.varId || "").trim(),
    value: `var(${String(card.varId || card.id || "").trim()})`,
    swatch: String(card.value || "").trim(),
  }));
}

function getSpaceTokenOptions() {
  return getSpaceOrderList().map((key) => ({
    label: `--${key} · ${getCurrentSpaceValue(key)}px`,
    value: `var(--mft-space-${key})`,
    px: getCurrentSpaceValue(key),
  }));
}

function getFontFamilyDisplayName(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  const first = value.split(",")[0].trim();
  return first.replace(/^['"]|['"]$/g, "");
}

function getButtonTypographyPresetOptions() {
  ensureTypographyByDevice();
  const t = getTypographyForDevice(state.device) || getTypographyForDevice("desktop");
  const presets = ["button", "buttonS"];
  return presets.map((styleKey) => {
    const vars = getTypographyVarNames(styleKey);
    const style = t?.styles?.[styleKey] || {};
    const label = getTypographyStyleLabel(state.device, styleKey);
    return {
      label: `${label} · ${Math.round(Number(style.size || 0))}px`,
      value: styleKey,
      fontFamily: `var(${vars.family})`,
      fontSize: `var(${vars.size})`,
      fontWeight: `var(${vars.weight})`,
    };
  });
}

function resolveButtonTypographyPreset(styleKey) {
  const presetKey = String(styleKey || "button") === "buttonS" ? "buttonS" : "button";
  const vars = getTypographyVarNames(presetKey);
  const style = getTypographyForDevice(state.device)?.styles?.[presetKey] || getTypographyForDevice("desktop")?.styles?.[presetKey] || {};
  return {
    preset: presetKey,
    label: getTypographyStyleLabel(state.device, presetKey),
    fontFamily: `var(${vars.family})`,
    fontSize: `var(${vars.size})`,
    fontWeight: `var(${vars.weight})`,
    sizePx: Math.round(Number(style.size || 0)),
  };
}

function applyButtonTypographyPreset(cfg, presetKey) {
  const preset = resolveButtonTypographyPreset(presetKey);
  return {
    ...cfg,
    typographyPreset: preset.preset,
    fontFamily: preset.fontFamily,
    fontSize: preset.fontSize,
    fontWeight: preset.fontWeight,
  };
}

function getBorderPresetOptions() {
  const colors = getColorTokenOptions();
  return [
    { label: "None", value: "none" },
    ...colors.slice(0, 6).map((color) => ({ label: `1px ${color.label}`, value: `1px solid ${color.value}` })),
    ...colors.slice(0, 4).map((color) => ({ label: `2px ${color.label}`, value: `2px solid ${color.value}` })),
  ];
}

function describeCssValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw === "none") return "None";
  if (/^var\(--/.test(raw)) return raw.replace(/^var\(/, "").replace(/\)$/, "");
  return raw;
}

function getButtonIndex(btnKey) {
  const match = String(btnKey || "").match(/^btn(\d+)$/i);
  return match ? Number(match[1]) : null;
}

function getButtonDefaultLabel(btnKey) {
  if (btnKey === "btn1") return "Base global";
  if (btnKey === "btn2") return "CTA sólido";
  if (btnKey === "btn3") return "CTA destacado";
  if (btnKey === "btn4") return "CTA claro";
  if (btnKey === "btn5") return "Outline";
  const index = getButtonIndex(btnKey);
  if (Number.isFinite(index) && index >= 6) return `Botón ${index}`;
  return "Botón";
}

function getButtonDefaultClassName(btnKey) {
  const index = getButtonIndex(btnKey);
  if (Number.isFinite(index) && index >= 1) return `mft-btn-${index}`;
  return "mft-btn";
}

function getButtonDraftLabel(btnKey) {
  return String(state.btn?.[btnKey]?.label || getButtonDefaultLabel(btnKey));
}

function getButtonDisplayCodeName(btnKey) {
  return String(state.btn?.[btnKey]?.codeName || getButtonDefaultClassName(btnKey));
}

function getNextButtonIndex() {
  let max = 5;
  Object.keys(state.btn || {}).forEach((key) => {
    const index = getButtonIndex(key);
    if (Number.isFinite(index) && index > max) max = index;
  });
  return max + 1;
}

function ensureCustomButtonOrder() {
  if (!state.btn || typeof state.btn !== "object") return [];
  const existing = Array.isArray(state.btn.customButtons) ? state.btn.customButtons : [];
  const seen = new Set();
  const order = [];
  existing.forEach((key) => {
    const cleaned = String(key || "").trim();
    const index = getButtonIndex(cleaned);
    if (!cleaned || !Number.isFinite(index) || index < 6) return;
    if (!state.btn[cleaned] || typeof state.btn[cleaned] !== "object") return;
    if (seen.has(cleaned)) return;
    seen.add(cleaned);
    order.push(cleaned);
  });
  Object.keys(state.btn)
    .filter((key) => {
      const index = getButtonIndex(key);
      return Number.isFinite(index) && index >= 6 && state.btn[key] && typeof state.btn[key] === "object";
    })
    .sort((a, b) => getButtonIndex(a) - getButtonIndex(b))
    .forEach((key) => {
      if (seen.has(key)) return;
      seen.add(key);
      order.push(key);
    });
  state.btn.customButtons = order;
  return order;
}

function createCustomButtonConfig(label, btnKey) {
  const base = cloneData(state.btn?.btn5 || {});
  const preset = resolveButtonTypographyPreset(base.typographyPreset || "button");
  const defaultLabel = label || getButtonDefaultLabel(btnKey);
  const defaultClassName = getButtonDefaultClassName(btnKey);
  const baseBorder = parseBorderToken(base.border || "", base.color || "");
  const baseHoverBorder = parseBorderToken(base.hoverBorder || "", base.hoverColor || base.color || "");
  return {
    ...base,
    label: defaultLabel,
    codeName: String(base.codeName || defaultClassName),
    typographyPreset: String(base.typographyPreset || preset.preset || "button"),
    fontFamily: normalizeFontFamily(base.fontFamily || preset.fontFamily),
    fontSize: normalizePx(base.fontSize || "", preset.fontSize),
    fontWeight: String(base.fontWeight || preset.fontWeight || ""),
    color: normalizeColorTokenValue(base.color || "var(--e-global-color-text)"),
    bg: normalizeColorTokenValue(base.bg || "transparent"),
    border: String(base.border || "2px solid var(--e-global-color-text)"),
    borderWidth: String(base.borderWidth || baseBorder.width || 2),
    borderColor: normalizeColorTokenValue(base.borderColor || baseBorder.color || "var(--e-global-color-text)"),
    radius: normalizeRadiusValue(base.radius || "var(--mft-space-5xs)"),
    padY: String(base.padY || "var(--mft-space-2xs)"),
    padX: String(base.padX || "var(--mft-space-xs)"),
    hoverBg: normalizeColorTokenValue(base.hoverBg || "var(--e-global-color-text)"),
    hoverColor: normalizeColorTokenValue(base.hoverColor || "var(--e-global-color-47eea86e)"),
    hoverBorder: String(base.hoverBorder || "2px solid var(--e-global-color-text)"),
    hoverBorderWidth: String(base.hoverBorderWidth || baseHoverBorder.width || baseBorder.width || 2),
    hoverBorderColor: normalizeColorTokenValue(base.hoverBorderColor || baseHoverBorder.color || baseBorder.color || "var(--e-global-color-text)"),
    hoverRadius: normalizeRadiusValue(base.hoverRadius || base.radius || "var(--mft-space-5xs)"),
  };
}

function normalizeButtonConfig(config, btnKey) {
  const base = createCustomButtonConfig(getButtonDefaultLabel(btnKey), btnKey);
  const currentBorder = parseBorderToken(config?.border || base.border || "", config?.color || base.color || "");
  const currentHoverBorder = parseBorderToken(config?.hoverBorder || base.hoverBorder || "", config?.hoverColor || config?.color || base.hoverColor || base.color || "");
  return {
    ...base,
    ...config,
    label: String(config?.label || base.label || getButtonDefaultLabel(btnKey)).trim() || getButtonDefaultLabel(btnKey),
    codeName: String(config?.codeName || base.codeName || getButtonDefaultClassName(btnKey)).trim() || getButtonDefaultClassName(btnKey),
    typographyPreset: String(config?.typographyPreset || base.typographyPreset || "button"),
    fontFamily: normalizeFontFamily(config?.fontFamily || base.fontFamily || ""),
    fontSize: normalizePx(config?.fontSize || base.fontSize || "", ""),
    fontWeight: String(config?.fontWeight || base.fontWeight || ""),
    color: normalizeColorTokenValue(config?.color || base.color || ""),
    bg: normalizeColorTokenValue(config?.bg || base.bg || ""),
    border: String(config?.border || base.border || ""),
    borderWidth: String(config?.borderWidth || currentBorder.width || base.borderWidth || 0),
    borderColor: normalizeColorTokenValue(config?.borderColor || currentBorder.color || base.borderColor || config?.color || base.color || ""),
    radius: `${Math.max(0, Math.round(resolveSpaceLikeForDevice(state.device, config?.radius || base.radius || "").px || 0))}px`,
    padY: String(config?.padY || base.padY || ""),
    padX: String(config?.padX || base.padX || ""),
    hoverBg: normalizeColorTokenValue(config?.hoverBg || base.hoverBg || ""),
    hoverColor: normalizeColorTokenValue(config?.hoverColor || base.hoverColor || ""),
    hoverBorder: String(config?.hoverBorder || base.hoverBorder || ""),
    hoverBorderWidth: String(config?.hoverBorderWidth || currentHoverBorder.width || currentBorder.width || base.hoverBorderWidth || 0),
    hoverBorderColor: normalizeColorTokenValue(config?.hoverBorderColor || currentHoverBorder.color || base.hoverBorderColor || config?.hoverColor || config?.color || base.hoverColor || base.color || ""),
    hoverRadius: `${Math.max(0, Math.round(resolveSpaceLikeForDevice(state.device, config?.hoverRadius || base.hoverRadius || config?.radius || base.radius || "").px || 0))}px`,
  };
}

function duplicateButtonConfig(sourceCfg, btnKey) {
  const clone = cloneData(sourceCfg || {});
  const sourceLabel = String(clone.label || getButtonDefaultLabel(btnKey)).trim();
  const copyLabel = sourceLabel ? `${sourceLabel} copia` : `${getButtonDefaultLabel(btnKey)} copia`;
  return normalizeButtonConfig({ ...clone, label: copyLabel, codeName: getButtonDefaultClassName(btnKey) }, btnKey);
}

function buildButtonCssSnippet(className, cfg) {
  const preset = resolveButtonTypographyPreset(cfg.typographyPreset || "button");
  const color = normalizeColorTokenValue(cfg.color);
  const bg = normalizeColorTokenValue(cfg.bg);
  const border = buildBorderCss(cfg.borderWidth ?? parseBorderToken(cfg.border, color).width, cfg.borderColor || parseBorderToken(cfg.border, color).color);
  const hoverBg = normalizeColorTokenValue(cfg.hoverBg || bg);
  const hoverColor = normalizeColorTokenValue(cfg.hoverColor || color);
  const hoverBorder = buildBorderCss(cfg.hoverBorderWidth ?? parseBorderToken(cfg.hoverBorder, hoverColor).width, cfg.hoverBorderColor || parseBorderToken(cfg.hoverBorder, hoverColor).color);
  const radius = normalizeRadiusValue(cfg.radius || "");
  const hoverRadius = normalizeRadiusValue(cfg.hoverRadius || radius);
  const fontFamily = String(cfg.fontFamily || preset.fontFamily);
  const fontSize = String(cfg.fontSize || preset.fontSize);
  const fontWeight = String(cfg.fontWeight || preset.fontWeight);
  return [
    `/* BTN - ${className.replace("mft-btn-", "")} */`,
    `.elementor-button.${className} {`,
    `    display: inline-flex;`,
    `    align-items: center;`,
    `    justify-content: center;`,
    `    gap: var(--mft-btn-arrow-gap, 8px);`,
    `    transition: all 0.3s ease;`,
    `    font-family: ${fontFamily};`,
    `    font-size: ${fontSize};`,
    `    font-weight: ${fontWeight};`,
    `    color: ${color};`,
    `    fill: ${color};`,
    `    background-color: ${bg};`,
    `    border: ${border};`,
    `    border-radius: ${radius};`,
    `    padding: ${String(cfg.padY || "")} ${String(cfg.padX || "")};`,
    `}`,
    ``,
    `@media (hover: hover) and (pointer: fine) {`,
    `    .elementor-button.${className}:hover {`,
    `        color: ${hoverColor};`,
    `        fill: ${hoverColor};`,
    `        background-color: ${hoverBg};`,
    `        border: ${hoverBorder};`,
    `        border-radius: ${hoverRadius};`,
    `    }`,
    `}`,
  ].join("\n");
}

function parseCssDeclarations(blockText) {
  const out = {};
  const text = String(blockText || "");
  const matcher = /([a-z-]+)\s*:\s*([^;]+);/gi;
  let match = matcher.exec(text);
  while (match) {
    out[String(match[1] || "").trim().toLowerCase()] = String(match[2] || "").trim();
    match = matcher.exec(text);
  }
  return out;
}

function stripCssComments(text) {
  return String(text || "").replace(/\/\*[\s\S]*?\*\//g, "");
}

function parseButtonPaddingShorthand(raw) {
  const value = String(raw || "").trim();
  if (!value) return { padY: "", padX: "" };
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return { padY: parts[0], padX: parts[0] };
  if (parts.length === 2) return { padY: parts[0], padX: parts[1] };
  if (parts.length >= 4) return { padY: parts[0], padX: parts[1] };
  return { padY: parts[0] || "", padX: parts[1] || parts[0] || "" };
}

function findButtonCssBlock(cssText, className, pseudo = "") {
  const text = stripCssComments(cssText);
  const selector = pseudo ? `\\.elementor-button\\.${className}${pseudo}` : `\\.elementor-button\\.${className}`;
  const regex = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\}`, "i");
  const match = text.match(regex);
  return match ? match[1] : "";
}

function applyButtonStyleFromCss(cssText, btnKey, className) {
  const baseBlock = parseCssDeclarations(findButtonCssBlock(cssText, className));
  const hoverBlock = parseCssDeclarations(findButtonCssBlock(cssText, className, ":hover"));
  const index = getButtonIndex(btnKey);
  const existing = state.btn[btnKey] && typeof state.btn[btnKey] === "object" ? state.btn[btnKey] : null;
  const fallback = Number.isFinite(index) && index >= 6 ? createCustomButtonConfig(getButtonDefaultLabel(btnKey), btnKey) : (existing || {});
  const next = { ...fallback };
  if (baseBlock["font-family"]) next.fontFamily = normalizeFontFamily(baseBlock["font-family"]);
  if (baseBlock["font-size"]) next.fontSize = normalizePx(baseBlock["font-size"], next.fontSize || "");
  if (baseBlock["font-weight"]) next.fontWeight = String(baseBlock["font-weight"]);
  if (baseBlock.color) next.color = normalizeColorTokenValue(baseBlock.color);
  if (baseBlock["background-color"]) next.bg = normalizeColorTokenValue(baseBlock["background-color"]);
  if (baseBlock.border) {
    next.border = String(baseBlock.border);
    const parsed = parseBorderToken(next.border, next.color || next.bg || "");
    next.borderWidth = String(parsed.width || next.borderWidth || 0);
    next.borderColor = normalizeColorTokenValue(parsed.color || next.borderColor || next.color || "");
  }
  if (baseBlock["border-radius"]) next.radius = normalizeRadiusValue(baseBlock["border-radius"]);
  if (baseBlock.padding) {
    const pad = parseButtonPaddingShorthand(baseBlock.padding);
    if (pad.padY) next.padY = pad.padY;
    if (pad.padX) next.padX = pad.padX;
  }
  if (hoverBlock.color) next.hoverColor = normalizeColorTokenValue(hoverBlock.color);
  if (hoverBlock["background-color"]) next.hoverBg = normalizeColorTokenValue(hoverBlock["background-color"]);
  if (hoverBlock.border) {
    next.hoverBorder = String(hoverBlock.border);
    const parsed = parseBorderToken(next.hoverBorder, next.hoverColor || next.hoverBg || next.color || "");
    next.hoverBorderWidth = String(parsed.width || next.hoverBorderWidth || next.borderWidth || 0);
    next.hoverBorderColor = normalizeColorTokenValue(parsed.color || next.hoverBorderColor || next.hoverColor || next.color || "");
  }
  if (hoverBlock["border-radius"]) next.hoverRadius = normalizeRadiusValue(hoverBlock["border-radius"]);
  state.btn[btnKey] = normalizeButtonConfig({ ...next, label: String(next.label || getButtonDefaultLabel(btnKey)) }, btnKey);
}

function importButtonStylesFromCss(cssText) {
  const text = stripCssComments(cssText);
  const vars = parseCssVarMap(text);
  if (vars["--mft-btn-arrow-gap"]) state.btn.arrowGap = String(vars["--mft-btn-arrow-gap"]).trim();
  if (vars["--mft-btn-arrow-content"]) state.btn.arrowContent = String(vars["--mft-btn-arrow-content"]).trim();

  const genericMatch = text.match(/\.elementor-button\[class\^=['"]mft-btn['"]\]\s*\{([\s\S]*?)\}/i);
  const genericButtonBlock = parseCssDeclarations(genericMatch ? genericMatch[1] : "");
  const genericRadius = genericButtonBlock["border-radius"] ? normalizeRadiusValue(genericButtonBlock["border-radius"]) : "";
  const genericPadding = genericButtonBlock.padding ? parseButtonPaddingShorthand(genericButtonBlock.padding) : null;
  const genericFontFamily = genericButtonBlock["font-family"] ? normalizeFontFamily(genericButtonBlock["font-family"]) : "";
  const genericFontSize = genericButtonBlock["font-size"] ? normalizePx(genericButtonBlock["font-size"], "") : "";
  const genericFontWeight = genericButtonBlock["font-weight"] ? String(genericButtonBlock["font-weight"]) : "";

  const baseButtonVars = [
    ["btn1", "mirai-ui-button"],
    ["btn2", "mft-btn-2"],
    ["btn3", "mft-btn-3"],
    ["btn4", "mft-btn-4"],
    ["btn5", "mft-btn-5"],
  ];

  if (genericRadius || genericPadding || genericFontFamily || genericFontSize || genericFontWeight) {
    baseButtonVars.forEach(([btnKey]) => {
      const current = state.btn[btnKey];
      if (!current || typeof current !== "object") return;
      const next = { ...current };
      if (genericRadius) {
        next.radius = genericRadius;
        next.hoverRadius = genericRadius;
      }
      if (genericPadding) {
        if (genericPadding.padY) next.padY = genericPadding.padY;
        if (genericPadding.padX) next.padX = genericPadding.padX;
      }
      if (genericFontFamily) next.fontFamily = genericFontFamily;
      if (genericFontSize) next.fontSize = genericFontSize;
      if (genericFontWeight) next.fontWeight = genericFontWeight;
      state.btn[btnKey] = normalizeButtonConfig(next, btnKey);
    });
  }

  baseButtonVars.forEach(([btnKey, prefix]) => {
    const current = state.btn[btnKey];
    if (!current || typeof current !== "object") return;
    const next = { ...current };
    const color = vars[`--${prefix}-color`];
    const bg = vars[`--${prefix}-bg`] || vars[`--${prefix}-background`];
    const border = vars[`--${prefix}-border`];
    const radius = vars[`--${prefix}-radius`];
    const padY = vars[`--${prefix}-pad-y`];
    const padX = vars[`--${prefix}-pad-x`];
    const fontFamily = vars[`--${prefix}-font-family`];
    const fontSize = vars[`--${prefix}-font-size`];
    const fontWeight = vars[`--${prefix}-font-weight`];
    const hoverBg = vars[`--${prefix}-hover-bg`] || vars[`--${prefix}-background-active`];
    const hoverColor = vars[`--${prefix}-hover-color`] || vars[`--${prefix}-color-active`];
    const hoverBorder = vars[`--${prefix}-hover-border`];
    const hoverRadius = vars[`--${prefix}-hover-radius`] || vars[`--${prefix}-radius-active`];
    if (color) next.color = normalizeColorTokenValue(color);
    if (bg) next.bg = normalizeColorTokenValue(bg);
    if (border) next.border = String(border);
    if (radius) next.radius = normalizeRadiusValue(radius);
    else if (genericRadius) next.radius = genericRadius;
    if (padY) next.padY = String(padY);
    if (padX) next.padX = String(padX);
    else if (genericPadding) {
      if (genericPadding.padY) next.padY = genericPadding.padY;
      if (genericPadding.padX) next.padX = genericPadding.padX;
    }
    if (fontFamily) next.fontFamily = normalizeFontFamily(fontFamily);
    else if (genericFontFamily) next.fontFamily = genericFontFamily;
    if (fontSize) next.fontSize = normalizePx(fontSize, next.fontSize || "");
    else if (genericFontSize) next.fontSize = genericFontSize;
    if (fontWeight) next.fontWeight = String(fontWeight);
    else if (genericFontWeight) next.fontWeight = genericFontWeight;
    if (hoverBg) next.hoverBg = normalizeColorTokenValue(hoverBg);
    if (hoverColor) next.hoverColor = normalizeColorTokenValue(hoverColor);
    if (hoverBorder) next.hoverBorder = String(hoverBorder);
    if (hoverRadius) next.hoverRadius = normalizeRadiusValue(hoverRadius);
    else if (genericRadius) next.hoverRadius = genericRadius;
    state.btn[btnKey] = normalizeButtonConfig(next, btnKey);
  });

  const buttonBlockRegex = /\.elementor-button\.mft-btn-(\d+)\s*\{([\s\S]*?)\}(?:\s*@media[^{]+\{[\s\S]*?\})?/gi;
  const hoverBlockRegex = /\.elementor-button\.mft-btn-(\d+):hover\s*\{([\s\S]*?)\}/gi;
  const collected = new Map();

  let match = buttonBlockRegex.exec(text);
  while (match) {
    const btnKey = `btn${Number(match[1])}`;
    collected.set(btnKey, { base: match[2] || "", hover: "" });
    match = buttonBlockRegex.exec(text);
  }
  match = hoverBlockRegex.exec(text);
  while (match) {
    const btnKey = `btn${Number(match[1])}`;
    const prev = collected.get(btnKey) || { base: "", hover: "" };
    prev.hover = match[2] || "";
    collected.set(btnKey, prev);
    match = hoverBlockRegex.exec(text);
  }

  collected.forEach((blocks, btnKey) => {
    const index = getButtonIndex(btnKey);
    if (!Number.isFinite(index) || index > 5) return;
    applyButtonStyleFromCss(text, btnKey, `mft-btn-${index}`);
  });

  ["btn6", "btn7", "btn8", "btn9", "btn10", "btn11", "btn12"].forEach((btnKey) => {
    if (state.btn[btnKey]) delete state.btn[btnKey];
  });
  state.btn.customButtons = Array.isArray(state.btn.customButtons)
    ? state.btn.customButtons.filter((btnKey) => getButtonIndex(btnKey) <= 5)
    : [];
  state.btn.customButtons = Array.from(new Set(state.btn.customButtons)).sort((a, b) => getButtonIndex(a) - getButtonIndex(b));
}

function importTypographyFromElementorCss(cssText) {
  const vars = parseCssVarMap(cssText);
  const typographyByDevice = { desktop: { families: {}, styles: {}, labels: {} }, tablet: { families: {}, styles: {}, labels: {} }, mobile: { families: {}, styles: {}, labels: {} } };

  const typographyVars = Object.entries(vars).filter(([key]) => key.startsWith("--e-global-typography-"));

  typographyVars.forEach(([key, value]) => {
    const match = key.match(/^--e-global-typography-([a-z0-9]+)-([a-z-]+)$/i);
    if (!match) return;
    const [, typographyId, property] = match;

    typographyId.split("").forEach((_, i) => {
      const deviceTypographyId = typographyId.substring(0, i + 1);
      if (!typographyByDevice.desktop.styles[deviceTypographyId]) {
        typographyByDevice.desktop.styles[deviceTypographyId] = { size: 16, weight: 400, line: 1.5, space: 0 };
        typographyByDevice.tablet.styles[deviceTypographyId] = { size: 16, weight: 400, line: 1.5, space: 0 };
        typographyByDevice.mobile.styles[deviceTypographyId] = { size: 16, weight: 400, line: 1.5, space: 0 };
        typographyByDevice.desktop.labels[deviceTypographyId] = typographyId;
      }
    });

    const styleParts = typographyId.match(/^([a-z]+)/i)?.[1] || typographyId;
    if (property === "font-family") {
      typographyByDevice.desktop.families[styleParts] = normalizeFontFamily(value);
      typographyByDevice.tablet.families[styleParts] = normalizeFontFamily(value);
      typographyByDevice.mobile.families[styleParts] = normalizeFontFamily(value);
    } else if (property === "font-size") {
      const parsedSize = extractClampValues(value);
      typographyByDevice.desktop.styles[typographyId].size = parsedSize.max || 16;
      typographyByDevice.tablet.styles[typographyId].size = parsedSize.mid || parsedSize.max || 16;
      typographyByDevice.mobile.styles[typographyId].size = parsedSize.min || 16;
    } else if (property === "font-weight") {
      const weight = Number(value) || 400;
      typographyByDevice.desktop.styles[typographyId].weight = weight;
      typographyByDevice.tablet.styles[typographyId].weight = weight;
      typographyByDevice.mobile.styles[typographyId].weight = weight;
    } else if (property === "line-height") {
      const line = normalizeLineHeight(value, 1.5);
      typographyByDevice.desktop.styles[typographyId].line = line;
      typographyByDevice.tablet.styles[typographyId].line = line;
      typographyByDevice.mobile.styles[typographyId].line = line;
    }
  });

  if (Object.keys(typographyByDevice.desktop.styles).length > 0) {
    state.typographyByDevice = typographyByDevice;
  }
}

function extractClampValues(clampStr) {
  const str = String(clampStr).trim();
  const clampMatch = str.match(/clamp\s*\(\s*([\d.]+)px\s*,\s*[^,]+,\s*([\d.]+)px\s*\)/i);
  if (clampMatch) {
    const min = Number(clampMatch[1]);
    const max = Number(clampMatch[2]);
    return { min, max, mid: (min + max) / 2 };
  }
  const pxMatch = str.match(/([\d.]+)px/);
  const val = pxMatch ? Number(pxMatch[1]) : 16;
  return { min: val, max: val, mid: val };
}

function applyStylesheetCssText(cssText) {
  importSpaceScaleFromCss(cssText);
  importPaddingScaleFromCss(cssText);
  importSectionUseFromCss(cssText);
  importButtonStylesFromCss(cssText);
  importTypographyFromElementorCss(cssText);
  applyThemeVariables();
  renderAll();
  saveToLocalStorage();
}

function normalizeLineHeight(raw, fallback) {
  const s = String(raw ?? "").trim();
  if (!s) return fallback;
  const pct = s.match(/^(\d+(?:\.\d+)?)%$/);
  if (pct) {
    const n = Number(pct[1]);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return Number((n / 100).toFixed(3));
  }
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Number(n.toFixed(3));
}

function formatLineHeightPct(line) {
  const n = Number(line);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${Math.round(n * 100)}%`;
}

function normalizeFontFamily(raw) {
  return String(raw || "")
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return "";
      if (/^['"].*['"]$/.test(trimmed)) return trimmed;
      if (/^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-serif|ui-sans-serif|ui-monospace|ui-rounded|emoji|math|fangsong)$/i.test(trimmed)) {
        return trimmed;
      }
      return /\s/.test(trimmed) ? `"${trimmed}"` : trimmed;
    })
    .filter(Boolean)
    .join(", ");
}

async function copyText(text) {
  const value = String(text ?? "");
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch { }

  try {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

async function readClipboardText() {
  try {
    if (navigator.clipboard && typeof navigator.clipboard.readText === "function") {
      return await navigator.clipboard.readText();
    }
  } catch { }
  return "";
}

async function openClipboardImportEditor({ kicker, title, description, emptyMessage }) {
  const clipboardText = await readClipboardText();
  const next = await openEditor({
    kicker,
    title,
    description,
    kind: "textarea",
    value: clipboardText,
    okLabel: "Aplicar",
    validate: (raw) => {
      const v = String(raw || "").trim();
      return v ? { ok: true, value: v } : { ok: false, message: emptyMessage };
    },
  });
  return next;
}

const editor = setupEditorModal();
async function openEditor(opts) {
  if (!editor) return null;
  return editor.show(opts);
}

function setupTypeModal() {
  const modal = document.getElementById("typeModal");
  const backdrop = document.getElementById("typeBackdrop");
  const close = document.getElementById("typeClose");
  const cancel = document.getElementById("typeCancel");
  const save = document.getElementById("typeSave");
  const title = document.getElementById("typeTitle");
  const desc = document.getElementById("typeDesc");
  const family = document.getElementById("typeFamily");
  const groupInput = document.getElementById("typeGroup");
  const rowsHost = document.getElementById("typeRows");
  const error = document.getElementById("typeError");

  let ctx = null; // { device, groupKey, keys[] }
  let lastFocus = null;

  function setError(msg) {
    if (!msg) {
      error.classList.add("hidden");
      error.textContent = "";
      return;
    }
    error.textContent = msg;
    error.classList.remove("hidden");
  }

  function hide() {
    modal.classList.add("hidden");
    setError("");
    ctx = null;
    try {
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    } catch { }
    lastFocus = null;
  }

  function show(nextCtx) {
    ensureTypographyByDevice();
    lastFocus = document.activeElement;
    ctx = nextCtx;
    setError("");

    const t = getTypographyForDevice(ctx.device);
    const deviceLabel = devices[ctx.device].label;
    const groupLabel =
      ctx.groupKey === "heading"
        ? "Heading"
        : ctx.groupKey === "links"
          ? "Body / Links"
          : ctx.groupKey === "ui"
            ? "UI"
            : "Body";

    title.textContent = `${groupLabel} | ${deviceLabel}`;
    desc.textContent = "Ajusta la familia y la escala visual. Los nombres visibles se editan en la tabla.";
    groupInput.value = ctx.groupKey;

    family.value = normalizeFontFamily(t.families[ctx.groupKey] || "");

    rowsHost.innerHTML = ctx.keys
      .map((k) => {
        const s = t.styles[k];
        const clampValues = getTypographyClampValues(k);
        return `
                <tr class="text-sm">
                  <td class="border-b border-pink-100 px-4 py-2.5">
                    <input data-type-field="label" data-type-key="${k}" class="w-full rounded-lg border border-pink-100 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-pink-200 focus:ring-4 focus:ring-pink-100" value="${getTypographyStyleLabel(ctx.device, k).replace(/"/g, "&quot;")}" />
                  </td>
                  <td class="border-b border-pink-100 px-4 py-2.5 text-center">
                    <input data-type-field="sizeMin" data-type-key="${k}" class="w-full text-center rounded-lg border border-pink-100 bg-white px-3 py-2 font-mono text-sm font-medium text-slate-900 outline-none focus:border-pink-200 focus:ring-4 focus:ring-pink-100" value="${clampValues.min || ''}" />
                  </td>
                  <td class="border-b border-pink-100 px-4 py-2.5 text-center">
                    <input data-type-field="sizeMax" data-type-key="${k}" class="w-full text-center rounded-lg border border-pink-100 bg-white px-3 py-2 font-mono text-sm font-medium text-slate-900 outline-none focus:border-pink-200 focus:ring-4 focus:ring-pink-100" value="${clampValues.max || ''}" />
                  </td>
                  <td class="border-b border-pink-100 px-4 py-2.5 text-center">
                    <input data-type-field="weight" data-type-key="${k}" class="w-full text-center rounded-lg border border-pink-100 bg-white px-3 py-2 font-mono text-sm font-medium text-slate-900 outline-none focus:border-pink-200 focus:ring-4 focus:ring-pink-100" value="${s.weight}" />
                  </td>
                  <td class="border-b border-pink-100 px-4 py-2.5 text-center">
                    <input data-type-field="line" data-type-key="${k}" class="w-full text-center rounded-lg border border-pink-100 bg-white px-3 py-2 font-mono text-sm font-medium text-slate-900 outline-none focus:border-pink-200 focus:ring-4 focus:ring-pink-100" value="${formatLineHeightPct(s.line) || s.line}" />
                  </td>
                </tr>
              `;
      })
      .join("");

    modal.classList.remove("hidden");
    setTimeout(() => family.focus(), 0);
  }

  function parseNumber(value) {
    const n = Number(String(value || "").trim());
    return Number.isFinite(n) ? n : null;
  }

  function doSave() {
    if (!ctx) return;
    ensureTypographyByDevice();

    const t = getTypographyForDevice(ctx.device);
    const normalizedFamily = normalizeFontFamily(family.value || t.families[ctx.groupKey]);
    const next = {
      families: { ...t.families, [ctx.groupKey]: normalizedFamily || t.families[ctx.groupKey] },
      labels: { ...(t.labels || {}) },
      styles: { ...t.styles },
    };

    for (const k of ctx.keys) {
      const row = next.styles[k];
      const get = (field) => rowsHost.querySelector(`[data-type-key="${k}"][data-type-field="${field}"]`);
      const labelValue = String(get("label")?.value || "").trim();
      const sizeMin = parseNumber(get("sizeMin")?.value);
      const sizeMax = parseNumber(get("sizeMax")?.value);
      const weight = parseNumber(get("weight")?.value);
      const line = normalizeLineHeight(get("line")?.value, null);

      if (!labelValue) return setError(`Label inválido en ${k}.`);
      if (sizeMin === null || sizeMin <= 0) return setError(`Size Min inválido en ${k}.`);
      if (sizeMax === null || sizeMax <= 0) return setError(`Size Max inválido en ${k}.`);
      if (weight === null || weight <= 0) return setError(`Weight inválido en ${k}.`);
      if (line === null || line <= 0) return setError(`Line-height inválido en ${k}.`);

      next.labels[k] = labelValue;
      next.styles[k] = { ...row, size: Math.round(sizeMin), weight: Math.round(weight), line: Number(line.toFixed(3)), space: 0 };
    }

    const familyValue = normalizeFontFamily(next.families[ctx.groupKey]);
    const updatedTypographyByDevice = { ...state.typographyByDevice };
    ["desktop", "tablet", "mobile"].forEach((device) => {
      const currentDevice = device === ctx.device ? next : getTypographyForDevice(device);
      updatedTypographyByDevice[device] = {
        ...currentDevice,
        families: { ...currentDevice.families, [ctx.groupKey]: familyValue },
      };

      // Update size values for responsive typography
      if (ctx.device === "desktop") {
        // If editing desktop, update mobile with the min size
        for (const k of ctx.keys) {
          const sizeMin = parseNumber(rowsHost.querySelector(`[data-type-key="${k}"][data-type-field="sizeMin"]`)?.value);
          const sizeMax = parseNumber(rowsHost.querySelector(`[data-type-key="${k}"][data-type-field="sizeMax"]`)?.value);
          if (sizeMin && sizeMax) {
            if (device === "desktop") {
              updatedTypographyByDevice[device].styles[k].size = sizeMax;
            } else if (device === "mobile") {
              updatedTypographyByDevice[device].styles[k].size = sizeMin;
            }
          }
        }
      }
    });
    state.typographyByDevice = updatedTypographyByDevice;
    hide();
    renderAll();
  }

  save.addEventListener("click", doSave);
  cancel.addEventListener("click", hide);
  close.addEventListener("click", hide);
  backdrop.addEventListener("click", hide);

  document.addEventListener("keydown", (e) => {
    if (!ctx || modal.classList.contains("hidden")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      hide();
      return;
    }
    if ((e.key === "Enter" || e.key === "NumpadEnter") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      doSave();
    }
  });

  function refresh() {
    if (!ctx || modal.classList.contains("hidden")) return;
    rerender();
  }

  return { show, hide, refresh };
}

const typeModal = setupTypeModal();

function setupButtonModal() {
  const modal = document.getElementById("buttonModal");
  const backdrop = document.getElementById("buttonBackdrop");
  const close = document.getElementById("buttonClose");
  const cancel = document.getElementById("buttonCancel");
  const save = document.getElementById("buttonSave");
  const del = document.getElementById("buttonDelete");
  const title = document.getElementById("buttonTitle");
  const desc = document.getElementById("buttonDesc");
  const preview = document.getElementById("buttonPreview");
  const fields = document.getElementById("buttonFields");
  const activeValue = document.getElementById("buttonActiveValue");
  const resetDraft = document.getElementById("buttonResetDraft");
  const error = document.getElementById("buttonError");

  let ctx = null;
  let draft = null;
  let lastFocus = null;
  let activeTab = "normal";
  const tabs = [
    { key: "normal", label: "Normal", description: "Valores base" },
    { key: "hover", label: "Hover", description: "Al pasar el ratón" },
  ];

  function setError(message) {
    if (!message) {
      error.classList.add("hidden");
      error.textContent = "";
      return;
    }
    error.textContent = message;
    error.classList.remove("hidden");
  }

  function hide() {
    modal.classList.add("hidden");
    del.classList.add("hidden");
    setError("");
    ctx = null;
    draft = null;
    activeTab = "normal";
    try {
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    } catch { }
    lastFocus = null;
  }

  function cloneConfig(input) {
    const baseBorder = parseBorderToken(input?.border || "", input?.color || "");
    const hoverBorder = parseBorderToken(input?.hoverBorder || "", input?.hoverColor || input?.color || "");
    return {
      label: String(input?.label || ""),
      typographyPreset: String(input?.typographyPreset || "button"),
      fontFamily: normalizeFontFamily(input?.fontFamily || ""),
      fontSize: normalizePx(input?.fontSize || "", ""),
      fontWeight: String(input?.fontWeight || ""),
      color: normalizeColorTokenValue(input?.color || ""),
      bg: normalizeColorTokenValue(input?.bg || ""),
      border: String(input?.border || ""),
      borderWidth: String(baseBorder.width || 0),
      borderColor: normalizeColorTokenValue(baseBorder.color || input?.color || ""),
      radius: `${Math.max(0, Math.round(resolveSpaceLikeForDevice(state.device, input?.radius || "").px || 0))}px`,
      padY: String(input?.padY || ""),
      padX: String(input?.padX || ""),
      hoverBg: normalizeColorTokenValue(input?.hoverBg || ""),
      hoverColor: normalizeColorTokenValue(input?.hoverColor || ""),
      hoverBorder: String(input?.hoverBorder || ""),
      hoverBorderWidth: String(hoverBorder.width || baseBorder.width || 0),
      hoverBorderColor: normalizeColorTokenValue(hoverBorder.color || input?.hoverColor || input?.color || ""),
      hoverRadius: `${Math.max(0, Math.round(resolveSpaceLikeForDevice(state.device, input?.hoverRadius || input?.radius || "").px || 0))}px`,
    };
  }

  function selectedLabel(value, options, type = "color") {
    const normalizedValue = normalizeColorTokenValue(value);
    const normalizedFontValue = normalizeFontFamily(value);
    const found = options.find((option) => {
      if (type === "font") return normalizeFontFamily(option.value) === normalizedFontValue;
      if (type === "preset") return String(option.value) === String(value);
      return normalizeColorTokenValue(option.value) === normalizedValue;
    });
    if (found) return found.label;
    if (type === "font") return getFontFamilyDisplayName(value) || String(value || "");
    if (type === "preset") return String(value || "");
    return describeCssValue(value);
  }

  function renderButtonSection(titleText, descriptionText, bodyHtml, open = true) {
    return `
            <details class="rounded-2xl border border-slate-200/80 bg-white/95 p-2.5 shadow-[0_1px_0_rgba(15,23,42,0.02)]" ${open ? "open" : ""}>
              <summary class="flex cursor-pointer list-none items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">${titleText}</p>
                  <p class="mt-0.5 text-xs font-medium leading-5 text-slate-500">${descriptionText}</p>
                </div>
                <span class="mft-collapsible-chevron inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100/90 text-slate-600">
                  <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4" aria-hidden="true">
                    <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z" clip-rule="evenodd" />
                  </svg>
                </span>
              </summary>
              <div class="mt-2.5 space-y-2.5">
                ${bodyHtml}
              </div>
            </details>
          `;
  }

  function renderTabBar() {
    return `
            <div class="sticky top-0 z-20 rounded-2xl border border-slate-200 bg-slate-100/95 p-1.5 backdrop-blur-sm">
              <div class="grid grid-cols-2 gap-1">
                ${tabs
        .map(
          (tab) => `
                      <button
                        type="button"
                        data-button-tab="${tab.key}"
                        aria-selected="${activeTab === tab.key ? "true" : "false"}"
                        class="rounded-xl px-3 py-2 text-left transition ${activeTab === tab.key
              ? tab.key === "normal"
                ? "bg-sky-600 text-white shadow-sm ring-1 ring-sky-600"
                : "bg-amber-500 text-white shadow-sm ring-1 ring-amber-500"
              : tab.key === "normal"
                ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100 hover:bg-sky-100 hover:text-sky-800"
                : "bg-amber-50 text-amber-700 ring-1 ring-amber-100 hover:bg-amber-100 hover:text-amber-800"
            }"
                      >
                        <span class="block text-sm font-semibold">${tab.label}</span>
                        <span class="block text-[10px] font-medium uppercase tracking-[0.18em] opacity-80">${tab.description}</span>
                      </button>
                    `,
        )
        .join("")}
              </div>
            </div>
          `;
  }

  function renderNumericRow(label, field, value, suffix = "") {
    return `
            <div class="rounded-2xl border border-slate-200/80 bg-white p-2.5">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">${label}</p>
                  <p class="mt-0.5 text-xs font-medium text-slate-500">${String(value || 0)}${suffix}</p>
                </div>
                <span class="rounded-full bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200/80">${String(value || 0)}${suffix}</span>
              </div>
              <div class="mt-2.5">
                <input type="number" min="0" step="1" data-button-field="${field}" value="${String(value || 0)}" class="w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[13px] font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/60" />
              </div>
            </div>
          `;
  }

  function renderShapeSection(cfg, colorOptions, spaceOptions) {
    const borderWidthValue = String(cfg.borderWidth || 0).trim() || "0";
    const radiusValue = String(Math.max(0, Math.round(Number(resolveSpaceLikeForDevice(state.device, cfg.radius || "0px").px || 0))));
    const borderColorValue = cfg.borderColor || cfg.color;
    const padYValue = cfg.padY;
    const padXValue = cfg.padX;

    const borderWidthOptions = [
      { label: "None", value: "0" },
      { label: "1px", value: "1" },
      { label: "2px", value: "2" },
      { label: "3px", value: "3" },
      { label: "4px", value: "4" },
    ];

    const borderWidthPills = borderWidthOptions
      .map(
        (opt) => `
          <button type="button" data-button-field="borderWidth" data-button-value="${opt.value}" class="rounded-full px-2 py-[3px] text-[9px] font-semibold ring-1 transition whitespace-nowrap ${String(opt.value) === borderWidthValue ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100"}">
            ${opt.label}
          </button>
        `,
      )
      .join("");

    const borderColorCurrentOpt = colorOptions.find((o) => normalizeColorTokenValue(o.value) === normalizeColorTokenValue(borderColorValue));
    const borderColorCurrentSwatch = borderColorCurrentOpt?.swatch || "#cccccc";
    const borderColorCurrentLabel = borderColorCurrentOpt?.label || "Color";

    const colorList = colorOptions
      .map((opt) => {
        const isActive = normalizeColorTokenValue(opt.value) === normalizeColorTokenValue(borderColorValue);
        const colorHex = String(opt.swatch || "").toLowerCase();
        return `
          <button type="button" data-button-field="borderColor" data-button-value="${opt.value}" class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[9px] ring-1 transition ${isActive ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100"}">
            <span class="h-3 w-3 shrink-0 rounded-full border border-black/10" style="background-color: ${opt.swatch};"></span>
            <div class="flex-1 min-w-0">
              <div class="font-semibold">${opt.label}</div>
              <div class="text-[8px] opacity-60 font-mono">${colorHex}</div>
            </div>
          </button>
        `;
      })
      .join("");

    const padYCurrentOpt = spaceOptions.find((o) => String(o.value) === String(padYValue));
    const padYCurrentLabel = padYCurrentOpt?.label || selectedLabel(padYValue, spaceOptions, "space") || "Pad Y";
    const padYCurrentResolved = resolveSpaceLikeForDevice(state.device, padYValue);
    const padYCurrentPx = String(Math.max(0, Math.round(Number(padYCurrentResolved.px || 0))));

    const padXCurrentOpt = spaceOptions.find((o) => String(o.value) === String(padXValue));
    const padXCurrentLabel = padXCurrentOpt?.label || selectedLabel(padXValue, spaceOptions, "space") || "Pad X";
    const padXCurrentResolved = resolveSpaceLikeForDevice(state.device, padXValue);
    const padXCurrentPx = String(Math.max(0, Math.round(Number(padXCurrentResolved.px || 0))));

    const padYOptions = spaceOptions
      .map((opt) => {
        const isActive = String(opt.value) === String(padYValue);
        const resolved = resolveSpaceLikeForDevice(state.device, opt.value);
        const pxValue = String(Math.max(0, Math.round(Number(resolved.px || 0))));
        return `
          <button type="button" data-button-field="padY" data-button-value="${opt.value}" class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[9px] ring-1 transition ${isActive ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100"}">
            <span class="flex-1 font-semibold">${opt.label}</span>
            <span class="shrink-0 font-mono text-[8px] opacity-60">${pxValue}px</span>
          </button>
        `;
      })
      .join("");

    const padXOptions = spaceOptions
      .map((opt) => {
        const isActive = String(opt.value) === String(padXValue);
        const resolved = resolveSpaceLikeForDevice(state.device, opt.value);
        const pxValue = String(Math.max(0, Math.round(Number(resolved.px || 0))));
        return `
          <button type="button" data-button-field="padX" data-button-value="${opt.value}" class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[9px] ring-1 transition ${isActive ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100"}">
            <span class="flex-1 font-semibold">${opt.label}</span>
            <span class="shrink-0 font-mono text-[8px] opacity-60">${pxValue}px</span>
          </button>
        `;
      })
      .join("");

    return `
      <div class="rounded-2xl border border-slate-200/80 bg-white p-3">
        <div class="space-y-2">
          <!-- Border Width Row -->
          <div class="flex items-center gap-2 py-1.5 border-b border-slate-100">
            <span class="w-28 shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Border W.</span>
            <div class="flex gap-1 overflow-x-auto scrollbar-none min-w-0 flex-1">${borderWidthPills}</div>
            <span class="ml-auto shrink-0 font-mono text-[9px] text-slate-400 whitespace-nowrap">${borderWidthValue === "0" ? "None" : borderWidthValue + "px"}</span>
          </div>

          <!-- Radius Row -->
          <div class="flex items-center gap-2 py-1.5 border-b border-slate-100">
            <span class="w-28 shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Radius</span>
            <input type="number" min="0" step="1" data-button-field="radius" value="${radiusValue}" class="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[9px] font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-slate-300" />
            <span class="ml-auto shrink-0 font-mono text-[9px] text-slate-400 whitespace-nowrap">${radiusValue}px</span>
          </div>

          <!-- Border Color Row with Details Dropdown -->
          <details class="border-b border-slate-100">
            <summary class="flex cursor-pointer list-none items-center gap-2 py-1.5">
              <span class="w-28 shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Border C.</span>
              <span class="inline-flex flex-1 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] text-slate-700">
                <span class="h-3 w-3 shrink-0 rounded-full border border-black/10" style="background-color: ${borderColorCurrentSwatch};"></span>
                <span class="truncate font-semibold">${borderColorCurrentLabel}</span>
              </span>
              <svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z" clip-rule="evenodd" />
              </svg>
            </summary>
            <div class="mb-1.5 max-h-56 space-y-0.5 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-1 scrollbar-none">
              ${colorList}
            </div>
          </details>

          <!-- Pad Y Row -->
          <details class="border-b border-slate-100">
            <summary class="flex cursor-pointer list-none items-center gap-2 py-1.5">
              <span class="w-28 shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Pad Y</span>
              <span class="inline-flex flex-1 items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-semibold text-slate-700">
                ${padYCurrentLabel}
              </span>
              <span class="font-mono text-[9px] text-slate-400">${padYCurrentPx}px</span>
              <svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z" clip-rule="evenodd" />
              </svg>
            </summary>
            <div class="mb-1.5 max-h-56 space-y-0.5 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-1 scrollbar-none">
              ${padYOptions}
            </div>
          </details>

          <!-- Pad X Row -->
          <details>
            <summary class="flex cursor-pointer list-none items-center gap-2 py-1.5">
              <span class="w-28 shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Pad X</span>
              <span class="inline-flex flex-1 items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-semibold text-slate-700">
                ${padXCurrentLabel}
              </span>
              <span class="font-mono text-[9px] text-slate-400">${padXCurrentPx}px</span>
              <svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z" clip-rule="evenodd" />
              </svg>
            </summary>
            <div class="mb-1.5 max-h-56 space-y-0.5 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-1 scrollbar-none">
              ${padXOptions}
            </div>
          </details>
          </div>
        </div>
      </div>
    `;
  }

  function renderHoverShapeSection(cfg, colorOptions) {
    const hoverBorderWidthValue = String(cfg.hoverBorderWidth || cfg.borderWidth || 0).trim() || "0";
    const hoverRadiusValue = String(Math.max(0, Math.round(Number(resolveSpaceLikeForDevice(state.device, cfg.hoverRadius || cfg.radius || "0px").px || 0))));
    const hoverBorderColorValue = cfg.hoverBorderColor || cfg.borderColor || cfg.color;

    const borderWidthOptions = [
      { label: "None", value: "0" },
      { label: "1px", value: "1" },
      { label: "2px", value: "2" },
      { label: "3px", value: "3" },
      { label: "4px", value: "4" },
    ];

    const borderWidthPills = borderWidthOptions
      .map(
        (opt) => `
          <button type="button" data-button-field="hoverBorderWidth" data-button-value="${opt.value}" class="rounded-full px-2 py-[3px] text-[9px] font-semibold ring-1 transition whitespace-nowrap ${String(opt.value) === hoverBorderWidthValue ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100"}">
            ${opt.label}
          </button>
        `,
      )
      .join("");

    const hoverBorderColorCurrentOpt = colorOptions.find((o) => normalizeColorTokenValue(o.value) === normalizeColorTokenValue(hoverBorderColorValue));
    const hoverBorderColorCurrentSwatch = hoverBorderColorCurrentOpt?.swatch || "#cccccc";
    const hoverBorderColorCurrentLabel = hoverBorderColorCurrentOpt?.label || "Color";

    const colorList = colorOptions
      .map((opt) => {
        const isActive = normalizeColorTokenValue(opt.value) === normalizeColorTokenValue(hoverBorderColorValue);
        const colorHex = String(opt.swatch || "").toLowerCase();
        return `
          <button type="button" data-button-field="hoverBorderColor" data-button-value="${opt.value}" class="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[9px] ring-1 transition ${isActive ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100"}">
            <span class="h-3 w-3 shrink-0 rounded-full border border-black/10" style="background-color: ${opt.swatch};"></span>
            <div class="flex-1 min-w-0">
              <div class="font-semibold">${opt.label}</div>
              <div class="text-[8px] opacity-60 font-mono">${colorHex}</div>
            </div>
          </button>
        `;
      })
      .join("");

    return `
      <div class="rounded-2xl border border-slate-200/80 bg-white p-3">
        <div class="space-y-2">
          <!-- Hover Border Width Row -->
          <div class="flex items-center gap-2 py-1.5 border-b border-slate-100">
            <span class="w-28 shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Border W.</span>
            <div class="flex gap-1 overflow-x-auto scrollbar-none min-w-0 flex-1">${borderWidthPills}</div>
            <span class="ml-auto shrink-0 font-mono text-[9px] text-slate-400 whitespace-nowrap">${hoverBorderWidthValue === "0" ? "None" : hoverBorderWidthValue + "px"}</span>
          </div>

          <!-- Hover Radius Row -->
          <div class="flex items-center gap-2 py-1.5 border-b border-slate-100">
            <span class="w-28 shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Radius</span>
            <input type="number" min="0" step="1" data-button-field="hoverRadius" value="${hoverRadiusValue}" class="w-20 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[9px] font-semibold text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-slate-300" />
            <span class="ml-auto shrink-0 font-mono text-[9px] text-slate-400 whitespace-nowrap">${hoverRadiusValue}px</span>
          </div>

          <!-- Hover Border Color Row with Details Dropdown -->
          <details class="border-b border-slate-100">
            <summary class="flex cursor-pointer list-none items-center gap-2 py-1.5">
              <span class="w-28 shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Border C.</span>
              <span class="inline-flex flex-1 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] text-slate-700">
                <span class="h-3 w-3 shrink-0 rounded-full border border-black/10" style="background-color: ${hoverBorderColorCurrentSwatch};"></span>
                <span class="truncate font-semibold">${hoverBorderColorCurrentLabel}</span>
              </span>
              <svg viewBox="0 0 20 20" fill="currentColor" class="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200">
                <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z" clip-rule="evenodd" />
              </svg>
            </summary>
            <div class="mb-1.5 max-h-56 space-y-0.5 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-1 scrollbar-none">
              ${colorList}
            </div>
          </details>
          </div>
        </div>
      </div>
    `;
  }

  function renderBorderWidthRow(label, field, value, compact = false) {
    const activeValue = String(value || 0).trim() || "0";
    const options = [
      { label: "None", value: "0" },
      { label: "1px", value: "1" },
      { label: "2px", value: "2" },
      { label: "3px", value: "3" },
      { label: "4px", value: "4" },
    ];
    const containerClass = compact ? "w-fit rounded-2xl border border-slate-200/80 bg-white p-2" : "rounded-2xl border border-slate-200/80 bg-white p-2.5";
    const headerGapClass = compact ? "flex items-center justify-between gap-1.5" : "flex items-center justify-between gap-2";
    const labelClass = compact ? "text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500" : "text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500";
    const valueClass = compact ? "mt-0.5 text-[11px] font-medium text-slate-500" : "mt-0.5 text-xs font-medium text-slate-500";
    const badgeClass = compact
      ? "rounded-full bg-slate-50 px-2 py-0.5 font-mono text-[9px] font-semibold text-slate-500 ring-1 ring-slate-200/80"
      : "rounded-full bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200/80";
    const buttonClass = compact
      ? "rounded-full px-2 py-[3px] text-[9px] font-semibold ring-1 transition"
      : "rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 transition";
    const inputClass = compact
      ? "w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[12px] font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/60"
      : "w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[13px] font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/60";
    return `
            <div class="${containerClass}">
              <div class="${headerGapClass}">
                <div>
                  <p class="${labelClass}">${label}</p>
                  <p class="${valueClass}">${activeValue === "0" ? "None" : `${activeValue}px`}</p>
                </div>
                <span class="${badgeClass}">${activeValue === "0" ? "None" : `${activeValue}px`}</span>
              </div>
              <div class="mt-2 flex flex-wrap gap-1.5">
                ${options
        .map(
          (option) => `
                      <button type="button" data-button-field="${field}" data-button-value="${option.value}" class="${buttonClass} ${String(option.value) === activeValue ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100"}">
                        ${option.label}
                      </button>
                    `,
        )
        .join("")}
              </div>
              <div class="mt-2">
                <input type="number" min="0" step="1" data-button-field="${field}" value="${activeValue}" class="${inputClass}" />
              </div>
            </div>
          `;
  }

  function renderManualPxRow(label, field, value, compact = false) {
    const resolved = resolveSpaceLikeForDevice(state.device, value);
    const activeValue = String(Math.max(0, Math.round(Number(resolved.px || 0))));
    const containerClass = compact ? "w-fit rounded-2xl border border-slate-200/80 bg-white p-2" : "rounded-2xl border border-slate-200/80 bg-white p-2.5";
    const headerGapClass = compact ? "flex items-center justify-between gap-1.5" : "flex items-center justify-between gap-2";
    const labelClass = compact ? "text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500" : "text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500";
    const valueClass = compact ? "mt-0.5 text-[11px] font-medium text-slate-500" : "mt-0.5 text-xs font-medium text-slate-500";
    const badgeClass = compact
      ? "rounded-full bg-slate-50 px-2 py-0.5 font-mono text-[9px] font-semibold text-slate-500 ring-1 ring-slate-200/80"
      : "rounded-full bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200/80";
    const inputClass = compact
      ? "w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-[12px] font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/60"
      : "w-28 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[13px] font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/60";
    return `
            <div class="${containerClass}">
              <div class="${headerGapClass}">
                <div>
                  <p class="${labelClass}">${label}</p>
                  <p class="${valueClass}">${activeValue}px</p>
                </div>
                <span class="${badgeClass}">${activeValue}px</span>
              </div>
              <div class="mt-2">
                <input type="number" min="0" step="1" data-button-field="${field}" value="${activeValue}" class="${inputClass}" />
              </div>
            </div>
          `;
  }

  function renderTextRow(label, field, value, placeholder = "") {
    const activeValue = String(value || "");
    return `
            <div class="rounded-2xl border border-slate-200/80 bg-white p-2.5">
              <div class="flex items-center justify-between gap-2">
                <div>
                  <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">${label}</p>
                  <p class="mt-0.5 text-xs font-medium text-slate-500">${activeValue || placeholder || ""}</p>
                </div>
                <span class="rounded-full bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200/80">${activeValue || placeholder || ""}</span>
              </div>
              <div class="mt-2">
                <input type="text" data-button-field="${field}" value="${escapeHtml(activeValue)}" placeholder="${escapeHtml(placeholder)}" class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[13px] font-semibold text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/60" />
              </div>
            </div>
          `;
  }

  function renderChooserRow(label, field, options, active, type = "color", layout = "", compact = false) {
    let activeValue;
    if (type === "color") activeValue = normalizeColorTokenValue(active);
    else if (type === "font") activeValue = normalizeFontFamily(active);
    else if (type === "preset") activeValue = String(active || "");
    else activeValue = active;

    const containerClass = compact ? "rounded-2xl border border-slate-200/80 bg-white p-2" : "rounded-2xl border border-slate-200/80 bg-white p-2.5";
    const labelClass = compact ? "text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-500" : "text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500";

    const currentOption = options.find((o) => {
      if (type === "color") return normalizeColorTokenValue(o.value) === activeValue;
      else if (type === "preset") return String(o.value) === activeValue;
      else if (type === "space") return String(o.value) === activeValue;
      else return o.value === activeValue;
    });

    const currentLabel = currentOption?.label || selectedLabel(active, options, type);
    const currentValue = currentOption?.value || active;

    let summaryContent = "";
    if (type === "color") {
      const swatch = currentOption?.swatch || "#cccccc";
      summaryContent = `
        <span class="w-28 shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">${label}</span>
        <span class="inline-flex flex-1 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] text-slate-700">
          <span class="h-3 w-3 shrink-0 rounded-full border border-black/10" style="background-color: ${swatch};"></span>
          <span class="truncate font-semibold">${currentLabel}</span>
        </span>
        <span class="font-mono text-[9px] text-slate-400">${String(swatch).toLowerCase()}</span>
      `;
    } else if (type === "space") {
      const resolved = resolveSpaceLikeForDevice(state.device, currentValue);
      const pxValue = String(Math.max(0, Math.round(Number(resolved.px || 0))));
      summaryContent = `
        <span class="w-28 shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">${label}</span>
        <span class="inline-flex flex-1 items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-semibold text-slate-700">
          ${currentLabel}
        </span>
        <span class="font-mono text-[9px] text-slate-400">${pxValue}px</span>
      `;
    } else {
      summaryContent = `
        <span class="w-28 shrink-0 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">${label}</span>
        <span class="inline-flex flex-1 items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-semibold text-slate-700">
          ${currentLabel}
        </span>
      `;
    }

    let optionsListHtml = "";
    if (type === "color") {
      optionsListHtml = options
        .map((opt) => {
          const isActive = normalizeColorTokenValue(opt.value) === activeValue;
          const colorHex = String(opt.swatch || "").toLowerCase();
          return `
            <button type="button" data-button-field="${field}" data-button-value="${opt.value}" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[10px] ring-1 transition ${isActive ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100"}">
              <span class="h-4 w-4 shrink-0 rounded-full border border-black/10" style="background-color: ${opt.swatch};"></span>
              <div class="flex-1 min-w-0">
                <div class="font-semibold">${opt.label}</div>
                <div class="text-[9px] opacity-60 font-mono">${colorHex}</div>
              </div>
            </button>
          `;
        })
        .join("");
    } else if (type === "space") {
      optionsListHtml = options
        .map((opt) => {
          const isActive = String(opt.value) === String(activeValue);
          const resolved = resolveSpaceLikeForDevice(state.device, opt.value);
          const pxValue = String(Math.max(0, Math.round(Number(resolved.px || 0))));
          return `
            <button type="button" data-button-field="${field}" data-button-value="${opt.value}" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[10px] ring-1 transition ${isActive ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100"}">
              <span class="flex-1 font-semibold">${opt.label}</span>
              <span class="shrink-0 font-mono text-[9px] opacity-60">${pxValue}px</span>
            </button>
          `;
        })
        .join("");
    } else {
      optionsListHtml = options
        .map((opt) => {
          let isActive = false;
          if (type === "preset") isActive = String(opt.value) === activeValue;
          else isActive = opt.value === activeValue;
          return `
            <button type="button" data-button-field="${field}" data-button-value="${opt.value}" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[10px] ring-1 transition ${isActive ? "bg-slate-950 text-white ring-slate-950" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-100"}">
              <span class="flex-1 font-semibold">${opt.label}</span>
            </button>
          `;
        })
        .join("");
    }

    return `
      <details class="${containerClass}">
        <summary class="flex cursor-pointer list-none items-center gap-2 py-2">
          ${summaryContent}
          <svg viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200">
            <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06z" clip-rule="evenodd" />
          </svg>
        </summary>
        <div class="mb-2 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-2 scrollbar-none">
          ${optionsListHtml}
        </div>
      </details>
    `;
  }

  function renderPreviewButton(label, cfg, className) {
    const preset = resolveButtonTypographyPreset(cfg.typographyPreset || "button");
    const color = normalizeColorTokenValue(cfg.color);
    const bg = normalizeColorTokenValue(cfg.bg);
    const borderWidth = cfg.borderWidth ?? parseBorderToken(cfg.border, color).width;
    const border = buildBorderCss(borderWidth, cfg.borderColor || parseBorderToken(cfg.border, color).color);
    const radius = normalizeRadiusValue(cfg.radius || "");
    const padY = String(cfg.padY || "");
    const padX = String(cfg.padX || "");
    const fontFamily = String(cfg.fontFamily || preset.fontFamily);
    const fontSize = String(cfg.fontSize || preset.fontSize);
    const fontWeight = String(cfg.fontWeight || preset.fontWeight);
    const hoverBg = normalizeColorTokenValue(cfg.hoverBg || bg);
    const hoverColor = normalizeColorTokenValue(cfg.hoverColor || color);
    const hoverBorder = buildBorderCss(cfg.hoverBorderWidth ?? parseBorderToken(cfg.hoverBorder, hoverColor).width, cfg.hoverBorderColor || parseBorderToken(cfg.hoverBorder, hoverColor).color);
    const hoverRadius = normalizeRadiusValue(cfg.hoverRadius || radius);
    const hasArrow = [2, 4, 5].includes(getButtonIndex(className) || 0);
    const arrowContent = String(state.btn?.arrowContent || "?");
    const previewId = `modal-button-preview-${className}`;
    return `
            <div class="rounded-2xl border border-slate-200/80 bg-white p-2.5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">${label}</p>
                  <p class="mt-0.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-slate-400">${className}</p>
                </div>
                <span class="rounded-full bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-slate-500 ring-1 ring-slate-200">Preview live</span>
              </div>
              <style>
                #${previewId} {
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  gap: ${hasArrow ? "8px" : "0"};
                  width: auto;
                  max-width: 100%;
                  cursor: pointer;
                  transition: all 0.3s ease;
                  font-family: ${fontFamily};
                  font-size: ${fontSize};
                  font-weight: ${fontWeight};
                  color: ${color};
                  fill: ${color};
                  background-color: ${bg};
                  border: ${className === "mft-btn-1" ? `2px solid ${bg}` : border};
                  border-radius: ${radius};
                  padding: ${padY} ${padX};
                }
                #${previewId} .elementor-button-text {
                  font-family: ${fontFamily};
                }
                ${hasArrow ? `#${previewId}::after { content: ${JSON.stringify(arrowContent)}; font-size: 1em; line-height: 1; display: inline-block; transition: transform 0.3s ease; }` : ""}
                @media (hover: hover) and (pointer: fine) {
                  #${previewId}:hover {
                    color: ${hoverColor};
                    fill: ${hoverColor};
                    background-color: ${className === "mft-btn-1" ? hoverBg : hoverBg};
                    border: ${className === "mft-btn-1" ? `2px solid ${hoverBg}` : hoverBorder};
                    border-radius: ${className === "mft-btn-1" ? normalizeRadiusValue(cfg.hoverRadius || radius) : hoverRadius};
                  }
                  ${hasArrow ? `#${previewId}:hover::after { transform: translateX(4px); }` : ""}
                }
              </style>
              <div class="mt-2.5 rounded-2xl bg-slate-50 p-3">
                <div class="flex min-h-24 items-center justify-center">
                  <div id="${previewId}" data-modal-button-preview="${className}">
                    <span class="elementor-button-text">Ver más</span>
                  </div>
                </div>
              </div>
              <div class="mt-2.5 flex flex-wrap gap-1.5 text-[9px] font-semibold text-slate-500">
                <span class="rounded-full bg-slate-100 px-2 py-0.5">Text ${describeCssValue(color)}</span>
                <span class="rounded-full bg-slate-100 px-2 py-0.5">Bg ${describeCssValue(bg)}</span>
                <span class="rounded-full bg-slate-100 px-2 py-0.5">Border ${describeCssValue(border)}</span>
                <span class="rounded-full bg-slate-100 px-2 py-0.5">Hover ${describeCssValue(hoverBg)}</span>
              </div>
            </div>
          `;
  }

  function renderNormalTab(cfg) {
    const typographyOptions = getButtonTypographyPresetOptions();
    const colorOptions = getColorTokenOptions();
    const spaceOptions = getSpaceTokenOptions();
    const identitySection = [
      renderTextRow("Nombre técnico", "codeName", cfg.codeName || ctx.className, ctx.className),
    ].join("");
    const typographySection = [
      renderChooserRow("Preset tipográfico", "typographyPreset", typographyOptions, cfg.typographyPreset || "button", "preset"),
    ].join("");
    const boxSection = renderShapeSection(cfg, colorOptions, spaceOptions);
    return `
            <div class="space-y-2">
              <div>
                ${renderButtonSection("Identidad", "Nombre visible y técnico", identitySection, false)}
              </div>
              <div class="grid gap-2">
                <div>
                  ${renderButtonSection("Typography", "Preset del kit", typographySection, false)}
                </div>
                <div>
                  ${renderButtonSection(
      "Color",
      "Texto y fondo",
      `
                      <div class="grid gap-2 lg:grid-cols-2">
                        ${renderChooserRow("Text color", "color", colorOptions, cfg.color, "color")}
                        ${renderChooserRow("Background", "bg", colorOptions, cfg.bg, "color")}
                      </div>
                    `,
      false,
    )}
                </div>
              </div>
              <div>
                ${renderButtonSection("Shape", "Borde, radio y espaciado", boxSection, false, true)}
              </div>
            </div>
          `;
  }

  function renderHoverTab(cfg) {
    const colorOptions = getColorTokenOptions();
    const hoverColorSection = `
            <div class="grid gap-2 lg:grid-cols-2">
              ${renderChooserRow("Hover bg", "hoverBg", colorOptions, cfg.hoverBg, "color")}
              ${renderChooserRow("Hover text", "hoverColor", colorOptions, cfg.hoverColor, "color")}
            </div>
          `;
    const hoverShapeSection = renderHoverShapeSection(cfg, colorOptions);
    return `
            <div class="space-y-2">
              ${renderButtonSection("Hover", "Estado al pasar el ratón", `${hoverColorSection}${hoverShapeSection}`, false, true)}
            </div>
          `;
  }

  function rerender() {
    if (!ctx || !draft) return;
    const cfg = draft;
    title.textContent = `${cfg.label || getButtonDraftLabel(ctx.btnKey)} | ${devices[state.device].label}`;
    desc.textContent = activeTab === "normal" ? "Edita el estado base del botón." : "Edita el estado hover del botón.";
    const presetLabel = cfg.typographyPreset ? getTypographyStyleLabel(state.device, cfg.typographyPreset) : getFontFamilyDisplayName(cfg.fontFamily);
    activeValue.textContent = activeTab === "normal"
      ? `${presetLabel} · ${describeCssValue(cfg.color)} · ${describeCssValue(cfg.bg)} · ${describeCssValue(cfg.border)}`
      : `${describeCssValue(cfg.hoverColor)} · ${describeCssValue(cfg.hoverBg)} · ${describeCssValue(cfg.hoverBorder || cfg.border)} · ${describeCssValue(cfg.hoverRadius || cfg.radius)}`;

    preview.innerHTML = [
      renderPreviewButton("Preview", cfg, ctx.className),
    ].join("");
    const cssSnippet = buildButtonCssSnippet(ctx.className, cfg);
    fields.innerHTML = [
      renderTabBar(),
      activeTab === "normal" ? renderNormalTab(cfg) : renderHoverTab(cfg),
      renderButtonSection(
        "CSS listo",
        "Pega este bloque en tu hoja",
        `
              <div class="rounded-2xl border border-slate-200 bg-slate-950 p-3">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">Salida</p>
                  <button type="button" data-button-copy-css class="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-white/15">Copiar CSS</button>
                </div>
                <pre class="mt-2.5 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-white p-2.5 font-mono text-[10px] leading-5 text-slate-900">${escapeHtml(cssSnippet)}</pre>
              </div>
            `,
        false,
      ),
    ].join("");
  }

  function show(nextCtx) {
    lastFocus = document.activeElement;
    ctx = nextCtx;
    draft = cloneConfig(nextCtx.config);
    activeTab = "normal";
    if (del) {
      const canDelete = Number.isFinite(getButtonIndex(nextCtx.btnKey));
      del.classList.toggle("hidden", !canDelete);
      del.dataset.btnKey = canDelete ? String(nextCtx.btnKey || "") : "";
    }
    setError("");
    rerender();
    modal.classList.remove("hidden");
  }

  function saveDraft() {
    if (!ctx || !draft) return;
    draft.label = String(draft.label || "").trim();
    draft.codeName = String(draft.codeName || "").trim() || getButtonDefaultClassName(ctx.btnKey);
    const next = { ...draft };
    const preset = resolveButtonTypographyPreset(next.typographyPreset || "button");
    next.typographyPreset = preset.preset;
    next.fontFamily = preset.fontFamily;
    next.fontSize = preset.fontSize;
    next.fontWeight = preset.fontWeight;
    next.radius = `${Math.max(0, Math.round(resolveSpaceLikeForDevice(state.device, next.radius || "").px || 0))}px`;
    next.hoverRadius = `${Math.max(0, Math.round(resolveSpaceLikeForDevice(state.device, next.hoverRadius || next.radius || "").px || 0))}px`;
    next.border = buildBorderCss(next.borderWidth, next.borderColor);
    next.hoverBorder = buildBorderCss(next.hoverBorderWidth, next.hoverBorderColor);
    ctx.apply(next);
    hide();
  }

  fields.addEventListener("click", (event) => {
    const tabBtn = event.target.closest("[data-button-tab]");
    if (tabBtn && !tabBtn.disabled) {
      const nextTab = String(tabBtn.dataset.buttonTab || "normal");
      if (tabs.some((tab) => tab.key === nextTab) && nextTab !== activeTab) {
        activeTab = nextTab;
        rerender();
      }
      return;
    }
    const fieldBtn = event.target.closest("[data-button-field][data-button-value]");
    if (!fieldBtn || !draft) return;
    const field = String(fieldBtn.dataset.buttonField || "");
    const value = String(fieldBtn.dataset.buttonValue || "");
    draft =
      field === "typographyPreset"
        ? applyButtonTypographyPreset(draft, value)
        : { ...draft, [field]: value };
    rerender();
  });

  fields.addEventListener("click", async (event) => {
    const copyCssBtn = event.target.closest("[data-button-copy-css]");
    if (!copyCssBtn || !draft || !ctx) return;
    await copyText(buildButtonCssSnippet(ctx.className, draft));
  });

  fields.addEventListener("input", (event) => {
    const input = event.target.closest("[data-button-field]");
    if (!input || !draft) return;
    const field = String(input.dataset.buttonField || "");
    if (!field) return;
    const rawValue = String(input.value || "");
    draft = {
      ...draft,
      [field]: field === "radius" || field === "hoverRadius" ? `${rawValue || "0"}px` : rawValue,
    };
    if (field === "label") title.textContent = `${draft.label || getButtonDraftLabel(ctx.btnKey)} | ${devices[state.device].label}`;
    rerender();
  });

  resetDraft.addEventListener("click", () => {
    if (!ctx) return;
    draft = cloneConfig(ctx.config);
    rerender();
  });

  save.addEventListener("click", saveDraft);
  del?.addEventListener("click", () => {
    if (!ctx || !draft) return;
    const btnKey = String(ctx.btnKey || "").trim();
    const index = getButtonIndex(btnKey);
    if (!Number.isFinite(index)) return;
    if (!window.confirm("¿Eliminar este botón?")) return;
    if (index >= 6) {
      delete state.btn[btnKey];
      state.btn.customButtons = ensureCustomButtonOrder().filter((key) => key !== btnKey);
      state.btn.hiddenButtons = Array.isArray(state.btn.hiddenButtons)
        ? state.btn.hiddenButtons.filter((key) => key !== btnKey)
        : [];
    } else {
      state.btn.hiddenButtons = Array.isArray(state.btn.hiddenButtons) ? state.btn.hiddenButtons : [];
      if (!state.btn.hiddenButtons.includes(btnKey)) state.btn.hiddenButtons.push(btnKey);
    }
    hide();
    renderAll();
  });
  cancel.addEventListener("click", hide);
  close.addEventListener("click", hide);
  backdrop.addEventListener("click", hide);

  document.addEventListener("keydown", (event) => {
    if (!ctx || modal.classList.contains("hidden")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      hide();
      return;
    }
  });

  return { show, hide };
}

const buttonModal = setupButtonModal();

const STORAGE_KEY = "mft-layout-simulator-state-v2";

function getSerializableState() {
  return {
    v: 6,
    device: state.device,
    palette: state.palette,
    paletteLabels: state.paletteLabels,
    extraColors: state.extraColors,
    kitPaletteKeysPresent: state.kitPaletteKeysPresent,
    spaceClamp: state.spaceClamp,
    spaceCustomOrder: state.spaceCustomOrder,
    spaceHidden: state.spaceHidden,
    spaces: state.spaces,
    paddingBaseOrder: state.paddingBaseOrder,
    paddingCustomOrder: state.paddingCustomOrder,
    paddingHidden: state.paddingHidden,
    paddingSpaces: state.paddingSpaces,
    sectionUseByDevice: state.sectionUseByDevice,
    imageByDevice: state.imageByDevice,
    btn: state.btn,
    typographyClamp: state.typographyClamp,
    typographyByDevice: state.typographyByDevice,
  };
}

function applyImportedState(data) {
  if (!data || typeof data !== "object") return false;
  const incomingVersion = Number(data.v || 0);
  ensureSectionUseByDevice();
  ensureImageByDevice();
  ensureTypographyByDevice();
  if (data.palette && typeof data.palette === "object") state.palette = { ...state.palette, ...data.palette };
  if (Array.isArray(data.kitPaletteKeysPresent)) state.kitPaletteKeysPresent = data.kitPaletteKeysPresent.map((k) => String(k || "").trim()).filter(Boolean);
  if (Array.isArray(data.paletteLabels)) {
    const next = [];
    data.paletteLabels.forEach((item) => {
      const key = String(item?.key || "").trim();
      if (!key) return;
      const current = state.paletteLabels.find((entry) => entry.key === key);
      if (!current) return;
      next.push({
        ...current,
        ...item,
        key,
        label: String(item?.label || current.label || key).trim() || current.label || key,
      });
    });
    if (next.length) state.paletteLabels = next;
  }
  state.paletteLabels = ensureDefaultPaletteLabels(state.paletteLabels);
  if (Array.isArray(data.extraColors)) {
    const next = [];
    data.extraColors.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const id = String(item.id ?? "").trim();
      const label = String(item.label ?? "").trim();
      const value = clampHex(item.value);
      if (!label || !value) return;
      next.push({
        id: id || label,
        label: id ? buildExtraColorLabel(id, value) : label,
        value,
      });
    });
    if (next.length) state.extraColors = next;
  }
  if (data.spaceClamp && typeof data.spaceClamp === "object") state.spaceClamp = { ...state.spaceClamp, ...data.spaceClamp };
  if (Array.isArray(data.spaceCustomOrder)) {
    state.spaceCustomOrder = data.spaceCustomOrder.map((key) => sanitizeSpaceKey(key)).filter(Boolean);
  }
  if (Array.isArray(data.spaceHidden)) {
    state.spaceHidden = data.spaceHidden.map((key) => sanitizeSpaceKey(key)).filter(Boolean);
  }
  if (incomingVersion >= 6) {
    if (Array.isArray(data.paddingCustomOrder)) {
      state.paddingCustomOrder = data.paddingCustomOrder.map((key) => sanitizePaddingKey(key)).filter(Boolean);
    }
    if (Array.isArray(data.paddingBaseOrder)) {
      state.paddingBaseOrder = data.paddingBaseOrder.map((key) => sanitizePaddingKey(key)).filter(Boolean);
    }
    if (Array.isArray(data.paddingHidden)) {
      state.paddingHidden = data.paddingHidden.map((key) => sanitizePaddingKey(key)).filter(Boolean);
    }
  } else {
    state.paddingCustomOrder = [];
    state.paddingBaseOrder = [];
    state.paddingHidden = [];
    state.paddingSpaces = {};
  }
  if (data.spaces && typeof data.spaces === "object") {
    Object.entries(data.spaces).forEach(([keyRaw, incoming]) => {
      const key = sanitizeSpaceKey(keyRaw);
      if (!key || !incoming || typeof incoming !== "object") return;
      if (incoming.type === "fixed" && typeof incoming.value === "number") {
        state.spaces[key] = { type: "fixed", value: incoming.value };
      }
      if (incoming.type === "fluid" && typeof incoming.min === "number" && typeof incoming.max === "number") {
        state.spaces[key] = { type: "fluid", min: incoming.min, max: incoming.max };
      }
    });
    if (!Array.isArray(state.spaceCustomOrder)) state.spaceCustomOrder = [];
    const baseSet = new Set(spaceOrder);
    Object.keys(state.spaces)
      .filter((key) => !baseSet.has(key))
      .forEach((key) => {
        if (!state.spaceCustomOrder.includes(key)) state.spaceCustomOrder.push(key);
      });
  }
  if (incomingVersion >= 6 && data.paddingSpaces && typeof data.paddingSpaces === "object") {
    Object.entries(data.paddingSpaces).forEach(([keyRaw, incoming]) => {
      const key = sanitizePaddingKey(keyRaw);
      if (!key || !incoming || typeof incoming !== "object") return;
      if (incoming.type === "fixed" && typeof incoming.value === "number") {
        state.paddingSpaces[key] = { type: "fixed", value: incoming.value };
      }
      if (incoming.type === "fluid" && typeof incoming.min === "number" && typeof incoming.max === "number") {
        state.paddingSpaces[key] = { type: "fluid", min: incoming.min, max: incoming.max };
      }
    });
    if (!Array.isArray(state.paddingBaseOrder) || !state.paddingBaseOrder.length) {
      state.paddingBaseOrder = defaultPaddingOrder.slice();
    }
    if (!Array.isArray(state.paddingCustomOrder)) state.paddingCustomOrder = [];
    const baseSet = new Set(state.paddingBaseOrder);
    Object.keys(state.paddingSpaces)
      .filter((key) => !baseSet.has(key))
      .forEach((key) => {
        if (!state.paddingCustomOrder.includes(key)) state.paddingCustomOrder.push(key);
      });
  }
  if (data.sectionUseByDevice && typeof data.sectionUseByDevice === "object") {
    ["desktop", "tablet", "mobile"].forEach((device) => {
      const incoming = data.sectionUseByDevice?.[device];
      if (incoming && typeof incoming === "object") {
        state.sectionUseByDevice = {
          ...state.sectionUseByDevice,
          [device]: normalizeSectionUseConfig({ ...getSectionUseForDevice(device), ...incoming }),
        };
      }
    });
  } else if (data.sectionUse && typeof data.sectionUse === "object") {
    // Back-compat: if only sectionUse exists, apply it to all devices as starting point.
    ["desktop", "tablet", "mobile"].forEach((device) => {
      state.sectionUseByDevice = {
        ...state.sectionUseByDevice,
        [device]: normalizeSectionUseConfig({ ...getSectionUseForDevice(device), ...data.sectionUse }),
      };
    });
  }
  if (data.imageByDevice && typeof data.imageByDevice === "object") {
    ["desktop", "tablet", "mobile"].forEach((device) => {
      const incoming = data.imageByDevice?.[device];
      if (!incoming || typeof incoming !== "object") return;
      state.imageByDevice = {
        ...state.imageByDevice,
        [device]: normalizeImageConfig({ ...getImageForDevice(device), ...incoming }),
      };
    });
  } else {
    // Back-compat: apply legacy imageRadius/imageBox to all devices.
    const legacyRadius = typeof data.imageRadius === "string" ? normalizeSpaceLikeToken(data.imageRadius) : null;
    const legacyBox = typeof data.imageBox === "string" ? data.imageBox : null;
    if (legacyRadius || legacyBox) {
      ["desktop", "tablet", "mobile"].forEach((device) => {
        state.imageByDevice = {
          ...state.imageByDevice,
          [device]: normalizeImageConfig({
            ...getImageForDevice(device),
            ...(legacyRadius ? { radius: legacyRadius } : null),
            ...(legacyBox ? { box: legacyBox } : null),
          }),
        };
      });
    }
  }
  if (data.btn && typeof data.btn === "object") {
    state.btn = { ...state.btn, ...data.btn };
    ["btn1", "btn2", "btn3", "btn4", "btn5"].forEach((btnKey) => {
      if (!state.btn[btnKey] || typeof state.btn[btnKey] !== "object") return;
      state.btn[btnKey] = {
        ...state.btn[btnKey],
        codeName: String(state.btn[btnKey].codeName || getButtonDefaultClassName(btnKey)),
        typographyPreset: String(state.btn[btnKey].typographyPreset || "button"),
        fontFamily: normalizeFontFamily(state.btn[btnKey].fontFamily || ""),
        fontSize: normalizePx(state.btn[btnKey].fontSize || "", ""),
        fontWeight: String(state.btn[btnKey].fontWeight || ""),
        ...normalizeButtonSpacingConfig(state.btn[btnKey]),
        color: normalizeColorTokenValue(state.btn[btnKey].color),
        bg: normalizeColorTokenValue(state.btn[btnKey].bg),
        hoverBg: normalizeColorTokenValue(state.btn[btnKey].hoverBg),
        hoverColor: normalizeColorTokenValue(state.btn[btnKey].hoverColor),
        hoverBorder: String(state.btn[btnKey].hoverBorder || ""),
        radius: `${Math.max(0, Math.round(resolveSpaceLikeForDevice(state.device, state.btn[btnKey].radius || "").px || 0))}px`,
        hoverRadius: `${Math.max(0, Math.round(resolveSpaceLikeForDevice(state.device, state.btn[btnKey].hoverRadius || state.btn[btnKey].radius || "").px || 0))}px`,
      };
    });
    ensureCustomButtonOrder().forEach((btnKey) => {
      if (!state.btn[btnKey] || typeof state.btn[btnKey] !== "object") return;
      state.btn[btnKey] = normalizeButtonConfig(state.btn[btnKey], btnKey);
    });
    state.btn.hiddenButtons = Array.isArray(state.btn.hiddenButtons) ? state.btn.hiddenButtons.filter((key) => !["btn1", "btn2", "btn3", "btn4", "btn5"].includes(key)) : [];
  }
  if (data.typographyClamp && typeof data.typographyClamp === "object") {
    const from = Number(data.typographyClamp.from);
    const to = Number(data.typographyClamp.to);
    if (Number.isFinite(from) && Number.isFinite(to) && to > from) {
      state.typographyClamp = { from, to };
    }
  }
  if (data.typographyByDevice && typeof data.typographyByDevice === "object") {
    ["desktop", "tablet", "mobile"].forEach((device) => {
      const incoming = data.typographyByDevice?.[device];
      if (!incoming || typeof incoming !== "object") return;
      const current = getTypographyForDevice(device);
      const families = incoming.families && typeof incoming.families === "object" ? { ...current.families, ...incoming.families } : current.families;
      const labels = incoming.labels && typeof incoming.labels === "object" ? { ...(current.labels || {}), ...incoming.labels } : current.labels;
      const styles = incoming.styles && typeof incoming.styles === "object" ? { ...current.styles, ...incoming.styles } : current.styles;
      state.typographyByDevice = { ...state.typographyByDevice, [device]: { families, labels, styles } };
    });
  }
  // typographyCompareRight removed (UI now follows top device switcher).
  state.device = "desktop";
  return true;
}

function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getSerializableState()));
  } catch { }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = safeJsonParse(raw);
    if (!parsed.ok) return false;
    return applyImportedState(parsed.value);
  } catch {
    return false;
  }
}

function renderColorSwatches() {
  const container = document.getElementById("colorSwatches");
  const cards = buildKitColorCards();
  container.innerHTML = `
          <div class="swatch-grid grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            ${cards
      .map((card, idx) => {
        const value = card.value;
        if (!value) return "";
        const textColor = getReadableTextColor(value);
        const badgeBg = textColor === "#ffffff" ? "rgba(255,255,255,.18)" : "rgba(15,23,42,.10)";
        const varLower = String(card.varId || card.label).toLowerCase();
        const copyValue = varLower.startsWith("--") ? `var(${varLower})` : varLower;
        const editAttr = card.kind === "palette" ? `data-color-edit-key="${card.key}"` : `data-color-edit-extra="${card.index}"`;
        const labelAttr = card.kind === "palette" ? `data-color-label-key="${card.key}"` : `data-color-label-extra="${card.index}"`;
        return `
                  <div class="swatch-card">
                    <div class="swatch-preview" style="background:${value}">
                      <div class="swatch-button" style="color:${textColor}">
                        <span class="swatch-label" style="color:${textColor}">${card.label}</span>
                      </div>
                      <button type="button" ${labelAttr} class="swatch-edit-label-btn" aria-label="Editar nombre" title="Editar nombre">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                      </button>
                    </div>
                    <div class="swatch-info">
                      <span data-color-copy="${copyValue.replace(/\"/g, "&quot;")}" class="swatch-var" aria-label="Copiar ID" title="Copiar ${copyValue}">
                        ${varLower}
                      </span>
                      <button type="button" data-color-hex="${value}" class="swatch-hex">${value}</button>
                    </div>
                  </div>
                `;
      })
      .join("")}
          </div>
        `;
}

function renderSpaceScale() {
  const scale = document.getElementById("spaceScale");
  const hidden = new Set(Array.isArray(state.spaceHidden) ? state.spaceHidden : []);
  const entries = getSpaceOrderList()
    .filter((key) => !hidden.has(key))
    .map((key) => {
      const current = getCurrentSpaceValue(key);
      const token = state.spaces[key];
      const minMax = token && token.type !== "fixed" ? `${token.max}px | ${token.min}px` : "";
      return { key, current, minMax };
    });
  const maxValue = Math.max(...entries.map((entry) => entry.current), 1);
  scale.innerHTML = entries
    .map((entry) => {
      const width = Math.max(10, Math.min(100, (entry.current / maxValue) * 100));
      const valueDisplay = entry.minMax ? `${entry.minMax}` : `${entry.current}px`;
      return `
              <div class="space-row">
                <div class="space-label-group">
                  <span class="space-var-name" title="--mft-space-${entry.key}">${entry.key}</span>
                  <button type="button" data-space-copy="${entry.key}" class="space-copy-btn" aria-label="Copiar variable" title="Copiar var(--mft-space-${entry.key})">
                    ${copyIconSvg()}
                  </button>
                </div>
                <div class="space-track">
                  <div class="space-chip space-fill" style="width:${width}%;"></div>
                </div>
                <div class="space-value-group">
                  <span class="space-edit">${valueDisplay}</span>
                </div>
              </div>
            `;
    })
    .join("");
  const label = document.getElementById("spaceModeLabel");
  if (label) {
    label.textContent = "";
    label.classList.remove("cursor-pointer");
    label.removeAttribute("title");
  }
}

function renderPaddingScale() {
  const scale = document.getElementById("paddingScale");
  if (!scale) return;
  const hidden = new Set(Array.isArray(state.paddingHidden) ? state.paddingHidden : []);
  const entries = getPaddingOrderList()
    .filter((key) => !hidden.has(key))
    .map((key) => {
      const current = getPaddingCurrentValue(key);
      const token = state.paddingSpaces[key];
      const minMax = token && token.type !== "fixed" ? `${token.max}px | ${token.min}px` : "";
      return { key, current, minMax };
    });
  const maxValue = Math.max(...entries.map((entry) => entry.current), 1);
  scale.innerHTML = entries
    .map((entry) => {
      const width = Math.max(10, Math.min(100, (entry.current / maxValue) * 100));
      const valueDisplay = entry.minMax ? `${entry.minMax}` : `${entry.current}px`;
      return `
              <div class="space-row">
                <div class="space-label-group">
                  <span class="space-var-name" title="--mft-padding-${entry.key}">${entry.key}</span>
                  <button type="button" data-padding-copy="${entry.key}" class="space-copy-btn" aria-label="Copiar variable" title="Copiar var(--mft-padding-${entry.key})">
                    ${copyIconSvg()}
                  </button>
                </div>
                <div class="space-track">
                  <div class="space-chip space-fill" style="width:${width}%;"></div>
                </div>
                <div class="space-value-group">
                  <span class="space-edit">${valueDisplay}</span>
                </div>
              </div>
            `;
    })
    .join("");
  const label = document.getElementById("paddingModeLabel");
  if (label) {
    label.textContent = "";
    label.classList.remove("cursor-pointer");
    label.removeAttribute("title");
  }
}

function renderImagePreview() {
  const imagePreview = document.getElementById("imagePreview");
  const img = getImageForDevice(state.device);
  imagePreview.style.borderRadius = String(img.radius || "").trim().toLowerCase() === "none" ? "0px" : img.radius;
  imagePreview.style.height = "170px";
  imagePreview.style.width = "100%";
  const radiusRead = document.getElementById("imageRadiusRead");
  if (radiusRead) radiusRead.textContent = formatImageRadiusDisplay(state.device, img.radius);
}

function renderButtonTokens() {
  const host = document.getElementById("btnTokens");
  if (!host) return;
  const hiddenButtons = new Set(Array.isArray(state.btn.hiddenButtons) ? state.btn.hiddenButtons : []);
  const customButtons = ensureCustomButtonOrder().filter((btnKey) => !hiddenButtons.has(btnKey));

  const rows = [
    ["btn1", "mft-btn-1", state.btn.btn1],
    ["btn2", "mft-btn-2", state.btn.btn2],
    ["btn3", "mft-btn-3", state.btn.btn3],
    ["btn4", "mft-btn-4", state.btn.btn4],
    ["btn5", "mft-btn-5", state.btn.btn5],
    ...customButtons.map((btnKey) => [btnKey, `mft-btn-${getButtonIndex(btnKey)}`, state.btn[btnKey]]),
  ].filter(([btnKey]) => !hiddenButtons.has(btnKey));

  const buttonCard = (btnKey, className, cfg, editable = true, removable = false) => {
    const summary = [
      cfg.typographyPreset ? getTypographyStyleLabel(state.device, cfg.typographyPreset) : getFontFamilyDisplayName(cfg.fontFamily),
      cfg.typographyPreset ? "" : describeCssValue(cfg.fontSize),
      describeCssValue(cfg.color),
      describeCssValue(cfg.bg),
      describeCssValue(cfg.border),
      describeCssValue(cfg.radius),
    ]
      .filter(Boolean)
      .join(" · ");
    const preset = resolveButtonTypographyPreset(cfg.typographyPreset || "button");
    const previewColor = normalizeColorTokenValue(cfg.color);
    const previewBg = normalizeColorTokenValue(cfg.bg);
    const previewBorder = buildBorderCss(cfg.borderWidth ?? parseBorderToken(cfg.border, previewColor).width, cfg.borderColor || parseBorderToken(cfg.border, previewColor).color);
    const previewRadius = normalizeRadiusValue(cfg.radius || "");
    const previewPadY = String(cfg.padY || "");
    const previewPadX = String(cfg.padX || "");
    const previewFontFamily = String(cfg.fontFamily || preset.fontFamily);
    const previewFontSize = String(cfg.fontSize || preset.fontSize);
    const previewFontWeight = String(cfg.fontWeight || preset.fontWeight);

    return `
            <div data-btn-edit="${btnKey}" class="rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 hover:bg-slate-50 ${editable ? "cursor-pointer" : "cursor-default"}">
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <button type="button" data-btn-edit-name="${btnKey}" class="truncate text-left text-sm font-semibold text-slate-900 hover:text-slate-700">${editable ? getButtonDraftLabel(btnKey) : "Base global"}</button>
                  <div class="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <button type="button" data-btn-edit-code="${btnKey}" class="truncate font-mono text-[10px] font-semibold tracking-[0.08em] text-slate-500 hover:text-slate-900" title="Editar nombre técnico">${editable ? getButtonDisplayCodeName(btnKey) : "mft-btn-1"}</button>
                    <button type="button" data-btn-copy-class="${editable ? className : "mft-btn-1"}" class="truncate rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-slate-600 hover:bg-slate-200" title="Copiar ${editable ? className : "mft-btn-1"}">Copiar clase</button>
                  </div>
                </div>
                <div class="flex flex-nowrap items-center gap-1.5 whitespace-nowrap">
                  ${editable ? `<button type="button" data-btn-duplicate="${btnKey}" class="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold leading-none text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200">Duplicar</button>` : ""}
                  <span class="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold leading-none text-slate-500">${editable ? "Editar" : "Bloqueado"}</span>
                  ${removable ? `<button type="button" data-btn-remove="${btnKey}" class="shrink-0 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-semibold leading-none text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100">Eliminar</button>` : ""}
                </div>
              </div>
              <div class="mt-3 rounded-2xl p-3 ${editable ? "bg-slate-100" : "bg-slate-950 text-white"}">
                <div class="button-preview-font elementor-button ${className} inline-flex w-full items-center justify-center text-center" style="font-family:'Montserrat', sans-serif !important;">
                  <span class="elementor-button-text" style="font-family:'Montserrat', sans-serif !important;">Ver más</span>
                </div>
              </div>
              <p class="mt-3 text-[11px] leading-5 text-slate-500">${summary}</p>
            </div>
          `;
  };

  host.innerHTML = `
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-xs font-semibold tracking-[0.2em] text-slate-500">Sistema variable</p>
            <div class="flex items-center gap-2">
              <button type="button" data-btn-add class="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800">Añadir botón</button>
              <button type="button" data-btn="global" data-prop="arrowContent" class="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 hover:ring-slate-300">Arrow ${state.btn.arrowContent}</button>
            </div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            ${rows.map(([key, className, cfg]) => buttonCard(key, className, cfg, true, true)).join("")}
          </div>
        `;
}

function renderSectionUse() {
  const host = document.getElementById("sectionUseTokens");
  if (!host) return;

  const use = getSectionUseForDevice(state.device);
  const meta = document.getElementById("sectionUseMeta");
  if (meta) meta.textContent = "";

  const tokens = [
    ["containerTop", "Container top", use.containerTop],
    ["containerBottom", "Container bottom", use.containerBottom],
    ["containerLeft", "Container left", use.containerLeft],
    ["containerRight", "Container right", use.containerRight],
  ];

  const row = ([key, label, value]) => {
    const resolved = resolveSpaceLikeForDevice(state.device, value);
    const dRaw = getSectionUseForDevice("desktop")?.[key];
    const mRaw = getSectionUseForDevice("mobile")?.[key];
    const dPx = resolveSpaceLikeForDevice("desktop", dRaw).px;
    const mPx = resolveSpaceLikeForDevice("mobile", mRaw).px;
    const glance =
      Number.isFinite(dPx) && Number.isFinite(mPx)
        ? `${Math.round(dPx)}/${Math.round(mPx)}`
        : "";
    return `
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex min-w-0 items-center gap-2">
                <span class="min-w-0 truncate text-left text-xs font-semibold tracking-[0.2em] text-slate-500">${label}</span>
                <button type="button" data-secuse-copy="${key}" class="mft-icon-btn" aria-label="Copiar valor" title="Copiar ${key}">
                  ${copyIconSvg()}
                </button>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" data-secuse-edit="${key}" class="secuse-prop space-edit">${value}</button>
                ${glance ? `<span class="space-edit" title="Desktop/Mobile (px)">${glance}</span>` : ""}
              </div>
            </div>
          `;
  };

  host.innerHTML = `
          <div class="grid grid-cols-2 gap-2">
            ${tokens.map(row).join("")}
          </div>
        `;

  const padT = resolveSpaceLike(use.paddingTop);
  const padB = resolveSpaceLike(use.paddingBottom);
  const padL = resolveSpaceLike(use.paddingLeft);
  const padR = resolveSpaceLike(use.paddingRight);
  const gap = resolveSpaceLike(use.gap);
  const cT = resolveSpaceLike(use.containerTop);
  const cB = resolveSpaceLike(use.containerBottom);
  const cL = resolveSpaceLike(use.containerLeft);
  const cR = resolveSpaceLike(use.containerRight);

  const outer = document.getElementById("sectionUseOuter");
  const inner = document.getElementById("sectionUseInner");
  const stack = document.getElementById("sectionUseStack");

  if (outer) {
    outer.style.paddingTop = `${Math.max(0, padT.px)}px`;
    outer.style.paddingBottom = `${Math.max(0, padB.px)}px`;
    outer.style.paddingLeft = `${Math.max(0, padL.px)}px`;
    outer.style.paddingRight = `${Math.max(0, padR.px)}px`;
  }
  if (inner) {
    inner.style.paddingTop = `${Math.max(0, cT.px)}px`;
    inner.style.paddingBottom = `${Math.max(0, cB.px)}px`;
    inner.style.paddingLeft = `${Math.max(0, cL.px)}px`;
    inner.style.paddingRight = `${Math.max(0, cR.px)}px`;
  }
  if (stack) {
    stack.style.rowGap = `${Math.max(0, gap.px)}px`;
  }

  const read = document.getElementById("sectionUseRead");
  if (read) {
    read.textContent = "";
  }
}

function styleToCss(device, group, key) {
  const t = getTypographyForDevice(device);
  const s = t.styles[key];
  const fam = t.families[group] || t.families.body || "Inter, system-ui, sans-serif";
  if (!s) return "";
  return `font-family:${fam}; font-size:${s.size}px; font-weight:${s.weight}; line-height:${s.line}; letter-spacing:${s.space}em; color:${state.palette.text};`;
}

function styleToActualCss(device, group, key) {
  const t = getTypographyForDevice(device);
  const s = t.styles[key];
  const fam = t.families[group] || t.families.body || "Inter, system-ui, sans-serif";
  if (!s) return "";

  return `font-family:${fam}; font-size:${s.size}px; font-weight:${s.weight}; line-height:${s.line}; letter-spacing:${s.space}em; color:${state.palette.text};`;
}

function styleToPreviewCss(device, group, key) {
  const t = getTypographyForDevice(device);
  const s = t.styles[key];
  const fam = t.families[group] || t.families.body || "Inter, system-ui, sans-serif";
  if (!s) return "";

  const scaleByGroup = {
    heading: 0.42,
    links: 0.7,
    body: 0.82,
    ui: 0.9,
  };
  const scale = scaleByGroup[group] || 0.75;
  const previewSize = Math.max(13, Math.min(42, Math.round(s.size * scale)));
  const previewLine = Math.max(1.05, Math.min(1.45, Number((s.line + 0.1).toFixed(2))));

  return `font-family:${fam}; font-size:${previewSize}px; font-weight:${s.weight}; line-height:${previewLine}; letter-spacing:${s.space}em; color:${state.palette.text};`;
}

function renderTypographyStudio() {
  const host = document.getElementById("typeStudio");
  if (!host) return;

  ensureTypographyByDevice();

  const device = state.device;

  const panel = () => {
    const t = getTypographyForDevice(device);

    const heading = ["primaryHeading", "secondaryHeading", "tertiaryHeading", "subheading", "overline"];
    const links = ["menuLinkL", "menuLinkM", "menuLinkS"];
    const body = ["paragraphL", "paragraphM", "paragraphS", "paragraphXS", "button", "buttonS"];

    const groupCard = (groupKey, titleText, items) => {
      const family = t.families[groupKey] || "";
      return `
              <div class="rounded-2xl border border-pink-100 bg-white p-3">
                <div class="flex items-center justify-between gap-3 rounded-xl bg-pink-50 px-3 py-2.5">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold text-slate-900">${titleText}</p>
                    <p class="truncate font-mono text-xs font-semibold tracking-[0.08em] text-slate-500 mt-0.5">${family}</p>
                  </div>
                  <button type="button" data-type-edit="${groupKey}" class="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition" style="background-color: #C71827; hover: background-color: #A61620;">Editar</button>
                </div>
                <div class="mt-3 space-y-2">
                  ${items
          .map((key) => {
            const s = t.styles[key];
            const css = styleToActualCss(device, groupKey, key);
            const clampDecl = getTypographyClampDeclaration(key);
            const vars = getTypographyVarNames(key);
            const linePct = formatLineHeightPct(s.line);
            const text = getTypographyStyleLabel(device, key);
            const clampValues = getTypographyClampValues(key);
            const sizeDisplay = clampValues.min && clampValues.max ? `${clampValues.max}px | ${clampValues.min}px` : `${s.size}px`;
            const metricStrip = [
              ["Sz", sizeDisplay, vars?.size, `${key}:size`],
              ["Wt", `${s.weight}`, vars?.weight, `${key}:weight`],
              ["Ln", `${linePct || s.line}`, vars?.line, `${key}:line`],
            ];
            return `
                        <div class="rounded-xl border border-pink-100 bg-white p-2.5">
                          <div class="flex items-center justify-between gap-3">
                            <div class="min-w-0 flex items-center gap-2">
                              <span class="leading-none text-[13px] font-medium" style="font-family:${t.families[groupKey] || 'Inter, system-ui, sans-serif'}; color:${state.palette.text};">
                                ${text}
                              </span>
                              <button type="button" data-type-copy-allvars="${key}" class="space-copy-btn" title="Copiar todas las variables" aria-label="Copiar variables">
                                ${copyIconSvg()}
                              </button>
                            </div>
                            <div class="shrink-0">
                              <div class="flex items-center justify-end gap-1">
                                ${metricStrip
                .map(([abbr, value, variableName, field]) => {
                  const isEditable = String(field || "").includes(":");
                  const isMetricLabel = ["Sz", "Wt", "Ln"].includes(abbr);
                  return `
                                      <div class="flex items-baseline gap-1" style="padding: 5px 12px; background: #F8EAEB; border: 1px solid #F7DFE1; border-radius: 6px;">
                                        <button type="button" ${variableName ? `data-type-copy-var="${variableName}"` : ""} class="${isMetricLabel ? 'text-[11px]' : 'text-[13px]'} font-semibold text-slate-500 hover:text-slate-900 leading-none" style="line-height: 1;" title="${variableName ? `Copiar ${variableName}` : 'Clic para copiar'}">${abbr}</button>
                                        <span class="font-mono ${isMetricLabel ? 'text-[11px]' : 'text-[12px]'} font-semibold text-slate-700 cursor-pointer leading-none" style="line-height: 1;" ${variableName ? `data-type-copy-value="${variableName}"` : ""} title="${variableName ? `Copiar ${variableName}` : ''}">${value}</span>
                                      </div>
                                    `;
                })
                .join("")}
                              </div>
                            </div>
                          </div>
                          ${clampDecl ? `<button type="button" data-type-copy-clamp="${key}" class="mt-1.5 block w-full text-left font-mono text-[10px] leading-tight tracking-[0.02em] text-slate-500 hover:text-slate-700" title="${clampDecl}">${clampDecl}</button>` : ""}
                        </div>
                      `;
          })
          .join("")}
                </div>
              </div>
            `;
    };

    return `
            <div class="space-y-3">
              ${groupCard("heading", "Heading", heading)}
              ${groupCard("links", "Body / Links", links)}
              ${groupCard("body", "Body", body)}
            </div>
          `;
  };

  host.innerHTML = panel();
}

function renderAll() {
  applyThemeVariables();
  renderTokenBadge();
  renderDeviceFrame();
  renderColorSwatches();
  renderSpaceScale();
  renderPaddingScale();
  const paddingSection = document.querySelector('details[data-collapsible=\"padding-scale\"]');
  if (paddingSection) paddingSection.hidden = getPaddingOrderList().length === 0;
  renderImagePreview();
  renderButtonTokens();
  renderSectionUse();
  renderTypographyStudio();
  buttonModal.refresh?.();
  saveToLocalStorage();
}

function bindInputs() {
  document.addEventListener("click", async (event) => {
    if (!event.target.closest("#colorSwatches")) return;
    const editLabel = event.target.closest("[data-color-label-key]");
    const editMain = event.target.closest("[data-color-edit-key]");
    if (editLabel) {
      const key = String(editLabel.dataset.colorLabelKey || "").trim();
      const entry = state.paletteLabels.find((item) => item.key === key);
      if (!entry) return;
      const next = await openEditor({
        kicker: "Color",
        title: `Editar texto: ${entry.label}`,
        description: "Cambia el texto visible del color.",
        kind: "text",
        value: entry.label,
        validate: (raw) => {
          const v = String(raw || "").trim();
          return v ? { ok: true, value: v } : { ok: false, message: "El texto no puede estar vacío." };
        },
      });
      if (next === null) return;
      state.paletteLabels = state.paletteLabels.map((item) => (item.key === key ? { ...item, label: String(next) } : item));
      renderAll();
      saveToLocalStorage();
      return;
    }

    const copyBtn = event.target.closest("[data-color-copy]");
    if (copyBtn) {
      copyText(copyBtn.dataset.colorCopy || "");
      return;
    }

    const hexBtn = event.target.closest("[data-color-hex]");
    if (hexBtn) {
      copyText(hexBtn.dataset.colorHex || "");
      return;
    }

    if (editMain) {
      const key = editMain.dataset.colorEditKey;
      const current = state.palette[key];
      const next = await openEditor({
        kicker: "Color",
        title: `Editar ${key}`,
        description: "Elige un color o pega un hex.",
        kind: "color",
        value: current,
        validate: (raw) => {
          const v = clampHex(raw);
          return v ? { ok: true, value: v } : { ok: false, message: "Introduce un hex válido. Ej: #8a714c" };
        },
      });
      if (!next) return;
      state.palette[key] = next;
      renderAll();
      saveToLocalStorage();
      return;
    }

    const editExtra = event.target.closest("[data-color-edit-extra]");
    if (editExtra) {
      const idx = Number(editExtra.dataset.colorEditExtra);
      if (!Number.isFinite(idx) || idx < 0 || idx >= (state.extraColors?.length || 0)) return;
      const current = state.extraColors[idx]?.value;
      const next = await openEditor({
        kicker: "Color",
        title: `Editar ${state.extraColors[idx]?.label || "color"}`,
        description: "Elige un color o pega un hex.",
        kind: "color",
        value: current,
        validate: (raw) => {
          const v = clampHex(raw);
          return v ? { ok: true, value: v } : { ok: false, message: "Introduce un hex válido. Ej: #8a714c" };
        },
      });
      if (!next) return;
      state.extraColors = state.extraColors.map((item, currentIdx) => (currentIdx === idx ? { ...item, value: next } : item));
      renderAll();
      saveToLocalStorage();
      return;
    }

    const editExtraLabel = event.target.closest("[data-color-label-extra]");
    if (!editExtraLabel) return;
    const idx = Number(editExtraLabel.dataset.colorLabelExtra);
    if (!Number.isFinite(idx) || idx < 0 || idx >= (state.extraColors?.length || 0)) return;
    const current = String(state.extraColors[idx]?.label || "").trim();
    const next = await openEditor({
      kicker: "Color",
      title: `Editar texto: ${current || "color"}`,
      description: "Cambia el texto visible del color extra.",
      kind: "text",
      value: current,
      validate: (raw) => {
        const v = String(raw || "").trim();
        return v ? { ok: true, value: v } : { ok: false, message: "El texto no puede estar vacío." };
      },
    });
    if (next === null) return;
    state.extraColors = state.extraColors.map((item, currentIdx) => (currentIdx === idx ? { ...item, label: String(next) } : item));
    renderAll();
    saveToLocalStorage();
  });

  async function editImageRadius() {
    const currentRadius = getImageForDevice(state.device).radius;
    const resolvedRadius = resolveSpaceLikeForDevice(state.device, currentRadius);
    const current = resolvedRadius.kind === "token" ? `--${resolvedRadius.token}` : currentRadius;
    const next = await openEditor({
      kicker: "Imagen",
      title: "Radio de imagen",
      description: "Ej: --2xs, var(--mft-space-2xs), 16px o none",
      kind: "text",
      value: current,
      validate: (raw) => {
        const v = String(raw || "").trim();
        if (!v) return { ok: false, message: "No puede estar vacío." };
        return { ok: true, value: v.toLowerCase() === "none" ? "none" : v };
      },
    });
    if (!next) return;
    setImageForDevice(state.device, "radius", normalizeSpaceLikeToken(next));
    renderAll();
  }

  document.getElementById("imageRadiusBtn").addEventListener("click", editImageRadius);

  document.getElementById("spaceModeLabel").addEventListener("click", async () => {
    const fromRaw = await openEditor({
      kicker: "Espacios",
      title: "Clamp desde",
      description: "Ancho desde el que empieza a interpolar.",
      kind: "text",
      value: String(state.spaceClamp.from),
      validate: (raw) => {
        const n = Number(String(raw || "").trim());
        if (!Number.isFinite(n) || n <= 0) return { ok: false, message: "Introduce un número válido (> 0)." };
        return { ok: true, value: String(Math.round(n)) };
      },
    });
    if (!fromRaw) return;

    const toRaw = await openEditor({
      kicker: "Espacios",
      title: "Clamp hasta",
      description: "Ancho a partir del cual se queda en el máximo.",
      kind: "text",
      value: String(state.spaceClamp.to),
      validate: (raw) => {
        const n = Number(String(raw || "").trim());
        if (!Number.isFinite(n) || n <= 0) return { ok: false, message: "Introduce un número válido (> 0)." };
        return { ok: true, value: String(Math.round(n)) };
      },
    });
    if (!toRaw) return;
    const from = Math.max(0, Number(fromRaw));
    const to = Math.max(from + 1, Number(toRaw));
    if (Number.isNaN(from) || Number.isNaN(to)) return;
    state.spaceClamp.from = from;
    state.spaceClamp.to = to;
    renderAll();
  });

  document.getElementById("spaceScale").addEventListener("click", async (event) => {
    const copyBtn = event.target.closest("[data-space-copy]");
    if (copyBtn) {
      const key = copyBtn.dataset.spaceCopy;
      copyText(`var(--mft-space-${key})`);
      return;
    }

  });

  document.getElementById("btnTokens").addEventListener("click", async (event) => {
    const addBtn = event.target.closest("[data-btn-add]");
    if (addBtn) {
      const nextIndex = getNextButtonIndex();
      const btnKey = `btn${nextIndex}`;
      const defaultLabel = `Botón ${nextIndex}`;
      const label = await openEditor({
        kicker: "Botones",
        title: "Nuevo botón",
        description: "Dale un nombre antes de abrir su editor.",
        kind: "text",
        value: defaultLabel,
        validate: (raw) => {
          const v = String(raw || "").trim();
          return v ? { ok: true, value: v } : { ok: false, message: "El nombre no puede estar vacío." };
        },
      });
      if (label === null) return;
      state.btn[btnKey] = createCustomButtonConfig(String(label).trim(), btnKey);
      ensureCustomButtonOrder();
      state.btn.customButtons.push(btnKey);
      state.btn.customButtons = Array.from(new Set(state.btn.customButtons));
      renderAll();
      buttonModal.show({
        btnKey,
        className: `mft-btn-${nextIndex}`,
        config: {
          label: String(state.btn[btnKey].label || ""),
          codeName: String(state.btn[btnKey].codeName || ""),
          color: String(state.btn[btnKey].color || ""),
          bg: String(state.btn[btnKey].bg || ""),
          border: String(state.btn[btnKey].border || ""),
          borderWidth: String(state.btn[btnKey].borderWidth || ""),
          borderColor: String(state.btn[btnKey].borderColor || ""),
          radius: String(state.btn[btnKey].radius || ""),
          hoverRadius: String(state.btn[btnKey].hoverRadius || state.btn[btnKey].radius || ""),
          padY: String(state.btn[btnKey].padY || ""),
          padX: String(state.btn[btnKey].padX || ""),
          hoverBg: String(state.btn[btnKey].hoverBg || ""),
          hoverColor: String(state.btn[btnKey].hoverColor || ""),
          hoverBorder: String(state.btn[btnKey].hoverBorder || ""),
          hoverBorderWidth: String(state.btn[btnKey].hoverBorderWidth || ""),
          hoverBorderColor: String(state.btn[btnKey].hoverBorderColor || ""),
          typographyPreset: String(state.btn[btnKey].typographyPreset || "button"),
          fontFamily: String(state.btn[btnKey].fontFamily || ""),
          fontSize: String(state.btn[btnKey].fontSize || ""),
          fontWeight: String(state.btn[btnKey].fontWeight || ""),
        },
        apply: (next) => {
          state.btn[btnKey] = { ...state.btn[btnKey], ...next };
          renderAll();
        },
      });
      return;
    }

    const editName = event.target.closest("[data-btn-edit-name]");
    if (editName) {
      const btnKey = String(editName.dataset.btnEditName || "").trim();
      const config = state.btn[btnKey];
      if (!config) return;
      const current = String(config.label || getButtonDraftLabel(btnKey) || "").trim();
      const next = await openEditor({
        kicker: "Botones",
        title: "Editar nombre",
        description: "Aparece en la tarjeta y en el encabezado del modal.",
        kind: "text",
        value: current,
        validate: (raw) => {
          const v = String(raw || "").trim();
          return v ? { ok: true, value: v } : { ok: false, message: "El nombre no puede estar vacío." };
        },
      });
      if (next === null) return;
      state.btn[btnKey] = { ...state.btn[btnKey], label: String(next) };
      renderAll();
      return;
    }

    const editCodeName = event.target.closest("[data-btn-edit-code]");
    if (editCodeName) {
      const btnKey = String(editCodeName.dataset.btnEditCode || "").trim();
      const config = state.btn[btnKey];
      if (!config) return;
      const current = String(config.codeName || getButtonDefaultClassName(btnKey) || "").trim();
      const next = await openEditor({
        kicker: "Botones",
        title: "Editar nombre técnico",
        description: "Aparece como identificador visible del botón.",
        kind: "text",
        value: current,
        validate: (raw) => {
          const v = String(raw || "").trim();
          return v ? { ok: true, value: v } : { ok: false, message: "El nombre técnico no puede estar vacío." };
        },
      });
      if (next === null) return;
      state.btn[btnKey] = { ...state.btn[btnKey], codeName: String(next) };
      renderAll();
      return;
    }

    const duplicateBtn = event.target.closest("[data-btn-duplicate]");
    if (duplicateBtn) {
      event.preventDefault();
      event.stopPropagation();
      const btnKey = String(duplicateBtn.dataset.btnDuplicate || "").trim();
      const source = state.btn[btnKey];
      const sourceIndex = getButtonIndex(btnKey);
      if (!source || !Number.isFinite(sourceIndex)) return;
      const nextIndex = getNextButtonIndex();
      const nextKey = `btn${nextIndex}`;
      state.btn[nextKey] = duplicateButtonConfig(source, nextKey);
      ensureCustomButtonOrder();
      if (!state.btn.customButtons.includes(nextKey)) state.btn.customButtons.push(nextKey);
      state.btn.customButtons = Array.from(new Set(state.btn.customButtons));
      renderAll();
      setTimeout(() => {
        const nextCard = document.querySelector(`[data-btn-edit="${nextKey}"]`);
        if (nextCard && typeof nextCard.scrollIntoView === "function") {
          nextCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        buttonModal.show({
          btnKey: nextKey,
          className: `mft-btn-${nextIndex}`,
          config: {
            label: String(state.btn[nextKey].label || ""),
            codeName: String(state.btn[nextKey].codeName || ""),
            color: String(state.btn[nextKey].color || ""),
            bg: String(state.btn[nextKey].bg || ""),
            border: String(state.btn[nextKey].border || ""),
            borderWidth: String(state.btn[nextKey].borderWidth || ""),
            borderColor: String(state.btn[nextKey].borderColor || ""),
            radius: String(state.btn[nextKey].radius || ""),
            hoverRadius: String(state.btn[nextKey].hoverRadius || state.btn[nextKey].radius || ""),
            padY: String(state.btn[nextKey].padY || ""),
            padX: String(state.btn[nextKey].padX || ""),
            hoverBg: String(state.btn[nextKey].hoverBg || ""),
            hoverColor: String(state.btn[nextKey].hoverColor || ""),
            hoverBorder: String(state.btn[nextKey].hoverBorder || ""),
            hoverBorderWidth: String(state.btn[nextKey].hoverBorderWidth || ""),
            hoverBorderColor: String(state.btn[nextKey].hoverBorderColor || ""),
            typographyPreset: String(state.btn[nextKey].typographyPreset || "button"),
            fontFamily: String(state.btn[nextKey].fontFamily || ""),
            fontSize: String(state.btn[nextKey].fontSize || ""),
            fontWeight: String(state.btn[nextKey].fontWeight || ""),
          },
          apply: (next) => {
            state.btn[nextKey] = { ...state.btn[nextKey], ...next };
            renderAll();
          },
        });
      }, 0);
      return;
    }

    const removeBtn = event.target.closest("[data-btn-remove]");
    if (removeBtn) {
      const btnKey = String(removeBtn.dataset.btnRemove || "").trim();
      const index = getButtonIndex(btnKey);
      if (!window.confirm("¿Eliminar este botón?")) return;
      if (Number.isFinite(index) && index >= 6) {
        delete state.btn[btnKey];
        state.btn.customButtons = ensureCustomButtonOrder().filter((key) => key !== btnKey);
        state.btn.hiddenButtons = Array.isArray(state.btn.hiddenButtons)
          ? state.btn.hiddenButtons.filter((key) => key !== btnKey)
          : [];
      } else {
        state.btn.hiddenButtons = Array.isArray(state.btn.hiddenButtons) ? state.btn.hiddenButtons : [];
        if (!state.btn.hiddenButtons.includes(btnKey)) state.btn.hiddenButtons.push(btnKey);
      }
      renderAll();
      return;
    }

    const copyClass = event.target.closest("[data-btn-copy-class]");
    if (copyClass) {
      const value = String(copyClass.dataset.btnCopyClass || "").trim();
      if (value) await copyText(value);
      return;
    }

    const editCard = event.target.closest("[data-btn-edit]");
    if (editCard) {
      const btnKey = String(editCard.dataset.btnEdit || "").trim();
      const config = state.btn[btnKey];
      if (!config) return;
      const className = `mft-btn-${getButtonIndex(btnKey)}`;
      buttonModal.show({
        btnKey,
        className,
        config: {
          label: String(config.label || ""),
          codeName: String(config.codeName || ""),
          color: String(config.color || ""),
          bg: String(config.bg || ""),
          border: String(config.border || ""),
          borderWidth: String(config.borderWidth || ""),
          borderColor: String(config.borderColor || ""),
          radius: String(config.radius || ""),
          hoverRadius: String(config.hoverRadius || config.radius || ""),
          padY: String(config.padY || ""),
          padX: String(config.padX || ""),
          hoverBg: String(config.hoverBg || ""),
          hoverColor: String(config.hoverColor || ""),
          hoverBorder: String(config.hoverBorder || ""),
          hoverBorderWidth: String(config.hoverBorderWidth || ""),
          hoverBorderColor: String(config.hoverBorderColor || ""),
        },
        apply: (next) => {
          state.btn[btnKey] = { ...state.btn[btnKey], ...next };
          renderAll();
        },
      });
      return;
    }

    const btn = event.target.closest("[data-btn][data-prop]");
    if (!btn) return;
    const btnKey = btn.dataset.btn;
    const prop = btn.dataset.prop;

    if (btnKey === "global" && prop === "arrowContent") {
      const next = await openEditor({
        kicker: "Botones",
        title: "Contenido de flecha",
        description: 'Ej: "->" o "\\\\e977"',
        kind: "text",
        value: state.btn.arrowContent,
        validate: (raw) => {
          const v = String(raw || "").trim();
          if (!v) return { ok: false, message: "No puede estar vacío." };
          return { ok: true, value: v };
        },
      });
      if (!next) return;
      state.btn.arrowContent = next;
      renderAll();
      return;
    }

    const target = state.btn[btnKey];
    if (!target) return;
    const current = target[prop];
    const next = await openEditor({
      kicker: "Botones",
      title: `${btnKey}.${prop}`,
      description: "Pega el valor CSS tal cual (vars, px, colores, etc.).",
      kind: "text",
      value: String(current),
      validate: (raw) => {
        const v = String(raw || "").trim();
        if (!v) return { ok: false, message: "No puede estar vacío." };
        return { ok: true, value: v };
      },
    });
    if (!next) return;
    target[prop] = next;
    renderAll();
  });

  document.getElementById("sectionUseTokens").addEventListener("click", async (event) => {
    const copyBtn = event.target.closest("[data-secuse-copy]");
    if (copyBtn) {
      const key = copyBtn.dataset.secuseCopy;
      const raw = getSectionUseForDevice(state.device)[key];
      const resolved = resolveSpaceLike(raw);
      if (resolved.kind === "token") {
        copyText(`var(--mft-space-${resolved.token})`);
      } else {
        copyText(resolved.raw || "");
      }
      return;
    }

    const editBtn = event.target.closest("[data-secuse-edit]");
    if (!editBtn) return;
    const key = editBtn.dataset.secuseEdit;
    ensureSectionUseByDevice();
    const current = getSectionUseForDevice(state.device)[key];
    const next = await openEditor({
      kicker: "Uso real",
      title: `Editar ${key}`,
      description: "Usa: 5xs, xs, s... o var(--mft-space-s) o 24px. Si coincide, se convierte al token.",
      kind: "text",
      value: String(current),
      validate: (raw) => {
        const v = String(raw || "").trim();
        if (!v) return { ok: false, message: "No puede estar vacío." };
        return { ok: true, value: v };
      },
    });
    if (!next) return;
    setSectionUseForDevice(state.device, key, next);
    renderAll();
  });

  document.getElementById("exportBtn").addEventListener("click", async () => {
    const payload = JSON.stringify(getSerializableState(), null, 2);
    await copyText(payload);
    try {
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mft-layout-simulator-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch { }
  });

  document.getElementById("importBtn").addEventListener("click", () => {
    // Prefer file import. If user cancels, nothing happens.
    document.getElementById("importFile").click();
  });

  document.getElementById("kitBtn").addEventListener("click", async () => {
    const next = await openEditor({
      kicker: "Kit",
      title: "Pegar kit de Elementor",
      description: "Pega el CSS completo del kit. Leemos colores, tipografías y contenedores.",
      kind: "textarea",
      value: "",
      okLabel: "Aplicar kit",
      validate: (raw) => {
        const v = String(raw || "").trim();
        return v ? { ok: true, value: v } : { ok: false, message: "Pega primero el CSS del kit." };
      },
    });
    if (next === null) return;
    applyKitCssText(String(next));
  });

  document.getElementById("sheetBtn").addEventListener("click", async () => {
    const next = await openEditor({
      kicker: "CSS",
      title: "Pegar hoja de estilo",
      description: "Pega la hoja CSS completa. Leemos kit, espacios, paddings y botones.",
      kind: "textarea",
      value: "",
      okLabel: "Aplicar CSS",
      validate: (raw) => {
        const v = String(raw || "").trim();
        return v ? { ok: true, value: v } : { ok: false, message: "Pega primero la hoja CSS." };
      },
    });
    if (next === null) return;
    applyStylesheetCssText(String(next));
  });

  document.getElementById("importFile").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const text = await file.text();
    const parsed = safeJsonParse(text);
    if (!parsed.ok) return;
    if (applyImportedState(parsed.value)) renderAll();
  });

  document.getElementById("previewCanvas").addEventListener("click", async (event) => {
    const importPaddingBtn = event.target.closest("[data-padding-import]");
    if (importPaddingBtn) {
      event.preventDefault();
      event.stopPropagation();
      const cssText = await openClipboardImportEditor({
        kicker: "Paddings",
        title: "Pegar escala de paddings",
        description: "Si el navegador lo permite, se cargará lo último copiado. Si no, pega las variables CSS `--mft-padding-*` manualmente.",
        emptyMessage: "Pega primero el CSS de paddings.",
      });
      if (cssText === null) return;
      importPaddingScaleFromCss(String(cssText));
      renderAll();
      return;
    }

    const copyPaddingBtn = event.target.closest("[data-padding-copy]");
    if (copyPaddingBtn) {
      const key = String(copyPaddingBtn.dataset.paddingCopy || "").trim();
      if (key) copyText(`var(--mft-padding-${key})`);
      return;
    }


    const editLabel = event.target.closest("[data-color-label-key]");
    if (editLabel) {
      const key = String(editLabel.dataset.colorLabelKey || "").trim();
      const entry = state.paletteLabels.find((item) => item.key === key);
      if (!entry) return;
      const next = await openEditor({
        kicker: "Color",
        title: `Editar texto: ${entry.label}`,
        description: "Cambia el texto visible del color.",
        kind: "text",
        value: entry.label,
        validate: (raw) => {
          const v = String(raw || "").trim();
          return v ? { ok: true, value: v } : { ok: false, message: "El texto no puede estar vacío." };
        },
      });
      if (next === null) return;
      state.paletteLabels = state.paletteLabels.map((item) => (item.key === key ? { ...item, label: String(next) } : item));
      renderAll();
      saveToLocalStorage();
      return;
    }

    const editLabelExtra = event.target.closest("[data-color-label-extra]");
    if (editLabelExtra) {
      const idx = Number(editLabelExtra.dataset.colorLabelExtra);
      if (!Number.isFinite(idx) || idx < 0 || idx >= (state.extraColors?.length || 0)) return;
      const current = String(state.extraColors[idx]?.label || "").trim();
      const next = await openEditor({
        kicker: "Color",
        title: `Editar texto: ${current || "color"}`,
        description: "Cambia el texto visible del color extra.",
        kind: "text",
        value: current,
        validate: (raw) => {
          const v = String(raw || "").trim();
          return v ? { ok: true, value: v } : { ok: false, message: "El texto no puede estar vacío." };
        },
      });
      if (next === null) return;
      state.extraColors = state.extraColors.map((item, currentIdx) => (currentIdx === idx ? { ...item, label: String(next) } : item));
      renderAll();
      saveToLocalStorage();
      return;
    }

    const copyVar = event.target.closest("[data-type-copy-var]");
    if (copyVar) {
      copyText(copyVar.dataset.typeCopyVar || "");
      return;
    }

    const copyValue = event.target.closest("[data-type-copy-value]");
    if (copyValue) {
      copyText(copyValue.dataset.typeCopyValue || "");
      return;
    }

    const copyClamp = event.target.closest("[data-type-copy-clamp]");
    if (copyClamp) {
      const key = String(copyClamp.dataset.typeCopyClamp || "").trim();
      const decl = getTypographyClampDeclaration(key);
      if (decl) copyText(decl);
      return;
    }

    const copyAll = event.target.closest("[data-type-copy-allvars]");
    if (copyAll) {
      const key = String(copyAll.dataset.typeCopyAllvars || "").trim();
      const vars = getTypographyVarNames(key);
      if (!vars) return;
      copyText(`${vars.size}\n${vars.weight}\n${vars.line}`);
      return;
    }

    const editField = event.target.closest("[data-type-edit-field]");
    if (editField) {
      const raw = String(editField.dataset.typeEditField || "");
      const [styleKey, field] = raw.split(":");
      if (!styleKey || !field) return;
      ensureTypographyByDevice();
      const t = getTypographyForDevice(state.device);
      const current = t?.styles?.[styleKey];
      if (!current) return;

      const label = `${styleKey}.${field}`;
      const next = await openEditor({
        kicker: "Tipografía",
        title: label,
        description:
          field === "size"
            ? "Tamaño en px."
            : field === "weight"
              ? "Peso (100-900)."
              : field === "line"
                ? 'Line-height (ej: 1.1 o "110%").'
                : "Letter-spacing en em (ej: 0.02).",
        kind: "text",
        value:
          field === "size"
            ? String(current.size)
            : field === "weight"
              ? String(current.weight)
              : field === "line"
                ? formatLineHeightPct(current.line) || String(current.line)
                : String(current.space),
        validate: (v) => {
          if (field === "line") {
            const n = normalizeLineHeight(v, null);
            if (n === null) return { ok: false, message: "Introduce 1.1 o 110%." };
            return { ok: true, value: n };
          }
          const n = Number(String(v || "").trim());
          if (!Number.isFinite(n)) return { ok: false, message: "Número no válido." };
          if (field === "size" && n <= 0) return { ok: false, message: "Debe ser > 0." };
          if (field === "weight" && (n < 100 || n > 900)) return { ok: false, message: "Rango típico: 100-900." };
          return { ok: true, value: n };
        },
      });
      if (next === null) return;

      const updated = { ...current };
      if (field === "size") updated.size = Math.round(Number(next));
      if (field === "weight") updated.weight = Math.round(Number(next));
      if (field === "line") updated.line = Number(next);
      if (field === "space") updated.space = Number(Number(next).toFixed(4));

      state.typographyByDevice = {
        ...state.typographyByDevice,
        [state.device]: {
          ...t,
          styles: { ...t.styles, [styleKey]: updated },
        },
      };
      renderAll();
      return;
    }

    const edit = event.target.closest("[data-type-edit]");
    if (!edit) return;
    const groupKey = String(edit.dataset.typeEdit || "").trim();
    if (!["heading", "links", "body"].includes(groupKey)) return;

    const keysByGroup = {
      heading: ["primaryHeading", "secondaryHeading", "tertiaryHeading", "subheading", "overline"],
      links: ["menuLinkL", "menuLinkM", "menuLinkS"],
      body: ["paragraphL", "paragraphM", "paragraphS", "paragraphXS", "button", "buttonS"],
    };
    typeModal.show({ device: state.device, groupKey, keys: keysByGroup[groupKey] || [] });
  });
}

renderStaticUI();
loadFromLocalStorage();
migrateTypographyKitLineHeights();
bindInputs();
renderAll();

/* ELEMENTOR KIT */
function displayElementorKitAndStyleCSS() {
  // Send a message to the window's scope so that main.js can capture it
  window.postMessage({ accion: "REQUEST_DATA_FROM_EXTENSION" }, "*");
  
  // Listen for the response from the extension containing the data 
  window.addEventListener("message", (event) => {
    // Validamos que el mensaje provenga de nuestra extensión y no de otro script
    if (event.data && event.data.origin === "FROM_CONTENT_SCRIPT") {
      const inputTextarea = document.getElementById("editorTextarea");
      // Overwrite Kit CSS values
      inputTextarea.value = event.data.elementorKit;
      inputTextarea.textContent = event.data.elementorKit;
      // Apply Elementor Kit      
      applyKitCssText(String(event.data.elementorKit));
      // Use a `setTimeout` because the textarea input is the same for both Elementor Kit CSS and style.css
      setTimeout(()=>{
        inputTextarea.value = event.data.styleCSS;
        inputTextarea.textContent = event.data.styleCSS;
        applyStylesheetCssText(String(event.data.styleCSS));        
      },300);
    }
  });
}
window.addEventListener("load", displayElementorKitAndStyleCSS);
/* ELEMENTOR KIT */
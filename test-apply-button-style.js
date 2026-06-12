// Simulate applyButtonStyleFromCss for btn5

const css = `
.elementor-button.mft-btn-5 {
    color: var(--e-global-color-text);
    background-color: transparent;
    border: 2px solid var(--e-global-color-text);
    border-radius: 0px;
    padding: var(--mft-space-2xs) var(--mft-space-xs);
}

@media (hover: hover) and (pointer: fine) {
    .elementor-button.mft-btn-5:hover {
        color: var(--e-global-color-47eea86e);
        background-color: var(--e-global-color-text);
        border: 2px solid var(--e-global-color-text);
    }
}
`;

function stripCssComments(text) {
  return String(text || "").replace(/\/\*[\s\S]*?\*\//g, "");
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

function findButtonCssBlock(cssText, className, pseudo = "") {
  const text = stripCssComments(cssText);
  const selector = pseudo ? `\\.elementor-button\\.${className}${pseudo}` : `\\.elementor-button\\.${className}`;
  const regex = new RegExp(`${selector}\\s*\\{([\\s\\S]*?)\\}`, "i");
  console.log(`  Regex: ${regex}`);
  const match = text.match(regex);
  if (match) {
    console.log(`  Found! Captured: "${match[1].slice(0, 50)}..."`);
    return match[1];
  }
  console.log(`  NOT FOUND`);
  return "";
}

console.log("=== Simulating applyButtonStyleFromCss ===\n");

const cssText = css;
const btnKey = "btn5";
const className = "mft-btn-5";

console.log("Finding base block:");
const baseBlockText = findButtonCssBlock(cssText, className);
const baseBlock = parseCssDeclarations(baseBlockText);
console.log("Base block declarations:");
console.log(JSON.stringify(baseBlock, null, 2));

console.log("\nFinding hover block:");
const hoverBlockText = findButtonCssBlock(cssText, className, ":hover");
const hoverBlock = parseCssDeclarations(hoverBlockText);
console.log("Hover block declarations:");
console.log(JSON.stringify(hoverBlock, null, 2));

console.log("\n=== Final state that would be set ===");
const config = {};
if (baseBlock["font-family"]) config.fontFamily = baseBlock["font-family"];
if (baseBlock["font-size"]) config.fontSize = baseBlock["font-size"];
if (baseBlock["font-weight"]) config.fontWeight = baseBlock["font-weight"];
if (baseBlock.color) config.color = baseBlock.color;
if (baseBlock["background-color"]) config.bg = baseBlock["background-color"];
if (baseBlock.border) config.border = baseBlock.border;
if (baseBlock["border-radius"]) config.radius = baseBlock["border-radius"];
if (baseBlock.padding) config.padY = baseBlock.padding.split(" ")[0];
if (baseBlock.padding) config.padX = baseBlock.padding.split(" ")[1] || baseBlock.padding.split(" ")[0];

if (hoverBlock.color) config.hoverColor = hoverBlock.color;
if (hoverBlock["background-color"]) config.hoverBg = hoverBlock["background-color"];
if (hoverBlock.border) config.hoverBorder = hoverBlock.border;
if (hoverBlock["border-radius"]) config.hoverRadius = hoverBlock["border-radius"];

console.log(JSON.stringify(config, null, 2));

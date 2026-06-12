// Full test for btn5 with exact Bommahouse CSS
const css = `
/***** BTN - 5 *****/
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
  const match = text.match(regex);
  return match ? match[1] : "";
}

console.log("=== Testing btn5 CSS Block Extraction ===\n");

const baseBlock = parseCssDeclarations(findButtonCssBlock(css, "mft-btn-5"));
console.log("Base block (using findButtonCssBlock):");
console.log(JSON.stringify(baseBlock, null, 2));

const hoverBlock = parseCssDeclarations(findButtonCssBlock(css, "mft-btn-5", ":hover"));
console.log("\nHover block (using findButtonCssBlock):");
console.log(JSON.stringify(hoverBlock, null, 2));

// Test with regexes
console.log("\n\n=== Testing with Regexes ===\n");

const text = stripCssComments(css);
const buttonBlockRegex = /\.elementor-button\.mft-btn-(\d+)(?!\w)?\s*\{([^}]*)\}/gi;
const mediaHoverBlockRegex = /@media\s*[^{]*\{\s*\.elementor-button\.mft-btn-(\d+):hover\s*\{([^}]*)\}/gi;
const hoverBlockRegex = /\.elementor-button\.mft-btn-(\d+):hover\s*\{([^}]*)\}/gi;

let match = buttonBlockRegex.exec(text);
if (match) {
  console.log("Base block (buttonBlockRegex):");
  console.log(JSON.stringify(parseCssDeclarations(match[2]), null, 2));
}

match = hoverBlockRegex.exec(text);
if (match) {
  console.log("\nHover block (hoverBlockRegex - outside @media):");
  console.log(JSON.stringify(parseCssDeclarations(match[2]), null, 2));
} else {
  console.log("\nHover block (hoverBlockRegex) - NOT FOUND");
}

match = mediaHoverBlockRegex.exec(text);
if (match) {
  console.log("\nHover block (mediaHoverBlockRegex - inside @media):");
  console.log(JSON.stringify(parseCssDeclarations(match[2]), null, 2));
} else {
  console.log("\nHover block (mediaHoverBlockRegex) - NOT FOUND");
}

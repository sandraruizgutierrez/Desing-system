// Full test with btn5 from the Bommahouse stylesheet
const css = `
/***** BTN - 2 *****/
.elementor-button.mft-btn-2 {
    color: var(--e-global-color-47eea86e);
    fill: var(--e-global-color-47eea86e);
    background-color: var(--e-global-color-primary);
    border: 2px solid var(--e-global-color-primary);
    border-radius: 160px;
}

@media (hover: hover) and (pointer: fine) {
    .elementor-button.mft-btn-2:hover {
        fill: var(--e-global-color-47eea86e);
        background-color: var(--e-global-color-13f4851a);
        border: 2px solid var(--e-global-color-13f4851a);
    }
}

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

function testParsing() {
  const text = stripCssComments(css);

  const buttonBlockRegex = /\.elementor-button\.mft-btn-(\d+)(?!\w)?\s*\{([^}]*)\}/gi;
  const hoverBlockRegex = /\.elementor-button\.mft-btn-(\d+):hover\s*\{([^}]*)\}/gi;
  const mediaHoverBlockRegex = /@media\s*[^{]*\{\s*\.elementor-button\.mft-btn-(\d+):hover\s*\{([^}]*)\}/gi;
  const collected = new Map();

  console.log("=== Testing Button CSS Parsing (with btn5) ===\n");

  let match = buttonBlockRegex.exec(text);
  console.log("Base blocks found:");
  while (match) {
    const btnKey = `btn${Number(match[1])}`;
    const declarations = parseCssDeclarations(match[2]);
    console.log(`\n${btnKey}:`);
    console.log(JSON.stringify(declarations, null, 2));
    collected.set(btnKey, { base: match[2] || "", hover: "" });
    match = buttonBlockRegex.exec(text);
  }

  console.log("\n\nHover blocks found (outside @media):");
  match = hoverBlockRegex.exec(text);
  while (match) {
    const btnKey = `btn${Number(match[1])}`;
    const declarations = parseCssDeclarations(match[2]);
    console.log(`\n${btnKey}:hover:`);
    console.log(JSON.stringify(declarations, null, 2));
    const prev = collected.get(btnKey) || { base: "", hover: "" };
    prev.hover = match[2] || "";
    collected.set(btnKey, prev);
    match = hoverBlockRegex.exec(text);
  }

  console.log("\n\nHover blocks found (inside @media):");
  match = mediaHoverBlockRegex.exec(text);
  while (match) {
    const btnKey = `btn${Number(match[1])}`;
    const declarations = parseCssDeclarations(match[2]);
    console.log(`\n${btnKey}:hover (from @media):`);
    console.log(JSON.stringify(declarations, null, 2));
    const prev = collected.get(btnKey) || { base: "", hover: "" };
    if (!prev.hover) prev.hover = match[2] || "";
    collected.set(btnKey, prev);
    match = mediaHoverBlockRegex.exec(text);
  }

  console.log("\n\n=== Final Collected Map ===");
  collected.forEach((blocks, btnKey) => {
    console.log(`\n${btnKey}:`);
    console.log(`  base: ${blocks.base.slice(0, 50)}...`);
    console.log(`  hover: ${blocks.hover.slice(0, 50)}...`);
  });
}

testParsing();

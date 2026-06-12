// Debug btn5 parsing issue

function getButtonIndex(btnKey) {
  const match = String(btnKey || "").match(/^btn(\d+)$/i);
  return match ? Number(match[1]) : null;
}

const testKeys = ["btn1", "btn2", "btn3", "btn4", "btn5", "btn6"];

console.log("=== Testing getButtonIndex ===");
testKeys.forEach(key => {
  const index = getButtonIndex(key);
  const shouldProcess = Number.isFinite(index) && index <= 5;
  console.log(`${key}: index=${index}, shouldProcess=${shouldProcess}`);
});

// Test the collected map logic
const css = `
.elementor-button.mft-btn-2 { color: red; }
.elementor-button.mft-btn-5 { color: blue; }
`;

function stripCssComments(text) {
  return String(text || "").replace(/\/\*[\s\S]*?\*\//g, "");
}

const text = stripCssComments(css);
const buttonBlockRegex = /\.elementor-button\.mft-btn-(\d+)(?!\w)?\s*\{([^}]*)\}/gi;
const collected = new Map();

let match = buttonBlockRegex.exec(text);
while (match) {
  const btnKey = `btn${Number(match[1])}`;
  console.log(`Found: ${btnKey}`);
  collected.set(btnKey, { base: match[2] || "", hover: "" });
  match = buttonBlockRegex.exec(text);
}

console.log("\n=== Processing collected buttons ===");
collected.forEach((blocks, btnKey) => {
  const index = getButtonIndex(btnKey);
  const willProcess = Number.isFinite(index) && index <= 5;
  console.log(`${btnKey}: index=${index}, willProcess=${willProcess}`);
});

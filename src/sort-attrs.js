import { groupOf } from "./groups.js";
import { positionOf } from "./order-map.js";

function isElement(node) {
  // Prettier ≥3.3 uses `kind`; Prettier 3.2.x uses `type`
  return node.kind === "element" || node.type === "element";
}

function sortAttrs(attrs, orderMap) {
  return [...attrs].sort((a, b) => {
    // Guard: skip nodes without a name (shouldn't happen but be defensive)
    if (!a.name || !b.name) return 0;

    const pa = orderMap ? positionOf(a.name, orderMap) : groupOf(a.name);
    const pb = orderMap ? positionOf(b.name, orderMap) : groupOf(b.name);

    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });
}

export function walkAndSort(node, orderMap = null) {
  if (!node) return;

  if (isElement(node) && Array.isArray(node.attrs) && node.attrs.length > 1) {
    node.attrs = sortAttrs(node.attrs, orderMap);
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walkAndSort(child, orderMap);
    }
  }
}

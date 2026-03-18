import { groupOf } from "./groups.js";

function isElement(node) {
  // Prettier ≥3.3 uses `kind`; Prettier 3.2.x uses `type`
  return node.kind === "element" || node.type === "element";
}

function sortAttrs(attrs) {
  return [...attrs].sort((a, b) => {
    // Guard: skip nodes without a name (shouldn't happen but be defensive)
    if (!a.name || !b.name) return 0;
    const ga = groupOf(a.name);
    const gb = groupOf(b.name);
    if (ga !== gb) return ga - gb;
    // Stable alphabetical secondary sort within a group
    return a.name.localeCompare(b.name);
  });
}

export function walkAndSort(node) {
  if (!node) return;

  if (isElement(node) && Array.isArray(node.attrs) && node.attrs.length > 1) {
    node.attrs = sortAttrs(node.attrs);
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walkAndSort(child);
    }
  }
}

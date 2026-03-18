"use strict";

const { groupOf } = require("./groups");

function sortAttrs(attrs) {
  return [...attrs].sort((a, b) => {
    const ga = groupOf(a.name);
    const gb = groupOf(b.name);
    if (ga !== gb) return ga - gb;
    // Stable alphabetical secondary sort within a group
    return a.name.localeCompare(b.name);
  });
}

function walkAndSort(node) {
  if (!node) return;

  // Prettier's Angular HTML AST uses `kind` (not `type`) on its nodes
  if (node.kind === "element" && Array.isArray(node.attrs) && node.attrs.length > 1) {
    node.attrs = sortAttrs(node.attrs);
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      walkAndSort(child);
    }
  }
}

module.exports = { walkAndSort, sortAttrs };

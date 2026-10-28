import { groupOf } from "./groups.js";
import { positionOf } from "./order-map.js";

function isElement(node) {
  // Prettier ≥3.3 uses `kind`; Prettier 3.2.x uses `type`
  return node.kind === "element" || node.type === "element";
}

function isComment(node) {
  return node?.kind === "comment" || node?.type === "comment";
}

function isWhitespaceText(node) {
  return (node?.kind === "text" || node?.type === "text") && !node.value?.trim();
}

function compareAttrs(a, b, orderMap) {
  // Guard: skip nodes without a name (shouldn't happen but be defensive)
  if (!a.name || !b.name) return 0;

  const pa = orderMap ? positionOf(a.name, orderMap) : groupOf(a.name);
  const pb = orderMap ? positionOf(b.name, orderMap) : groupOf(b.name);

  if (pa !== pb) return pa - pb;
  return a.name.localeCompare(b.name);
}

function sortAttrs(attrs, orderMap) {
  return [...attrs].sort((a, b) => compareAttrs(a, b, orderMap));
}

const startOf = (node) => node.sourceSpan.start.offset;

function cloneWithOffset(obj, offset) {
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj, { offset });
}

/**
 * Returns a copy of `span` moved so it starts at `offset`. The original span
 * is kept on the node as `originalSourceSpan` so locStart/locEnd stay accurate.
 */
function moveSpan(span, offset) {
  const shift = offset - span.start.offset;
  const moved = Object.assign(Object.create(Object.getPrototypeOf(span)), span);
  for (const key of ["start", "end", "fullStart"]) {
    if (span[key]) moved[key] = cloneWithOffset(span[key], span[key].offset + shift);
  }
  return moved;
}

/**
 * Angular 22 allows `// line` and `/* block *\/` comments between attributes.
 * Prettier keeps them in `startTagComments` and, when printing, interleaves
 * them with `attrs` by source offset — which would undo our sort.
 *
 * Each comment is treated as a leading comment of the attribute that follows
 * it (comments after the last attribute stay at the end). The comment+attribute
 * units are sorted together, then every node's source span is reassigned from
 * the pool of original start offsets so Prettier's offset sort reproduces the
 * new order.
 */
function sortAttrsWithComments(node, orderMap) {
  const comments = [...node.startTagComments].sort((a, b) => startOf(a) - startOf(b));
  const attrs = [...node.attrs].sort((a, b) => startOf(a) - startOf(b));

  const units = [];
  let ci = 0;
  for (const attr of attrs) {
    const leading = [];
    while (ci < comments.length && startOf(comments[ci]) < startOf(attr)) {
      leading.push(comments[ci++]);
    }
    units.push({ attr, leading });
  }
  const trailing = comments.slice(ci);

  units.sort((a, b) => compareAttrs(a.attr, b.attr, orderMap));

  const ordered = [...units.flatMap((u) => [...u.leading, u.attr]), ...trailing];
  const offsets = ordered.map(startOf).sort((a, b) => a - b);

  ordered.forEach((n, i) => {
    if (startOf(n) === offsets[i]) return;
    n.originalSourceSpan ??= n.sourceSpan;
    n.sourceSpan = moveSpan(n.sourceSpan, offsets[i]);
  });

  node.attrs = units.map((u) => u.attr);
  node.startTagComments = ordered.filter((n) => !node.attrs.includes(n));
}

function hasIgnoreAttributeComment(prev) {
  return isComment(prev) && /^\s*prettier-ignore-attribute\b/.test(prev.value ?? "");
}

export function walkAndSort(node, orderMap = null, prev = null) {
  if (!node) return;

  if (isElement(node) && Array.isArray(node.attrs) && node.attrs.length > 1) {
    if (Array.isArray(node.startTagComments) && node.startTagComments.length > 0) {
      // Prettier prints ignored attributes by slicing the source at their span,
      // so we can't move spans around here — leave the element as written.
      if (!hasIgnoreAttributeComment(prev)) sortAttrsWithComments(node, orderMap);
    } else {
      node.attrs = sortAttrs(node.attrs, orderMap);
    }
  }

  if (Array.isArray(node.children)) {
    let prevSibling = null;
    for (const child of node.children) {
      walkAndSort(child, orderMap, prevSibling);
      if (!isWhitespaceText(child)) prevSibling = child;
    }
  }
}

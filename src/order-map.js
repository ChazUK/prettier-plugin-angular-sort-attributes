import { groupOf, TOKEN_TO_GROUPS } from "./groups.js";

/**
 * Builds a lookup map from a Prettier `array: true` option value.
 * Returns null when the option is empty (signals: use default group ordering).
 *
 * @param {Array<{value: string[]}>} rawOption - Prettier wraps array options as [{ value: [...] }]
 */
export function buildOrderMap(rawOption) {
  // Prettier delivers `array: true` options as a plain string[].
  // An empty array (the default) means: use the built-in group ordering.
  if (!rawOption || rawOption.length === 0) return null;
  const entries = rawOption;

  const groupPositions = new Map();
  const attrPositions = new Map();

  entries.forEach((entry, index) => {
    const groups = TOKEN_TO_GROUPS[entry];
    if (groups) {
      for (const g of groups) {
        if (!groupPositions.has(g)) groupPositions.set(g, index);
      }
    } else {
      if (!attrPositions.has(entry)) attrPositions.set(entry, index);
    }
  });

  return { groupPositions, attrPositions };
}

/**
 * Returns the sort position for an attribute name given a custom order map.
 * Specific attribute names take precedence over group membership.
 * Returns Infinity for attributes not covered by the custom order.
 */
export function positionOf(attrName, map) {
  const attrPos = map.attrPositions.get(attrName);
  if (attrPos !== undefined) return attrPos;

  const groupPos = map.groupPositions.get(groupOf(attrName));
  if (groupPos !== undefined) return groupPos;

  return Infinity;
}

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

  return { groupPositions, attrPositions, length: entries.length };
}

/**
 * Returns the sort position for an attribute name given a custom order map.
 * Specific attribute names take precedence over group membership.
 * Attributes not covered by the custom order are placed after all specified
 * entries, preserving their default group ordering amongst themselves.
 */
export function positionOf(attrName, map) {
  const attrPos = map.attrPositions.get(attrName);
  if (attrPos !== undefined) return attrPos;

  const groupId = groupOf(attrName);
  const groupPos = map.groupPositions.get(groupId);
  if (groupPos !== undefined) return groupPos;

  // Not in custom order: offset by the number of custom entries so these
  // always follow specified items, then use the default group number to
  // preserve relative ordering between unspecified attributes.
  return map.length + groupId;
}

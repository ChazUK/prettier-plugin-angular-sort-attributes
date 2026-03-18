import { htmlElementAttributes } from "html-element-attributes";

export const TOKEN_TO_GROUPS = {
  "<STRUCTURAL_DIRECTIVES>": [0],
  "<ANIMATION_TRIGGERS>": [1],
  "<ELEMENT_REFS>": [2],
  "<HTML_ATTRIBUTES>": [3],
  "<INPUTS>": [4, 5],
  "<TWO_WAY_BINDINGS>": [6],
  "<OUTPUTS>": [7],
};

// Build the set of all known HTML attributes from the spec-derived package.
// aria-* and data-* are patterns so they're handled separately via prefix checks below.
const KNOWN_HTML_ATTRS = new Set(Object.values(htmlElementAttributes).flat());

/**
 * Returns the sort group (0-7) for an attribute name.
 *
 * 0 - Structural directives  (*ngIf, *ngFor …)
 * 1 - Animation triggers      (@fade, [@fade] …)
 * 2 - Element references      (#myRef)
 * 3 - Standard HTML attributes (class, id, aria-*, data-* …)
 * 4 - Non-interpolated string inputs (customProp="value")
 * 5 - Property bindings       ([bar]="…")
 * 6 - Two-way bindings        ([(ngModel)]="…")
 * 7 - Event bindings / outputs ((click)="…")
 */
export function groupOf(name) {
  if (name.startsWith("*")) return 0;
  // Check [@ before plain [ to avoid misclassifying animation bindings as property bindings.
  // Check [( before [ for the same reason with two-way bindings.
  if (name.startsWith("@") || name.startsWith("[@")) return 1;
  if (name.startsWith("#")) return 2;
  if (name.startsWith("[(")) return 6;
  if (name.startsWith("(")) return 7;
  if (name.startsWith("[")) return 5;
  if (
    KNOWN_HTML_ATTRS.has(name) ||
    name.startsWith("aria-") ||
    name.startsWith("data-")
  )
    return 3;
  return 4;
}

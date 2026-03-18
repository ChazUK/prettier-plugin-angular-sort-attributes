"use strict";

// Standard HTML attributes that belong to group 3.
// Custom component inputs passed as plain strings fall into group 4.
const KNOWN_HTML_ATTRS = new Set([
  // Global attributes
  "accesskey", "autocapitalize", "autofocus", "class", "contenteditable",
  "dir", "draggable", "enterkeyhint", "hidden", "id", "inputmode", "is",
  "itemid", "itemprop", "itemref", "itemscope", "itemtype", "lang", "nonce",
  "part", "role", "slot", "spellcheck", "style", "tabindex", "title",
  "translate",
  // Form
  "accept", "action", "autocomplete", "capture", "checked", "cols",
  "dirname", "disabled", "enctype", "for", "form", "formaction",
  "formenctype", "formmethod", "formnovalidate", "formtarget", "list",
  "max", "maxlength", "method", "min", "minlength", "multiple", "name",
  "novalidate", "pattern", "placeholder", "readonly", "required", "rows",
  "selected", "size", "step", "type", "value", "wrap",
  // Media / link / meta
  "alt", "async", "charset", "cite", "content", "controls", "coords",
  "crossorigin", "datetime", "decoding", "default", "defer", "download",
  "headers", "height", "high", "href", "hreflang", "http-equiv",
  "importance", "integrity", "ismap", "kind", "label", "loading", "loop",
  "low", "media", "muted", "open", "optimum", "ping", "poster", "preload",
  "referrerpolicy", "rel", "reversed", "sandbox", "scope", "shape", "span",
  "src", "srcdoc", "srclang", "srcset", "start", "target", "usemap",
  "width",
  // Table
  "align", "border", "cellpadding", "cellspacing", "colspan", "rowspan",
  "valign",
]);

/**
 * Returns the sort group (0–7) for an attribute name.
 *
 * 0 – Structural directives  (*ngIf, *ngFor …)
 * 1 – Animation triggers      (@fade, [@fade] …)
 * 2 – Element references      (#myRef)
 * 3 – Standard HTML attributes (class, id, aria-*, data-* …)
 * 4 – Non-interpolated string inputs (customProp="value")
 * 5 – Interpolated / property bindings ([bar]="…")
 * 6 – Two-way bindings        ([(ngModel)]="…")
 * 7 – Event bindings / outputs ((click)="…")
 */
function groupOf(name) {
  if (name.startsWith("*")) return 0;
  // Check [@  before plain [ to avoid misclassifying animation bindings as property bindings.
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

module.exports = { groupOf, KNOWN_HTML_ATTRS };

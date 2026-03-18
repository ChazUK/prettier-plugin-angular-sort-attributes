# @chazuk/prettier-plugin-angular-sort-attributes

A [Prettier](https://prettier.io) plugin that sorts attributes on Angular HTML template elements into a consistent, readable order.

## Installation

```sh
npm install --save-dev @chazuk/prettier-plugin-angular-sort-attributes
```

## Configuration

Add the plugin to your Prettier config:

```json
{
  "plugins": ["@chazuk/prettier-plugin-angular-sort-attributes"]
}
```

Works on `.html` files and inline `template` strings inside TypeScript component files.

## Default attribute order

Attributes are grouped and sorted in this order:

| # | Group | Examples |
|---|---|---|
| 1 | Structural directives | `*ngIf`, `*ngFor`, `*ngTemplateOutlet` |
| 2 | Animation triggers | `@fade`, `[@slide]="state"` |
| 3 | Element references | `#myComponent` |
| 4 | Standard HTML attributes | `class`, `id`, `style`, `aria-*`, `data-*` |
| 5 | Non-interpolated string inputs | `foo="bar"` |
| 6 | Property bindings | `[value]="theValue"` |
| 7 | Two-way bindings | `[(ngModel)]="email"` |
| 8 | Event bindings | `(click)="onClick()"` |

Within each group, attributes are sorted alphabetically.

```html
<!-- before -->
<my-app-component
  (click)="onClick($event)"
  [(ngModel)]="fooBar"
  class="foo"
  #myComponent
  [bar]="theBar"
  @fade
  foo="bar"
  *ngIf="shouldShow"
  (someEvent)="onSomeEvent($event)"
/>

<!-- after -->
<my-app-component
  *ngIf="shouldShow"
  @fade
  #myComponent
  class="foo"
  foo="bar"
  [bar]="theBar"
  [(ngModel)]="fooBar"
  (click)="onClick($event)"
  (someEvent)="onSomeEvent($event)"
/>
```

## Custom order

Use `angularSortAttributesOrder` to override the ordering with group tokens, specific attribute names, or a mix of both.

**Available group tokens:**

| Token | Covers |
|---|---|
| `<STRUCTURAL_DIRECTIVES>` | `*ngIf`, `*ngFor`, … |
| `<ANIMATION_TRIGGERS>` | `@fade`, `[@slide]="state"`, … |
| `<ELEMENT_REFS>` | `#myRef` |
| `<HTML_ATTRIBUTES>` | `class`, `id`, `aria-*`, `data-*`, … |
| `<INPUTS>` | `foo="bar"`, `[value]="v"` (string inputs + property bindings) |
| `<TWO_WAY_BINDINGS>` | `[(ngModel)]="…"` |
| `<OUTPUTS>` | `(click)="…"` |

### Reordering groups

Swap the position of entire groups — here outputs come first:

```json
{
  "angularSortAttributesOrder": [
    "<OUTPUTS>",
    "<STRUCTURAL_DIRECTIVES>",
    "<ANIMATION_TRIGGERS>",
    "<ELEMENT_REFS>",
    "<HTML_ATTRIBUTES>",
    "<INPUTS>",
    "<TWO_WAY_BINDINGS>"
  ]
}
```

```html
<!-- before -->
<button *ngIf="show" class="btn" [disabled]="loading" (click)="submit()" />

<!-- after -->
<button (click)="submit()" *ngIf="show" class="btn" [disabled]="loading" />
```

### Promoting specific attributes to the top

List attribute names before the group tokens to pull them out of their group and pin them first:

```json
{
  "angularSortAttributesOrder": [
    "id",
    "class",
    "<STRUCTURAL_DIRECTIVES>",
    "<HTML_ATTRIBUTES>",
    "<INPUTS>",
    "<TWO_WAY_BINDINGS>",
    "<OUTPUTS>"
  ]
}
```

```html
<!-- before -->
<input *ngIf="show" aria-label="Name" class="field" [value]="name" id="name-input" />

<!-- after -->
<input id="name-input" class="field" *ngIf="show" aria-label="Name" [value]="name" />
```

`id` and `class` are pulled to positions 1 and 2. Other `<HTML_ATTRIBUTES>` (`aria-label`) stay in their group further down.

### Partial order — specifying only some groups

You don't need to list every group. Any attribute not covered by your custom order falls back to its default group position, placed after all explicitly ordered entries:

```json
{
  "angularSortAttributesOrder": ["<STRUCTURAL_DIRECTIVES>", "id", "class"]
}
```

```html
<!-- before -->
<div (click)="fn()" class="card" *ngIf="show" [loading]="busy" id="main" foo="bar" />

<!-- after -->
<div
  *ngIf="show"
  id="main"
  class="card"
  foo="bar"
  [loading]="busy"
  (click)="fn()"
/>
```

`*ngIf`, `id`, and `class` are pinned first in the specified order. The remaining attributes — `foo`, `[loading]`, `(click)` — follow in their default group order (string inputs → property bindings → outputs).

## Requirements

- Node.js 18+
- Prettier 3+

## License

ISC

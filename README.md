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

## Attribute order

Attributes are grouped and sorted in this order:

| #   | Group                          | Examples                                   |
| --- | ------------------------------ | ------------------------------------------ |
| 1   | Structural directives          | `*ngIf`, `*ngFor`, `*ngTemplateOutlet`     |
| 2   | Animation triggers             | `@fade`, `[@slide]="state"`                |
| 3   | Element references             | `#myComponent`                             |
| 4   | Standard HTML attributes       | `class`, `id`, `style`, `aria-*`, `data-*` |
| 5   | Non-interpolated string inputs | `foo="bar"`                                |
| 6   | Property bindings              | `[value]="theValue"`                       |
| 7   | Two-way bindings               | `[(ngModel)]="email"`                      |
| 8   | Event bindings                 | `(click)="onClick()"`                      |

Within each group, attributes are sorted alphabetically.

### Example

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

## Requirements

- Node.js 18+
- Prettier 3+

## License

ISC

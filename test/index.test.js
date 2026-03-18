import { describe, it } from "node:test";
import assert from "node:assert/strict";
import prettier from "prettier";
import plugin from "../index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_OPTS = {
  plugins: [plugin],
  printWidth: 9999,
  htmlWhitespaceSensitivity: "ignore",
};

async function fmt(html, extraOpts = {}) {
  return (
    await prettier.format(html, { ...BASE_OPTS, parser: "angular", ...extraOpts })
  ).trim();
}

async function fmtTs(ts, extraOpts = {}) {
  return (
    await prettier.format(ts, { ...BASE_OPTS, parser: "typescript", ...extraOpts })
  ).trim();
}

// Formats with a custom angularSortAttributesOrder
function fmtCustom(html, order) {
  return fmt(html, { angularSortAttributesOrder: order });
}

// Returns true when attrA appears before attrB in the output string
function before(output, attrA, attrB) {
  const a = output.indexOf(attrA);
  const b = output.indexOf(attrB);
  assert.notEqual(a, -1, `"${attrA}" not found in output`);
  assert.notEqual(b, -1, `"${attrB}" not found in output`);
  return a < b;
}

function assertOrder(output, ...attrs) {
  for (let i = 0; i < attrs.length - 1; i++) {
    assert.ok(
      before(output, attrs[i], attrs[i + 1]),
      `Expected "${attrs[i]}" before "${attrs[i + 1]}" in:\n${output}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Default ordering
// ---------------------------------------------------------------------------

describe("default ordering — spec example", () => {
  it("sorts all eight groups in the correct order", async () => {
    const output = await fmt(`
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
/>`);
    assertOrder(output, "*ngIf", "@fade", "#myComponent", 'class="foo"', 'foo="bar"', "[bar]", "[(ngModel)]", "(click)");
    assert.ok(output.includes("(someEvent)"));
  });
});

describe("group 0 – structural directives", () => {
  it("comes before all other groups", async () => {
    const output = await fmt(`<div *ngFor="let i of items" class="x" [val]="v" (click)="fn()" />`);
    assertOrder(output, "*ngFor", 'class="x"', "[val]", "(click)");
  });

  it("handles *ngTemplateOutlet", async () => {
    const output = await fmt(`<ng-container [val]="v" *ngTemplateOutlet="tpl" class="x" />`);
    assertOrder(output, "*ngTemplateOutlet", 'class="x"', "[val]");
  });
});

describe("group 1 – animation triggers", () => {
  it("handles @trigger syntax", async () => {
    const output = await fmt(`<div class="x" @fade id="y" />`);
    assertOrder(output, "@fade", 'class="x"');
  });

  it("handles [@trigger]='state' binding syntax", async () => {
    const output = await fmt(`<div class="x" [@slide]="state" />`);
    assertOrder(output, "[@slide]", 'class="x"');
  });

  it("comes after structural directives", async () => {
    const output = await fmt(`<div @fade *ngIf="x" />`);
    assertOrder(output, "*ngIf", "@fade");
  });
});

describe("group 2 – element references", () => {
  it("comes after animations and before HTML attrs", async () => {
    const output = await fmt(`<div class="x" #myRef @fade />`);
    assertOrder(output, "@fade", "#myRef", 'class="x"');
  });

  it("handles exportAs references (#foo='ngModel')", async () => {
    const output = await fmt(`<input class="x" #ctrl="ngModel" type="text" />`);
    assertOrder(output, "#ctrl", 'class="x"');
  });
});

describe("group 3 – standard HTML attributes", () => {
  it("places class, id, style before custom string inputs", async () => {
    const output = await fmt(`<div customProp="val" style="color:red" id="x" class="foo" />`);
    assertOrder(output, 'class="foo"', 'customProp="val"');
    assertOrder(output, 'id="x"', 'customProp="val"');
    assertOrder(output, "style=", 'customProp="val"');
  });

  it("treats aria-* as group 3", async () => {
    const output = await fmt(`<div customProp="x" aria-label="close" />`);
    assertOrder(output, "aria-label", "customProp");
  });

  it("treats data-* as group 3", async () => {
    const output = await fmt(`<div customProp="x" data-testid="btn" />`);
    assertOrder(output, "data-testid", "customProp");
  });

  it("sorts alphabetically within the group", async () => {
    const output = await fmt(`<div title="t" class="c" id="i" />`);
    assertOrder(output, 'class="c"', 'id="i"', 'title="t"');
  });
});

describe("group 4 – non-interpolated string inputs", () => {
  it("comes after HTML attrs and before property bindings", async () => {
    const output = await fmt(`<div [value]="v" foo="bar" class="c" />`);
    assertOrder(output, 'class="c"', 'foo="bar"', "[value]");
  });

  it("handles let-* template variables", async () => {
    const output = await fmt(`<ng-template [value]="v" let-item="row" class="x" />`);
    assertOrder(output, 'class="x"', "let-item", "[value]");
  });
});

describe("group 5 – property bindings", () => {
  it("places [binding] after plain attrs and before two-way", async () => {
    const output = await fmt(`<div [(ngModel)]="x" [value]="v" foo="bar" />`);
    assertOrder(output, 'foo="bar"', "[value]", "[(ngModel)]");
  });

  it("handles [class.active] bindings", async () => {
    const output = await fmt(`<div (click)="fn()" [class.active]="isActive" class="btn" />`);
    assertOrder(output, 'class="btn"', "[class.active]", "(click)");
  });

  it("handles [style.color] bindings", async () => {
    const output = await fmt(`<div (click)="fn()" [style.color]="color" class="x" />`);
    assertOrder(output, 'class="x"', "[style.color]", "(click)");
  });

  it("does not confuse [( with [", async () => {
    const output = await fmt(`<div [(ngModel)]="x" [value]="v" />`);
    assertOrder(output, "[value]", "[(ngModel)]");
  });
});

describe("group 6 – two-way bindings", () => {
  it("comes before outputs", async () => {
    const output = await fmt(`<div (click)="fn()" [(ngModel)]="x" />`);
    assertOrder(output, "[(ngModel)]", "(click)");
  });
});

describe("group 7 – event bindings", () => {
  it("comes last", async () => {
    const output = await fmt(`<div (click)="a()" class="x" (change)="b()" />`);
    assertOrder(output, 'class="x"', "(change)");
    assertOrder(output, 'class="x"', "(click)");
  });

  it("handles (keydown.enter) event modifiers", async () => {
    const output = await fmt(`<input class="x" (keydown.enter)="submit()" [value]="v" />`);
    assertOrder(output, 'class="x"', "[value]", "(keydown.enter)");
  });

  it("handles (window:scroll) global event listeners", async () => {
    const output = await fmt(`<div class="x" (window:scroll)="onScroll()" [val]="v" />`);
    assertOrder(output, 'class="x"', "[val]", "(window:scroll)");
  });

  it("sorts alphabetically within outputs", async () => {
    const output = await fmt(`<div (submit)="s()" (click)="c()" (change)="ch()" />`);
    assertOrder(output, "(change)", "(click)", "(submit)");
  });
});

// ---------------------------------------------------------------------------
// Real-world Angular patterns
// ---------------------------------------------------------------------------

describe("real-world patterns", () => {
  it("reactive form", async () => {
    const output = await fmt(
      `<form [formGroup]="form" (ngSubmit)="submit()" autocomplete="off" class="bunk-form"></form>`,
    );
    // class and autocomplete are both HTML attrs (group 3) — alphabetical: autocomplete, class
    // [formGroup] is a property binding (group 5)
    // (ngSubmit) is an output (group 7)
    assertOrder(output, "autocomplete", 'class="bunk-form"', "[formGroup]", "(ngSubmit)");
  });

  it("form input with validation", async () => {
    const output = await fmt(
      `<input (blur)="onBlur()" [formControlName]="'email'" type="email" #emailInput="ngModel" required placeholder="Email" />`,
    );
    assertOrder(output, "#emailInput", "placeholder", "required", "type", "[formControlName]", "(blur)");
  });

  it("Angular Material button", async () => {
    const output = await fmt(
      `<button (click)="submit()" [disabled]="loading" mat-raised-button color="primary" class="submit-btn" type="submit"></button>`,
    );
    assertOrder(output, 'class="submit-btn"', 'color="primary"', 'type="submit"', "[disabled]", "(click)");
  });

  it("router-outlet and routerLink", async () => {
    const output = await fmt(
      `<a (click)="track()" [routerLink]="['/home']" class="nav-link" routerLinkActive="active"></a>`,
    );
    assertOrder(output, 'class="nav-link"', 'routerLinkActive="active"', "[routerLink]", "(click)");
  });

  it("*ngFor with trackBy and index", async () => {
    const output = await fmt(
      `<li class="item" (click)="select(item)" *ngFor="let item of items; trackBy: trackById" [class.active]="item.active"></li>`,
    );
    assertOrder(output, "*ngFor", 'class="item"', "[class.active]", "(click)");
  });

  it("ng-template with let bindings", async () => {
    const output = await fmt(
      `<ng-template [ngTemplateOutletContext]="ctx" let-item let-index="index" *ngTemplateOutlet="tpl"></ng-template>`,
    );
    // *ngTemplateOutlet is structural (group 0)
    assertOrder(output, "*ngTemplateOutlet");
  });
});

// ---------------------------------------------------------------------------
// angularSortAttributesOrder — custom ordering
// ---------------------------------------------------------------------------

describe("angularSortAttributesOrder", () => {
  it("regression: class promoted above other HTML attrs (user-reported)", async () => {
    // With default sort, autocomplete < class alphabetically, both are HTML attrs.
    // With class promoted in custom order, class must come first.
    const output = await fmtCustom(
      `<form autocomplete="off" class="bunk-form" [formGroup]="form"></form>`,
      ["<STRUCTURAL_DIRECTIVES>", "<ANIMATION_TRIGGERS>", "<ELEMENT_REFS>", "id", "class"],
    );
    assertOrder(output, 'class="bunk-form"', 'autocomplete="off"', "[formGroup]");
  });

  it("respects a fully-specified custom order", async () => {
    const output = await fmtCustom(
      `<div *ngIf="x" class="c" (click)="fn()" [val]="v" />`,
      ["<OUTPUTS>", "<HTML_ATTRIBUTES>", "<INPUTS>", "<STRUCTURAL_DIRECTIVES>"],
    );
    assertOrder(output, "(click)", 'class="c"', "[val]", "*ngIf");
  });

  it("places specific attribute names before their group", async () => {
    const output = await fmtCustom(
      `<div title="t" id="i" style="s" class="c" />`,
      ["id", "class", "<HTML_ATTRIBUTES>"],
    );
    assertOrder(output, 'id="i"', 'class="c"', 'style="s"');
    assertOrder(output, 'id="i"', 'class="c"', 'title="t"');
  });

  it("<INPUTS> covers both string inputs and property bindings", async () => {
    const output = await fmtCustom(
      `<div (click)="fn()" [bound]="b" plain="p" class="c" />`,
      ["<INPUTS>", "<HTML_ATTRIBUTES>", "<OUTPUTS>"],
    );
    assertOrder(output, "[bound]", 'class="c"', "(click)");
    assertOrder(output, 'plain="p"', 'class="c"', "(click)");
  });

  it("unspecified attributes follow in default group order", async () => {
    // Only <OUTPUTS> is specified; everything else should maintain default group ordering
    const output = await fmtCustom(
      `<div (click)="fn()" class="c" *ngIf="x" [val]="v" />`,
      ["<OUTPUTS>"],
    );
    assertOrder(output, "(click)", "*ngIf", 'class="c"', "[val]");
  });

  it("partial order: only pinning a few attrs leaves rest in default order", async () => {
    const output = await fmtCustom(
      `<div (click)="fn()" [loading]="busy" class="card" *ngIf="show" foo="bar" id="main" />`,
      ["<STRUCTURAL_DIRECTIVES>", "id", "class"],
    );
    // Pinned: *ngIf (0), id (1), class (2)
    // Fallback default order: foo (string input, group 4), [loading] (group 5), (click) (group 7)
    assertOrder(output, "*ngIf", 'id="main"', 'class="card"', 'foo="bar"', "[loading]", "(click)");
  });

  it("empty option falls back to default group ordering", async () => {
    const output = await fmtCustom(
      `<div (click)="fn()" *ngIf="x" class="c" />`,
      [],
    );
    assertOrder(output, "*ngIf", 'class="c"', "(click)");
  });
});

// ---------------------------------------------------------------------------
// TypeScript inline templates
// ---------------------------------------------------------------------------

describe("TypeScript inline templates", () => {
  it("sorts attributes in a component template string", async () => {
    const output = await fmtTs(`
@Component({
  selector: 'app-root',
  template: \`<div (click)="fn()" class="foo" *ngIf="x"></div>\`,
})
export class AppComponent {}`);
    assertOrder(output, "*ngIf", 'class="foo"', "(click)");
  });

  it("sorts attributes across multiple elements in the template", async () => {
    const output = await fmtTs(`
@Component({
  template: \`
    <div (click)="a()" class="x">
      <span [value]="v" id="inner" (change)="b()"></span>
    </div>
  \`,
})
export class AppComponent {}`);
    assertOrder(output, 'class="x"', "(click)");
    assertOrder(output, 'id="inner"', "[value]", "(change)");
  });

  it("respects custom order in inline templates", async () => {
    const output = await fmtTs(
      `@Component({ template: \`<form autocomplete="off" class="f" [formGroup]="fg"></form>\` })
export class C {}`,
      { angularSortAttributesOrder: ["<STRUCTURAL_DIRECTIVES>", "<ELEMENT_REFS>", "id", "class"] },
    );
    assertOrder(output, 'class="f"', 'autocomplete="off"', "[formGroup]");
  });
});

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

describe("idempotency", () => {
  it("default order: formatting twice produces no changes", async () => {
    const input = `
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
/>`;
    const first = await fmt(input);
    assert.equal(await fmt(first), first);
  });

  it("custom order: formatting twice produces no changes", async () => {
    const opts = { angularSortAttributesOrder: ["<STRUCTURAL_DIRECTIVES>", "id", "class"] };
    const input = `<form autocomplete="off" class="f" *ngIf="x" [fg]="form" id="main"></form>`;
    const first = await fmt(input, opts);
    assert.equal(await fmt(first, opts), first);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  it("leaves a single-attribute element unchanged", async () => {
    const output = await fmt(`<div class="foo" />`);
    assert.ok(output.includes('class="foo"'));
  });

  it("handles boolean attributes (no value)", async () => {
    const output = await fmt(`<input (change)="fn()" disabled required />`);
    assertOrder(output, "disabled", "(change)");
    assertOrder(output, "required", "(change)");
  });

  it("handles nested elements recursively", async () => {
    const output = await fmt(
      `<div class="outer"><span (click)="fn()" id="inner"></span></div>`,
    );
    assertOrder(output, 'id="inner"', "(click)");
  });

  it("handles self-closing elements", async () => {
    const output = await fmt(`<input (change)="fn()" class="x" [value]="v" />`);
    assertOrder(output, 'class="x"', "[value]", "(change)");
  });
});

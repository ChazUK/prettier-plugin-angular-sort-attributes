import { describe, it } from "node:test";
import assert from "node:assert/strict";
import prettier from "prettier";
import plugin from "../index.js";

const FORMAT_OPTS = {
  parser: "angular",
  plugins: [plugin],
  // Prevent line-length wrapping from reordering our attribute assertions
  printWidth: 9999,
  htmlWhitespaceSensitivity: "ignore",
};

async function fmt(html) {
  return (await prettier.format(html, FORMAT_OPTS)).trim();
}

describe("attribute group ordering", () => {
  it("sorts the spec example correctly", async () => {
    const input = `
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
/>`;

    const output = await fmt(input);

    const indexOf = (attr) => output.indexOf(attr);

    assert.ok(
      indexOf("*ngIf") < indexOf("@fade"),
      "*ngIf should precede @fade",
    );
    assert.ok(
      indexOf("@fade") < indexOf("#myComponent"),
      "@fade should precede #myComponent",
    );
    assert.ok(
      indexOf("#myComponent") < indexOf('class="foo"'),
      "#myComponent should precede class",
    );
    assert.ok(
      indexOf('class="foo"') < indexOf('foo="bar"'),
      "class should precede foo",
    );
    assert.ok(
      indexOf('foo="bar"') < indexOf("[bar]"),
      "foo should precede [bar]",
    );
    assert.ok(
      indexOf("[bar]") < indexOf("[(ngModel)]"),
      "[bar] should precede [(ngModel)]",
    );
    assert.ok(
      indexOf("[(ngModel)]") < indexOf("(click)"),
      "[(ngModel)] should precede (click)",
    );
    assert.ok(output.includes("(click)"), "should include (click)");
    assert.ok(output.includes("(someEvent)"), "should include (someEvent)");
  });
});

describe("group 0 - structural directives", () => {
  it("sorts *ngIf, *ngFor, *ngTemplateOutlet all before other groups", async () => {
    const output = await fmt(
      `<div *ngFor="let i of items" class="x" *ngTemplateOutlet="tpl" id="y" />`,
    );
    assert.ok(output.indexOf("*ng") < output.indexOf('class="x"'));
    assert.ok(output.indexOf("*ng") < output.indexOf('id="y"'));
  });
});

describe("group 1 - animation triggers", () => {
  it("handles @trigger syntax", async () => {
    const output = await fmt(`<div class="x" @fade id="y" />`);
    assert.ok(output.indexOf("@fade") < output.indexOf('class="x"'));
  });

  it("handles [@trigger] binding syntax", async () => {
    const output = await fmt(`<div class="x" [@slide]="state" />`);
    assert.ok(output.indexOf("[@slide]") < output.indexOf('class="x"'));
  });

  it("places animation after structural directives", async () => {
    const output = await fmt(`<div @fade *ngIf="x" />`);
    assert.ok(output.indexOf("*ngIf") < output.indexOf("@fade"));
  });
});

describe("group 2 - element references", () => {
  it("places #ref after animations but before HTML attrs", async () => {
    const output = await fmt(`<div class="x" #myRef @fade />`);
    assert.ok(output.indexOf("@fade") < output.indexOf("#myRef"));
    assert.ok(output.indexOf("#myRef") < output.indexOf('class="x"'));
  });
});

describe("group 3 - standard HTML attributes", () => {
  it("keeps class, id, style in group 3", async () => {
    const output = await fmt(
      `<div customProp="val" style="color:red" id="x" class="foo" />`,
    );
    assert.ok(
      output.indexOf('class="foo"') < output.indexOf('customProp="val"'),
    );
    assert.ok(output.indexOf('id="x"') < output.indexOf('customProp="val"'));
    assert.ok(
      output.indexOf('style="color:red"') < output.indexOf('customProp="val"'),
    );
  });

  it("treats aria-* as group 3", async () => {
    const output = await fmt(`<div customProp="x" aria-label="close" />`);
    assert.ok(output.indexOf("aria-label") < output.indexOf("customProp"));
  });

  it("treats data-* as group 3", async () => {
    const output = await fmt(`<div customProp="x" data-testid="btn" />`);
    assert.ok(output.indexOf("data-testid") < output.indexOf("customProp"));
  });

  it("sorts alphabetically within the group", async () => {
    const output = await fmt(`<div title="t" class="c" id="i" />`);
    assert.ok(output.indexOf('class="c"') < output.indexOf('id="i"'));
    assert.ok(output.indexOf('id="i"') < output.indexOf('title="t"'));
  });
});

describe("group 4 - non-interpolated string inputs", () => {
  it("places custom plain attrs after HTML attrs but before bindings", async () => {
    const output = await fmt(`<div [value]="v" foo="bar" class="c" />`);
    assert.ok(output.indexOf('class="c"') < output.indexOf('foo="bar"'));
    assert.ok(output.indexOf('foo="bar"') < output.indexOf("[value]"));
  });
});

describe("group 5 - property bindings", () => {
  it("places [binding] after plain attrs and before two-way", async () => {
    const output = await fmt(`<div [(ngModel)]="x" [value]="v" foo="bar" />`);
    assert.ok(output.indexOf('foo="bar"') < output.indexOf("[value]"));
    assert.ok(output.indexOf("[value]") < output.indexOf("[(ngModel)]"));
  });

  it("does not confuse [( with [ group", async () => {
    const output = await fmt(`<div [(ngModel)]="x" [value]="v" />`);
    assert.ok(output.indexOf("[value]") < output.indexOf("[(ngModel)]"));
  });
});

describe("group 6 - two-way bindings", () => {
  it("places [(binding)] before outputs", async () => {
    const output = await fmt(`<div (click)="fn()" [(ngModel)]="x" />`);
    assert.ok(output.indexOf("[(ngModel)]") < output.indexOf("(click)"));
  });
});

describe("group 7 - event bindings", () => {
  it("places all outputs last", async () => {
    const output = await fmt(`<div (click)="a()" class="x" (change)="b()" />`);
    assert.ok(output.indexOf('class="x"') < output.indexOf("(change)"));
    assert.ok(output.indexOf('class="x"') < output.indexOf("(click)"));
  });

  it("sorts alphabetically within outputs", async () => {
    const output = await fmt(
      `<div (submit)="s()" (click)="c()" (change)="ch()" />`,
    );
    assert.ok(output.indexOf("(change)") < output.indexOf("(click)"));
    assert.ok(output.indexOf("(click)") < output.indexOf("(submit)"));
  });
});

describe("nested elements", () => {
  it("sorts attributes on child elements recursively", async () => {
    const input = `<div class="outer"><span (click)="fn()" id="inner"></span></div>`;
    const output = await fmt(input);
    assert.ok(output.includes("id=") && output.includes("(click)"));
    assert.ok(output.indexOf('id="inner"') < output.indexOf("(click)"));
  });
});

describe("idempotency", () => {
  it("produces no changes when run on already-sorted output", async () => {
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
    const second = await fmt(first);
    assert.equal(first, second);
  });
});

describe("edge cases", () => {
  it("leaves a single-attribute element unchanged", async () => {
    const output = await fmt(`<div class="foo" />`);
    assert.ok(output.includes('class="foo"'));
  });

  it("handles boolean attributes (no value)", async () => {
    const output = await fmt(`<input (change)="fn()" disabled required />`);
    assert.ok(output.indexOf("disabled") < output.indexOf("(change)"));
    assert.ok(output.indexOf("required") < output.indexOf("(change)"));
  });
});

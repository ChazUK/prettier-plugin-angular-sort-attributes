"use strict";

const { walkAndSort } = require("./src/sort-attrs");

/**
 * Find the original parser from Prettier's built-in plugins.
 * We look through options.plugins (which always includes Prettier's built-ins)
 * rather than require()ing prettier/plugins/html directly — that approach would
 * resolve against our own devDep prettier instead of the project's prettier,
 * causing AST/printer version mismatches.
 */
function findOriginalParser(parserName, options) {
  for (const plugin of options.plugins || []) {
    if (plugin !== module.exports && plugin.parsers?.[parserName]) {
      return plugin.parsers[parserName];
    }
  }
  throw new Error(
    `[@chazuk/prettier-plugin-angular-sort-attributes] Could not find the original "${parserName}" parser. ` +
      "Make sure prettier >= 3 is installed.",
  );
}

function wrapParser(parserName) {
  return {
    astFormat: "html",
    locStart: (node) => node.sourceSpan?.start?.offset ?? 0,
    locEnd: (node) => node.sourceSpan?.end?.offset ?? 0,
    parse(text, options) {
      const original = findOriginalParser(parserName, options);
      const ast = original.parse(text, options);
      walkAndSort(ast);
      return ast;
    },
  };
}

module.exports = {
  parsers: {
    html: wrapParser("html"),
    angular: wrapParser("angular"),
  },
};

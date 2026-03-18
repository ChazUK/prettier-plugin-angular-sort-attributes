import { walkAndSort } from "./src/sort-attrs.js";

/**
 * Find the original parser from Prettier's built-in plugins.
 * We look through options.plugins (which always includes Prettier's built-ins)
 * rather than importing prettier/plugins/html directly — that approach would
 * resolve against our own devDep prettier instead of the project's prettier,
 * causing AST/printer version mismatches.
 */
function findOriginalParser(parserName, options, self) {
  for (const plugin of options.plugins || []) {
    if (plugin !== self && plugin.parsers?.[parserName]) {
      return plugin.parsers[parserName];
    }
  }
  
  throw new Error(
    `[@chazuk/prettier-plugin-angular-sort-attributes] Could not find the original "${parserName}" parser. ` +
      "Make sure prettier >= 3 is installed.",
  );
}

function wrapParser(parserName, self) {
  return {
    astFormat: "html",
    locStart: (node) => node.sourceSpan?.start?.offset ?? 0,
    locEnd: (node) => node.sourceSpan?.end?.offset ?? 0,
    parse(text, options) {
      const original = findOriginalParser(parserName, options, self);
      const ast = original.parse(text, options);
      walkAndSort(ast);
      return ast;
    },
  };
}

const plugin = {
  parsers: {
    html: null,
    angular: null,
  },
};

plugin.parsers.html = wrapParser("html", plugin);
plugin.parsers.angular = wrapParser("angular", plugin);

export default plugin;

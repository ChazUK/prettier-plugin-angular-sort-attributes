"use strict";

const { walkAndSort } = require("./src/sort-attrs");

const { parsers: builtinParsers } = require("prettier/plugins/html");

function makeSortingParser(original) {
  return {
    ...original,
    parse(text, options) {
      const ast = original.parse(text, options);
      walkAndSort(ast);
      return ast;
    },
  };
}

module.exports = {
  parsers: {
    html: makeSortingParser(builtinParsers.html),
    angular: makeSortingParser(builtinParsers.angular),
  },
};

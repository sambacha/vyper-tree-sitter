/**
 * @file EVM Pythonic Smart Contract Language
 * @author Sam Bacha
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "vyper",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});

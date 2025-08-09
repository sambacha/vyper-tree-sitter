# tree sitter vyper


## scanner.c

 Scanner Logic (src/scanner.c):
  - Added logic to handle INDENT emission when Tree-sitter expects it and we're at a newline
  - Fixed the sequence: def foo():\n    pass now properly emits NEWLINE then INDENT then DEDENT
  - Improved EOF handling to always emit remaining DEDENTs when indentation levels exist
  - Added proper indentation detection when scanner is called with different valid symbol combinations

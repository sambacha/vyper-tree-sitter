#include "tree_sitter/parser.h"
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <stdbool.h>

// Enable debug output when TREE_SITTER_DEBUG is set
#ifdef TREE_SITTER_DEBUG
#define DEBUG_PRINT(...) fprintf(stderr, "[VYPER_SCANNER] " __VA_ARGS__)
#else
#define DEBUG_PRINT(...)
#endif

enum TokenType {
  NEWLINE,
  INDENT,
  DEDENT,
};

typedef struct {
  uint32_t *indents;
  uint32_t indent_count;
  uint32_t indent_capacity;
  bool expecting_indent;
} Scanner;

static inline void indent_push(Scanner *scanner, uint32_t indent) {
  if (scanner->indent_count == scanner->indent_capacity) {
    scanner->indent_capacity *= 2;
    scanner->indents = realloc(scanner->indents, scanner->indent_capacity * sizeof(uint32_t));
  }
  scanner->indents[scanner->indent_count++] = indent;
  DEBUG_PRINT("Pushed indent: %u (stack size: %u)\n", indent, scanner->indent_count);
}

static inline uint32_t indent_pop(Scanner *scanner) {
  if (scanner->indent_count > 0) {
    uint32_t value = scanner->indents[--scanner->indent_count];
    DEBUG_PRINT("Popped indent: %u (stack size: %u)\n", value, scanner->indent_count);
    return value;
  }
  return 0;
}

static inline uint32_t indent_top(Scanner *scanner) {
  if (scanner->indent_count > 0) {
    return scanner->indents[scanner->indent_count - 1];
  }
  return 0;
}

void *tree_sitter_vyper_external_scanner_create() {
  Scanner *scanner = calloc(1, sizeof(Scanner));
  scanner->indent_capacity = 16;
  scanner->indents = calloc(scanner->indent_capacity, sizeof(uint32_t));
  indent_push(scanner, 0);  // Initial indent level is 0
  scanner->expecting_indent = false;
  DEBUG_PRINT("Scanner created\n");
  return scanner;
}

void tree_sitter_vyper_external_scanner_destroy(void *payload) {
  Scanner *scanner = (Scanner *)payload;
  free(scanner->indents);
  free(scanner);
  DEBUG_PRINT("Scanner destroyed\n");
}

unsigned tree_sitter_vyper_external_scanner_serialize(
  void *payload,
  char *buffer
) {
  Scanner *scanner = (Scanner *)payload;
  unsigned size = 0;

  // Store indent count
  if (size + sizeof(uint32_t) <= TREE_SITTER_SERIALIZATION_BUFFER_SIZE) {
    memcpy(buffer + size, &scanner->indent_count, sizeof(uint32_t));
    size += sizeof(uint32_t);
  }

  // Store indent values
  for (uint32_t i = 0; i < scanner->indent_count; i++) {
    if (size + sizeof(uint32_t) <= TREE_SITTER_SERIALIZATION_BUFFER_SIZE) {
      memcpy(buffer + size, &scanner->indents[i], sizeof(uint32_t));
      size += sizeof(uint32_t);
    }
  }

  // Store expecting_indent flag
  if (size + sizeof(bool) <= TREE_SITTER_SERIALIZATION_BUFFER_SIZE) {
    memcpy(buffer + size, &scanner->expecting_indent, sizeof(bool));
    size += sizeof(bool);
  }

  DEBUG_PRINT("Serialized %u bytes (indent_count: %u)\n", size, scanner->indent_count);
  return size;
}

void tree_sitter_vyper_external_scanner_deserialize(
  void *payload,
  const char *buffer,
  unsigned length
) {
  Scanner *scanner = (Scanner *)payload;
  scanner->indent_count = 0;
  scanner->expecting_indent = false;

  if (length == 0) {
    indent_push(scanner, 0);
    DEBUG_PRINT("Deserialized empty state\n");
    return;
  }

  unsigned size = 0;

  // Read indent count
  uint32_t indent_count = 0;
  if (size + sizeof(uint32_t) <= length) {
    memcpy(&indent_count, buffer + size, sizeof(uint32_t));
    size += sizeof(uint32_t);
  }

  // Read indent values
  for (uint32_t i = 0; i < indent_count && size + sizeof(uint32_t) <= length; i++) {
    uint32_t indent;
    memcpy(&indent, buffer + size, sizeof(uint32_t));
    indent_push(scanner, indent);
    size += sizeof(uint32_t);
  }

  // Read expecting_indent flag
  if (size + sizeof(bool) <= length) {
    memcpy(&scanner->expecting_indent, buffer + size, sizeof(bool));
    size += sizeof(bool);
  }

  if (scanner->indent_count == 0) {
    indent_push(scanner, 0);
  }

  DEBUG_PRINT("Deserialized %u bytes (indent_count: %u)\n", size, scanner->indent_count);
}

bool tree_sitter_vyper_external_scanner_scan(
  void *payload,
  TSLexer *lexer,
  const bool *valid_symbols
) {
  Scanner *scanner = (Scanner *)payload;
  
  DEBUG_PRINT("Scan called - valid symbols: NEWLINE=%d, INDENT=%d, DEDENT=%d\n",
    valid_symbols[NEWLINE], valid_symbols[INDENT], valid_symbols[DEDENT]);
  DEBUG_PRINT("Current lookahead: '%c' (0x%02x), expecting_indent=%d\n", 
    lexer->lookahead >= 32 ? lexer->lookahead : '?', lexer->lookahead, scanner->expecting_indent);

  // Handle EOF - emit remaining dedents
  if (lexer->lookahead == 0) {
    if (valid_symbols[DEDENT] && scanner->indent_count > 1) {
      indent_pop(scanner);
      lexer->result_symbol = DEDENT;
      DEBUG_PRINT("Emitting DEDENT at EOF (remaining: %u)\n", scanner->indent_count - 1);
      return true;
    }
    return false;
  }

  // Skip any whitespace except newlines
  bool found_whitespace = false;
  while (lexer->lookahead == ' ' || lexer->lookahead == '\t' || lexer->lookahead == '\r') {
    found_whitespace = true;
    lexer->advance(lexer, true);
  }

  // If we're not at a newline, we can't produce indent/dedent tokens
  if (lexer->lookahead != '\n') {
    DEBUG_PRINT("No newline found (lookahead: 0x%02x)\n", lexer->lookahead);
    return false;
  }

  // Consume the newline
  lexer->advance(lexer, true);
  lexer->mark_end(lexer);

  // Count indentation on the next line
  uint32_t indent_size = 0;
  
  // Skip blank lines and comment lines
  while (true) {
    indent_size = 0;
    
    // Count spaces and tabs
    while (lexer->lookahead == ' ' || lexer->lookahead == '\t') {
      if (lexer->lookahead == '\t') {
        indent_size += 8;  // Tab counts as 8 spaces
      } else {
        indent_size++;
      }
      lexer->advance(lexer, true);
    }
    
    // Check what comes after indentation
    if (lexer->lookahead == '\n' || lexer->lookahead == '\r') {
      // Blank line - skip it
      lexer->advance(lexer, true);
      lexer->mark_end(lexer);
      DEBUG_PRINT("Skipping blank line\n");
      continue;
    } else if (lexer->lookahead == '#') {
      // Comment line - skip to end of line
      while (lexer->lookahead != '\n' && lexer->lookahead != '\r' && lexer->lookahead != 0) {
        lexer->advance(lexer, true);
      }
      if (lexer->lookahead == '\n' || lexer->lookahead == '\r') {
        lexer->advance(lexer, true);
        lexer->mark_end(lexer);
      }
      DEBUG_PRINT("Skipping comment line\n");
      continue;
    } else if (lexer->lookahead == 0) {
      // End of file after newline
      if (valid_symbols[DEDENT] && scanner->indent_count > 1) {
        indent_pop(scanner);
        lexer->result_symbol = DEDENT;
        DEBUG_PRINT("Emitting DEDENT at EOF after newline\n");
        return true;
      }
      if (valid_symbols[NEWLINE]) {
        lexer->result_symbol = NEWLINE;
        DEBUG_PRINT("Emitting NEWLINE before EOF\n");
        return true;
      }
      return false;
    } else {
      // Found actual content
      break;
    }
  }

  // Now we have actual content at indent_size
  uint32_t current_indent = indent_top(scanner);
  DEBUG_PRINT("Found content at indent %u, current indent %u\n", indent_size, current_indent);

  // Determine what token to emit based on indentation change
  if (indent_size > current_indent) {
    if (valid_symbols[INDENT]) {
      indent_push(scanner, indent_size);
      lexer->result_symbol = INDENT;
      scanner->expecting_indent = false;
      DEBUG_PRINT("Emitting INDENT (new level: %u)\n", indent_size);
      return true;
    }
  } else if (indent_size < current_indent) {
    if (valid_symbols[DEDENT]) {
      // Pop indents until we reach the right level
      // We only emit one DEDENT at a time, tree-sitter will call us again for more
      while (scanner->indent_count > 1 && indent_top(scanner) > indent_size) {
        indent_pop(scanner);
      }
      lexer->result_symbol = DEDENT;
      scanner->expecting_indent = false;
      DEBUG_PRINT("Emitting DEDENT (back to level: %u)\n", indent_top(scanner));
      return true;
    }
  } else {
    // Same indentation - emit NEWLINE if valid
    if (valid_symbols[NEWLINE]) {
      lexer->result_symbol = NEWLINE;
      scanner->expecting_indent = false;
      DEBUG_PRINT("Emitting NEWLINE (same indent level)\n");
      return true;
    }
  }

  DEBUG_PRINT("Scan returning false (no valid token to emit)\n");
  return false;
}
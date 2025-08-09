#include <stdio.h>
#include "tree_sitter/api.h"

// Declare the language function
TSLanguage *tree_sitter_vyper(void);

int main() {
    // Create parser
    TSParser *parser = ts_parser_new();
    ts_parser_set_language(parser, tree_sitter_vyper());
    
    // Simple test string
    const char *source_code = "def foo():\n    pass\n";
    
    // Parse
    TSTree *tree = ts_parser_parse_string(parser, NULL, source_code, strlen(source_code));
    TSNode root_node = ts_tree_root_node(tree);
    
    // Print result
    char *string = ts_node_string(root_node);
    printf("Parse result: %s\n", string);
    free(string);
    
    // Check for errors
    if (ts_node_has_error(root_node)) {
        printf("Parse has errors\n");
    } else {
        printf("Parse successful\n");
    }
    
    // Clean up
    ts_tree_delete(tree);
    ts_parser_delete(parser);
    
    return 0;
}
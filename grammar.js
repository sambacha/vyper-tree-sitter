/**
 * @file Vyper Tree-sitter Grammar
 * @description Tree-sitter grammar for Vyper - Pythonic Smart Contract Language for the EVM
 * @author Sam Bacha (original), Claude (comprehensive implementation)
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  // Precedence levels (lower number = higher precedence, following standard convention)
  // Primary expressions have highest precedence
  PRIMARY: 0,           // Parentheses, literals (highest)
  CALL: 1,             // Function calls
  SUBSCRIPT: 1,        // Array/mapping access x[i]
  ATTRIBUTE: 1,        // Attribute access x.y
  
  // Unary and power
  POWER: 2,            // ** (right associative)
  UNARY: 3,            // +x, -x, ~x, not x
  
  // Arithmetic
  TIMES: 4,            // *, /, //, %
  PLUS: 5,             // +, -
  
  // Bitwise
  SHIFT: 6,            // <<, >>
  BITWISE_AND: 7,      // &
  BITWISE_XOR: 8,      // ^
  BITWISE_OR: 9,       // |
  
  // Comparison and logical
  COMPARE: 10,         // ==, !=, <, >, <=, >=, in, not in
  LOGICAL_NOT: 11,     // not
  LOGICAL_AND: 12,     // and
  LOGICAL_OR: 13,      // or
  
  // Conditionals and assignment
  TERNARY: 14,         // x if condition else y
  WALRUS: 15,          // := (walrus operator)
  ASSIGN: 16,          // =, +=, -=, etc.
  COMMA: 17,           // , (lowest precedence)
  
  // Context-sensitive precedences
  ARRAY_TYPE: 3,       // Type context for arrays
  ARRAY_ACCESS: 1,     // Expression context for arrays
  TYPE_CONTEXT: 2,     // General type context
  EXPRESSION_CONTEXT: 1, // General expression context
  
  // Special
  DOCSTRING: 0,        // NatSpec docstrings
  DECORATOR: 0,        // @external, @view, etc.
};

module.exports = grammar({
  name: "vyper",

    // Extras is an array of tokens that is allowed anywhere in the document.
    extras: $ => [
        // Allow comments to be placed anywhere in the file
        $.comment,
        // Allow characters such as whitespaces to be placed anywhere in the file
        /[\s\uFEFF\u2060\u200B\u00A0]/
    ],

  conflicts: $ => [
    [$.primary_expression, $.identifier_pattern],
    [$.tuple, $.tuple_pattern],
    [$.list, $.list_pattern],
    [$.splat_pattern, $.splat_type],
  ],

  supertypes: $ => [
    $.expression,
    $.pattern,
    $.statement,
    $.type,
  ],

  externals: $ => [
    $._newline,
    $._indent,
    $._dedent,
  ],

  word: $ => $.identifier,

  rules: {
    // ==========================================
    // Module Structure
    // ==========================================
    source_file: $ => seq(
      optional($.pragma_directive),
      repeat($._top_level_statement),
    ),

    pragma_directive: $ => token(prec(1, seq(
      '#pragma',
      /\s+/,
      'version',
      /\s+/,
      choice(
        />[0-9]+\.[0-9]+\.[0-9]+/,
        />=[0-9]+\.[0-9]+\.[0-9]+/,
        /<[0-9]+\.[0-9]+\.[0-9]+/,
        /<=[0-9]+\.[0-9]+\.[0-9]+/,
        /==[0-9]+\.[0-9]+\.[0-9]+/,
        /\^[0-9]+\.[0-9]+\.[0-9]+/,
        /~[0-9]+\.[0-9]+\.[0-9]+/,
        /[0-9]+\.[0-9]+\.[0-9]+/,
      ),
    ))),


    _top_level_statement: $ => choice(
      $.docstring,  // NatSpec module-level documentation
      $.import_statement,
      $.from_import_statement,
      $.implements_statement,
      $.exports_declaration,
      $.struct_declaration,
      $.interface_declaration,
      $.event_declaration,
      $.enum_declaration,
      $.flag_declaration,
      $.constant_declaration,
      $.variable_declaration,
      $.function_definition,
      $._newline,
    ),

    // ==========================================
    // Import Statements
    // ==========================================
    import_statement: $ => seq(
      'import',
      repeat('.'),
      $.dotted_name,
      optional($.import_alias),
    ),

    from_import_statement: $ => seq(
      'from',
      choice(
        seq(repeat('.'), $.dotted_name),
        repeat1('.'),
      ),
      'import',
      choice(
        '*',
        $.import_item,
        seq('(', $.import_list, ')'),
      ),
    ),

    import_list: $ => prec.left(seq(
      $.import_item,
      repeat(seq(',', $.import_item)),
      optional(','),
    )),

    import_item: $ => seq(
      $.identifier,
      optional($.import_alias),
    ),

    import_alias: $ => seq('as', $.identifier),

    dotted_name: $ => sep1($.identifier, '.'),

    // ==========================================
    // Declarations
    // ==========================================
    implements_statement: $ => seq(
      'implements',
      ':',
      $.identifier,
    ),

    exports_declaration: $ => seq(
      'exports',
      ':',
      choice(
        $.identifier,
        $.tuple,
      ),
    ),

    struct_declaration: $ => seq(
      'struct',
      field('name', $.identifier),
      ':',
      $._indent,
      repeat1($.struct_member),
      $._dedent,
    ),

    struct_member: $ => seq(
      field('name', $.identifier),
      ':',
      $.type,
      $._newline,
    ),

    interface_declaration: $ => seq(
      'interface',
      field('name', $.identifier),
      ':',
      $._indent,
      repeat1($.interface_function),
      $._dedent,
    ),

    interface_function: $ => seq(
      $.function_signature,
      ':',
      $.mutability,
      $._newline,
    ),

    mutability: $ => choice(
      'pure',
      'view',
      'nonpayable',
      'payable',
    ),

    event_declaration: $ => seq(
      'event',
      field('name', $.identifier),
      ':',
      choice(
        $.event_body,
        seq($._newline, $._indent, 'pass', $._newline, $._dedent),
      ),
    ),

    event_body: $ => seq(
      $._indent,
      repeat1(seq(
        field('name', $.identifier),
        ':',
        choice(
          seq('indexed', '(', $.type, ')'),
          $.type,
        ),
        $._newline,
      )),
      $._dedent,
    ),

    enum_declaration: $ => seq(
      'enum',
      field('name', $.identifier),
      ':',
      $._indent,
      repeat1(seq($.identifier, $._newline)),
      $._dedent,
    ),

    flag_declaration: $ => seq(
      'flag',
      field('name', $.identifier),
      ':',
      $._indent,
      repeat1(seq($.identifier, $._newline)),
      $._dedent,
    ),

    constant_declaration: $ => seq(
      field('name', $.identifier),
      ':',
      choice(
        seq('constant', '(', $.type, ')'),
        seq('public', '(', 'constant', '(', $.type, ')', ')'),
      ),
      '=',
      field('value', $.expression),
    ),

    variable_declaration: $ => seq(
      field('name', $.identifier),
      ':',
      choice(
        $.type,
        $.visibility_modifier,
      ),
      optional(seq('=', field('value', $.expression))),
    ),

    visibility_modifier: $ => choice(
      seq('public', '(', choice($.type, $.visibility_modifier), ')'),
      seq('immutable', '(', choice($.type, $.visibility_modifier), ')'),
      seq('transient', '(', choice($.type, $.visibility_modifier), ')'),
    ),

    // ==========================================
    // Function Definitions
    // ==========================================
    function_definition: $ => seq(
      repeat($.decorator),
      $.function_signature,
      ':',
      $.block,
    ),

    function_signature: $ => seq(
      'def',
      field('name', $.identifier),
      field('parameters', $.parameters),
      optional(field('return_type', $.return_type)),
    ),

    decorator: $ => seq(
      '@',
      $.identifier,
      optional(seq('(', optional($.argument_list), ')')),
    ),

    parameters: $ => seq(
      '(',
      optional($.parameter_list),
      ')',
    ),

    parameter_list: $ => seq(
      $.parameter,
      repeat(seq(',', $.parameter)),
      optional(','),
    ),

    parameter: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $.type),
      optional(seq('=', field('default', $.expression))),
    ),

    return_type: $ => seq('->', $.type),

    // ==========================================
    // Types
    // ==========================================
    type: $ => choice(
      $.builtin_type,
      $.identifier,
      $.array_type,
      $.dynamic_array_type,
      $.mapping_type,
      $.tuple_type,
      $.function_type,
      $.qualified_type,
    ),

    builtin_type: $ => choice(
      'bool',
      'address',
      'bytes32',
      'bytes',
      'string',
      'String',
      'uint', 'uint8', 'uint16', 'uint32', 'uint64', 'uint128', 'uint256',
      'int', 'int8', 'int16', 'int32', 'int64', 'int128', 'int256',
      'bytes1', 'bytes2', 'bytes3', 'bytes4', 'bytes5', 'bytes6', 'bytes7', 'bytes8',
      'bytes9', 'bytes10', 'bytes11', 'bytes12', 'bytes13', 'bytes14', 'bytes15', 'bytes16',
      'bytes17', 'bytes18', 'bytes19', 'bytes20', 'bytes21', 'bytes22', 'bytes23', 'bytes24',
      'bytes25', 'bytes26', 'bytes27', 'bytes28', 'bytes29', 'bytes30', 'bytes31',
    ),

    array_type: $ => prec(PREC.ARRAY_TYPE, seq(
      $.type,
      '[',
      choice(
        $.integer,           // Direct integer literals: [5], [256]
        $.identifier,        // Named constants: [MAX_SIZE]
        seq(                 // Qualified constants: [module.CONSTANT]
          $.identifier,
          repeat1(seq('.', $.identifier))
        ),
      ),
      ']',
    )),

    dynamic_array_type: $ => seq(
      'DynArray',
      '[',
      $.type,
      ',',
      $.expression,
      ']',
    ),

    mapping_type: $ => seq(
      'HashMap',
      '[',
      $.type,
      ',',
      $.type,
      ']',
    ),

    tuple_type: $ => seq(
      '(',
      optional(seq(
        $.type,
        repeat(seq(',', $.type)),
        optional(','),
      )),
      ')',
    ),

    function_type: $ => seq(
      'Callable',
      '[',
      '[',
      optional(seq(
        $.type,
        repeat(seq(',', $.type)),
      )),
      ']',
      ',',
      $.type,
      ']',
    ),

    qualified_type: $ => prec(1, seq(
      $.identifier,
      repeat1(seq('.', $.identifier)),
    )),

    // ==========================================
    // Statements
    // ==========================================
    statement: $ => choice(
      $.simple_statement,
      $.compound_statement,
    ),

    simple_statement: $ => seq(
      choice(
        $.expression_statement,
        $.assert_statement,
        $.raise_statement,
        $.return_statement,
        $.pass_statement,
        $.break_statement,
        $.continue_statement,
        $.log_statement,
        $.assignment,
        $.augmented_assignment,
        $.annotated_assignment,
      ),
      optional($.comment),  // Allow trailing comments
      $._newline,
    ),

    compound_statement: $ => choice(
      $.if_statement,
      $.for_statement,
    ),

    expression_statement: $ => $.expression,

    assert_statement: $ => seq(
      'assert',
      $.expression,
      optional(seq(',', choice($.expression, 'UNREACHABLE'))),
    ),

    raise_statement: $ => seq(
      'raise',
      optional(choice($.expression, 'UNREACHABLE')),
    ),

    return_statement: $ => seq(
      'return',
      optional($.expression_list),
    ),

    pass_statement: $ => 'pass',
    break_statement: $ => 'break',
    continue_statement: $ => 'continue',

    log_statement: $ => seq(
      'log',
      $.primary_expression,
      '(',
      optional($.argument_list),
      ')',
    ),

    assignment: $ => prec.right(PREC.ASSIGN, seq(
      field('left', choice(
        $.identifier,
        $.attribute,
        $.subscript,
        $.tuple_pattern,
        $.list_pattern,
      )),
      '=',
      field('right', $.expression),
    )),

    augmented_assignment: $ => prec.right(PREC.ASSIGN, seq(
      field('left', choice(
        $.identifier,
        $.attribute,
        $.subscript,
      )),
      field('operator', choice(
        '+=', '-=', '*=', '/=', '//=', '%=', '**=',
        '&=', '|=', '^=', '<<=', '>>=',
      )),
      field('right', $.expression),
    )),

    annotated_assignment: $ => seq(
      field('target', $.identifier),
      ':',
      field('type', $.type),
      optional(seq('=', field('value', $.expression))),
    ),

    // ==========================================
    // Control Flow
    // ==========================================
    if_statement: $ => seq(
      'if',
      field('condition', $.expression),
      ':',
      field('consequence', $.block),
      repeat(field('alternative', $.elif_clause)),
      optional(field('alternative', $.else_clause)),
    ),

    elif_clause: $ => seq(
      'elif',
      field('condition', $.expression),
      ':',
      field('consequence', $.block),
    ),

    else_clause: $ => seq(
      'else',
      ':',
      field('body', $.block),
    ),

    for_statement: $ => seq(
      'for',
      field('iterator', $.loop_variable),
      'in',
      field('iterable', $.expression),
      ':',
      field('body', $.block),
    ),

    loop_variable: $ => seq(
      $.identifier,
      ':',
      $.type,
    ),

    block: $ => seq(
      $._indent,
      repeat1(choice(
        $.statement,
        $._newline,  // Allow blank lines in blocks
      )),
      $._dedent,
    ),

    // ==========================================
    // Expressions (with proper precedence layers)
    // ==========================================
    expression: $ => $.conditional_expression,

    conditional_expression: $ => choice(
      $.or_expression,
      prec.right(PREC.TERNARY, seq(
        $.or_expression,
        'if',
        $.or_expression,
        'else',
        $.conditional_expression,
      )),
    ),

    or_expression: $ => choice(
      $.and_expression,
      prec.left(PREC.LOGICAL_OR, seq(
        field('left', $.or_expression),
        'or',
        field('right', $.and_expression)
      )),
    ),

    and_expression: $ => choice(
      $.not_expression,
      prec.left(PREC.LOGICAL_AND, seq(
        field('left', $.and_expression),
        'and',
        field('right', $.not_expression)
      )),
    ),

    not_expression: $ => choice(
      $.comparison_expression,
      prec(PREC.LOGICAL_NOT, seq('not', $.not_expression)),
    ),

    comparison_expression: $ => choice(
      $.bitwise_or_expression,
      prec.left(PREC.COMPARE, seq(
        $.bitwise_or_expression,
        repeat1(seq(
          field('operator', choice(
            '<', '<=', '==', '!=', '>=', '>',
            'in', seq('not', 'in'),
          )),
          $.bitwise_or_expression,
        )),
      )),
    ),

    bitwise_or_expression: $ => choice(
      $.bitwise_xor_expression,
      prec.left(PREC.BITWISE_OR, seq(
        field('left', $.bitwise_or_expression),
        '|',
        field('right', $.bitwise_xor_expression)
      )),
    ),

    bitwise_xor_expression: $ => choice(
      $.bitwise_and_expression,
      prec.left(PREC.BITWISE_XOR, seq(
        field('left', $.bitwise_xor_expression),
        '^',
        field('right', $.bitwise_and_expression)
      )),
    ),

    bitwise_and_expression: $ => choice(
      $.shift_expression,
      prec.left(PREC.BITWISE_AND, seq(
        field('left', $.bitwise_and_expression),
        '&',
        field('right', $.shift_expression)
      )),
    ),

    shift_expression: $ => choice(
      $.arithmetic_expression,
      prec.left(PREC.SHIFT, seq(
        field('left', $.shift_expression),
        choice('<<', '>>'),
        field('right', $.arithmetic_expression)
      )),
    ),

    arithmetic_expression: $ => choice(
      $.term_expression,
      prec.left(PREC.PLUS, seq(
        field('left', $.arithmetic_expression),
        choice('+', '-'),
        field('right', $.term_expression)
      )),
    ),

    term_expression: $ => choice(
      $.power_expression,
      prec.left(PREC.TIMES, seq(
        field('left', $.term_expression),
        choice('*', '/', '//', '%'),
        field('right', $.power_expression)
      )),
    ),

    power_expression: $ => choice(
      $.unary_expression,
      prec.right(PREC.POWER, seq(
        field('left', $.unary_expression),
        '**',
        field('right', $.power_expression)
      )),
    ),

    unary_expression: $ => choice(
      $.primary_expression,
      prec(PREC.UNARY, seq(
        choice('+', '-', '~', 'not'),
        $.unary_expression
      )),
    ),

    walrus_operator: $ => prec.right(PREC.WALRUS, seq(
      $.identifier,
      ':=',
      $.expression,
    )),

    primary_expression: $ => choice(
      $.identifier,
      $.literal,
      $.builtin_constant,
      $.environment_variable,
      $.attribute,
      $.subscript,
      $.call,
      $.list,
      $.tuple,
      $.dict,
      $.parenthesized_expression,
      $.special_call,
    ),

    attribute: $ => prec(PREC.ATTRIBUTE, seq(
      field('object', $.primary_expression),
      '.',
      field('attribute', $.identifier),
    )),

    subscript: $ => prec(PREC.SUBSCRIPT, seq(
      field('object', $.primary_expression),
      '[',
      field('index', choice($.expression, $.slice)),
      ']',
    )),

    slice: $ => seq(
      optional($.expression),
      ':',
      optional($.expression),
      optional(seq(':', optional($.expression))),
    ),

    call: $ => prec(PREC.CALL, seq(
      field('function', $.primary_expression),
      '(',
      optional(field('arguments', $.argument_list)),
      ')',
    )),

    argument_list: $ => seq(
      choice($.argument, $.keyword_argument),
      repeat(seq(',', choice($.argument, $.keyword_argument))),
      optional(','),
    ),

    argument: $ => $.expression,

    keyword_argument: $ => seq(
      field('name', $.identifier),
      '=',
      field('value', $.expression),
    ),

    // ==========================================
    // Special Vyper Calls
    // ==========================================
    special_call: $ => choice(
      $.empty_call,
      $.abi_decode_call,
      $.convert_call,
      $.external_call,
      $.static_call,
      $.create_copy_of,
      $.create_from_blueprint,
      $.raw_call,
      $.send_call,
      $.len_call,
      $.min_max_call,
      $.method_id_call,
    ),

    empty_call: $ => seq(
      'empty',
      '(',
      $.type,
      ')',
    ),

    abi_decode_call: $ => seq(
      choice('abi_decode', '_abi_decode'),
      '(',
      $.expression,
      ',',
      $.type,
      repeat(seq(',', $.keyword_argument)),
      ')',
    ),

    convert_call: $ => seq(
      'convert',
      '(',
      $.expression,
      ',',
      $.type,
      ')',
    ),

    external_call: $ => seq(
      'extcall',
      $.primary_expression,
    ),

    static_call: $ => seq(
      'staticcall',
      $.primary_expression,
    ),

    create_copy_of: $ => seq(
      'create_copy_of',
      '(',
      $.expression,
      optional(seq(',', $.keyword_argument)),
      ')',
    ),

    create_from_blueprint: $ => seq(
      'create_from_blueprint',
      '(',
      $.expression,
      repeat(seq(',', $.expression)),
      optional(seq(',', $.keyword_argument)),
      ')',
    ),

    raw_call: $ => seq(
      'raw_call',
      '(',
      $.argument_list,
      ')',
    ),

    send_call: $ => seq(
      'send',
      '(',
      $.expression,
      ',',
      $.expression,
      ')',
    ),

    len_call: $ => seq(
      'len',
      '(',
      $.expression,
      ')',
    ),

    min_max_call: $ => seq(
      choice('min', 'max'),
      '(',
      $.expression,
      ',',
      $.expression,
      ')',
    ),

    method_id_call: $ => seq(
      'method_id',
      '(',
      $.expression,
      ')',
    ),

    // ==========================================
    // Collections
    // ==========================================
    list: $ => seq(
      '[',
      optional($.expression_list),
      ']',
    ),

    tuple: $ => choice(
      seq('(', ')'),
      seq('(', $.expression, ',', ')'),
      seq('(', $.expression, repeat1(seq(',', $.expression)), optional(','), ')'),
    ),

    dict: $ => seq(
      '{',
      optional(seq(
        $.pair,
        repeat(seq(',', $.pair)),
        optional(','),
      )),
      '}',
    ),

    pair: $ => seq(
      field('key', $.expression),
      ':',
      field('value', $.expression),
    ),

    expression_list: $ => seq(
      $.expression,
      repeat(seq(',', $.expression)),
      optional(','),
    ),

    parenthesized_expression: $ => prec(PREC.PRIMARY, seq(
      '(',
      $.expression,
      ')',
    )),

    // ==========================================
    // Patterns (for destructuring)
    // ==========================================
    pattern: $ => choice(
      $.identifier_pattern,
      $.tuple_pattern,
      $.list_pattern,
      $.attribute_pattern,
      $.subscript_pattern,
      $.splat_pattern,
    ),

    identifier_pattern: $ => $.identifier,

    tuple_pattern: $ => seq(
      '(',
      optional(seq(
        $.pattern,
        repeat(seq(',', $.pattern)),
        optional(','),
      )),
      ')',
    ),

    list_pattern: $ => seq(
      '[',
      optional(seq(
        $.pattern,
        repeat(seq(',', $.pattern)),
        optional(','),
      )),
      ']',
    ),

    attribute_pattern: $ => seq(
      $.pattern,
      '.',
      $.identifier,
    ),

    subscript_pattern: $ => seq(
      $.pattern,
      '[',
      $.expression,
      ']',
    ),

    splat_pattern: $ => seq('*', $.identifier),
    splat_type: $ => seq('*', $.identifier),

    // ==========================================
    // Literals
    // ==========================================
    literal: $ => choice(
      $.integer,
      $.float,
      $.string,
      $.boolean,
      $.none,
      $.ellipsis,
    ),

    integer: $ => token(choice(
      /[0-9]+/,
      /0[xX][0-9a-fA-F]+/,
      /0[oO][0-7]+/,
      /0[bB][01]+/,
    )),

    float: $ => {
      const digits = /[0-9]+/;
      const exponent = /[eE][+-]?[0-9]+/;
      return token(choice(
        seq(digits, '.', optional(digits), optional(exponent)),
        seq('.', digits, optional(exponent)),
        seq(digits, exponent),
      ));
    },

    string: $ => choice(
      $.string_literal,
      $.bytes_literal,
      $.f_string,
    ),

    string_literal: $ => token(choice(
      // Single-quoted strings
      /[bBrRuU]?'([^'\\]|\\.)*'/,
      // Double-quoted strings  
      /[bBrRuU]?"([^"\\]|\\.)*"/,
      // Triple-quoted strings (single quotes)
      /[bBrRuU]?'''[\s\S]*?'''/,
      // Triple-quoted strings (double quotes)
      /[bBrRuU]?"""[\s\S]*?"""/,
    )),

    bytes_literal: $ => token(choice(
      /[bB]"([^"\\]|\\.)*"/,
      /[bB]'([^'\\]|\\.)*'/,
    )),

    f_string: $ => token(choice(
      /[fF]"[^"]*"/,
      /[fF]'[^']*'/,
    )),

    boolean: $ => choice('True', 'False'),
    none: $ => 'None',
    ellipsis: $ => '...',

    // ==========================================
    // Built-in Constants and Variables
    // ==========================================
    builtin_constant: $ => choice(
      'ZERO_ADDRESS',
      'MAX_INT128',
      'MIN_INT128',
      'MAX_DECIMAL',
      'MIN_DECIMAL',
      'MAX_UINT256',
      'EMPTY_BYTES32',
    ),

    environment_variable: $ => choice(
      seq('msg', '.', choice('sender', 'value', 'gas', 'data')),
      seq('block', '.', choice('number', 'timestamp', 'difficulty', 'prevhash', 'coinbase')),
      seq('tx', '.', choice('origin', 'gasprice')),
      seq('chain', '.', 'id'),
      'self',
    ),

    // ==========================================
    // Comments and Identifiers
    // ==========================================
    comment: $ => token(prec(-1, seq('#', /[^\r\n]*/))),
    
    // NatSpec documentation strings (triple-quoted)
    docstring: $ => prec(PREC.DOCSTRING, 
      choice(
        // Triple single quotes
        /'''([^']|'[^']|''[^'])*'''/,
        // Triple double quotes  
        /"""([^"]|"[^"]|""[^"])*"""/,
      )
    ),

    line_continuation: $ => token(seq('\\', /\r?\n/)),

    identifier: $ => /[a-zA-Z_][a-zA-Z0-9_]*/,
  },
});

// Helper function for separating items with a separator
function sep1(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

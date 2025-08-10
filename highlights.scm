; Auto-generated highlights.scm file
; Comprehensive semantic token highlighting for Vyper
; Generated from node-types.json with enhanced pattern matching

; === KEYWORDS ===
"Callable" @keyword
"DynArray" @keyword
"EMPTY_BYTES32" @keyword
"False" @constant.builtin
"HashMap" @keyword
"MAX_DECIMAL" @keyword
"MAX_INT128" @keyword
"MAX_UINT256" @keyword
"MIN_DECIMAL" @keyword
"MIN_INT128" @keyword
"String" @keyword
"True" @constant.builtin
"UNREACHABLE" @keyword
"ZERO_ADDRESS" @keyword
"_abi_decode" @keyword
"abi_decode" @keyword
"address" @keyword
"and" @keyword.operator
"as" @keyword.import
"assert" @keyword.return
"block" @keyword
"bool" @keyword
"bytes" @keyword
"bytes32" @keyword
"chain" @keyword
"coinbase" @keyword
"constant" @keyword
"convert" @keyword
"create_copy_of" @keyword
"create_from_blueprint" @keyword
"data" @keyword
"def" @keyword.declaration
"difficulty" @keyword
"elif" @keyword.control
"else" @keyword.control
"empty" @keyword
"enum" @keyword.declaration
"event" @keyword
"exports" @keyword.import
"extcall" @keyword
"flag" @keyword
"for" @keyword.control
"from" @keyword.import
"gas" @keyword
"gasprice" @keyword
"id" @keyword
"if" @keyword.control
"immutable" @keyword
"implements" @keyword.import
"import" @keyword.import
"in" @keyword.operator
"indexed" @keyword
"interface" @keyword.declaration
"len" @keyword
"log" @keyword
"max" @keyword
"method_id" @keyword
"min" @keyword
"msg" @keyword
"nonpayable" @keyword.modifier
"not" @keyword.operator
"number" @keyword
"or" @keyword.operator
"origin" @keyword
"pass" @keyword
"payable" @keyword.modifier
"prevhash" @keyword
"public" @keyword.modifier
"pure" @keyword.modifier
"raise" @keyword.return
"raw_call" @keyword
"return" @keyword.return
"self" @keyword
"send" @keyword
"sender" @keyword
"staticcall" @keyword
"string" @keyword
"struct" @keyword.declaration
"timestamp" @keyword
"transient" @keyword
"tx" @keyword
"value" @keyword
"version" @keyword
"view" @keyword.modifier

; === OPERATORS ===
"!=" @operator
"%" @operator
"%=" @operator
"&" @operator
"&=" @operator
"*" @operator
"**" @operator
"**=" @operator
"*=" @operator
"+" @operator
"+=" @operator
"-" @operator
"-=" @operator
"->" @operator
"." @operator
"/" @operator
"//" @operator
"//=" @operator
"/=" @operator
":" @operator
"<" @operator
"<<" @operator
"<<=" @operator
"<=" @operator
"=" @operator
"==" @operator
">" @operator
">=" @operator
">>" @operator
">>=" @operator
"@" @operator
"^" @operator
"^=" @operator
"|" @operator
"|=" @operator
"~" @operator

; === PUNCTUATION ===
"(" @punctuation.bracket
")" @punctuation.bracket
"," @punctuation.delimiter
"[" @punctuation.bracket
"]" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket

; === COMMENTS ===
(comment) @comment

; === LITERALS ===
(string) @string
(bytes_literal) @constant
(f_string) @string
(string_literal) @string

; === FUNCTIONS ===
(function_definition) @function
(function_signature) @function
(function_type) @function
(interface_function) @function
(method_id_call) @function

; === TYPES ===
(type) @type
(array_type) @type
(dynamic_array_type) @type
(mapping_type) @type
(qualified_type) @type
(return_type) @type
(tuple_type) @type

; === IDENTIFIERS ===
(identifier_pattern) @variable
(identifier) @variable

; === CONSTANTS ===
(builtin_constant) @constant

; === DECORATORS ===
(decorator) @decorator

; === FIELD-BASED SEMANTIC HIGHLIGHTING ===
(annotated_assignment type: (_) @type.annotation)
(attribute attribute: (identifier) @property)
(attribute object: (identifier) @variable.object)
(augmented_assignment operator: "%=") @operator
(augmented_assignment operator: "&=") @operator
(augmented_assignment operator: "**=") @operator
(augmented_assignment operator: "*=") @operator
(augmented_assignment operator: "+=") @operator
(augmented_assignment operator: "-=") @operator
(augmented_assignment operator: "//=") @operator
(augmented_assignment operator: "/=") @operator
(augmented_assignment operator: "<<=") @operator
(augmented_assignment operator: ">>=") @operator
(augmented_assignment operator: "^=") @operator
(augmented_assignment operator: "|=") @operator
(call function: (identifier) @function.call)
(comparison_expression operator: "!=") @operator
(comparison_expression operator: "<") @operator
(comparison_expression operator: "<=") @operator
(comparison_expression operator: "==") @operator
(comparison_expression operator: ">") @operator
(comparison_expression operator: ">=") @operator
(comparison_expression operator: "in") @operator
(comparison_expression operator: "not") @operator
(constant_declaration name: (identifier) @constant.definition)
(function_signature name: (identifier) @function.name)
(parameter name: (identifier) @variable.definition)
(parameter type: (_) @type.annotation)
(subscript object: (identifier) @variable.object)
(variable_declaration name: (identifier) @variable.definition)

; === CONTEXTUAL PATTERNS ===
; Enhanced patterns based on context and usage

; Function calls
(call function: (identifier) @function.call)
(call function: (attribute attribute: (identifier) @method.call))

; Type annotations
(annotated_assignment type: (identifier) @type.annotation)
(parameter type: (identifier) @type.annotation)

; Property/attribute access
(attribute object: (identifier) @variable)
(attribute attribute: (identifier) @property)

; Built-in types
((identifier) @type.builtin
 (#match? @type.builtin "^(bool|int|uint|address|bytes|string)"))

; Built-in constants
((identifier) @constant.builtin
 (#match? @constant.builtin "^(True|False|None|ZERO_ADDRESS|MAX_INT|MIN_INT)"))

; === LANGUAGE-SPECIFIC PATTERNS ===
; Vyper-specific highlighting
(decorator "@" @decorator)
(decorator (identifier) @decorator.name)
(environment_variable) @variable.builtin

; Vyper visibility modifiers
((identifier) @keyword.modifier
 (#match? @keyword.modifier "^(external|internal|public|private|pure|view|payable|nonpayable)$"))

; Vyper built-in functions
((identifier) @function.builtin
 (#match? @function.builtin "^(len|min|max|abs|send|raw_call|create_copy_of)$"))

; Add more language-specific patterns as needed
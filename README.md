# Bettermath

A math (and more, hence the `better-`) grammar --- and interpreter --- made in JS (with Typescript! Using [Parsimmon](https://github.com/jneen/parsimmon/)). 

Parses expression strings and generates the corresponding AST (Abstract Syntax Tree), validating syntax and semantics (JavaScript allows you to sum a string and a number, bettermath prevents you from doing that).

Each node also contains a `getValue()` function which can be called to obtain the subtree's computed value (calling it for the root node will return the whole expression's value)

On top of this, it allows for custom functions to be introduced, making it extensible in a plugin fashion.

> All functions are in the format FUNCTION(ARG1, ARG2, ..., ARG_N).

## Getting Started

```typescript
import { buildGrammar, FunctionRegistry } from "bettermath";

const functionRegistry = new FunctionRegistry()

// Here, you may register additional functions if desired
functionRegistry.register(
    "myFunc", 
    (indexInfo: Index, args: IFunctionArg<number>[]) => new MyFunc(indexInfo, args)
);

const grammar = buildGrammar(functionRegistry);

// Compute the AST
grammar.parse("= 11 + 12 + 13")

/* Simplified result:

{
  status: true,
  value: AddFunction {
    indexInfo: { offset: 14, line: 1, column: 15 },
    type: 'function',
    fn: 'Add',
    args: [
      AddFunction {
        indexInfo: { offset: 14, line: 1, column: 15 },
        type: 'function',
        fn: 'Add',
        args: [
          NumberType {
            indexInfo: { offset: 4, line: 1, column: 5 },
            type: 'number',
            value: 11
          },
          NumberType {
            indexInfo: { offset: 9, line: 1, column: 10 },
            type: 'number',
            value: 12
          }
        ],
        returnType: 'number',
      },
      NumberType {
        indexInfo: { offset: 14, line: 1, column: 15 },
        type: 'number',
        value: 13
      }
    ],
    returnType: 'number',
  }
}

*/
```

## Validation

Validation is done on 2 stages. First, syntatic validation is done by the parser (i.e., without a valid syntax, no AST will be produced, and an error will be output instead). If the expression is syntactically correct, semantic validation can be triggered by using the provided validator, which will validate each node of the AST automatically. Each node is valid if it is a simple value (string, number) or, in the case of functions, its arguments follow the validation rules for the given function (e.g. the Negate function must have 1 argument, and it must be a number)

```typescript

import { validate } from "bettermath";

const ast = grammar.parse('=NEGATE("1")');

validate(ast)

/*
{
    success: false,
    errors: [
      {
        index: {
            column: 12,
            line: 1,
            offset: 11,
        },
        message: "Argument of type 'string' is not valid. Argument must be a 'number'."
      }
    ]
}
*/

```

## Testing

All the current grammar functionality is unit tested, covering the supported parsing cases, as well as the semantic validation of functions. As the grammar grows, the new scenarios should be added to the test suite so that regressions are avoided.

To run the tests, simply execute `npm test`

## Versioning

This packages follows the [Angular Commit Guidelines](https://github.com/angular/angular/blob/22b96b9/CONTRIBUTING.md#-commit-message-guidelines). This is used for auto-publishing to npm and release creation.
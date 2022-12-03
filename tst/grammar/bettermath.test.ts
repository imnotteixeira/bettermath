import { inspect } from "util";
import type P from "parsimmon";

import cellFunctionParser from "../../src/grammar/bettermath";
import type {
    ExpressionType,
    NumberType,
    StringType,
} from "../../src/grammar/function/definitions";

describe("Grammar", () => {
    describe("Immediate Values", () => {
        test("should parse number", () => {
            const expectedNumber: NumberType = {
                type: "number",
                value: 12,
            };
            expect<NumberType>(
                cellFunctionParser.tryParse("12") as NumberType,
            ).toStrictEqual<NumberType>(expectedNumber);
        });

        test("should parse negative number", () => {
            const expectedNumber: NumberType = {
                type: "number",
                value: -12,
            };
            expect<NumberType>(
                cellFunctionParser.tryParse("-12") as NumberType,
            ).toStrictEqual<NumberType>(expectedNumber);
        });

        test("should parse number after EQUALS", () => {
            const expectedNumber: NumberType = {
                type: "number",
                value: 12,
            };
            expect<NumberType>(
                cellFunctionParser.tryParse("=12") as NumberType,
            ).toStrictEqual<NumberType>(expectedNumber);
        });

        test("should parse string", () => {
            const expectedNumber: StringType = {
                type: "string",
                value: "1+1",
            };
            expect<StringType>(
                cellFunctionParser.tryParse("1+1") as StringType,
            ).toStrictEqual<StringType>(expectedNumber);
        });

        test("should parse string after EQUALS", () => {
            const expectedNumber: StringType = {
                type: "string",
                value: "asd",
            };
            expect<StringType>(
                cellFunctionParser.tryParse('="asd"') as StringType,
            ).toStrictEqual<StringType>(expectedNumber);
        });
    });

    describe("Expression values", () => {
        describe("Custom Functions", () => {
            test("should parse function with number arguments", () => {
                const expectedExpression: ExpressionType = {
                    type: "function",
                    fn: "CONCAT",
                    args: [
                        {
                            type: "number",
                            value: 12,
                        },
                        {
                            type: "number",
                            value: 12,
                        },
                    ],
                };

                expect<ExpressionType>(
                    cellFunctionParser.tryParse("=CONCAT(12, 12)") as ExpressionType,
                ).toStrictEqual<ExpressionType>(expectedExpression);
            });
            test("should parse function with string arguments", () => {
                const expectedExpression: ExpressionType = {
                    type: "function",
                    fn: "CONCAT",
                    args: [
                        {
                            type: "string",
                            value: "12",
                        },
                        {
                            type: "string",
                            value: "12",
                        },
                    ],
                };

                expect<ExpressionType>(
                    cellFunctionParser.tryParse('=CONCAT("12", "12")') as ExpressionType,
                ).toStrictEqual<ExpressionType>(expectedExpression);
            });
            test("should parse function with number and string arguments", () => {
                const expectedExpression: ExpressionType = {
                    type: "function",
                    fn: "CONCAT",
                    args: [
                        {
                            type: "number",
                            value: 12,
                        },
                        {
                            type: "string",
                            value: "12",
                        },
                    ],
                };

                expect<ExpressionType>(
                    cellFunctionParser.tryParse('=CONCAT(12, "12")') as ExpressionType,
                ).toStrictEqual<ExpressionType>(expectedExpression);
            });
            test("should error when string argument has too many quotes", () => {
                const failure = {
                    status: false,
                    index: {
                        offset: 14,
                        line: 1,
                        column: 15,
                    },
                };

                expect<P.Result<ExpressionType>>(
                    cellFunctionParser.parse('=CONCAT(12, ""12")'),
                ).toStrictEqual<P.Failure>(expect.objectContaining(failure));
            });

            test("should parse string escape", () => {
                const expectedExpression: ExpressionType = {
                    type: "function",
                    fn: "CONCAT",
                    args: [
                        {
                            type: "number",
                            value: 12,
                        },
                        {
                            type: "string",
                            value: '"12',
                        },
                    ],
                };

                expect<ExpressionType>(
                    // The received string in the parser is =CONCAT(12, "\"12");
                    // even though we are using single-quotes, the \" is converted into " by JavaScript
                    // so we need to escape the escape, so that the parser receives the \" (literally)
                    // (i.e. so that we send the escaping combination to the parser instead of letting JS escape it right away)
                    cellFunctionParser.tryParse('=CONCAT(12, "\\"12")') as ExpressionType,
                ).toStrictEqual<ExpressionType>(expectedExpression);
            });

            test("should parse string with multiple quote levels", () => {
                const expectedExpression: ExpressionType = {
                    type: "function",
                    fn: "CONCAT",
                    args: [
                        {
                            type: "number",
                            value: 12,
                        },
                        {
                            type: "string",
                            value: '""12""',
                        },
                    ],
                };

                expect<ExpressionType>(
                    cellFunctionParser.tryParse('=CONCAT(12, "\\"\\"12\\"\\"")') as ExpressionType,
                ).toStrictEqual<ExpressionType>(expectedExpression);
            });

            test("should parse string with escapes of escapes", () => {
                const expectedExpression: ExpressionType = {
                    type: "function",
                    fn: "CONCAT",
                    args: [
                        {
                            type: "number",
                            value: 12,
                        },
                        {
                            type: "string",
                            value: '""12""',
                        },
                    ],
                };

                expect<ExpressionType>(
                    cellFunctionParser.tryParse('=CONCAT(12, "\\"\\"12\\"\\"")') as ExpressionType,
                ).toStrictEqual<ExpressionType>(expectedExpression);
            });

            test("should fail parsing of invalid function", () => {
                const failure = {
                    status: false,
                    index: {
                        offset: 1,
                        line: 1,
                        column: 2,
                    },
                };

                expect<P.Result<ExpressionType>>(
                    cellFunctionParser.parse('=INVALIDFN("a", "b")'),
                ).toStrictEqual<P.Failure>(expect.objectContaining(failure));
            });
        });

        describe("Math Operations", () => {
            describe("Negation Operator", () => {
                test("should parse negated number", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Negate",
                        args: [
                            {
                                type: "number",
                                value: 12,
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=-12") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });
                test("should parse subtraction", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Subtract",
                        args: [
                            {
                                type: "number",
                                value: 11,
                            },
                            {
                                type: "number",
                                value: 12,
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11-12") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });
                test("should parse sequential subtraction", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Subtract",
                        args: [
                            {
                                type: "function",
                                fn: "Subtract",
                                args: [
                                    {
                                        type: "number",
                                        value: 11,
                                    },
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                ],
                            },
                            {
                                type: "number",
                                value: 13,
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11-12-13") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });
            });

            describe("Addition Operator", () => {
                test("should parse Addition", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Add",
                        args: [
                            {
                                type: "number",
                                value: 11,
                            },
                            {
                                type: "number",
                                value: 12,
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11+12") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });
                test("should parse sequential Addition", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Add",
                        args: [
                            {
                                type: "function",
                                fn: "Add",
                                args: [
                                    {
                                        type: "number",
                                        value: 11,
                                    },
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                ],
                            },
                            {
                                type: "number",
                                value: 13,
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11+12+13") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });
            });

            describe("Multiplication Operator", () => {
                test("should parse Multiplication", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Multiply",
                        args: [
                            {
                                type: "number",
                                value: 11,
                            },
                            {
                                type: "number",
                                value: 12,
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11*12") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });
                test("should parse sequential Multiplication", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Multiply",
                        args: [
                            {
                                type: "function",
                                fn: "Multiply",
                                args: [
                                    {
                                        type: "number",
                                        value: 11,
                                    },
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                ],
                            },
                            {
                                type: "number",
                                value: 13,
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11*12*13") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });
            });

            describe("Division Operator", () => {
                test("should parse Division", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Divide",
                        args: [
                            {
                                type: "number",
                                value: 11,
                            },
                            {
                                type: "number",
                                value: 12,
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11/12") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });
                test("should parse sequential Division", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Divide",
                        args: [
                            {
                                type: "function",
                                fn: "Divide",
                                args: [
                                    {
                                        type: "number",
                                        value: 11,
                                    },
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                ],
                            },
                            {
                                type: "number",
                                value: 13,
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11/12/13") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });
            });

            describe("Power Operator", () => {
                test("should parse Power", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Exponentiate",
                        args: [
                            {
                                type: "number",
                                value: 11,
                            },
                            {
                                type: "number",
                                value: 12,
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11^12") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });
                test("should parse sequential Power", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Exponentiate",
                        args: [
                            {
                                type: "number",
                                value: 11,
                            },
                            {
                                type: "function",
                                fn: "Exponentiate",
                                args: [
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                    {
                                        type: "number",
                                        value: 13,
                                    },
                                ],
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11^12^13") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });
            });

            describe("Factorial Operator", () => {
                test("should parse Factorial", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Factorial",
                        args: [
                            {
                                type: "number",
                                value: 11,
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11!") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });
                test("should parse sequential Factorial", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Factorial",
                        args: [
                            {
                                type: "function",
                                fn: "Factorial",
                                args: [
                                    {
                                        type: "number",
                                        value: 11,
                                    },
                                ],
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11!!") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });
            });

            describe("Operation Priority", () => {
                test("should prioritize negation over Factorial", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Factorial",
                        args: [
                            {
                                type: "function",
                                fn: "Negate",
                                args: [
                                    {
                                        type: "number",
                                        value: 11,
                                    },
                                ],
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=-11!") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });

                test("should prioritize Factorial over Power", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Exponentiate",
                        args: [
                            {
                                type: "number",
                                value: 11,
                            },
                            {
                                type: "function",
                                fn: "Factorial",
                                args: [
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                ],
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11^12!") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });

                test("should prioritize Power over Multiplication", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Multiply",
                        args: [
                            {
                                type: "number",
                                value: 11,
                            },
                            {
                                type: "function",
                                fn: "Exponentiate",
                                args: [
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                    {
                                        type: "number",
                                        value: 13,
                                    },
                                ],
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11*12^13") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });

                test("should prioritize Power over Division", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Divide",
                        args: [
                            {
                                type: "number",
                                value: 11,
                            },
                            {
                                type: "function",
                                fn: "Exponentiate",
                                args: [
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                    {
                                        type: "number",
                                        value: 13,
                                    },
                                ],
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11/12^13") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });

                test("should prioritize Multiplication over Addition", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Add",
                        args: [
                            {
                                type: "number",
                                value: 11,
                            },
                            {
                                type: "function",
                                fn: "Multiply",
                                args: [
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                    {
                                        type: "number",
                                        value: 13,
                                    },
                                ],
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11+12*13") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });

                test("should prioritize Multiplication over Subtraction", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Subtract",
                        args: [
                            {
                                type: "number",
                                value: 11,
                            },
                            {
                                type: "function",
                                fn: "Multiply",
                                args: [
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                    {
                                        type: "number",
                                        value: 13,
                                    },
                                ],
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11-12*13") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });

                test("should prioritize Division over Addition", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Add",
                        args: [
                            {
                                type: "number",
                                value: 11,
                            },
                            {
                                type: "function",
                                fn: "Divide",
                                args: [
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                    {
                                        type: "number",
                                        value: 13,
                                    },
                                ],
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11+12/13") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });

                test("should prioritize Division over Subtraction", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Subtract",
                        args: [
                            {
                                type: "number",
                                value: 11,
                            },
                            {
                                type: "function",
                                fn: "Divide",
                                args: [
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                    {
                                        type: "number",
                                        value: 13,
                                    },
                                ],
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11-12/13") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });

                test("should not prioritize Multiplication over Division or vice-versa", () => {
                    const expectedExpression1: ExpressionType = {
                        type: "function",
                        fn: "Divide",
                        args: [
                            {
                                type: "function",
                                fn: "Multiply",
                                args: [
                                    {
                                        type: "number",
                                        value: 11,
                                    },
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                ],
                            },
                            {
                                type: "number",
                                value: 13,
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11*12/13") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression1);

                    const expectedExpression2: ExpressionType = {
                        type: "function",
                        fn: "Multiply",
                        args: [
                            {
                                type: "function",
                                fn: "Divide",
                                args: [
                                    {
                                        type: "number",
                                        value: 11,
                                    },
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                ],
                            },
                            {
                                type: "number",
                                value: 13,
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11/12*13") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression2);
                });

                test("should not prioritize Addition over Subtraction or vice-versa", () => {
                    const expectedExpression1: ExpressionType = {
                        type: "function",
                        fn: "Subtract",
                        args: [
                            {
                                type: "function",
                                fn: "Add",
                                args: [
                                    {
                                        type: "number",
                                        value: 11,
                                    },
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                ],
                            },
                            {
                                type: "number",
                                value: 13,
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11+12-13") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression1);

                    const expectedExpression2: ExpressionType = {
                        type: "function",
                        fn: "Add",
                        args: [
                            {
                                type: "function",
                                fn: "Subtract",
                                args: [
                                    {
                                        type: "number",
                                        value: 11,
                                    },
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                ],
                            },
                            {
                                type: "number",
                                value: 13,
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11-12+13") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression2);
                });

                test("should prioritize parenthesis expressions", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Negate",
                        args: [
                            {
                                type: "function",
                                fn: "Add",
                                args: [
                                    {
                                        type: "number",
                                        value: 11,
                                    },
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                ],
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=-(11+12)") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });

                test("should prioritize Custom Function expressions", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Subtract",
                        args: [
                            {
                                type: "number",
                                value: 11,
                            },
                            {
                                type: "function",
                                fn: "SUM",
                                args: [
                                    {
                                        type: "number",
                                        value: 12,
                                    },
                                    {
                                        type: "number",
                                        value: 13,
                                    },
                                ],
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse("=11-SUM(12,13)") as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });

                test("should apply priorities correctly in complex expression", () => {
                    const expectedExpression: ExpressionType = {
                        type: "function",
                        fn: "Add",
                        args: [
                            {
                                type: "function",
                                fn: "Add",
                                args: [
                                    {
                                        type: "function",
                                        fn: "Subtract",
                                        args: [
                                            {
                                                type: "function",
                                                fn: "Add",
                                                args: [
                                                    {
                                                        type: "function",
                                                        fn: "Divide",
                                                        args: [
                                                            {
                                                                type: "function",
                                                                fn: "Exponentiate",
                                                                args: [
                                                                    { type: "number", value: 2 },
                                                                    {
                                                                        type: "function",
                                                                        fn: "Negate",
                                                                        args: [
                                                                            {
                                                                                type: "number",
                                                                                value: 4,
                                                                            },
                                                                        ],
                                                                    },
                                                                ],
                                                            },
                                                            { type: "number", value: 6 },
                                                        ],
                                                    },
                                                    { type: "number", value: 11 },
                                                ],
                                            },
                                            {
                                                type: "function",
                                                fn: "SUM",
                                                args: [
                                                    {
                                                        type: "function",
                                                        fn: "Factorial",
                                                        args: [{ type: "number", value: 3 }],
                                                    },
                                                    {
                                                        type: "function",
                                                        fn: "Negate",
                                                        args: [{ type: "number", value: 13 }],
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        type: "function",
                                        fn: "Multiply",
                                        args: [
                                            {
                                                type: "function",
                                                fn: "Subtract",
                                                args: [
                                                    { type: "number", value: 2 },
                                                    { type: "number", value: 2 },
                                                ],
                                            },
                                            {
                                                type: "function",
                                                fn: "Factorial",
                                                args: [{ type: "number", value: 3 }],
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                type: "function",
                                fn: "Factorial",
                                args: [
                                    {
                                        type: "function",
                                        fn: "Multiply",
                                        args: [
                                            {
                                                type: "function",
                                                fn: "Negate",
                                                args: [{ type: "number", value: 2 }],
                                            },
                                            {
                                                type: "function",
                                                fn: "Negate",
                                                args: [{ type: "number", value: 3 }],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    };
                    expect<ExpressionType>(
                        cellFunctionParser.tryParse(
                            "=2^-4/6+11-SUM(3!,-13)+(2-2)*3!+(-2*-3)!",
                        ) as ExpressionType,
                    ).toStrictEqual<ExpressionType>(expectedExpression);
                });
            });
        });
    });
});

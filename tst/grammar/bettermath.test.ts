import { inspect } from "util";
import type P from "parsimmon";

import cellFunctionParser from "../../src/grammar/bettermath";
import { IExpressionType, NumberType, StringType } from "../../src/grammar/definitions";
import {
    ConcatFunction,
    NegateFunction,
    SubtractFunction,
    AddFunction,
    MultiplyFunction,
    DivideFunction,
    ExponentiateFunction,
    FactorialFunction,
} from "../../src/grammar/functions";
import { IFunction } from "../../src/grammar/functions/types";

describe("Grammar", () => {
    describe("Immediate Values", () => {
        test("should parse number", () => {
            const expectedNumber = new NumberType("12");

            expect(cellFunctionParser.tryParse("12").getValue()).toBe(expectedNumber.getValue());
        });

        test("should parse negative number", () => {
            const expectedNumber = new NumberType("-12");
            expect(cellFunctionParser.tryParse("-12").getValue()).toBe(expectedNumber.getValue());
        });

        test("should parse number after EQUALS", () => {
            const expectedNumber = new NumberType("12");

            expect(cellFunctionParser.tryParse("=12").getValue()).toBe(expectedNumber.getValue());
        });

        test("should parse string", () => {
            const expectedString = new StringType("1+1");

            expect(cellFunctionParser.tryParse("1+1").getValue()).toBe(expectedString.getValue());
        });

        test("should parse string after EQUALS", () => {
            const expectedString = new StringType("asd");

            expect(cellFunctionParser.tryParse('="asd"').getValue()).toBe(
                expectedString.getValue(),
            );
        });
    });

    describe("Expression values", () => {
        describe("Custom Functions", () => {
            test("should parse function with number arguments", () => {
                const expectedExpression = new ConcatFunction([
                    new NumberType("12"),
                    new NumberType("12"),
                ]);

                const parsingResult = cellFunctionParser.tryParse(
                    "=CONCAT(12, 12)",
                ) as IFunction<string>;

                expect(parsingResult.args.map(arg => arg.getValue())).toEqual([12, 12]);

                expect(parsingResult.getValue()).toBe(expectedExpression.getValue());
            });

            test("should parse function with string arguments", () => {
                const expectedExpression = new ConcatFunction([
                    new StringType("12"),
                    new StringType("12"),
                ]);

                const parsingResult = cellFunctionParser.tryParse(
                    '=CONCAT("12", "12")',
                ) as IFunction<string>;

                expect(parsingResult.args.map(arg => arg.getValue())).toEqual(["12", "12"]);

                expect(parsingResult.getValue()).toStrictEqual(expectedExpression.getValue());
            });

            test("should parse function with number and string arguments", () => {
                const expectedExpression = new ConcatFunction([
                    new NumberType("12"),
                    new StringType("12"),
                ]);

                const parsingResult = cellFunctionParser.tryParse(
                    '=CONCAT(12, "12")',
                ) as IFunction<string>;

                expect(parsingResult.args.map(arg => arg.getValue())).toEqual([12, "12"]);

                expect(parsingResult.getValue()).toStrictEqual(expectedExpression.getValue());
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

                expect<P.Result<IExpressionType<any>>>(
                    cellFunctionParser.parse('=CONCAT(12, ""12")'),
                ).toStrictEqual<P.Failure>(expect.objectContaining(failure));
            });

            test("should parse string escape", () => {
                const expectedExpression = new ConcatFunction([
                    new NumberType("12"),
                    new StringType('"12'),
                ]);

                const parsingResult = cellFunctionParser.tryParse(
                    '=CONCAT(12, "\\"12")',
                ) as IFunction<string>;

                expect(parsingResult.args.map(arg => arg.getValue())).toEqual([12, '"12']);

                expect(parsingResult.getValue()).toStrictEqual(expectedExpression.getValue());
            });

            test("should parse string with multiple quote levels", () => {
                const expectedExpression = new ConcatFunction([
                    new NumberType("12"),
                    new StringType('""12""'),
                ]);

                const parsingResult = cellFunctionParser.tryParse(
                    '=CONCAT(12, "\\"\\"12\\"\\"")',
                ) as IFunction<string>;

                expect(parsingResult.args.map(arg => arg.getValue())).toEqual([12, '""12""']);

                expect(parsingResult.getValue()).toStrictEqual(expectedExpression.getValue());
            });

            test("should parse string with escapes of escapes", () => {
                const expectedExpression = new ConcatFunction([
                    new NumberType("12"),
                    new StringType('"12'),
                ]);

                const parsingResult = cellFunctionParser.tryParse(
                    '=CONCAT(12, "\\"12")',
                ) as IFunction<string>;

                expect(parsingResult.args.map(arg => arg.getValue())).toEqual([12, '"12']);

                expect(parsingResult.getValue()).toStrictEqual(expectedExpression.getValue());
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

                expect<P.Result<IExpressionType<any>>>(
                    cellFunctionParser.parse('=INVALIDFN("a", "b")'),
                ).toStrictEqual<P.Failure>(expect.objectContaining(failure));
            });
        });

        describe("Math Operations", () => {
            describe("Negation Operator", () => {
                test("should parse negated number", () => {
                    const expectedExpression = new NegateFunction([new NumberType("12")]);

                    const parsingResult = cellFunctionParser.tryParse("=-12") as IFunction<string>;

                    expect(parsingResult.args.map(arg => arg.getValue())).toEqual([12]);

                    expect(parsingResult.getValue()).toStrictEqual(expectedExpression.getValue());
                });

                test("should parse subtraction", () => {
                    const expectedExpression = new SubtractFunction([
                        new NumberType("11"),
                        new NumberType("12"),
                    ]);

                    const parsingResult = cellFunctionParser.tryParse(
                        "=11-12",
                    ) as IFunction<string>;

                    expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 12]);

                    expect(parsingResult.getValue()).toStrictEqual(expectedExpression.getValue());
                });

                test("should parse sequential subtraction", () => {
                    const expectedExpression = new SubtractFunction([
                        new SubtractFunction([new NumberType("11"), new NumberType("12")]),
                        new NumberType("13"),
                    ]);

                    const parsingResult = cellFunctionParser.tryParse(
                        "=11-12-13",
                    ) as IFunction<string>;

                    expect(parsingResult.args.map(arg => arg.getValue())).toEqual([-1, 13]);

                    expect(parsingResult.getValue()).toStrictEqual(expectedExpression.getValue());
                });

                describe("Addition Operator", () => {
                    test("should parse Addition", () => {
                        const expectedExpression = new AddFunction([
                            new NumberType("11"),
                            new NumberType("12"),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=11+12",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 12]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should parse sequential Addition", () => {
                        const expectedExpression = new AddFunction([
                            new AddFunction([new NumberType("11"), new NumberType("12")]),
                            new NumberType("13"),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=11+12+13",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([23, 13]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });
                });

                describe("Multiplication Operator", () => {
                    test("should parse Multiplication", () => {
                        const expectedExpression = new MultiplyFunction([
                            new NumberType("11"),
                            new NumberType("12"),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=11*12",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 12]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should parse sequential Multiplication", () => {
                        const expectedExpression = new MultiplyFunction([
                            new MultiplyFunction([new NumberType("11"), new NumberType("12")]),
                            new NumberType("13"),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=11*12*13",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([132, 13]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });
                });

                describe("Division Operator", () => {
                    test("should parse Division", () => {
                        const expectedExpression = new DivideFunction([
                            new NumberType("11"),
                            new NumberType("12"),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=11/12",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 12]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should parse sequential Division", () => {
                        const expectedExpression = new DivideFunction([
                            new DivideFunction([new NumberType("11"), new NumberType("12")]),
                            new NumberType("13"),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=11/12/13",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([
                            11 / 12,
                            13,
                        ]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });
                });

                describe("Power Operator", () => {
                    test("should parse Power", () => {
                        const expectedExpression = new ExponentiateFunction([
                            new NumberType("2"),
                            new NumberType("3"),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=2^3",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([2, 3]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });
                    test("should parse sequential Power", () => {
                        const expectedExpression = new ExponentiateFunction([
                            new NumberType("2"),
                            new ExponentiateFunction([new NumberType("3"), new NumberType("4")]),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=2^3^4",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([
                            2,
                            Math.pow(3, 4),
                        ]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });
                });

                describe("Factorial Operator", () => {
                    test("should parse Factorial", () => {
                        const expectedExpression = new FactorialFunction([new NumberType("2")]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=2!",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([2]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should parse sequential Factorial", () => {
                        const expectedExpression = new FactorialFunction([
                            new FactorialFunction([new NumberType("3")]),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=3!!",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([6]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });
                });

                describe("Operation Priority", () => {
                    test("should prioritize negation over Factorial", () => {
                        const expectedExpression = new FactorialFunction([
                            new NegateFunction([new NumberType("11")]),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=-11!",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([-11]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should prioritize Factorial over Power", () => {
                        const expectedExpression = new ExponentiateFunction([
                            new NumberType("11"),
                            new FactorialFunction([new NumberType("12")]),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=11^12!",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([
                            11, 479001600,
                        ]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should prioritize Power over Multiplication", () => {
                        const expectedExpression = new MultiplyFunction([
                            new NumberType("11"),
                            new ExponentiateFunction([new NumberType("2"), new NumberType("3")]),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=11*2^3",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 8]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should prioritize Power over Division", () => {
                        const expectedExpression = new DivideFunction([
                            new NumberType("11"),
                            new ExponentiateFunction([new NumberType("2"), new NumberType("3")]),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=11/2^3",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 8]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should prioritize Multiplication over Addition", () => {
                        const expectedExpression = new AddFunction([
                            new NumberType("11"),
                            new MultiplyFunction([new NumberType("12"), new NumberType("13")]),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=11+12*13",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 156]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should prioritize Multiplication over Subtraction", () => {
                        const expectedExpression = new SubtractFunction([
                            new NumberType("11"),
                            new MultiplyFunction([new NumberType("12"), new NumberType("13")]),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=11-12*13",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 156]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should prioritize Division over Addition", () => {
                        const expectedExpression = new AddFunction([
                            new NumberType("11"),
                            new DivideFunction([new NumberType("12"), new NumberType("13")]),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=11+12/13",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([
                            11,
                            12 / 13,
                        ]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should prioritize Division over Subtraction", () => {
                        const expectedExpression = new SubtractFunction([
                            new NumberType("11"),
                            new DivideFunction([new NumberType("12"), new NumberType("13")]),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=11-12/13",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([
                            11,
                            12 / 13,
                        ]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should not prioritize Multiplication over Division or vice-versa", () => {
                        const expectedExpression1 = new DivideFunction([
                            new MultiplyFunction([new NumberType("11"), new NumberType("12")]),
                            new NumberType("13"),
                        ]);

                        const parsingResult1 = cellFunctionParser.tryParse(
                            "=11*12/13",
                        ) as IFunction<string>;

                        expect(parsingResult1.args.map(arg => arg.getValue())).toEqual([132, 13]);

                        expect(parsingResult1.getValue()).toStrictEqual(
                            expectedExpression1.getValue(),
                        );

                        const expectedExpression2 = new MultiplyFunction([
                            new DivideFunction([new NumberType("11"), new NumberType("12")]),
                            new NumberType("13"),
                        ]);

                        const parsingResult2 = cellFunctionParser.tryParse(
                            "=11/12*13",
                        ) as IFunction<string>;

                        expect(parsingResult2.args.map(arg => arg.getValue())).toEqual([
                            11 / 12,
                            13,
                        ]);

                        expect(parsingResult2.getValue()).toStrictEqual(
                            expectedExpression2.getValue(),
                        );
                    });

                    test("should not prioritize Addition over Subtraction or vice-versa", () => {
                        const expectedExpression1 = new SubtractFunction([
                            new AddFunction([new NumberType("11"), new NumberType("12")]),
                            new NumberType("13"),
                        ]);

                        const parsingResult1 = cellFunctionParser.tryParse(
                            "=11+12-13",
                        ) as IFunction<string>;

                        expect(parsingResult1.args.map(arg => arg.getValue())).toEqual([23, 13]);

                        expect(parsingResult1.getValue()).toStrictEqual(
                            expectedExpression1.getValue(),
                        );

                        const expectedExpression2 = new AddFunction([
                            new SubtractFunction([new NumberType("11"), new NumberType("12")]),
                            new NumberType("13"),
                        ]);

                        const parsingResult2 = cellFunctionParser.tryParse(
                            "=11-12+13",
                        ) as IFunction<string>;

                        expect(parsingResult2.args.map(arg => arg.getValue())).toEqual([-1, 13]);

                        expect(parsingResult2.getValue()).toStrictEqual(
                            expectedExpression2.getValue(),
                        );
                    });

                    test("should prioritize parenthesis expressions", () => {
                        const expectedExpression = new NegateFunction([
                            new AddFunction([new NumberType("11"), new NumberType("12")]),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=-(11+12)",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([23]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should prioritize Custom Function expressions", () => {
                        const expectedExpression = new SubtractFunction([
                            new NumberType("11"),
                            new AddFunction([new NumberType("12"), new NumberType("13")]),
                        ]);

                        const parsingResult = cellFunctionParser.tryParse(
                            "=11-SUM(12,13)",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 25]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should apply priorities correctly in complex expression", () => {
                        const expectedExpression = new AddFunction([
                            new AddFunction([
                                new SubtractFunction([
                                    new AddFunction([
                                        new DivideFunction([
                                            new ExponentiateFunction([
                                                new NumberType("2"),
                                                new NegateFunction([new NumberType("4")]),
                                            ]),
                                            new NumberType("6"),
                                        ]),
                                        new NumberType("11"),
                                    ]),
                                    new AddFunction([
                                        new FactorialFunction([new NumberType("3")]),
                                        new NegateFunction([new NumberType("13")]),
                                    ]),
                                ]),
                                new MultiplyFunction([
                                    new SubtractFunction([
                                        new NumberType("2"),
                                        new NumberType("2"),
                                    ]),
                                    new FactorialFunction([new NumberType("3")]),
                                ]),
                            ]),
                            new FactorialFunction([
                                new MultiplyFunction([
                                    new NegateFunction([new NumberType("2")]),
                                    new NegateFunction([new NumberType("3")]),
                                ]),
                            ]),
                        ]);
                        expect(
                            cellFunctionParser
                                .tryParse("=2^-4/6+11-SUM(3!,-13)+(2-2)*3!+(-2*-3)!")
                                .getValue(),
                        ).toStrictEqual(expectedExpression.getValue());
                    });
                });
            });
        });
    });
});

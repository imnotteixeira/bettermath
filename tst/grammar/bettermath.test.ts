import { inspect } from "util";
import type P from "parsimmon";

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
} from "../../src/grammar/functions/base";
import { IFunction } from "../../src/grammar/functions/types";
import buildGrammar from "../../src/grammar/bettermath";
import { FunctionRegistry } from "../../src/grammar/functions";
import { makeSemanticFailure, makeSuccess, validate } from "../../src/grammar/functions/validator";

describe("Grammar", () => {
    const INDEX_INFO: P.Index = {
        column: 1,
        offset: 2,
        line: 1,
    };

    const functionRegistry = new FunctionRegistry()
    const grammar = buildGrammar(functionRegistry);

    describe("AST Generation", () => {
        describe("Immediate Values", () => {
            test("should parse number", () => {
                const expectedNumber = new NumberType(INDEX_INFO, "12");

                expect(grammar.tryParse("12").getValue()).toBe(
                    expectedNumber.getValue(),
                );
            });

            test("should parse negative number", () => {
                const expectedNumber = new NumberType(INDEX_INFO, "-12");
                expect(grammar.tryParse("-12").getValue()).toBe(
                    expectedNumber.getValue(),
                );
            });

            test("should parse number after EQUALS", () => {
                const expectedNumber = new NumberType(INDEX_INFO, "12");

                expect(grammar.tryParse("=12").getValue()).toBe(
                    expectedNumber.getValue(),
                );
            });

            test("should parse string", () => {
                const expectedString = new StringType(INDEX_INFO, "1+1");

                expect(grammar.tryParse("1+1").getValue()).toBe(
                    expectedString.getValue(),
                );
            });

            test("should parse string after EQUALS", () => {
                const expectedString = new StringType(INDEX_INFO, "asd");

                expect(grammar.tryParse('="asd"').getValue()).toBe(
                    expectedString.getValue(),
                );
            });
        });

        describe("Expression values", () => {
            describe("Custom Functions", () => {
                test("should parse function with number arguments", () => {
                    const expectedExpression = new ConcatFunction(INDEX_INFO, [
                        new NumberType(INDEX_INFO, "12"),
                        new NumberType(INDEX_INFO, "12"),
                    ]);

                    const parsingResult = grammar.tryParse(
                        "=CONCAT(12, 12)",
                    ) as IFunction<string>;

                    expect(parsingResult.args.map(arg => arg.getValue())).toEqual([12, 12]);

                    expect(parsingResult.getValue()).toBe(expectedExpression.getValue());
                });

                test("should parse function with string arguments", () => {
                    const expectedExpression = new ConcatFunction(INDEX_INFO, [
                        new StringType(INDEX_INFO, "12"),
                        new StringType(INDEX_INFO, "12"),
                    ]);

                    const parsingResult = grammar.tryParse(
                        '=CONCAT("12", "12")',
                    ) as IFunction<string>;

                    expect(parsingResult.args.map(arg => arg.getValue())).toEqual(["12", "12"]);

                    expect(parsingResult.getValue()).toStrictEqual(expectedExpression.getValue());
                });

                test("should parse function with number and string arguments", () => {
                    const expectedExpression = new ConcatFunction(INDEX_INFO, [
                        new NumberType(INDEX_INFO, "12"),
                        new StringType(INDEX_INFO, "12"),
                    ]);

                    const parsingResult = grammar.tryParse(
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
                        grammar.parse('=CONCAT(12, ""12")'),
                    ).toStrictEqual<P.Failure>(expect.objectContaining(failure));
                });

                test("should parse string escape", () => {
                    const expectedExpression = new ConcatFunction(INDEX_INFO, [
                        new NumberType(INDEX_INFO, "12"),
                        new StringType(INDEX_INFO, '"12'),
                    ]);

                    const parsingResult = grammar.tryParse(
                        '=CONCAT(12, "\\"12")',
                    ) as IFunction<string>;

                    expect(parsingResult.args.map(arg => arg.getValue())).toEqual([12, '"12']);

                    expect(parsingResult.getValue()).toStrictEqual(expectedExpression.getValue());
                });

                test("should parse string with multiple quote levels", () => {
                    const expectedExpression = new ConcatFunction(INDEX_INFO, [
                        new NumberType(INDEX_INFO, "12"),
                        new StringType(INDEX_INFO, '""12""'),
                    ]);

                    const parsingResult = grammar.tryParse(
                        '=CONCAT(12, "\\"\\"12\\"\\"")',
                    ) as IFunction<string>;

                    expect(parsingResult.args.map(arg => arg.getValue())).toEqual([12, '""12""']);

                    expect(parsingResult.getValue()).toStrictEqual(expectedExpression.getValue());
                });

                test("should parse string with escapes of escapes", () => {
                    const expectedExpression = new ConcatFunction(INDEX_INFO, [
                        new NumberType(INDEX_INFO, "12"),
                        new StringType(INDEX_INFO, '"12'),
                    ]);

                    const parsingResult = grammar.tryParse(
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
                        grammar.parse('=INVALIDFN("a", "b")'),
                    ).toStrictEqual<P.Failure>(expect.objectContaining(failure));
                });
            });

            describe("Math Operations", () => {
                describe("Negation Operator", () => {
                    test("should parse negated number", () => {
                        const expectedExpression = new NegateFunction(INDEX_INFO, [
                            new NumberType(INDEX_INFO, "12"),
                        ]);

                        const parsingResult = grammar.tryParse(
                            "=-12",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([12]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should parse subtraction", () => {
                        const expectedExpression = new SubtractFunction(INDEX_INFO, [
                            new NumberType(INDEX_INFO, "11"),
                            new NumberType(INDEX_INFO, "12"),
                        ]);

                        const parsingResult = grammar.tryParse(
                            "=11-12",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 12]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    test("should parse sequential subtraction", () => {
                        const expectedExpression = new SubtractFunction(INDEX_INFO, [
                            new SubtractFunction(INDEX_INFO, [
                                new NumberType(INDEX_INFO, "11"),
                                new NumberType(INDEX_INFO, "12"),
                            ]),
                            new NumberType(INDEX_INFO, "13"),
                        ]);

                        const parsingResult = grammar.tryParse(
                            "=11-12-13",
                        ) as IFunction<string>;

                        expect(parsingResult.args.map(arg => arg.getValue())).toEqual([-1, 13]);

                        expect(parsingResult.getValue()).toStrictEqual(
                            expectedExpression.getValue(),
                        );
                    });

                    describe("Addition Operator", () => {
                        test("should parse Addition", () => {
                            const expectedExpression = new AddFunction(INDEX_INFO, [
                                new NumberType(INDEX_INFO, "11"),
                                new NumberType(INDEX_INFO, "12"),
                            ]);

                            const parsingResult = grammar.tryParse(
                                "=11+12",
                            ) as IFunction<string>;

                            expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 12]);

                            expect(parsingResult.getValue()).toStrictEqual(
                                expectedExpression.getValue(),
                            );
                        });

                        test("should parse sequential Addition", () => {
                            const expectedExpression = new AddFunction(INDEX_INFO, [
                                new AddFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "11"),
                                    new NumberType(INDEX_INFO, "12"),
                                ]),
                                new NumberType(INDEX_INFO, "13"),
                            ]);

                            const parsingResult = grammar.tryParse(
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
                            const expectedExpression = new MultiplyFunction(INDEX_INFO, [
                                new NumberType(INDEX_INFO, "11"),
                                new NumberType(INDEX_INFO, "12"),
                            ]);

                            const parsingResult = grammar.tryParse(
                                "=11*12",
                            ) as IFunction<string>;

                            expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 12]);

                            expect(parsingResult.getValue()).toStrictEqual(
                                expectedExpression.getValue(),
                            );
                        });

                        test("should parse sequential Multiplication", () => {
                            const expectedExpression = new MultiplyFunction(INDEX_INFO, [
                                new MultiplyFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "11"),
                                    new NumberType(INDEX_INFO, "12"),
                                ]),
                                new NumberType(INDEX_INFO, "13"),
                            ]);

                            const parsingResult = grammar.tryParse(
                                "=11*12*13",
                            ) as IFunction<string>;

                            expect(parsingResult.args.map(arg => arg.getValue())).toEqual([
                                132, 13,
                            ]);

                            expect(parsingResult.getValue()).toStrictEqual(
                                expectedExpression.getValue(),
                            );
                        });
                    });

                    describe("Division Operator", () => {
                        test("should parse Division", () => {
                            const expectedExpression = new DivideFunction(INDEX_INFO, [
                                new NumberType(INDEX_INFO, "11"),
                                new NumberType(INDEX_INFO, "12"),
                            ]);

                            const parsingResult = grammar.tryParse(
                                "=11/12",
                            ) as IFunction<string>;

                            expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 12]);

                            expect(parsingResult.getValue()).toStrictEqual(
                                expectedExpression.getValue(),
                            );
                        });

                        test("should parse sequential Division", () => {
                            const expectedExpression = new DivideFunction(INDEX_INFO, [
                                new DivideFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "11"),
                                    new NumberType(INDEX_INFO, "12"),
                                ]),
                                new NumberType(INDEX_INFO, "13"),
                            ]);

                            const parsingResult = grammar.tryParse(
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
                            const expectedExpression = new ExponentiateFunction(INDEX_INFO, [
                                new NumberType(INDEX_INFO, "2"),
                                new NumberType(INDEX_INFO, "3"),
                            ]);

                            const parsingResult = grammar.tryParse(
                                "=2^3",
                            ) as IFunction<string>;

                            expect(parsingResult.args.map(arg => arg.getValue())).toEqual([2, 3]);

                            expect(parsingResult.getValue()).toStrictEqual(
                                expectedExpression.getValue(),
                            );
                        });
                        test("should parse sequential Power", () => {
                            const expectedExpression = new ExponentiateFunction(INDEX_INFO, [
                                new NumberType(INDEX_INFO, "2"),
                                new ExponentiateFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "3"),
                                    new NumberType(INDEX_INFO, "4"),
                                ]),
                            ]);

                            const parsingResult = grammar.tryParse(
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
                            const expectedExpression = new FactorialFunction(INDEX_INFO, [
                                new NumberType(INDEX_INFO, "2"),
                            ]);

                            const parsingResult = grammar.tryParse(
                                "=2!",
                            ) as IFunction<string>;

                            expect(parsingResult.args.map(arg => arg.getValue())).toEqual([2]);

                            expect(parsingResult.getValue()).toStrictEqual(
                                expectedExpression.getValue(),
                            );
                        });

                        test("should parse sequential Factorial", () => {
                            const expectedExpression = new FactorialFunction(INDEX_INFO, [
                                new FactorialFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "3"),
                                ]),
                            ]);

                            const parsingResult = grammar.tryParse(
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
                            const expectedExpression = new FactorialFunction(INDEX_INFO, [
                                new NegateFunction(INDEX_INFO, [new NumberType(INDEX_INFO, "11")]),
                            ]);

                            const parsingResult = grammar.tryParse(
                                "=-11!",
                            ) as IFunction<string>;

                            expect(parsingResult.args.map(arg => arg.getValue())).toEqual([-11]);

                            expect(parsingResult.getValue()).toStrictEqual(
                                expectedExpression.getValue(),
                            );
                        });

                        test("should prioritize Factorial over Power", () => {
                            const expectedExpression = new ExponentiateFunction(INDEX_INFO, [
                                new NumberType(INDEX_INFO, "11"),
                                new FactorialFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "12"),
                                ]),
                            ]);

                            const parsingResult = grammar.tryParse(
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
                            const expectedExpression = new MultiplyFunction(INDEX_INFO, [
                                new NumberType(INDEX_INFO, "11"),
                                new ExponentiateFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "2"),
                                    new NumberType(INDEX_INFO, "3"),
                                ]),
                            ]);

                            const parsingResult = grammar.tryParse(
                                "=11*2^3",
                            ) as IFunction<string>;

                            expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 8]);

                            expect(parsingResult.getValue()).toStrictEqual(
                                expectedExpression.getValue(),
                            );
                        });

                        test("should prioritize Power over Division", () => {
                            const expectedExpression = new DivideFunction(INDEX_INFO, [
                                new NumberType(INDEX_INFO, "11"),
                                new ExponentiateFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "2"),
                                    new NumberType(INDEX_INFO, "3"),
                                ]),
                            ]);

                            const parsingResult = grammar.tryParse(
                                "=11/2^3",
                            ) as IFunction<string>;

                            expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 8]);

                            expect(parsingResult.getValue()).toStrictEqual(
                                expectedExpression.getValue(),
                            );
                        });

                        test("should prioritize Multiplication over Addition", () => {
                            const expectedExpression = new AddFunction(INDEX_INFO, [
                                new NumberType(INDEX_INFO, "11"),
                                new MultiplyFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "12"),
                                    new NumberType(INDEX_INFO, "13"),
                                ]),
                            ]);

                            const parsingResult = grammar.tryParse(
                                "=11+12*13",
                            ) as IFunction<string>;

                            expect(parsingResult.args.map(arg => arg.getValue())).toEqual([
                                11, 156,
                            ]);

                            expect(parsingResult.getValue()).toStrictEqual(
                                expectedExpression.getValue(),
                            );
                        });

                        test("should prioritize Multiplication over Subtraction", () => {
                            const expectedExpression = new SubtractFunction(INDEX_INFO, [
                                new NumberType(INDEX_INFO, "11"),
                                new MultiplyFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "12"),
                                    new NumberType(INDEX_INFO, "13"),
                                ]),
                            ]);

                            const parsingResult = grammar.tryParse(
                                "=11-12*13",
                            ) as IFunction<string>;

                            expect(parsingResult.args.map(arg => arg.getValue())).toEqual([
                                11, 156,
                            ]);

                            expect(parsingResult.getValue()).toStrictEqual(
                                expectedExpression.getValue(),
                            );
                        });

                        test("should prioritize Division over Addition", () => {
                            const expectedExpression = new AddFunction(INDEX_INFO, [
                                new NumberType(INDEX_INFO, "11"),
                                new DivideFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "12"),
                                    new NumberType(INDEX_INFO, "13"),
                                ]),
                            ]);

                            const parsingResult = grammar.tryParse(
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
                            const expectedExpression = new SubtractFunction(INDEX_INFO, [
                                new NumberType(INDEX_INFO, "11"),
                                new DivideFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "12"),
                                    new NumberType(INDEX_INFO, "13"),
                                ]),
                            ]);

                            const parsingResult = grammar.tryParse(
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
                            const expectedExpression1 = new DivideFunction(INDEX_INFO, [
                                new MultiplyFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "11"),
                                    new NumberType(INDEX_INFO, "12"),
                                ]),
                                new NumberType(INDEX_INFO, "13"),
                            ]);

                            const parsingResult1 = grammar.tryParse(
                                "=11*12/13",
                            ) as IFunction<string>;

                            expect(parsingResult1.args.map(arg => arg.getValue())).toEqual([
                                132, 13,
                            ]);

                            expect(parsingResult1.getValue()).toStrictEqual(
                                expectedExpression1.getValue(),
                            );

                            const expectedExpression2 = new MultiplyFunction(INDEX_INFO, [
                                new DivideFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "11"),
                                    new NumberType(INDEX_INFO, "12"),
                                ]),
                                new NumberType(INDEX_INFO, "13"),
                            ]);

                            const parsingResult2 = grammar.tryParse(
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
                            const expectedExpression1 = new SubtractFunction(INDEX_INFO, [
                                new AddFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "11"),
                                    new NumberType(INDEX_INFO, "12"),
                                ]),
                                new NumberType(INDEX_INFO, "13"),
                            ]);

                            const parsingResult1 = grammar.tryParse(
                                "=11+12-13",
                            ) as IFunction<string>;

                            expect(parsingResult1.args.map(arg => arg.getValue())).toEqual([
                                23, 13,
                            ]);

                            expect(parsingResult1.getValue()).toStrictEqual(
                                expectedExpression1.getValue(),
                            );

                            const expectedExpression2 = new AddFunction(INDEX_INFO, [
                                new SubtractFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "11"),
                                    new NumberType(INDEX_INFO, "12"),
                                ]),
                                new NumberType(INDEX_INFO, "13"),
                            ]);

                            const parsingResult2 = grammar.tryParse(
                                "=11-12+13",
                            ) as IFunction<string>;

                            expect(parsingResult2.args.map(arg => arg.getValue())).toEqual([
                                -1, 13,
                            ]);

                            expect(parsingResult2.getValue()).toStrictEqual(
                                expectedExpression2.getValue(),
                            );
                        });

                        test("should prioritize parenthesis expressions", () => {
                            const expectedExpression = new NegateFunction(INDEX_INFO, [
                                new AddFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "11"),
                                    new NumberType(INDEX_INFO, "12"),
                                ]),
                            ]);

                            const parsingResult = grammar.tryParse(
                                "=-(11+12)",
                            ) as IFunction<string>;

                            expect(parsingResult.args.map(arg => arg.getValue())).toEqual([23]);

                            expect(parsingResult.getValue()).toStrictEqual(
                                expectedExpression.getValue(),
                            );
                        });

                        test("should prioritize Custom Function expressions", () => {
                            const expectedExpression = new SubtractFunction(INDEX_INFO, [
                                new NumberType(INDEX_INFO, "11"),
                                new AddFunction(INDEX_INFO, [
                                    new NumberType(INDEX_INFO, "12"),
                                    new NumberType(INDEX_INFO, "13"),
                                ]),
                            ]);

                            const parsingResult = grammar.tryParse(
                                "=11-SUM(12,13)",
                            ) as IFunction<string>;

                            expect(parsingResult.args.map(arg => arg.getValue())).toEqual([11, 25]);

                            expect(parsingResult.getValue()).toStrictEqual(
                                expectedExpression.getValue(),
                            );
                        });

                        test("should apply priorities correctly in complex expression", () => {
                            const expectedExpression = new AddFunction(INDEX_INFO, [
                                new AddFunction(INDEX_INFO, [
                                    new SubtractFunction(INDEX_INFO, [
                                        new AddFunction(INDEX_INFO, [
                                            new DivideFunction(INDEX_INFO, [
                                                new ExponentiateFunction(INDEX_INFO, [
                                                    new NumberType(INDEX_INFO, "2"),
                                                    new NegateFunction(INDEX_INFO, [
                                                        new NumberType(INDEX_INFO, "4"),
                                                    ]),
                                                ]),
                                                new NumberType(INDEX_INFO, "6"),
                                            ]),
                                            new NumberType(INDEX_INFO, "11"),
                                        ]),
                                        new AddFunction(INDEX_INFO, [
                                            new FactorialFunction(INDEX_INFO, [
                                                new NumberType(INDEX_INFO, "3"),
                                            ]),
                                            new NegateFunction(INDEX_INFO, [
                                                new NumberType(INDEX_INFO, "13"),
                                            ]),
                                        ]),
                                    ]),
                                    new MultiplyFunction(INDEX_INFO, [
                                        new SubtractFunction(INDEX_INFO, [
                                            new NumberType(INDEX_INFO, "2"),
                                            new NumberType(INDEX_INFO, "2"),
                                        ]),
                                        new FactorialFunction(INDEX_INFO, [
                                            new NumberType(INDEX_INFO, "3"),
                                        ]),
                                    ]),
                                ]),
                                new FactorialFunction(INDEX_INFO, [
                                    new MultiplyFunction(INDEX_INFO, [
                                        new NegateFunction(INDEX_INFO, [
                                            new NumberType(INDEX_INFO, "2"),
                                        ]),
                                        new NegateFunction(INDEX_INFO, [
                                            new NumberType(INDEX_INFO, "3"),
                                        ]),
                                    ]),
                                ]),
                            ]);
                            expect(
                                grammar
                                    .tryParse("=2^-4/6+11-SUM(3!,-13)+(2-2)*3!+(-2*-3)!")
                                    .getValue(),
                            ).toStrictEqual(expectedExpression.getValue());
                        });
                    });
                });
            });
        });
    });

    describe("AST Semantic Validation", () => {
        test("should return success on validation", () => {
            const ast = grammar.parse("=1+1")
            
            expect(validate(ast)).toStrictEqual(makeSuccess());
        });
        
        test("should return success on validation with multiple levels", () => {
            const ast = grammar.parse("=1+1+(1-1)")
            
            expect(validate(ast)).toStrictEqual(makeSuccess());
        });

        describe('Add function', () => {
            test('should return success when arguments are numbers', () => {
                const ast = grammar.parse("=1+1")
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return success when arguments are numbers', () => {
                const ast = grammar.parse("=SUM(1,1)")
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return failure when arguments count is not 2', () => {
                const ast = grammar.parse("=SUM(1, 1, 1)")
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 6,
                        line: 1,
                        offset: 5,
                    },
                    message: "Add function takes exactly 2 arguments. 3 received instead."
                }]));
            })
            
            test('should return failure when arguments are not numbers', () => {
                const ast = grammar.parse('=SUM(1, "1")')
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 12,
                        line: 1,
                        offset: 11,
                    },
                    message: "Argument of type 'string' is not valid. Argument must be 'Either(number, reference)'."
                }]));
            })
            
            test('should return success when arguments are result of inner functions with correct type', () => {
                const ast = grammar.parse('=SUM(1, -1)')
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return failure when arguments are result of inner functions with incorrect type', () => {
                const ast = grammar.parse('=SUM(1, CONCAT("a", "b"))')
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 16,
                        line: 1,
                        offset: 15,
                    },
                    message: "Argument of type 'string' (returned from CONCAT) is not valid. Argument must be 'Either(number, reference)'."
                }]));
            })
        })
        
        describe('Subtract function', () => {
            test('should return success when arguments are numbers', () => {
                const ast = grammar.parse("=1-1")
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return success when arguments are numbers', () => {
                const ast = grammar.parse("=SUB(1,1)")
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return failure when arguments count is not 2', () => {
                const ast = grammar.parse("=SUB(1, 1, 1)")
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 6,
                        line: 1,
                        offset: 5,
                    },
                    message: "Subtract function takes exactly 2 arguments. 3 received instead."
                }]));
            })
            
            test('should return failure when arguments are not numbers', () => {
                const ast = grammar.parse('=SUB(1, "1")')
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 12,
                        line: 1,
                        offset: 11,
                    },
                    message: "Argument of type 'string' is not valid. Argument must be 'Either(number, reference)'."
                }]));
            })
            
            test('should return success when arguments are result of inner functions with correct type', () => {
                const ast = grammar.parse('=SUB(1, -1)')
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return failure when arguments are result of inner functions with incorrect type', () => {
                const ast = grammar.parse('=SUB(1, CONCAT("a", "b"))')
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 16,
                        line: 1,
                        offset: 15,
                    },
                    message: "Argument of type 'string' (returned from CONCAT) is not valid. Argument must be 'Either(number, reference)'."
                }]));
            })
        })
        
        describe('Multiply function', () => {
            test('should return success when arguments are numbers', () => {
                const ast = grammar.parse("=1*1")
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return success when arguments are numbers', () => {
                const ast = grammar.parse("=MULTIPLY(1,1)")
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return failure when arguments count is not 2', () => {
                const ast = grammar.parse("=MULTIPLY(1, 1, 1)")
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 11,
                        line: 1,
                        offset: 10,
                    },
                    message: "Multiply function takes exactly 2 arguments. 3 received instead."
                }]));
            })
            
            test('should return failure when arguments are not numbers', () => {
                const ast = grammar.parse('=MULTIPLY(1, "1")')
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 17,
                        line: 1,
                        offset: 16,
                    },
                    message: "Argument of type 'string' is not valid. Argument must be 'Either(number, reference)'."
                }]));
            })
            
            test('should return success when arguments are result of inner functions with correct type', () => {
                const ast = grammar.parse('=MULTIPLY(1, -1)')
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return failure when arguments are result of inner functions with incorrect type', () => {
                const ast = grammar.parse('=MULTIPLY(1, CONCAT("a", "b"))')
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 21,
                        line: 1,
                        offset: 20,
                    },
                    message: "Argument of type 'string' (returned from CONCAT) is not valid. Argument must be 'Either(number, reference)'."
                }]));
            })
        })
        
        describe('Divide function', () => {
            test('should return success when arguments are numbers', () => {
                const ast = grammar.parse("=1/1")
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return success when arguments are numbers', () => {
                const ast = grammar.parse("=DIVIDE(1,1)")
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return failure when arguments count is not 2', () => {
                const ast = grammar.parse("=DIVIDE(1, 1, 1)")
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 9,
                        line: 1,
                        offset: 8,
                    },
                    message: "Divide function takes exactly 2 arguments. 3 received instead."
                }]));
            })
            
            test('should return failure when arguments are not numbers', () => {
                const ast = grammar.parse('=DIVIDE(1, "1")')
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 15,
                        line: 1,
                        offset: 14,
                    },
                    message: "Argument of type 'string' is not valid. Argument must be 'Either(number, reference)'."
                }]));
            })
            
            test('should return success when arguments are result of inner functions with correct type', () => {
                const ast = grammar.parse('=DIVIDE(1, -1)')
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return failure when arguments are result of inner functions with incorrect type', () => {
                const ast = grammar.parse('=DIVIDE(1, CONCAT("a", "b"))')
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 19,
                        line: 1,
                        offset: 18,
                    },
                    message: "Argument of type 'string' (returned from CONCAT) is not valid. Argument must be 'Either(number, reference)'."
                }]));
            })
        })
        
        describe('Exponentiate function', () => {
            test('should return success when arguments are numbers', () => {
                const ast = grammar.parse("=1^1")
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return success when arguments are numbers', () => {
                const ast = grammar.parse("=EXPONENTIATE(1,1)")
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return failure when arguments count is not 2', () => {
                const ast = grammar.parse("=EXPONENTIATE(1, 1, 1)")
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 15,
                        line: 1,
                        offset: 14,
                    },
                    message: "Exponentiate function takes exactly 2 arguments. 3 received instead."
                }]));
            })
            
            test('should return failure when arguments are not numbers', () => {
                const ast = grammar.parse('=EXPONENTIATE(1, "1")')
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 21,
                        line: 1,
                        offset: 20,
                    },
                    message: "Argument of type 'string' is not valid. Argument must be 'Either(number, reference)'."
                }]));
            })
            
            test('should return success when arguments are result of inner functions with correct type', () => {
                const ast = grammar.parse('=EXPONENTIATE(1, -1)')
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return failure when arguments are result of inner functions with incorrect type', () => {
                const ast = grammar.parse('=EXPONENTIATE(1, CONCAT("a", "b"))')
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 25,
                        line: 1,
                        offset: 24,
                    },
                    message: "Argument of type 'string' (returned from CONCAT) is not valid. Argument must be 'Either(number, reference)'."
                }]));
            })
        })
        
        describe('Factorial function', () => {
            test('should return success when argument is number', () => {
                const ast = grammar.parse("=(1!)")
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return failure when arguments count is not 1', () => {
                const ast = grammar.parse("=FACTORIAL(1, 1)")
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 12,
                        line: 1,
                        offset: 11,
                    },
                    message: "Factorial function takes exactly 1 argument. 2 received instead."
                }]));
            })
            
            test('should return failure when arguments are not numbers', () => {
                const ast = grammar.parse('=FACTORIAL("1")')
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 15,
                        line: 1,
                        offset: 14,
                    },
                    message: "Argument of type 'string' is not valid. Argument must be 'Either(number, reference)'."
                }]));
            })
            
            test('should return success when arguments are result of inner functions with correct type', () => {
                const ast = grammar.parse('=FACTORIAL(-1)')
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return failure when arguments are result of inner functions with incorrect type', () => {
                const ast = grammar.parse('=FACTORIAL(CONCAT("a", "b"))')
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 19,
                        line: 1,
                        offset: 18,
                    },
                    message: "Argument of type 'string' (returned from CONCAT) is not valid. Argument must be 'Either(number, reference)'."
                }]));
            })
        })

        describe('Negate function', () => {
            test('should return success when argument is number', () => {
                const ast = grammar.parse("=(-1)")
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return failure when arguments count is not 1', () => {
                const ast = grammar.parse("=NEGATE(1, 1)")
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 9,
                        line: 1,
                        offset: 8,
                    },
                    message: "Negate function takes exactly 1 argument. 2 received instead."
                }]));
            })
            
            test('should return failure when arguments are not numbers', () => {
                const ast = grammar.parse('=NEGATE("1")')
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 12,
                        line: 1,
                        offset: 11,
                    },
                    message: "Argument of type 'string' is not valid. Argument must be 'Either(number, reference)'."
                }]));
            })
            
            test('should return success when arguments are result of inner functions with correct type', () => {
                const ast = grammar.parse('=NEGATE(-1)')
            
                expect(validate(ast)).toStrictEqual(makeSuccess());
            })
            
            test('should return failure when arguments are result of inner functions with incorrect type', () => {
                const ast = grammar.parse('=NEGATE(CONCAT("a", "b"))')
            
                expect(validate(ast)).toStrictEqual(makeSemanticFailure([{
                    index: {
                        column: 16,
                        line: 1,
                        offset: 15,
                    },
                    message: "Argument of type 'string' (returned from CONCAT) is not valid. Argument must be 'Either(number, reference)'."
                }]));
            })
        })
    })
});

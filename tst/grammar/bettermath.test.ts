import cellFunctionParser from "../../src/grammar/bettermath";
import type {
    ExpressionType,
  NumberType,
  StringType,
} from "../../src/grammar/function/definitions";

describe("Grammar", () => {
  describe("simple values", () => {
    test("should parse number", () => {
      const expectedNumber: NumberType = {
        type: "number",
        value: 12,
      };
      expect<NumberType>(
        cellFunctionParser.tryParse("12") as NumberType
      ).toStrictEqual<NumberType>(expectedNumber);
    });

    test("should parse number after EQUALS", () => {
      const expectedNumber: NumberType = {
        type: "number",
        value: 12,
      };
      expect<NumberType>(
        cellFunctionParser.tryParse("=12") as NumberType
      ).toStrictEqual<NumberType>(expectedNumber);
    });

    test("should parse string", () => {
      const expectedNumber: StringType = {
        type: "string",
        value: "asd",
      };
      expect<StringType>(
        cellFunctionParser.tryParse("asd") as StringType
      ).toStrictEqual<StringType>(expectedNumber);
    });

    test("should parse string after EQUALS", () => {
      const expectedNumber: StringType = {
        type: "string",
        value: "asd",
      };
      expect<StringType>(
        cellFunctionParser.tryParse("asd") as StringType
      ).toStrictEqual<StringType>(expectedNumber);
    });
  });

  describe("Expression values", () => {
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
                }
            ]
          };
          expect<ExpressionType>(
            cellFunctionParser.tryParse("-12") as ExpressionType
          ).toStrictEqual<ExpressionType>(expectedExpression);
        });
        test("should parse negated number after EQUALS", () => {
          const expectedExpression: ExpressionType = {
            type: "function",
            fn: "Negate",
            args: [
                {
                    type: "number",
                    value: 12,
                }
            ]
          };
          expect<ExpressionType>(
            cellFunctionParser.tryParse("=-12") as ExpressionType
          ).toStrictEqual<ExpressionType>(expectedExpression);
        });
      });
    });
  });
});

import { inspect } from "util";
import type P from "parsimmon"

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
    
    test("should parse negative number", () => {
      const expectedNumber: NumberType = {
        type: "number",
        value: -12,
      };
      expect<NumberType>(
        cellFunctionParser.tryParse("-12") as NumberType
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
        value: "1+1",
      };
      expect<StringType>(
        cellFunctionParser.tryParse("1+1") as StringType
      ).toStrictEqual<StringType>(expectedNumber);
    });

    test("should parse string after EQUALS", () => {
      const expectedNumber: StringType = {
        type: "string",
        value: "asd",
      };
      expect<StringType>(
        cellFunctionParser.tryParse('="asd"') as StringType
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
          cellFunctionParser.tryParse("=CONCAT(12, 12)") as ExpressionType
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
          cellFunctionParser.tryParse('=CONCAT("12", "12")') as ExpressionType
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
          cellFunctionParser.tryParse('=CONCAT(12, "12")') as ExpressionType
        ).toStrictEqual<ExpressionType>(expectedExpression);
      });
      
      test("should fail parsing of invalid function", () => {
        const failure = {
            status: false,
            index: {
                offset: 1,
                line: 1,
                column: 2,
            }
        };

        expect<P.Result<ExpressionType>>(
          cellFunctionParser.parse('=INVALIDFN("a", "b")')
        ).toStrictEqual<P.Failure>(expect.objectContaining(failure));
      });
    });

    describe("Math Operations", () => {
      describe("Negation Operator", () => {
        test("should parse negated number", () => {
          const expectedExpression: NumberType = {
            type: "number",
            value: -12,
          };
          expect<NumberType>(
            cellFunctionParser.tryParse("-12") as NumberType
          ).toStrictEqual<NumberType>(expectedExpression);
        });
        test("should parse negated number after EQUALS", () => {
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
            cellFunctionParser.tryParse("=-12") as ExpressionType
          ).toStrictEqual<ExpressionType>(expectedExpression);
        });
      });
    });
  });
});

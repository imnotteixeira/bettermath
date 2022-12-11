import type { Index } from "parsimmon";
import { AddFunction } from "./Add";
import { ConcatFunction } from "./Concat";
import { DivideFunction } from "./Divide";
import { ExponentiateFunction } from "./Exponentiate";
import { FactorialFunction } from "./Factorial";
import { MultiplyFunction } from "./Multiply";
import { NegateFunction } from "./Negate";
import { SubtractFunction } from "./Subtract";
import { IFunctionArg } from "./types";

export const FunctionDefinitions = {
    SUM: (args: IFunctionArg<number>[], indexInfo: Index) => new AddFunction(args, indexInfo),
    Add: (args: IFunctionArg<number>[], indexInfo: Index) => new AddFunction(args, indexInfo),
    SUB: (args: IFunctionArg<number>[], indexInfo: Index) => new SubtractFunction(args, indexInfo),
    Subtract: (args: IFunctionArg<number>[], indexInfo: Index) => new SubtractFunction(args, indexInfo),
    Multiply: (args: IFunctionArg<number>[], indexInfo: Index) => new MultiplyFunction(args, indexInfo),
    Divide: (args: IFunctionArg<number>[], indexInfo: Index) => new DivideFunction(args, indexInfo),
    Exponentiate: (args: IFunctionArg<number>[], indexInfo: Index) => new ExponentiateFunction(args, indexInfo),
    Factorial: (args: IFunctionArg<number>[], indexInfo: Index) => new FactorialFunction(args, indexInfo),
    Negate: (args: IFunctionArg<number>[], indexInfo: Index) => new NegateFunction(args, indexInfo),
    CONCAT: (args: IFunctionArg<any>[], indexInfo: Index) => new ConcatFunction(args, indexInfo),
};

export type FunctionName = keyof typeof FunctionDefinitions;

export { AddFunction } from "./Add"
export { SubtractFunction } from "./Subtract"
export { MultiplyFunction } from "./Multiply"
export { DivideFunction } from "./Divide"
export { ExponentiateFunction } from "./Exponentiate"
export { FactorialFunction } from "./Factorial"
export { NegateFunction } from "./Negate"
export { ConcatFunction } from "./Concat"
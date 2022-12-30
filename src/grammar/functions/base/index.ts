import type { Index } from "parsimmon";
import { FunctionBuilder } from "..";
import { IFunctionArg } from "../types";
import { AddFunction } from "./Add";
import { ConcatFunction } from "./Concat";
import { DivideFunction } from "./Divide";
import { ExponentiateFunction } from "./Exponentiate";
import { FactorialFunction } from "./Factorial";
import { MultiplyFunction } from "./Multiply";
import { NegateFunction } from "./Negate";
import { SubtractFunction } from "./Subtract";

const BASE_FUNCTIONS: Record<string, FunctionBuilder<any>> = Object.freeze({
    SUM: (indexInfo: Index, args: IFunctionArg<number>[]) => new AddFunction(indexInfo, args),
    Add: (indexInfo: Index, args: IFunctionArg<number>[]) => new AddFunction(indexInfo, args),
    SUB: (indexInfo: Index, args: IFunctionArg<number>[]) => new SubtractFunction(indexInfo, args),
    Subtract: (indexInfo: Index, args: IFunctionArg<number>[]) => new SubtractFunction(indexInfo, args),
    Multiply: (indexInfo: Index, args: IFunctionArg<number>[]) => new MultiplyFunction(indexInfo, args),
    Divide: (indexInfo: Index, args: IFunctionArg<number>[]) => new DivideFunction(indexInfo, args),
    Exponentiate: (indexInfo: Index, args: IFunctionArg<number>[]) => new ExponentiateFunction(indexInfo, args),
    Factorial: (indexInfo: Index, args: IFunctionArg<number>[]) => new FactorialFunction(indexInfo, args),
    Negate: (indexInfo: Index, args: IFunctionArg<number>[]) => new NegateFunction(indexInfo, args),
    NEGATE: (indexInfo: Index, args: IFunctionArg<number>[]) => new NegateFunction(indexInfo, args),
    CONCAT: (indexInfo: Index, args: IFunctionArg<any>[]) => new ConcatFunction(indexInfo, args),
});

export { AddFunction } from "./Add"
export { SubtractFunction } from "./Subtract"
export { MultiplyFunction } from "./Multiply"
export { DivideFunction } from "./Divide"
export { ExponentiateFunction } from "./Exponentiate"
export { FactorialFunction } from "./Factorial"
export { NegateFunction } from "./Negate"
export { ConcatFunction } from "./Concat"

export default BASE_FUNCTIONS;
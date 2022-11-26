import type P from "parsimmon"

type AllowedType = "string"
    | "number"
    | "function"

export interface BaseType {
    type: AllowedType;
}

export interface StringType extends BaseType {
    type: "string",
    value: string
}

export interface NumberType extends BaseType {
    type: "number",
    value: number
}

export type ValueType = StringType | NumberType;

export type IFunctionArg = ExpressionType; 

export interface IFunction extends BaseType {
    type: "function"
    fn: string,
    args: IFunctionArg[]
}

export type ExpressionType = IFunction | ValueType;

export type MathOperatorType = (operatorsParser: P.Parser<MathOperation>, nextParser: P.Parser<ExpressionType>) => P.Parser<ExpressionType>

export type MathOperation = "-" | "!" | "^" | "*" | "/" | "+";
export interface MathOperatorDefinition {
    type: MathOperatorType,
    ops: P.Parser<MathOperation>
}

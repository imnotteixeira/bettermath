import type P from "parsimmon";
import { FunctionName } from "./functions";
import { IFunction } from "./functions/types";
import { Success, ValidationResult } from "./inputValidation";

type AllowedType = "string" | "number" | "function";

export interface IBaseType<T> {
    type: AllowedType;
    getValue: () => T;

    validate: () => ValidationResult;
}

export abstract class BaseType<T> implements IBaseType<T> {
    abstract type: AllowedType;

    abstract getValue: () => T;
    abstract validate: () => ValidationResult;
}

export interface IStringType extends IBaseType<string> {
    type: "string";
    value: string;
}

export class StringType extends BaseType<string> implements IStringType {
    readonly type = "string";
    readonly value: string;

    constructor(str: string) {
        super();
        this.value = str;
    }

    getValue = () => this.value;
    validate = () => new Success();
}

export interface INumberType extends IBaseType<number> {
    type: "number";
    value: number;
}

export class NumberType extends BaseType<number> implements INumberType {
    readonly type = "number";
    readonly value: number;

    constructor(num: string) {
        super();
        this.value = Number(num);
    }

    getValue = () => this.value;
    validate = () => new Success();
}

export type IValueType<T> = IBaseType<T>;

export type IExpressionType<T> = IFunction<T> | IValueType<T>;

export type MathOperatorType = (
    operatorsParser: P.Parser<FunctionName>,
    nextParser: P.Parser<IExpressionType<number>>,
) => P.Parser<IExpressionType<number>>;

export interface MathOperatorDefinition {
    type: MathOperatorType;
    ops: P.Parser<FunctionName>;
}

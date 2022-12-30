import type P from "parsimmon";
import type { Index } from "parsimmon";
import { IFunction } from "./functions/types";
import { makeSuccess, ValidationResult } from "./validator";

export enum Types {
    STRING = "string",
    NUMBER = "number",
    FUNCTION = "function"
}

type AllowedType = Types;

export interface IBaseType<T> {
    type: AllowedType;
    indexInfo: Index;
    getValue: () => T;

    validate: () => ValidationResult;
}

export abstract class BaseType<T> implements IBaseType<T> {
    abstract type: AllowedType;
    readonly indexInfo: Index;

    abstract getValue: () => T;
    abstract validate: () => ValidationResult;

    constructor(indexInfo: Index) {
        this.indexInfo = indexInfo;
    }
}

export interface IStringType extends IBaseType<string> {
    type: Types.STRING;
    value: string;
}

export class StringType extends BaseType<string> implements IStringType {
    readonly type = Types.STRING;
    readonly value: string;

    constructor(indexInfo: Index, str: string) {
        super(indexInfo);
        this.value = str;
    }

    getValue = () => this.value;
    validate = () => makeSuccess();
}

export interface INumberType extends IBaseType<number> {
    type: Types.NUMBER;
    value: number;
}

export class NumberType extends BaseType<number> implements INumberType {
    readonly type = Types.NUMBER;
    readonly value: number;

    constructor(indexInfo: Index, num: string) {
        super(indexInfo);
        this.value = Number(num);
    }

    getValue = () => this.value;
    validate = () => makeSuccess();
}

export type IValueType<T> = IBaseType<T>;

export type IExpressionType<T> = IFunction<T> | IValueType<T>;

export type MathOperatorType = (
    operatorsParser: P.Parser<string>,
    nextParser: P.Parser<IExpressionType<number>>,
) => P.Parser<IExpressionType<number>>;

export interface MathOperatorDefinition {
    type: MathOperatorType;
    ops: P.Parser<string>;
}

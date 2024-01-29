import type P from "parsimmon";
import type { Index } from "parsimmon";
import { IFunction } from "./functions/types";
import { makeSuccess, ValidationResult } from "./functions/validator";

export type { Index } from "parsimmon";

export enum Types {
    STRING = "string",
    NUMBER = "number",
    FUNCTION = "function",
    REF = "reference", // Special type to refer to an external value. Can resolve to any type
}

type AllowedType = Types;

export class ValueResolvingResult<T> {
    readonly isError: boolean;
    readonly value?: T;
    readonly error?: Error;

    private constructor(isError: boolean, result?: {value? : T, error?: Error}) {
        this.isError = isError;
        this.value = result?.value;
        this.error = result?.error;
    }

    static success = <T>(value: T) => new ValueResolvingResult(false, {value});
    
    static error = <T>(error: Error) => new ValueResolvingResult<T>(true, {error});

    get = () => {
        if (this.isError) {
            throw new Error(
                "The ValueResolvingResult is an error. Cannot get value. Inner error is: "
                + this.error
            );
        }

        return this.value as T;
    }

    getOrElse = (elseValue: T) => this.isError ? elseValue : this.value;

    getError = () => this.error;
}

export interface IBaseType<T> {
    type: AllowedType;
    indexInfo: Index;
    getValue: (dependencyValueMap: Map<string, any>) => ValueResolvingResult<T>;

    validate: () => ValidationResult;

    find: (matcher: (elem: IBaseType<any>) => boolean) => IBaseType<any>[];
}

export abstract class BaseType<T> implements IBaseType<T> {
    abstract type: AllowedType;
    readonly indexInfo: Index;

    abstract getValue: (dependencyValueMap: Map<string, any>) => ValueResolvingResult<T>;
    abstract validate: () => ValidationResult;
    abstract toString: () => string;

    constructor(indexInfo: Index) {
        this.indexInfo = indexInfo;
    }

    find = (matcher: (elem: IBaseType<any>) => boolean) => {
        const results: IBaseType<any>[] = [];
        if (matcher(this)) results.push(this)

        const nodesToCheck: IBaseType<any>[] = [this];

        while(nodesToCheck.length > 0) {
            const node = nodesToCheck.pop()!

            if (matcher(node)) results.push(node)

            if (node.type === Types.FUNCTION) {
                nodesToCheck.push(...(node as IFunction<any>).args)
            }
        }

        return results;
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

    getValue = () => ValueResolvingResult.success(this.value);
    validate = () => makeSuccess();

    toString = () => `StringType(${this.value})`
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

    getValue = () => ValueResolvingResult.success(this.value);
    validate = () => makeSuccess();

    toString = () => `NumberType(${this.value})`
}

export interface IRefType extends IBaseType<any|undefined> {
    type: Types.REF;
    value: any| undefined;
}

export class RefType extends BaseType<any | undefined> implements IRefType {
    readonly type = Types.REF;
    readonly value: string;

    constructor(indexInfo: Index, refId: string) {
        super(indexInfo);
        this.value = refId;
    }

    getValue = (dependencyValueMap: Map<string, any>) => {
        const referencedValue = dependencyValueMap.get(this.value);
        console.debug(`This is the referencedValue with id <${this.value}>:`, referencedValue)
        if (!referencedValue) {
            // Returning undefined value as success, since some functions may take advanatage of this, even though the value does not exist.
            // Specific ValueResolvingResult.error will be returned if some function is processing an undefined Ref when it can't
            return ValueResolvingResult.success(undefined)
        } 
        
        return ValueResolvingResult.success(referencedValue);
        
    }

    validate = () => makeSuccess();

    toString = () => `RefType(${this.value})`
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

export type BettermathGrammarParser = P.Parser<IExpressionType<any>>;

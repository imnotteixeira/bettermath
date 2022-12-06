import type P from "parsimmon";
import { index } from "parsimmon";

type AllowedType = "string" | "number" | "function";

abstract class ValidationResult {
    abstract readonly success: boolean;
}

export class Success extends ValidationResult {
    success = true;
}

type ValidationError = {
    index: P.Index;
    message: string;
};
export class Failure extends ValidationResult {
    success = false;

    errors: ValidationError[];

    constructor(errors: ValidationError[]) {
        super();
        this.errors = errors;
    }
}
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

export const FunctionDefinitions = {
    SUM: (args: IFunctionArg<number>[], indexInfo: P.Index) => new AddFunction(args, indexInfo),
    Add: (args: IFunctionArg<number>[], indexInfo: P.Index) => new AddFunction(args, indexInfo),
    SUB: (args: IFunctionArg<number>[], indexInfo: P.Index) => new SubtractFunction(args, indexInfo),
    Subtract: (args: IFunctionArg<number>[], indexInfo: P.Index) => new SubtractFunction(args, indexInfo),
    Multiply: (args: IFunctionArg<number>[], indexInfo: P.Index) => new MultiplyFunction(args, indexInfo),
    Divide: (args: IFunctionArg<number>[], indexInfo: P.Index) => new DivideFunction(args, indexInfo),
    Exponentiate: (args: IFunctionArg<number>[], indexInfo: P.Index) => new ExponentiateFunction(args, indexInfo),
    Factorial: (args: IFunctionArg<number>[], indexInfo: P.Index) => new FactorialFunction(args, indexInfo),
    Negate: (args: IFunctionArg<number>[], indexInfo: P.Index) => new NegateFunction(args, indexInfo),
    CONCAT: (args: IFunctionArg<any>[], indexInfo: P.Index) => new ConcatFunction(args, indexInfo),
};

export type FunctionName = keyof typeof FunctionDefinitions;

export type IFunctionArg<T> = IExpressionType<T>;

export interface IFunction<T> extends IBaseType<T> {
    type: "function";
    fn: FunctionName;
    args: IFunctionArg<any>[];
    indexInfo: P.Index;

}

type FunctionArgsValidator = (args: IFunctionArg<any>[]) => ValidationResult;

/**
 * T: Return Type
 */
export abstract class FunctionType<T> extends BaseType<T> implements IFunction<T> {
    readonly type = "function";
    readonly fn: FunctionName;
    readonly args: IFunctionArg<any>[];
    readonly indexInfo: P.Index;

    constructor(fn: FunctionName, args: IFunctionArg<any>[], indexInfo: P.Index) {
        super();
        this.fn = fn;
        this.args = args;
        this.indexInfo = indexInfo;
    }

    validate = () => this._validateArgs(this.args);

    // Optional function that child-classes can override to define their own validation
    _validateArgs = (_: IFunctionArg<any>[]) => new Success();
}

// validate works on node level
//     - each node validates itself by checking its direct children types (only applies to functions -numbers and strings are valid by default)
//     - need to have a map from fnName to its return type so that validation can use that without computing values
//     -have a validate function that receives the AST and validates all nodes
//     - store the components index on the input string (Expression -> index on string) so that validation can point to correct place

export class AddFunction extends FunctionType<number> {
    constructor(args: IFunctionArg<any>[], indexInfo: P.Index) {
        super("Add", [args[0], args[1]], indexInfo);
    }

    getValue = () => this.args[0].getValue() + this.args[1].getValue();

    _validateArgs: FunctionArgsValidator = (args: IFunctionArg<any>[]) => {
        const argErrors: ValidationError[] = [];
        args.forEach((arg: any, i: number) => {
            if (arg.type !== "number")
                argErrors.push({
                    index: this.indexInfo,
                    message: `Argument of type ${arg.type} is not supported on Add function. Arguments must be of number type`,
                });
        });

        if (argErrors.length) return new Failure(argErrors);
        else return new Success();
    };
}

export class SubtractFunction extends FunctionType<number> {
    constructor(args: IFunctionArg<any>[], indexInfo: P.Index) {
        super("Subtract", [args[0], args[1]], indexInfo);
    }

    getValue = () => this.args[0].getValue() - this.args[1].getValue();
}

export class MultiplyFunction extends FunctionType<number> {
    constructor(args: IFunctionArg<any>[], indexInfo: P.Index) {
        super("Multiply", [args[0], args[1]], indexInfo);
    }

    getValue = () => this.args[0].getValue() * this.args[1].getValue();
}

export class DivideFunction extends FunctionType<number> {
    constructor(args: IFunctionArg<any>[], indexInfo: P.Index) {
        super("Divide", [args[0], args[1]], indexInfo);
    }

    getValue = () => this.args[0].getValue() / this.args[1].getValue();
}

export class ExponentiateFunction extends FunctionType<number> {
    constructor(args: IFunctionArg<any>[], indexInfo: P.Index) {
        super("Exponentiate", [args[0], args[1]], indexInfo);
    }

    getValue = () => Math.pow(this.args[0].getValue(), this.args[1].getValue());
}

export class FactorialFunction extends FunctionType<number> {
    constructor(args: IFunctionArg<any>[], indexInfo: P.Index) {
        super("Factorial", [args[0]], indexInfo);
    }

    getValue = () => this.calculateFactorial(this.args[0].getValue());

    private calculateFactorial = (num: number): number => {
        if (num < 0) return -Infinity;
        if (num === 0) return 1;

        return num * this.calculateFactorial(num - 1);
    };
}

export class NegateFunction extends FunctionType<number> {
    constructor(args: IFunctionArg<any>[], indexInfo: P.Index) {
        super("Negate", [args[0]], indexInfo);
    }

    getValue = () => -this.args[0].getValue();

    _validateArgs = (args: IFunctionArg<any>[]) => {
        const argErrors: ValidationError[] = [];
        args.forEach((arg) => {
            if (arg.getValue() !== 1)
                argErrors.push({
                    index: this.indexInfo,
                    message: `Argument of type ${arg.type} is not supported. Argument value must be 1`,
                });
        });

        if (argErrors.length) return new Failure(argErrors);
        else return new Success();
    };
}

export class ConcatFunction extends FunctionType<string> {
    constructor(args: IFunctionArg<string | number>[], indexInfo: P.Index) {
        super("CONCAT", args, indexInfo);
    }

    getValue = () => this.args.reduce((acc, arg) => acc + arg.getValue(), "");
}

export type MathOperatorType = (
    operatorsParser: P.Parser<FunctionName>,
    nextParser: P.Parser<IExpressionType<number>>,
) => P.Parser<IExpressionType<number>>;

export interface MathOperatorDefinition {
    type: MathOperatorType;
    ops: P.Parser<FunctionName>;
}

import type P from "parsimmon";

type AllowedType = "string" | "number" | "function";

export interface IBaseType<T> {
    type: AllowedType;
    getValue: () => T;
}

export abstract class BaseType<T> implements IBaseType<T> {
    abstract type: AllowedType;

    abstract getValue: () => T;
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
}

export type IValueType<T> = IBaseType<T>;

export type IExpressionType<T> = IFunction<any, T> | IValueType<T>;

export const FunctionDefinitions = {
    SUM: (args: IFunctionArg<number>[]) => new AddFunction(args),
    Add: (args: IFunctionArg<number>[]) => new AddFunction(args),
    SUB: (args: IFunctionArg<number>[]) => new SubtractFunction(args),
    Subtract: (args: IFunctionArg<number>[]) => new SubtractFunction(args),
    Multiply: (args: IFunctionArg<number>[]) => new MultiplyFunction(args),
    Divide: (args: IFunctionArg<number>[]) => new DivideFunction(args),
    Exponentiate: (args: IFunctionArg<number>[]) => new ExponentiateFunction(args),
    Factorial: (args: IFunctionArg<number>[]) => new FactorialFunction(args),
    Negate: (args: IFunctionArg<number>[]) => new NegateFunction(args),
    CONCAT: (args: IFunctionArg<any>[]) => new ConcatFunction(args),
};

export type FunctionName = keyof typeof FunctionDefinitions;

export type IFunctionArg<T> = IExpressionType<T>;

export interface IFunction<A, T> extends IBaseType<T> {
    type: "function";
    fn: FunctionName;
    args: IFunctionArg<A>[];
}

/**
 * A: Argument types
 * T: Return Type
 */
export abstract class FunctionType<A, T> extends BaseType<T> implements IFunction<A, T> {
    readonly type = "function";
    readonly fn: FunctionName;
    readonly args: IExpressionType<A>[];

    constructor(fn: FunctionName, args: IExpressionType<A>[]) {
        super();
        this.fn = fn;
        this.args = args;
    }
}

export class GenericFunctionType extends BaseType<any> implements IFunction<any, any> {
    readonly type = "function";
    readonly fn: FunctionName;
    readonly args: IFunctionArg<any>[];

    private exec: (...args: IFunctionArg<any>[]) => any;

    constructor(
        fn: FunctionName,
        args: IFunctionArg<any>[],
        exec: (...args: IFunctionArg<any>[]) => any,
    ) {
        super();
        this.fn = fn;
        this.args = args;
        this.exec = exec;
    }

    getValue = () => this.exec(...this.args);
}

export class AddFunction extends FunctionType<number, number> {
    constructor(args: IExpressionType<number>[]) {
        super("Add", args);
    }

    getValue = () => this.args[0].getValue() + this.args[1].getValue();
}

export class SubtractFunction extends FunctionType<number, number> {
    constructor(args: IExpressionType<number>[]) {
        super("Subtract", args);
    }

    getValue = () => this.args[0].getValue() - this.args[1].getValue();
}

export class MultiplyFunction extends FunctionType<number, number> {
    constructor(args: IExpressionType<number>[]) {
        super("Multiply", args);
    }

    getValue = () => this.args[0].getValue() * this.args[1].getValue();
}

export class DivideFunction extends FunctionType<number, number> {
    constructor(args: IExpressionType<number>[]) {
        super("Divide", args);
    }

    getValue = () => this.args[0].getValue() / this.args[1].getValue();
}

export class ExponentiateFunction extends FunctionType<number, number> {
    constructor(args: IExpressionType<number>[]) {
        super("Exponentiate", args);
    }

    getValue = () => Math.pow(this.args[0].getValue(), this.args[1].getValue());
}

export class FactorialFunction extends FunctionType<number, number> {
    constructor(args: IExpressionType<number>[]) {
        super("Factorial", args);
    }

    getValue = () => this.calculateFactorial(this.args[0].getValue());

    private calculateFactorial = (num: number): number => {
        if (num < 0) return -Infinity;
        if (num === 0) return 1;

        return num * this.calculateFactorial(num - 1);
    };
}

export class NegateFunction extends FunctionType<number, number> {
    constructor(args: IExpressionType<number>[]) {
        super("Negate", args);
    }

    getValue = () => -this.args[0].getValue();
}

export class ConcatFunction extends FunctionType<any, string> {
    constructor(args: IExpressionType<any>[]) {
        super("CONCAT", args);
    }

    getValue = () => this.args.reduce((acc, arg) => acc + arg.getValue(), "");
}

export type MathOperatorType = (
    operatorsParser: P.Parser<FunctionName>,
    nextParser: P.Parser<IExpressionType<number>>,
) => P.Parser<IExpressionType<number>>;

// export type MathOperation = "-" | "!" | "^" | "*" | "/" | "+";
export interface MathOperatorDefinition {
    type: MathOperatorType;
    ops: P.Parser<FunctionName>;
}

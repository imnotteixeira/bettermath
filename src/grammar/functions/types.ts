import { Index } from "parsimmon";
import { FunctionName } from ".";
import { BaseType, IBaseType, IExpressionType } from "../definitions";
import { Failure, Success, ValidationError, ValidationResult } from "../inputValidation";

export type IFunctionArg<T> = IExpressionType<T>;

export interface IFunction<T> extends IBaseType<T> {
    type: "function";
    fn: FunctionName;
    args: IFunctionArg<any>[];
    indexInfo: Index;
}

export type FunctionArgsValidator = (_: IFunctionArg<any>[], onSuccess: () => void, onFailure: (errors: ValidationError[]) => void) => void;

/**
 * T: Return Type
 */
export abstract class FunctionType<T> extends BaseType<T> implements IFunction<T> {
    readonly type = "function";
    readonly fn: FunctionName;
    readonly args: IFunctionArg<any>[];
    readonly indexInfo: Index;

    constructor(fn: FunctionName, args: IFunctionArg<any>[], indexInfo: Index) {
        super();
        this.fn = fn;
        this.args = args;
        this.indexInfo = indexInfo;
    }

    validate = () => {

        let returnVal: ValidationResult | null = null;

        const onSuccess = () => { returnVal = new Success() }
        const onFailure = (errors: ValidationError[]) => { returnVal = new Failure(errors) }

        this.validateArgs(this.args, onSuccess, onFailure);

        if(returnVal === null) {
            throw new Error(`[${this.fn} Function Validator] Validation function must call either onSuccess or onFailure callback`)
        } else {
            return returnVal
        }
    }

    // Optional function that child-classes can override to define their own validation
    protected validateArgs: FunctionArgsValidator = (_: IFunctionArg<any>[], onSuccess: () => void, onFailure: (errors: ValidationError[]) => void) => new Success();
}
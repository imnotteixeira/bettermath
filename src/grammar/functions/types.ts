import { Index } from "parsimmon";
import { BaseType, IBaseType, IExpressionType, Types } from "../definitions";
import { makeSemanticFailure, makeSuccess, ValidationError, ValidationResult } from "./validator";
import { PipelineValidator, validationPipeline } from "./validator/pipeline";

export type IFunctionArg<T> = IExpressionType<T>;

type ReturnableTypes = Types.NUMBER | Types.STRING
export interface IFunction<T> extends IBaseType<T> {
    type: Types.FUNCTION;
    fn: string;
    args: IFunctionArg<any>[];
    returnType: ReturnableTypes;
}

export type FunctionArgsValidator = (validator: PipelineValidator, _: IFunctionArg<any>[], onSuccess: () => void, onFailure: (errors: ValidationError[]) => void) => void;

export abstract class FunctionType<T> extends BaseType<T> implements IFunction<T> {
    readonly type = Types.FUNCTION;
    readonly fn: string;
    readonly args: IFunctionArg<any>[];
    abstract readonly returnType: ReturnableTypes;

    constructor(indexInfo: Index, fn: string, args: IFunctionArg<any>[]) {
        super(indexInfo);
        this.fn = fn;
        this.args = args;
    }

    validate = () => {

        let returnVal: ValidationResult | null = null;

        const onSuccess = () => { returnVal = makeSuccess() }
        const onFailure = (errors: ValidationError[]) => { returnVal = makeSemanticFailure(errors) }

        const validator = validationPipeline(this.fn, this.args, this.indexInfo);
        this.validateArgs(validator, this.args, onSuccess, onFailure);

        if(returnVal === null) {
            throw new Error(`[${this.fn} Function Validator] Validation function must call either onSuccess or onFailure callback`)
        } else {
            return returnVal
        }
    }

    // Optional function that child-classes can override to define their own validation
    protected validateArgs: FunctionArgsValidator = (validator: PipelineValidator, _: IFunctionArg<any>[], onSuccess: () => void, onFailure: (errors: ValidationError[]) => void) => onSuccess();

    toString = () => `[MISSING TOSTRING IMPL] :: Function(${this.args.map(arg => arg.toString()).join(",")})`;
}
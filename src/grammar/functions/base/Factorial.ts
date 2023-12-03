import { Index } from "parsimmon";
import { IBaseType, Types, ValueResolvingResult } from "../../definitions";
import { FunctionArgsValidator, FunctionType, IFunctionArg } from "../types";
import { ValidationError } from "../validator";
import { CommonValidators, PipelineValidator } from "../validator/pipeline";
import { is } from "../validator/argTypeValidator";
import { resolveValuesOnlyNumbers } from "../util";

export class FactorialFunction extends FunctionType<number> {
    readonly returnType = Types.NUMBER;
    
    constructor(indexInfo: Index, args: IFunctionArg<any>[]) {
        super(indexInfo, "Factorial", args);
    }

    getValue = (dependencyValueMap: Map<string, IBaseType<any> | undefined>) => {
        try {
            const resolvedValues = resolveValuesOnlyNumbers([this.args[0].getValue(dependencyValueMap)])
            return ValueResolvingResult.success(this.calculateFactorial(resolvedValues[0]));
        } catch (e) {
            return ValueResolvingResult.error<number>(e as Error)
        }
    }

    validateArgs: FunctionArgsValidator = (validator: PipelineValidator, args: IFunctionArg<any>[], onSuccess: () => void, onFailure: (errors: ValidationError[]) => void) => {
        
        const validationResult = validator([
            CommonValidators.ARG_LENGTH(1),
            CommonValidators.ARG_TYPES(is(Types.NUMBER))
        ]).validate()

        if(validationResult) return onFailure(validationResult)
        else return onSuccess();
    };

    private calculateFactorial = (num: number): number => {
        if (num < 0) return -Infinity;
        if (num === 0) return 1;

        return num * this.calculateFactorial(num - 1);
    };

}
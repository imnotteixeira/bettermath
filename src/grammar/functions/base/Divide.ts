import type { Index } from "parsimmon";
import { IBaseType, Types, ValueResolvingResult } from "../../definitions";
import { FunctionArgsValidator, FunctionType, IFunctionArg } from "../types";
import { ValidationError } from "../validator";
import { CommonValidators, PipelineValidator } from "../validator/pipeline";
import { is } from "../validator/argTypeValidator";
import { resolveValuesOnlyNumbers } from "../util";

export class DivideFunction extends FunctionType<number> {
    readonly returnType = Types.NUMBER;
    
    constructor(indexInfo: Index, args: IFunctionArg<any>[]) {
        super(indexInfo, "Divide", args);
    }

    getValue = (dependencyValueMap: Map<string, IBaseType<any> | undefined>) => {
        try {
            const resolvedValues = resolveValuesOnlyNumbers(this.args.map(arg => arg.getValue(dependencyValueMap)))
            return ValueResolvingResult.success(resolvedValues[0] / resolvedValues[1]);
        } catch (e) {
            return ValueResolvingResult.error<number>(e as Error)
        }
    }

    protected validateArgs: FunctionArgsValidator = (validator: PipelineValidator, args: IFunctionArg<any>[], onSuccess: () => void, onFailure: (_: ValidationError[]) => void) => {
        
        const validationResult = validator([
            CommonValidators.ARG_LENGTH(2),
            CommonValidators.ARG_TYPES(is(Types.NUMBER), is(Types.NUMBER))
        ]).validate()

        if(validationResult) return onFailure(validationResult)
        else return onSuccess();
    };
}
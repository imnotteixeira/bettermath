import type { Index } from "parsimmon";
import { IBaseType, Types, ValueResolvingResult } from "../../definitions";
import { ValidationError } from "../validator";
import { FunctionArgsValidator, FunctionType, IFunctionArg } from "../types";
import { CommonValidators, PipelineValidator } from "../validator/pipeline";
import { is } from "../validator/argTypeValidator";
import { resolveValuesOnlyNumbers } from "../util";

export class NegateFunction extends FunctionType<number> {
    readonly returnType = Types.NUMBER;
    
    constructor(indexInfo: Index, args: IFunctionArg<any>[]) {
        super(indexInfo, "Negate", args);
    }


    getValue = (dependencyValueMap: Map<string, any>) => {
        try {
            const resolvedValues = resolveValuesOnlyNumbers([this.args[0].getValue(dependencyValueMap)])
            return ValueResolvingResult.success(-resolvedValues[0]);
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

    toString = () => `NegateFunction(${this.args.map(arg => arg.toString()).join(",")})`;
}

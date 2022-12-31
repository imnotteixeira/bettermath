import type { Index } from "parsimmon";
import { Types } from "../../definitions";
import { ValidationError } from "../validator";
import { FunctionArgsValidator, FunctionType, IFunctionArg } from "../types";
import { CommonValidators, PipelineValidator } from "../validator/pipeline";

export class NegateFunction extends FunctionType<number> {
    readonly returnType = Types.NUMBER;
    
    constructor(indexInfo: Index, args: IFunctionArg<any>[]) {
        super(indexInfo, "Negate", args);
    }

    getValue = () => -this.args[0].getValue();

    validateArgs: FunctionArgsValidator = (validator: PipelineValidator, args: IFunctionArg<any>[], onSuccess: () => void, onFailure: (errors: ValidationError[]) => void) => {
        
        const validationResult = validator([
            CommonValidators.ARG_LENGTH(1),
            CommonValidators.ARG_TYPES(Types.NUMBER)
        ]).validate()

        if(validationResult) return onFailure(validationResult)
        else return onSuccess();
    };
}

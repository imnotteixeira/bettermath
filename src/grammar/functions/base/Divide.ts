import type { Index } from "parsimmon";
import { Types } from "../../definitions";
import { FunctionArgsValidator, FunctionType, IFunctionArg } from "../types";
import { ValidationError } from "../validator";
import { CommonValidators, PipelineValidator } from "../validator/pipeline";

export class DivideFunction extends FunctionType<number> {
    readonly returnType = Types.NUMBER;
    
    constructor(indexInfo: Index, args: IFunctionArg<any>[]) {
        super(indexInfo, "Divide", args);
    }

    getValue = () => this.args[0].getValue() / this.args[1].getValue();

    protected validateArgs: FunctionArgsValidator = (validator: PipelineValidator, args: IFunctionArg<any>[], onSuccess: () => void, onFailure: (_: ValidationError[]) => void) => {
        
        const validationResult = validator([
            CommonValidators.ARG_LENGTH(2),
            CommonValidators.ARG_TYPES(Types.NUMBER, Types.NUMBER)
        ]).validate()

        if(validationResult) return onFailure(validationResult)
        else return onSuccess();
    };
}
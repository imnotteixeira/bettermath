import type { Index } from "parsimmon";
import { Types } from "../../definitions";
import { ValidationError } from "../validator";
import { FunctionArgsValidator, FunctionType, IFunctionArg } from "../types";
import { CommonValidators, PipelineValidator } from "../validator/pipeline";
import { is } from "../validator/argTypeValidator";

export class AddFunction extends FunctionType<number> {
    readonly returnType = Types.NUMBER;

    constructor(indexInfo: Index, args: IFunctionArg<any>[]) {
        super(indexInfo, "Add", args);
    }

    getValue = () => this.args[0].getValue() + this.args[1].getValue();

    protected validateArgs: FunctionArgsValidator = (validator: PipelineValidator, args: IFunctionArg<any>[], onSuccess: () => void, onFailure: (_: ValidationError[]) => void) => {
        
        const validationResult = validator([
            CommonValidators.ARG_LENGTH(2),
            CommonValidators.ARG_TYPES(is(Types.NUMBER), is(Types.NUMBER))
        ]).validate()

        if(validationResult) return onFailure(validationResult)
        else return onSuccess();
    };
}
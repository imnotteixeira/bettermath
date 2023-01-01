import { Index } from "parsimmon";
import { Types } from "../../definitions";
import { FunctionArgsValidator, FunctionType, IFunctionArg } from "../types";
import { ValidationError } from "../validator";
import { CommonValidators, PipelineValidator } from "../validator/pipeline";

export class FactorialFunction extends FunctionType<number> {
    readonly returnType = Types.NUMBER;
    
    constructor(indexInfo: Index, args: IFunctionArg<any>[]) {
        super(indexInfo, "Factorial", args);
    }

    getValue = () => this.calculateFactorial(this.args[0].getValue());

    validateArgs: FunctionArgsValidator = (validator: PipelineValidator, args: IFunctionArg<any>[], onSuccess: () => void, onFailure: (errors: ValidationError[]) => void) => {
        
        const validationResult = validator([
            CommonValidators.ARG_LENGTH(1),
            CommonValidators.ARG_TYPES(Types.NUMBER)
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
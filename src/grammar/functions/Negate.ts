import type { Index } from "parsimmon";
import { ValidationError } from "../inputValidation";
import { FunctionArgsValidator, FunctionType, IFunctionArg } from "./types";

export class NegateFunction extends FunctionType<number> {
    constructor(args: IFunctionArg<any>[], indexInfo: Index) {
        super("Negate", [args[0]], indexInfo);
    }

    getValue = () => -this.args[0].getValue();

    validateArgs: FunctionArgsValidator = (args: IFunctionArg<any>[], onSuccess: () => void, onFailure: (errors: ValidationError[]) => void) => {
        const argErrors: ValidationError[] = [];
        args.forEach((arg) => {
            if (arg.type !== "number")
                argErrors.push({
                    index: this.indexInfo,
                    message: `Argument of type ${arg.type} is not supported. Argument must be a number`,
                });
        });

        if (argErrors.length) return onFailure(argErrors);
        else return onSuccess();
    };
}
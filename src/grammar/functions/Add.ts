import type { Index } from "parsimmon";
import { ValidationError } from "../inputValidation";
import { FunctionArgsValidator, FunctionType, IFunctionArg } from "./types";

export class AddFunction extends FunctionType<number> {
    constructor(args: IFunctionArg<any>[], indexInfo: Index) {
        super("Add", [args[0], args[1]], indexInfo);
    }

    getValue = () => this.args[0].getValue() + this.args[1].getValue();

    protected validateArgs: FunctionArgsValidator = (args: IFunctionArg<any>[], onSuccess: () => void, onFailure: (_: ValidationError[]) => void) => {
        const argErrors: ValidationError[] = [];
        args.forEach((arg: any, i: number) => {
            if (arg.type !== "number")
                argErrors.push({
                    index: this.indexInfo,
                    message: `Argument of type ${arg.type} is not supported on Add function. Arguments must be of number type`,
                });
        });

        if (argErrors.length) return onFailure(argErrors);
        else return onSuccess();
    };
}
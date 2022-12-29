import type { Index } from "parsimmon";
import { BaseType, Types } from "../definitions";
import { ValidationError } from "../validator";
import { FunctionArgsValidator, FunctionType, IFunction, IFunctionArg } from "./types";

export class NegateFunction extends FunctionType<number> {
    readonly returnType = Types.NUMBER;
    
    constructor(indexInfo: Index, args: IFunctionArg<any>[]) {
        super(indexInfo, "Negate", [args[0]], );
    }

    getValue = () => -this.args[0].getValue();

    validateArgs: FunctionArgsValidator = (args: IFunctionArg<any>[], onSuccess: () => void, onFailure: (errors: ValidationError[]) => void) => {
        const argErrors: ValidationError[] = [];
        args.forEach((arg: BaseType<any>, i: number) => {
            console.log("arg is ", arg.getValue(), "index info is", arg.indexInfo)

            if(arg.type === Types.NUMBER
                || (arg.type === Types.FUNCTION && (arg as IFunction<any>).returnType === Types.NUMBER)
            ) {
                return onSuccess();
            }

            const message = arg.type === Types.STRING ? `Argument of type 'string' is not supported. Argument must be a number` : 
                `${(arg as IFunction<any>).fn} function returns a ${(arg as IFunction<any>).returnType}, which is not supported on Add function. Argument must be a number`
            argErrors.push({
                index: arg.indexInfo,
                message
            });
        });

        if (argErrors.length) return onFailure(argErrors);
        else return onSuccess();
    };
}
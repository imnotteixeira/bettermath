import type { Index } from "parsimmon";
import { BaseType, Types } from "../definitions";
import { ValidationError } from "../validator";
import { FunctionArgsValidator, FunctionType, IFunction, IFunctionArg } from "./types";

export class AddFunction extends FunctionType<number> {
    readonly returnType = Types.NUMBER;

    constructor(indexInfo: Index, args: IFunctionArg<any>[]) {
        super(indexInfo, "Add", args);
    }

    getValue = () => this.args[0].getValue() + this.args[1].getValue();

    protected validateArgs: FunctionArgsValidator = (args: IFunctionArg<any>[], onSuccess: () => void, onFailure: (_: ValidationError[]) => void) => {
        if(args.length !== 2) {
            return onFailure([{
                index: this.indexInfo,
                message: `Add function takes exactly 2 arguments. ${args.length} received instead.`
            }])
        }
        const argErrors: ValidationError[] = [];
        args.forEach((arg: BaseType<any>, i: number) => {

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
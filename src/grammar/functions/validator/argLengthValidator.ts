import type P from "parsimmon"

import { ValidationError } from ".";
import { IFunctionArg } from "../types";
import { FunctionValidatorBuilder } from "./pipeline";

const argLengthValidator: FunctionValidatorBuilder<[number]> = (length: number) => (fnName: string, args: IFunctionArg<any>[], indexInfo: P.Index, next: (_?: ValidationError[]) => void) => {
    if(args.length !== length) {
        return next([{
            index: indexInfo,
            message: `${fnName} function takes exactly ${length} argument${length !== 1 ? "s":""}. ${args.length} received instead.`
        }])
    }

    return next()
}

export default argLengthValidator;
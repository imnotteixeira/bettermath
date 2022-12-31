import type P from "parsimmon"
import { ValidationError } from ".";
import { Types } from "../../definitions";
import { IFunction, IFunctionArg } from "../types";
import { FunctionValidatorBuilder } from "./pipeline";

export type ArgTypeDefinition = Types | [Types];

const argTypeValidator: FunctionValidatorBuilder<ArgTypeDefinition[]> = (...argTypes: ArgTypeDefinition[]) => (fnName: string, args: IFunctionArg<any>[], indexInfo: P.Index, next: (_?: ValidationError[]) => void) => {
    
    const getActualArgType = (arg: IFunctionArg<any>) => 
        (arg.type === Types.STRING || arg.type === Types.NUMBER) ? arg.type : (arg as IFunction<any>).returnType;
    
    const buildErrorMessage = (actualArg: IFunctionArg<any>, expectedArgType: Types) => 
        `Argument of type '${getActualArgType(actualArg)}' ${actualArg.type === Types.FUNCTION ? `(returned from ${(actualArg as IFunction<any>).fn}) ` : ""}is not valid. Argument must be a '${expectedArgType}'.`

    argTypes.forEach((expectedArgType, i) => {
        
        // Handle "varargs" rule (e.g. all the args from here on out are from this type)
        if(Array.isArray(expectedArgType)) {
            if(argTypes[i + 1]) throw new Error("Array format for arg type validation must only be used at the end (for vararg validation)")

            for (const remainingArg of args.slice(i)) {
                const actualArgType = getActualArgType(remainingArg)

                if(actualArgType !== expectedArgType[0]) {
                    return next([{
                        index: remainingArg.indexInfo,
                        message: buildErrorMessage(remainingArg, expectedArgType[0])
                    }])
                }
                
            }
            return next()
        } else {
            const actualArgType = getActualArgType(args[i])
            if(actualArgType !== expectedArgType) {
                return next([{
                    index: args[i].indexInfo,
                    message: buildErrorMessage(args[i], expectedArgType)
                }])
            }
        }
    })
    
    return next();
}

export default argTypeValidator;
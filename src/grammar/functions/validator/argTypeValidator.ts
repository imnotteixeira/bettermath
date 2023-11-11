import type P from "parsimmon"
import { ValidationError } from ".";
import { Types } from "../../definitions";
import { IFunction, IFunctionArg } from "../types";
import { FunctionValidatorBuilder } from "./pipeline";

export type ArgTypeDefinition = ArgType | [ArgType];

type ExpectedArgEvaluator = (actualType: Types) => boolean;
export interface ArgType {
    isValid: ExpectedArgEvaluator;
    name: string;
}

class SimpleArgType implements ArgType {
    allowedTypes: Types[];
    name: string;

    constructor(allowedType: Types) {
        this.name = allowedType;
        this.allowedTypes = [allowedType];
    }

    isValid: ExpectedArgEvaluator = (actualType: Types) => {
        return actualType === this.allowedTypes[0];
    }
}
abstract class ComposedArgType implements ArgType {
    allowedTypes: ArgType[];
    abstract isValid: ExpectedArgEvaluator;
    name: string;

    constructor(name: string, allowedTypes: ArgType[]) {
        this.name = name;
        this.allowedTypes = allowedTypes;
    }
}

class Either extends ComposedArgType {
    constructor(allowedTypes: ArgType[]) {
        super(`Either(${allowedTypes.map(t => t.name).join(", ")})`, allowedTypes)
    }

    isValid: ExpectedArgEvaluator = (actualType: Types) => {
        return this.allowedTypes.some(expectedType => expectedType.isValid(actualType))
    }
}

export const is = (type: Types) => new SimpleArgType(type)
export const either = (...types: ArgType[]) => new Either(types)

const argTypeValidator: FunctionValidatorBuilder<ArgTypeDefinition[]> = (...argTypes: ArgTypeDefinition[]) => (fnName: string, args: IFunctionArg<any>[], indexInfo: P.Index, next: (_?: ValidationError[]) => void) => {
    
    const getActualArgType = (arg: IFunctionArg<any>) => arg.type === Types.FUNCTION ? (arg as IFunction<any>).returnType : arg.type
    
    const buildErrorMessage = (actualArg: IFunctionArg<any>, expectedArgType: ArgType) => 
        `Argument of type '${getActualArgType(actualArg)}' ${actualArg.type === Types.FUNCTION ? `(returned from ${(actualArg as IFunction<any>).fn}) ` : ""}is not valid. Argument must be '${expectedArgType.name}'.`

    argTypes.forEach((expectedArgType, i) => {
        
        // Handle "varargs" rule (e.g. all the args from here on out are from this type)
        if(Array.isArray(expectedArgType)) {
            if(argTypes[i + 1]) throw new Error("Array format for arg type validation must only be used at the end (for vararg validation)")

            for (const remainingArg of args.slice(i)) {
                const actualArgType = getActualArgType(remainingArg)

                if (!expectedArgType[0].isValid(actualArgType)) {
                    return next([{
                        index: remainingArg.indexInfo,
                        message: buildErrorMessage(remainingArg, expectedArgType[0])
                    }])
                }
                
            }
            return next()
        } else {
            const actualArgType = getActualArgType(args[i])
            if(!expectedArgType.isValid(actualArgType)) {
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